-- Drop trigger that duplicates application logic
-- This trigger causes double-counting: total_attempts increments by 2 instead of 1
-- Application code (updateUserProgress in route.ts) already handles all updates

DROP TRIGGER IF EXISTS trigger_handle_user_response_for_progress ON user_responses;
DROP FUNCTION IF EXISTS handle_user_response_for_progress();
