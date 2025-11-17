-- Update threat actor and motivation topics with formal textbook definitions
-- Only updates topics that already exist in the database

-- Motivations
UPDATE topics
SET description = 'Demanding payment to prevent the release of information.'
WHERE name = 'Blackmail';

UPDATE topics
SET description = 'The process by which an attacker takes data that is stored inside of a private network and moves it to an external network.'
WHERE name = 'Data exfiltration';

UPDATE topics
SET description = 'A type of attack that compromises the availability of an asset or business process.'
WHERE name = 'Service disruption';

-- Threat Actors
UPDATE topics
SET description = 'A threat actor that is motivated by a social issue or political cause.'
WHERE name = 'Hacktivist';

UPDATE topics
SET description = 'An inexperienced, unskilled attacker that typically uses tools or scripts created by others.'
WHERE name = 'Unskilled attacker';

UPDATE topics
SET description = 'A type of threat actor that is supported by the resources of its host country''s military and security services.'
WHERE name = 'Nation-state';

UPDATE topics
SET description = 'A type of threat actor that uses hacking and computer fraud for commercial gain.'
WHERE name = 'Organized crime';

UPDATE topics
SET description = 'Computer hardware, software, or services used on a private network without authorization from the system owner.'
WHERE name = 'Shadow IT';

-- Note: "Insider threat" has duplicates - updating both for now
UPDATE topics
SET description = 'A type of threat actor who is assigned privileges on the system that cause an intentional or unintentional incident.'
WHERE name = 'Insider threat';

-- Attributes
UPDATE topics
SET description = 'A formal classification of the resources and expertise available to a threat actor.'
WHERE name = 'Level of sophistication/capability';

UPDATE topics
SET description = 'The ability of threat actors to draw upon funding to acquire personnel, tools, and to develop novel attack types.'
WHERE name = 'Resources/funding';

-- Show summary of updates
SELECT
  name,
  LEFT(description, 80) || '...' as updated_description,
  LENGTH(description) as chars
FROM topics
WHERE name IN (
  'Blackmail',
  'Data exfiltration',
  'Service disruption',
  'Hacktivist',
  'Unskilled attacker',
  'Nation-state',
  'Organized crime',
  'Shadow IT',
  'Insider threat',
  'Level of sophistication/capability',
  'Resources/funding'
)
ORDER BY name;
