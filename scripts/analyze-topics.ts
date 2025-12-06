
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function analyzetopics() {
    const supabase = createScriptClient();

    try {
        // Get all topics with their subject info via the chapter relationship
        // Note: The schema shows topics -> chapters -> subjects
        // Wait, let me check the schema again. 
        // The code in page.tsx used .eq('subject_id', ...) on topics table directly?
        // Let me check schema.sql again in memory or re-read it.
        // In schema.sql:
        // CREATE TABLE topics (
        //   ...
        //   chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        //   ...
        // );
        // It does NOT have subject_id directly on topics.
        // However, the page.tsx code has: .eq('subject_id', 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9')
        // This implies either the schema file I read is outdated vs the actual DB, or the code relies on a view or I missed a migration.

        // Let's inspect the actual structure by trying to select subject_id from topics.
        // Or better, let's join properly as per the schema I saw.

        // Actually, looking at page.tsx line 79-82:
        // .from('topics')
        // .select('id, name, description')
        // .eq('subject_id', '...')

        // If the schema I read earlier (Step 8) is correct, 'topics' table does NOT have 'subject_id'.
        // It has 'chapter_id'. 
        // BUT the user code is running and presumably working (since they see 920 topics).
        // So 'subject_id' must exist on 'topics' or there is some Supabase magic (unlikely for raw column) or I missed it.

        // Let's double check the schema file content I read in Step 8.
        // ...
        // CREATE TABLE topics (
        //   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        //   chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        // ...
        // It definitely does not show subject_id.

        // Hypothesis: The schema I read is out of sync with the actual DB, OR the 'topics' in the code refers to a View, OR I missed a later migration file.
        // Let's try to query relying on the relationship: topics -> chapters -> subjects.

        const { data: topics, error } = await supabase
            .from('topics')
            .select(`
        id,
        chapter_id,
        chapters (
          id,
          name,
          subject_id,
          subjects (
            id,
            name
          )
        )
      `);

        if (error) {
            console.error('Error fetching topics:', error);
            // Fallback: maybe subject_id IS on topics?
            const { data: topicsDirect, error: errorDirect } = await supabase
                .from('topics')
                .select('subject_id');

            if (!errorDirect && topicsDirect) {
                console.log("Found subject_id directly on topics table.");
                // group calculate
                const counts: Record<string, number> = {};
                topicsDirect.forEach((t: any) => {
                    const sid = t.subject_id || 'null';
                    counts[sid] = (counts[sid] || 0) + 1;
                });
                console.log('Counts by subject_id (direct column):', counts);
                return;
            }
            return;
        }

        // Aggregate counts
        const subjectCounts: Record<string, number> = {};
        const subjectNames: Record<string, string> = {};
        let nullChapterRequest = 0;

        topics.forEach(topic => {
            const chapter = topic.chapters;
            if (!chapter) {
                nullChapterRequest++;
                return;
            }
            // @ts-ignore
            const subject = chapter.subjects;
            if (!subject) {
                // Maybe chapter exists but no subject linked?
                return;
            }

            const sId = subject.id;
            const sName = subject.name;

            subjectCounts[sId] = (subjectCounts[sId] || 0) + 1;
            subjectNames[sId] = sName;
        });

        console.log('Total topics found:', topics.length);
        console.log('Topics with no chapter association:', nullChapterRequest);
        console.log('Topic distribution by Subject:');
        for (const [sId, count] of Object.entries(subjectCounts)) {
            console.log(`- ${subjectNames[sId]} (${sId}): ${count}`);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

analyzetopics();
