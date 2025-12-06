
import dotenv from 'dotenv';
import path from 'path';
import { createScriptClient } from '../lib/supabase/script-client';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCryptoChildren() {
    const supabase = createScriptClient();

    // Get Cryptography ID
    const { data: parent } = await supabase
        .from('topics')
        .select('id')
        .eq('name', 'Cryptography')
        .single();

    if (!parent) {
        console.error('Cryptography topic not found');
        return;
    }

    // Get Children
    const { data: children, error } = await supabase
        .from('topics')
        .select('id, name')
        .eq('parent_topic_id', parent.id)
        .order('name');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${children.length} children under Cryptography:`);
    children.forEach(c => console.log(`- ${c.name}`));
}

listCryptoChildren();
