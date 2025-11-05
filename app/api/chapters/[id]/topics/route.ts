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

    // Extract topics from content with domain context
    const topics = new Set<string>()

    for (const chunk of chunks) {
      const content = chunk.content
      const lines = content.split('\n')

      // Track current domain as we parse
      let currentDomain = ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        // Skip empty lines
        if (!trimmedLine) {
          continue
        }

        // Extract domain header
        const domainMatch = trimmedLine.match(/^Domain (\d+\.\d+) - (.+)$/)
        if (domainMatch) {
          currentDomain = `Domain ${domainMatch[1]} - ${domainMatch[2]}`
          continue
        }

        // Skip "From X.X" section headers - we'll extract the section name separately
        if (trimmedLine.startsWith('From ')) {
          const sectionMatch = trimmedLine.match(/From (\d+\.\d+) \((.+?)\):/)
          if (sectionMatch) {
            const sectionName = sectionMatch[2].trim()
            const objective = sectionMatch[1]
            if (currentDomain) {
              topics.add(`[${currentDomain} | ${objective}] ${sectionName}`)
            } else {
              topics.add(`[Objective ${objective}] ${sectionName}`)
            }
          }
          continue
        }

        // Extract topics in format: "Topic Name (context)"
        // Example: "Technical (control category)"
        // Example: "Hardware security module (HSM) (key management)"
        const topicMatch = trimmedLine.match(/^(.+?)\s+\((.+?)\)(?:\s+\((.+?)\))?$/)

        if (topicMatch) {
          // Keep the full topic with context and add domain prefix
          const fullTopic = trimmedLine

          // Only add if it's a reasonable length and has meaningful content
          if (fullTopic.length > 5 && fullTopic.length < 150) {
            // Avoid adding very generic entries
            if (!fullTopic.match(/^(From|Domain|Example|Note|See)/i)) {
              if (currentDomain) {
                topics.add(`[${currentDomain}] ${fullTopic}`)
              } else {
                topics.add(fullTopic)
              }
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
