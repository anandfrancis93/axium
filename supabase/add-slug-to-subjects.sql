-- Add slug column to subjects table
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing subjects
UPDATE subjects
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '_', '-'))
WHERE slug IS NULL;

-- Make slug required for new entries
ALTER TABLE subjects
ALTER COLUMN slug SET NOT NULL;

-- Add index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects(slug);
