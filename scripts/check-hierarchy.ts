
import dotenv from 'dotenv';
import path from 'path';

// Quiet dotenv
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function checkHierarchy() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    // Fetch id, name, hierarchy_level
    const { data: topics, error } = await supabase
        .from('topics')
        .select('id, name, hierarchy_level')
        .eq('subject_id', subjectId);

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    const levelCounts: Record<string, number> = {};
    const levelNames: Record<string, string[]> = {};

    topics.forEach((t: any) => {
        const lvl = t.hierarchy_level !== null ? String(t.hierarchy_level) : 'NULL';
        levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;

        if (!levelNames[lvl]) levelNames[lvl] = [];
        if (levelNames[lvl].length < 10) levelNames[lvl].push(t.name);
    });

    console.log(`Total topics: ${topics.length}`);
    console.log('--- Hierarchy Distribution ---');
    for (const [lvl, count] of Object.entries(levelCounts)) {
        console.log(`Level ${lvl}: ${count}`);
        console.log(`Examples: ${levelNames[lvl].join(', ')}`);
    }
}

checkHierarchy();
