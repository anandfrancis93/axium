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

async function addZTATopics() {
  console.log('Adding Zero Trust Architecture (ZTA) topics...\n')

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

    // Add Zero Trust Architecture (ZTA) (Level 1)
    const { data: zta, error: ztaError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: null,
        name: 'Zero Trust Architecture (ZTA)',
        description: 'The security design paradigm where any request (host-to-host or container-to-container) must be authenticated before being allowed. Organizations\' increased dependence on information technology has driven requirements for services to be always on, always available, and accessible from anywhere. Cloud platforms have become an essential component of technology infrastructures, driving broad software and system dependencies and widespread platform integration. The distinction between inside and outside is gone. For an organization leveraging remote workforces, running a mix of on-premises and public cloud infrastructure, and using outsourced services and contractors, the opportunity for breach is very high. Staff and employees are using computers attached to home networks, or worse, unsecured public Wi-Fi. Critical systems are accessible through various external interfaces and run software developed by outsourced, contracted external entities. In addition, many organizations design their environments to accommodate Bring Your Own Device (BYOD.) As these trends continue, implementing Zero Trust architectures will become more critical. Zero Trust architectures assume that nothing should be taken for granted and that all network access must be continuously verified and authorized. Any user, device, or application seeking access must be authenticated and verified. Zero Trust differs from traditional security models based on simply granting access to all users, devices, and applications contained within an organization\'s trusted network. NIST SP 800-207 "Zero Trust Architecture" defines Zero Trust as "cybersecurity paradigms that move defenses from static, network-based perimeters to focus on users, assets, and resources." A Zero Trust architecture can protect data, applications, networks, and systems from malicious attacks and unauthorized access more effectively than a traditional architecture by ensuring that only necessary services are allowed and only from appropriate sources. Zero Trust enables organizations to offer services based on varying levels of trust, such as providing more limited access to sensitive data and systems.',
        hierarchy_level: 1
      })
      .select()
      .single()

    if (ztaError) {
      console.error('❌ Error creating ZTA topic:', ztaError)
      return
    }

    console.log('✅ Created: Zero Trust Architecture (ZTA) (Level 1)')

    // Add Deperimeterization (Level 2)
    const { error: deperimError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Deperimeterization',
        description: 'Deperimeterization refers to a security approach that shifts the focus from defending a network\'s boundaries to protecting individual resources and data within the network. As organizations adopt cloud computing, remote work, and mobile devices, traditional perimeter-based security models become less effective in addressing modern threats. Deperimeterization concepts advocate for implementing multiple security measures around individual assets, such as data, applications, and services. This approach includes robust authentication, encryption, access control, and continuous monitoring to maintain the security of critical resources, regardless of their location.',
        hierarchy_level: 2
      })

    if (deperimError) {
      console.error('❌ Error creating Deperimeterization:', deperimError)
    } else {
      console.log('✅ Created: Deperimeterization (Level 2)')
    }

    // Add Trends Driving Deperimeterization (Level 2)
    const { data: trends, error: trendsError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Trends Driving Deperimeterization',
        description: 'Key trends that drive the need for deperimeterization and Zero Trust architectures, including cloud computing, remote work, mobile devices, outsourcing, and wireless networks.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (trendsError) {
      console.error('❌ Error creating Trends Driving Deperimeterization:', trendsError)
      return
    }

    console.log('✅ Created: Trends Driving Deperimeterization (Level 2)')

    // Add Level 3 trends
    const trendTopics = [
      {
        name: 'Cloud',
        description: 'Enterprise infrastructures are typically spread between on-premises and cloud platforms. In addition, cloud platforms may be used to distribute computing resources globally.'
      },
      {
        name: 'Remote Work',
        description: 'More and more organizations have adopted either part-time or full-time remote workforces. This remote workforce expands the enterprise footprint dramatically. In addition, employees working from home are more susceptible to security lapses when they connect from insecure locations and use personal devices.'
      },
      {
        name: 'Mobile',
        description: 'Modern smartphones and tablets are often used as primary computing devices as they have ample processor, memory, and storage capacity. More and more corporate data is accessed through these devices as their capabilities expand. Mobile devices and their associated operating systems have varying security features, and various budget devices are sometimes not supported by vendors shortly after release, meaning they cannot be updated or patched. In addition, mobile devices are often lost or stolen.'
      },
      {
        name: 'Outsourcing and Contracting',
        description: 'Support arrangements often provide remote access to external entities, and this access can often mean that the external provider\'s network serves as an entry point to the organizations they support.'
      },
      {
        name: 'Wireless Networks (Wi-Fi)',
        description: 'Wireless networks are susceptible to an ever-increasing array of exploits, but oftentimes wireless networks are open and unsecured or the network security key is well known.'
      }
    ]

    for (const trend of trendTopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: trends.id,
          name: trend.name,
          description: trend.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${trend.name}":`, error)
      } else {
        console.log(`✅ Created: ${trend.name} (Level 3)`)
      }
    }

    // Add Benefits of a Zero Trust Architecture (Level 2)
    const { data: benefits, error: benefitsError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Benefits of a Zero Trust Architecture',
        description: 'Key advantages of implementing a Zero Trust Architecture including enhanced security, better access controls, improved compliance, and increased granularity.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (benefitsError) {
      console.error('❌ Error creating Benefits of a Zero Trust Architecture:', benefitsError)
      return
    }

    console.log('✅ Created: Benefits of a Zero Trust Architecture (Level 2)')

    // Add Level 3 benefits
    const benefitTopics = [
      {
        name: 'Greater security',
        description: 'Requires all users, devices, and applications to be authenticated and verified before network access.'
      },
      {
        name: 'Better access controls',
        description: 'Include more stringent limits regarding who or what can access resources and from what locations.'
      },
      {
        name: 'Improved governance and compliance',
        description: 'Limit data access and provide greater operational visibility on user and device activity.'
      },
      {
        name: 'Increased granularity',
        description: 'Grants users access to what they need when they need it.'
      }
    ]

    for (const benefit of benefitTopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: benefits.id,
          name: benefit.name,
          description: benefit.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${benefit.name}":`, error)
      } else {
        console.log(`✅ Created: ${benefit.name} (Level 3)`)
      }
    }

    // Add Components of a Zero Trust architecture (Level 2)
    const { data: components, error: componentsError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Components of a Zero Trust architecture',
        description: 'Essential components that make up a Zero Trust Architecture including network security, identity management, policy enforcement, cloud security, visibility, segmentation, data protection, and threat detection.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (componentsError) {
      console.error('❌ Error creating Components of a Zero Trust architecture:', componentsError)
      return
    }

    console.log('✅ Created: Components of a Zero Trust architecture (Level 2)')

    // Add Level 3 components
    const componentTopics = [
      {
        name: 'Network and endpoint security',
        description: 'Controls access to applications, data, and networks.'
      },
      {
        name: 'Identity and access management (IAM)',
        description: 'Ensures only verified users can access systems and data.'
      },
      {
        name: 'Policy-based enforcement',
        description: 'Restricts network traffic to only legitimate requests.'
      },
      {
        name: 'Cloud security',
        description: 'Manages access to cloud-based applications, services, and data.'
      },
      {
        name: 'Network visibility',
        description: 'Analyzes network traffic and devices for suspicious activity.'
      },
      {
        name: 'Network segmentation',
        description: 'Controls access to sensitive data and capabilities from trusted locations.'
      },
      {
        name: 'Data protection',
        description: 'Controls and secures access to sensitive data, including encryption and auditing.'
      },
      {
        name: 'Threat detection and prevention',
        description: 'Identifies and prevents attacks against the network and the systems connected to it.'
      }
    ]

    for (const component of componentTopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: components.id,
          name: component.name,
          description: component.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${component.name}":`, error)
      } else {
        console.log(`✅ Created: ${component.name} (Level 3)`)
      }
    }

    console.log('\n✨ Done! Added 22 new topics (1 Level 1, 4 Level 2, 17 Level 3)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addZTATopics().catch(console.error)
