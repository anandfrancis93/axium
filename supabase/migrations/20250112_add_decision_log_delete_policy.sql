-- Add DELETE policy for rl_decision_log table
-- This allows users to delete their own decision logs (for audit reset functionality)

CREATE POLICY "Users can delete their own decision logs"
  ON rl_decision_log FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete their own decision logs" ON rl_decision_log IS
  'Allows users to delete their own RL decision logs, enabling audit log reset functionality';
