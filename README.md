# Axium

An intelligent learning platform that combines reinforcement learning, knowledge graphs, and AI-powered question generation to create personalized adaptive learning experiences.

## Overview

Axium uses a sophisticated RL (Reinforcement Learning) system to select optimal topics and difficulty levels for each learner, generates questions dynamically using AI with rich curriculum context from a knowledge graph, and tracks detailed performance analytics to guide learning progression.

## Key Features

### Adaptive Learning
- **RL-Driven Topic Selection**: Priority-based epsilon-greedy algorithm with calibration optimization
- **Progressive Bloom Unlocking**: Master each level before advancing (Remember → Understand → Apply → Analyze → Evaluate → Create)
- **80-20 Learning Strategy**: 80% RL-optimized practice, 20% spaced repetition review
- **Calibration-Based Scoring**: Single unified metric measuring confidence accuracy (-1.5 to +1.5)

### Knowledge Graph Integration
- **GraphRAG**: Neo4j knowledge graph with 920+ entities and 900+ relationships synced to PostgreSQL
- **Context-Rich Question Generation**: AI uses curriculum-specific context (avg 563 chars) from knowledge graph
- **Prerequisite Tracking**: 325+ prerequisite paths for learning dependencies
- **Semantic Relationships**: Cross-references and hierarchical topic structures

### AI-Powered Questions
- **xAI Grok Integration**: Fast, high-quality question generation with reasoning capabilities
- **10 Question Formats**: MCQ single/multi, true/false, fill-in-blank, matching, open-ended, and more
- **Format Personalization**: System tracks effectiveness of each format and adapts to learner preferences
- **Question Persistence**: All questions saved to database for spaced repetition and analytics

### Performance Analytics
- **Comprehensive Dashboard**: Topic-level mastery, Bloom distribution, calibration metrics
- **Statistical Tracking**: Confidence calibration error, mastery variance, streak tracking
- **Recognition Methods**: Memory vs. Recognition vs. Educated Guess vs. Random
- **Calibration Trends**: Track confidence accuracy improvement over time

### User Experience
- **Neumorphic Dark Theme**: Custom design system with minimal cognitive load
- **4-Step Learning Flow**: Confidence → Answer → Recognition → Feedback
- **Session Persistence**: Browser-based session storage (no backend session management)
- **Mobile Responsive**: Fluid scaling from 320px to 4K displays

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **Knowledge Graph**: Neo4j (synced to PostgreSQL cache)
- **Auth**: Supabase Auth with Google SSO
- **AI**: xAI Grok (question generation)
- **Embeddings**: OpenAI text-embedding-3-small
- **Styling**: Tailwind CSS + Custom Neumorphic Design
- **Deployment**: Vercel

## Project Structure

```
axium/
├── app/
│   ├── subjects/              # Main dashboard
│   ├── learn/                 # RL-driven quiz interface
│   ├── analytics/             # Performance analytics
│   └── api/
│       ├── quiz/
│       │   ├── next-question/ # RL topic selection + question generation
│       │   └── submit/        # Answer submission + mastery updates
│       ├── analytics/         # Analytics queries
│       ├── progression/       # Progression evaluation
│       └── questions/         # Question generation
│
├── lib/
│   ├── db/                    # Database utilities
│   │   └── questions.ts       # Question persistence
│   ├── progression/           # RL algorithms
│   │   ├── rl-topic-selector.ts       # Priority-based epsilon-greedy
│   │   ├── format-selection.ts        # Format recommendation
│   │   ├── confidence-calibration.ts  # Calibration tracking
│   │   ├── adaptive-difficulty.ts     # Difficulty adjustment
│   │   └── bloom-progression.ts       # Bloom level advancement
│   ├── rl/                    # RL core utilities
│   │   └── mastery.ts         # Mastery utilities
│   ├── graphrag/              # GraphRAG utilities
│   ├── neo4j/                 # Neo4j client
│   ├── supabase/              # Supabase clients
│   └── types/                 # TypeScript types
│
├── components/
│   ├── quiz/                  # Quiz UI components
│   ├── analytics/             # Analytics visualizations
│   ├── HamburgerMenu.tsx      # Navigation
│   ├── RLPhaseBadge.tsx       # RL phase indicators
│   └── QuestionFormatBadge.tsx
│
├── supabase/
│   ├── schema.sql             # Main database schema
│   └── migrations/            # Incremental migrations
│
└── scripts/
    ├── import-to-neo4j.ts     # Neo4j import
    ├── parse-curriculum.ts    # Curriculum parsing
    ├── seed-test-data.ts      # Test data generation
    ├── test-graphrag-context.ts   # GraphRAG testing
    ├── verify-graphrag-questions.sql
    └── archive/               # Legacy scripts (archived)
```

