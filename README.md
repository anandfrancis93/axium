# Axium - Intelligent Adaptive Learning Platform

A personalized AI learning platform that uses reinforcement learning, Bloom's Taxonomy, and knowledge dimensions to create adaptive learning paths. Built with Next.js, Supabase, and Grok AI.

## 🚀 Current Status

**Fully operational MVP** with advanced RL-based adaptive learning, comprehensive performance tracking, and AI-powered question generation.

## ✨ Key Features

### 🎯 Adaptive Learning Engine
- **Thompson Sampling (Multi-Armed Bandit)**: Optimizes topic and Bloom level selection based on learning potential
- **Progressive Bloom Unlocking**: Master Level N to unlock Level N+1
- **6 Knowledge Dimensions**: Orthogonal learning perspectives (Definition, Example, Comparison, Scenario, Implementation, Troubleshooting)
- **6 RL Phases**: Tracks learning journey from Cold Start → Meta-Learning
- **Multi-Component Reward System**: Learning Gain, Calibration, Recognition, Spacing, Engagement
- **Hierarchical Topic Structure**: Parent-child topic relationships with depth tracking

### 🧠 Cognitive Framework
- **Bloom's Taxonomy (6 Levels)**: Remember → Understand → Apply → Analyze → Evaluate → Create
- **Exponential Moving Average (EMA)**: Confidence-weighted mastery calculation
- **Confidence Calibration**: Detects overconfidence/underconfidence patterns
- **Recognition Method Tracking**: Memory vs. Recognition vs. Educated Guess vs. Random
- **Dimension-Specific Targeting**: Each dimension tests different learning perspectives

### 🤖 AI-Powered Question Generation
- **Grok 4 Fast Reasoning**: Generates contextual questions based on RAG-retrieved content
- **RAG (Retrieval-Augmented Generation)**: Semantic search using OpenAI embeddings over uploaded PDFs
- **Dimension-Aware**: Questions target specific knowledge dimensions at specific Bloom levels
- **Multiple Choice Questions**: With AI-generated distractors and explanations
- **User-Specific Question Banks**: Each user gets their own generated questions for spaced repetition
- **No Ephemeral Questions**: All questions stored in database with user_id and topic_id

### 📊 Performance Analytics
- **Mastery Heatmaps**: Per-topic Bloom level progress visualization
- **Comprehensive Mastery Matrix**: Bloom × Dimension performance tracking (36 cells per topic)
- **Recent Activity Feeds**: Detailed response history with context
- **RL Phase Indicators**: Visual progression through learning phases
- **Dimension Coverage**: Track exploration across 6 knowledge dimensions
- **Unique Question Tracking**: Separate counts for unique questions vs. total attempts
- **Reset Progress**: Complete data cleanup with pre-deletion counts

