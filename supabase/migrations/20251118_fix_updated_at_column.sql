-- Fix missing updated_at column for trigger
ALTER TABLE user_global_progress 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
