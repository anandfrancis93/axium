-- Axium Database Schema
-- Intelligent Self-Learning App with Subject → Chapter → Topic → Bloom Level hierarchy

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Recognition method: How the user arrived at their answer (metacognition)
CREATE TYPE recognition_method AS ENUM (
  'memory',          -- Recalled from memory
  'recognition',     -- Recognized from options
  'educated_guess',  -- Made an educated guess
  'random_guess'     -- Made a random guess
);

-- ============================================================================
-- SUBJECTS TABLE
-- ============================================================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CHAPTERS TABLE
-- ============================================================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  -- Prerequisites: array of chapter IDs that must be mastered first
  prerequisites UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, name),
  UNIQUE(subject_id, slug)
);

-- Index for faster queries
CREATE INDEX idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX idx_chapters_sequence ON chapters(subject_id, sequence_order);

-- ============================================================================
-- TOPICS TABLE
-- ============================================================================
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  -- Prerequisites: array of topic IDs that must be mastered first
  prerequisites UUID[] DEFAULT '{}',
  -- Bloom levels available for this topic (default: all 6 levels)
  available_bloom_levels INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chapter_id, name)
);

-- Indexes
CREATE INDEX idx_topics_chapter_id ON topics(chapter_id);
CREATE INDEX idx_topics_sequence ON topics(chapter_id, sequence_order);

-- ============================================================================
-- USER PROGRESS TABLE
-- Tracks progress at TOPIC × BLOOM LEVEL granularity
-- ============================================================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,

  -- Current Bloom level the user is working on (1-6)
  current_bloom_level INTEGER NOT NULL DEFAULT 1 CHECK (current_bloom_level BETWEEN 1 AND 6),

  -- Mastery scores per Bloom level per Format (0-100) - TRACK 2 (Student Display)
  -- Example: {"1": {"mcq_single": 85, "open_ended": 70}, "2": {"mcq_single": 78}}
  mastery_scores JSONB DEFAULT '{}',

  -- Total attempts across all Bloom levels
  total_attempts INTEGER DEFAULT 0,

  -- Correct answers count
  correct_answers INTEGER DEFAULT 0,

  -- Average confidence (1-3 scale)
  avg_confidence DECIMAL(3,2) DEFAULT 0.0,

  -- Average response time in seconds
  avg_response_time_seconds DECIMAL(8,2) DEFAULT 0.0,

  -- ============ TRACK 1: CALIBRATION (RL System - Format Independent) ============
  -- Calibration score statistics
  calibration_mean DECIMAL(4,2) DEFAULT 0.0,           -- Average calibration score (-1.5 to +1.5)
  calibration_stddev DECIMAL(4,2) DEFAULT 0.0,         -- Standard deviation (consistency)
  calibration_slope DECIMAL(6,4) DEFAULT 0.0,          -- Linear regression slope (improvement rate)
  calibration_r_squared DECIMAL(3,2) DEFAULT 0.0,      -- Regression fit quality (0-1)
  questions_to_mastery INTEGER,                        -- Projected questions to reach mastery

  -- Last practiced timestamp
  last_practiced_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, topic_id)
);

-- Indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_topic_id ON user_progress(topic_id);
CREATE INDEX idx_user_progress_last_practiced ON user_progress(user_id, last_practiced_at DESC);

-- ============================================================================
-- KNOWLEDGE CHUNKS TABLE
-- Stores chunked content from uploaded documents for RAG
-- ============================================================================
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Associated with chapter (required)
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,

  -- Optionally associated with specific topic (more granular)
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,

  -- The actual text content
  content TEXT NOT NULL,

  -- Vector embedding for semantic search (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),

  -- Metadata
  source_file_name TEXT,
  page_number INTEGER,
  chunk_index INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_chunks_chapter_id ON knowledge_chunks(chapter_id);
CREATE INDEX idx_knowledge_chunks_topic_id ON knowledge_chunks(topic_id);

