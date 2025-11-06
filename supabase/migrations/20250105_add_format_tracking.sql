-- Add Format Performance Tracking to RL Metadata
-- This enables tracking which question formats work best for each user at each Bloom level

-- Update existing rl_metadata to include format performance tracking
-- Structure: format_performance: { [bloomLevel]: { [format]: { attempts, correct, avg_confidence } } }

COMMENT ON COLUMN user_progress.rl_metadata IS 'RL metadata including format performance tracking. Structure:
{
  "exploration_count": 0,
  "optimization_count": 0,
  "total_rewards": 0,
  "policy_updates": 0,
  "phase_transitions": [],
  "last_phase_change": null,
  "format_performance": {
    "1": {
      "mcq": {"attempts": 10, "correct": 8, "avg_confidence": 0.75},
      "true_false": {"attempts": 5, "correct": 4, "avg_confidence": 0.80}
    },
    "2": {
      "mcq": {"attempts": 8, "correct": 6, "avg_confidence": 0.70},
      "fill_blank": {"attempts": 4, "correct": 3, "avg_confidence": 0.65}
    }
  },
  "format_preferences": {
    "most_effective": ["mcq", "true_false"],
    "least_effective": ["code_debug"],
    "confidence_by_format": {
      "mcq": 0.75,
      "code": 0.60
    }
  }
}';

-- Create view for format effectiveness analysis
CREATE OR REPLACE VIEW user_format_effectiveness AS
SELECT
  up.user_id,
  up.topic_id,
  t.subject_id,
  up.rl_phase,
  up.rl_metadata->'format_performance' as format_performance,
  up.rl_metadata->'format_preferences' as format_preferences,
  up.total_attempts,
  up.current_bloom_level
FROM user_progress up
LEFT JOIN topics t ON up.topic_id = t.id
WHERE up.rl_metadata ? 'format_performance';

COMMENT ON VIEW user_format_effectiveness IS 'View showing format performance metrics per user per topic';

-- Create function to calculate format effectiveness score
CREATE OR REPLACE FUNCTION calculate_format_effectiveness(
  p_attempts INTEGER,
  p_correct INTEGER,
  p_avg_confidence DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  -- Effectiveness score combines accuracy and confidence
  -- Formula: (accuracy * 0.7) + (confidence * 0.3)
  -- accuracy = correct / attempts
  IF p_attempts = 0 THEN
    RETURN 0;
  END IF;

  RETURN (
    ((p_correct::DECIMAL / p_attempts::DECIMAL) * 0.7) +
    (p_avg_confidence * 0.3)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_format_effectiveness IS 'Calculates effectiveness score for a question format (0-1 scale)';

-- Create index for format performance queries
CREATE INDEX IF NOT EXISTS idx_user_progress_format_performance
ON user_progress USING gin ((rl_metadata->'format_performance'));

-- Sample query to get best format for a user at a specific Bloom level
/*
SELECT
  format_key,
  (value->>'attempts')::INTEGER as attempts,
  (value->>'correct')::INTEGER as correct,
  (value->>'avg_confidence')::DECIMAL as avg_confidence,
  calculate_format_effectiveness(
    (value->>'attempts')::INTEGER,
    (value->>'correct')::INTEGER,
    (value->>'avg_confidence')::DECIMAL
  ) as effectiveness_score
FROM user_progress,
     jsonb_each(rl_metadata->'format_performance'->'3') as formats(format_key, value)
WHERE user_id = 'some-user-id'
  AND topic_id = 'some-topic-id'
ORDER BY effectiveness_score DESC;
*/