### 🎨 User Experience
- **Neumorphic Dark Theme**: Custom design system with raised/inset elements
- **4-Step Learning Flow**: Confidence → Answer → Recognition → Feedback
- **Contextual Tooltips**: Dynamic explanations for all metrics and values
- **Collapsible Sections**: Minimal cognitive load with progressive disclosure
- **Mobile Responsive**: Fluid scaling from 320px to 4K displays
- **Custom Modals**: Neumorphic confirmation and success dialogs

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 16 with Turbopack (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Neumorphic System
- **Database**: Supabase (PostgreSQL + pgvector)
- **Auth**: Supabase Auth with Google SSO
- **LLM**: Grok 4 Fast Reasoning (X.AI API)
- **Embeddings**: OpenAI text-embedding-3-small
- **Deployment**: Vercel

### Data Model

```
subjects
├── chapters[]
│   ├── topics[] (hierarchical with parent_topic_id)
│   │   ├── name, description
│   │   ├── parent_topic_id, depth, path
│   │   └── knowledge dimensions (6)
│   └── subject_dimension_config
│
user_progress
├── current_bloom_level (1-6)
├── mastery_scores{1-6} (EMA-based)
├── rl_phase (cold_start → meta_learning)
├── total_attempts, mastery_variance
└── confidence_calibration_error

user_topic_mastery (by topic_id)
├── user_id, topic_id, bloom_level
├── mastery_score (0-100, EMA)
├── questions_attempted, questions_correct
└── last_practiced_at

user_dimension_coverage
├── user_id, chapter_id, topic_id
├── bloom_level × dimension
├── unique_questions_answered[] (UUIDs)
├── times_tested, total_attempts
└── average_score (0-100)

rl_arm_stats (Thompson Sampling)
├── user_id, topic_id, bloom_level
├── successes, failures (Beta distribution)
└── last_selected_at

learning_sessions
├── user_id, chapter_id, subject_id
├── questions_answered, score, total_questions
└── completed_at

user_responses
├── user_id, question_id, session_id
├── topic_id, bloom_level
├── is_correct, confidence (1-5)
├── recognition_method
└── reward (multi-component)

questions (all stored, no ephemeral)
├── user_id (owner), topic_id
├── bloom_level, dimension
├── question_text, options[], question_type
├── correct_answer, explanation
├── source_type ('ai_generated_realtime')
└── generated via Grok + RAG
```

### Learning Flow

```
1. Thompson Sampling selects optimal (topic_id, bloom_level) arm
2. Check prerequisites and unlock status
3. RAG retrieves relevant chunks using vector similarity
4. Grok generates dimension-specific question
5. Question stored with user_id and topic_id for spaced repetition
6. User selects confidence level (1-5)
7. User answers question (MCQ single/multi select)
8. User indicates recognition method
9. System calculates multi-component reward:
   - Learning Gain (-10 to +10)
   - Calibration (-5 to +5)
   - Recognition (-3 to +5)
   - Spacing (0 to +5)
   - Engagement (-3 to 0)
10. Update mastery scores (EMA with confidence weighting)
11. Update Thompson Sampling statistics (Beta distribution)
12. Track dimension coverage with unique question IDs
13. Update RL phase based on attempts and variance
14. Check Bloom level unlock conditions
15. Repeat with improved arm selection
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** (free tier sufficient)
- **X.AI API key** (Grok 4 Fast Reasoning)
- **OpenAI API key** (text-embedding-3-small)
- **Google Cloud Console** (OAuth 2.0 credentials)

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/axium.git
   cd axium
   npm install
   ```

2. **Set up Supabase**
   - Create project at https://supabase.com
   - Enable pgvector extension
   - Run migrations from `supabase/migrations/` in order
   - Configure Google OAuth in Supabase Auth settings

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Required variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   XAI_API_KEY=xai-...
   OPENAI_API_KEY=sk-...
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

### Initial Setup

1. **Sign in** at `/login` with Google
2. **Go to Admin** at `/admin` to:
   - Add subjects and chapters
   - Upload PDFs (will be chunked and embedded)
   - Generate questions for chapters
3. **Start Learning** at `/subjects/[subject]/[chapter]/quiz`
4. **Track Progress** at `/performance/[subject]/[chapter]` or `/[topic]`

## 📁 Project Structure

```
axium/
├── app/
│   ├── admin/                    # Admin UI for content management
│   ├── subjects/[subject]/[chapter]/
│   │   └── quiz/                # 4-step learning interface
│   ├── performance/[subject]/[chapter]/
│   │   ├── page.tsx             # Chapter performance analytics
│   │   └── [topic]/page.tsx     # Topic dimension matrix
│   ├── api/
│   │   ├── rl/
│   │   │   ├── next-question/   # Thompson Sampling + question generation
│   │   │   ├── submit-response/ # Reward calculation + mastery updates
│   │   │   └── reset-progress/  # Delete all user progress data
│   │   └── questions/
│   │       └── generate/        # Bulk question generation
│   └── layout.tsx               # Root layout with auth
│
├── lib/
│   ├── supabase/                # Client/server utilities
│   ├── rl/
│   │   ├── rewards.ts           # Multi-component reward system
│   │   ├── mastery.ts           # EMA mastery calculation
│   │   └── thompson-sampling.ts # Arm selection logic
│   ├── utils/
│   │   ├── rl-phase.ts          # RL phase tracking
│   │   └── question-format.ts   # Question type handling
│   └── types/
│       └── database.ts          # TypeScript types
│
├── components/
│   ├── HamburgerMenu.tsx        # Navigation
│   ├── Modal.tsx                # Custom neumorphic modal
│   ├── Tooltip.tsx              # Tooltip with cursor tracking
│   ├── RLPhaseBadge.tsx         # RL phase indicator
│   └── icons.tsx                # SVG icon library
│
├── supabase/
│   ├── schema.sql               # Complete database schema
│   └── migrations/              # Incremental migrations
│       ├── 20250107_*.sql       # Recent: topic_id migration, dimensions update
│       └── 20250108_*.sql       # Topic hierarchy support
│
├── scripts/
│   ├── extract-all-topics.mjs   # Topic extraction from PDFs
│   └── generate-knowledge.mjs   # Grok-powered knowledge base generation
│
├── CLAUDE.md                    # Development guidelines (CRITICAL)
└── README.md                    # This file
```

## 🎓 Key Concepts

### Thompson Sampling (Multi-Armed Bandit)
Each (topic_id, bloom_level) combination is an "arm" in a multi-armed bandit. The system maintains Beta distributions for each arm and samples to balance exploration (trying new topics) vs. exploitation (focusing on high-reward topics). Uses `topic_id` (UUID) for precise tracking across hierarchical topics.

### Multi-Component Rewards
- **Learning Gain**: Mastery improvement (primary signal)
- **Calibration**: Confidence vs. performance alignment
- **Recognition**: Retrieval strength (memory > recognition > guess)
- **Spacing**: Retention over time (rewards long gaps)
- **Engagement**: Difficulty appropriateness (penalty only)

### Knowledge Dimensions (6)
1. **Definition** - What is it? Core terminology, fundamental concepts, and definitions
2. **Example** - How is it used? Real-world instances, practical applications, and use cases
3. **Comparison** - How is it different? Similarities, differences, and relationships between concepts
4. **Scenario** - What should you do? Situational problem-solving and decision-making
5. **Implementation** - How do you configure it? Step-by-step procedures, setup, and configuration
6. **Troubleshooting** - Why isn't it working? Diagnostic reasoning, problem identification, and solutions

Each dimension tests a different learning perspective at each Bloom level, creating a 6×6 = 36 cell mastery matrix per topic.

### RL Learning Phases (6)
1. **Cold Start** (< 10 attempts): Random exploration, gathering initial data
2. **Exploration** (10-50): Testing different strategies, finding what works
3. **Optimization** (50-150): Focusing on high-value actions, refining approach
4. **Stabilization** (150+, low variance): Stable, consistent performance, converged policy
5. **Adaptation** (150+, changing): Responding to performance changes, continuous adjustment
6. **Meta-Learning** (500+, excellent): Learning how to learn, self-optimization

Phases are automatically calculated based on `total_attempts`, `mastery_variance`, and `confidence_calibration_error`.

## 📈 Performance Tracking

### Chapter Performance Page (`/performance/[subject]/[chapter]`)
- Overall statistics (total attempts, average mastery, Bloom distribution)
- Mastery heatmap (topic × Bloom level)
- Recent activity with contextual information
- Reset progress with pre-deletion counts
- Collapsible sections for reduced cognitive load

### Topic Performance Page (`/performance/[subject]/[chapter]/[topic]`)
- RL phase badge with tooltip
- Comprehensive mastery matrix (6 Bloom levels × 6 dimensions = 36 cells)
- Cell colors: not tested (gray), struggling (red), developing (yellow), proficient (blue), mastered (green)
- Unique questions answered vs. total attempts tracking
- Per-dimension statistics
- Progress by Bloom level breakdown
- Lock icons for locked levels

## 🛠️ Development

### Guidelines
- **Read `CLAUDE.md`** - Comprehensive development best practices
- **Follow design system** - Neumorphic dark theme with `neuro-btn`, `neuro-card`, etc.
- **Use tooltips** - All metrics need contextual explanations
- **No emojis** - Use SVG icons from `components/icons.tsx`
- **Button style** - Always `neuro-btn text-[color]`, never colored backgrounds
- **Use topic_id** - All queries and tracking use UUID, not topic names (handles hierarchy)

### Common Commands
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check
npx supabase db push # Apply migrations to Supabase
```

### Database Migrations
All migrations are in `supabase/migrations/` with timestamps. Apply via:
1. Supabase CLI: `npx supabase db push`
2. Manual: Copy SQL to Supabase Dashboard → SQL Editor

**Recent Important Migrations:**
- `20250107_add_source_type_to_questions.sql` - Question tracking
- `20250107_add_user_id_to_questions.sql` - User-specific questions
- `20250107_cleanup_old_dimensions.sql` - Remove old 12 dimensions
- `20250107_update_dimension_matrix_to_new_6.sql` - New 6 dimensions
- `20250108_add_topic_hierarchy.sql` - Hierarchical topic support

## 🔧 Reset Progress Feature

The reset progress feature allows users to delete all learning data for a specific chapter:

**Data Deleted:**
1. User Responses (all answers submitted)
2. Learning Sessions (session records)
3. Mastery Records (topic mastery scores)
4. Arm Stats (Thompson Sampling data)
5. Dimension Coverage (dimension tracking)
6. Generated Questions (user's AI-generated questions)

**Pre-Deletion Counts:**
- Shows exact counts before deletion in confirmation modal
- Uses inner joins to avoid URL length limits with many topics
- Questions counted by user_id to show only user's questions

**Implementation:**
- Custom neumorphic modals (no browser alerts)
- Atomic transactions for data integrity
- Detailed logging for debugging

## 🚧 Known Limitations

- Response time not yet tracked or rewarded
- Engagement component not displayed in UI (calculated but hidden)
- Prior exposure tracking exists but not yet used in rewards
- No answer revision tracking
- No hint system
- Admin UI needs more features (bulk operations, advanced filtering)
- Question format personalization not fully implemented

## 🔮 Future Enhancements

### High Priority
1. **Spaced Repetition Scheduler**: Optimize question timing based on forgetting curves
2. **Transfer Learning Bonus**: Reward multi-topic question success
3. **Answer Revision Tracking**: Capture self-correction patterns
4. **Response Time Integration**: Fluency bonus for L1-L2 only
5. **Question Format Personalization**: Optimize MCQ single vs. multi, code trace, etc.

### Medium Priority
- Difficulty gap optimization (better than binary engagement)
- Prerequisite violation detection
- Interleaving vs. blocking rewards
- Sleep/consolidation bonuses
- Distractor analysis for misconception detection
- Open-ended questions with AI grading

### Long-Term
- Hint system with scaffolded support
- Multi-user collaboration features
- Learning analytics dashboard for instructors
- Mobile app (React Native)
- Adaptive difficulty within Bloom levels
- Peer comparison (anonymous)

## 📝 Contributing

This is currently a personal project. For suggestions or issues, please open a GitHub issue.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by Grok 4 Fast Reasoning (X.AI)
- Database & Auth by Supabase
- Embeddings by OpenAI
- Deployed on Vercel

---

**Status**: Production-ready MVP with advanced RL features and hierarchical topic support.

**Last Updated**: November 2025
