
import dotenv from 'dotenv';
import path from 'path';

// Quiet dotenv
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function checkStructureAndCount() {
    const supabase = createScriptClient();

    // 1. Try to select subject_id from topics directly
    const { data: topics, error } = await supabase
        .from('topics')
        .select('id, subject_id, name');

    if (error) {
        console.error("Error:", JSON.stringify(error));
        return;
    }

    // console.log(`Successfully fetched ${topics.length} topics.`);

    const subjectCounts: Record<string, { count: number, names: string[] }> = {};

    topics.forEach((t: any) => {
        const sid = t.subject_id || 'NULL_SUBJECT_ID';
        if (!subjectCounts[sid]) {
            subjectCounts[sid] = { count: 0, names: [] };
        }
        subjectCounts[sid].count++;
        if (subjectCounts[sid].names.length < 5) {
            subjectCounts[sid].names.push(t.name);
        }
    });

    console.log('DISTRIBUTION_START');
    console.log(JSON.stringify(subjectCounts, null, 2));
    console.log('DISTRIBUTION_END');
}

checkStructureAndCount();
