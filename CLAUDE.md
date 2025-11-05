# Claude Development Guide for Axium

This document outlines the best practices, patterns, and conventions for developing the Axium intelligent learning platform. Following these guidelines ensures maintainable, testable, and scalable code.

---

## Core Principles

### 1. DRY Principle - Don't Repeat Yourself

**Never duplicate code logic.** Extract common functionality into reusable utilities.

#### ❌ Bad Example:
```typescript
// In multiple files...
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

#### ✅ Good Example:
```typescript
// lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Usage everywhere
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**Apply to Axium:**
- Create utility functions in `lib/` for common operations
- Shared database queries go in `lib/db/` (to be created)
- Common UI components go in `components/` (to be created)
- Bloom level helpers, mastery calculations, etc. must be centralized

---

### 2. Single Source of Truth

**One canonical source for each piece of data or logic.** Bug fixes and updates apply everywhere automatically.

#### Examples in Axium:

**Bloom Levels:**
```typescript
// lib/types/database.ts - SINGLE SOURCE OF TRUTH
export enum BloomLevel {
  Remember = 1,
  Understand = 2,
  Apply = 3,
  Analyze = 4,
  Evaluate = 5,
  Create = 6,
}

export const BLOOM_LEVEL_NAMES: Record<BloomLevel, string> = {
  [BloomLevel.Remember]: 'Remember',
  // ... etc
}
```

**Database Schema:**
- `supabase/schema.sql` is the single source of truth for database structure
- Never manually alter tables in production
- Always update schema.sql first, then apply migrations

**Type Definitions:**
- `lib/types/database.ts` is the single source for all database types
- Never create duplicate type definitions
- Import from this file everywhere

---

### 3. Maintainability

**Code should be easy to understand, modify, and extend.**

#### File Organization
```
lib/
├── supabase/          # Supabase utilities
├── types/             # Type definitions
├── db/                # Database queries and operations
├── ai/                # Claude and OpenAI integrations
├── rag/               # RAG pipeline (chunking, embeddings)
├── progression/       # Learning progression logic
└── utils/             # General utilities

components/
├── ui/                # Reusable UI components
├── learning/          # Learning-specific components
├── dashboard/         # Dashboard components
└── auth/              # Auth components

app/
├── (auth)/           # Auth routes (login, signup)
├── (protected)/      # Protected routes (dashboard, learn)
└── api/              # API routes
```

#### Naming Conventions
- **Files**: kebab-case (`user-progress.ts`)
- **Components**: PascalCase (`UserProgress.tsx`)
- **Functions**: camelCase (`calculateMastery`)
- **Constants**: UPPER_SNAKE_CASE (`BLOOM_LEVEL_NAMES`)
- **Types/Interfaces**: PascalCase (`UserProgress`, `MasteryScores`)

#### Code Comments
```typescript
// ❌ Bad: Obvious comments
// Get user
const user = await getUser()

// ✅ Good: Explain WHY, not WHAT
// We need to check prerequisites before unlocking the next Bloom level
// to ensure mastery-based progression
if (prerequisitesMet && masteryScore >= UNLOCK_THRESHOLD) {
  await unlockNextLevel()
}
```

#### Function Size
- **Max 50 lines** per function
- If longer, break into smaller functions
- Each function should do ONE thing

#### Error Handling
```typescript
// ✅ Always handle errors explicitly
try {
  const result = await generateQuestion(topic, bloomLevel)
  return result
} catch (error) {
  console.error('Failed to generate question:', error)
  // Decide: retry, fallback, or propagate?
  throw new Error('Question generation failed', { cause: error })
}
```

---

### 4. Testability

**Write code that's easy to test.**

#### Pure Functions
```typescript
// ✅ Pure function - easy to test
export function calculateMasteryScore(
  correct: number,
  total: number
): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

// Test:
expect(calculateMasteryScore(8, 10)).toBe(80)
```

