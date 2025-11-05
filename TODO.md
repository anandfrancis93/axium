# Axium Development Tasks

This file tracks all development tasks for the Axium intelligent learning platform.
**Important**: Update this file immediately when completing tasks. Never batch updates.

---

## Current Sprint - MVP Phase 1

### ✅ Completed
- [x] Initialize Next.js project with TypeScript and Tailwind
- [x] Create comprehensive database schema SQL file
- [x] Create Supabase client utilities and middleware
- [x] Build Google SSO login page and auth callback
- [x] Create comprehensive project README and documentation
- [x] Add CLAUDE.md with best practices and development guidelines
- [x] Implement neumorphic design system (#0a0a0a background)
  - [x] Create neumorphic CSS components and utilities
  - [x] Update login page with neumorphic design
  - [x] Update dashboard with neumorphic design
  - [x] Update auth error page with neumorphic design
  - [x] Add PWA manifest.json
  - [x] Configure PWA meta tags in layout
  - [x] Create favicon.svg
  - [x] Add icon generation guide (public/ICONS.md)

### ✅ Recently Completed
- [x] Set up Supabase project and configure environment variables
  - [x] Create Supabase account and project
  - [x] Enable pgvector extension
  - [x] Run schema.sql to create all tables
  - [x] Configure Google OAuth in Supabase
  - [x] Get API keys (Supabase, OpenAI, xAI)
  - [x] Add all keys to `.env.local`
  - [x] Test authentication flow
- [x] Build document upload and chunking pipeline
  - [x] Create upload UI in admin dashboard (`/admin`)
  - [x] Add file validation (PDF, text input, max size)
  - [x] Implement PDF text extraction (`pdf-parse` library)
  - [x] Implement semantic chunking (paragraph-aware, ~1000 chars)
  - [x] Generate embeddings via OpenAI (`text-embedding-3-small`)
  - [x] Store chunks in `knowledge_chunks` table
  - [x] Associate chunks with chapters
  - [x] Add progress indicators and loading states
  - [x] Handle errors gracefully with user feedback
- [x] Create AI integration for question generation (using xAI Grok instead of Claude)
  - [x] Set up xAI Grok client (`grok-4-fast-reasoning`)
  - [x] Create prompt templates for all 6 Bloom levels
  - [x] Implement RAG retrieval with vector similarity search
  - [x] Generate questions using retrieved context (top 5 chunks)
  - [x] Parse and validate Grok JSON responses
  - [x] Store generated questions in database
  - [x] Add error handling and detailed error messages
  - [x] Add topic extraction from uploaded content
  - [x] Add random question generation feature
  - [x] Implement anti-telltale quality controls
- [x] Build admin UI for content and question management
  - [x] Subject and chapter management
  - [x] Document upload interface
  - [x] Question generator with manual and random modes
  - [x] Generated questions preview

### 🚧 In Progress
Currently: Testing question generation quality

### 📋 To Do - Core Features

#### Learning Session UI
- [ ] Build learning session UI and flow
  - [ ] Create session start page (`/learn`)
  - [ ] Implement topic selection UI
  - [ ] Build question display component
  - [ ] Add answer input (MCQ and open-ended)
  - [ ] Add confidence slider (1-5)
  - [ ] Create answer submission handler
  - [ ] Show feedback after submission
  - [ ] Display explanation for correct answer
  - [ ] Add progress indicators (questions answered, time, etc.)
  - [ ] Implement session persistence

#### Progression System
- [ ] Implement rule-based progression system (pre-RL)
  - [ ] Create progression rules configuration (`lib/progression/rules.ts`)
  - [ ] Implement mastery calculation function
  - [ ] Create level advancement logic
  - [ ] Add prerequisite checking
  - [ ] Implement confidence calibration tracking
  - [ ] Create reward calculation function
  - [ ] Update user progress after each answer
  - [ ] Add automatic review triggers for low mastery
  - [ ] Create topic selection algorithm (rule-based)

#### Progress Tracking & Visualization
- [ ] Create progress tracking and mastery visualization
  - [ ] Build dashboard statistics cards
  - [ ] Create mastery heatmap (topic × Bloom level)
  - [ ] Add topic progress bars
  - [ ] Create learning history timeline
  - [ ] Add confidence calibration chart
  - [ ] Show subject/chapter overview
  - [ ] Display recent activity feed
  - [ ] Add achievement badges (optional)

---

## Future Phases

### Phase 2 - Enhanced Learning
- [ ] Bloom 4-6 questions with AI grading
- [ ] Multiple question types (analogies, scenarios, etc.)
- [ ] Detailed analytics dashboard
- [ ] Learning insights and recommendations

### Phase 3 - RL Integration
- [ ] Data collection for RL training
- [ ] Contextual bandit implementation
- [ ] A/B testing RL vs rule-based
- [ ] Reward function optimization

### Phase 4 - Advanced Features
- [ ] Spaced repetition system
- [ ] Metacognition prompts
- [ ] Fluid vs crystallized tracking
- [ ] Multi-user support
- [ ] Admin UI for content management
- [ ] Mobile responsive optimization
- [ ] Export learning data

---

## Blockers

**Current Blockers**: None

**Resolved Blockers**:
- ~~Need to choose database (Supabase vs Firebase + Pinecone)~~ - Resolved: Chose Supabase
- ~~Decide on auth strategy~~ - Resolved: Google SSO only

---

## Notes

- Subject choice pending from user - this will determine initial data seeding
- Focus on Bloom levels 1-3 for MVP (Remember, Understand, Apply)
- RL system deferred to Phase 3 - use rule-based progression for now
- Admin UI deferred - use SQL for initial content management

---

## Definition of Done

A task is considered "done" when:
1. ✅ Code is written and tested
2. ✅ No known bugs or errors
3. ✅ Type-safe (no TypeScript `any`)
4. ✅ Documentation updated (if needed)
5. ✅ Follows patterns in CLAUDE.md
6. ✅ Committed to git with descriptive message
7. ✅ This TODO.md file is updated

---

**Last Updated**: 2025-11-05
**Current Phase**: MVP Phase 1 - Core Features ✅ (75% Complete)
**Next Milestone**: Build Learning Session UI (Student Quiz Interface)
