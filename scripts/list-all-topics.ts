
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createScriptClient } from '../lib/supabase/script-client';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listAllTopics() {
    const supabase = createScriptClient();

    const { data: topics, error } = await supabase
        .from('topics')
        .select('name')
        .order('name');

    if (error) {
        console.error(error);
        return;
    }

    if (topics) {
        const content = topics.map(t => t.name).join('\n');
        fs.writeFileSync('all-topics-flat.txt', content, 'utf-8');
        console.log(`Wrote ${topics.length} topics to all-topics-flat.txt`);
    }
}

listAllTopics();
