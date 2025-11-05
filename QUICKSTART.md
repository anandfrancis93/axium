# Quick Start Guide

## What's Been Built

Your Axium intelligent learning platform foundation is ready! Here's what's in place:

### ✅ Completed
1. **Next.js Project**: Full TypeScript + Tailwind CSS setup
2. **Database Schema**: Comprehensive Postgres schema with pgvector for RAG
3. **Authentication**: Google SSO integration ready
4. **Core Pages**: Login, Dashboard, Auth callback
5. **Type Safety**: Full TypeScript types for database models
6. **Middleware**: Auth protection for authenticated routes

### 📋 Next Steps (You Need to Do)

#### 1. Set Up Supabase (15 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to you)
3. Wait for provisioning (~2 minutes)
4. Enable the `vector` extension:
   - Go to **Database** → **Extensions**
   - Search for "vector" and enable it
5. Run the database schema:
   - Go to **SQL Editor** → **New Query**
   - Copy all of `supabase/schema.sql`
   - Paste and click **Run**
6. Get your API keys:
   - Go to **Project Settings** → **API**
   - Copy **Project URL**, **anon** key, and **service_role** key

#### 2. Configure Google OAuth (10 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client ID**:
   - Type: Web application
   - Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase:
   - Go to **Authentication** → **Providers**
   - Enable Google
   - Paste Client ID and Secret

#### 3. Set Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your values in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   OPENAI_API_KEY=sk-your-key-here
   ```

#### 4. Get API Keys

**Anthropic (Claude):**
- Go to [console.anthropic.com](https://console.anthropic.com/)
- Create an API key
- Add to `.env.local`

**OpenAI (for embeddings):**
- Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Create an API key
- Add to `.env.local`

#### 5. Test the App

```bash
npm run dev
```

Visit `http://localhost:3000`:
- Should redirect to `/login`
- Click "Sign in with Google"
- Should redirect to dashboard after successful login

#### 6. Add Your First Content

For now, add content via SQL (admin UI coming soon):

```sql
-- Add a subject
INSERT INTO subjects (name, description)
VALUES ('Computer Science', 'Study of computation and information processing');

-- Add a chapter (replace 'subject-id' with the actual UUID from above)
INSERT INTO chapters (subject_id, name, description, sequence_order)
VALUES ('subject-id', 'Data Structures', 'Fundamental data organization patterns', 1);

-- Add a topic (replace 'chapter-id' with the actual UUID from above)
INSERT INTO topics (chapter_id, name, description, sequence_order)
VALUES ('chapter-id', 'Arrays', 'Sequential data storage', 1);
```

You can run these queries in Supabase **SQL Editor**.

## What Subject Are You Starting With?

To help you get started faster, **tell me what subject/domain you want to learn** and I can:
- Create sample SQL to populate your first subject/chapters/topics
- Tailor the question generation prompts for that domain
- Suggest appropriate Bloom level progressions

**Common subjects:**
- Computer Science (Algorithms, Data Structures, etc.)
- Mathematics (Calculus, Linear Algebra, etc.)
- Medicine/Biology
- Physics
- Business/Finance
- Languages

## Next Development Priorities

Once you have Supabase configured and can sign in, we'll build:

1. **Document Upload** - Upload PDFs/docs and automatically chunk them
2. **RAG Integration** - Generate embeddings and enable semantic search
3. **Question Generation** - Claude integration to create questions from your materials
4. **Learning Session** - UI to practice with adaptive question selection
5. **Progress Tracking** - Visualize your mastery across topics and Bloom levels

## Troubleshooting

**"Invalid API key" error:**
- Check that you copied the keys correctly (no extra spaces)
- Make sure you're using the right key type (anon vs service_role)

**Google SSO not working:**
- Verify redirect URI matches exactly: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
- Check that Google provider is enabled in Supabase
- Make sure OAuth consent screen is configured

**Database errors:**
- Confirm pgvector extension is enabled
- Check that all of schema.sql ran successfully
- Look for errors in Supabase logs

## Need Help?

Refer to the detailed guides:
- **Database setup**: `supabase/README.md`
- **Project overview**: `README.md`

Once Supabase is configured, let me know what subject you want to start with and we'll continue building! 🚀
