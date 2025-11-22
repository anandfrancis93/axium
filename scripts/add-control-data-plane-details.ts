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

async function addControlDataPlaneDetails() {
  console.log('Adding Control Plane and Data Plane detailed components...\n')

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

    // Get Control Plane ID
    const { data: controlPlane, error: controlPlaneError } = await supabase
      .from('topics')
      .select('id')
      .eq('name', 'Control Plane')
      .eq('subject_id', subjectId)
      .single()

    if (controlPlaneError || !controlPlane) {
      console.error('❌ Error finding Control Plane topic:', controlPlaneError)
      return
    }

    // Get Data Plane ID
    const { data: dataPlane, error: dataPlaneError } = await supabase
      .from('topics')
      .select('id')
      .eq('name', 'Data Plane')
      .eq('subject_id', subjectId)
      .single()

    if (dataPlaneError || !dataPlane) {
      console.error('❌ Error finding Data Plane topic:', dataPlaneError)
      return
    }

    // Add Control Plane components (Level 4)
    const controlPlaneComponents = [
      {
        name: 'Policy Engine',
        description: 'The policy engine is configured with inputs to enable it to make dynamic and continuous authentication and authorization decisions.'
      },
      {
        name: 'Policy Administrator',
        description: 'The policy administrator implements an interface for communicating decisions to data plane systems.'
      }
    ]

    console.log('Adding Control Plane components:')
    for (const component of controlPlaneComponents) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: controlPlane.id,
          name: component.name,
          description: component.description,
          hierarchy_level: 4
        })

      if (error) {
        console.error(`❌ Error creating "${component.name}":`, error)
      } else {
        console.log(`✅ Created: ${component.name} (Level 4)`)
      }
    }

    // Add Data Plane components (Level 4)
    const dataPlaneComponents = [
      {
        name: 'Subject Credentials',
        description: 'Subjects (users of other services) possess credentials to access resources.'
      },
      {
        name: 'Client Systems',
        description: 'Subjects must use client systems to make requests but these are not implicitly trusted.'
      },
      {
        name: 'Policy Enforcement Point',
        description: 'The policy enforcement point system is the only one trusted to communicate requests and receive decisions from the policy administrator.'
      },
      {
        name: 'Session Management',
        description: 'The policy enforcement point implements encrypted session set up and tear down as directed by the policy administrator.'
      },
      {
        name: 'Implicit Trust Zone',
        description: 'This architecture creates a limited scope and duration implicit trust zone for resource access.'
      }
    ]

    console.log('\nAdding Data Plane components:')
    for (const component of dataPlaneComponents) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: dataPlane.id,
          name: component.name,
          description: component.description,
          hierarchy_level: 4
        })

      if (error) {
        console.error(`❌ Error creating "${component.name}":`, error)
      } else {
        console.log(`✅ Created: ${component.name} (Level 4)`)
      }
    }

    console.log('\n✨ Done! Added 7 new topics (7 Level 4)')
    console.log('  - 2 Control Plane components')
    console.log('  - 5 Data Plane components')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addControlDataPlaneDetails().catch(console.error)
