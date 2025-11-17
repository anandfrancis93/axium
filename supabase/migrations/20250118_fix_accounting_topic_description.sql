-- Fix "Accounting" topic description to clarify it's about security accounting (audit trails)
-- This prevents AI from generating questions about financial accounting instead of cybersecurity

-- Delete bad financial accounting question (Assets = Liabilities + Owner's Equity)
DELETE FROM questions
WHERE topic_id = 'd34e10e2-e37c-4786-9b97-8fd973c6ff2b'
  AND question_text ILIKE '%accounting equation%';

-- Update Accounting topic description
UPDATE topics
SET description = 'Security accounting refers to logging and tracking user activities, maintaining audit trails, and recording security events. Part of AAA (Authentication, Authorization, Accounting) framework. Includes event logging, audit trails, session tracking, and accountability mechanisms.'
WHERE id = 'd34e10e2-e37c-4786-9b97-8fd973c6ff2b'
  AND name = 'Accounting';

-- Update Assignment/accounting topic description
UPDATE topics
SET description = 'Tracking and documenting the assignment, usage, and lifecycle of hardware, software, and data assets. Maintaining accountability for asset management and proper record-keeping for security and compliance purposes.'
WHERE id = '508b5548-0b71-404b-8f7d-10690c3af1b4'
  AND name = 'Assignment/accounting';

COMMENT ON TABLE topics IS 'Topics must have clear descriptions to prevent AI from generating irrelevant questions. Empty descriptions lead to context confusion (e.g., "Accounting" interpreted as financial instead of security audit trails).';
