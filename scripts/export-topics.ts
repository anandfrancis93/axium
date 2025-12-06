
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function exportAllTopics() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    const { data: topics, error } = await supabase
        .from('topics')
        .select('name, description')
        .eq('subject_id', subjectId)
        .order('name', { ascending: true });

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    // Output as simple list
    const output = topics.map((t: any) => `${t.name}${t.description ? ` - ${t.description}` : ''}`).join('\n');

    fs.writeFileSync('all-topics.txt', output);
    console.log(`Exported ${topics.length} topics to all-topics.txt`);
}

exportAllTopics();
