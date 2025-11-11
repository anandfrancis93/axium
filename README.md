# Axium - Intelligent Adaptive Learning Platform

A personalized AI learning platform that uses reinforcement learning, Bloom's Taxonomy, and knowledge dimensions to create adaptive learning paths. Built with Next.js, Supabase, and Claude AI.

## 🚀 Current Status

**Fully operational MVP** with advanced RL-based adaptive learning, comprehensive performance tracking, AI-powered question generation, and intelligent explanation system.

## ✨ Key Features

### 🎯 Adaptive Learning Engine
- **Thompson Sampling (Multi-Armed Bandit)**: Optimizes topic and Bloom level selection based on learning potential
- **Progressive Bloom Unlocking**: Master Level N to unlock Level N+1
- **6 Knowledge Dimensions**: Orthogonal learning perspectives (Definition, Example, Comparison, Scenario, Implementation, Troubleshooting)
- **6 RL Phases**: Tracks learning journey from Cold Start → Meta-Learning
- **Multi-Component Reward System**: Learning Gain, Calibration, Recognition, Spacing, Engagement
- **Hierarchical Topic Structure**: Parent-child topic relationships with depth tracking

### 🧠 Cognitive Framework
- **Bloom's Taxonomy (6 Levels)**: Remember → Understand → Apply → Analyze → Evaluate → Create
- **Exponential Moving Average (EMA)**: Confidence-weighted mastery calculation
- **Confidence Calibration**: Detects overconfidence/underconfidence patterns
- **Recognition Method Tracking**: Memory vs. Recognition vs. Educated Guess vs. Random
- **Dimension-Specific Targeting**: Each dimension tests different learning perspectives
- **10 Question Formats**: MCQ single/multi, true/false, fill-in-blank, matching, open-ended, etc.

### 🤖 AI-Powered Features
- **Claude Sonnet 4.5**: State-of-the-art AI for question generation and explanations
- **RAG (Retrieval-Augmented Generation)**: Semantic search using OpenAI embeddings (text-embedding-3-small) over uploaded PDFs
- **Dimension-Aware Question Generation**: Questions target specific knowledge dimensions at specific Bloom levels
- **Interactive AI Explanations**: Select any text and get instant AI explanations with follow-up chat
- **Multiple Choice Questions**: With AI-generated distractors and explanations
- **User-Specific Question Banks**: Each user gets their own generated questions for spaced repetition
- **No Ephemeral Questions**: All questions stored in database with user_id and topic_id

### 📊 Performance Analytics
- **Mastery Heatmaps**: Per-topic Bloom level progress visualization
- **Comprehensive Mastery Matrix**: Bloom × Dimension performance tracking (36 cells per topic)
- **Recent Activity Feeds**: Detailed response history with context
- **RL Phase Indicators**: Visual progression through learning phases with badges
- **Dimension Coverage**: Track exploration across 6 knowledge dimensions
- **Unique Question Tracking**: Separate counts for unique questions vs. total attempts
- **Reset Progress**: Complete data cleanup with pre-deletion counts
- **System Transparency**: Audit page showing all RL algorithms, reward calculations, and decision-making logic

