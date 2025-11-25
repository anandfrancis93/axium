/**
 * Question Generation Prompt Templates for Claude
 *
 * These prompts are optimized for generating high-quality educational questions
 * aligned with Bloom's Taxonomy levels using GraphRAG context.
 */

import { GraphRAGContext } from './context'

export type QuestionFormat =
  | 'mcq_single'      // Multiple choice - single answer
  | 'mcq_multi'       // Multiple choice - multiple answers ("select all that apply")
  | 'fill_blank'      // Fill in the blank
  | 'open_ended'      // Essay/short answer

export interface QuestionFormatInfo {
  name: string
  description: string
  icon: string
  idealBloomLevels: number[]
  complexity: 'low' | 'medium' | 'high'
}

export const QUESTION_FORMATS: Record<QuestionFormat, QuestionFormatInfo> = {
  mcq_single: {
    name: 'MCQ - Single Select',
    description: 'Multiple choice question with one correct answer',
    icon: '◻',
    idealBloomLevels: [1, 2],
    complexity: 'low'
  },
  mcq_multi: {
    name: 'MCQ - Multi Select',
    description: 'Multiple choice question with multiple correct answers ("select all that apply")',
    icon: '☑',
    idealBloomLevels: [2, 3, 4],
    complexity: 'medium'
  },
  fill_blank: {
    name: 'Fill in the Blank',
    description: 'Complete the sentence with the correct term',
    icon: '▭',
    idealBloomLevels: [1, 2, 3],
    complexity: 'low'
  },
  open_ended: {
    name: 'Open-Ended',
    description: 'Essay or short answer question',
    icon: '≡',
    idealBloomLevels: [4, 5, 6],
    complexity: 'high'
  }
}

/**
 * Bloom Level Information
 */
export interface BloomLevelInfo {
  level: number
  name: string
  description: string
  cognitiveSkills: string[]
  actionVerbs: string[]
  recommendedFormats: QuestionFormat[]
}

export const BLOOM_LEVELS: Record<number, BloomLevelInfo> = {
  1: {
    level: 1,
    name: 'Remember',
    description: 'Recall facts and basic concepts',
    cognitiveSkills: ['Recognize', 'Recall', 'Identify', 'Define', 'List'],
    actionVerbs: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state'],
    recommendedFormats: ['mcq_single', 'fill_blank']
  },
  2: {
    level: 2,
    name: 'Understand',
    description: 'Explain ideas or concepts',
    cognitiveSkills: ['Interpret', 'Summarize', 'Paraphrase', 'Classify', 'Explain'],
    actionVerbs: ['describe', 'explain', 'summarize', 'paraphrase', 'classify', 'compare', 'interpret'],
    recommendedFormats: ['mcq_single', 'mcq_multi']
  },
  3: {
    level: 3,
    name: 'Apply',
    description: 'Use information in new situations',
    cognitiveSkills: ['Execute', 'Implement', 'Solve', 'Use', 'Demonstrate'],
    actionVerbs: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'operate'],
    recommendedFormats: ['mcq_multi', 'fill_blank']
  },
  4: {
    level: 4,
    name: 'Analyze',
    description: 'Draw connections among ideas',
    cognitiveSkills: ['Differentiate', 'Organize', 'Attribute', 'Compare', 'Deconstruct'],
    actionVerbs: ['analyze', 'compare', 'contrast', 'differentiate', 'examine', 'categorize'],
    recommendedFormats: ['mcq_multi', 'open_ended']
  },
  5: {
    level: 5,
    name: 'Evaluate',
    description: 'Justify a decision or course of action',
    cognitiveSkills: ['Check', 'Critique', 'Judge', 'Defend', 'Justify'],
    actionVerbs: ['evaluate', 'critique', 'judge', 'defend', 'justify', 'assess', 'prioritize'],
    recommendedFormats: ['mcq_multi', 'open_ended']
  },
  6: {
    level: 6,
    name: 'Create',
    description: 'Produce new or original work',
    cognitiveSkills: ['Generate', 'Plan', 'Produce', 'Design', 'Construct'],
    actionVerbs: ['create', 'design', 'develop', 'construct', 'plan', 'formulate', 'propose'],
    recommendedFormats: ['open_ended']
  }
}

