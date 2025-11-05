-- Migration: Add slug column to chapters table
-- Run this in Supabase SQL Editor

-- Step 1: Add slug column
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Generate slugs for existing chapters
-- This will create slugs from the chapter names
UPDATE chapters
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Step 3: Add unique constraint
ALTER TABLE chapters
  DROP CONSTRAINT IF EXISTS chapters_subject_slug_unique;

ALTER TABLE chapters
  ADD CONSTRAINT chapters_subject_slug_unique
  UNIQUE (subject_id, slug);

-- Step 4: Make slug NOT NULL (after populating)
ALTER TABLE chapters ALTER COLUMN slug SET NOT NULL;

-- Verify the migration
SELECT id, name, slug FROM chapters ORDER BY created_at;