### 🎨 User Experience
- **Neumorphic Dark Theme**: Custom design system with raised/inset elements
- **4-Step Learning Flow**: Confidence → Answer → Recognition → Feedback
- **Contextual Tooltips**: Dynamic explanations for all metrics and values
- **Collapsible Accordion Sections**: Minimal cognitive load with progressive disclosure (only one section expanded at a time)
- **Mobile Responsive**: Fluid scaling from 320px to 4K displays
- **Custom Modals**: Neumorphic confirmation and success dialogs
- **Draggable & Resizable AI Chat**: Explanation modal can be moved and resized to see content behind it
- **Progressive Information Disclosure**: Helper text in tooltips to reduce visual clutter

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 16 with Turbopack (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Neumorphic Design System
- **Database**: Supabase (PostgreSQL + pgvector for vector similarity search)
- **Auth**: Supabase Auth with Google SSO
- **AI Model**: Claude Sonnet 4.5 (Anthropic) for question generation and explanations
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Vector Search**: pgvector with cosine similarity
- **Deployment**: Vercel
- **Markdown Rendering**: ReactMarkdown with KaTeX for math support

### Data Model

```
subjects
├── chapters[]
│   ├── topics[] (hierarchical with parent_topic_id)
│   │   ├── name, description
│   │   ├── parent_topic_id, depth, path
│   │   ├── embedding (vector for topic similarity)
│   │   └── knowledge dimensions (6)
│   └── subject_dimension_config
│
user_progress
├── current_bloom_level (1-6)
├── mastery_scores{1-6} (EMA-based)
├── rl_phase (cold_start → meta_learning)
├── total_attempts, mastery_variance
├── confidence_calibration_error
└── rl_metadata (format performance, preferences)

user_topic_mastery (by topic_id)
├── user_id, topic_id, bloom_level
├── mastery_score (0-100, EMA)
├── questions_attempted, questions_correct
└── last_practiced_at

user_dimension_coverage
├── user_id, chapter_id, topic_id
├── bloom_level × dimension
├── unique_questions_answered[] (UUIDs)
├── times_tested, total_attempts
└── average_score (0-100)

rl_arm_stats (Thompson Sampling)
├── user_id, topic_id, bloom_level
├── successes, failures (Beta distribution)
└── last_selected_at

learning_sessions
├── user_id, chapter_id, subject_id
├── questions_answered, score, total_questions
└── completed_at

user_responses
├── user_id, question_id, session_id
├── topic_id, bloom_level, dimension
├── is_correct, confidence (1-5)
├── recognition_method
└── reward (multi-component)

questions (all stored, no ephemeral)
├── user_id (owner), topic_id
├── bloom_level, dimension
├── question_format (mcq_single, mcq_multi, etc.)
├── question_text, options[], question_type
├── correct_answer, explanation
├── source_type ('ai_generated_realtime')
└── generated via Claude Sonnet 4.5 + RAG

knowledge_chunks (RAG pipeline)
├── chapter_id, content, embedding
├── source_file_name, page_number
└── chunk_index
```

### Learning Flow

```
1. Thompson Sampling selects optimal (topic_id, bloom_level) arm
2. Check prerequisites and unlock status
3. RAG retrieves relevant chunks using vector similarity (pgvector)
4. Claude Sonnet 4.5 generates dimension-specific question
5. Question stored with user_id and topic_id for spaced repetition
6. User selects confidence level (1-5)
7. User answers question (MCQ single/multi select, or other formats)
8. User indicates recognition method
9. System calculates multi-component reward:
   - Learning Gain (-10 to +10)
   - Calibration (-5 to +5)
   - Recognition (-3 to +5)
   - Spacing (0 to +5)
   - Engagement (-3 to 0)
10. Update mastery scores (EMA with confidence weighting)
11. Update Thompson Sampling statistics (Beta distribution)
12. Track dimension coverage with unique question IDs
13. Update RL phase based on attempts and variance
14. Check Bloom level unlock conditions
15. Repeat with improved arm selection
```

### RAG Pipeline

```
Document Upload → PDF Parsing → Chunking → Embedding Generation → Vector Storage
                                                                           ↓
Question Request → Topic Embedding → Similarity Search → Context Retrieval → Claude Generation
```

**Custom RAG Implementation:**
- **Chunking**: Fixed 1000-char chunks with paragraph boundary respect
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Storage**: Supabase pgvector with cosine similarity (`<=>` operator)
- **Retrieval**: Top 5 chunks with 0.1 similarity threshold
- **Advantages**: Full control, transparency, Claude integration, data ownership
- **vs. Google File Search**: More control and flexibility, better for educational content

## 📁 Project Structure

```
axium/
├── app/
│   ├── admin/                    # Admin UI for content management
│   │   ├── page.tsx              # Admin dashboard
│   │   └── AdminContent.tsx      # Collapsible content sections
│   ├── audit/                    # System transparency page
│   │   └── page.tsx              # RL algorithms, rewards, decisions
│   ├── subjects/[subject]/[chapter]/
│   │   └── quiz/                # 4-step learning interface with AI chat
│   ├── performance/[subject]/[chapter]/
│   │   ├── page.tsx             # Chapter performance analytics
│   │   └── [topic]/page.tsx     # Topic dimension matrix (6×6)
│   ├── api/
│   │   ├── ai/
│   │   │   └── explain/         # Claude AI explanation endpoint
│   │   ├── rl/
│   │   │   ├── next-question/   # Thompson Sampling + question generation
│   │   │   ├── submit-response/ # Reward calculation + mastery updates
│   │   │   └── reset-progress/  # Delete all user progress data
│   │   ├── questions/
│   │   │   └── generate/        # Bulk question generation
│   │   └── documents/
│   │       └── upload/          # PDF upload and RAG processing
│   └── layout.tsx               # Root layout with auth
│
├── lib/
│   ├── supabase/                # Client/server utilities
│   ├── rl/
│   │   ├── rewards.ts           # Multi-component reward system
│   │   ├── mastery.ts           # EMA mastery calculation
│   │   └── thompson-sampling.ts # Arm selection logic
│   ├── utils/
│   │   ├── rl-phase.ts          # RL phase tracking (6 phases)
│   │   └── question-format.ts   # Question type handling (10 formats)
│   └── types/
│       └── database.ts          # TypeScript types
│
├── components/
│   ├── HamburgerMenu.tsx        # Navigation
│   ├── Modal.tsx                # Custom neumorphic modal
│   ├── Tooltip.tsx              # Tooltip with cursor tracking
│   ├── RLPhaseBadge.tsx         # RL phase indicator with colors
│   ├── QuestionFormatBadge.tsx  # Question format indicator
│   ├── ExplanationModal.tsx     # Draggable AI chat interface
│   └── icons.tsx                # SVG icon library (NO EMOJIS)
│
├── supabase/
│   ├── schema.sql               # Complete database schema
│   ├── match-knowledge-chunks.sql # Vector similarity search function
│   └── migrations/              # Incremental migrations
│       ├── 20250107_*.sql       # Topic_id migration, dimensions update
│       ├── 20250108_*.sql       # Topic hierarchy support
│       └── 20250109_*.sql       # Topic embeddings, similarity search
│
├── scripts/
│   ├── extract-all-topics.mjs   # Topic extraction from PDFs
│   ├── generate-knowledge.mjs   # Knowledge base generation
│   └── generate-topic-embeddings.mjs # Topic embedding generation
│
├── docs/
│   ├── KNOWLEDGE_GRAPH.md       # Knowledge graph documentation
│   ├── RL_PHASE_TRACKING.md     # RL phase system details
│   └── QUESTION_FORMAT_PERSONALIZATION.md # Format optimization
│
├── CLAUDE.md                    # Development guidelines (CRITICAL)
├── TODO.md                      # Development task tracker
└── README.md                    # This file
```

## 🎓 Key Concepts

### Thompson Sampling (Multi-Armed Bandit)
Each (topic_id, bloom_level) combination is an "arm" in a multi-armed bandit. The system maintains Beta distributions for each arm and samples to balance exploration (trying new topics) vs. exploitation (focusing on high-reward topics). Uses `topic_id` (UUID) for precise tracking across hierarchical topics.

### Multi-Component Rewards
- **Learning Gain**: Mastery improvement (primary signal)
- **Calibration**: Confidence vs. performance alignment
- **Recognition**: Retrieval strength (memory > recognition > guess)
- **Spacing**: Retention over time (rewards long gaps)
- **Engagement**: Difficulty appropriateness (penalty only)

### Knowledge Dimensions (6)
1. **Definition** - What is it? Core terminology, fundamental concepts, and definitions
2. **Example** - How is it used? Real-world instances, practical applications, and use cases
3. **Comparison** - How is it different? Similarities, differences, and relationships between concepts
4. **Scenario** - What should you do? Situational problem-solving and decision-making
5. **Implementation** - How do you configure it? Step-by-step procedures, setup, and configuration
6. **Troubleshooting** - Why isn't it working? Diagnostic reasoning, problem identification, and solutions

Each dimension tests a different learning perspective at each Bloom level, creating a 6×6 = 36 cell mastery matrix per topic.

### RL Learning Phases (6)
1. **Cold Start** (< 10 attempts): Random exploration, gathering initial data
2. **Exploration** (10-50): Testing different strategies, finding what works
3. **Optimization** (50-150): Focusing on high-value actions, refining approach
4. **Stabilization** (150+, low variance): Stable, consistent performance, converged policy
5. **Adaptation** (150+, changing): Responding to performance changes, continuous adjustment
6. **Meta-Learning** (500+, excellent): Learning how to learn, self-optimization

Phases are automatically calculated based on `total_attempts`, `mastery_variance`, and `confidence_calibration_error`.

### Question Format Personalization (10 Formats)
1. **True/False** - Quick recall (Bloom 1-2)
2. **MCQ Single** - One correct answer (Bloom 1-2)
3. **MCQ Multi** - Multiple correct answers (Bloom 2-4)
4. **Fill in Blank** - Term completion (Bloom 1-3)
5. **Matching** - Relationships (Bloom 2-3)
6. **Open Ended** - Essay/analysis (Bloom 4-6)
7. **Code Trace** - Follow execution (Bloom 3-4)
8. **Code Complete** - Fill missing code (Bloom 3-4)
9. **Ordering** - Sequence steps (Bloom 2-3)
10. **Diagram Label** - Visual identification (Bloom 1-2)

System tracks format effectiveness and adapts to user preferences (stored in `rl_metadata`).

## 📈 Performance Tracking

### Chapter Performance Page (`/performance/[subject]/[chapter]`)
- Overall statistics (total attempts, average mastery, Bloom distribution)
- Mastery heatmap (topic × Bloom level)
- Recent activity with contextual information
- Exam prediction analytics
- Reset progress with pre-deletion counts
- Collapsible accordion sections (only one expanded at time)

### Topic Performance Page (`/performance/[subject]/[chapter]/[topic]`)
- RL phase badge with tooltip
- Comprehensive mastery matrix (6 Bloom levels × 6 dimensions = 36 cells)
- Cell colors: not tested (gray), struggling (red), developing (yellow), proficient (blue), mastered (green)
- Unique questions answered vs. total attempts tracking
- Per-dimension statistics
- Progress by Bloom level breakdown
- Lock icons for locked levels
- Danger zone for resetting topic progress

### Audit Page (`/audit`)
Complete transparency into system decision-making:
- Thompson Sampling algorithm explanation
- Multi-component reward system breakdown
- Mastery calculation (EMA) details
- RL phase tracking logic
- Bloom level unlock conditions
- Question selection process
- All formulas and thresholds visible

## 🤖 AI Explanation System

### "Explain with AI" Feature
- **Select any text** in question/explanation and get instant AI explanation
- **Claude Sonnet 4.5** provides contextual, educational responses
- **Chat interface** allows follow-up questions
- **Draggable & resizable modal** to see content behind it
- **Markdown rendering** with KaTeX math support
- **Bullet point format** for clarity and scannability
- **Context-aware** using full explanation text for better answers
- **Conversation history** maintained across follow-ups

### System Prompt Strategy
```
Use markdown bullet points to answer the question. Format lists with hyphens like this:
- First point
- Second point
- Third point

Do NOT use bullet point characters (•). Always use hyphens (-) or asterisks (*) for lists.
```

Simple, effective approach that ensures proper rendering in ReactMarkdown.

## 🔧 Reset Progress Feature

The reset progress feature allows users to delete all learning data for a specific chapter or topic:

**Data Deleted:**
1. User Responses (all answers submitted)
2. Learning Sessions (session records)
3. Mastery Records (topic mastery scores)
4. Arm Stats (Thompson Sampling data)
5. Dimension Coverage (dimension tracking)
6. Generated Questions (user's AI-generated questions)

**Pre-Deletion Counts:**
- Shows exact counts before deletion in confirmation modal
- Uses inner joins to avoid URL length limits with many topics
- Questions counted by user_id to show only user's questions

**Implementation:**
- Custom neumorphic modals (no browser alerts)
- Atomic transactions for data integrity
- Detailed logging for debugging

## 🎨 Design System

### Neumorphic Dark Theme
- **Background**: `#0a0a0a` (very dark)
- **Shadows**: Dual shadows (light `#2a2a2a` + dark `#000000`) create depth
- **No card nesting**: Flat design with elements directly on background
- **Elevation levels**: 3 levels with progressively softer shadows
- **Colors**: Blue (primary), Green (success), Yellow (warning), Red (error)
- **Typography**: 3-level max hierarchy (title, section, body)
- **Icons**: SVG only, NO EMOJIS

### UI Patterns
- **Accordion behavior**: Only one section expanded at a time
- **Tooltips**: Progressive disclosure for helper text
- **Generous spacing**: `gap-6`, `p-6/8`, `mb-6/8` (no cramped layouts)
- **Responsive grid**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Buttons**: Always `neuro-btn` with colored text (NO colored backgrounds)
- **Form controls**: Always `neuro-input` for consistency

## 🚧 Known Limitations

- Response time not yet tracked or rewarded
- Engagement component not displayed in UI (calculated but hidden)
- Prior exposure tracking exists but not yet used in rewards
- No answer revision tracking
- No hint system
- Question format personalization tracking implemented but not fully used in RL
- Open-ended questions need AI grading implementation

## 🔮 Future Enhancements

### High Priority
1. **Spaced Repetition Scheduler**: Optimize question timing based on forgetting curves
2. **Transfer Learning Bonus**: Reward multi-topic question success
3. **Answer Revision Tracking**: Capture self-correction patterns
4. **Response Time Integration**: Fluency bonus for L1-L2 only
5. **Full Question Format Optimization**: Use format effectiveness in Thompson Sampling

### Medium Priority
- Difficulty gap optimization (better than binary engagement)
- Prerequisite violation detection
- Interleaving vs. blocking rewards
- Sleep/consolidation bonuses
- Distractor analysis for misconception detection
- Open-ended questions with AI grading (Claude evaluation)

### Long-Term
- Hint system with scaffolded support
- Multi-user collaboration features
- Learning analytics dashboard for instructors
- Mobile app (React Native)
- Adaptive difficulty within Bloom levels
- Peer comparison (anonymous)
- Knowledge graph visualization
- Topic similarity-based recommendations

## 🛠️ Development

### Environment Variables Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
ANTHROPIC_API_KEY=        # Claude Sonnet 4.5
OPENAI_API_KEY=           # Embeddings

# Optional
GEMINI_API_KEY=           # If using Gemini
NEXT_PUBLIC_GEMINI_API_KEY=
```

### Setup Instructions
See `QUICKSTART.md` and `ENV_SETUP.md` for detailed setup instructions.

### Development Guidelines
**READ `CLAUDE.md` BEFORE CODING** - Contains critical patterns, best practices, and architectural decisions.

## 📝 Contributing

This is currently a personal project. For suggestions or issues, please open a GitHub issue.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by Claude Sonnet 4.5 (Anthropic)
- Database & Auth by Supabase
- Embeddings by OpenAI
- Deployed on Vercel
- Icons from Lucide React (via custom SVG components)

---

**Status**: Production-ready MVP with advanced RL features, hierarchical topic support, and AI-powered explanations.

**Last Updated**: January 2025
