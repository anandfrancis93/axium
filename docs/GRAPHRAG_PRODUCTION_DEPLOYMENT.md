# GraphRAG Production Deployment Guide

Deploy GraphRAG to your live production environment safely without disrupting existing users.

---

## Pre-Deployment Checklist

Before deploying to production:

- ✅ GraphRAG code is complete and tested locally
- ✅ Feature flag defaults to `false` (GraphRAG disabled by default)
- ✅ All GraphRAG tables use `graphrag_` prefix (no conflicts)
- ✅ Admin-only access enforced via RLS policies
- ✅ Neo4j credentials are secure

---

## Deployment Strategy

**Goal**: Deploy GraphRAG infrastructure without affecting current users.

**Approach**:
1. Deploy code with GraphRAG **disabled by default**
2. Run database migrations (separate tables, no conflicts)
3. Enable GraphRAG for **admin testing only**
4. Index chapters in background
5. Gradually enable hybrid mode
6. Monitor metrics before full rollout

---

## Step-by-Step Deployment

### Step 1: Commit Code to Git

First, let's commit all the GraphRAG changes:

```bash
# Check what files were added/modified
git status

# Add all GraphRAG files
git add .

# Commit with descriptive message
git commit -m "feat: Add GraphRAG system for improved question generation

- Add feature flag system (disabled by default)
- Create separate graphrag_* database tables
- Implement entity extraction and graph storage
- Add Neo4j integration for knowledge graph
- Create GraphRAG admin interface
- Support hybrid RAG mode (vector + graph)
- Add comprehensive documentation

GraphRAG is disabled by default. Enable with:
NEXT_PUBLIC_ENABLE_GRAPH_RAG=true"

# Push to your main branch
git push origin main
```

### Step 2: Run Database Migrations on Production

**IMPORTANT**: Run migrations on **production Supabase**, not localhost!

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc
   - Click **SQL Editor**

2. **Run Migration #1** - Create GraphRAG tables:
   - Copy entire contents of: `supabase/migrations/20250114_graphrag_tables.sql`
   - Paste into SQL Editor
   - Click **Run**
   - Verify: No errors, tables created successfully

3. **Run Migration #2** - Create entity matching function:
   - Copy entire contents of: `supabase/functions/match_graphrag_entities.sql`
   - Paste into SQL Editor
   - Click **Run**
   - Verify: Function created successfully

4. **Verify Tables Exist**:
   ```sql
   -- Run this query to verify
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'graphrag%';
   ```

   Should return:
   - `graphrag_indexing_jobs`
   - `graphrag_entities`
   - `graphrag_relationships`
   - `graphrag_communities`
   - `graphrag_query_cache`
   - `graphrag_metrics`

### Step 3: Configure Production Environment Variables

**Where to set environment variables depends on your hosting:**

#### Option A: Vercel (Most likely)

1. Go to: https://vercel.com/dashboard
2. Select your **Axium** project
3. Go to **Settings** → **Environment Variables**
4. Add the following:

```bash
# GraphRAG Feature Flag (disabled by default for safety)
NEXT_PUBLIC_ENABLE_GRAPH_RAG=false

# Neo4j Connection (already configured in your .env.local)
NEO4J_URI=neo4j+s://a7efc773.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=hBH_94IIMbdh8ORQEjw6TM9tiBHFmMaO7T3I9bIpHtg
NEO4J_DATABASE=neo4j
```

**Important**: Set `NEXT_PUBLIC_ENABLE_GRAPH_RAG=false` initially. We'll enable it after deployment.

5. **Environment**: Select **Production**, **Preview**, and **Development**
6. Click **Save**

#### Option B: Other Hosting (Netlify, Railway, etc.)

- Add the same environment variables to your hosting platform's environment settings
- Follow your platform's documentation for adding env vars

### Step 4: Deploy to Production

#### If using Vercel (automatic deployment):

```bash
# Your push to main will trigger auto-deployment
git push origin main

# Or trigger manual deployment
vercel --prod
```

Wait for deployment to complete (~2-3 minutes).

#### If using manual deployment:

```bash
npm run build
npm run start
```

### Step 5: Verify Deployment

1. **Visit your production site**:
   ```
   https://your-app.vercel.app
   ```

2. **Check homepage loads normally** (no errors)

3. **Verify current features work**:
   - Login/logout
   - View subjects
   - Generate questions (should use Vector RAG as normal)

4. **Check GraphRAG is disabled**:
   - Go to: `https://your-app.vercel.app/admin/graphrag`
   - Should show: **"GraphRAG is disabled"** with gray badge

### Step 6: Enable GraphRAG for Admin Testing

Now that everything is deployed, enable GraphRAG **for admin testing only**:

#### Update Production Environment Variable:

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find: `NEXT_PUBLIC_ENABLE_GRAPH_RAG`
3. Change value from `false` to `true`
4. Click **Save**

#### Trigger Redeployment:

Vercel requires redeployment for environment variable changes:

```bash
# Option 1: Trigger via Git (recommended)
git commit --allow-empty -m "Enable GraphRAG for admin testing"
git push origin main

# Option 2: Trigger via Vercel CLI
vercel --prod

# Option 3: Use Vercel Dashboard
# Go to Deployments → Click "..." → Redeploy
```

Wait for redeployment (~2-3 minutes).

### Step 7: Test on Production Admin Panel

1. **Go to GraphRAG Admin**:
   ```
   https://your-app.vercel.app/admin/graphrag
   ```

2. **Verify**:
   - ✅ Shows **"GraphRAG Enabled"** with green badge
   - ✅ Lists all your chapters
   - ✅ No indexing jobs yet (all show "Not indexed")

3. **Test Neo4j Connection**:
   - Check browser console for any connection errors
   - If errors, verify Neo4j credentials in production env vars

### Step 8: Index Your First Chapter (Production)

**Start with ONE small chapter** to test:

1. Choose a small chapter (10-20 pages)
2. Click **"Index"** button
3. Monitor progress:
   - Status will change: Pending → Running → Completed
   - This takes **5-10 minutes** (don't close the page)

**What to watch for:**
- ✅ Status updates to "Running"
- ✅ Progress counter increases (X/Y chunks)
- ✅ Completes without errors
- ⚠️ If it fails, check:
  - Server logs (Vercel Dashboard → Deployments → View Function Logs)
  - Anthropic API rate limits
  - Neo4j connection

### Step 9: Test Question Generation

Once indexing completes:

1. **Go to Question Generator**:
   ```
   https://your-app.vercel.app/admin
   ```

2. **Generate a test question**:
   - Select topic from the indexed chapter
   - Set Bloom Level to **4, 5, or 6** (to trigger GraphRAG)
   - Choose any dimension
   - Click **"Generate Question"**

3. **Verify GraphRAG is working**:
   - Check the generated question quality
   - Look for relationship-based context
   - Should be more sophisticated than vector-only questions

### Step 10: Enable Hybrid Mode (Recommended)

Once testing looks good, enable hybrid mode for production:

1. **Edit** `lib/config/features.ts`:
   ```typescript
   export const features: Features = {
     graphRAG: {
       enabled: process.env.NEXT_PUBLIC_ENABLE_GRAPH_RAG === 'true',
       description: 'Knowledge Graph-based RAG for improved question generation',
       adminOnly: true,
       modes: {
         vectorOnly: false,     // ❌ Disable
         graphOnly: false,      // ❌ Disable
         hybrid: true,          // ✅ Enable
         sideBySide: false,     // Only for testing
       }
     }
   }
   ```

2. **Commit and push**:
   ```bash
   git add lib/config/features.ts
   git commit -m "Enable hybrid RAG mode for production"
   git push origin main
   ```

3. **Verify**:
   - Bloom 1-3 questions → Use Vector RAG (fast)
   - Bloom 4-6 questions → Use GraphRAG (smart)

---

## Gradual Rollout Strategy

### Week 1: Admin Testing Only
- ✅ GraphRAG enabled
- ✅ Index 1-2 chapters
- ✅ Test question generation manually
- ✅ Verify no errors in production logs

### Week 2: Index All Chapters
- Index remaining chapters (one per day to avoid rate limits)
- Monitor Neo4j storage usage
- Check Supabase database size

### Week 3: Enable Hybrid Mode
- Switch from `vectorOnly` to `hybrid` mode
- Monitor question generation performance
- Compare Vector vs Graph metrics in `graphrag_metrics` table

### Week 4: Full Production
- GraphRAG fully operational for Bloom 4-6
- Monitor user engagement and learning outcomes
- A/B test if desired

---

## Monitoring & Maintenance

### Daily Monitoring (First Week)

Check these metrics daily:

1. **Indexing Job Status**:
   ```sql
   -- In Supabase SQL Editor
   SELECT
     status,
     COUNT(*) as count,
     AVG(entities_extracted) as avg_entities,
     AVG(relationships_extracted) as avg_relationships
   FROM graphrag_indexing_jobs
   GROUP BY status;
   ```

2. **GraphRAG Performance**:
   ```sql
   SELECT
     rag_mode,
     bloom_level,
     COUNT(*) as question_count,
     AVG(retrieval_time_ms) as avg_retrieval_ms,
     AVG(total_time_ms) as avg_total_ms
   FROM graphrag_metrics
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY rag_mode, bloom_level
   ORDER BY bloom_level, rag_mode;
   ```

3. **Cache Hit Rate**:
   ```sql
   SELECT get_graphrag_cache_stats();
   ```

4. **Neo4j Storage**:
   - Go to: https://console.neo4j.io
   - Check database size
   - Monitor connection count

### Weekly Maintenance

1. **Clean expired cache**:
   ```sql
   SELECT cleanup_graphrag_cache();
   ```

2. **Review failed jobs**:
   ```sql
   SELECT * FROM graphrag_indexing_jobs
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Re-index if needed**:
   - If content updated, re-index affected chapters

---

## Rollback Plan

If something goes wrong, you can safely rollback:

### Emergency Rollback (Immediate)

**Disable GraphRAG**:
1. Vercel Dashboard → Environment Variables
2. Set `NEXT_PUBLIC_ENABLE_GRAPH_RAG=false`
3. Redeploy

This **instantly reverts to Vector RAG** for all users.

### Full Rollback (if needed)

**Revert code changes**:
```bash
git revert <commit-hash>
git push origin main
```

**Drop GraphRAG tables** (if you want to remove completely):
```sql
-- CAUTION: This deletes all GraphRAG data
DROP TABLE IF EXISTS graphrag_metrics CASCADE;
DROP TABLE IF EXISTS graphrag_query_cache CASCADE;
DROP TABLE IF EXISTS graphrag_communities CASCADE;
DROP TABLE IF EXISTS graphrag_relationships CASCADE;
DROP TABLE IF EXISTS graphrag_entities CASCADE;
DROP TABLE IF EXISTS graphrag_indexing_jobs CASCADE;
DROP FUNCTION IF EXISTS match_graphrag_entities;
DROP FUNCTION IF EXISTS cleanup_graphrag_cache;
DROP FUNCTION IF EXISTS get_graphrag_cache_stats;
```

**Clear Neo4j graph**:
```cypher
// In Neo4j Browser
MATCH (n) DETACH DELETE n;
```

---

## Production Best Practices

### Security

✅ **Never expose Neo4j credentials in client-side code**
- All Neo4j calls must be server-side (API routes, not client components)
- Use environment variables for all credentials

✅ **Admin-only access enforced**
- GraphRAG admin panel checks user role
- RLS policies prevent non-admins from writing

✅ **Rate limiting**
- Entity extraction has built-in delays (6s between batches)
- Prevents API rate limit exhaustion

### Performance

✅ **Cache query results**
- Expensive graph queries are cached for 7 days
- Check cache hit rate weekly

✅ **Batch operations**
- Entity extraction processes 5 chunks at a time
- Embeddings generated in batches of 100

✅ **Hybrid mode recommended**
- Use Vector RAG for simple questions (Bloom 1-3)
- Use GraphRAG only for complex questions (Bloom 4-6)

### Cost Optimization

| Operation | Cost per Chapter | Frequency |
|-----------|------------------|-----------|
| Indexing | ~$0.15 | One-time (or when content updates) |
| Query | $0 (graph traversal) | Every question |
| Generation | Same as Vector RAG | Every question |

**Total extra cost**: ~$0.15 per chapter (one-time)

---

## Troubleshooting Production Issues

### Issue: "Neo4j connection failed" in production

**Cause**: Environment variables not set correctly

**Fix**:
1. Check Vercel Dashboard → Environment Variables
2. Verify `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` are set
3. Test connection from Vercel Function Logs
4. Ensure Neo4j instance allows connections from Vercel IPs

### Issue: "Indexing stuck at Running"

**Cause**: Serverless function timeout (Vercel: 10s default, 60s Pro)

**Fix**:
1. Check Vercel Function Logs for timeout errors
2. Upgrade to Vercel Pro for 60s timeout
3. Or process in smaller batches

### Issue: "Rate limit exceeded" during indexing

**Cause**: Too many Anthropic API calls

**Fix**:
1. Slow down batch processing (increase delay in `batchExtractEntities`)
2. Index chapters one at a time
3. Upgrade Anthropic API tier if needed

### Issue: GraphRAG returns empty context

**Cause**: Chapter not indexed or embedding mismatch

**Fix**:
1. Verify chapter indexing completed successfully
2. Check `graphrag_entities` table has data for that chapter
3. Re-index the chapter if needed

---

## Success Checklist

After deployment, verify:

- ✅ Code deployed to production (check Vercel deployment status)
- ✅ Database migrations applied (6 graphrag_* tables exist)
- ✅ Environment variables configured (GraphRAG enabled)
- ✅ GraphRAG admin panel accessible
- ✅ At least 1 chapter indexed successfully
- ✅ Test question generated using GraphRAG
- ✅ No errors in production logs
- ✅ Current Vector RAG still working normally
- ✅ Hybrid mode enabled (if ready)

---

## Next Steps After Deployment

1. **Index remaining chapters** (one per day)
2. **Monitor performance metrics** (check dashboards)
3. **Compare question quality** (GraphRAG vs Vector)
4. **Gather user feedback** (if visible to students)
5. **Optimize prompts** (if extraction quality needs improvement)

---

## Support & Resources

- **Full Setup Guide**: `docs/GRAPHRAG_SETUP.md`
- **Quick Start**: `scripts/graphrag-quickstart.md`
- **Vercel Docs**: https://vercel.com/docs
- **Neo4j Docs**: https://neo4j.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

## Summary

**Safe Deployment Strategy**:
1. ✅ Deploy with GraphRAG **disabled** by default
2. ✅ Run migrations (separate tables, no conflicts)
3. ✅ Enable for **admin testing only**
4. ✅ Index chapters gradually
5. ✅ Enable hybrid mode when ready
6. ✅ Monitor metrics and rollback if needed

**Your production users are safe** - GraphRAG is additive, not disruptive!

Good luck with your deployment! 🚀