/**
 * Get recommended question formats for a Bloom level
 */
export function getRecommendedFormats(bloomLevel: number): QuestionFormat[] {
  return BLOOM_LEVELS[bloomLevel]?.recommendedFormats || ['mcq_single']
}

/**
 * Format GraphRAG context for prompt
 */
function formatContext(context: GraphRAGContext): string {
  const parts: string[] = []

  parts.push(`Domain: ${context.domain}`)
  if (context.objective) {
    parts.push(`Learning Objective: ${context.objective}`)
  }
  parts.push(`Topic: ${context.name}`)
  parts.push(`Topic Summary: ${context.summary || 'No summary available'}`)

  if (context.parentName) {
    parts.push(`Parent Concept: ${context.parentName}`)
  }

  if (context.children.length > 0) {
    parts.push(`\nSubtopics:`)
    context.children.forEach(child => {
      const summary = child.summary ? `: ${child.summary}` : ''
      parts.push(`- ${child.name}${summary}`)
    })
  }

  const crossDomain = context.relatedConcepts.filter(r => r.crossDomain)
  if (crossDomain.length > 0) {
    parts.push(`\nRelated Concepts (Cross-Domain):`)
    crossDomain.slice(0, 5).forEach(rel => {
      parts.push(`- ${rel.name} (${rel.domain})`)
    })
  }

  if (context.scopeTags.length > 0) {
    parts.push(`\nTechnical Scope: ${context.scopeTags.slice(0, 5).join(', ')}`)
  }

  if (context.rippleContext) {
    parts.push(`\n${context.rippleContext}`)
  }

  return parts.join('\n')
}

/**
 * Generate MCQ Single Answer prompt
 */
function generateMCQSinglePrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating a multiple-choice question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Multiple choice with ONE correct answer
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}
- Use action verbs: ${bloomInfo.actionVerbs.slice(0, 5).join(', ')}

INSTRUCTIONS:
1. Create a question that tests ${bloomInfo.name.toLowerCase()} skills about "${context.name}"
2. The question should test knowledge OF "${context.name}" itself (what it is, how it works, when to use it, etc.)
3. The correct answer should directly relate to identifying, defining, or explaining "${context.name}"
4. Write 4 options (A, B, C, D) with exactly ONE correct answer
5. ⚠️ CRITICAL: ALL 4 options MUST be within ±30% length of each other (measure in characters)
6. ⚠️ CRITICAL: Create distractors using definitions of RELATED topics from the same domain
   - DO NOT use vague/generic wrong answers ("a temporary solution", "a basic approach")
   - DO use specific definitions of similar/related topics that could be confused
   - Each distractor should sound like it COULD be correct if you don't know the precise definition
   - Student must know the SPECIFIC definition of "${context.name}" to answer correctly
7. Base the question on the provided context and related concepts
8. Provide a detailed explanation of why the correct answer is right and others are wrong

CRITICAL RULE - TEST THE TOPIC:
- The question must test understanding OF "${context.name}"
- Acceptable: "What is ${context.name}?", "How does ${context.name} work?", "When should you use ${context.name}?"
- AVOID: Using "${context.name}" in the question stem but asking about something else entirely

QUALITY CONTROLS - ANTI-TELL-TALE RULES:
❌ NEVER use these patterns (they give away answers):
- "All of the above" or "None of the above" options
- One option significantly longer or shorter than others (±30% length difference is maximum)
- Repeating exact keywords from question stem in only the correct answer
- Combined options like "Both A and B" or "A and C but not B"
- Absolute terms ONLY in distractors ("always", "never", "only", "all", "none")
- Grammatical inconsistency (e.g., question says "Which is AN..." but option starts with consonant)
- Obvious alphabetical or numerical ordering that correlates with correctness
- Technical jargon ONLY in the correct answer (all options must match complexity level)

❌ BAD EXAMPLE - LENGTH IMBALANCE (DO NOT DO THIS):
A) A temporary arrangement (25 chars)
B) A collaborative partnership where two organizations work together toward shared strategic objectives (105 chars) ← CORRECT but TOO LONG
C) A casual association (21 chars)
D) An informal connection (23 chars)
Problem: Option B is 4x longer than others → Students can guess without knowledge