#### Avoid Side Effects
```typescript
// ❌ Hard to test - side effects
async function updateProgress() {
  const user = await getCurrentUser() // Database call
  const progress = await getProgress(user.id) // Database call
  progress.score += 10
  await saveProgress(progress) // Database call
}

// ✅ Easy to test - dependency injection
async function updateProgress(
  userId: string,
  scoreIncrement: number,
  deps: { getProgress: Function, saveProgress: Function }
) {
  const progress = await deps.getProgress(userId)
  progress.score += scoreIncrement
  await deps.saveProgress(progress)
  return progress
}
```

#### Separate Business Logic from I/O
```typescript
// ✅ Business logic (pure)
export function shouldUnlockNextLevel(
  masteryScore: number,
  attempts: number,
  threshold: number = 80
): boolean {
  return masteryScore >= threshold && attempts >= 3
}

// ✅ I/O layer (uses business logic)
export async function checkAndUnlockLevel(userId: string, topicId: string) {
  const progress = await getProgress(userId, topicId)

  if (shouldUnlockNextLevel(progress.masteryScore, progress.attempts)) {
    await unlockLevel(userId, topicId, progress.currentLevel + 1)
    return true
  }
  return false
}
```

---

### 5. Task Management - Always Use Checklists

**Maintain a visible checklist for all development tasks. Mark items as complete only when fully done.**

This practice ensures:
- **Accountability**: Nothing gets forgotten
- **Progress Tracking**: Easy to see what's done and what's next
- **Context Switching**: Pick up where you left off
- **Collaboration**: Others can see status at a glance

#### Implementation Methods

**Option 1: TODO.md File** (Recommended for projects)
```markdown
# Axium Development Tasks

## Current Sprint

### In Progress
- [ ] Build document upload and chunking pipeline
  - [x] Create upload UI component
  - [x] Add file validation
  - [ ] Implement PDF parsing
  - [ ] Generate chunks
  - [ ] Store in database

### To Do
- [ ] Create Claude API integration for question generation
- [ ] Build learning session UI and flow
- [ ] Implement rule-based progression system

### Completed
- [x] Initialize Next.js project with TypeScript and Tailwind
- [x] Create comprehensive database schema SQL file
- [x] Create Supabase client utilities and middleware
- [x] Build Google SSO login page and auth callback
```

**Option 2: Code Comments** (For small features)
```typescript
// lib/rag/document-processor.ts

/*
 * TODO: Document Processing Pipeline
 * - [x] Accept PDF upload
 * - [x] Extract text content
 * - [ ] Split into chunks (semantic chunking)
 * - [ ] Generate embeddings
 * - [ ] Store in knowledge_chunks table
 * - [ ] Update chapter metadata
 */

export async function processDocument(file: File, chapterId: string) {
  // Implementation
}
```

**Option 3: GitHub Issues/Projects** (For team collaboration)
- Create issues for each major task
- Use labels: `in-progress`, `blocked`, `completed`
- Link PRs to issues
- Track in project board

#### Rules for Task Management

1. **Create Checklist BEFORE Starting Work**
   - Break down the feature into discrete tasks
   - Each task should be completable in < 2 hours
   - Write acceptance criteria

2. **Update Status Immediately**
   - Mark `[ ]` as `[x]` as soon as task is done
   - Don't batch updates - do it in real-time
   - If blocked, note the blocker

3. **Define "Done" Clearly**
   - Code written AND tested
   - No known bugs
   - Documentation updated (if needed)
   - Committed to version control

4. **Review Regularly**
   - Daily: Check what's in progress
   - Weekly: Review completed vs planned
   - Move stale tasks to backlog if needed

#### Example Workflow

