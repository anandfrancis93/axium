/**
 * Context Summaries Batch 2 (Entities 41-100)
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch2 = [
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Access control vestibule",
    contextSummary: "An access control vestibule (also called a mantrap) is a small room with two interlocking doors where only one door can be open at a time, preventing tailgating and unauthorized access. This physical security control requires authentication at each door and creates a controlled space for verifying identity before granting facility access. Vestibules are commonly used in data centers, secure facilities, and high-security areas."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Fencing",
    contextSummary: "Fencing is a perimeter barrier that establishes property boundaries and restricts unauthorized physical access to facilities. Security fencing varies in height, material, and design based on security requirements—from decorative low fencing to high-security anti-climb fencing with barbed wire or razor wire. Fencing is often combined with surveillance, lighting, and intrusion detection systems for layered physical security."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Video surveillance",
    contextSummary: "Video surveillance uses cameras to monitor and record activities in and around facilities for security purposes. Surveillance systems deter criminal activity, provide evidence for investigations, enable real-time monitoring by security personnel, and create audit trails of physical access. Modern systems include features like motion detection, night vision, facial recognition, and integration with access control systems."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Security guard",
    contextSummary: "Security guards are trained personnel who provide physical security through active monitoring, access control, patrol, incident response, and deterrence of unauthorized activities. Guards offer adaptive security that can respond to unexpected situations, provide customer service, and make judgment calls that automated systems cannot. They are often combined with technical controls for comprehensive security coverage."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Access badge",
    contextSummary: "Access badges are physical credentials that identify and authorize individuals to enter secured areas. They can be simple photo ID badges for visual identification or smart cards with embedded chips for electronic access control. Modern badges use technologies like RFID, magnetic stripes, or NFC for contactless authentication at doors, turnstiles, and elevators, creating audit trails of facility access."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Lighting",
    contextSummary: "Security lighting illuminates areas to deter intruders, aid surveillance systems, and enable security personnel to detect suspicious activities. Proper lighting reduces hiding spots, improves camera visibility at night, and makes intruders more visible to guards and cameras. Types include continuous lighting, standby lighting activated by motion sensors, and emergency lighting for power outages."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Sensors",
    contextSummary: "Physical security sensors are devices that detect environmental changes, movement, or unauthorized access attempts and trigger alarms or alerts. Common types include motion detectors, door/window sensors, glass break detectors, and environmental sensors for temperature, smoke, or water. Sensors integrate with security systems to provide automated intrusion detection and environmental monitoring."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Sensors > Infrared",
    contextSummary: "Infrared sensors detect infrared radiation (heat) emitted by objects and people to identify movement or presence. Passive infrared (PIR) sensors are commonly used in motion detectors for alarm systems, detecting body heat changes when someone enters a protected area. Active infrared sensors use infrared beams that trigger alarms when interrupted, often used for perimeter protection."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Sensors > Pressure",
    contextSummary: "Pressure sensors detect weight or force applied to a surface and are used to identify unauthorized entry or movement. They are embedded in floors, mats, or under carpeting to detect when someone steps on protected areas. Pressure sensors are commonly used in museums to protect exhibits, in server rooms to detect unauthorized access, and in perimeter security for early intrusion detection."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Sensors > Microwave",
    contextSummary: "Microwave sensors emit microwave radiation and detect disruptions in the reflected signal caused by movement, making them effective for outdoor perimeter security. They have longer range than infrared sensors and can penetrate lightweight materials. Microwave sensors are less affected by temperature changes but may be sensitive to environmental factors like wind-blown debris or small animals."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Physical security > Sensors > Ultrasonic",
    contextSummary: "Ultrasonic sensors emit high-frequency sound waves and detect changes in the reflected waves caused by movement or objects. They are effective for interior spaces and can detect motion even when direct line of sight is obstructed. Ultrasonic sensors may experience false alarms from air turbulence, loud noises, or reflective surfaces but are useful for detecting unauthorized access in confined spaces."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Deception and disruption technology",
    contextSummary: "Deception and disruption technologies are defensive security tools that mislead, confuse, or slow down attackers by presenting fake assets and misleading information. These technologies include honeypots, honeynets, honeyfiles, and honeytokens that attract attackers away from real assets while gathering intelligence about attack methods. They serve as early warning systems and provide insight into attacker tactics, techniques, and procedures."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Deception and disruption technology > Honeypot",
    contextSummary: "A honeypot is a decoy system designed to appear as a legitimate target to attract and monitor attackers while protecting real systems. Honeypots mimic vulnerable services, applications, or data to lure attackers, allowing security teams to study attack techniques without risking production systems. They provide early detection of threats, gather threat intelligence, and distract attackers from actual assets."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Deception and disruption technology > Honeynet",
    contextSummary: "A honeynet is a network of honeypots that simulates an entire network environment with multiple interconnected systems. Honeynets create realistic attack scenarios where security researchers can observe how attackers move laterally, escalate privileges, and compromise multiple systems. They provide comprehensive threat intelligence about multi-stage attacks and advanced persistent threats (APTs)."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Deception and disruption technology > Honeyfile",
    contextSummary: "A honeyfile is a decoy file that appears to contain valuable or sensitive information but is actually monitored bait designed to detect unauthorized access or data exfiltration. When accessed, copied, or modified, honeyfiles trigger alerts indicating a potential breach. They are strategically placed in file systems to detect insider threats, compromised accounts, or malware that searches for sensitive data."
  },
  {
    fullPath: "General Security Concepts > Summarize fundamental security concepts > Deception and disruption technology > Honeytoken",
    contextSummary: "A honeytoken is a piece of fake data (such as a bogus credential, API key, or database record) planted in systems to detect unauthorized access or data theft. Unlike honeypots which are systems, honeytokens are discrete data elements that trigger alerts when used. Examples include fake credit card numbers, dummy user accounts, or fabricated database entries that should never be legitimately accessed."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security",
    contextSummary: "This objective addresses how change management processes impact security by ensuring that modifications to systems, applications, and infrastructure are controlled, tested, and documented to prevent security vulnerabilities. Proper change management includes approval processes, impact analysis, testing, backout plans, and documentation updates. Understanding these processes is critical because uncontrolled changes are a leading cause of security incidents and system outages."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation",
    contextSummary: "Business processes impacting security operations are organizational procedures that must be followed when implementing changes to ensure security is maintained. These include approval workflows, ownership assignment, stakeholder coordination, impact assessment, testing validation, backout planning, and scheduling maintenance windows. Following structured business processes prevents unauthorized or poorly planned changes that could introduce vulnerabilities or cause outages."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Approval process",
    contextSummary: "The approval process in change management requires changes to be reviewed and authorized by designated individuals or committees before implementation. This control prevents unauthorized modifications and ensures changes are evaluated for security implications, business impact, and technical feasibility. Approval workflows may include multiple stages such as technical review, security assessment, and management authorization based on change risk and scope."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Ownership",
    contextSummary: "Ownership in change management assigns responsibility for changes to specific individuals or teams who are accountable for planning, implementing, testing, and supporting the modification. Clear ownership ensures someone is responsible for the change's success and available to address issues that arise. Ownership includes understanding dependencies, coordinating with affected parties, and maintaining documentation throughout the change lifecycle."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Stakeholders",
    contextSummary: "Stakeholders in change management are individuals, teams, or business units affected by or involved in proposed changes. Identifying and engaging stakeholders ensures all perspectives are considered, dependencies are understood, and communication is effective. Stakeholders may include system administrators, application owners, security teams, end users, compliance officers, and business leaders who need to be informed or consulted."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Impact analysis",
    contextSummary: "Impact analysis evaluates how proposed changes will affect systems, users, business processes, and security posture before implementation. This assessment identifies potential risks, dependencies, resource requirements, and security implications to inform decision-making. Impact analysis considers technical factors (performance, compatibility, availability), business factors (productivity, revenue, compliance), and security factors (vulnerabilities, control effectiveness)."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Test results",
    contextSummary: "Test results document the outcomes of validating proposed changes in non-production environments before deployment to production. Testing verifies that changes function as intended, don't introduce new vulnerabilities, don't break existing functionality, and meet security requirements. Results must be reviewed and approved as part of the change approval process to ensure changes are safe to implement."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Backout plan",
    contextSummary: "A backout plan (also called rollback plan) documents the steps required to reverse a change and restore systems to their previous state if the change causes problems. Having a tested backout plan minimizes downtime and security risks when changes fail or have unintended consequences. The plan should include procedures for reversing configuration changes, restoring from backups, and verifying system functionality after rollback."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Maintenance window",
    contextSummary: "A maintenance window is a scheduled time period designated for implementing changes when business impact and security risks are minimized, typically during off-peak hours or weekends. Maintenance windows provide predictable downtime, allow for adequate testing and rollback time, and ensure appropriate support staff are available. Organizations define maintenance window policies based on business criticality, service level agreements, and operational requirements."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Business processes impacting security operation > Standard operating procedure",
    contextSummary: "A standard operating procedure (SOP) is a documented, step-by-step process for performing routine changes consistently and securely. SOPs reduce errors, ensure security best practices are followed, and enable delegation to less experienced staff. They define prerequisites, execution steps, validation criteria, and troubleshooting guidance for common changes like patch deployment, user provisioning, or configuration updates."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications",
    contextSummary: "Technical implications of change management are the direct effects that changes have on system configurations, security controls, and operational procedures. Understanding technical implications helps prevent unintended security gaps or system disruptions. Key considerations include updates to allow lists and deny lists, restricted activities during changes, system downtime requirements, service and application restarts, legacy application compatibility, and dependency management."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Allow lists",
    contextSummary: "Allow lists (whitelists) specify explicitly permitted entities such as applications, IP addresses, email senders, or users that are granted access to resources. When changes occur, allow lists must be updated to include new approved entities or systems. Failure to update allow lists can block legitimate access, while overly permissive lists reduce security by allowing unauthorized entities."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Deny lists",
    contextSummary: "Deny lists (blacklists) specify entities that are explicitly blocked from accessing resources, such as malicious IP addresses, known malware signatures, or revoked user accounts. Changes may require updating deny lists to block new threats or remove entries that are no longer relevant. Deny lists are reactive controls that must be continuously maintained as the threat landscape evolves."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Restricted activities",
    contextSummary: "Restricted activities are actions that are limited or prohibited during certain times or conditions to maintain security and stability. During change implementation, organizations may restrict activities such as concurrent changes, non-emergency modifications, access to critical systems, or high-risk operations. These restrictions prevent conflicts, reduce complexity, and ensure adequate resources are available to manage changes safely."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch2)
}

export { batch2 }
