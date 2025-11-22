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

async function addAssetManagementTopics() {
  console.log('Adding Asset Management topics...\n')

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

    // Add Asset Management (Level 1)
    const { data: assetMgmt, error: assetMgmtError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: null,
        name: 'Asset Management',
        description: 'The systematic process of developing, operating, maintaining, upgrading, and disposing of assets cost-effectively. Asset management encompasses tracking, classifying, and monitoring physical and digital assets throughout their lifecycle to ensure security, compliance, and optimal resource utilization.',
        hierarchy_level: 1
      })
      .select()
      .single()

    if (assetMgmtError) {
      console.error('❌ Error creating Asset Management:', assetMgmtError)
      return
    }

    console.log('✅ Created: Asset Management (Level 1)')

    // Add Asset Assignment / Accounting (Level 2)
    const { error: assignmentError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Asset Assignment / Accounting',
        description: 'In asset management, processes that ensure each physical and data asset have an identified owner, and are appropriately tagged and classified within an inventory. Asset ownership assignment/accounting and classification are essential components of a well-structured asset management process, ensuring that organizations effectively manage and protect their resources while maintaining accountability. Assigning asset ownership involves designating specific individuals or teams within the organization as responsible for particular assets to establish a clear chain of accountability for asset security, maintenance, and ongoing management. Asset classification involves organizing assets based on their value, sensitivity, or criticality to the organization. This enables the consistent and repeatable application of required security controls, effective prioritization for maintenance and updates, and appropriate budget allocation. Both processes need periodic reviews to account for changes in asset value, sensitivity, or relevance to business operations.',
        hierarchy_level: 2
      })

    if (assignmentError) {
      console.error('❌ Error creating Asset Assignment / Accounting:', assignmentError)
    } else {
      console.log('✅ Created: Asset Assignment / Accounting (Level 2)')
    }

    // Add Monitoring / Asset Tracking (Level 2)
    const { data: monitoring, error: monitoringError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Monitoring / Asset Tracking',
        description: 'Enumeration and inventory processes and software that ensure physical and data assets comply with configuration and performance baselines, and have not been tampered with or suffered other unauthorized access. Monitoring/asset tracking activities include inventory and enumeration tasks, which involve creating and maintaining a comprehensive list of all assets within the organization, such as hardware, software, data, and network equipment. Regularly updating and verifying the asset inventory helps organizations identify and manage their assets effectively, ensuring they have accurate information about each asset\'s location, owner, and status. This information is vital for license management, patch deployment, and security incident response. Asset monitoring also involves tracking the performance, security, and usage of assets, allowing organizations to detect potential issues, vulnerabilities, or unauthorized access promptly. Proactive asset monitoring helps mitigate risks, optimize resource utilization, and ensure compliance with regulatory requirements.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (monitoringError) {
      console.error('❌ Error creating Monitoring / Asset Tracking:', monitoringError)
      return
    }

    console.log('✅ Created: Monitoring / Asset Tracking (Level 2)')

    // Add Asset Enumeration Types (Level 3)
    const enumerationTypes = [
      {
        name: 'Manual Inventory',
        description: 'In smaller organizations or for specific asset types, manually creating and maintaining an inventory of assets may be feasible. This process involves physically inspecting assets, such as computers, servers, and network devices, and recording relevant information, such as serial numbers, make and model, and location.'
      },
      {
        name: 'Network Scanning',
        description: 'Network scanning tools, such as Nmap, Nessus, or OpenVAS, can automatically discover and enumerate networked devices, including servers, switches, routers, and workstations. These tools can identify open ports, services, and sometimes even the operating systems and applications running on the devices.'
      },
      {
        name: 'Asset Management Software',
        description: 'Asset management software solutions, such as Lansweeper, ManageEngine, or SolarWinds, can automatically discover, track, and catalog various types of assets, including hardware, software, and licenses. These tools often provide a centralized dashboard for managing the asset inventory, monitoring changes, and generating reports.'
      },
      {
        name: 'Configuration Management Database (CMDB)',
        description: 'A CMDB is a centralized repository of information related to an organization\'s IT infrastructure, including assets, configurations, and relationships. Tools like ServiceNow or BMC Remedy can help create and maintain a CMDB, providing a holistic view of the organization\'s assets and interdependencies.'
      },
      {
        name: 'Mobile Device Management (MDM)',
        description: 'For organizations with a significant number of mobile devices, MDM solutions like Microsoft Intune, VMware Workspace ONE, or MobileIron can help enumerate, manage, and secure smartphones, tablets, and other mobile assets.'
      },
      {
        name: 'Cloud Asset Discovery',
        description: 'With organizations increasingly adopting cloud services, cloud-native tools, such as AWS Config or Azure Resource Graph, or third-party solutions like CloudAware or CloudCheckr, can help discover and catalog assets deployed in the cloud.'
      }
    ]

    for (const type of enumerationTypes) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: monitoring.id,
          name: type.name,
          description: type.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${type.name}":`, error)
      } else {
        console.log(`✅ Created: ${type.name} (Level 3)`)
      }
    }

    // Add Asset Acquisition / Procurement (Level 2)
    const { error: procurementError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Asset Acquisition / Procurement',
        description: 'Policies and processes that ensure asset and service purchases and contracts are fully managed, secure, use authorized suppliers/vendors, and meet business goals. From the perspective of supporting cybersecurity operations, asset acquisition/procurement policies are critical in ensuring organizations maintain a robust security posture. Key considerations include selecting hardware and software solutions with strong security features, such as built-in encryption, secure boot mechanisms, and regular updates or patches. It is crucial to work with reputable vendors and manufacturers that prioritize security and provide ongoing support to address potential vulnerabilities in their products. Additionally, organizations should consider procuring solutions that integrate seamlessly with their existing security infrastructure, such as firewalls, intrusion detection systems, or security information and event management (SIEM) platforms. This facilitates a more cohesive and effective security strategy. Moreover, organizations should assess the total cost of ownership (TCO) of the assets, considering the initial purchase price along with the ongoing costs of maintenance, updates, and potential security incidents. Prioritizing cybersecurity during the asset acquisition and procurement process helps organizations build a solid foundation for their security operations, reducing the risk of breaches, enhancing compliance with relevant regulations, and ultimately protecting their critical data and systems.',
        hierarchy_level: 2
      })

    if (procurementError) {
      console.error('❌ Error creating Asset Acquisition / Procurement:', procurementError)
    } else {
      console.log('✅ Created: Asset Acquisition / Procurement (Level 2)')
    }

    console.log('\n✨ Done! Added 10 new topics (1 Level 1, 3 Level 2, 6 Level 3)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addAssetManagementTopics().catch(console.error)