✅ GOOD EXAMPLE - BALANCED LENGTH:
A) A temporary arrangement for specific projects (48 chars)
B) A strategic partnership with shared objectives (49 chars) ← CORRECT
C) A casual association with minimal coordination (49 chars)
D) An informal connection without formal structure (50 chars)
All options 48-50 chars → Length doesn't reveal answer

❌ NEVER reference source materials in questions OR explanations:
- Do NOT include "in the context of [source]" (e.g., "CompTIA Security+ SY0-701")
- Do NOT mention textbook names, certification exams, or course codes
- Do NOT reference learning objectives or domains by name
- Do NOT say "as defined in the [curriculum]" or "according to [certification]"
- Write questions AND explanations as if they are standalone educational content
- Focus on the TOPIC and CONCEPTS, not the source they came from

✅ EXPLANATION QUALITY:
- Explain WHY the correct answer is right using clear reasoning
- Do NOT cite external sources, curriculums, or certifications
- Use phrases like "This is correct because..." not "According to [source]..."
- Focus on conceptual understanding, not memorization of source material

✅ REQUIRED quality standards:
- All 4 options must be similar length (within ±30% of each other)
- All 4 options must use similar grammatical structure (all noun phrases OR all complete sentences)
- All 4 options must be plausible to someone who hasn't mastered the concept yet
- All 4 options must be mutually exclusive (no overlapping meanings)
- All 4 options must match the question stem grammatically
- Distractors must be based on common misconceptions or related concepts (not random)
- No option should contain hints about other options being correct/incorrect

✅ DISTRACTOR QUALITY (critically important):
- ALL options must be from the SAME DOMAIN/TOPIC AREA as the question
- Distractors should be plausible alternative answers that test understanding
- DO NOT use options from unrelated domains (e.g., HR answers for security questions)
- Each distractor should represent a common mistake or partial understanding
- A knowledgeable person should need to think carefully to eliminate distractors
- Example for "purpose of security report": All options should be security-related purposes, not HR/finance/etc.

❌ BAD EXAMPLE - IRRELEVANT DISTRACTORS:
Question: "What is a Business Partner?"
A) A temporary arrangement (IRRELEVANT - too vague)
B) A closer relationship with aligned goals (CORRECT)
C) A merger of operations (IRRELEVANT - too extreme)
D) An informal connection (IRRELEVANT - too weak)
Problem: Only B sounds like a real definition. Others are obviously wrong.

✅ GOOD EXAMPLE - PLAUSIBLE DISTRACTORS:
Question: "What is a Business Partner?"
A) An organization that provides products or services under contract (Sounds like "Business Partner" but is actually "Vendor")
B) Two companies sharing aligned goals and marketing opportunities (CORRECT - actual Business Partner definition)
C) An external entity managing IT infrastructure and services (Sounds related but is actually "Managed Service Provider")
D) A company that supplies raw materials or components (Sounds related but is actually "Supplier")
Problem solved: All options are business relationship types. Student must know the SPECIFIC definition to answer correctly.

MANDATORY PRE-SUBMISSION VALIDATION:
Before returning your answer, you MUST verify:
1. Calculate character count for each option (excluding "A) ", "B) ", etc. prefixes)
2. Find the shortest and longest options
3. Verify: (longest - shortest) / shortest ≤ 0.30 (30%)
4. If validation FAILS, rewrite options to balance lengths BEFORE submitting
5. Only proceed to JSON output after length validation PASSES

VALIDATION CHECKLIST (review before submitting):
1. ✅ LENGTH CHECK (MANDATORY): Calculate and verify all options are within ±30% length
2. ✅ PLAUSIBILITY CHECK (MANDATORY): Read each distractor - does it sound like a real definition of a related topic?
   - REJECT vague distractors: "a basic method", "a simple approach", "a temporary solution"
   - REQUIRE specific distractors: definitions of actual related topics from the same domain
   - Ask: "If I didn't know the precise definition, could I genuinely believe this distractor?"
