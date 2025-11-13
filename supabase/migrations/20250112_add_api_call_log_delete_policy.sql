-- Add DELETE policy for api_call_log table
-- This allows users to delete their own API call logs (for audit reset functionality)

CREATE POLICY "Users can delete their own API call logs"
  ON api_call_log FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete their own API call logs" ON api_call_log IS
  'Allows users to delete their own API call logs, enabling audit log reset functionality';
