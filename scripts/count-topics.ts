
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createScriptClient } from '../lib/supabase/script-client';

async function countTopics() {
    const supabase = createScriptClient();

    try {
        const { count, error } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error counting topics:', error);
            return;
        }

        console.log(`There are ${count} topics in the database.`);
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

countTopics();
