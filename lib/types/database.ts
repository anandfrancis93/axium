export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          subject_id: string
          name: string
          description: string | null
          sequence_order: number
          prerequisites: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          name: string
          description?: string | null
          sequence_order?: number
          prerequisites?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          name?: string
          description?: string | null
          sequence_order?: number
          prerequisites?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          chapter_id: string
          name: string
          description: string | null
          sequence_order: number
          prerequisites: string[]
          available_bloom_levels: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          name: string
          description?: string | null
          sequence_order?: number
          prerequisites?: string[]
          available_bloom_levels?: number[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          name?: string
          description?: string | null
          sequence_order?: number
          prerequisites?: string[]
          available_bloom_levels?: number[]
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          current_bloom_level: number
          mastery_scores: Json
          total_attempts: number
          correct_answers: number
          dimension_coverage: Json
          last_practiced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          current_bloom_level?: number
          mastery_scores?: Json
          total_attempts?: number
          correct_answers?: number
          dimension_coverage?: Json
          last_practiced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          current_bloom_level?: number
          mastery_scores?: Json
          total_attempts?: number
          correct_answers?: number
          dimension_coverage?: Json
          last_practiced_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_chunks: {
        Row: {
          id: string
          chapter_id: string
          topic_id: string | null
          content: string
          embedding: number[] | null
          source_file_name: string | null
          page_number: number | null
          chunk_index: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          topic_id?: string | null
          content: string
          embedding?: number[] | null
          source_file_name?: string | null
          page_number?: number | null
          chunk_index?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          topic_id?: string | null
          content?: string
          embedding?: number[] | null
          source_file_name?: string | null
          page_number?: number | null
          chunk_index?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          topic_id: string
          bloom_level: number
          question_text: string
          question_type: string
          options: Json | null
          correct_answer: string
          explanation: string | null
          rag_context: string | null
          difficulty_level: string | null
          times_used: number
          avg_correctness_rate: number | null
          cognitive_dimension: 'WHAT' | 'WHY' | 'WHEN' | 'WHERE' | 'HOW' | 'CHARACTERISTICS' | null
          dimension_metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          bloom_level: number
          question_text: string
          question_type: string
          options?: Json | null
          correct_answer: string
          explanation?: string | null
          rag_context?: string | null
          difficulty_level?: string | null
          times_used?: number
          avg_correctness_rate?: number | null
          cognitive_dimension?: 'WHAT' | 'WHY' | 'WHEN' | 'WHERE' | 'HOW' | 'CHARACTERISTICS' | null
          dimension_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          bloom_level?: number
          question_text?: string
          question_type?: string
          options?: Json | null
          correct_answer?: string
          explanation?: string | null
          rag_context?: string | null
          difficulty_level?: string | null
          times_used?: number
          avg_correctness_rate?: number | null
          cognitive_dimension?: 'WHAT' | 'WHY' | 'WHEN' | 'WHERE' | 'HOW' | 'CHARACTERISTICS' | null
          dimension_metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_responses: {
        Row: {
          id: string
          user_id: string
          question_id: string
          topic_id: string
          bloom_level: number
          user_answer: string
          is_correct: boolean
          confidence: number | null
          time_taken_seconds: number | null
          reward: number | null
          ai_grade: string | null
          ai_feedback: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          topic_id: string
          bloom_level: number
          user_answer: string
          is_correct: boolean
          confidence?: number | null
          time_taken_seconds?: number | null
          reward?: number | null
          ai_grade?: string | null
          ai_feedback?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          topic_id?: string
          bloom_level?: number
          user_answer?: string
          is_correct?: boolean
          confidence?: number | null
          time_taken_seconds?: number | null
          reward?: number | null
          ai_grade?: string | null
          ai_feedback?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
      learning_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          total_questions: number
          correct_answers: number
          accuracy: number | null
          topics_covered: string[]
          bloom_levels_practiced: number[]
          session_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          total_questions?: number
          correct_answers?: number
          accuracy?: number | null
          topics_covered?: string[]
          bloom_levels_practiced?: number[]
          session_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          total_questions?: number
          correct_answers?: number
          accuracy?: number | null
          topics_covered?: string[]
          bloom_levels_practiced?: number[]
          session_type?: string
          created_at?: string
        }
      }
      rl_state: {
        Row: {
          id: string
          user_id: string
          strategy: string
          exploration_rate: number
          topic_weights: Json
          recent_performance: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy?: string
          exploration_rate?: number
          topic_weights?: Json
          recent_performance?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strategy?: string
          exploration_rate?: number
          topic_weights?: Json
          recent_performance?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_topic_mastery: {
        Args: {
          p_user_id: string
          p_topic_id: string
        }
        Returns: number
      }
      search_knowledge_chunks: {
        Args: {
          query_embedding: number[]
          match_count?: number
          filter_chapter_id?: string | null
          filter_topic_id?: string | null
        }
        Returns: {
          id: string
          content: string
          similarity: number
          chapter_id: string
          topic_id: string | null
          source_file_name: string | null
          page_number: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Subject = Database['public']['Tables']['subjects']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
export type Topic = Database['public']['Tables']['topics']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type KnowledgeChunk = Database['public']['Tables']['knowledge_chunks']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type UserResponse = Database['public']['Tables']['user_responses']['Row']
export type LearningSession = Database['public']['Tables']['learning_sessions']['Row']
export type RLState = Database['public']['Tables']['rl_state']['Row']

// Mastery scores type
export interface MasteryScores {
  1: number
  2: number
  3: number
  4: number
  5: number
  6: number
}

// Bloom levels enum
export enum BloomLevel {
  Remember = 1,
  Understand = 2,
  Apply = 3,
  Analyze = 4,
  Evaluate = 5,
  Create = 6,
}

export const BLOOM_LEVEL_NAMES: Record<BloomLevel, string> = {
  [BloomLevel.Remember]: 'Remember',
  [BloomLevel.Understand]: 'Understand',
  [BloomLevel.Apply]: 'Apply',
  [BloomLevel.Analyze]: 'Analyze',
  [BloomLevel.Evaluate]: 'Evaluate',
  [BloomLevel.Create]: 'Create',
}

export const BLOOM_LEVEL_DESCRIPTIONS: Record<BloomLevel, string> = {
  [BloomLevel.Remember]: 'Recall facts and basic concepts',
  [BloomLevel.Understand]: 'Explain ideas or concepts',
  [BloomLevel.Apply]: 'Use information in new situations',
  [BloomLevel.Analyze]: 'Draw connections among ideas',
  [BloomLevel.Evaluate]: 'Justify a stand or decision',
  [BloomLevel.Create]: 'Produce new or original work',
}
