
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Quiet dotenv
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAnonCount() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing env vars");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const subjectId = 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9';

    const { data: topics, error } = await supabase
        .from('topics')
        .select('id')
        .eq('subject_id', subjectId);

    if (error) {
        console.error("Fetch error:", JSON.stringify(error));
        return;
    }

    console.log(`Fetched using ANON key: ${topics.length} topics.`);
}

checkAnonCount();
