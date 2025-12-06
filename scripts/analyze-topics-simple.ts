
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function checkStructureAndCount() {
    const supabase = createScriptClient();

    // 1. Try to select subject_id from topics directly
    const { data: topics, error } = await supabase
        .from('topics')
        .select('id, subject_id, name');

    if (error) {
        console.log("Could not select subject_id from topics directly.");
        console.error(error);
        return;
    }

    console.log(`Successfully fetched ${topics.length} topics from DB.`);

    // 2. Group by subject_id
    const subjectCounts: Record<string, { count: number, names: string[] }> = {};

    topics.forEach((t: any) => {
        const sid = t.subject_id || 'NULL_SUBJECT_ID';
        if (!subjectCounts[sid]) {
            subjectCounts[sid] = { count: 0, names: [] };
        }
        subjectCounts[sid].count++;
        // Store a few names for context
        if (subjectCounts[sid].names.length < 3) {
            subjectCounts[sid].names.push(t.name);
        }
    });

    console.log('--- distribution ---');
    for (const [sid, data] of Object.entries(subjectCounts)) {
        console.log(`Subject ID: ${sid}`);
        console.log(`Count: ${data.count}`);
        console.log(`Examples: ${data.names.join(', ')}`);
        console.log('-------------------');
    }
}

checkStructureAndCount();