3. Read each option aloud - does one sound obviously different?
4. Check grammar: Does each option complete the question stem correctly?
5. Check keywords: Are technical terms distributed evenly across options?
6. Check structure: Do all options follow the same format (e.g., all start with verbs)?
7. Check domain relevance: Are ALL options from the same topic domain? (e.g., all security-related, not mixing HR/finance/etc.)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "The question text here?",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correctAnswer": "A",
  "explanation": "Why option A is correct and others are wrong"
}`
}

/**
 * Generate MCQ Multiple Answers prompt
 */
function generateMCQMultiPrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating a multiple-choice question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Multiple choice with MULTIPLE correct answers ("Select all that apply")
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}
- Use action verbs: ${bloomInfo.actionVerbs.slice(0, 5).join(', ')}

INSTRUCTIONS:
1. Create a question that tests ${bloomInfo.name.toLowerCase()} skills about "${context.name}"
2. The question should test knowledge OF "${context.name}" itself (characteristics, components, use cases, etc.)
3. The correct answers should directly relate to aspects of "${context.name}"
4. Write 5-6 options with 2-3 correct answers
5. ⚠️ CRITICAL: ALL options MUST be within ±30% length of each other (measure in characters)
6. ⚠️ CRITICAL: Create distractors using characteristics of RELATED topics from the same domain
   - DO NOT use vague/generic wrong answers ("improves efficiency", "enhances security")
   - DO use specific characteristics of similar/related topics that could be confused
   - Each distractor should sound like it COULD be a characteristic of "${context.name}"
   - Student must know the SPECIFIC characteristics of "${context.name}" to answer correctly
7. Make the question require understanding of multiple aspects of "${context.name}"
8. Use "Select all that apply" or similar phrasing
9. Provide a detailed explanation of why each correct answer is right and each distractor is wrong

CRITICAL RULE - TEST THE TOPIC:
- The question must test understanding OF "${context.name}"
- Acceptable: "Which characteristics describe ${context.name}?", "What are the components of ${context.name}?"
- AVOID: Using "${context.name}" in the question stem but asking about unrelated concepts

QUALITY CONTROLS - ANTI-TELL-TALE RULES:
❌ NEVER use these patterns (they give away answers):
- Grouping correct answers together (e.g., A, B, C are correct, D, E, F are wrong)
- Obvious patterns in correct answer positions (e.g., always alternating)
- One option significantly longer or shorter than others (±30% length difference is maximum)
- Using similar wording/structure ONLY in correct answers (or ONLY in distractors)
- Absolute terms ("always", "never", "only", "all", "none") concentrated in correct OR incorrect options
- Technical jargon ONLY in correct answers (or ONLY in distractors)
- Hints that certain options go together or contradict each other
- Making all correct answers positive statements and all distractors negative (or vice versa)

❌ BAD EXAMPLE - LENGTH IMBALANCE (DO NOT DO THIS):
A) Authentication (14 chars) ← CORRECT but TOO SHORT
B) A comprehensive security framework that combines multiple verification methods (78 chars) ← CORRECT but TOO LONG
C) Encryption technology (22 chars)
D) Access logging (15 chars)
Problem: Length reveals which are correct → Students can guess

✅ GOOD EXAMPLE - BALANCED LENGTH:
A) Uses multiple independent verification methods (48 chars) ← CORRECT
B) Requires different types of authentication factors (52 chars) ← CORRECT
C) Relies solely on password complexity requirements (51 chars)
D) Stores credentials in encrypted configuration files (54 chars)
All options 48-54 chars → Length doesn't reveal answers

❌ NEVER reference source materials in questions OR explanations:
- Do NOT include "in the context of [source]" (e.g., "CompTIA Security+ SY0-701")
- Do NOT mention textbook names, certification exams, or course codes
- Do NOT reference learning objectives or domains by name
- Do NOT say "as defined in the [curriculum]" or "according to [certification]"
- Write questions AND explanations as if they are standalone educational content
- Focus on the TOPIC and CONCEPTS, not the source they came from

✅ EXPLANATION QUALITY:
- Explain WHY the correct answer is right using clear reasoning
- Do NOT cite external sources, curriculums, or certifications
- Use phrases like "This is correct because..." not "According to [source]..."
- Focus on conceptual understanding, not memorization of source material

✅ REQUIRED quality standards:
- All 5-6 options must be similar length (within ±30% of each other)
- All options must use similar grammatical structure
- Correct answers should be distributed throughout options (not clustered)
- Mix of 2-3 correct answers (avoid 1 or 4+ which makes guessing easier)
- Each distractor must be plausible and based on common misconceptions
- All options must be mutually exclusive (no overlapping meanings between options)
- Balance positive and negative statements across both correct and incorrect options
- Technical complexity should be evenly distributed across all options

✅ DISTRACTOR QUALITY (critically important):
- ALL options must be from the SAME DOMAIN/TOPIC AREA as the question
- Distractors should be plausible alternative answers that test understanding
- DO NOT use options from unrelated domains (e.g., HR answers for security questions)
- Each distractor should represent a common mistake or partial understanding
- A knowledgeable person should need to think carefully to eliminate distractors
- For "select all that apply" questions, incorrect options should be things that SOUND related but aren't actually correct

❌ BAD EXAMPLE - VAGUE DISTRACTORS:
Question: "Which characteristics describe Multifactor Authentication?"
A) Requires multiple verification methods (CORRECT)
B) Uses different authentication factors (CORRECT)
C) Improves security (VAGUE - too generic)
D) Is more complex (VAGUE - too generic)
E) Costs more money (IRRELEVANT)
Problem: C, D, E are generic/vague. Only A and B sound specific.

✅ GOOD EXAMPLE - SPECIFIC DISTRACTORS:
Question: "Which characteristics describe Multifactor Authentication?"
A) Requires multiple independent verification methods (CORRECT)
B) Uses different types of authentication factors (CORRECT)
C) Stores credentials in a centralized password vault (Specific but wrong - describes Password Manager)
D) Generates time-based single-use codes (Specific but wrong - describes OTP, which is ONE factor)
E) Relies on biometric matching algorithms (Specific but wrong - describes Biometric Auth, which is ONE factor)
Problem solved: All options are specific authentication features. Student must know MFA definition precisely.

MANDATORY PRE-SUBMISSION VALIDATION:
Before returning your answer, you MUST verify:
1. Calculate character count for each option (excluding "A) ", "B) ", etc. prefixes)
2. Find the shortest and longest options
3. Verify: (longest - shortest) / shortest ≤ 0.30 (30%)
4. If validation FAILS, rewrite options to balance lengths BEFORE submitting
5. Only proceed to JSON output after length validation PASSES

VALIDATION CHECKLIST (review before submitting):
1. ✅ LENGTH CHECK (MANDATORY): Calculate and verify all options are within ±30% length
2. ✅ PLAUSIBILITY CHECK (MANDATORY): Read each distractor - does it sound like a specific characteristic of a related topic?
   - REJECT vague distractors: "improves performance", "enhances security", "costs more"
   - REQUIRE specific distractors: characteristics of actual related topics from the same domain
   - Ask: "If I didn't know the precise characteristics, could I genuinely believe this distractor?"
3. Shuffle mental order - do correct answers cluster together?
4. Check grammar: Do all options follow the same structural pattern?
5. Check balance: Are absolutes ("always"/"never") used equally in correct/incorrect options?
6. Check wording: Are correct answers using noticeably different language than distractors?
7. Independent verification: Can each option be evaluated independently without comparing to others?
8. Check domain relevance: Are ALL options from the same topic domain? (e.g., all security-related, not mixing HR/finance/etc.)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "Which of the following are characteristics of [topic]? (Select all that apply)",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option", "E) Fifth option"],
  "correctAnswers": ["A", "C", "E"],
  "explanation": "Options A, C, and E are correct because..."
}`
}

