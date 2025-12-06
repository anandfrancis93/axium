
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function checkHierarchyStructure() {
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

    const withParent = topics.filter((t: any) => t.parent_topic_id !== null);
    const withoutParent = topics.filter((t: any) => t.parent_topic_id === null);

    console.log(`Total topics: ${topics.length}`);
    console.log(`Topics WITH a parent (linked in hierarchy): ${withParent.length}`);
    console.log(`Topics WITHOUT a parent (orphans/roots): ${withoutParent.length}`);

    // Break down orphans by level
    const orphansByLevel: Record<string, number> = {};
    withoutParent.forEach((t: any) => {
        const lvl = String(t.hierarchy_level);
        orphansByLevel[lvl] = (orphansByLevel[lvl] || 0) + 1;
    });

    console.log(`\n--- Orphans by hierarchy_level ---`);
    for (const [lvl, count] of Object.entries(orphansByLevel).sort((a, b) => Number(a[0]) - Number(b[0]))) {
        console.log(`  Level ${lvl}: ${count} orphans`);
    }

    // Show some examples of level 4 orphans (topics added via UI that have no parent)
    const level4Orphans = withoutParent.filter((t: any) => t.hierarchy_level === 4);
    if (level4Orphans.length > 0) {
        console.log(`\n--- Sample Level 4 orphans (first 10) ---`);
        level4Orphans.slice(0, 10).forEach((t: any) => console.log(`  - ${t.name}`));
    }
}

checkHierarchyStructure();
