
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function checkHierarchy() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    const { data: topics, error } = await supabase
        .from('topics')
        .select('name, hierarchy_level')
        .eq('subject_id', subjectId);

    if (error) { process.exit(1); }

    const counts: Record<string, { count: number, examples: string[] }> = {};

    topics.forEach((t: any) => {
        const lvl = String(t.hierarchy_level);
        if (!counts[lvl]) counts[lvl] = { count: 0, examples: [] };
        counts[lvl].count++;
        if (counts[lvl].examples.length < 10) counts[lvl].examples.push(t.name);
    });

    console.log("JSON_START");
    console.log(JSON.stringify(counts, null, 2));
    console.log("JSON_END");
}

checkHierarchy();
