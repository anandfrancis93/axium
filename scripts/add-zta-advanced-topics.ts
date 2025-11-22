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

async function addZTAAdvancedTopics() {
  console.log('Adding advanced Zero Trust Architecture topics...\n')

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

    // Get Zero Trust Architecture (ZTA) ID
    const { data: zta, error: ztaError } = await supabase
      .from('topics')
      .select('id')
      .eq('name', 'Zero Trust Architecture (ZTA)')
      .eq('subject_id', subjectId)
      .single()

    if (ztaError || !zta) {
      console.error('❌ Error finding ZTA topic:', ztaError)
      return
    }

    // Add Zero Trust Security Concepts (Level 2)
    const { data: concepts, error: conceptsError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Zero Trust Security Concepts',
        description: 'Core security concepts that form the foundation of Zero Trust Architecture, including adaptive identity, threat scope reduction, policy-driven access control, and device posture assessment.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (conceptsError) {
      console.error('❌ Error creating Zero Trust Security Concepts:', conceptsError)
      return
    }

    console.log('✅ Created: Zero Trust Security Concepts (Level 2)')

    // Add Level 3 security concepts
    const securityConcepts = [
      {
        name: 'Adaptive identity',
        description: 'It recognizes that user identities are not static and that identity verification must be continuous and based on a user\'s current context and the resources they are attempting to access.'
      },
      {
        name: 'Threat scope reduction',
        description: 'It means that access to network resources is granted on a need-to-know basis, and access is limited to only those resources required to complete a specific task. This concept reduces the network\'s attack surface and limits the damage that a successful attack can cause.'
      },
      {
        name: 'Policy-driven access control',
        description: 'It describes how access control policies are used to enforce access restrictions based on user identity, device posture, and network context.'
      },
      {
        name: 'Device posture',
        description: 'It refers to the security status of a device, including its security configurations, software versions, and patch levels. In a security context, device posture assessment involves evaluating the security status of a device to determine whether it meets certain security requirements or poses a risk to the network.'
      }
    ]

    for (const concept of securityConcepts) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: concepts.id,
          name: concept.name,
          description: concept.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${concept.name}":`, error)
      } else {
        console.log(`✅ Created: ${concept.name} (Level 3)`)
      }
    }

    // Add Control Plane and Data Plane (Level 2)
    const { data: controlData, error: controlDataError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Control Plane and Data Plane',
        description: 'The two fundamental architectural planes in Zero Trust Architecture. The control plane defines policies and makes access decisions, while the data plane establishes secure sessions for information transfers based on control plane decisions.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (controlDataError) {
      console.error('❌ Error creating Control Plane and Data Plane:', controlDataError)
      return
    }

    console.log('✅ Created: Control Plane and Data Plane (Level 2)')

    // Add Level 3 control/data plane topics
    const planes = [
      {
        name: 'Control Plane',
        description: 'In zero trust architecture, functions that define policy and determine access decisions. The control plane manages policies that dictate how users and devices are authorized to access network resources. It is implemented through a centralized policy decision point. The policy decision point is responsible for defining policies that limit access to resources on a need-to-know basis, monitoring network activity for suspicious behavior, and updating policies to reflect changing network conditions and security threats. The policy decision point is comprised of two subsystems: The policy engine is configured with subject and host identities and credentials, access control policies, up-to-date threat intelligence, behavioral analytics, and other results of host and network security scanning and monitoring. This comprehensive state data allows it to define an algorithm and metrics for making dynamic authentication and authorization decisions on a per-request basis. The policy administrator is responsible for managing the process of issuing access tokens and establishing or tearing down sessions, based on the decisions made by the policy engine. The policy administrator implements an interface between the control plane and the data plane. Where systems in the control plane define policies and make decisions, systems in the data plane establish sessions for secure information transfers.'
      },
      {
        name: 'Data Plane',
        description: 'In the data plane, a subject (user or service) uses a system (such as a client host PC, laptop, or smartphone) to make requests for a given resource. A resource is typically an enterprise app running on a server or cloud. Each request is mediated by a policy enforcement point. The enforcement point might be implemented as a software agent running on the client host that communicates with an app gateway. The policy enforcement point interfaces with the policy administrator to set up a secure data pathway if access is approved, or tear down a session if access is denied or revoked.'
      }
    ]

    for (const plane of planes) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: controlData.id,
          name: plane.name,
          description: plane.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${plane.name}":`, error)
      } else {
        console.log(`✅ Created: ${plane.name} (Level 3)`)
      }
    }

    // Add Goal of Zero Trust Architecture (Level 2)
    const { error: goalError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Goal of Zero Trust Architecture',
        description: 'The goal of zero trust design is to make this implicit trust zone as small as possible and as transient as possible. Trusted sessions might only be established for individual transactions. This granular or microsegmented approach is in contrast with perimeter-based models, where trust is assumed once a user has authenticated and joined the network. In zero trust, place in the network is not a sufficient reason to trust a subject request. Similarly, even if a user is nominally authenticated, behavioral analytics might cause a request to be blocked or a session to be terminated. Separating the control plane and data plane is significant because it allows for a more flexible and scalable network architecture. The centralized control plane ensures consistency for access request handling across both the managed enterprise network and unmanaged Internet or third-party networks, regardless of the devices being used or the user\'s location. This makes managing access control policies and monitoring network activity for suspicious behavior easier. Continuous monitoring via the independent control plane means that sessions can be terminated if anomalous behavior is detected.',
        hierarchy_level: 2
      })

    if (goalError) {
      console.error('❌ Error creating Goal of Zero Trust Architecture:', goalError)
    } else {
      console.log('✅ Created: Goal of Zero Trust Architecture (Level 2)')
    }

    // Add Zero Trust Architecture Examples (Level 2)
    const { data: examples, error: examplesError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: zta.id,
        name: 'Zero Trust Architecture Examples',
        description: 'Real-world implementations of Zero Trust Architecture by major technology companies and security vendors, demonstrating practical applications of zero trust principles.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (examplesError) {
      console.error('❌ Error creating Zero Trust Architecture Examples:', examplesError)
      return
    }

    console.log('✅ Created: Zero Trust Architecture Examples (Level 2)')

    // Add Level 3 examples
    const exampleTopics = [
      {
        name: 'Google BeyondCorp',
        description: 'Google\'s BeyondCorp is a widely recognized example of a zero trust security architecture. BeyondCorp uses a system of multiple security layers, including identity verification, device verification, and access control policies, to secure Google\'s internal network. This has enabled Google to provide its employees with remote access to company resources while maintaining high security.'
      },
      {
        name: 'Cisco Zero Trust Architecture',
        description: 'Cisco has developed a comprehensive zero trust security architecture incorporating network segmentation, access control policies, and threat detection and response capabilities. The architecture is designed to protect against a wide range of cyber threats, including insider threats and external attacks.'
      },
      {
        name: 'Palo Alto Networks Prisma Access',
        description: 'Prisma Access is a cloud-delivered security service that uses a zero trust architecture to secure network traffic. It provides secure access to cloud and Internet resources while also preventing data exfiltration and other cyber threats.'
      }
    ]

    for (const example of exampleTopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: examples.id,
          name: example.name,
          description: example.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${example.name}":`, error)
      } else {
        console.log(`✅ Created: ${example.name} (Level 3)`)
      }
    }

    console.log('\n✨ Done! Added 13 new topics (4 Level 2, 9 Level 3)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addZTAAdvancedTopics().catch(console.error)
