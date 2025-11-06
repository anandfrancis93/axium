# Axium - Intelligent Adaptive Learning Platform

A personalized AI learning platform that uses reinforcement learning, Bloom's Taxonomy, and knowledge dimensions to create adaptive learning paths. Built with Next.js, Supabase, and Claude AI.

## 🚀 Current Status

**Fully operational MVP** with advanced RL-based adaptive learning, comprehensive performance tracking, and AI-powered question generation.

## ✨ Key Features

### 🎯 Adaptive Learning Engine
- **Thompson Sampling (Multi-Armed Bandit)**: Optimizes topic and Bloom level selection based on learning potential
- **Progressive Bloom Unlocking**: Master Level N to unlock Level N+1
- **12 Knowledge Dimensions**: Orthogonal categories (Core Understanding, Methods & Techniques, Risk Management, etc.)
- **6 RL Phases**: Tracks learning journey from Cold Start → Meta-Learning
- **Multi-Component Reward System**: Learning Gain, Calibration, Recognition, Spacing, Engagement

### 🧠 Cognitive Framework
- **Bloom's Taxonomy (6 Levels)**: Remember → Understand → Apply → Analyze → Evaluate → Create
- **Exponential Moving Average (EMA)**: Confidence-weighted mastery calculation
- **Confidence Calibration**: Detects overconfidence/underconfidence patterns
- **Recognition Method Tracking**: Memory vs. Recognition vs. Educated Guess vs. Random

### 🤖 AI-Powered Question Generation
- **Claude 3.5 Sonnet**: Generates contextual questions based on RAG-retrieved content
- **RAG (Retrieval-Augmented Generation)**: Semantic search over your uploaded PDFs and documents
- **Dimension-Aware**: Questions target specific knowledge dimensions at specific Bloom levels
- **Multiple Choice Questions**: With AI-generated distractors and explanations

### 📊 Performance Analytics
- **Mastery Heatmaps**: Per-topic Bloom level progress visualization
- **Comprehensive Mastery Matrix**: Bloom × Dimension performance tracking
- **Recent Activity Feeds**: Detailed response history with context
- **RL Phase Indicators**: Visual progression through learning phases
- **Dimension Coverage**: Track exploration across knowledge dimensions

