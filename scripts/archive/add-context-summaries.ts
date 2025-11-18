/**
 * Add Context Summaries to Curriculum Entities
 *
 * Updates curriculum-parsed.json with context summaries
 */

import fs from 'fs'
import path from 'path'

interface Entity {
  id: string
  name: string
  level: string
  fullPath: string
  contextSummary: string | null
  [key: string]: any
}

interface CurriculumData {
  metadata: any
  stats: any
  warnings: any[]
  entities: Entity[]
}

interface Summary {
  id: string
  contextSummary: string
}

function addContextSummaries(summaries: Summary[]) {
  const filePath = path.join(process.cwd(), 'curriculum-parsed.json')

  console.log(`Reading ${filePath}...`)
  const data: CurriculumData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  // Create a map of summaries by ID for quick lookup
  const summaryMap = new Map(summaries.map(s => [s.id, s.contextSummary]))

  let updateCount = 0

  // Update entities with summaries
  data.entities.forEach(entity => {
    if (summaryMap.has(entity.id)) {
      entity.contextSummary = summaryMap.get(entity.id)!
      updateCount++
    }
  })

  // Update metadata
  data.metadata.lastUpdated = new Date().toISOString()
  data.metadata.summariesGenerated = data.entities.filter(e => e.contextSummary !== null).length

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

  console.log(`✅ Updated ${updateCount} entities with context summaries`)
  console.log(`📊 Total with summaries: ${data.metadata.summariesGenerated}/${data.entities.length}`)

  return {
    updated: updateCount,
    total: data.entities.length,
    withSummaries: data.metadata.summariesGenerated
  }
}

// Export for use in other scripts
export { addContextSummaries }

// Example usage:
if (require.main === module) {
  const summaries: Summary[] = [
    {
      id: "0f8909fc-16b7-4e59-b567-1920ab891533",
      contextSummary: "General Security Concepts encompasses fundamental principles and frameworks that form the foundation of information security. This domain covers security controls, cryptographic solutions, change management processes, and core security concepts such as confidentiality, integrity, and availability. Understanding these concepts is essential for implementing effective security measures across an organization."
    },
    {
      id: "a49d6571-29d5-462d-8e18-9a759f1c7eac",
      contextSummary: "This objective focuses on understanding the different categories and types of security controls used to protect information systems. Security controls are safeguards or countermeasures implemented to avoid, detect, counteract, or minimize security risks. Students learn to distinguish between control categories (technical, managerial, operational, physical) and control types (preventive, deterrent, detective, corrective, compensating, directive) to select appropriate controls for different security scenarios."
    },
    {
      id: "c6f4314b-75e6-4002-b988-90003706d628",
      contextSummary: "Security control categories classify security measures based on their implementation approach and who manages them. The four main categories are technical (technology-based), managerial (administrative/procedural), operational (people-focused), and physical (tangible barriers). Understanding these categories helps organizations implement defense-in-depth strategies by deploying multiple types of controls."
    },
    {
      id: "cd614db1-5aed-493d-b72e-1a55bed38d42",
      contextSummary: "Technical security controls are technology-based mechanisms implemented through hardware, software, or firmware to protect information systems. Examples include firewalls, encryption, intrusion detection systems, access control lists, antivirus software, and authentication mechanisms. These controls are typically automated and enforce security policies through technological means rather than human intervention."
    },
    {
      id: "27bb7bf2-48b8-4e1c-be92-63fb28447db3",
      contextSummary: "Managerial security controls, also called administrative controls, are policies, procedures, and guidelines that govern organizational security practices. Examples include security policies, risk assessments, security awareness training, incident response plans, and access control procedures. These controls provide the framework and direction for implementing and maintaining an organization's security posture."
    },
    {
      id: "433024f6-173c-46f1-8680-36c80c534b44",
      contextSummary: "Operational security controls are implemented and executed by people rather than technology systems. Examples include security guards, background checks, separation of duties, job rotation, and security awareness training. These controls focus on day-to-day security operations and rely on human processes to reduce security risks."
    },
    {
      id: "68ac74fe-883b-42f8-a3c1-b901641f7ead",
      contextSummary: "Physical security controls are tangible barriers and mechanisms that protect physical assets, facilities, and resources from unauthorized access, theft, or damage. Examples include locks, fences, security guards, surveillance cameras, badge readers, and access control vestibules (mantraps). These controls form the first line of defense by preventing physical access to sensitive areas and equipment."
    },
    {
      id: "5e8e0881-5768-4ccd-882d-249c9fee565d",
      contextSummary: "Security control types classify controls based on their functional purpose and when they operate in relation to security incidents. The six main types are preventive (stop incidents before they occur), deterrent (discourage attackers), detective (identify incidents), corrective (fix vulnerabilities after incidents), compensating (provide alternative controls), and directive (specify required actions). Understanding these types helps organizations design comprehensive security strategies that address threats at different stages."
    },
    {
      id: "c06f8d22-08bb-41a0-9977-6825f8f21438",
      contextSummary: "Preventive security controls are proactive measures designed to stop security incidents before they occur by eliminating vulnerabilities or blocking threats. Examples include firewalls blocking unauthorized traffic, access controls preventing unauthorized system access, encryption protecting data confidentiality, and security awareness training reducing human error. Preventive controls are the most desirable type as they avoid security incidents rather than reacting to them."
    },
    {
      id: "f38723fb-197e-4c66-a653-b1825cd592d0",
      contextSummary: "Deterrent security controls are designed to discourage potential attackers from attempting malicious activities by demonstrating strong security measures or potential consequences. Examples include visible security cameras, warning signs about monitoring, security guards, login banners stating penalties for unauthorized access, and strong password policies. While deterrent controls don't physically prevent attacks, they reduce the likelihood of attacks by making systems appear well-protected or highlighting legal consequences."
    }
  ]

  addContextSummaries(summaries)
}
