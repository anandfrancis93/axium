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

### 🚧 In Progress
Currently: Waiting for Supabase setup by user

### 📋 To Do - Setup & Configuration
- [ ] Set up Supabase project and configure environment variables
  - [ ] Create Supabase account and project
  - [ ] Enable pgvector extension
  - [ ] Run schema.sql to create all tables
  - [ ] Configure Google OAuth in Supabase
  - [ ] Get API keys (Supabase, Anthropic, OpenAI)
  - [ ] Add all keys to `.env.local`
  - [ ] Test authentication flow

### 📋 To Do - Core Features

#### Document Upload & RAG Pipeline
- [ ] Build document upload and chunking pipeline
  - [ ] Create upload UI component (`/dashboard/upload`)
  - [ ] Add file validation (PDF, max size, etc.)
  - [ ] Implement PDF text extraction (`lib/rag/pdf-parser.ts`)
  - [ ] Implement semantic chunking (`lib/rag/chunking.ts`)
  - [ ] Generate embeddings via OpenAI (`lib/rag/embeddings.ts`)
  - [ ] Store chunks in `knowledge_chunks` table
  - [ ] Associate chunks with chapters/topics
  - [ ] Add progress indicator for upload
  - [ ] Handle errors gracefully

#### Claude API Integration
- [ ] Create Claude API integration for question generation
  - [ ] Set up Claude client (`lib/ai/claude.ts`)
  - [ ] Create prompt templates for each Bloom level (`lib/ai/prompts.ts`)
  - [ ] Implement RAG retrieval function (`lib/rag/retrieval.ts`)
  - [ ] Generate questions using retrieved context
  - [ ] Add retry logic for rate limits
  - [ ] Parse and validate Claude responses
  - [ ] Store generated questions in database
  - [ ] Add caching for frequently asked topics
  - [ ] Add error handling and fallbacks

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
**Current Phase**: MVP Phase 1 - Foundation & Design ✅ (50% Complete)
**Next Milestone**: Complete Supabase setup → Build RAG pipeline
