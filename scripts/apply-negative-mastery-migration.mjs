import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('Applying negative mastery migration...\n')

  try {
    // Step 1: Drop existing constraint
    console.log('1. Dropping old constraint...')
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_topic_mastery DROP CONSTRAINT IF EXISTS user_topic_mastery_mastery_score_check;'
    })
    if (dropError) {
      console.error('Error dropping constraint:', dropError)
      // Continue anyway - might not exist
    } else {
      console.log('   ✓ Constraint dropped')
    }

    // Step 2: Add new constraint
    console.log('\n2. Adding new constraint (-100 to 100)...')
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_topic_mastery ADD CONSTRAINT user_topic_mastery_mastery_score_check CHECK (mastery_score BETWEEN -100 AND 100);'
    })
    if (addError) {
      console.error('Error adding constraint:', addError)
      return
    }
    console.log('   ✓ New constraint added')

    // Step 3: Update function
    console.log('\n3. Updating mastery function...')
    const functionSQL = `
CREATE OR REPLACE FUNCTION update_topic_mastery_by_id(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INT,
  p_chapter_id UUID,
  p_is_correct BOOLEAN,
  p_confidence INT,
  p_learning_gain DECIMAL,
  p_weight DECIMAL DEFAULT 1.0,
  p_new_streak INT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_mastery DECIMAL;
  v_new_mastery DECIMAL;
BEGIN
  SELECT mastery_score INTO v_current_mastery
  FROM user_topic_mastery
  WHERE user_id = p_user_id
    AND topic_id = p_topic_id
    AND bloom_level = p_bloom_level
    AND chapter_id = p_chapter_id;

  -- Allow negative, clamp only at -100 and 100
  v_new_mastery := COALESCE(v_current_mastery, 0) + p_learning_gain;
  v_new_mastery := GREATEST(-100, LEAST(100, v_new_mastery));

  INSERT INTO user_topic_mastery (
    user_id, topic_id, bloom_level, chapter_id,
    mastery_score, questions_attempted, questions_correct,
    last_practiced_at, current_streak
  )
  VALUES (
    p_user_id, p_topic_id, p_bloom_level, p_chapter_id,
    v_new_mastery, 1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    NOW(), COALESCE(p_new_streak, 0)
  )
  ON CONFLICT (user_id, topic_id, bloom_level, chapter_id)
  DO UPDATE SET
    mastery_score = v_new_mastery,
    questions_attempted = user_topic_mastery.questions_attempted + 1,
    questions_correct = user_topic_mastery.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_practiced_at = NOW(),
    current_streak = COALESCE(p_new_streak, user_topic_mastery.current_streak);
END;
$$ LANGUAGE plpgsql;
`

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: functionSQL })
    if (funcError) {
      console.error('Error updating function:', funcError)
      return
    }
    console.log('   ✓ Function updated')

    console.log('\n✅ Migration completed successfully!')
    console.log('\nNegative mastery scores are now allowed.')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

applyMigration()
