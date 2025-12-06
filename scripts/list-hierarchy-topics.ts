
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function listHierarchyTopics() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    const { data: topics, error } = await supabase
        .from('topics')
        .select('name, hierarchy_level')
        .eq('subject_id', subjectId)
        .in('hierarchy_level', [1, 2, 3])
        .order('hierarchy_level', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    const level1 = topics.filter((t: any) => t.hierarchy_level === 1);
    const level2 = topics.filter((t: any) => t.hierarchy_level === 2);
    const level3 = topics.filter((t: any) => t.hierarchy_level === 3);

    console.log(`\n=== LEVEL 1 (${level1.length} topics) ===`);
    level1.forEach((t: any) => console.log(`  - ${t.name}`));

    console.log(`\n=== LEVEL 2 (${level2.length} topics) ===`);
    level2.forEach((t: any) => console.log(`  - ${t.name}`));

    console.log(`\n=== LEVEL 3 (${level3.length} topics) ===`);
    level3.forEach((t: any) => console.log(`  - ${t.name}`));
}

listHierarchyTopics();