## Database Schema

### Core Tables
- `subjects`, `chapters`, `topics` - Learning content hierarchy
- `questions` - All generated questions (persistent, reusable)
- `user_progress` - Mastery scores, RL phase, metadata
- `user_responses` - Answer history with calibration scores and recognition methods

### GraphRAG Tables
- `graphrag_entities` - Neo4j entity cache (920+ entities)
- `graphrag_relationships` - Neo4j relationship cache (901+ relationships)
- `graphrag_prerequisite_paths` - Learning dependency paths (325+ paths)
- `graphrag_indexing_jobs` - Indexing job tracking

### Knowledge Base
- `knowledge_chunks` - RAG corpus with embeddings
- Vector similarity search via pgvector

## Learning Flow

1. **Topic Selection**: Priority-based epsilon-greedy algorithm (80%) or spaced repetition (20%)
2. **Context Retrieval**: Fetch GraphRAG context from `graphrag_entities.context_summary`
3. **Question Generation**: xAI Grok generates question using curriculum context
4. **Question Storage**: Save to `questions` table with `rag_context` field
5. **4-Step Quiz Flow**:
   - Confidence rating (1-5 scale)
   - Answer submission
   - Recognition method selection
   - Feedback with explanation
6. **Calibration Scoring**: 3D matrix (correctness × confidence × recognition) = -1.5 to +1.5
7. **Mastery Update**: Simple percentage calculation per format per Bloom level
8. **Statistics Update**: Auto-update calibration mean, stddev, slope via database trigger

## Key Algorithms

### Priority-Based Epsilon-Greedy Selection

Topic selection uses a weighted priority score with 4 components:

1. **Calibration Mean** (40% weight): Lower calibration score = higher priority
   - Measures confidence accuracy on a scale of -1.5 to +1.5
   - Topics with poor calibration get more practice

2. **Time Since Practice** (30% weight): Spaced repetition intervals
   - 168+ hours (1 week): 0.9 priority
   - 72+ hours (3 days): 0.7 priority
   - 24+ hours (1 day): 0.5 priority
   - Never practiced: 0.3 priority

3. **Mastery Gaps** (20% weight): Lowest mastery across Bloom levels
   - Finds weakest Bloom level for each topic
   - Lower mastery = higher priority

4. **Variance** (10% weight): Calibration consistency
   - High stddev (>0.5) adds +0.1 priority
   - Rewards addressing inconsistent performance

**Epsilon-Greedy Strategy**: Balances exploitation (best topic) vs exploration (random topic)
- Cold Start (< 10 attempts): 100% random exploration
- Exploration (10-50 attempts): 30% random (ε=0.3)
- Optimization (50-150 attempts): 10% random (ε=0.1)
- Stabilization (150+ attempts): 5% random (ε=0.05)

### Calibration Score

Single unified metric using 3D matrix (correctness × confidence × recognition):

**Range**: -1.5 to +1.5
- Positive: Good calibration (confidence matches performance)
- Negative: Poor calibration (overconfident when wrong, underconfident when right)

**Recognition Methods**:
- Memory > Recognition > Educated Guess > Random

**Example Scores**:
- Correct + High Confidence + Memory = +1.5 (perfect)
- Incorrect + High Confidence + Memory = -1.5 (worst)
- Correct + Low Confidence + Random = +0.5 (good calibration, knew it was random)

### Mastery Calculation

Simple percentage per format per Bloom level:
```
mastery = (questions_correct / questions_attempted) × 100
```

Stored as nested JSON in `user_progress.mastery_scores`:
```json
{
  "1": {"mcq_single": 85, "true_false": 90},
  "2": {"mcq_single": 70, "mcq_multi": 65}
}
```

## RL Phases

**Topic-Level Phases** (tracked in `user_progress.rl_phase` per topic):

