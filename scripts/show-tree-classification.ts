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

  // Classify each topic
  const getChildren = (topicId: string) => topics!.filter(t => t.parent_topic_id === topicId)
  const isLeaf = (topicId: string) => getChildren(topicId).length === 0

  const rootTopics = topics!.filter(t => t.parent_topic_id === null).sort((a, b) => a.name.localeCompare(b.name))

  console.log('='.repeat(80))
  console.log('TOPIC CLASSIFICATION: TREE, BRANCHES & LEAVES')
  console.log('='.repeat(80))
  console.log('')
  console.log('Legend:')
  console.log('  🌳 = TRUNK (Level 1 root with branches)')
  console.log('  🪵 = ROOT (Level 1 standalone, no children)')
  console.log('  🌿 = BRANCH (Has children)')
  console.log('  🍃 = LEAF (No children, end node)')
  console.log('')
  console.log('='.repeat(80))
  console.log('')

  function printTree(topic: Topic, indent: string = '', isLast: boolean = true) {
    const children = getChildren(topic.id).sort((a, b) => a.name.localeCompare(b.name))
    const hasChildren = children.length > 0

    // Determine symbol
    let symbol = ''
    if (indent === '') {
      // Root level (Level 1)
      symbol = hasChildren ? '🌳' : '🪵'
    } else {
      // Non-root
      symbol = hasChildren ? '🌿' : '🍃'
    }

    // Print current topic
    if (indent === '') {
      // Root level - no prefix
      console.log(`${symbol} ${topic.name}`)
    } else {
      // Use tree branch characters
      const branch = isLast ? '└── ' : '├── '
      console.log(indent + branch + `${symbol} ${topic.name}`)
    }

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

  // Statistics
  const trunks = rootTopics.filter(t => getChildren(t.id).length > 0).length
  const roots = rootTopics.filter(t => getChildren(t.id).length === 0).length
  const branches = topics!.filter(t => t.parent_topic_id !== null && getChildren(t.id).length > 0).length
  const leaves = topics!.filter(t => getChildren(t.id).length === 0).length

  console.log('')
  console.log('='.repeat(80))
  console.log('STATISTICS')
  console.log('='.repeat(80))
  console.log(`Total topics: ${topics!.length}`)
  console.log('')
  console.log(`🌳 Trunks (Level 1 with children): ${trunks}`)
  console.log(`🪵 Roots (Level 1 standalone):      ${roots}`)
  console.log(`🌿 Branches (Has children):         ${branches}`)
  console.log(`🍃 Leaves (No children):            ${leaves}`)
  console.log('')
  console.log('By Level:')
  console.log(`  Level 1: ${topics!.filter(t => t.hierarchy_level === 1).length}`)
  console.log(`  Level 2: ${topics!.filter(t => t.hierarchy_level === 2).length}`)
  console.log(`  Level 3: ${topics!.filter(t => t.hierarchy_level === 3).length}`)
  console.log(`  Level 4: ${topics!.filter(t => t.hierarchy_level === 4).length}`)
  console.log('='.repeat(80))
}

main()
