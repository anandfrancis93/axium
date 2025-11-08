-- ========================================
-- DEBUG: Create a diagnostic function to see EXACTLY what RPC sees
-- ========================================

DROP FUNCTION IF EXISTS debug_topics_count(UUID);

CREATE OR REPLACE FUNCTION debug_topics_count(p_chapter_id UUID)
RETURNS TABLE (
  total_topics BIGINT,
  depth_0 BIGINT,
  depth_1 BIGINT,
  depth_2_plus BIGINT,
  total_excluding_depth_1 BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_topics,
    COUNT(*) FILTER (WHERE depth = 0) as depth_0,
    COUNT(*) FILTER (WHERE depth = 1) as depth_1,
    COUNT(*) FILTER (WHERE depth >= 2) as depth_2_plus,
    COUNT(*) FILTER (WHERE depth != 1) as total_excluding_depth_1
  FROM topics
  WHERE chapter_id = p_chapter_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION debug_topics_count IS 'Debug function to see what RPC sees for topics';
