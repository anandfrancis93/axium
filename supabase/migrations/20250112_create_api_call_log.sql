-- Create table to track API calls and costs
CREATE TABLE IF NOT EXISTS api_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- API details
  provider TEXT NOT NULL, -- 'anthropic' or 'openai' or 'google'
  model TEXT NOT NULL, -- e.g. 'claude-3-5-sonnet-20241022', 'gpt-4o', 'gemini-1.5-pro'
  endpoint TEXT NOT NULL, -- e.g. '/api/rl/next-question', '/api/ai/explain'

  -- Usage metrics
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cost calculation (in USD)
  input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,

  -- Performance
  latency_ms INTEGER, -- API call duration in milliseconds

  -- Context
  purpose TEXT, -- e.g. 'question_generation', 'explanation', 'knowledge_extraction'
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (topic, bloom_level, etc.)

  -- Status
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error', 'rate_limit'
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_api_call_log_user_id ON api_call_log(user_id);
CREATE INDEX idx_api_call_log_created_at ON api_call_log(created_at DESC);
CREATE INDEX idx_api_call_log_provider ON api_call_log(provider);
CREATE INDEX idx_api_call_log_endpoint ON api_call_log(endpoint);
CREATE INDEX idx_api_call_log_status ON api_call_log(status);

-- RLS Policies
ALTER TABLE api_call_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API call logs
CREATE POLICY "Users can view their own API call logs"
  ON api_call_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert API call logs
CREATE POLICY "System can insert API call logs"
  ON api_call_log
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE api_call_log IS 'Tracks all API calls to Claude, OpenAI, and Google with token usage and costs for transparency';
