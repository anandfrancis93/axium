/**
 * Context Summaries Batch 1 (Entities 1-100)
 * Auto-generated summaries for curriculum entities
 */

import { addContextSummaries } from './add-context-summaries'

const summaries = [
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
  },
  {
    id: "e61060f7-e602-4b69-a5ad-24afafa2fecb",
    contextSummary: "Detective security controls are designed to identify and alert on security incidents or policy violations that have occurred or are in progress. Examples include intrusion detection systems (IDS), security information and event management (SIEM) systems, log monitoring, audit trails, and motion detectors. These controls don't prevent incidents but provide visibility into security events, enabling timely response and investigation."
  },
  {
    id: "2cb33e3a-c410-41cf-821b-54e006ff96a4",
    contextSummary: "Corrective security controls are reactive measures that restore systems to normal operation after a security incident or policy violation has occurred. Examples include patching vulnerabilities, restoring from backups, revoking compromised credentials, quarantining infected systems, and implementing system recovery procedures. These controls minimize damage and return systems to a secure state following security breaches."
  },
  {
    id: "7550ef02-1d0c-4158-8eb0-4e25f1780410",
    contextSummary: "Compensating security controls are alternative measures implemented when primary security controls cannot be applied due to technical, operational, or cost constraints. Examples include using additional logging and monitoring when encryption isn't feasible, implementing manual review processes when automated controls fail, or adding network segmentation when direct protection isn't possible. These controls provide equivalent or comparable protection through different means."
  },
  {
    id: "4522265e-1d8d-4a55-898c-6ae592e812c0",
    contextSummary: "Directive security controls are administrative instructions that specify required or recommended security behaviors and actions. Examples include security policies, acceptable use policies, standard operating procedures, security awareness training materials, and compliance mandates. These controls inform users and administrators about expected security practices and serve as the foundation for accountability and enforcement."
  },
  {
    id: "39446232-dcca-4ea3-b9dc-fc64a22cd466",
    contextSummary: "This objective covers the fundamental concepts that underpin information security, including the CIA triad (confidentiality, integrity, availability), AAA framework (authentication, authorization, accounting), non-repudiation, Zero Trust architecture, and physical security principles. These concepts form the foundation for understanding how security controls protect information assets and guide security decision-making. Mastery of these fundamentals is essential for implementing comprehensive security programs."
  },
  {
    id: "fea2ba41-a5ab-450f-845d-0665e7d0af31",
    contextSummary: "Confidentiality ensures that information is accessible only to authorized individuals and protected from unauthorized disclosure. This principle is implemented through access controls, encryption, data classification, and need-to-know policies. Maintaining confidentiality prevents sensitive information such as personal data, trade secrets, and classified information from being exposed to unauthorized parties."
  },
  {
    id: "98f2a44e-8214-441a-9b7d-c1ae34ad4eec",
    contextSummary: "Integrity ensures that information and systems remain accurate, complete, and unmodified except by authorized processes and individuals. This principle protects against unauthorized alterations, corruption, or tampering of data. Integrity is maintained through hashing, digital signatures, version control, access controls, and change management processes that verify data hasn't been altered in transit or storage."
  },
  {
    id: "83e71a51-d330-4341-ae38-6e18190e0892",
    contextSummary: "Availability ensures that information systems and data are accessible and usable when needed by authorized users. This principle addresses protection against disruptions from hardware failures, natural disasters, power outages, and denial-of-service attacks. Availability is maintained through redundancy, fault tolerance, backups, disaster recovery planning, and capacity management."
  },
  {
    id: "33e70d95-88f2-44f5-8cec-4f5d6f55a6b4",
    contextSummary: "Non-repudiation prevents individuals from denying they performed specific actions by providing irrefutable evidence of transactions and activities. This concept is crucial for accountability and legal enforceability. Non-repudiation is achieved through digital signatures, audit logs, timestamps, and cryptographic proof that validates the identity of parties involved in transactions and communications."
  },
  {
    id: "b500fdbf-8f6a-4c1f-b48d-e733e97585cd",
    contextSummary: "Identification is the process of claiming an identity, typically through a username, email address, employee ID, or other unique identifier. This is the first step in the authentication process where users assert who they are to a system. Identification alone doesn't prove identity but establishes the basis for subsequent authentication and authorization."
  },
  {
    id: "0b514a9a-2d33-4011-a573-9d9875e0cc47",
    contextSummary: "Authentication is the process of verifying that a claimed identity is legitimate by validating credentials or characteristics. Authentication methods include passwords (something you know), security tokens (something you have), and biometrics (something you are). Strong authentication often uses multi-factor authentication (MFA) combining two or more authentication factors to increase security beyond single-factor methods like passwords alone."
  },
  {
    id: "1dcd1514-053e-4caf-876f-7b63fc6532e5",
    contextSummary: "Authenticating people involves verifying human users through various methods such as passwords, PINs, security questions, biometrics, smart cards, and one-time passwords. Multi-factor authentication is commonly used to strengthen security by requiring multiple forms of evidence. Special considerations for people include usability, password policies, account lockout mechanisms, and protection against social engineering attacks."
  },
  {
    id: "6546d42c-ab6c-41c7-949e-72877a74ba69",
    contextSummary: "Authenticating systems involves verifying the identity of devices, servers, applications, and services rather than human users. Methods include digital certificates, API keys, system passwords, hardware security modules, and machine-to-machine authentication protocols. System authentication is critical for secure communication between servers, IoT devices, cloud services, and automated processes."
  },
  {
    id: "0d2ccc58-80fb-49fa-9226-7f17be9dbb20",
    contextSummary: "Authorization determines what actions authenticated users or systems are permitted to perform and what resources they can access. This process occurs after successful authentication and enforces access control policies. Authorization mechanisms ensure users only access resources appropriate to their roles and responsibilities, implementing principles like least privilege and need-to-know."
  },
  {
    id: "38acfb13-88c1-41e5-8b71-e8cd51e4b2b3",
    contextSummary: "Authorization models are frameworks that define how access permissions are granted and managed. Common models include discretionary access control (DAC), mandatory access control (MAC), role-based access control (RBAC), and attribute-based access control (ABAC). Each model offers different approaches to managing permissions, balancing flexibility, security, and administrative overhead based on organizational needs."
  },
  {
    id: "5c94ac98-d34a-4f8d-8959-e5724d01733c",
    contextSummary: "Accounting (also called auditing) is the process of tracking and recording user and system activities to create an audit trail for security analysis, compliance, and forensic investigations. Accounting mechanisms log who accessed what resources, when access occurred, and what actions were performed. This information is essential for detecting security incidents, investigating breaches, and demonstrating compliance with regulations."
  },
  {
    id: "e6275d6c-986f-4e3f-87e1-fff708b92220",
    contextSummary: "Gap analysis is the process of comparing an organization's current security posture against desired security objectives, industry standards, or regulatory requirements to identify deficiencies. This assessment highlights areas where security controls are missing, inadequate, or improperly implemented. The results guide prioritization of security investments and remediation efforts to close identified gaps."
  },
  {
    id: "382a82eb-56fe-4a53-81d9-9ba285ec9087",
    contextSummary: "Zero Trust is a security framework that operates on the principle of 'never trust, always verify,' eliminating the concept of trusted internal networks. Every access request is authenticated, authorized, and encrypted regardless of origin. Zero Trust architecture uses micro-segmentation, least privilege access, continuous verification, and assumes breach to minimize attack surfaces and lateral movement."
  },
  {
    id: "680c6899-ef37-4ff0-a73f-c149afc1b0cc",
    contextSummary: "The Control Plane in Zero Trust architecture is the policy and decision-making layer that determines whether access requests should be granted or denied. It consists of the Policy Engine (evaluates access requests against policies and trust algorithms) and Policy Administrator (communicates decisions to enforcement points). The Control Plane performs adaptive identity verification, threat scope reduction, and policy-driven access control to make real-time access decisions."
  },
  {
    id: "6376915c-5b12-4035-8be0-d12ebf19f8dd",
    contextSummary: "Adaptive identity in Zero Trust continuously evaluates user and device identity based on contextual factors such as behavior, location, device posture, and risk score. Unlike static authentication, adaptive identity dynamically adjusts trust levels and access permissions in real-time. This approach strengthens security by detecting anomalies and adjusting access controls based on changing risk conditions."
  },
  {
    id: "c36828cc-417d-4384-b922-9a60c7c38388",
    contextSummary: "Threat scope reduction limits the potential impact of security breaches by minimizing the resources an attacker can access if they compromise a user or system. This is achieved through micro-segmentation, network isolation, least privilege access, and limiting lateral movement. By containing threats to small segments, organizations reduce the blast radius of successful attacks."
  },
  {
    id: "6907d561-c5f0-42dd-b97d-078bae3b86de",
    contextSummary: "Policy-driven access control in Zero Trust uses centralized policies to govern all access decisions based on multiple factors including user identity, device security posture, resource sensitivity, and contextual signals. Policies are dynamically evaluated for every access request rather than relying on static network perimeters. This approach enables consistent, fine-grained access control across the entire enterprise."
  },
  {
    id: "02ee8a8e-1268-484d-b429-c0bc123a36af",
    contextSummary: "The Policy Administrator is the component in Zero Trust architecture that executes the Policy Engine's access decisions by establishing or terminating communication paths between subjects and resources. It communicates with Policy Enforcement Points (PEPs) to configure access, manages session establishment, and monitors ongoing connections. The Policy Administrator serves as the bridge between policy decisions and their enforcement."
  },
  {
    id: "7013238c-5b05-41d7-b2d2-eff2441c5ad8",
    contextSummary: "The Policy Engine is the brain of Zero Trust architecture that evaluates access requests using trust algorithms, threat intelligence, policy rules, and contextual signals. It analyzes factors like user identity, device health, location, behavior patterns, and resource sensitivity to calculate trust scores. The Policy Engine makes allow/deny decisions and sends them to the Policy Administrator for enforcement."
  },
  {
    id: "76159084-3d2a-492a-8faf-ca6b7a0f1dae",
    contextSummary: "The Data Plane in Zero Trust architecture is where actual communication between subjects (users/systems) and resources occurs, governed by Policy Enforcement Points (PEPs). The Data Plane coordinates with the Control Plane to implement access decisions. It eliminates implicit trust zones by requiring explicit authorization for all connections and enforces micro-segmentation to prevent unauthorized lateral movement."
  },
  {
    id: "33ec6c51-2d77-4878-86d5-2e91d369c100",
    contextSummary: "Implicit trust zones are network segments where devices and users are automatically trusted without verification, a concept that Zero Trust explicitly rejects. Traditional security models created trusted internal networks where authenticated users could freely access resources. Zero Trust eliminates these zones by requiring continuous verification and authorization regardless of network location, treating all networks as untrusted."
  },
  {
    id: "7b655c47-32e4-471b-8882-39f7bb9f827e",
    contextSummary: "In Zero Trust architecture, a Subject (or System) is any entity requesting access to resources, including users, devices, applications, and services. Each subject must be authenticated, authorized, and continuously verified regardless of location. Subjects operate in untrusted environments and must prove their identity and authorization for every access request through the Data Plane."
  },
  {
    id: "ee5d3a2f-bb12-4d19-8264-5a2cb65436b1",
    contextSummary: "Policy Enforcement Points (PEPs) are components in Zero Trust architecture that enable, monitor, and terminate connections between subjects and resources based on Policy Administrator commands. PEPs can be network gateways, application proxies, host-based firewalls, or cloud access security brokers (CASBs). They enforce access decisions at the point where subjects attempt to access resources in the Data Plane."
  },
  {
    id: "7bd60eab-c49b-49bd-bb2a-379cd25875d0",
    contextSummary: "Physical security encompasses measures that protect physical assets, facilities, personnel, and resources from unauthorized access, theft, damage, or environmental hazards. These controls form the foundation of comprehensive security programs by preventing attackers from gaining physical access to critical infrastructure. Physical security includes perimeter defenses, access controls, surveillance, environmental controls, and personnel security measures."
  },
  {
    id: "2942d5e2-812d-4c6d-8c1a-172235d205aa",
    contextSummary: "Bollards are short, sturdy vertical posts installed to prevent vehicles from accessing restricted areas or ramming into buildings. They serve as perimeter security barriers protecting pedestrian areas, building entrances, and critical infrastructure from vehicular attacks. Bollards can be fixed, removable, or retractable, and are often designed to withstand high-impact collisions while maintaining aesthetic appeal."
  },
  {
    id: "3a3a0ad1-793b-4491-91d5-5536e3e7324c",
    contextSummary: "An access control vestibule (also called a mantrap) is a small room with two interlocking doors where only one door can be open at a time, preventing tailgating and unauthorized access. This physical security control requires authentication at each door and creates a controlled space for verifying identity before granting facility access. Vestibules are commonly used in data centers, secure facilities, and high-security areas."
  },
  {
    id: "306e7691-a1d2-4cf9-b9fd-1d8a8bd0abbb",
    contextSummary: "Fencing is a perimeter barrier that establishes property boundaries and restricts unauthorized physical access to facilities. Security fencing varies in height, material, and design based on security requirements—from decorative low fencing to high-security anti-climb fencing with barbed wire or razor wire. Fencing is often combined with surveillance, lighting, and intrusion detection systems for layered physical security."
  },
  {
    id: "1efdd161-9be4-43bd-b8f3-d27678620463",
    contextSummary: "Video surveillance uses cameras to monitor and record activities in and around facilities for security purposes. Surveillance systems deter criminal activity, provide evidence for investigations, enable real-time monitoring by security personnel, and create audit trails of physical access. Modern systems include features like motion detection, night vision, facial recognition, and integration with access control systems."
  },
  {
    id: "4ffd66c8-08ad-4764-8db6-65c26d5611ea",
    contextSummary: "Security guards are trained personnel who provide physical security through active monitoring, access control, patrol, incident response, and deterrence of unauthorized activities. Guards offer adaptive security that can respond to unexpected situations, provide customer service, and make judgment calls that automated systems cannot. They are often combined with technical controls for comprehensive security coverage."
  },
  {
    id: "4863e74e-2cd9-4efe-8448-b14700e9095e",
    contextSummary: "Access badges are physical credentials that identify and authorize individuals to enter secured areas. They can be simple photo ID badges for visual identification or smart cards with embedded chips for electronic access control. Modern badges use technologies like RFID, magnetic stripes, or NFC for contactless authentication at doors, turnstiles, and elevators, creating audit trails of facility access."
  },
  {
    id: "dc6c6591-5211-4fab-bbf2-6fd6127bfab5",
    contextSummary: "Security lighting illuminates areas to deter intruders, aid surveillance systems, and enable security personnel to detect suspicious activities. Proper lighting reduces hiding spots, improves camera visibility at night, and makes intruders more visible to guards and cameras. Types include continuous lighting, standby lighting activated by motion sensors, and emergency lighting for power outages."
  },
  {
    id: "895cbc62-afc1-4929-b1f1-08f72cb76ee9",
    contextSummary: "Physical security sensors are devices that detect environmental changes, movement, or unauthorized access attempts and trigger alarms or alerts. Common types include motion detectors, door/window sensors, glass break detectors, and environmental sensors for temperature, smoke, or water. Sensors integrate with security systems to provide automated intrusion detection and environmental monitoring."
  },
  {
    id: "df54e4f8-ea95-4b19-adef-163beb729e89",
    contextSummary: "Infrared sensors detect infrared radiation (heat) emitted by objects and people to identify movement or presence. Passive infrared (PIR) sensors are commonly used in motion detectors for alarm systems, detecting body heat changes when someone enters a protected area. Active infrared sensors use infrared beams that trigger alarms when interrupted, often used for perimeter protection."
  },
  {
    id: "7c48c566-ab0c-4796-a6de-f885d1fec240",
    contextSummary: "Pressure sensors detect weight or force applied to a surface and are used to identify unauthorized entry or movement. They are embedded in floors, mats, or under carpeting to detect when someone steps on protected areas. Pressure sensors are commonly used in museums to protect exhibits, in server rooms to detect unauthorized access, and in perimeter security for early intrusion detection."
  },
  {
    id: "3180e5a4-66b9-4d5c-9904-b59bae7978bb",
    contextSummary: "Microwave sensors emit microwave radiation and detect disruptions in the reflected signal caused by movement, making them effective for outdoor perimeter security. They have longer range than infrared sensors and can penetrate lightweight materials. Microwave sensors are less affected by temperature changes but may be sensitive to environmental factors like wind-blown debris or small animals."
  },
  {
    id: "b45e54e5-0646-464d-b714-3fa1f1c4d5b5",
    contextSummary: "Ultrasonic sensors emit high-frequency sound waves and detect changes in the reflected waves caused by movement or objects. They are effective for interior spaces and can detect motion even when direct line of sight is obstructed. Ultrasonic sensors may experience false alarms from air turbulence, loud noises, or reflective surfaces but are useful for detecting unauthorized access in confined spaces."
  },
  {
    id: "b9c997b2-0df8-4ea5-811e-9668b6cd0a69",
    contextSummary: "Deception and disruption technologies are defensive security tools that mislead, confuse, or slow down attackers by presenting fake assets and misleading information. These technologies include honeypots, honeynets, honeyfiles, and honeytokens that attract attackers away from real assets while gathering intelligence about attack methods. They serve as early warning systems and provide insight into attacker tactics, techniques, and procedures."
  },
  {
    id: "93e05498-acf2-457d-87d7-11af76d1ad92",
    contextSummary: "A honeypot is a decoy system designed to appear as a legitimate target to attract and monitor attackers while protecting real systems. Honeypots mimic vulnerable services, applications, or data to lure attackers, allowing security teams to study attack techniques without risking production systems. They provide early detection of threats, gather threat intelligence, and distract attackers from actual assets."
  },
  {
    id: "56ac927f-fb04-428b-8561-4c9441d98c37",
    contextSummary: "A honeynet is a network of honeypots that simulates an entire network environment with multiple interconnected systems. Honeynets create realistic attack scenarios where security researchers can observe how attackers move laterally, escalate privileges, and compromise multiple systems. They provide comprehensive threat intelligence about multi-stage attacks and advanced persistent threats (APTs)."
  },
  {
    id: "c26273c4-998c-461d-8a86-6be656413073",
    contextSummary: "A honeyfile is a decoy file that appears to contain valuable or sensitive information but is actually monitored bait designed to detect unauthorized access or data exfiltration. When accessed, copied, or modified, honeyfiles trigger alerts indicating a potential breach. They are strategically placed in file systems to detect insider threats, compromised accounts, or malware that searches for sensitive data."
  },
  {
    id: "405aba0e-a690-4b26-bd0e-9382e0c5fd76",
    contextSummary: "A honeytoken is a piece of fake data (such as a bogus credential, API key, or database record) planted in systems to detect unauthorized access or data theft. Unlike honeypots which are systems, honeytokens are discrete data elements that trigger alerts when used. Examples include fake credit card numbers, dummy user accounts, or fabricated database entries that should never be legitimately accessed."
  },
  {
    id: "9919455c-c1ad-4381-9474-cd3ca7d95792",
    contextSummary: "This objective addresses how change management processes impact security by ensuring that modifications to systems, applications, and infrastructure are controlled, tested, and documented to prevent security vulnerabilities. Proper change management includes approval processes, impact analysis, testing, backout plans, and documentation updates. Understanding these processes is critical because uncontrolled changes are a leading cause of security incidents and system outages."
  },
  {
    id: "812f6401-dc17-4a31-8ee5-3fae156321ba",
    contextSummary: "Business processes impacting security operations are organizational procedures that must be followed when implementing changes to ensure security is maintained. These include approval workflows, ownership assignment, stakeholder coordination, impact assessment, testing validation, backout planning, and scheduling maintenance windows. Following structured business processes prevents unauthorized or poorly planned changes that could introduce vulnerabilities or cause outages."
  },
  {
    id: "22c1683b-b82d-43b2-ad50-d41eeba5bf4d",
    contextSummary: "The approval process in change management requires changes to be reviewed and authorized by designated individuals or committees before implementation. This control prevents unauthorized modifications and ensures changes are evaluated for security implications, business impact, and technical feasibility. Approval workflows may include multiple stages such as technical review, security assessment, and management authorization based on change risk and scope."
  },
  {
    id: "877dc24b-d693-4e38-a877-0d81bea701ac",
    contextSummary: "Ownership in change management assigns responsibility for changes to specific individuals or teams who are accountable for planning, implementing, testing, and supporting the modification. Clear ownership ensures someone is responsible for the change's success and available to address issues that arise. Ownership includes understanding dependencies, coordinating with affected parties, and maintaining documentation throughout the change lifecycle."
  },
  {
    id: "4d6f7f69-44da-403d-b503-020247eb062c",
    contextSummary: "Stakeholders in change management are individuals, teams, or business units affected by or involved in proposed changes. Identifying and engaging stakeholders ensures all perspectives are considered, dependencies are understood, and communication is effective. Stakeholders may include system administrators, application owners, security teams, end users, compliance officers, and business leaders who need to be informed or consulted."
  },
  {
    id: "c532754c-c47a-40be-9b2d-45c709599ae8",
    contextSummary: "Impact analysis evaluates how proposed changes will affect systems, users, business processes, and security posture before implementation. This assessment identifies potential risks, dependencies, resource requirements, and security implications to inform decision-making. Impact analysis considers technical factors (performance, compatibility, availability), business factors (productivity, revenue, compliance), and security factors (vulnerabilities, control effectiveness)."
  },
  {
    id: "bdbed4a0-a42e-4522-a2d2-3e6710156ac4",
    contextSummary: "Test results document the outcomes of validating proposed changes in non-production environments before deployment to production. Testing verifies that changes function as intended, don't introduce new vulnerabilities, don't break existing functionality, and meet security requirements. Results must be reviewed and approved as part of the change approval process to ensure changes are safe to implement."
  },
  {
    id: "8f2552b0-d90d-4abe-a64e-0d03ae19cd26",
    contextSummary: "A backout plan (also called rollback plan) documents the steps required to reverse a change and restore systems to their previous state if the change causes problems. Having a tested backout plan minimizes downtime and security risks when changes fail or have unintended consequences. The plan should include procedures for reversing configuration changes, restoring from backups, and verifying system functionality after rollback."
  },
  {
    id: "413abba6-7aa8-4984-9b5b-8d10a0c96116",
    contextSummary: "A maintenance window is a scheduled time period designated for implementing changes when business impact and security risks are minimized, typically during off-peak hours or weekends. Maintenance windows provide predictable downtime, allow for adequate testing and rollback time, and ensure appropriate support staff are available. Organizations define maintenance window policies based on business criticality, service level agreements, and operational requirements."
  },
  {
    id: "36996f92-bd30-493c-8f92-a557bee4d5c9",
    contextSummary: "A standard operating procedure (SOP) is a documented, step-by-step process for performing routine changes consistently and securely. SOPs reduce errors, ensure security best practices are followed, and enable delegation to less experienced staff. They define prerequisites, execution steps, validation criteria, and troubleshooting guidance for common changes like patch deployment, user provisioning, or configuration updates."
  },
  {
    id: "741ed661-3ca4-472a-a461-40f39bcf06ee",
    contextSummary: "Technical implications of change management are the direct effects that changes have on system configurations, security controls, and operational procedures. Understanding technical implications helps prevent unintended security gaps or system disruptions. Key considerations include updates to allow lists and deny lists, restricted activities during changes, system downtime requirements, service and application restarts, legacy application compatibility, and dependency management."
  },
  {
    id: "49f50f2e-f394-4b33-9125-650eb577ba55",
    contextSummary: "Allow lists (whitelists) specify explicitly permitted entities such as applications, IP addresses, email senders, or users that are granted access to resources. When changes occur, allow lists must be updated to include new approved entities or systems. Failure to update allow lists can block legitimate access, while overly permissive lists reduce security by allowing unauthorized entities."
  },
  {
    id: "c136db89-755c-4722-8203-45730a9f07f0",
    contextSummary: "Deny lists (blacklists) specify entities that are explicitly blocked from accessing resources, such as malicious IP addresses, known malware signatures, or revoked user accounts. Changes may require updating deny lists to block new threats or remove entries that are no longer relevant. Deny lists are reactive controls that must be continuously maintained as the threat landscape evolves."
  },
  {
    id: "abee9776-3d09-49b7-a037-16dc5f68218e",
    contextSummary: "Restricted activities are actions that are limited or prohibited during certain times or conditions to maintain security and stability. During change implementation, organizations may restrict activities such as concurrent changes, non-emergency modifications, access to critical systems, or high-risk operations. These restrictions prevent conflicts, reduce complexity, and ensure adequate resources are available to manage changes safely."
  },
  {
    id: "a3f8b39b-87ef-4694-8c79-e21905a07949",
    contextSummary: "Downtime refers to periods when systems or services are unavailable to users, often necessary during change implementation for system restarts, configuration updates, or hardware replacements. Planned downtime should be scheduled during maintenance windows, communicated to stakeholders, and minimized through careful planning. Unplanned downtime due to failed changes highlights the importance of testing and backout plans."
  },
  {
    id: "d3e9a6a1-3649-4d8b-983b-94cf0e50432a",
    contextSummary: "Service restart involves stopping and restarting system services to apply configuration changes, load updated software, or clear memory issues. Restarts may be required after security patches, configuration updates, or to recover from service degradation. Service restarts can cause brief outages and should be planned during maintenance windows, with consideration for service dependencies and restart order."
  },
  {
    id: "18dd55d4-89e0-45fe-9f18-069bffd0363c",
    contextSummary: "Application restart involves stopping and restarting applications to apply updates, clear cached data, or resolve performance issues. Application restarts may affect users currently connected and require coordination with business stakeholders. Proper planning includes notifying users, saving work in progress, and verifying application functionality after restart, especially for critical business applications."
  },
  {
    id: "9a7502e8-4a25-49ea-8811-d64eda8fd124",
    contextSummary: "Legacy applications are older software systems that may no longer be actively maintained or updated but remain critical to business operations. Changes to infrastructure, security controls, or dependencies can break legacy applications that weren't designed for modern environments. Special considerations include compatibility testing, vendor support availability, technical debt, and potential need for compensating controls when security updates aren't available."
  },
  {
    id: "e4ff02cb-b21c-4c66-897b-089808ffdace",
    contextSummary: "Dependencies are relationships between systems, applications, services, or components where one relies on another to function properly. Changes must account for dependencies to prevent cascading failures or security gaps. Dependency mapping identifies which systems communicate, share data, or rely on common infrastructure, enabling proper change sequencing, coordination, and testing of integrated systems."
  },
  {
    id: "6f3103a5-8023-4f72-a2fc-5f0eb9abb7c3",
    contextSummary: "Documentation in change management captures the what, why, how, and when of changes to systems and security controls. Proper documentation enables knowledge transfer, supports troubleshooting, demonstrates compliance, and maintains institutional knowledge. Critical documentation includes updated system diagrams, network topology maps, configuration settings, security policies, procedures, and version control history."
  },
  {
    id: "064cf8a6-d9f3-4f8b-b3c0-78e667412f4f",
    contextSummary: "Updating diagrams involves revising network topology diagrams, system architecture diagrams, data flow diagrams, and other visual documentation to reflect changes made to the environment. Accurate diagrams are essential for security analysis, incident response, troubleshooting, and compliance audits. Outdated diagrams can lead to security misconfigurations, failed incident response, and compliance violations."
  },
  {
    id: "13225e74-88b2-4100-8d18-bac83b3d1c1e",
    contextSummary: "Updating policies and procedures ensures that organizational rules and step-by-step processes reflect current system configurations, security controls, and operational practices. When changes modify how systems work or how security is enforced, related policies and procedures must be revised and communicated to relevant personnel. Outdated documentation can result in policy violations, audit findings, and inconsistent security practices."
  },
  {
    id: "5fed1cfd-aadc-4f58-911b-bd96241ebc45",
    contextSummary: "Version control tracks changes to files, configurations, code, and documents over time, maintaining a history of who made changes, what was changed, and when changes occurred. Version control enables rollback to previous versions, comparison between versions, and collaborative development. For security, version control provides audit trails, change attribution, and the ability to review security-relevant configuration changes."
  },
  {
    id: "27bb129b-ad89-4358-83de-1fbe8d111256",
    contextSummary: "This objective covers cryptographic solutions that protect data confidentiality, integrity, and authenticity through encryption, hashing, digital signatures, and key management. Understanding cryptography is essential for securing data at rest and in transit, implementing public key infrastructure (PKI), and selecting appropriate cryptographic algorithms and key lengths. Students learn when and how to apply cryptographic tools to address specific security requirements."
  },
  {
    id: "0854a950-4756-4ab0-809d-449964e7c344",
    contextSummary: "Public Key Infrastructure (PKI) is a framework that manages digital certificates and public/private key pairs to enable secure communications, authentication, and data protection. PKI includes certificate authorities (CAs) that issue and revoke certificates, registration authorities (RAs) that verify identities, and certificate repositories. PKI enables secure email, SSL/TLS for web traffic, code signing, and digital signatures."
  },
  {
    id: "78822e9c-4e7a-400f-b1cd-40b001fb453f",
    contextSummary: "A public key is the openly shared half of an asymmetric key pair used in public key cryptography. The public key can be freely distributed and is used to encrypt data that only the corresponding private key can decrypt, or to verify digital signatures created with the private key. Public keys are embedded in digital certificates issued by certificate authorities to bind identities to key pairs."
  },
  {
    id: "40de614f-77d4-4e9e-ae27-8038768c6777",
    contextSummary: "A private key is the secret half of an asymmetric key pair that must be kept confidential and securely protected. The private key is used to decrypt data encrypted with the corresponding public key or to create digital signatures that can be verified with the public key. Compromise of a private key allows attackers to decrypt confidential communications or impersonate the key owner."
  },
  {
    id: "90e255c5-6427-4913-9c3d-26651dde1f50",
    contextSummary: "Key escrow is a process where cryptographic keys are stored with a trusted third party to enable key recovery in specific circumstances such as legal investigations, employee departure, or disaster recovery. While key escrow provides business continuity and legal compliance benefits, it introduces security risks if the escrow service is compromised. Organizations must balance the need for key recovery against the increased attack surface of centralized key storage."
  },
  {
    id: "57a5032d-bfd2-45dc-a70c-e6f2eee34d59",
    contextSummary: "Encryption is the process of transforming plaintext data into ciphertext using cryptographic algorithms and keys to protect confidentiality. Encryption can be applied at different levels (full-disk, partition, file, volume, database, record) and in different contexts (data at rest, data in transit). Understanding encryption types (symmetric, asymmetric), algorithms, key lengths, and key exchange mechanisms is essential for implementing effective data protection."
  },
  {
    id: "7d27f181-8dda-476b-8d17-6e7218e06aba",
    contextSummary: "Encryption level refers to the granularity at which encryption is applied to data, ranging from full-disk encryption protecting entire storage devices to record-level encryption protecting individual database entries. Each level offers different trade-offs between security, performance, and management complexity. Choosing the appropriate encryption level depends on data sensitivity, compliance requirements, performance constraints, and operational workflows."
  },
  {
    id: "14661de3-80db-46f7-b116-3bd3563e2adf",
    contextSummary: "Full-disk encryption (FDE) encrypts all data on a storage device including the operating system, applications, and user files, protecting against data theft if the device is lost or stolen. FDE typically uses hardware-based encryption (self-encrypting drives) or software-based encryption (BitLocker, FileVault) with keys protected by TPM or user passwords. FDE provides transparent protection with minimal performance impact but doesn't protect data when the system is running and unlocked."
  },
  {
    id: "53a617fe-3181-4f43-9365-0ec7d1515ccb",
    contextSummary: "Partition encryption encrypts specific disk partitions rather than the entire disk, allowing selective protection of sensitive data while leaving other partitions unencrypted. This approach offers flexibility for dual-boot systems, system recovery partitions, or separating sensitive data from less critical information. Partition encryption provides targeted protection with less overhead than full-disk encryption but requires careful configuration to avoid exposing sensitive data."
  },
  {
    id: "ac5a25cd-b432-4406-b811-fbfc5210609d",
    contextSummary: "File encryption encrypts individual files or folders rather than entire disks or partitions, providing granular protection for specific sensitive documents. Users can selectively encrypt confidential files while leaving other data unencrypted for easier sharing or access. File encryption offers flexibility and portability but requires users to consciously decide which files need protection, potentially leading to inconsistent security practices."
  },
  {
    id: "4ebfdd55-3cd4-4af6-9955-b577e59f48d5",
    contextSummary: "Volume encryption encrypts logical storage volumes that may span multiple physical disks or consist of portions of disks. Volume encryption is commonly used in network-attached storage (NAS), storage area networks (SAN), and virtualized environments. This approach protects data at the storage layer independently of the operating system, enabling encryption for multiple systems sharing storage infrastructure."
  },
  {
    id: "989c8ff1-847f-4199-977c-248d69075845",
    contextSummary: "Database encryption protects data stored in databases by encrypting entire databases, specific tables, columns, or cells. Database encryption can be implemented at the storage level (transparent data encryption encrypting database files), application level (encrypting data before storage), or column level (encrypting specific sensitive fields). This approach protects against database file theft, unauthorized administrator access, and compliance violations."
  },
  {
    id: "7b4b2f78-3631-4a1b-8b2e-711314572cba",
    contextSummary: "Record encryption encrypts individual database records or rows rather than entire tables or databases, providing the most granular level of database protection. This approach allows different records to be encrypted with different keys based on data sensitivity or ownership. Record-level encryption offers strong security and access control but introduces complexity in key management, query performance, and application integration."
  },
  {
    id: "d23540bd-faf6-43ef-840e-2d094be67ac4",
    contextSummary: "Transport/communication encryption (also called encryption in transit) protects data while it travels across networks using protocols like TLS/SSL, IPsec, SSH, and VPNs. This encryption prevents eavesdropping, man-in-the-middle attacks, and data interception on untrusted networks. Transport encryption is essential for protecting sensitive communications over the internet, wireless networks, and between distributed systems."
  },
  {
    id: "790766e1-004d-4463-8837-5ea1a9ac3845",
    contextSummary: "Asymmetric encryption (also called public key encryption) uses mathematically related key pairs where data encrypted with one key can only be decrypted with the other key. This enables secure key distribution, digital signatures, and authentication without requiring secure key exchange. Common asymmetric algorithms include RSA, ECC (elliptic curve cryptography), and Diffie-Hellman key exchange, though they are slower than symmetric encryption."
  },
  {
    id: "ddfcd5d1-db07-41a6-83f5-6085273349a5",
    contextSummary: "Symmetric encryption uses the same key for both encryption and decryption, making it faster and more efficient than asymmetric encryption but requiring secure key distribution. Common symmetric algorithms include AES (Advanced Encryption Standard), 3DES, and ChaCha20. Symmetric encryption is used for encrypting large amounts of data, disk encryption, and protecting data at rest after keys are securely exchanged using asymmetric methods."
  },
  {
    id: "c017c187-3617-4427-a6dd-71f15de9d48d",
    contextSummary: "Key exchange is the process of securely establishing symmetric encryption keys between communicating parties without transmitting the keys directly over insecure channels. Methods include Diffie-Hellman key exchange (generates shared secret through mathematical operations), RSA key exchange (encrypts symmetric keys with public keys), and ephemeral key exchange (generates temporary keys for forward secrecy). Secure key exchange prevents man-in-the-middle attacks and key interception."
  },
  {
    id: "0674e57e-a69c-4e31-afde-45c999e41d86",
    contextSummary: "Cryptographic algorithms are mathematical functions that transform plaintext into ciphertext (and vice versa) using encryption keys. Choosing appropriate algorithms involves considering security strength, performance, compatibility, and regulatory compliance. Modern recommended algorithms include AES for symmetric encryption, RSA and ECC for asymmetric encryption, and SHA-256/SHA-3 for hashing, while outdated algorithms like DES and MD5 should be avoided."
  },
  {
    id: "400afa48-cd4f-4596-ab59-c27841577d1f",
    contextSummary: "Key length is the size of the cryptographic key measured in bits, directly affecting the security strength and computational difficulty of breaking encryption. Longer keys provide stronger security but require more computational resources. Current recommendations include 128-256 bits for symmetric encryption (AES), 2048-4096 bits for RSA, and 256-384 bits for elliptic curve cryptography (ECC), with requirements evolving as computing power increases."
  },
  {
    id: "77dba368-3576-41ce-8766-3f760a103b3c",
    contextSummary: "Cryptographic tools are hardware and software solutions that implement encryption, key management, and cryptographic operations. These tools range from operating system features to dedicated hardware security modules. Understanding when and how to use tools like TPM, HSM, key management services, and cryptographic libraries is essential for implementing robust data protection while managing keys securely."
  },
  {
    id: "763bd4af-5c0d-44fa-8e55-b9c17838d8b8",
    contextSummary: "Trusted Platform Module (TPM) is a hardware chip that provides secure storage for cryptographic keys, platform measurements, and security credentials. TPM enables hardware-based encryption, secure boot verification, and protection against firmware attacks by storing keys in tamper-resistant hardware rather than software. TPMs are used for full-disk encryption (BitLocker), platform integrity verification, and hardware-rooted trust in secure computing."
  }
]

addContextSummaries(summaries)
