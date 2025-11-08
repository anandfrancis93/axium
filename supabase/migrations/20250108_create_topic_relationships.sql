-- Knowledge Graph: Topic Relationships
-- Stores explicit relationships between topics for semantic discovery

-- Create relationship types enum
CREATE TYPE relationship_type AS ENUM (
  'is_a',           -- "Access badge" IS-A "Preventative control"
  'part_of',        -- "Policy Engine" PART-OF "Control Plane"
  'requires',       -- "Apply" REQUIRES "Understand" (prerequisite)
  'contrasts_with', -- "Preventative" CONTRASTS-WITH "Detective"
  'enables',        -- "Encryption" ENABLES "Confidentiality"
  'mitigates'       -- "MFA" MITIGATES "Password attacks"
);

-- Create topic_relationships table
CREATE TABLE topic_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  target_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  reasoning TEXT, -- AI explanation for why this relationship exists
  created_by TEXT DEFAULT 'ai', -- 'ai' or 'manual'
  reviewed BOOLEAN DEFAULT FALSE, -- Has a human reviewed this?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate relationships
  UNIQUE(source_topic_id, target_topic_id, relationship_type),

  -- Prevent self-relationships
  CHECK (source_topic_id != target_topic_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_topic_relationships_source ON topic_relationships(source_topic_id);
CREATE INDEX idx_topic_relationships_target ON topic_relationships(target_topic_id);
CREATE INDEX idx_topic_relationships_type ON topic_relationships(relationship_type);
CREATE INDEX idx_topic_relationships_confidence ON topic_relationships(confidence);
CREATE INDEX idx_topic_relationships_reviewed ON topic_relationships(reviewed);

-- Enable RLS
ALTER TABLE topic_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read relationships (used for learning)
CREATE POLICY "Anyone can view topic relationships"
  ON topic_relationships
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (for manual review)
CREATE POLICY "Authenticated users can manage relationships"
  ON topic_relationships
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Function to get related topics via knowledge graph
CREATE OR REPLACE FUNCTION get_related_topics_kg(
  p_topic_id UUID,
  p_min_confidence FLOAT DEFAULT 0.7,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  topic_id UUID,
  topic_name TEXT,
  topic_full_name TEXT,
  relationship_type relationship_type,
  confidence FLOAT,
  reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.full_name,
    tr.relationship_type,
    tr.confidence,
    tr.reasoning
  FROM topic_relationships tr
  JOIN topics t ON t.id = tr.target_topic_id
  WHERE tr.source_topic_id = p_topic_id
    AND tr.confidence >= p_min_confidence
  ORDER BY
    -- Prioritize by relationship type importance
    CASE tr.relationship_type
      WHEN 'is_a' THEN 1
      WHEN 'part_of' THEN 2
      WHEN 'requires' THEN 3
      WHEN 'enables' THEN 4
      WHEN 'mitigates' THEN 5
      WHEN 'contrasts_with' THEN 6
    END,
    tr.confidence DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get bidirectional relationships (useful for graph visualization)
CREATE OR REPLACE FUNCTION get_all_relationships(
  p_topic_id UUID,
  p_min_confidence FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  related_topic_id UUID,
  related_topic_name TEXT,
  relationship_type relationship_type,
  direction TEXT, -- 'outgoing' or 'incoming'
  confidence FLOAT
) AS $$
BEGIN
  RETURN QUERY
  -- Outgoing relationships (this topic → other topics)
  SELECT
    t.id,
    t.name,
    tr.relationship_type,
    'outgoing'::TEXT,
    tr.confidence
  FROM topic_relationships tr
  JOIN topics t ON t.id = tr.target_topic_id
  WHERE tr.source_topic_id = p_topic_id
    AND tr.confidence >= p_min_confidence

  UNION ALL

  -- Incoming relationships (other topics → this topic)
  SELECT
    t.id,
    t.name,
    tr.relationship_type,
    'incoming'::TEXT,
    tr.confidence
  FROM topic_relationships tr
  JOIN topics t ON t.id = tr.source_topic_id
  WHERE tr.target_topic_id = p_topic_id
    AND tr.confidence >= p_min_confidence

  ORDER BY confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE topic_relationships IS 'Knowledge graph storing explicit semantic relationships between topics';
COMMENT ON COLUMN topic_relationships.relationship_type IS 'Type of relationship: is_a, part_of, requires, contrasts_with, enables, mitigates';
COMMENT ON COLUMN topic_relationships.confidence IS 'AI confidence score (0.0-1.0). >0.9 = high confidence, 0.7-0.9 = review recommended';
COMMENT ON COLUMN topic_relationships.reasoning IS 'AI-generated explanation for why this relationship exists';
COMMENT ON COLUMN topic_relationships.reviewed IS 'Whether a human has verified this relationship';
