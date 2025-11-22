-- Rename authentication factor topics by removing "Factor" suffix

UPDATE topics
SET name = 'Something You Know'
WHERE name = 'Something You Know Factor';

UPDATE topics
SET name = 'Something You Have'
WHERE name = 'Something You Have Factor';

UPDATE topics
SET name = 'Something You Are'
WHERE name = 'Something You Are Factor';

UPDATE topics
SET name = 'Somewhere You Are'
WHERE name = 'Somewhere You Are Factor';