/**
 * Generate Fill in the Blank prompt
 */
function generateFillBlankPrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating a fill-in-the-blank question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Fill in the blank with 4 options to choose from
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}

INSTRUCTIONS:
1. Create a sentence with one blank (__________) where the CORRECT ANSWER is "${context.name}"
2. The sentence should describe or define "${context.name}" WITHOUT using its name in the question stem
3. Provide 4 options where ONE is "${context.name}" (or a close synonym/variant if the topic name is too long)
4. The blank should test ${bloomInfo.name.toLowerCase()} skills about "${context.name}"
5. Make distractors plausible terms from the same category/domain

CRITICAL RULE - TOPIC AS ANSWER:
- The correct answer MUST be the topic name: "${context.name}" (or a direct synonym/variant)
- The question describes WHAT "${context.name}" IS, DOES, or its PURPOSE
- The student must identify "${context.name}" from the description
- Example: "_____ is an encryption scheme applied to data-in-motion" → Correct Answer: "Transport / Communication Encryption"
- Example: "_____ is data that is being actively transferred between locations" → Correct Answer: "Data in Motion"
- DO NOT create questions where "${context.name}" appears in the stem and something else is the answer

❌ WRONG EXAMPLE - TOPIC IN STEM, GENERIC TERM AS ANSWER (DO NOT DO THIS):
Topic: "Pretexting"
Question: "Pretexting is a social engineering tactic where a team communicates a lie or half-truth to get someone to believe a _____."
Answer: "Falsehood" ❌ WRONG - "Falsehood" is a generic term, not the topic name
Problem: The topic name appears in the STEM, and the blank is for a generic concept. This tests vocabulary, not knowledge of Pretexting.