```markdown
## Feature: Question Generation with RAG

### Tasks
- [x] Set up Claude API client
- [x] Create prompt templates for each Bloom level
- [x] Implement RAG retrieval function
- [ ] Generate question from retrieved context
  - [x] Implement basic generation
  - [ ] Add retry logic for rate limits
  - [ ] Add caching for generated questions
- [ ] Parse and validate Claude response
- [ ] Store question in database
- [ ] Add unit tests
- [ ] Add error handling for edge cases

**Current Status**: Working on retry logic (task 4.2)
**Blockers**: None
**Next**: Complete retry logic, then move to response parsing
```

#### Benefits in Axium Development

**Scenario: Building Learning Session Flow**
```markdown
# Learning Session Implementation

## Backend
- [x] Create session start endpoint (`/api/session/start`)
- [x] Implement topic selection logic
- [ ] Create question fetch endpoint
  - [x] RAG retrieval
  - [ ] Claude generation
  - [ ] Response formatting
- [ ] Create answer submission endpoint
- [ ] Implement reward calculation
- [ ] Update user progress

## Frontend
- [ ] Create session page UI
- [ ] Build question display component
- [ ] Add answer input (MCQ and open-ended)
- [ ] Add confidence slider
- [ ] Show feedback after submission
- [ ] Display progress indicators

## Testing
- [ ] Test with Bloom level 1-3 questions
- [ ] Test confidence calibration
- [ ] Test session persistence
- [ ] Test error states
```

**This checklist ensures:**
- No forgotten tasks (e.g., "Did we add error handling?")
- Clear handoff points (backend done → frontend can start)
- Testable milestones

#### Anti-Patterns to Avoid

❌ **Don't**:
- Mark tasks as done prematurely
- Create vague tasks ("Make it work")
- Let checklists go stale without updates
- Skip checklist creation for "small" tasks

✅ **Do**:
- Be honest about completion status
- Break down large tasks into smaller ones
- Update checklists as you discover new subtasks
- Use checklists even for bug fixes

---

## Axium-Specific Best Practices

### 6. Database Operations

#### Always Use Typed Queries
```typescript
import { Database } from '@/lib/types/database'

// ✅ Type-safe query
const { data, error } = await supabase
  .from('user_progress')
  .select('*')
  .eq('user_id', userId)
  .single()

if (error) throw error
// `data` is fully typed
```

#### Centralize Queries
```typescript
// lib/db/progress.ts
export async function getUserProgress(userId: string, topicId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single()

  if (error) throw error
  return data
}

// Usage: Don't write raw queries in components/pages
const progress = await getUserProgress(user.id, topic.id)
```

#### Use Transactions for Related Updates
```typescript
// ✅ Update response + progress in transaction
const { error } = await supabase.rpc('submit_answer', {
  p_user_id: userId,
  p_question_id: questionId,
  p_is_correct: isCorrect,
  p_confidence: confidence,
  // ... function handles both inserts atomically
})
```

---

### 7. AI Integration (Claude & OpenAI)

#### Centralize AI Clients
```typescript
// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateQuestion(
  topic: string,
  bloomLevel: number,
  ragContext: string
) {
  // Single implementation for all question generation
}
```

#### Prompt Engineering - Use Constants
```typescript
// lib/ai/prompts.ts
export const QUESTION_GENERATION_PROMPT = `
You are an expert educator creating questions based on Bloom's Taxonomy.

Topic: {topic}
Bloom Level: {bloomLevel} - {bloomDescription}

Context from learning materials:
{ragContext}

Generate a {questionType} question that tests {bloomSkill}.
`

// Usage:
const prompt = QUESTION_GENERATION_PROMPT
  .replace('{topic}', topic)
  .replace('{bloomLevel}', bloomLevel.toString())
  // ...
```

#### Error Handling for AI Calls
```typescript
// ✅ Always handle rate limits and errors
export async function generateQuestionWithRetry(
  topic: string,
  bloomLevel: number,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateQuestion(topic, bloomLevel)
    } catch (error) {
      if (error.status === 429) { // Rate limit
        await sleep(Math.pow(2, i) * 1000) // Exponential backoff
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
```

