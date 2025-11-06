-- Add hierarchical structure to topics table
-- Uses materialized path pattern for efficient querying

ALTER TABLE topics
ADD COLUMN parent_topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
ADD COLUMN path TEXT NOT NULL DEFAULT '',
ADD COLUMN depth INTEGER NOT NULL DEFAULT 0,
ADD COLUMN full_name TEXT; -- Full hierarchical name for display

-- Create index for efficient path queries
CREATE INDEX idx_topics_path ON topics USING btree(path);
CREATE INDEX idx_topics_parent_id ON topics(parent_topic_id);
CREATE INDEX idx_topics_depth ON topics(depth);

-- Function to generate full hierarchical name
CREATE OR REPLACE FUNCTION generate_topic_full_name(topic_id UUID)
RETURNS TEXT AS $$
DECLARE
  topic_path TEXT[];
  current_id UUID;
  current_name TEXT;
BEGIN
  current_id := topic_id;
  topic_path := ARRAY[]::TEXT[];

  -- Traverse up to root
  WHILE current_id IS NOT NULL LOOP
    SELECT name, parent_topic_id INTO current_name, current_id
    FROM topics
    WHERE id = current_id;

    IF current_name IS NOT NULL THEN
      topic_path := array_prepend(current_name, topic_path);
    END IF;
  END LOOP;

  -- Join with ' > '
  RETURN array_to_string(topic_path, ' > ');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to generate path (slug format)
CREATE OR REPLACE FUNCTION generate_topic_path(topic_id UUID)
RETURNS TEXT AS $$
DECLARE
  topic_slugs TEXT[];
  current_id UUID;
  current_name TEXT;
  current_slug TEXT;
BEGIN
  current_id := topic_id;
  topic_slugs := ARRAY[]::TEXT[];

  -- Traverse up to root
  WHILE current_id IS NOT NULL LOOP
    SELECT name, parent_topic_id INTO current_name, current_id
    FROM topics
    WHERE id = current_id;

    IF current_name IS NOT NULL THEN
      -- Convert to slug: lowercase, replace spaces with hyphens
      current_slug := lower(regexp_replace(current_name, '[^a-zA-Z0-9]+', '-', 'g'));
      current_slug := trim(both '-' from current_slug);
      topic_slugs := array_prepend(current_slug, topic_slugs);
    END IF;
  END LOOP;

  -- Join with '/'
  RETURN array_to_string(topic_slugs, '/');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate depth
CREATE OR REPLACE FUNCTION calculate_topic_depth(topic_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_id UUID;
  depth_count INTEGER;
BEGIN
  current_id := topic_id;
  depth_count := 0;

  -- Traverse up to root
  WHILE current_id IS NOT NULL LOOP
    SELECT parent_topic_id INTO current_id
    FROM topics
    WHERE id = current_id;

    IF current_id IS NOT NULL THEN
      depth_count := depth_count + 1;
    END IF;
  END LOOP;

  RETURN depth_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to automatically update path, depth, and full_name on insert/update
CREATE OR REPLACE FUNCTION update_topic_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Update depth
  NEW.depth := calculate_topic_depth(NEW.id);

  -- Update path
  NEW.path := generate_topic_path(NEW.id);

  -- Update full_name
  NEW.full_name := generate_topic_full_name(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_topic_hierarchy
BEFORE INSERT OR UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION update_topic_hierarchy();

-- Function to get all subtopics (children and descendants)
CREATE OR REPLACE FUNCTION get_topic_subtopics(parent_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  path TEXT,
  depth INTEGER,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subtopic_tree AS (
    -- Base case: direct children
    SELECT t.id, t.name, t.path, t.depth, t.full_name
    FROM topics t
    WHERE t.parent_topic_id = parent_id

    UNION ALL

    -- Recursive case: children of children
    SELECT t.id, t.name, t.path, t.depth, t.full_name
    FROM topics t
    INNER JOIN subtopic_tree st ON t.parent_topic_id = st.id
  )
  SELECT * FROM subtopic_tree
  ORDER BY depth, name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get topic ancestors (parent, grandparent, etc.)
CREATE OR REPLACE FUNCTION get_topic_ancestors(topic_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  path TEXT,
  depth INTEGER,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestor_tree AS (
    -- Base case: the topic itself
    SELECT t.id, t.name, t.path, t.depth, t.full_name, t.parent_topic_id
    FROM topics t
    WHERE t.id = topic_id

    UNION ALL

    -- Recursive case: parent of current
    SELECT t.id, t.name, t.path, t.depth, t.full_name, t.parent_topic_id
    FROM topics t
    INNER JOIN ancestor_tree at ON t.id = at.parent_topic_id
  )
  SELECT id, name, path, depth, full_name
  FROM ancestor_tree
  ORDER BY depth;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON COLUMN topics.parent_topic_id IS 'Parent topic in hierarchy (NULL for root topics)';
COMMENT ON COLUMN topics.path IS 'Materialized path using slugs (e.g., zero-trust/control-plane/adaptive-identity)';
COMMENT ON COLUMN topics.depth IS 'Depth in hierarchy (0 for root, 1 for child, etc.)';
COMMENT ON COLUMN topics.full_name IS 'Full hierarchical name (e.g., Zero Trust > Control Plane > Adaptive identity)';

COMMENT ON FUNCTION get_topic_subtopics IS 'Returns all descendants of a topic (children, grandchildren, etc.)';
COMMENT ON FUNCTION get_topic_ancestors IS 'Returns all ancestors of a topic (parent, grandparent, etc.)';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Topic hierarchy support added!';
  RAISE NOTICE 'New columns: parent_topic_id, path, depth, full_name';
  RAISE NOTICE 'Use get_topic_subtopics(id) to get all descendants';
  RAISE NOTICE 'Use get_topic_ancestors(id) to get full path';
END $$;
