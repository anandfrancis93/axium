import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
}

async function addChapterSlugs() {
  console.log('Starting chapter slug migration...\n')

  // Step 1: Add slug column (if not exists)
  console.log('Step 1: Adding slug column to chapters table...')
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'chapters' AND column_name = 'slug'
        ) THEN
          ALTER TABLE chapters ADD COLUMN slug TEXT;
        END IF;
      END $$;
    `
  })

  if (alterError) {
    // Try direct ALTER TABLE if rpc doesn't work
    console.log('Using direct SQL approach...')
    const { error: directError } = await supabase
      .from('_migrations')
      .insert({ name: 'add_chapter_slugs' })

    // For now, we'll manually add the column via SQL editor
    console.log('⚠️  Please run this SQL in Supabase SQL Editor:')
    console.log(`
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS slug TEXT;
`)
  } else {
    console.log('✅ Slug column added')
  }

  // Step 2: Get all chapters without slugs
  console.log('\nStep 2: Fetching all chapters...')
  const { data: chapters, error: fetchError } = await supabase
    .from('chapters')
    .select('id, name, slug, subject_id')
    .order('created_at')

  if (fetchError) {
    console.error('❌ Error fetching chapters:', fetchError)
    process.exit(1)
  }

  console.log(`Found ${chapters.length} chapters\n`)

  // Step 3: Generate and update slugs
  console.log('Step 3: Generating slugs...\n')

  const slugCounts = {} // Track slug usage for uniqueness

  for (const chapter of chapters) {
    if (chapter.slug) {
      console.log(`⏭️  Chapter "${chapter.name}" already has slug: ${chapter.slug}`)
      continue
    }

    let baseSlug = generateSlug(chapter.name)
    let finalSlug = baseSlug

    // Ensure uniqueness within subject
    const key = `${chapter.subject_id}:${baseSlug}`
    if (slugCounts[key]) {
      slugCounts[key]++
      finalSlug = `${baseSlug}-${slugCounts[key]}`
    } else {
      slugCounts[key] = 1
    }

    // Update chapter with slug
    const { error: updateError } = await supabase
      .from('chapters')
      .update({ slug: finalSlug })
      .eq('id', chapter.id)

    if (updateError) {
      console.error(`❌ Error updating chapter "${chapter.name}":`, updateError)
    } else {
      console.log(`✅ ${chapter.name} → ${finalSlug}`)
    }
  }

  // Step 4: Add unique constraint
  console.log('\n Step 4: Adding unique constraint...')
  console.log('⚠️  Please run this SQL in Supabase SQL Editor:')
  console.log(`
ALTER TABLE chapters
  ADD CONSTRAINT chapters_subject_slug_unique
  UNIQUE (subject_id, slug);
`)

  console.log('\n✅ Migration complete!')
  console.log('\nNext steps:')
  console.log('1. Run the SQL commands above in Supabase SQL Editor')
  console.log('2. Update your app routes to use slug instead of ID')

  process.exit(0)
}

addChapterSlugs()