---

### 8. RAG Pipeline

#### Chunking Strategy - Make It Configurable
```typescript
// lib/rag/chunking.ts
export interface ChunkingConfig {
  chunkSize: number        // characters per chunk
  chunkOverlap: number     // overlap between chunks
  strategy: 'fixed' | 'semantic' | 'paragraph'
}

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  chunkSize: 1000,
  chunkOverlap: 200,
  strategy: 'semantic'
}

export function chunkDocument(
  content: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): string[] {
  // Implementation
}
```

#### Embedding Generation - Batch Process
```typescript
// ✅ Process in batches to avoid rate limits
export async function generateEmbeddings(
  chunks: string[],
  batchSize: number = 20
): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const batchEmbeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })
    embeddings.push(...batchEmbeddings.data.map(e => e.embedding))

    // Rate limiting
    if (i + batchSize < chunks.length) {
      await sleep(1000)
    }
  }

  return embeddings
}
```

---

### 9. Progression System

#### Rule-Based Progression - Configuration Over Code
```typescript
// lib/progression/rules.ts
export interface ProgressionRules {
  minAttemptsForAdvancement: number
  masteryThreshold: number           // 0-100
  confidenceCalibrationWeight: number
  autoReviewThreshold: number        // If mastery drops below, trigger review
}

export const DEFAULT_PROGRESSION_RULES: ProgressionRules = {
  minAttemptsForAdvancement: 3,
  masteryThreshold: 80,
  confidenceCalibrationWeight: 0.3,
  autoReviewThreshold: 60,
}

export function shouldAdvanceBloomLevel(
  progress: UserProgress,
  rules: ProgressionRules = DEFAULT_PROGRESSION_RULES
): boolean {
  const currentLevelMastery = progress.mastery_scores[progress.current_bloom_level]
  return (
    progress.total_attempts >= rules.minAttemptsForAdvancement &&
    currentLevelMastery >= rules.masteryThreshold
  )
}
```

#### RL State - Prepare for Future
```typescript
// lib/progression/rl.ts
export interface RLConfig {
  explorationRate: number      // epsilon for epsilon-greedy
  learningRate: number         // alpha
  discountFactor: number       // gamma
  strategy: 'random' | 'ucb' | 'thompson' | 'epsilon-greedy'
}

// For now, use rule-based, but structure allows easy RL integration
export async function selectNextTopic(
  userId: string,
  config: RLConfig
): Promise<{ topicId: string, bloomLevel: number }> {
  // Currently: rule-based
  // Future: RL-based selection
}
```

---

### 10. Component Architecture

#### Server vs Client Components
```typescript
// ✅ Server Component (default) - for data fetching
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()
  // Fetch data on server
  return <DashboardView user={user} />
}

// ✅ Client Component - for interactivity
// components/dashboard/SignOutButton.tsx
'use client'
export function SignOutButton() {
  const handleSignOut = () => { /* ... */ }
  return <button onClick={handleSignOut}>Sign Out</button>
}
```

#### Props Drilling - Avoid with Context
```typescript
// ✅ Use context for deeply nested props
// lib/context/learning-session.tsx
'use client'
import { createContext, useContext } from 'react'

interface LearningSessionContext {
  currentTopic: Topic
  currentBloomLevel: number
  onAnswer: (answer: string, confidence: number) => void
}

const LearningSessionContext = createContext<LearningSessionContext | null>(null)

export function LearningSessionProvider({ children, value }) {
  return (
    <LearningSessionContext.Provider value={value}>
      {children}
    </LearningSessionContext.Provider>
  )
}

export function useLearningSession() {
  const context = useContext(LearningSessionContext)
  if (!context) throw new Error('Must be used within LearningSessionProvider')
  return context
}
```

---

### 11. Performance Best Practices

