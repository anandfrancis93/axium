
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

interface Topic {
  id: string;
  name: string;
  parent_topic_id: string | null;
  hierarchy_level: number;
  children: Topic[];
}

async function showHierarchyTree() {
  const supabase = createScriptClient();
  const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, name, parent_topic_id, hierarchy_level')
    .eq('subject_id', subjectId);

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  // Build a map of id -> topic
  const topicMap = new Map<string, Topic>();
  topics.forEach((t: any) => {
    topicMap.set(t.id, { ...t, children: [] });
  });

  // Find topics that are part of a hierarchy (have parent OR have children)
  const hasParent = new Set<string>();
  const hasChildren = new Set<string>();

  topics.forEach((t: any) => {
    if (t.parent_topic_id) {
      hasParent.add(t.id);
      hasChildren.add(t.parent_topic_id);
    }
  });

  // Topics in hierarchy = has parent OR has children
  const inHierarchy = new Set([...hasParent, ...hasChildren]);

  // Build tree structure
  const roots: Topic[] = [];

  topics.forEach((t: any) => {
    if (!inHierarchy.has(t.id)) return; // Skip orphans

    const topic = topicMap.get(t.id)!;

    if (t.parent_topic_id && topicMap.has(t.parent_topic_id)) {
      const parent = topicMap.get(t.parent_topic_id)!;
      parent.children.push(topic);
    } else if (!t.parent_topic_id || !topicMap.has(t.parent_topic_id)) {
      // Root of a tree (or parent not in our set)
      if (inHierarchy.has(t.id)) {
        roots.push(topic);
      }
    }
  });

  // Sort children alphabetically
  function sortChildren(topic: Topic) {
    topic.children.sort((a, b) => a.name.localeCompare(b.name));
    topic.children.forEach(sortChildren);
  }
  roots.sort((a, b) => a.name.localeCompare(b.name));
  roots.forEach(sortChildren);

  // Render ASCII tree
  function renderTree(topic: Topic, prefix: string = '', isLast: boolean = true): string {
    const connector = isLast ? '└── ' : '├── ';
    const extension = isLast ? '    ' : '│   ';

    let result = prefix + connector + topic.name + '\n';

    topic.children.forEach((child, index) => {
      const childIsLast = index === topic.children.length - 1;
      result += renderTree(child, prefix + extension, childIsLast);
    });

    return result;
  }

  console.log(`\n=== HIERARCHICAL TOPIC TREES (${inHierarchy.size} topics) ===\n`);

  roots.forEach((root, index) => {
    // Count descendants
    function countDescendants(t: Topic): number {
      return t.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
    }
    const descendants = countDescendants(root);

    console.log(`${root.name} (${descendants} children)`);
    root.children.forEach((child, i) => {
      const isLast = i === root.children.length - 1;
      process.stdout.write(renderTree(child, '', isLast));
    });
    console.log('');
  });
}

showHierarchyTree();