✅ CORRECT EXAMPLE - TOPIC AS ANSWER:
Topic: "Pretexting"
Question: "_____ is a social engineering tactic where a team communicates a lie or half-truth to make someone believe something false."
Answer: "Pretexting" ✅ CORRECT - The topic name IS the answer
Benefit: Tests if student can IDENTIFY "Pretexting" from its definition, which is actual knowledge of the topic.

QUALITY CONTROLS - ANTI-TELL-TALE RULES:
❌ NEVER use these patterns (they give away answers):
- One option significantly longer or shorter than others (±30% length difference is maximum)
- Grammatical mismatch (e.g., blank needs "an" but option starts with consonant)
- Only correct answer matches grammatically with the sentence
- Technical complexity ONLY in correct answer
- Repeating exact keywords from the sentence stem in only the correct option
- Options in alphabetical order where correct answer is always first/last

❌ NEVER reference source materials in questions OR explanations:
- Do NOT include "in the context of [source]" (e.g., "CompTIA Security+ SY0-701")
- Do NOT mention textbook names, certification exams, or course codes
- Do NOT reference learning objectives or domains by name
- Do NOT say "as defined in the [curriculum]" or "according to [certification]"
- Write questions AND explanations as if they are standalone educational content
- Focus on the TOPIC and CONCEPTS, not the source they came from

✅ EXPLANATION QUALITY:
- Explain WHY the correct answer is right using clear reasoning
- Do NOT cite external sources, curriculums, or certifications
- Use phrases like "This is correct because..." not "According to [source]..."
- Focus on conceptual understanding, not memorization of source material

✅ REQUIRED quality standards:
- All 4 options must be similar length (within ±30% of each other)
- All 4 options must fit grammatically in the blank
- All 4 options must be plausible terms/concepts from the same domain
- Distractors should be related terms that could confuse someone who hasn't mastered the concept
- All options should have similar technical complexity

✅ DISTRACTOR QUALITY (critically important):
- ALL options must be from the SAME DOMAIN/TOPIC AREA as the question
- For fill-in-blank, all options should be terms/concepts from the same category
- DO NOT use options from unrelated domains (e.g., HR terms for security blanks)
- Each distractor should be a plausible term that someone might confuse with the correct answer
- Example for "_____ is a type of firewall": All options should be firewall-related terms, not random security concepts

