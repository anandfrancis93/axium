# Supabase Setup Guide

## Prerequisites
- A Supabase account (free tier is sufficient)
- Google Cloud Console account (for Google SSO setup)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if you don't have one)
4. Create a new project:
   - **Name**: `axium` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
5. Wait for the project to be provisioned (~2 minutes)

## Step 2: Enable pgvector Extension

1. In your Supabase project dashboard, go to **Database** → **Extensions**
2. Search for `vector`
3. Enable the `vector` extension

## Step 3: Run the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click **Run** or press `Ctrl+Enter`
6. Verify all tables were created successfully (check the **Database** → **Tables** section)

## Step 4: Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - click "Reveal" button)

## Step 5: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in the Supabase values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Step 6: Set Up Google SSO

### A. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: **External**
   - App name: `Axium`
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Axium`
   - Authorized redirect URIs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```
     (Replace `your-project` with your actual Supabase project reference)
7. Copy **Client ID** and **Client Secret**

### B. Supabase Google Provider Setup

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to configure
3. Enable Google provider
4. Paste your **Client ID** and **Client Secret** from Google Cloud Console
5. Save

## Step 7: Configure Redirect URLs

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add redirect URLs:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.com/auth/callback`

## Step 8: Add Anthropic API Key

1. Get your Claude API key from [https://console.anthropic.com/](https://console.anthropic.com/)
2. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

## Step 9: Add OpenAI API Key (for embeddings)

1. Get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   ```

## Step 10: Test the Setup

Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- The app loads
- No console errors related to Supabase connection

## Database Schema Overview

### Hierarchy
- **Subjects** → **Chapters** → **Topics** → **Bloom Levels** (1-6)

### Key Tables
- `subjects` - Top-level subjects (e.g., "Computer Science")
- `chapters` - Chapters within subjects (e.g., "Data Structures")
- `topics` - Topics within chapters (e.g., "Binary Trees")
- `user_progress` - Tracks mastery per topic × Bloom level
- `knowledge_chunks` - RAG content storage with vector embeddings
- `questions` - Generated questions (cached)
- `user_responses` - Every answer submitted
- `learning_sessions` - Session tracking
- `rl_state` - RL agent state

### Helper Functions
- `calculate_topic_mastery(user_id, topic_id)` - Calculates overall topic mastery
- `search_knowledge_chunks(embedding, count, chapter_id, topic_id)` - Vector similarity search

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire `schema.sql` file
- Check if pgvector extension is enabled

### Authentication not working
- Verify Google OAuth credentials are correct
- Check redirect URLs match exactly
- Ensure Google provider is enabled in Supabase

### Vector search not working
- Confirm pgvector extension is installed
- Check if embeddings are being generated (should be 1536 dimensions)

## Next Steps

Once setup is complete:
1. Create your first subject (use the admin UI or SQL)
2. Add chapters and topics
3. Upload learning materials (PDFs, documents)
4. Start learning!
