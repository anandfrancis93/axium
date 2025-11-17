import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Topic {
  id: string
  name: string
  parent_topic_id: string | null
  hierarchy_level: number
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Fetch all topics
  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, name, parent_topic_id, hierarchy_level')
    .order('name')

  if (error) {
    console.error('Error:', error)
    return
  }

  // Build tree structure
  const topicMap = new Map<string, Topic>(topics!.map(t => [t.id, t]))
  const rootTopics = topics!.filter(t => t.parent_topic_id === null)

  console.log('='.repeat(70))
  console.log('TOPIC HIERARCHY TREE')
  console.log('='.repeat(70))
  console.log('')

  // Recursive function to print tree with proper branch characters
  function printTree(topic: Topic, indent: string = '', isLast: boolean = true) {
    // Print current topic
    if (indent === '') {
      // Root level - no prefix
      console.log(topic.name)
    } else {
      // Use tree branch characters
      const branch = isLast ? '└── ' : '├── '
      console.log(indent + branch + topic.name)
    }

    // Find children
    const children = topics!.filter(t => t.parent_topic_id === topic.id)
      .sort((a, b) => a.name.localeCompare(b.name))

    // Print each child
    children.forEach((child, index) => {
      const isLastChild = index === children.length - 1
      const childIndent = indent + (isLast ? '    ' : '│   ')
      printTree(child, childIndent, isLastChild)
    })
  }

  // Print all root topics
  rootTopics.forEach((topic, index) => {
    printTree(topic, '', true)
    if (index < rootTopics.length - 1) {
      console.log('')
    }
  })

  console.log('')
  console.log('='.repeat(70))
  console.log(`Total topics: ${topics!.length}`)
  console.log(`  Level 1: ${topics!.filter(t => t.hierarchy_level === 1).length}`)
  console.log(`  Level 2: ${topics!.filter(t => t.hierarchy_level === 2).length}`)
  console.log(`  Level 3: ${topics!.filter(t => t.hierarchy_level === 3).length}`)
  console.log(`  Level 4: ${topics!.filter(t => t.hierarchy_level === 4).length}`)
  console.log('='.repeat(70))
}

main()
