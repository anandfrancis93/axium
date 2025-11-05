import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chapterId } = await params

    // Fetch all chunks for this chapter
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('content')
      .eq('chapter_id', chapterId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ topics: [] })
    }

    // Extract topics from content
    const topics = new Set<string>()

    for (const chunk of chunks) {
      const content = chunk.content

      // Pattern 1: "Topic Name (category)" format
      const pattern1Matches = content.matchAll(/^(.+?)\s+\((.+?)\)/gm)
      for (const match of pattern1Matches) {
        const topicName = match[1].trim()
        if (topicName.length > 3 && topicName.length < 100) {
          topics.add(topicName)
        }
      }

      // Pattern 2: "From X.X (Section Name):" format - extract section names
      const pattern2Matches = content.matchAll(/From \d+\.\d+ \((.+?)\):/g)
      for (const match of pattern2Matches) {
        const sectionName = match[1].trim()
        if (sectionName.length > 3 && sectionName.length < 100) {
          topics.add(sectionName)
        }
      }

      // Pattern 3: Lines that end with specific keywords (more generic topics)
      const lines = content.split('\n')
      for (const line of lines) {
        const trimmedLine = line.trim()
        // Extract key terms (avoid very short or very long lines)
        if (trimmedLine.length > 5 && trimmedLine.length < 80 && !trimmedLine.includes('Domain')) {
          // Check if it looks like a topic (capitalized, not too generic)
          if (/^[A-Z]/.test(trimmedLine) && !trimmedLine.includes('From ')) {
            const topic = trimmedLine.replace(/\s+\(.+?\)$/, '').trim()
            if (topic.length > 3) {
              topics.add(topic)
            }
          }
        }
      }
    }

    // Convert to array and sort
    const topicsArray = Array.from(topics).sort()

    return NextResponse.json({
      topics: topicsArray,
      count: topicsArray.length
    })
  } catch (error) {
    console.error('Error extracting topics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
