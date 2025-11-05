# Axium - Intelligent Self-Learning App

A personalized AI learning platform that helps you progress through any subject by dynamically generating questions, adapting difficulty using reinforcement learning (RL), and tracking cognitive and metacognitive growth — based on Bloom's Taxonomy, fluid/crystallized intelligence, and smart feedback loops.

## Features

### 🔄 Adaptive Learning Engine
- **Subject → Chapter → Topic → Bloom Level** hierarchy for structured learning
- **Bloom's Taxonomy Framework**: Progress from Level 1 (Remember) to Level 6 (Create)
- **RL-Based Progression** (future): Reinforcement Learning chooses the next topic and Bloom level based on performance, confidence, and response time
- **Rule-Based Progression** (current MVP): Systematic progression with mastery thresholds

### 🧪 AI-Powered Question Generation
- **Claude AI**: Generates questions dynamically based on topic, Bloom level, and retrieved content
- **RAG (Retrieval-Augmented Generation)**: Injects your personal notes, PDFs, and curated content into Claude's prompt
- **Multiple Question Types**: MCQs, open-ended, scenario-based, analogies, and more

### 📈 Smart Progress Tracking
- **Mastery Scores**: Per topic × Bloom level tracking (0-100)
- **Confidence Calibration**: Detects overconfidence/underconfidence (Dunning-Kruger patterns)
- **Response Metrics**: Time taken, accuracy, and improvement trends
- **Intelligence Types**: Tracks both fluid (reasoning) and crystallized (knowledge) intelligence

### 🧠 Cognitive Development
- Scaffolded learning from basic recall to creative synthesis
- Metacognitive feedback and self-assessment
- Spaced repetition for long-term retention (future)

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (Postgres + pgvector for RAG)
- **Authentication**: Supabase Auth with Google SSO
- **LLM**: Claude 3.5 Sonnet (Anthropic API)
- **Embeddings**: OpenAI text-embedding-3-small (for RAG)
- **Deployment**: Vercel (recommended)

## Architecture

### Data Model

```
subjects
├── id, name, description
└── chapters[]
    ├── id, name, description, sequence_order, prerequisites[]
    └── topics[]
        ├── id, name, description, sequence_order, prerequisites[]
        └── bloom_levels[] (1-6)

user_progress
├── user_id, topic_id
├── current_bloom_level
├── mastery_scores{1-6}
├── total_attempts, correct_answers
├── avg_confidence, confidence_calibration_error
└── avg_response_time_seconds

knowledge_chunks (for RAG)
├── chapter_id, topic_id (optional)
├── content
├── embedding (vector)
└── source_file_name, page_number

questions
├── topic_id, bloom_level
├── question_text, question_type
├── options (for MCQ), correct_answer
└── explanation, rag_context

user_responses
├── user_id, question_id, topic_id, bloom_level
├── user_answer, is_correct
├── confidence (1-5), time_taken_seconds
└── reward (calculated), ai_feedback
```

### Learning Flow

1. **RL/Rule Engine** selects topic × Bloom level
2. **RAG Retrieval** finds relevant chunks from your materials
3. **Claude Generates** a question using retrieved context
4. **User Answers** and rates confidence
5. **System Evaluates** and calculates reward
6. **Progress Updates** mastery scores, checks for Bloom level unlock
7. **Repeat** with adaptive selection

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Anthropic API key (for Claude)
- OpenAI API key (for embeddings)
- Google Cloud Console account (for Google SSO)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/axium.git
   cd axium
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed guide in [`supabase/README.md`](./supabase/README.md)
   - Create project, enable pgvector, run schema.sql
   - Configure Google SSO

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Initial Setup After Installation

1. **Sign in with Google** at `/login`
2. **Add your first subject** (via SQL for now, admin UI coming soon):
   ```sql
   INSERT INTO subjects (name, description)
   VALUES ('Computer Science', 'Fundamentals of Computer Science');

   INSERT INTO chapters (subject_id, name, sequence_order)
   VALUES ('subject-uuid', 'Data Structures', 1);

   INSERT INTO topics (chapter_id, name, sequence_order)
   VALUES ('chapter-uuid', 'Arrays and Lists', 1);
   ```
3. **Upload learning materials** (document upload UI coming soon)
4. **Start learning** at `/learn`

## Project Structure

```
axium/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home (redirects to login/dashboard)
│   ├── login/                   # Google SSO login page
│   ├── auth/callback/           # OAuth callback handler
│   ├── dashboard/               # Main dashboard
│   ├── learn/                   # Learning session (coming soon)
│   └── layout.tsx               # Root layout
├── lib/
│   ├── supabase/                # Supabase client utilities
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   └── types/
│       └── database.ts          # TypeScript database types
├── supabase/
│   ├── schema.sql               # Database schema
│   └── README.md                # Supabase setup guide
├── middleware.ts                # Next.js middleware for auth
└── README.md                    # This file
```

## Development Roadmap

### Phase 1: MVP Core (Current) ✅
- [x] Next.js + Supabase setup
- [x] Database schema (Subject → Chapter → Topic → Bloom)
- [x] Google SSO authentication
- [x] Basic dashboard UI
- [ ] Document upload & chunking
- [ ] RAG integration (embeddings + vector search)
- [ ] Claude question generation (Bloom 1-3)
- [ ] Simple rule-based progression
- [ ] Basic progress tracking

### Phase 2: Enhanced Learning
- [ ] Bloom 4-6 questions with AI grading
- [ ] Confidence calibration tracking
- [ ] Multiple question types
- [ ] Mastery heatmaps & analytics
- [ ] Learning session history

### Phase 3: RL Integration
- [ ] Data collection & reward calculation
- [ ] Contextual bandit implementation
- [ ] A/B test RL vs rule-based
- [ ] Fine-tune reward function

### Phase 4: Advanced Features
- [ ] Spaced repetition system
- [ ] Metacognition prompts
- [ ] Fluid vs crystallized tracking
- [ ] Multi-user support
- [ ] Admin UI for content management

## Development Guidelines

### For Developers

Before contributing or making changes:

1. **Read `CLAUDE.md`** - Complete development best practices and patterns
2. **Check `TODO.md`** - Current task list and priorities
3. **Follow the workflow**:
   - Pick a task from TODO.md
   - Mark it as "In Progress"
   - Follow patterns in CLAUDE.md
   - Update TODO.md when complete
   - Commit with conventional commit message

### Key Documents

- **`CLAUDE.md`** - Development best practices, coding standards, architecture patterns
- **`TODO.md`** - Current task list, progress tracking, blockers
- **`QUICKSTART.md`** - Setup instructions for new developers
- **`supabase/README.md`** - Supabase configuration guide

## Contributing

This is currently a personal project. If you'd like to contribute or have suggestions, feel free to open an issue!

## License

MIT

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by Claude AI (Anthropic)
- Infrastructure by Supabase
- Deployed on Vercel

---

**Note**: This is an early-stage MVP. Many features are still in development. See the roadmap above for what's coming next!
