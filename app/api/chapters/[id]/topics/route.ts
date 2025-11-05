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

      // Track current domain and objective as we parse
      let currentDomain = ''
      let currentObjective = ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        // Skip empty lines
        if (!trimmedLine) {
          continue
        }

        // Extract domain header (but don't add as topic)
        const domainMatch = trimmedLine.match(/^Domain (\d+\.\d+) - (.+)$/)
        if (domainMatch) {
          currentDomain = domainMatch[2].trim() // Just the name, e.g., "General Security Concepts"
          continue
        }

        // Extract objective from "From X.X" headers (but don't add section name as topic)
        if (trimmedLine.startsWith('From ')) {
          const objectiveMatch = trimmedLine.match(/From (\d+\.\d+)/)
          if (objectiveMatch) {
            currentObjective = objectiveMatch[1]
          }
          continue
        }

        // Extract ONLY topics in format: "Topic Name (context)"
        // Must have at least one set of parentheses to be considered a topic
        const topicMatch = trimmedLine.match(/^([^(]+)\s+\((.+?)\)(?:\s+\((.+?)\))?$/)

        if (topicMatch) {
          const topicName = topicMatch[1].trim()

          // Skip if it looks like a header or section name
          if (topicName.match(/^(From|Domain|Objective|Section|Chapter)/i)) {
            continue
          }

          // Keep the full topic with context
          const fullTopic = trimmedLine

          // Only add if it's a reasonable length
          if (fullTopic.length > 5 && fullTopic.length < 150) {
            // Build the prefixed topic
            let prefixedTopic = fullTopic

            if (currentDomain && currentObjective) {
              prefixedTopic = `[${currentDomain} ${currentObjective}] ${fullTopic}`
            } else if (currentDomain) {
              prefixedTopic = `[${currentDomain}] ${fullTopic}`
            }

            topics.add(prefixedTopic)
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
