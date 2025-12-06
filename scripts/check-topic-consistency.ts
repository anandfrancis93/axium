
import dotenv from 'dotenv';
import path from 'path';

// Quiet dotenv
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function checkConsistency() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    // Fetch all topics with this subject_id
    const { data: topics, error } = await supabase
        .from('topics')
        .select(`
        id, 
        name, 
        subject_id,
        chapter_id,
        chapters (
            id,
            subject_id,
            name
        )
    `)
        .eq('subject_id', subjectId);

    if (error) {
        console.error("Error:", JSON.stringify(error));
        return;
    }

    console.log(`Checking ${topics.length} topics...`);

    let inconsistencyCount = 0;
    let orphanCount = 0;

    const anomalies: any[] = [];

    topics.forEach((t: any) => {
        // Check if chapter exists
        if (!t.chapters) {
            orphanCount++;
            anomalies.push({ type: 'ORPHAN_CHAPTER', name: t.name, id: t.id });
            return;
        }

        // Check if subject_id matches chapter's subject_id
        if (t.chapters.subject_id !== t.subject_id) {
            inconsistencyCount++;
            anomalies.push({
                type: 'SUBJECT_MISMATCH',
                name: t.name,
                topicSubject: t.subject_id,
                chapterSubject: t.chapters.subject_id
            });
        }
    });

    console.log(`Orphans (no chapter found): ${orphanCount}`);
    console.log(`Inconsistencies (topic.subject != chapter.subject): ${inconsistencyCount}`);

    if (anomalies.length > 0) {
        console.log("--- Anomalies ---");
        anomalies.forEach(a => console.log(JSON.stringify(a)));
    }
}

checkConsistency();