#### Minimize Client-Side JavaScript
- Use Server Components by default
- Only use `'use client'` when absolutely necessary
- Lazy load heavy components

#### Database Query Optimization
```typescript
// ❌ N+1 query problem
for (const topic of topics) {
  const progress = await getProgress(userId, topic.id) // N queries
}

// ✅ Single query with join
const progressData = await supabase
  .from('user_progress')
  .select('*, topics(*)')
  .eq('user_id', userId)
```

#### Caching Strategy
```typescript
// Use Next.js caching
export const revalidate = 3600 // Revalidate every hour

// Or use React cache
import { cache } from 'react'

export const getTopics = cache(async (chapterId: string) => {
  // This will be cached for the request lifecycle
  return await supabase.from('topics').select('*').eq('chapter_id', chapterId)
})
```

---

### 12. Error Handling

#### User-Facing Errors
```typescript
// lib/errors.ts
export class UserFacingError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string
  ) {
    super(message)
  }
}

// Usage
throw new UserFacingError(
  'Database query failed: connection timeout',
  'Sorry, we couldn\'t load your progress. Please try again.',
  'DB_TIMEOUT'
)
```

#### Error Boundaries
```typescript
// components/ErrorBoundary.tsx
'use client'
export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

### 13. Type Safety

#### Never Use `any`
```typescript
// ❌ Loses type safety
function processData(data: any) { }

// ✅ Use proper types or generics
function processData<T extends { id: string }>(data: T) { }

// ✅ Unknown for truly unknown data
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}
```

#### Validate External Data
```typescript
// ✅ Validate API responses, user input, file uploads
import { z } from 'zod'

const QuestionSchema = z.object({
  question: z.string().min(10),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
})

export function validateQuestion(data: unknown) {
  return QuestionSchema.parse(data) // Throws if invalid
}
```

---

### 14. Security Best Practices

#### Never Expose Secrets
```typescript
// ❌ NEVER
const apiKey = 'sk-ant-...'

// ✅ Use environment variables
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
```

#### Sanitize User Input
```typescript
// ✅ Always sanitize before storing or using
import DOMPurify from 'isomorphic-dompurify'

function sanitizeUserAnswer(answer: string): string {
  return DOMPurify.sanitize(answer, { ALLOWED_TAGS: [] })
}
```

#### Use Row-Level Security (RLS)
- RLS policies already set in schema.sql
- Never disable RLS on user tables
- Always filter by `auth.uid()` in policies

---

### 15. Documentation

#### Function Documentation
```typescript
/**
 * Calculates the reward for a user response based on correctness,
 * confidence calibration, and response time.
 *
 * @param isCorrect - Whether the answer was correct
 * @param confidence - User's confidence level (1-5)
 * @param timeTaken - Time taken in seconds
 * @param bloomLevel - Current Bloom level (1-6)
 * @returns Reward value (typically -1 to 1)
 *
 * @example
 * const reward = calculateReward(true, 4, 30, 3)
 * // => 0.85 (correct, well-calibrated, reasonable time)
 */
export function calculateReward(
  isCorrect: boolean,
  confidence: number,
  timeTaken: number,
  bloomLevel: number
): number {
  // Implementation
}
```

#### README Files in Each Directory
```
lib/rag/README.md - Explains RAG pipeline
lib/progression/README.md - Explains progression logic
components/learning/README.md - Learning component usage
```

---

### 16. Git Commit Practices

#### Conventional Commits
```bash
feat: Add question generation with Claude
fix: Correct mastery score calculation
docs: Update CLAUDE.md with RAG best practices
refactor: Extract common DB queries to lib/db
test: Add tests for progression rules
chore: Update dependencies
```

#### Small, Focused Commits
- One logical change per commit
- Easier to review, revert, or cherry-pick
- Write descriptive commit messages

---

### 17. UI/UX Design System - Minimal Neumorphic

**Philosophy**: Clean neumorphic design with essential elements only. Minimize cognitive load.

#### Core Principles
1. **One primary action per view** - Clear next step
2. **Progressive disclosure** - Show only what's needed now
3. **Consistent patterns** - Learn once, use everywhere
4. **Scannable hierarchy** - F-pattern friendly
5. **Generous whitespace** - Reduce visual overwhelm

#### Color Palette (Minimal)
```typescript
// Base
--background: #0a0a0a

