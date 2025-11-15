/**
 * Update Context Summaries by fullPath
 * Maps summaries to entities using fullPath as key
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

interface SummaryByPath {
  fullPath: string
  contextSummary: string
}

function updateSummariesByPath(summaries: SummaryByPath[]) {
  const filePath = path.join(process.cwd(), 'curriculum-parsed.json')

  console.log(`Reading ${filePath}...`)
  const data: CurriculumData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  // Create a map of summaries by fullPath for quick lookup
  const summaryMap = new Map(summaries.map(s => [s.fullPath, s.contextSummary]))

  let updateCount = 0

  // Update entities with summaries
  data.entities.forEach(entity => {
    if (summaryMap.has(entity.fullPath)) {
      entity.contextSummary = summaryMap.get(entity.fullPath)!
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
export { updateSummariesByPath }

// Batch 1: First 100 entities
const batch1: SummaryByPath[] = [
  {
    fullPath: "General Security Concepts",
    contextSummary: "General Security Concepts encompasses fundamental principles and frameworks that form the foundation of information security. This domain covers security controls, cryptographic solutions, change management processes, and core security concepts such as confidentiality, integrity, and availability. Understanding these concepts is essential for implementing effective security measures across an organization."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls",
    contextSummary: "This objective focuses on understanding the different categories and types of security controls used to protect information systems. Security controls are safeguards or countermeasures implemented to avoid, detect, counteract, or minimize security risks. Students learn to distinguish between control categories (technical, managerial, operational, physical) and control types (preventive, deterrent, detective, corrective, compensating, directive) to select appropriate controls for different security scenarios."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control Categories",
    contextSummary: "Security control categories classify security measures based on their implementation approach and who manages them. The four main categories are technical (technology-based), managerial (administrative/procedural), operational (people-focused), and physical (tangible barriers). Understanding these categories helps organizations implement defense-in-depth strategies by deploying multiple types of controls."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control Categories > Technical",
    contextSummary: "Technical security controls are technology-based mechanisms implemented through hardware, software, or firmware to protect information systems. Examples include firewalls, encryption, intrusion detection systems, access control lists, antivirus software, and authentication mechanisms. These controls are typically automated and enforce security policies through technological means rather than human intervention."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control Categories > Managerial",
    contextSummary: "Managerial security controls, also called administrative controls, are policies, procedures, and guidelines that govern organizational security practices. Examples include security policies, risk assessments, security awareness training, incident response plans, and access control procedures. These controls provide the framework and direction for implementing and maintaining an organization's security posture."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control Categories > Operational",
    contextSummary: "Operational security controls are implemented and executed by people rather than technology systems. Examples include security guards, background checks, separation of duties, job rotation, and security awareness training. These controls focus on day-to-day security operations and rely on human processes to reduce security risks."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control Categories > Physical",
    contextSummary: "Physical security controls are tangible barriers and mechanisms that protect physical assets, facilities, and resources from unauthorized access, theft, or damage. Examples include locks, fences, security guards, surveillance cameras, badge readers, and access control vestibules (mantraps). These controls form the first line of defense by preventing physical access to sensitive areas and equipment."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control types",
    contextSummary: "Security control types classify controls based on their functional purpose and when they operate in relation to security incidents. The six main types are preventive (stop incidents before they occur), deterrent (discourage attackers), detective (identify incidents), corrective (fix vulnerabilities after incidents), compensating (provide alternative controls), and directive (specify required actions). Understanding these types helps organizations design comprehensive security strategies that address threats at different stages."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control types > Preventive",
    contextSummary: "Preventive security controls are proactive measures designed to stop security incidents before they occur by eliminating vulnerabilities or blocking threats. Examples include firewalls blocking unauthorized traffic, access controls preventing unauthorized system access, encryption protecting data confidentiality, and security awareness training reducing human error. Preventive controls are the most desirable type as they avoid security incidents rather than reacting to them."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control types > Deterrent",
    contextSummary: "Deterrent security controls are designed to discourage potential attackers from attempting malicious activities by demonstrating strong security measures or potential consequences. Examples include visible security cameras, warning signs about monitoring, security guards, login banners stating penalties for unauthorized access, and strong password policies. While deterrent controls don't physically prevent attacks, they reduce the likelihood of attacks by making systems appear well-protected or highlighting legal consequences."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control types > Detective",
    contextSummary: "Detective security controls are designed to identify and alert on security incidents or policy violations that have occurred or are in progress. Examples include intrusion detection systems (IDS), security information and event management (SIEM) systems, log monitoring, audit trails, and motion detectors. These controls don't prevent incidents but provide visibility into security events, enabling timely response and investigation."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control types > Corrective",
    contextSummary: "Corrective security controls are reactive measures that restore systems to normal operation after a security incident or policy violation has occurred. Examples include patching vulnerabilities, restoring from backups, revoking compromised credentials, quarantining infected systems, and implementing system recovery procedures. These controls minimize damage and return systems to a secure state following security breaches."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control types > Compensating",
    contextSummary: "Compensating security controls are alternative measures implemented when primary security controls cannot be applied due to technical, operational, or cost constraints. Examples include using additional logging and monitoring when encryption isn't feasible, implementing manual review processes when automated controls fail, or adding network segmentation when direct protection isn't possible. These controls provide equivalent or comparable protection through different means."
  },
  {
    fullPath: "General Security Concepts > Compare and contrast various types of security controls > Security Control types > Directive",
    contextSummary: "Directive security controls are administrative instructions that specify required or recommended security behaviors and actions. Examples include security policies, acceptable use policies, standard operating procedures, security awareness training materials, and compliance mandates. These controls inform users and administrators about expected security practices and serve as the foundation for accountability and enforcement."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts",
    contextSummary: "This objective covers the fundamental concepts that underpin information security, including the CIA triad (confidentiality, integrity, availability), AAA framework (authentication, authorization, accounting), non-repudiation, Zero Trust architecture, and physical security principles. These concepts form the foundation for understanding how security controls protect information assets and guide security decision-making. Mastery of these fundamentals is essential for implementing comprehensive security programs."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Confidentiality",
    contextSummary: "Confidentiality ensures that information is accessible only to authorized individuals and protected from unauthorized disclosure. This principle is implemented through access controls, encryption, data classification, and need-to-know policies. Maintaining confidentiality prevents sensitive information such as personal data, trade secrets, and classified information from being exposed to unauthorized parties."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Integrity",
    contextSummary: "Integrity ensures that information and systems remain accurate, complete, and unmodified except by authorized processes and individuals. This principle protects against unauthorized alterations, corruption, or tampering of data. Integrity is maintained through hashing, digital signatures, version control, access controls, and change management processes that verify data hasn't been altered in transit or storage."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Availability",
    contextSummary: "Availability ensures that information systems and data are accessible and usable when needed by authorized users. This principle addresses protection against disruptions from hardware failures, natural disasters, power outages, and denial-of-service attacks. Availability is maintained through redundancy, fault tolerance, backups, disaster recovery planning, and capacity management."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Non-repudiation",
    contextSummary: "Non-repudiation prevents individuals from denying they performed specific actions by providing irrefutable evidence of transactions and activities. This concept is crucial for accountability and legal enforceability. Non-repudiation is achieved through digital signatures, audit logs, timestamps, and cryptographic proof that validates the identity of parties involved in transactions and communications."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Identification",
    contextSummary: "Identification is the process of claiming an identity, typically through a username, email address, employee ID, or other unique identifier. This is the first step in the authentication process where users assert who they are to a system. Identification alone doesn't prove identity but establishes the basis for subsequent authentication and authorization."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Authentication",
    contextSummary: "Authentication is the process of verifying that a claimed identity is legitimate by validating credentials or characteristics. Authentication methods include passwords (something you know), security tokens (something you have), and biometrics (something you are). Strong authentication often uses multi-factor authentication (MFA) combining two or more authentication factors to increase security beyond single-factor methods like passwords alone."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Authentication > Authenticating people",
    contextSummary: "Authenticating people involves verifying human users through various methods such as passwords, PINs, security questions, biometrics, smart cards, and one-time passwords. Multi-factor authentication is commonly used to strengthen security by requiring multiple forms of evidence. Special considerations for people include usability, password policies, account lockout mechanisms, and protection against social engineering attacks."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Authentication > Authenticating systems",
    contextSummary: "Authenticating systems involves verifying the identity of devices, servers, applications, and services rather than human users. Methods include digital certificates, API keys, system passwords, hardware security modules, and machine-to-machine authentication protocols. System authentication is critical for secure communication between servers, IoT devices, cloud services, and automated processes."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Authorization",
    contextSummary: "Authorization determines what actions authenticated users or systems are permitted to perform and what resources they can access. This process occurs after successful authentication and enforces access control policies. Authorization mechanisms ensure users only access resources appropriate to their roles and responsibilities, implementing principles like least privilege and need-to-know."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Authorization > Authorization models",
    contextSummary: "Authorization models are frameworks that define how access permissions are granted and managed. Common models include discretionary access control (DAC), mandatory access control (MAC), role-based access control (RBAC), and attribute-based access control (ABAC). Each model offers different approaches to managing permissions, balancing flexibility, security, and administrative overhead based on organizational needs."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Accounting",
    contextSummary: "Accounting (also called auditing) is the process of tracking and recording user and system activities to create an audit trail for security analysis, compliance, and forensic investigations. Accounting mechanisms log who accessed what resources, when access occurred, and what actions were performed. This information is essential for detecting security incidents, investigating breaches, and demonstrating compliance with regulations."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Gap analysis",
    contextSummary: "Gap analysis is the process of comparing an organization's current security posture against desired security objectives, industry standards, or regulatory requirements to identify deficiencies. This assessment highlights areas where security controls are missing, inadequate, or improperly implemented. The results guide prioritization of security investments and remediation efforts to close identified gaps."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust",
    contextSummary: "Zero Trust is a security framework that operates on the principle of 'never trust, always verify,' eliminating the concept of trusted internal networks. Every access request is authenticated, authorized, and encrypted regardless of origin. Zero Trust architecture uses micro-segmentation, least privilege access, continuous verification, and assumes breach to minimize attack surfaces and lateral movement."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Control Plane",
    contextSummary: "The Control Plane in Zero Trust architecture is the policy and decision-making layer that determines whether access requests should be granted or denied. It consists of the Policy Engine (evaluates access requests against policies and trust algorithms) and Policy Administrator (communicates decisions to enforcement points). The Control Plane performs adaptive identity verification, threat scope reduction, and policy-driven access control to make real-time access decisions."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Control Plane > Adaptive identity",
    contextSummary: "Adaptive identity in Zero Trust continuously evaluates user and device identity based on contextual factors such as behavior, location, device posture, and risk score. Unlike static authentication, adaptive identity dynamically adjusts trust levels and access permissions in real-time. This approach strengthens security by detecting anomalies and adjusting access controls based on changing risk conditions."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Control Plane > Threat scope reduction",
    contextSummary: "Threat scope reduction limits the potential impact of security breaches by minimizing the resources an attacker can access if they compromise a user or system. This is achieved through micro-segmentation, network isolation, least privilege access, and limiting lateral movement. By containing threats to small segments, organizations reduce the blast radius of successful attacks."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Control Plane > Policy-driven access control",
    contextSummary: "Policy-driven access control in Zero Trust uses centralized policies to govern all access decisions based on multiple factors including user identity, device security posture, resource sensitivity, and contextual signals. Policies are dynamically evaluated for every access request rather than relying on static network perimeters. This approach enables consistent, fine-grained access control across the entire enterprise."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Control Plane > Policy Administrator",
    contextSummary: "The Policy Administrator is the component in Zero Trust architecture that executes the Policy Engine's access decisions by establishing or terminating communication paths between subjects and resources. It communicates with Policy Enforcement Points (PEPs) to configure access, manages session establishment, and monitors ongoing connections. The Policy Administrator serves as the bridge between policy decisions and their enforcement."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Control Plane > Policy Engine",
    contextSummary: "The Policy Engine is the brain of Zero Trust architecture that evaluates access requests using trust algorithms, threat intelligence, policy rules, and contextual signals. It analyzes factors like user identity, device health, location, behavior patterns, and resource sensitivity to calculate trust scores. The Policy Engine makes allow/deny decisions and sends them to the Policy Administrator for enforcement."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Data Plane",
    contextSummary: "The Data Plane in Zero Trust architecture is where actual communication between subjects (users/systems) and resources occurs, governed by Policy Enforcement Points (PEPs). The Data Plane coordinates with the Control Plane to implement access decisions. It eliminates implicit trust zones by requiring explicit authorization for all connections and enforces micro-segmentation to prevent unauthorized lateral movement."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Data Plane > Implicit trust zones",
    contextSummary: "Implicit trust zones are network segments where devices and users are automatically trusted without verification, a concept that Zero Trust explicitly rejects. Traditional security models created trusted internal networks where authenticated users could freely access resources. Zero Trust eliminates these zones by requiring continuous verification and authorization regardless of network location, treating all networks as untrusted."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Data Plane > Subject/System",
    contextSummary: "In Zero Trust architecture, a Subject (or System) is any entity requesting access to resources, including users, devices, applications, and services. Each subject must be authenticated, authorized, and continuously verified regardless of location. Subjects operate in untrusted environments and must prove their identity and authorization for every access request through the Data Plane."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Zero Trust > Data Plane > Policy Enforcement Point",
    contextSummary: "Policy Enforcement Points (PEPs) are components in Zero Trust architecture that enable, monitor, and terminate connections between subjects and resources based on Policy Administrator commands. PEPs can be network gateways, application proxies, host-based firewalls, or cloud access security brokers (CASBs). They enforce access decisions at the point where subjects attempt to access resources in the Data Plane."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security",
    contextSummary: "Physical security encompasses measures that protect physical assets, facilities, personnel, and resources from unauthorized access, theft, damage, or environmental hazards. These controls form the foundation of comprehensive security programs by preventing attackers from gaining physical access to critical infrastructure. Physical security includes perimeter defenses, access controls, surveillance, environmental controls, and personnel security measures."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Bollards",
    contextSummary: "Bollards are short, sturdy vertical posts installed to prevent vehicles from accessing restricted areas or ramming into buildings. They serve as perimeter security barriers protecting pedestrian areas, building entrances, and critical infrastructure from vehicular attacks. Bollards can be fixed, removable, or retractable, and are often designed to withstand high-impact collisions while maintaining aesthetic appeal."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch1)
}
