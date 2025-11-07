-- Remove code-related and diagram question formats
-- Keeping only: mcq_single, mcq_multi, true_false, fill_blank, matching, open_ended

-- Step 1: Create new enum type without code formats
CREATE TYPE question_format_new AS ENUM (
  'mcq_single',       -- Multiple Choice - Single correct answer
  'mcq_multi',        -- Multiple Choice - Multiple correct answers (select all that apply)
  'open_ended',       -- Essay/explanation questions
  'fill_blank',       -- Fill in the blank
  'true_false',       -- True/False questions
  'matching'          -- Match items
);

-- Step 2: Update questions table to use new enum
ALTER TABLE questions
  ALTER COLUMN question_format TYPE question_format_new
  USING (question_format::text::question_format_new);

-- Step 3: Drop old enum and rename new one
DROP TYPE question_format;
ALTER TYPE question_format_new RENAME TO question_format;

-- Step 4: Update comment
COMMENT ON TYPE question_format IS 'Question format types - simplified set focusing on text-based assessments';

-- Step 5: Remove format_metadata examples that are no longer relevant
COMMENT ON COLUMN questions.format_metadata IS 'Format-specific metadata for configuration (e.g., shuffle_options, partial_credit)';