VALIDATION CHECKLIST (review before submitting):
1. Read sentence aloud with each option - does each fit grammatically?
2. Check length: Are all options within 30% of each other?
3. Check plausibility: Could each option seem correct to a struggling student?
4. Check domain relevance: Are ALL options from the same topic domain? (e.g., all firewall types, not mixing unrelated security terms)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "This is a sentence with __________ that needs to be filled.",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option B",
  "explanation": "The correct answer is [Option B] because..."
}`
}

/**
 * Generate Open-Ended prompt
 */
function generateOpenEndedPrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating an open-ended question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Essay or short answer (2-3 paragraphs expected)
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}
- Use action verbs: ${bloomInfo.actionVerbs.slice(0, 5).join(', ')}

INSTRUCTIONS:
1. Create a scenario-based question that requires explaining, analyzing, or applying "${context.name}"
2. The question should focus on "${context.name}" itself (not just mention it)
3. The question should require ${bloomInfo.name.toLowerCase()} skills about "${context.name}"
4. Provide a comprehensive model answer (2-3 paragraphs) that demonstrates understanding of "${context.name}"
5. Include key points that must be addressed about "${context.name}"
6. Create a clear rubric for grading

CRITICAL RULE - TEST THE TOPIC:
- The question must require deep understanding OF "${context.name}"
- Acceptable: "Explain how ${context.name} works", "Analyze the effectiveness of ${context.name}"
- Acceptable: "Design a solution using ${context.name}" (for Bloom level 6)
- AVOID: Asking about something else while merely mentioning "${context.name}" in the scenario

QUALITY CONTROLS:
❌ AVOID these question types:
- Vague questions without clear success criteria ("Discuss X")
- Questions that can be answered by listing facts (use lower Bloom levels instead)
- Questions with too many parts (limit to 2-3 main aspects)
- Questions requiring outside knowledge not in the context
- Leading questions that reveal the expected answer

❌ NEVER reference source materials in questions OR explanations:
- Do NOT include "in the context of [source]" (e.g., "CompTIA Security+ SY0-701")
- Do NOT mention textbook names, certification exams, or course codes
- Do NOT reference learning objectives or domains by name
- Do NOT say "as defined in the [curriculum]" or "according to [certification]"
- Write questions AND explanations as if they are standalone educational content
- Focus on the TOPIC and CONCEPTS, not the source they came from

✅ EXPLANATION QUALITY:
- Explain WHY the correct answer is right using clear reasoning
- Do NOT cite external sources, curriculums, or certifications
- Use phrases like "This is correct because..." not "According to [source]..."
- Focus on conceptual understanding, not memorization of source material

✅ REQUIRED quality standards:
- Question must have clear action verb aligned with Bloom level (${bloomInfo.actionVerbs.slice(0, 3).join(', ')})
- Scenario must be realistic and relevant to "${context.name}"
- Model answer should be 2-3 substantial paragraphs (150-250 words)
- Key points must be specific and measurable (not vague)
- Rubric must clearly define excellent vs. adequate vs. poor responses
- Question complexity should match Bloom level ${bloomLevel}

VALIDATION CHECKLIST:
1. Does the question clearly state what the student must do?
2. Does the scenario provide enough context without giving away the answer?
3. Are the key points specific enough to grade objectively?
4. Does the model answer demonstrate the Bloom level required?
5. Could two graders use the rubric consistently?

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "Scenario-based question here?",
  "modelAnswer": "Comprehensive answer covering all key points...",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "rubric": "Grading criteria and expectations"
}`
}

/**
 * Main prompt generation function
 */
export function generateQuestionPrompt(
  context: GraphRAGContext,
  bloomLevel: number,
  format: QuestionFormat
): string {
  // Validate Bloom level
  if (bloomLevel < 1 || bloomLevel > 6) {
    throw new Error(`Invalid Bloom level: ${bloomLevel}. Must be between 1 and 6.`)
  }

  // Validate format
  if (!QUESTION_FORMATS[format]) {
    throw new Error(`Invalid question format: ${format}`)
  }

  // Generate appropriate prompt based on format
  switch (format) {
    case 'mcq_single':
      return generateMCQSinglePrompt(context, bloomLevel)
    case 'mcq_multi':
      return generateMCQMultiPrompt(context, bloomLevel)
    case 'fill_blank':
      return generateFillBlankPrompt(context, bloomLevel)
    case 'open_ended':
      return generateOpenEndedPrompt(context, bloomLevel)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Get format info
 */
export function getQuestionFormatInfo(format: QuestionFormat): QuestionFormatInfo {
  return QUESTION_FORMATS[format]
}

/**
 * Get Bloom level info
 */
export function getBloomLevelInfo(level: number): BloomLevelInfo {
  return BLOOM_LEVELS[level]
}
