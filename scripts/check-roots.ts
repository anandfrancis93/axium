
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function checkRoots() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    const { data: topics, error } = await supabase
        .from('topics')
        .select('id, name, parent_topic_id')
        .eq('subject_id', subjectId)
        .is('parent_topic_id', null);

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    console.log(`Topics with NULL parent_topic_id: ${topics.length}`);
    topics.forEach((t: any) => console.log(`- ${t.name}`));
}

checkRoots();
