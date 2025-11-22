import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateControlDataPlaneNames() {
  console.log('Updating Control Plane and Data Plane component names and descriptions...\n')

  try {
    // Get Cybersecurity subject ID
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', 'Cybersecurity')
      .single()

    if (subjectError || !subject) {
      console.error('❌ Error finding Cybersecurity subject:', subjectError)
      return
    }

    const subjectId = subject.id

    // Update Policy Administrator to Policy Administrator / Policy Decision Point
    const { error: policyAdminError } = await supabase
      .from('topics')
      .update({
        name: 'Policy Administrator / Policy Decision Point',
        description: 'It implements an interface for communicating decisions to Data Plane systems.'
      })
      .eq('name', 'Policy Administrator')
      .eq('subject_id', subjectId)

    if (policyAdminError) {
      console.error('❌ Error updating Policy Administrator:', policyAdminError)
    } else {
      console.log('✅ Updated: Policy Administrator → Policy Administrator / Policy Decision Point')
    }

    // Update Policy Engine description
    const { error: policyEngineError } = await supabase
      .from('topics')
      .update({
        description: 'It is configured with inputs to enable it to make dynamic and continuous authentication and authorization decisions.'
      })
      .eq('name', 'Policy Engine')
      .eq('subject_id', subjectId)

    if (policyEngineError) {
      console.error('❌ Error updating Policy Engine:', policyEngineError)
    } else {
      console.log('✅ Updated: Policy Engine description')
    }

    // Update Policy Enforcement Point description
    const { error: policyEnforcementError } = await supabase
      .from('topics')
      .update({
        description: 'It is the only one trusted to communicate requests and receive decisions from the Policy Administrator.'
      })
      .eq('name', 'Policy Enforcement Point')
      .eq('subject_id', subjectId)

    if (policyEnforcementError) {
      console.error('❌ Error updating Policy Enforcement Point:', policyEnforcementError)
    } else {
      console.log('✅ Updated: Policy Enforcement Point description')
    }

    console.log('\n✨ Done! Updated 3 topics')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateControlDataPlaneNames().catch(console.error)