// Actions & Feedback
--primary: #3b82f6        // Blue (single action color)
--success: #10b981        // Green
--warning: #f59e0b        // Yellow
--error: #ef4444          // Red

// Text (Only 2 levels)
--text-primary: gray-200
--text-secondary: gray-500
```

#### Icons (Functional Only)
```typescript
// Import from components/icons.tsx - NO EMOJIS EVER

// Size hierarchy:
18px - Button icons
20px - Section header icons
40px - Empty state icons

// Usage rules:
- Use only when they reduce comprehension time
- Max 1 icon per UI element
- NO decorative icons
```

#### Components (Essential Set)
```typescript
// Containers
.neuro-card           // Main content containers
.neuro-inset          // Inputs, sunken surfaces

// Actions
.neuro-btn-primary    // Primary action (limit 1 per section)
.neuro-btn            // Secondary actions
.neuro-btn-error      // Destructive actions

// Avoid: Nested cards, excessive badges
```

#### Typography (3-Level Max)
```typescript
// Page title → Section → Body
text-2xl font-bold        // Page titles
text-xl font-semibold     // Section headers
text-sm                   // Body/metadata

// Max 3 levels per page
```

#### Spacing (Generous Whitespace)
```typescript
// Gaps - Clear separation
gap-4, gap-6              // Not gap-2/3 (too cramped)

// Padding - Breathing room
p-6, p-8                  // Never cramped

// Between sections
mb-6, mb-8                // Clear breaks
```

#### Responsiveness (Mobile-First, Fluid)
```typescript
// Breakpoints
sm:  640px   (mobile landscape)
md:  768px   (tablet)
lg:  1024px  (desktop)
xl:  1280px  (large desktop)
2xl: 1536px  (extra large)

// Custom: 1440px, 1920px (FHD), 2560px (QHD), 3840px (4K)

// Scaling: 320px → 4K (3840px)
Mobile:    1 column
Tablet:    2 columns
Desktop:   3-4 columns
4K:        Max-width centered (7xl: 1280px)

// Pattern
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Grid scaling
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4

// NO horizontal scroll at any breakpoint
// Touch targets: 44×44px minimum on mobile
```

#### Interactive (Predictable)
```typescript
// Buttons - Consistent hover
hover:translateY(-2px)    // Subtle lift
active:translateY(0)      // Press down
transition-all duration-200

// Selection
ring-2 ring-blue-400

// NO excessive animations
```

#### Common Patterns

**Section Header**
```tsx
<div className="flex items-center gap-3">
  <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
    <IconName size={20} className="text-blue-400" />
  </div>
  <h2 className="text-xl font-semibold text-gray-200">
    Section Title
  </h2>
</div>
```

**Empty State**
```tsx
<div className="neuro-inset p-8 rounded-lg text-center">
  <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
    <IconName size={40} className="text-gray-600" />
  </div>
  <div className="text-gray-400 text-lg font-semibold mb-2">
    No data yet
  </div>
  <div className="text-sm text-gray-600 mb-6">
    Description text here
  </div>
  <Link href="/action" className="neuro-btn-primary inline-flex items-center gap-2 px-6 py-3">
    <IconName size={18} />
    <span>Primary Action</span>
  </Link>
</div>
```

**Stats Card**
```tsx
<div className="neuro-stat group">
  <div className="flex items-center justify-between mb-3">
    <div className="text-sm text-blue-400 font-medium">Label</div>
    <IconName size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
  </div>
  <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
    {value}
  </div>
  <div className="text-xs text-gray-600 mt-2">
    Subtitle
  </div>