-- Vector similarity search index (using HNSW for performance)
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- QUESTIONS TABLE
-- Stores generated questions (optional caching)
-- ============================================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  bloom_level INTEGER NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),

  -- Question content
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'mcq', 'open_ended', 'fill_blank', 'analogy', etc.

  -- For MCQs: store options as JSON array
  options JSONB,

  -- Correct answer
  correct_answer TEXT NOT NULL,

  -- Explanation for the correct answer
  explanation TEXT,

  -- RAG context used to generate this question
  rag_context TEXT,

  -- Metadata
  difficulty_level TEXT, -- 'easy', 'medium', 'hard'

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  avg_correctness_rate DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_questions_topic_bloom ON questions(topic_id, bloom_level);

-- ============================================================================
-- USER RESPONSES TABLE
-- Records every answer submitted by users
-- ============================================================================
CREATE TABLE user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  bloom_level INTEGER NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),

  -- User's answer
  user_answer TEXT NOT NULL,

  -- Correctness (TRACK 2 - Student Display, Format Dependent)
  is_correct BOOLEAN NOT NULL,

  -- Question format
  question_format TEXT,  -- 'mcq_single', 'mcq_multi', 'true_false', 'fill_blank', 'matching', 'open_ended'

  -- User's self-reported confidence (1-3 scale: Low=1, Medium=2, High=3)
  confidence INTEGER CHECK (confidence IN (1, 2, 3)),

  -- How the user arrived at their answer (metacognition)
  recognition_method recognition_method,

  -- Time taken to answer (in seconds)
  time_taken_seconds DECIMAL(8,2),

  -- TRACK 1: Calibration Score (RL System - Format Independent)
  calibration_score DECIMAL(4,2),  -- -1.5 to +1.5

  -- Legacy: Total reward (deprecated, use calibration_score instead)
  reward DECIMAL(5,2),

  -- AI grading (for open-ended questions)
  ai_grade TEXT, -- 'excellent', 'good', 'partial', 'incorrect'
  ai_feedback TEXT,

  -- Session tracking
  session_id UUID,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_responses_user_id ON user_responses(user_id, created_at DESC);
CREATE INDEX idx_user_responses_topic_id ON user_responses(topic_id);
CREATE INDEX idx_user_responses_session_id ON user_responses(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- User Progress Policies
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- User Responses Policies
CREATE POLICY "Users can view their own responses"
  ON user_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON user_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access for subjects, chapters, topics, questions, knowledge_chunks
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view chapters"
  ON chapters FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view topics"
  ON topics FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view knowledge chunks"
  ON knowledge_chunks FOR SELECT
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_chunks_updated_at BEFORE UPDATE ON knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate mastery score for a topic
CREATE OR REPLACE FUNCTION calculate_topic_mastery(
  p_user_id UUID,
  p_topic_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  mastery_score DECIMAL;
BEGIN
  -- Average of all Bloom level mastery scores
  SELECT
    COALESCE(
      (
        CAST(mastery_scores->>'1' AS DECIMAL) +
        CAST(mastery_scores->>'2' AS DECIMAL) +
        CAST(mastery_scores->>'3' AS DECIMAL) +
        CAST(mastery_scores->>'4' AS DECIMAL) +
        CAST(mastery_scores->>'5' AS DECIMAL) +
        CAST(mastery_scores->>'6' AS DECIMAL)
      ) / 6.0,
      0
    )
  INTO mastery_score
  FROM user_progress
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  RETURN COALESCE(mastery_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  filter_chapter_id uuid DEFAULT NULL,
  filter_topic_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  chapter_id uuid,
  topic_id uuid,
  source_file_name text,
  page_number integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.chapter_id,
    kc.topic_id,
    kc.source_file_name,
    kc.page_number
  FROM knowledge_chunks kc
  WHERE
    (filter_chapter_id IS NULL OR kc.chapter_id = filter_chapter_id)
    AND (filter_topic_id IS NULL OR kc.topic_id = filter_topic_id)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
