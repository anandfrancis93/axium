
import dotenv from 'dotenv';
import path from 'path';

// Quiet dotenv
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function inspectAndFindDuplicates() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    // 1. Inspect one row
    const { data: sample, error: sError } = await supabase
        .from('topics')
        .select('*')
        .limit(1);

    if (sError) {
        console.error("Sample fetch error:", sError);
    } else if (sample && sample.length > 0) {
        console.log('--- Sample Topic Columns ---');
        console.log(Object.keys(sample[0]).join(', '));
        // console.log(sample[0]);
    }

    // 2. Check for duplicates in names
    const { data: topics, error } = await supabase
        .from('topics')
        .select('name')
        .eq('subject_id', subjectId);

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    const nameCounts: Record<string, number> = {};
    topics.forEach((t: any) => {
        nameCounts[t.name] = (nameCounts[t.name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCounts).filter(([_, count]) => count > 1);

    console.log(`Total topics fetched: ${topics.length}`);
    console.log(`Unique names: ${Object.keys(nameCounts).length}`);
    console.log(`Duplicate names found: ${duplicates.length}`);

    if (duplicates.length > 0) {
        console.log('--- Duplicates ---');
        duplicates.forEach(([name, count]) => console.log(`${name}: ${count}`));
    }
}

inspectAndFindDuplicates();