| Phase | Attempts | Behavior |
|-------|----------|----------|
| Cold Start | < 10 | Random exploration |
| Exploration | 10-50 | Testing strategies (ε=0.3) |
| Optimization | 50-150 | Exploiting best topics (ε=0.1) |
| Stabilization | 150+, low variance | Stable performance |
| Adaptation | 150+, changing | Responding to changes |
| Meta-Learning | 500+, excellent | Self-optimization |

**Global Phase** (used for epsilon selection in topic selector):
- Determined by total attempts across all topics
- Controls exploration rate (ε) in epsilon-greedy algorithm
- 4 phases: cold_start → exploration → optimization → stabilization

## Question Formats

10 formats tracked for personalization:
1. **True/False** (Bloom 1-2)
2. **MCQ Single** - One correct answer (Bloom 1-2)
3. **MCQ Multi** - Multiple correct (Bloom 2-4)
4. **Fill in Blank** (Bloom 1-3)
5. **Matching** (Bloom 2-3)
6. **Open Ended** (Bloom 4-6)
7. **Code Trace** (Bloom 3-4)
8. **Code Complete** (Bloom 3-4)
9. **Ordering** (Bloom 2-3)
10. **Diagram Label** (Bloom 1-2)

System tracks effectiveness and recommends optimal formats per Bloom level.

## Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Neo4j Aura instance (optional, for GraphRAG)
- xAI API key
- OpenAI API key (for embeddings)

### Environment Variables

Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (Session Pooler - port 5432)
DATABASE_URL=postgresql://postgres.xxx:password@aws-region.pooler.supabase.com:5432/postgres?sslmode=require

# AI Services
XAI_API_KEY=your_xai_key
OPENAI_API_KEY=your_openai_key

# Neo4j (optional)
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

### Installation

```bash
# Clone repository
git clone https://github.com/anandfrancis93/axium.git
cd axium

# Install dependencies
npm install

# Run database migrations
# (Apply migrations in supabase/migrations/ via Supabase dashboard or CLI)

# Start development server
npm run dev
```

### Optional: Import Data to Neo4j
```bash
npm run neo4j:import
npm run neo4j:validate
```

### Optional: Seed Test Data
```bash
npm run seed:test
```

## Usage

1. **Login**: Navigate to `/login` and sign in with Google
2. **Dashboard**: View available subjects at `/subjects`
3. **Start Learning**: Click "Start RL Quiz" to begin
4. **Quiz Flow**: Answer questions through the 4-step process
5. **Analytics**: View performance metrics at `/analytics`
6. **Admin**: Upload content and manage GraphRAG at `/admin`

## Testing GraphRAG

```bash
# Pre-generation test (verify GraphRAG data exists)
npx tsx scripts/test-graphrag-context.ts

# Post-generation verification (check questions have context)
psql "$DATABASE_URL" -f scripts/verify-graphrag-questions.sql
```

Expected: Questions should have ~400-500 character `rag_context` from GraphRAG entities.

## Development Guidelines

**READ `CLAUDE.md` BEFORE CODING** - Contains critical patterns, best practices, and architectural decisions.

Key principles:
- DRY (Don't Repeat Yourself)
- Single Source of Truth
- Type Safety (no `any`)
- Minimal Cognitive Load UI
- Task Management with TODO.md

## Design System

### Neumorphic Dark Theme
- Background: `#0a0a0a`
- All buttons: `neuro-btn` with colored text (NO colored backgrounds)
- All inputs: `neuro-input` (inputs, selects, textareas)
- Icons: SVG only (NO EMOJIS)
- Generous spacing: `gap-6`, `p-6/8`, `mb-6/8`

### Color Semantics (via text color)
- Blue: Primary actions
- Green: Success/positive
- Yellow: Warning/caution
- Red: Destructive actions

## Known Limitations

- Open-ended questions need AI grading implementation
- Response time not yet tracked
- Format personalization tracked but not fully integrated into RL selection
- No hint system
- No spaced repetition scheduler yet

## Future Enhancements

- Spaced repetition scheduler with forgetting curves
- Full question format optimization in Thompson Sampling
- Response time tracking and fluency bonuses
- Transfer learning bonuses for multi-topic success
- AI grading for open-ended questions
- Knowledge graph visualization

## Contributing

This is currently a personal project. For suggestions or issues, please open a GitHub issue.

## License

MIT

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by xAI Grok
- Database & Auth by Supabase
- Knowledge Graph by Neo4j
- Embeddings by OpenAI
- Deployed on Vercel

---

**Last Updated**: January 2025