### 🎨 User Experience
- **Neumorphic Dark Theme**: Custom design system with raised/inset elements
- **4-Step Learning Flow**: Confidence → Answer → Recognition → Feedback
- **Contextual Tooltips**: Dynamic explanations for all metrics and values
- **Collapsible Sections**: Minimal cognitive load with progressive disclosure
- **Mobile Responsive**: Fluid scaling from 320px to 4K displays

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15 with Turbopack (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Neumorphic System
- **Database**: Supabase (PostgreSQL + pgvector)
- **Auth**: Supabase Auth with Google SSO
- **LLM**: Claude 3.5 Sonnet (Anthropic API)
- **Embeddings**: OpenAI text-embedding-3-small
- **Deployment**: Vercel (recommended)

### Data Model

```
subjects
├── chapters[]
│   ├── topics[]
│   │   └── knowledge dimensions (12)
│   └── subject_dimension_config
│
user_progress
├── current_bloom_level (1-6)
├── mastery_scores{1-6} (EMA-based)
├── rl_phase (cold_start → meta_learning)
├── total_attempts, mastery_variance
└── confidence_calibration_error

user_dimension_coverage
├── topic × bloom_level × dimension
├── unique_questions_answered[]
├── times_tested, total_attempts
└── average_score (0-100)

arm_stats (Thompson Sampling)
├── topic × bloom_level (arms)
├── successes, failures (Beta distribution)
└── last_selected_at

learning_sessions
├── chapter_id, user_id
├── questions_answered, score
└── completed_at

user_responses
├── question_id, is_correct
├── confidence (1-5)
├── recognition_method
└── reward (multi-component)

questions (ephemeral + stored)
├── topic, bloom_level, dimension
├── question_text, options[]
├── correct_answer, explanation
└── generated via Claude + RAG
```

### Learning Flow

```
1. Thompson Sampling selects optimal (topic, bloom_level) arm
2. Check prerequisites and unlock status
3. RAG retrieves relevant chunks from knowledge base
4. Claude generates dimension-specific question
5. User answers with confidence and recognition method
6. System calculates multi-component reward:
   - Learning Gain (-10 to +10)
   - Calibration (-5 to +5)
   - Recognition (-3 to +5)
   - Spacing (0 to +5)
   - Engagement (-3 to 0)
7. Update mastery scores (EMA with confidence weighting)
8. Update Thompson Sampling statistics (Beta distribution)
9. Track dimension coverage and RL phase progression
10. Check Bloom level unlock conditions
11. Repeat with improved arm selection
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** (free tier sufficient)
- **Anthropic API key** (Claude 3.5 Sonnet)
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
   ANTHROPIC_API_KEY=sk-ant-...
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
│   │   └── rl/
│   │       ├── next-question/   # Thompson Sampling selection
│   │       ├── submit-response/ # Reward calculation
│   │       └── sessions/        # Session management
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
│   ├── Tooltip.tsx              # Custom tooltip with cursor tracking
│   ├── RLPhaseBadge.tsx         # RL phase indicator
│   └── icons.tsx                # SVG icon library
│
├── supabase/
│   ├── schema.sql               # Complete database schema
│   └── migrations/              # Incremental migrations
│
├── scripts/
│   ├── extract-all-topics.mjs   # Topic extraction from PDFs
│   └── extract-all-concepts.mjs # Concept extraction
│
├── CLAUDE.md                    # Development guidelines (CRITICAL)
└── README.md                    # This file
```

## 🎓 Key Concepts

### Thompson Sampling (Multi-Armed Bandit)
Each (topic, bloom_level) combination is an "arm" in a multi-armed bandit. The system maintains Beta distributions for each arm and samples to balance exploration (trying new topics) vs. exploitation (focusing on high-reward topics).

### Multi-Component Rewards
- **Learning Gain**: Mastery improvement (primary signal)
- **Calibration**: Confidence vs. performance alignment
- **Recognition**: Retrieval strength (memory > recognition > guess)
- **Spacing**: Retention over time (rewards long gaps)
- **Engagement**: Difficulty appropriateness (penalty only)

### Knowledge Dimensions (12)
1. Core Understanding (definitions, fundamentals)
2. Methods & Techniques (procedures, algorithms)
3. Risk & Threats (vulnerabilities, threat modeling)
4. Security & Controls (protection mechanisms)
5. Tools & Technologies (software, platforms)
6. Architecture & Design (system design, patterns)
7. Legal & Compliance (standards, regulations)
8. Incident Management (response, remediation)
9. Integration & Interoperability (cross-domain connections)
10. Common Pitfalls (misconceptions, mistakes)
11. Real-World Scenarios (practical application)
12. Strategic Planning (governance, policies)

### RL Learning Phases (6)
1. **Cold Start** (< 10 attempts): Random exploration
2. **Exploration** (10-50): Testing strategies
3. **Optimization** (50-150): Refining approach
4. **Stabilization** (150+, low variance): Converged policy
5. **Adaptation** (150+, changing): Responding to shifts
6. **Meta-Learning** (500+, excellent): Learning how to learn

## 📈 Performance Tracking

### Chapter Performance Page (`/performance/[subject]/[chapter]`)
- Overall statistics (total attempts, average mastery, Bloom distribution)
- Mastery heatmap (topic × Bloom level)
- Recent activity with contextual information
- Collapsible sections for reduced cognitive load

### Topic Performance Page (`/performance/[subject]/[chapter]/[topic]`)
- RL phase badge with tooltip
- Comprehensive mastery matrix (Bloom × Dimension)
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

### Common Commands
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

### Database Migrations
All migrations are in `supabase/migrations/` with timestamps. Apply in order via Supabase Studio or CLI.

## 🚧 Known Limitations

- Response time not yet tracked or rewarded
- Engagement component not displayed in UI (calculated but hidden)
- Prior exposure tracking exists but not yet used in rewards
- No answer revision tracking
- No hint system
- Admin UI needs more features (bulk question generation, content management)

## 🔮 Future Enhancements

### High Priority
1. **Transfer Learning Bonus**: Reward multi-topic question success
2. **Prior Exposure Tracking**: Track question repeats properly
3. **Answer Revision Tracking**: Capture self-correction patterns
4. **Response Time Integration**: Fluency bonus for L1-L2 only
5. **Streak/Fatigue Detection**: Session position tracking

### Medium Priority
- Difficulty gap optimization (better than binary engagement)
- Prerequisite violation detection
- Interleaving vs. blocking rewards
- Sleep/consolidation bonuses
- Distractor analysis for misconception detection

### Long-Term
- Open-ended question support with AI grading
- Hint system with scaffolded support
- Multi-user collaboration features
- Spaced repetition scheduler
- Learning analytics dashboard
- Mobile app (React Native)

## 📝 Contributing

This is currently a personal project. For suggestions or issues, please open a GitHub issue.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by Claude AI (Anthropic)
- Database & Auth by Supabase
- Embeddings by OpenAI
- Deployed on Vercel

---

**Status**: Production-ready MVP with advanced RL features. Active development ongoing.

**Last Updated**: January 2025
