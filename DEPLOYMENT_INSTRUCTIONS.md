# 🚀 GraphRAG Production Deployment - Quick Instructions

**Status**: Code pushed to GitHub ✅

Follow these steps to deploy GraphRAG to your live production environment.

---

## ✅ Step 1: Code Pushed (DONE)

The GraphRAG code has been committed and pushed to GitHub:
- Commit: `ae03e89`
- All 13 files successfully uploaded
- Your repository: https://github.com/anandfrancis93/axium

---

## 📋 Step 2: Run Database Migrations (DO THIS NOW)

### Go to Supabase Dashboard

1. **Open**: https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc
2. **Login** with your Supabase account
3. Click **SQL Editor** in the left sidebar

### Run Migration #1: Create Tables

1. Click **"New Query"**
2. **Copy and paste** the entire contents from:
   - File: `supabase/migrations/20250114_graphrag_tables.sql`
   - Or get it from GitHub: https://github.com/anandfrancis93/axium/blob/main/supabase/migrations/20250114_graphrag_tables.sql

3. Click **"Run"** button (or press Ctrl+Enter)
4. **Verify**: Should see "Success. No rows returned" (this is good!)

### Run Migration #2: Create Function

1. Click **"New Query"** again
2. **Copy and paste** the entire contents from:
   - File: `supabase/functions/match_graphrag_entities.sql`
   - Or get it from GitHub: https://github.com/anandfrancis93/axium/blob/main/supabase/functions/match_graphrag_entities.sql

3. Click **"Run"**
4. **Verify**: Should see "Success. No rows returned"

### Verify Tables Were Created

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'graphrag%'
ORDER BY table_name;
```

**Expected Result** (should return 6 tables):
- graphrag_communities
- graphrag_entities
- graphrag_indexing_jobs
- graphrag_metrics
- graphrag_query_cache
- graphrag_relationships

If you see all 6 tables, migrations are successful! ✅

---

## 🔧 Step 3: Configure Production Environment Variables

### If using Vercel:

1. **Go to**: https://vercel.com/dashboard
2. **Select** your Axium project
3. **Navigate**: Settings → Environment Variables
4. **Add** the following variables:

#### Required Variables:

```bash
# GraphRAG Feature Flag (start disabled for safety)
NEXT_PUBLIC_ENABLE_GRAPH_RAG=false

# Neo4j Connection (already in your .env.local)
NEO4J_URI=neo4j+s://a7efc773.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=hBH_94IIMbdh8ORQEjw6TM9tiBHFmMaO7T3I9bIpHtg
NEO4J_DATABASE=neo4j
```

5. **Environment**: Select "Production", "Preview", and "Development"
6. Click **"Save"**

### If using other hosting:

Add the same environment variables to your platform's settings.

---

## 🚀 Step 4: Deploy to Production

### If using Vercel (Auto-Deploy):

Your push to GitHub should trigger automatic deployment!

1. **Check**: https://vercel.com/dashboard
2. **Look for**: Latest deployment (should be processing or completed)
3. **Wait**: ~2-3 minutes for deployment to finish

### If using manual deployment:

```bash
npm install  # Install neo4j-driver
npm run build
npm run start
```

---

## ✅ Step 5: Verify Deployment

1. **Visit your production site**
   - URL: (your Vercel app URL, e.g., https://axium-xyz.vercel.app)

2. **Check homepage loads** without errors

3. **Login** and verify current features work:
   - View subjects
   - Generate questions (should use Vector RAG normally)

4. **Go to GraphRAG admin**:
   - URL: `https://your-app.vercel.app/admin/graphrag`
   - Should show: **"GraphRAG is disabled"** with gray badge
   - This is correct! We'll enable it in the next step.

---

## 🔓 Step 6: Enable GraphRAG (Admin Testing Only)

Now that everything is deployed, enable GraphRAG for testing:

### Update Environment Variable:

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find: `NEXT_PUBLIC_ENABLE_GRAPH_RAG`
3. **Change value**: `false` → `true`
4. Click **"Save"**

### Trigger Redeployment:

Environment variable changes require redeployment:

**Option 1** (Recommended - via Git):
```bash
git commit --allow-empty -m "Enable GraphRAG for admin testing"
git push origin main
```

**Option 2** (via Vercel Dashboard):
- Go to **Deployments** tab
- Click **"..."** next to latest deployment
- Click **"Redeploy"**

Wait ~2-3 minutes for redeployment.

---

## 🧪 Step 7: Test on Production

1. **Go to GraphRAG Admin**:
   ```
   https://your-app.vercel.app/admin/graphrag
   ```

