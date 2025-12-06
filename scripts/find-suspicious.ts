
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function findSuspicious() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    const { data: topics, error } = await supabase
        .from('topics')
        .select('id, name, description, created_at')
        .eq('subject_id', subjectId);

    if (error) return;

    const suspicious: any[] = [];

    topics.forEach((t: any) => {
        const n = t.name.toLowerCase();
        const d = (t.description || '').toLowerCase();

        if (n.includes('test') || n.includes('temp') || n.includes('copy') || n.includes('foo') || n.includes('bar')) {
            suspicious.push({ reason: 'name_suspicious', ...t });
        }
        if (d.includes('deprecated') || d.includes('legacy') || d.includes('do not use')) {
            suspicious.push({ reason: 'desc_suspicious', ...t });
        }
    });

    console.log(`Suspicious topics found: ${suspicious.length}`);
    suspicious.forEach(s => console.log(`${s.name} (${s.reason})`));
}

findSuspicious();
