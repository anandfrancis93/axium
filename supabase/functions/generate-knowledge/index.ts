import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CHAPTER_ID = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all leaf topics
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name, full_name')
      .eq('chapter_id', CHAPTER_ID)
      .gte('depth', 2)
      .order('full_name')

    let processed = 0
    let succeeded = 0

    for (const topic of topics!) {
      try {
        // Generate content with Grok
        const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('XAI_API_KEY')}`
          },
          body: JSON.stringify({
            model: 'grok-4-fast-reasoning',
            messages: [{
              role: 'user',
              content: `You are a Security+ (SY0-701) certification expert instructor. Generate comprehensive study content for this topic:

Topic: ${topic.full_name}

Create detailed educational content that includes:

1. **Clear Definition**: Explain what ${topic.name} is in the context of cybersecurity
2. **Key Concepts**: List and explain the main concepts students must understand
3. **Real-World Applications**: Provide concrete examples of how this is used in practice
4. **Security Implications**: Explain why this matters for security professionals
5. **Common Exam Points**: What specific aspects are frequently tested on Security+ exam
6. **Best Practices**: What are the recommended approaches or standards

Write 300-500 words in clear, educational language. Focus on practical understanding, not just definitions. Make it exam-focused and actionable.

Do NOT mention the syllabus structure. Write as if teaching the actual concept.`
            }],
            temperature: 0.7,
            max_tokens: 1000
          })
        })

        const grokData = await grokResponse.json()
        const content = grokData.choices[0].message.content

        // Generate embedding with OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: content
          })
        })

        const embeddingData = await embeddingResponse.json()
        const embedding = embeddingData.data[0].embedding

        // Check if chunk exists
        const { data: existing } = await supabase
          .from('knowledge_chunks')
          .select('id')
          .eq('chapter_id', CHAPTER_ID)
          .eq('topic_id', topic.id)
          .eq('chunk_index', 0)
          .single()

        if (existing) {
          // Update existing
          await supabase
            .from('knowledge_chunks')
            .update({ content, embedding })
            .eq('id', existing.id)
        } else {
          // Insert new
          await supabase
            .from('knowledge_chunks')
            .insert({
              chapter_id: CHAPTER_ID,
              topic_id: topic.id,
              content,
              embedding,
              chunk_index: 0
            })
        }

        succeeded++
        processed++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Failed for ${topic.full_name}:`, error)
        processed++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        succeeded,
        message: `Generated ${succeeded}/${processed} knowledge chunks`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