2. **Verify**:
   - ✅ Shows **"GraphRAG Enabled"** (green badge)
   - ✅ Lists all your chapters
   - ✅ All chapters show "Not indexed" (expected)

3. **Choose ONE small chapter** to test
   - Pick a chapter with ~10-20 pages
   - Click **"Index"** button
   - Monitor progress (takes 5-10 minutes)

**Watch for**:
- Status: Pending → Running → Completed
- Progress counter updates
- No errors in console

---

## 🎯 Step 8: Generate Your First GraphRAG Question

Once indexing completes:

1. **Go to Question Generator**: `https://your-app.vercel.app/admin`
2. **Select**:
   - Topic from the indexed chapter
   - Bloom Level: **4, 5, or 6** (to use GraphRAG)
   - Any dimension
3. **Click "Generate Question"**
4. **Observe**:
   - Question should be relationship-aware
   - Context should include graph entities and relationships
   - Should be more sophisticated than simple vector retrieval

---

## 🔄 Step 9: Enable Hybrid Mode (Recommended)

Once testing looks good:

1. **Edit**: `lib/config/features.ts`
   ```typescript
   modes: {
     vectorOnly: false,
     graphOnly: false,
     hybrid: true,       // ✅ Enable this
     sideBySide: false,
   }
   ```

2. **Commit and push**:
   ```bash
   git add lib/config/features.ts
   git commit -m "Enable hybrid RAG mode for production"
   git push origin main
   ```

**Result**:
- Bloom 1-3 → Vector RAG (fast)
- Bloom 4-6 → GraphRAG (intelligent)

---

## 📊 Step 10: Monitor Production

### Check Indexing Jobs:

```sql
-- Run in Supabase SQL Editor
SELECT
  chapter_id,
  status,
  entities_extracted,
  relationships_extracted,
  created_at
FROM graphrag_indexing_jobs
ORDER BY created_at DESC;
```

### Check Performance Metrics:

```sql
SELECT
  rag_mode,
  bloom_level,
  COUNT(*) as questions,
  AVG(retrieval_time_ms) as avg_retrieval_ms
FROM graphrag_metrics
GROUP BY rag_mode, bloom_level
ORDER BY bloom_level;
```

### Check Neo4j Graph:

1. Go to: https://console.neo4j.io
2. Select your database: `a7efc773`
3. Run query:
   ```cypher
   MATCH (n:Entity) RETURN count(n) as total_entities;
   ```

---

## 🆘 Troubleshooting

### "GraphRAG is disabled" (after enabling)

→ Did you redeploy after changing the env var?
→ Check Vercel deployment logs

### "Neo4j connection failed"

→ Verify env vars in Vercel are correct
→ Test connection from Neo4j console
→ Check if Neo4j allows Vercel IPs

### "Indexing stuck at Running"

→ Check Vercel Function Logs
→ May timeout if chapter is too large
→ Try a smaller chapter first

### Questions not using GraphRAG

→ Make sure Bloom Level is 4, 5, or 6
→ Verify hybrid mode is enabled in features.ts
→ Check if chapter was indexed successfully

---

## ✅ Success Checklist

After following all steps, you should have:

- ✅ Code deployed to production (Vercel)
- ✅ Database migrations applied (6 graphrag_* tables)
- ✅ Environment variables configured
- ✅ GraphRAG enabled for admin
- ✅ At least 1 chapter indexed successfully
- ✅ Test question generated using GraphRAG
- ✅ Hybrid mode enabled (optional but recommended)
- ✅ No errors in production logs

---

## 📚 Next Steps

1. **Index remaining chapters** (one per day to avoid rate limits)
2. **Monitor metrics** (query performance, cache hit rate)
3. **Compare question quality** (GraphRAG vs Vector)
4. **Gather feedback** (from yourself and users)
5. **Optimize** (tune extraction prompts if needed)

---

## 📖 Documentation

- **Full Setup Guide**: `docs/GRAPHRAG_SETUP.md`
- **Production Deployment**: `docs/GRAPHRAG_PRODUCTION_DEPLOYMENT.md`
- **Quick Start**: `scripts/graphrag-quickstart.md`

---

## 🎉 You're Ready!

GraphRAG is now deployed to production in a safe, controlled manner:

- ✅ Disabled by default (no impact on users)
- ✅ Admin-only access
- ✅ Separate database tables (no conflicts)
- ✅ Easy to enable/disable with feature flag
- ✅ Can rollback instantly if needed

**Start with Step 2** (database migrations) and work your way through!

Good luck! 🚀
