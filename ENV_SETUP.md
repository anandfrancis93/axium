# Environment Variables Setup

This document lists all required environment variables for the Axium learning platform.

## Required Environment Variables

### 1. Next.js (`.env.local`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# xAI Grok (for question generation)
XAI_API_KEY=xai-...
```

### 2. Vercel Environment Variables

Add these in your Vercel project settings:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL
   - Expose: Yes (NEXT_PUBLIC_ prefix)

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anonymous key
   - Expose: Yes (NEXT_PUBLIC_ prefix)

3. **OPENAI_API_KEY**
   - Value: Your OpenAI API key (for embeddings)
   - Expose: No (server-side only)

4. **XAI_API_KEY**
   - Value: Your xAI API key (for Grok question generation)
   - Expose: No (server-side only)

## How to Get API Keys

### OpenAI API Key
1. Visit: https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### xAI API Key (Grok)
1. Visit: https://console.x.ai/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `xai-`)

### Supabase Keys
1. Visit your Supabase project dashboard
2. Go to Settings → API
3. Copy:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## AI Model Usage

- **OpenAI `text-embedding-3-small`**: Used for generating vector embeddings of text chunks
- **xAI `grok-3`**: Latest Grok model used for generating educational questions at various Bloom taxonomy levels

## Cost Considerations

- **OpenAI Embeddings**: ~$0.00002 per 1K tokens (very cheap)
- **xAI Grok**: Check current pricing at https://x.ai/api

Estimated cost for processing a typical chapter:
- ~10,000 characters of content
- ~10 chunks
- ~10 embedding calls: $0.0002
- Question generation: Variable based on Grok pricing

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- Never expose server-side API keys in client code
- Use `NEXT_PUBLIC_` prefix only for truly public values (like Supabase URL and anon key)
- Rotate API keys if compromised