</div>
```

#### Reduce Cognitive Load Checklist
- ✅ Same button styles everywhere
- ✅ Same header pattern on all pages
- ✅ Same empty state pattern
- ✅ Limit choices (1-3 actions max)
- ✅ Hide advanced features until needed
- ❌ No redundant information
- ❌ No decorative elements
- ❌ No ambiguous actions
- ❌ NO EMOJIS - Use SVG icons only

#### Information Display
```typescript
// Progressive disclosure
Start with summary → Drill down for details

// Data tables
Max 10 rows → Paginate
Horizontal scroll on mobile if needed

// Stats grid
Max 4 cards per row (1→2→4 scaling)
```

---

## Quick Reference Checklist

Before committing code, verify:

**Code Quality**
- [ ] **Task checklist updated** (marked completed tasks as done)
- [ ] No duplicated logic (DRY)
- [ ] Single source of truth maintained
- [ ] Functions are small (<50 lines) and focused
- [ ] Proper error handling
- [ ] Type-safe (no `any`)
- [ ] Reusable components/utilities extracted
- [ ] Client components only when needed
- [ ] No secrets in code
- [ ] Sanitized user input
- [ ] Meaningful variable names
- [ ] Comments explain WHY, not WHAT
- [ ] Tests can be written easily
- [ ] Database queries are centralized
- [ ] AI calls have retry logic
- [ ] Performance considered (N+1 queries avoided)

**UI/UX Design**
- [ ] NO EMOJIS - SVG icons only (from components/icons.tsx)
- [ ] Max 1 primary action per section (neuro-btn-primary)
- [ ] Consistent header pattern (w-12 h-12 icon container)
- [ ] Empty states follow pattern (w-20 h-20 icon, centered)
- [ ] Generous spacing (gap-4/6, p-6/8, mb-6/8)
- [ ] Mobile-first responsive (grid-cols-1 sm:... lg:...)
- [ ] Max 3 typography levels per page
- [ ] Semantic colors (blue=primary, green=success, yellow=warning, red=error)
- [ ] Minimal cognitive load (no visual clutter)
- [ ] Predictable interactions (consistent hover/active states)

---

## File Location Guide

| Type | Location | Example |
|------|----------|---------|
| Database queries | `lib/db/` | `lib/db/progress.ts` |
| AI integrations | `lib/ai/` | `lib/ai/claude.ts` |
| RAG pipeline | `lib/rag/` | `lib/rag/embeddings.ts` |
| Progression logic | `lib/progression/` | `lib/progression/rules.ts` |
| Utilities | `lib/utils/` | `lib/utils/bloom.ts` |
| UI components | `components/ui/` | `components/ui/Button.tsx` |
| Learning components | `components/learning/` | `components/learning/QuestionCard.tsx` |
| Types | `lib/types/` | `lib/types/database.ts` |
| Constants | Same file or `lib/constants.ts` | `BLOOM_LEVEL_NAMES` |

---

## Conclusion

These practices ensure Axium remains maintainable, testable, and scalable as it grows. When in doubt:

1. **Track** - Update TODO.md immediately when completing tasks
2. **Extract** - Don't repeat yourself
3. **Type** - Make it type-safe
4. **Test** - Write testable code
5. **Document** - Explain complex logic
6. **Centralize** - One source of truth

### Daily Workflow

1. **Start of work**: Check `TODO.md` for current tasks
2. **During work**:
   - Follow patterns in this guide
   - Mark subtasks as done immediately
   - Add new tasks as you discover them
3. **Before commit**:
   - Run through Quick Reference Checklist
   - Update TODO.md with completed tasks
   - Commit with conventional commit message
4. **End of day**: Review progress, update "Current Status" in TODO.md

**See `TODO.md` for the current development task list.**

Happy coding! 🚀
