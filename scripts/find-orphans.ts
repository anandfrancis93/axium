
import dotenv from 'dotenv';
import path from 'path';

// Quiet dotenv
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function findOrphans() {
    const supabase = createScriptClient();
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    // 1. Fetch all topics for the subject
    const { data: topics, error: tError } = await supabase
        .from('topics')
        .select('id, name, chapter_id')
        .eq('subject_id', subjectId);

    if (tError) {
        console.error("Topic fetch error:", tError);
        return;
    }

    // 2. Fetch all chapters for the subject
    const { data: chapters, error: cError } = await supabase
        .from('chapters')
        .select('id')
        .eq('subject_id', subjectId);

    if (cError) {
        console.error("Chapter fetch error:", cError);
        return;
    }

    const validChapterIds = new Set(chapters.map((c: any) => c.id));
    const orphans = topics.filter((t: any) => !validChapterIds.has(t.chapter_id));

    console.log(`Total topics: ${topics.length}`);
    console.log(`Total chapters: ${chapters.length}`);
    console.log(`Orphan topics (chapter_id not found in valid chapters): ${orphans.length}`);

    if (orphans.length > 0) {
        console.log('--- Orphan Topics ---');
        orphans.forEach((t: any) => console.log(`${t.name} (Topic ID: ${t.id}, Invalid Chapter: ${t.chapter_id})`));
    }
}

findOrphans();
