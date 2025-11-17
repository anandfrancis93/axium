-- Update security fundamental topics with comprehensive definitions
-- Remove "Information security policies" and add proper "Information Security" topic

-- Delete "Information security policies" (no dependencies)
DELETE FROM topics WHERE name = 'Information security policies';

-- Update Confidentiality
UPDATE topics
SET description = 'The fundamental security goal of keeping information and communications private and protecting them from unauthorized access.'
WHERE id = 'e985f007-6ad3-41ae-957f-1d2f529dccf8'
  AND name = 'Confidentiality';

-- Update Integrity
UPDATE topics
SET description = 'The fundamental security goal of keeping organizational information accurate, free of errors, and without unauthorized modifications.'
WHERE id = '8964b8f8-eaca-497b-84cd-73bacfd278ca'
  AND name = 'Integrity';

-- Update Availability (the one under "Summarize fundamental security concepts")
UPDATE topics
SET description = 'The fundamental security goal of ensuring that computer systems operate continuously and that authorized persons can access data that they need.'
WHERE id = '414c2db8-f63a-452f-a099-9c0c87eca5eb'
  AND name = 'Availability';

-- Update Non-repudiation
UPDATE topics
SET description = 'The security goal of ensuring that the party that sent a transmission or created data remains associated with that data and cannot deny sending or creating that data.'
WHERE id = 'c7cece52-3ab6-401a-8123-e1b78d04d214'
  AND name = 'Non-repudiation';

-- Add Information Security topic
INSERT INTO topics (
  id,
  chapter_id,
  parent_topic_id,
  name,
  description,
  hierarchy_level,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',  -- CompTIA Security+ SY0-701 chapter
  'e679b2ad-c848-4f73-a491-25d036db67bd',  -- "Summarize fundamental security concepts" parent
  'Information Security',
  'Information security (infosec) refers to the protection of data resources from unauthorized access, attack, theft, or damage. Data may be vulnerable because of the way it is stored, transferred, or processed. The systems used to store, transmit, and process data must demonstrate the properties of security.',
  3,
  NOW(),
  NOW()
);

COMMENT ON TABLE topics IS 'Updated security fundamental topics with comprehensive textbook-style definitions for Confidentiality, Integrity, Availability, Non-repudiation, and added Information Security';
