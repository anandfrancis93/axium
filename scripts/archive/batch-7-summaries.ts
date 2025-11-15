/**
 * Context Summaries Batch 7 (Entities 401-500)
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch7 = [
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Capacity planning",
    contextSummary: "Capacity planning ensures that adequate resources (people, technology, infrastructure) are available to maintain operations during normal conditions, peak demand, and disaster scenarios, preventing resource exhaustion from causing failures. Effective capacity planning considers current utilization, growth projections, disaster scenarios requiring failover, and seasonal or cyclical variations in demand. Under-provisioning leads to performance degradation and service outages, while over-provisioning wastes budget, so capacity planning must balance cost efficiency with resilience and availability requirements."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Capacity planning > People",
    contextSummary: "People capacity planning ensures sufficient skilled personnel are available to operate, monitor, maintain, and recover systems including security staff, system administrators, and support teams. Considerations include cross-training to prevent single points of failure, on-call rotations for 24/7 coverage, succession planning for key roles, and surge capacity for incident response or disaster recovery. Inadequate staffing leads to burnout, delayed security response, and inability to execute recovery procedures, making human resource planning critical to resilience."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Capacity planning > Technology",
    contextSummary: "Technology capacity planning ensures adequate computing resources (CPU, memory, storage, network bandwidth) to handle workloads during normal operations, peak demand, and failover scenarios. Planning includes headroom for growth, redundant systems for high availability, scalability mechanisms (auto-scaling, load balancing), and considering technology lifecycle and refresh schedules. Security technology like IDS/IPS, SIEM, and encryption can be resource-intensive, requiring capacity planning to prevent security controls from becoming performance bottlenecks."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Capacity planning > Infrastructure",
    contextSummary: "Infrastructure capacity planning addresses physical resources including data center space, power, cooling, network connectivity, and environmental controls necessary to support technology and operations. Infrastructure planning has long lead times (data center construction takes months to years), requires significant capital investment, and must account for future growth to avoid costly mid-term expansions. Resilience considerations include redundant power feeds, diverse network paths, adequate cooling for maximum heat loads, and geographic distribution for disaster recovery."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Testing",
    contextSummary: "Resilience and recovery testing validates that business continuity and disaster recovery plans work correctly through tabletop exercises, failover tests, simulations, and parallel processing exercises. Regular testing identifies gaps in procedures, outdated documentation, missing resources, and training needs before actual disasters occur. Testing should occur at scheduled intervals, after significant infrastructure changes, and with varying scenarios (site loss, cyber attack, key personnel unavailable) to build confidence in recovery capabilities and meet recovery time objectives."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Testing > Tabletop exercises",
    contextSummary: "Tabletop exercises are discussion-based sessions where team members walk through disaster scenarios and recovery procedures without actually executing them, identifying gaps, clarifying roles, and validating plans. These low-cost, low-risk exercises can be conducted frequently, test coordination across teams, and identify issues in communication, decision-making authority, and procedure completeness. Tabletop exercises prepare teams for actual events, but must be complemented with technical tests since discussing procedures differs from executing them under stress."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Testing > Fail over",
    contextSummary: "Failover testing involves actually switching operations from primary systems to backup systems to verify that failover mechanisms work correctly, recovery procedures are accurate, and backup systems have adequate capacity. Failover tests validate technical functionality (data replication, DNS updates, load balancer reconfiguration), operational procedures (staff can execute runbooks), and performance (backup systems handle production load). Testing should occur during maintenance windows, with backout plans ready, and should measure achieved recovery time against objectives."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Testing > Simulation",
    contextSummary: "Simulation exercises create realistic disaster scenarios in test environments that mirror production, allowing teams to practice response and recovery without risking actual operations. Simulations can test complex scenarios (ransomware attack plus infrastructure failure), involve multiple teams, and measure performance under stress. Effective simulations include realistic injects (evolving situation, incomplete information, time pressure), after-action reviews to capture lessons learned, and updates to plans based on simulation results."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Testing > Parallel processing",
    contextSummary: "Parallel processing tests run disaster recovery systems simultaneously with production to verify that recovered systems produce identical results and can handle actual workloads. This approach validates data integrity, application functionality, and system performance without risking production, though it requires additional resources to run both environments. Parallel processing provides highest confidence before cutover but may not be feasible for all systems due to cost, data consistency challenges, or systems that interact with external parties."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups",
    contextSummary: "Backups are copies of data and system configurations maintained to enable recovery from data loss, corruption, deletion, or disasters, implemented through onsite and offsite storage, appropriate frequency, encryption, snapshots, replication, and journaling. Effective backup strategy follows the 3-2-1 rule (three copies, two different media types, one offsite), tests restoration regularly, protects backups from same threats as primary data, and aligns backup retention with business and legal requirements. Backups must be secured against ransomware that targets backup systems to prevent recovery."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups > Onsite/offsite",
    contextSummary: "Onsite backups are stored locally (same building or data center) enabling fast restoration, while offsite backups are stored at geographically separated locations protecting against site-wide disasters. Best practices require both—onsite for quick recovery from individual failures, offsite for disaster recovery from facility loss. Offsite backup considerations include transfer time and bandwidth, secure transportation, physical security of storage location, and ensuring offsite location is far enough away to survive regional disasters affecting the primary site."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups > Frequency",
    contextSummary: "Backup frequency determines how often backups are created and directly impacts the recovery point objective (RPO)—the maximum acceptable data loss measured in time. Frequency ranges from continuous replication (near-zero RPO) to weekly backups (up to one week of data loss), chosen based on data change rate, criticality, and acceptable loss. Common strategies include full backups weekly, incremental or differential daily, plus transaction log backups hourly for databases, balancing protection against storage and bandwidth costs."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups > Encryption",
    contextSummary: "Backup encryption protects backup data confidentiality during storage and transmission, preventing data breaches from stolen backup media, compromised backup servers, or intercepted backup transfers. Encryption should use strong algorithms (AES-256), secure key management (keys stored separately from backups), and protect both backup data and backup metadata. Consider performance impact of encryption on backup windows, ensure encryption keys are backed up separately and available for restoration, and test encrypted backup restoration regularly."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups > Snapshots",
    contextSummary: "Snapshots are point-in-time copies of storage volumes, virtual machines, or databases that capture system state at a specific moment, enabling rapid rollback to known-good configurations. Snapshots are space-efficient (storing only changes from base), nearly instantaneous to create, and enable quick recovery, but are not true backups—they typically reside on the same storage system as primary data. Snapshots are useful for short-term protection (pre-change snapshots, hourly recovery points) but must be complemented with separate backups for disaster recovery."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups > Recovery",
    contextSummary: "Backup recovery is the process of restoring data and systems from backups, which must be regularly tested to ensure backups are valid, procedures are accurate, and recovery time objectives can be met. Recovery testing should include full restoration to verify complete backups, sample file restoration for quick validation, and restoration to alternate locations for disaster recovery scenarios. Common recovery failures include corrupted backups, missing dependencies, insufficient documentation, inadequate restoration bandwidth, or changed configurations making backups incompatible."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups > Replication",
    contextSummary: "Replication continuously or periodically copies data to secondary locations in near real-time, maintaining synchronized copies for high availability and disaster recovery with minimal data loss (low RPO). Replication can be synchronous (secondary updated before primary transaction completes, zero data loss but latency impact) or asynchronous (secondary updated after primary completes, potential data loss but better performance). Replication provides faster recovery than backups but doesn't protect against logical corruption (bad data replicates to all copies) requiring point-in-time backups for complete protection."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Backups > Journaling",
    contextSummary: "Journaling (also called transaction logging) records changes to data in a sequential log before or as they occur, enabling recovery to specific points in time and supporting very low recovery point objectives. Database journals can be replayed to restore transactions committed after the last full backup, and file system journals protect metadata integrity during crashes. Journaling supports granular recovery (restore to exact transaction), enables incremental backups (back up only journal since last backup), and provides audit trails, but requires secure storage and management of journal files."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Power",
    contextSummary: "Power resilience ensures continuous electrical supply to critical systems through redundant power sources, backup generators, uninterruptible power supplies (UPS), and diverse utility feeds. Power failures can disable security controls, corrupt data, and cause extended outages, making power protection essential for availability. Power resilience planning includes redundant power distribution units (PDUs), diverse utility feeds from separate substations, generators with adequate fuel supply, UPS systems to bridge generator startup, and monitoring of power quality and availability."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Power > Generators",
    contextSummary: "Backup generators provide electrical power during extended utility outages by converting fuel (diesel, natural gas, propane) to electricity, typically starting automatically when utility power fails. Generators enable continued operations during prolonged outages but have startup delay (typically 10-30 seconds) requiring UPS to bridge the gap, need fuel supply management and testing, and require maintenance to ensure reliability. Generator planning includes adequate capacity for critical loads, fuel storage duration (minimum 24-48 hours), automatic transfer switches, and regular testing under load."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Power > Uninterruptible power supply (UPS)",
    contextSummary: "Uninterruptible Power Supplies (UPS) provide immediate battery backup power to equipment during utility failures, power fluctuations, or while generators start, protecting against data loss and equipment damage from sudden power loss. UPS systems also condition power by filtering voltage spikes, sags, and noise that can damage sensitive electronics. UPS runtime is typically limited (minutes to hours depending on load and battery capacity), requiring generators for extended outages, regular battery testing and replacement, and proper sizing for protected equipment load."
  },
  {
    fullPath: "Security Operations",
    contextSummary: "Security Operations is a domain covering the practical, day-to-day activities of implementing and maintaining security controls including applying security techniques to computing resources, managing hardware/software/data assets, vulnerability management, monitoring and incident response, and digital forensics. This domain emphasizes hands-on skills for securing systems through baselines, hardening, patch management, secure configuration, and continuous monitoring. Security operations transforms security policies and architectures into operational reality through standardized processes, automation, and vigilant monitoring."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources",
    contextSummary: "This objective covers practical application of security techniques to protect computing resources including establishing secure baselines, hardening various systems (mobile, workstations, servers, network devices, cloud, IoT), securing wireless devices, implementing mobile device management, configuring wireless security, and applying application security practices. Students learn to analyze scenarios and apply appropriate security configurations based on device types, risk levels, and operational requirements. These techniques form the foundation of operational security, turning security principles into concrete configurations."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Secure baselines",
    contextSummary: "Secure baselines are standardized, documented configurations that define the minimum security settings for systems, establishing a known-good security posture that can be consistently deployed and maintained. Baselines address operating system settings, installed software, security controls, network configurations, and access policies. Effective baseline management includes establishing baselines based on vendor guidance and organizational requirements, deploying through automation, and maintaining through configuration management and compliance monitoring."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Secure baselines > Establish",
    contextSummary: "Establishing secure baselines involves defining standard security configurations based on vendor guidance (CIS benchmarks, STIG guides), regulatory requirements, organizational policies, and risk assessments. The establishment process documents settings for each system type, tests baselines in lab environments to ensure functionality, obtains stakeholder approval, and publishes baseline documents or configuration templates. Baseline establishment requires balancing security with functionality—overly restrictive baselines break applications, while weak baselines provide insufficient protection."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Secure baselines > Deploy",
    contextSummary: "Deploying secure baselines involves applying standardized configurations to systems through automation tools (Group Policy, configuration management platforms, infrastructure as code), imaging with pre-configured templates, or automated compliance enforcement. Deployment should be phased (pilot groups before broad rollout), validated through scanning and testing, and documented with tracking of which systems have which baseline versions. Automated deployment ensures consistency, reduces human error, and enables rapid provisioning of secure systems."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Secure baselines > Maintain",
    contextSummary: "Maintaining secure baselines involves continuously monitoring compliance, updating baselines to address new threats and technologies, remediating deviations (configuration drift), and managing exceptions. Maintenance activities include regular compliance scanning, automated remediation of drift, baseline updates for new vulnerabilities or requirements, and periodic reviews to retire obsolete settings. Without active maintenance, baselines become outdated and systems drift from secure configurations, creating vulnerabilities over time."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets",
    contextSummary: "Hardening targets are the various system types that require security hardening through configuration changes, service reduction, access controls, and protective measures including mobile devices, workstations, network devices (switches, routers), cloud infrastructure, servers, ICS/SCADA systems, embedded systems, RTOS, and IoT devices. Each target type has unique hardening requirements—mobile devices need MDM and encryption, network devices need SNMP security and access controls, IoT needs network segmentation and firmware updates. Understanding target-specific hardening ensures appropriate protections for each asset type."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > Mobile devices",
    contextSummary: "Mobile device hardening protects smartphones and tablets through MDM enrollment, strong authentication (passcodes, biometrics), encryption of data at rest, remote wipe capabilities, application controls, and security updates. Mobile-specific risks include loss/theft, malicious apps, insecure Wi-Fi, and BYOD management challenges requiring containerization, VPN enforcement, and jailbreak/root detection. Mobile hardening balances security with user experience, implements least privilege app permissions, and uses mobile threat defense for advanced protection."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > Workstations",
    contextSummary: "Workstation hardening secures employee computers through endpoint protection (antivirus, EDR), host-based firewalls, application allow listing, disabling unnecessary services, patch management, local admin restrictions, and full-disk encryption. Workstation security is critical because they're common attack entry points through phishing, malicious downloads, and social engineering. Hardening includes browser security (extension controls, safe browsing), USB device restrictions, screen locks, and secure boot to prevent tampering."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > Switches",
    contextSummary: "Network switch hardening protects switching infrastructure through port security (MAC filtering, 802.1X), disabling unused ports, VLAN segmentation, disabling unnecessary protocols (CDP, LLDP in untrusted areas), securing management interfaces, implementing spanning tree protection, and DHCP snooping. Switch security is critical because compromised switches enable traffic interception, VLAN hopping, and network reconnaissance. Hardening includes changing default credentials, restricting SNMP access, using secure management protocols (SSH vs. Telnet), and implementing private VLANs."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > Routers",
    contextSummary: "Router hardening secures routing devices through access control lists (ACLs), disabling unnecessary services (HTTP, CDP, finger), securing routing protocols (authentication for BGP, OSPF, EIGRP), implementing anti-spoofing filters, restricting management access, and logging. Router security is critical as routers direct traffic and define network boundaries. Hardening includes disabling IP directed broadcasts (prevent amplification attacks), implementing ingress/egress filtering, rate limiting, secure terminal access, and regular firmware updates."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > Cloud infrastructure",
    contextSummary: "Cloud infrastructure hardening secures virtualized environments through identity and access management (IAM), network security groups, encryption at rest and in transit, logging and monitoring, API security, and least privilege access. Cloud-specific hardening includes properly configuring storage buckets (prevent public exposure), securing serverless functions, implementing cloud security posture management (CSPM), enabling multi-factor authentication for privileged access, and using cloud-native security services. Cloud hardening addresses shared responsibility model—securing configurations and data in the cloud."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > Servers",
    contextSummary: "Server hardening protects critical infrastructure through minimal service installation, patch management, access controls, host-based firewalls, audit logging, file integrity monitoring, and application-specific security configurations. Server hardening follows principle of least functionality—removing or disabling unnecessary software, services, and protocols that increase attack surface. Security measures include separating application and database servers, implementing SELinux or AppArmor, restricting remote access, using secure protocols only, and regular security assessments."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > ICS/SCADA",
    contextSummary: "ICS/SCADA hardening protects industrial control systems through network segmentation (air gaps or DMZs isolating from IT networks), application allow listing, disabling unnecessary services, physical security, change control, and specialized monitoring. ICS environments face unique constraints—systems can't be easily patched or rebooted, availability is paramount (safety systems must function), and many devices run legacy protocols without security features. Hardening emphasizes defense-in-depth, compensating controls for unpatchable systems, and monitoring for anomalous behavior."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > Embedded systems",
    contextSummary: "Embedded system hardening secures purpose-built devices (ATMs, point-of-sale, medical devices, vehicle controllers) through firmware security, physical tamper protection, secure boot, minimal attack surface, network isolation, and strong authentication. Embedded systems often lack security features found in general-purpose computers, have limited update capabilities, and operate in physically accessible locations. Hardening approaches include code signing, disabling debug interfaces, encrypting sensitive data, input validation, and monitoring for tampering or anomalous behavior."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > RTOS",
    contextSummary: "Real-Time Operating System (RTOS) hardening protects time-critical systems through minimal configurations, certified secure RTOS versions for critical applications, memory protection, task isolation, secure inter-process communication, and deterministic security controls that don't affect timing. RTOS security challenges include limited resources for security features, prioritization of timing guarantees over security, and long operational lifespans. Hardening focuses on reducing attack surface, external protections (network segmentation), code review, and hardware security features."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Hardening targets > IoT devices",
    contextSummary: "IoT device hardening addresses security of connected sensors, smart devices, and controllers through changing default credentials, network segmentation (isolating from corporate networks), disabling unnecessary features, firmware updates, and monitoring for anomalous behavior. IoT presents unique challenges including vast numbers of devices, limited security capabilities, long operational lives, and diverse vendors with varying security commitments. Hardening emphasizes network-level controls since device-level hardening is often limited, using separate VLANs, firewall rules restricting device communication, and monitoring for compromised devices."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless devices",
    contextSummary: "Wireless device security encompasses proper installation planning through site surveys and heat maps to optimize placement, minimize interference, prevent dead zones, and avoid excessive signal spillage outside facility boundaries. Wireless security addresses unique risks from over-the-air communication including eavesdropping, unauthorized access, rogue access points, evil twin attacks, and denial of service. Proper wireless deployment considers RF propagation, facility construction materials, interference sources, capacity planning, and monitoring for rogue devices."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless devices > Installation considerations",
    contextSummary: "Wireless installation considerations address the planning and deployment of wireless access points including physical placement for coverage and security, RF survey results, interference avoidance, power levels to prevent excessive spillage, and antenna selection. Proper installation prevents security issues like signal extending beyond facility perimeter (enabling parking lot attacks), insufficient coverage creating dead zones where users might use rogue APs, and interference causing performance problems. Installation also considers physical security of access points and securing wired connections to prevent tampering."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless devices > Installation considerations > Site surveys",
    contextSummary: "Wireless site surveys systematically measure RF signal strength, interference, and coverage throughout a facility to optimize access point placement before deployment. Surveys identify sources of interference (microwave ovens, cordless phones, neighboring networks), materials that block signals (concrete, metal), optimal AP locations for coverage without excessive spillage, and capacity requirements based on expected client density. Professional surveys use specialized tools and produce documentation guiding AP placement, channel selection, and power settings for secure, reliable wireless coverage."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless devices > Installation considerations > Heat maps",
    contextSummary: "Wireless heat maps are visual representations showing RF signal strength throughout a facility using color coding (green for strong signal, red for weak), created during site surveys to identify coverage gaps, overlap zones, and signal spillage. Heat maps guide AP placement decisions, help visualize coverage before physical installation, identify areas needing additional APs, and document signal boundaries for security assessment. Post-installation validation surveys create heat maps verifying actual coverage matches design, and periodic surveys detect coverage degradation or changes requiring remediation."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions",
    contextSummary: "Mobile solutions encompass technologies and strategies for managing and securing mobile devices including Mobile Device Management (MDM) platforms, deployment models (BYOD, COPE, CYOD) defining ownership and control, and various connection methods (cellular, Wi-Fi, Bluetooth) each with security implications. Effective mobile solutions balance security requirements with user privacy and convenience, implement appropriate controls based on deployment model, and address risks from device loss, malware, data leakage, and unauthorized access. Mobile security has evolved from simple email access to comprehensive enterprise access requiring sophisticated management."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Mobile device management (MDM)",
    contextSummary: "Mobile Device Management (MDM) platforms centrally manage, monitor, and secure mobile devices through policy enforcement, remote configuration, application management, compliance monitoring, and remote wipe capabilities. MDM enforces security baselines (passcode requirements, encryption), distributes certificates and VPN profiles, manages application installation and updates, detects jailbroken/rooted devices, and enables remote location tracking and data wiping. Modern MDM integrates with enterprise mobility management (EMM) providing comprehensive mobile security, app distribution, and containerization of corporate data."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Deployment models",
    contextSummary: "Mobile deployment models define the ownership, control, and acceptable use of mobile devices including BYOD (employee-owned, personal use), COPE (company-owned, personal use allowed), and CYOD (company provides choice of approved devices). Each model has different security, privacy, support, and cost implications. BYOD maximizes employee preference but complicates security and privacy, COPE provides corporate control while allowing personal use, and CYOD balances choice with standardization. Model selection impacts MDM approach, application management, data separation, and device lifecycle management."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Deployment models > Bring your own device (BYOD)",
    contextSummary: "Bring Your Own Device (BYOD) allows employees to use personal mobile devices for work, reducing corporate costs and improving employee satisfaction but introducing security and privacy challenges. BYOD requires careful balance between corporate security needs and employee privacy expectations, typically using containerization to separate work and personal data, acceptable use policies defining requirements, and MDM with limited controls respecting privacy. Security challenges include unmanaged OS versions, personal apps potentially accessing corporate data, device loss/theft, and termination procedures ensuring corporate data removal without wiping personal data."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Deployment models > Corporate-owned, personally enabled (COPE)",
    contextSummary: "Corporate-Owned, Personally Enabled (COPE) provides company-purchased devices to employees with permission for personal use, giving organizations full control while maintaining employee satisfaction. COPE enables comprehensive MDM without privacy concerns, allows full-device encryption and remote wipe, simplifies support through standardized devices, and ensures timely security updates. Organizations must clearly define acceptable personal use, may monitor corporate data access but should respect personal privacy, and retain full control at employment termination including ability to completely wipe devices."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Deployment models > Choose your own device (CYOD)",
    contextSummary: "Choose Your Own Device (CYOD) allows employees to select from a list of company-approved and company-provided mobile devices, balancing employee choice with IT standardization and security. CYOD limits support complexity compared to BYOD (fewer device models), ensures all devices meet security requirements, enables full corporate control like COPE, and may offer cost savings through volume purchasing. Device choices are typically limited to models IT has tested, approved, and integrated with enterprise systems, with corporate ownership allowing comprehensive security controls and simplified decommissioning."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Connection methods",
    contextSummary: "Mobile connection methods describe how mobile devices access networks and resources including cellular (carrier data networks), Wi-Fi (wireless LANs), and Bluetooth (short-range personal area networks), each with different security characteristics, risks, and appropriate controls. Cellular provides encryption and carrier security but can be intercepted or spoofed, Wi-Fi requires WPA3 and VPN on untrusted networks, and Bluetooth needs pairing authentication and limited range. Mobile security policies should define acceptable connection types, require VPN for sensitive data, disable unused radios, and monitor for rogue connections."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Connection methods > Cellular",
    contextSummary: "Cellular connections use mobile carrier networks (4G LTE, 5G) to provide data connectivity, offering built-in encryption (though vulnerable to IMSI catchers/Stingrays), authentication through SIM cards, and availability in most locations. Security considerations include SIM card protection (PINs to prevent theft/cloning), awareness that carriers and government can intercept traffic, use of VPN for sensitive communications, and monitoring for fake cell towers. Cellular is generally more secure than public Wi-Fi but should not be considered fully secure for highly sensitive communications without additional encryption."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Connection methods > Wi-Fi",
    contextSummary: "Wi-Fi connections provide high-speed network access through wireless access points using IEEE 802.11 standards, requiring strong security (WPA3) on enterprise networks and VPN on public/untrusted networks. Wi-Fi security considerations include avoiding open networks, verifying network authenticity (prevent evil twin attacks), using certificate-based authentication (802.1X/EAP-TLS), disabling auto-connect to untrusted networks, and mandatory VPN for sensitive data. Mobile devices should be configured with separate profiles for corporate (secure, managed) and personal (VPN required) Wi-Fi usage."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Mobile solutions > Connection methods > Bluetooth",
    contextSummary: "Bluetooth provides short-range wireless connectivity for peripherals (headsets, keyboards, file transfers), requiring security controls including disabling when not needed, using pairing with PIN or better authentication, setting non-discoverable mode except during pairing, and monitoring for unauthorized pairings. Bluetooth risks include BlueBorne vulnerabilities exploiting Bluetooth stacks, bluesnarfing (unauthorized data access), bluejacking (spam messages), and car whisperer attacks on vehicle systems. Bluetooth versions 4.0+ provide improved security, but older devices and implementations may have vulnerabilities requiring careful configuration or disablement."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless security settings",
    contextSummary: "Wireless security settings configure protection for Wi-Fi networks through encryption protocols (WPA3), authentication systems (802.1X/RADIUS), cryptographic protocols (AES), and authentication methods (EAP variants), preventing unauthorized access and protecting confidentiality of wireless communications. Proper wireless security eliminates weak legacy protocols (WEP, WPA), implements strong authentication, uses adequate pre-shared key length and complexity, considers guest network isolation, and monitors for rogue access points. Wireless security is critical because radio signals extend beyond physical facility boundaries, making them accessible to nearby attackers."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless security settings > Wi-Fi Protected Access 3 (WPA3)",
    contextSummary: "Wi-Fi Protected Access 3 (WPA3) is the latest Wi-Fi security standard providing stronger encryption, protection against offline password guessing attacks through Simultaneous Authentication of Equals (SAE), forward secrecy preventing decryption of captured traffic even if password is later compromised, and simplified security for IoT devices through WPA3-Easy Connect. WPA3-Personal uses 128-bit encryption and SAE instead of pre-shared keys, while WPA3-Enterprise uses 192-bit security for high-security environments. WPA3 should be deployed where supported, with WPA2/WPA3 transition mode for legacy device compatibility."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless security settings > AAA/Remote Authentication Dial-In User Service (RADIUS)",
    contextSummary: "RADIUS (Remote Authentication Dial-In User Service) is a client/server protocol providing centralized Authentication, Authorization, and Accounting (AAA) for network access, commonly used with 802.1X for enterprise Wi-Fi authentication. RADIUS enables centralized credential management, supports various authentication methods (passwords, certificates, tokens), provides accounting logs for compliance, and integrates with directory services (Active Directory, LDAP). Secure RADIUS deployment requires strong shared secrets, encrypted transport (RadSec), certificate validation, and redundant RADIUS servers for high availability."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless security settings > Cryptographic protocols",
    contextSummary: "Wireless cryptographic protocols provide encryption for Wi-Fi communications with WPA3 using AES-GCMP-256, WPA2 using AES-CCMP, and deprecated protocols (TKIP with WPA, WEP) that should be disabled. Strong cryptographic protocols protect data confidentiality and integrity over wireless links, preventing eavesdropping and tampering. Configuration should disable weak protocols, use strongest available encryption, regularly update cryptographic implementations to address vulnerabilities, and ensure adequate key rotation intervals prevent cryptographic weaknesses from long-term key use."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Wireless security settings > Authentication protocols",
    contextSummary: "Wireless authentication protocols verify user and device identity before granting network access, with enterprise networks using 802.1X with EAP variants (EAP-TLS for certificate-based, PEAP-MSCHAPv2 for password-based, EAP-TTLS for flexibility). Authentication protocol selection balances security (certificates strongest), infrastructure requirements (PKI for certificates), and device support. Proper configuration includes mutual authentication (client verifies server), encrypted credential exchange, certificate validation, and disabling weak protocols (LEAP, EAP-MD5) vulnerable to dictionary attacks."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Application security",
    contextSummary: "Application security protects software through secure development practices including input validation (preventing injection attacks), secure cookies (preventing session hijacking), static code analysis (finding vulnerabilities before deployment), and code signing (ensuring code integrity and authenticity). Application security addresses software vulnerabilities that account for significant breach risk, requires integration into development lifecycle (DevSecOps), and combines preventive measures (secure coding) with detective measures (vulnerability scanning). Effective application security requires developer training, security testing, vulnerability remediation, and continuous monitoring."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Application security > Input validation",
    contextSummary: "Input validation verifies that user-supplied data meets expected format, type, length, and range requirements before processing, preventing injection attacks (SQL, command, LDAP), buffer overflows, cross-site scripting, and other input-based exploits. Effective input validation uses allow lists (accept only known-good inputs) rather than deny lists (block known-bad inputs), validates on server-side (client validation can be bypassed), sanitizes special characters, and rejects rather than corrects invalid input. Input validation should be applied to all external data sources including forms, APIs, file uploads, and URL parameters."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Application security > Secure cookies",
    contextSummary: "Secure cookies protect session tokens and authentication credentials through Secure flag (transmission only over HTTPS), HttpOnly flag (preventing JavaScript access to mitigate XSS), SameSite attribute (preventing CSRF attacks), appropriate expiration times, and encryption of sensitive cookie values. Insecure cookies enable session hijacking (stealing session tokens transmitted over HTTP), XSS attacks accessing cookies, and CSRF attacks using authenticated sessions. Cookie security requires understanding cookie attributes, implementing all applicable protections, using random session IDs, regenerating session IDs after authentication, and clearing cookies on logout."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Application security > Static code analysis",
    contextSummary: "Static code analysis (also called static application security testing or SAST) examines source code, bytecode, or binaries without executing programs to identify security vulnerabilities, coding errors, and policy violations. Static analysis finds issues like SQL injection, buffer overflows, hardcoded credentials, cryptographic weaknesses, and insecure configurations early in development when fixes are cheaper. Implementation integrates SAST tools into CI/CD pipelines, configures for acceptable false positive rates, prioritizes findings by severity and exploitability, and tracks remediation to ensure fixes are implemented."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Application security > Code signing",
    contextSummary: "Code signing uses digital signatures to verify software authenticity (confirming legitimate publisher) and integrity (detecting tampering since signing), preventing malware distribution through trusted software channels and unauthorized code modification. Code signing requires protecting private signing keys (HSMs, secure key management), validating certificates and signatures before code execution, revoking compromised certificates, timestamping signatures (remain valid after certificate expiration), and user awareness of signature verification. Operating systems and browsers verify signatures to warn users about unsigned or invalidly signed code."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Sandboxing",
    contextSummary: "Sandboxing isolates applications or processes in restricted environments with limited access to system resources, files, and networks, containing potential damage from vulnerabilities or malicious code. Sandboxes use virtualization, containers, or operating system controls to enforce isolation, preventing malware from accessing sensitive data, modifying system files, or spreading to other systems. Common uses include web browser sandboxing (isolate tab processes), email attachment viewing (open suspicious files safely), application testing (observe behavior without risk), and mobile apps (prevent unauthorized data access)."
  },
  {
    fullPath: "Security Operations > Given a scenario, apply common security techniques to computing resources > Monitoring",
    contextSummary: "Security monitoring continuously observes systems, networks, and applications to detect anomalies, policy violations, attacks, and operational issues through log collection, SIEM correlation, alerting, and analysis. Effective monitoring covers endpoints (EDR), networks (IDS/IPS), applications (WAF, RASP), cloud (CSPM), and user behavior (UEBA), providing visibility needed to detect and respond to threats. Monitoring requires defining baselines, tuning alerts to minimize false positives, establishing escalation procedures, and integrating with incident response workflows to ensure detected threats are promptly addressed."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management",
    contextSummary: "This objective addresses how managing assets throughout their lifecycle—from acquisition through disposal—impacts security through controlled procurement, accurate inventory, tracking of ownership and classification, monitoring asset status, and secure disposal. Poor asset management creates security risks through unknown or unmanaged devices on networks, inability to patch systems not in inventory, sensitive data on improperly disposed assets, and lack of accountability for security responsibilities. Effective asset management provides visibility into the attack surface, enables vulnerability and patch management, supports incident response, and ensures secure disposal prevents data breaches."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Acquisition/procurement process",
    contextSummary: "The acquisition and procurement process for hardware, software, and services should include security requirements, vendor risk assessment, license compliance verification, and approval workflows ensuring purchases meet security standards. Security procurement considers supply chain risks, evaluates vendor security practices, validates software authenticity, requires security features (encryption, logging, authentication), and ensures compatibility with existing security tools. Uncontrolled procurement can introduce rogue devices, unlicensed software, vulnerable systems, or supply chain compromises, making controlled acquisition essential for security."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Assignment/accounting",
    contextSummary: "Asset assignment and accounting tracks ownership (who is responsible for each asset), custody (who currently possesses it), classification (sensitivity level), and financial accounting, creating accountability for security. Proper assignment enables identifying responsible parties for security updates, investigating incidents involving specific assets, and enforcing acceptable use policies. Assignment tracking answers critical questions during incidents (who had access to this system, what data classification does it store, who should we contact about this asset), supports compliance auditing, and ensures assets are recovered at employment termination."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Assignment/accounting > Ownership",
    contextSummary: "Asset ownership designates individuals or teams responsible for security, maintenance, and compliance of specific assets, creating accountability for keeping systems patched, configured securely, and monitored. Ownership assignment prevents orphaned systems that don't receive security updates, clarifies who approves changes and access requests, identifies contacts during incidents, and defines budget responsibility for asset lifecycle costs. Clear ownership is essential for security—unowned assets become neglected, creating vulnerabilities from missing patches, misconfigurations, and lack of monitoring."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Assignment/accounting > Classification",
    contextSummary: "Asset classification labels hardware, software, and data by sensitivity, criticality, and required protection level, driving appropriate security controls for each asset. Classification considers data stored or processed (public, internal, confidential, restricted), business criticality (tier 1 requiring highest availability), regulatory requirements (systems processing regulated data), and security impact (Crown Jewels requiring strongest protection). Classification enables risk-based security investments, prioritizes patching and monitoring, defines backup and recovery requirements, and ensures assets receive protection commensurate with their value and risk."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Monitoring/asset tracking",
    contextSummary: "Asset monitoring and tracking maintains current inventory of all hardware, software, and data assets including location, configuration, patch status, ownership, and classification through automated discovery tools, CMDB systems, and regular audits. Accurate asset tracking enables vulnerability management (knowing what systems need patching), incident response (identifying affected assets), compliance reporting (demonstrating control over assets), and license management. Without tracking, organizations can't secure what they don't know exists, leading to unpatched systems, shadow IT, and compliance violations."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Monitoring/asset tracking > Inventory",
    contextSummary: "Asset inventory is a comprehensive, current list of all organizational assets including hardware (servers, workstations, network devices, mobile devices), software (applications, licenses, versions), and data (databases, file shares, repositories). Inventory management uses automated discovery (network scanning, agent-based reporting), configuration management databases (CMDB), and regular reconciliation to maintain accuracy. Inventory supports security operations by identifying what needs protection, enabling vulnerability scanning of all assets, preventing license violations, and detecting rogue or unauthorized assets."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Monitoring/asset tracking > Enumeration",
    contextSummary: "Asset enumeration is the process of actively discovering and cataloging assets through network scanning, agent deployment, API queries, or manual surveys to build comprehensive inventory. Enumeration discovers assets that may be unknown to IT (shadow IT, forgotten systems, unauthorized devices), identifies asset attributes (OS version, installed software, open ports, running services), and detects changes (new systems, configuration drift). Regular enumeration prevents security gaps from unknown assets, enables comparison against authorized asset lists, and identifies systems that may violate security policies."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Disposal/decommissioning",
    contextSummary: "Asset disposal and decommissioning is the secure process of removing assets from service and disposing of them through data sanitization, physical destruction, certification of disposal, and adherence to data retention policies. Improper disposal creates data breach risks from residual data on disposed media, environmental hazards from electronic waste, and compliance violations from premature destruction of regulated data. Secure disposal requires documented procedures, tracked chain of custody, verification of data removal, environmentally responsible recycling, and certificates of destruction for compliance evidence."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Disposal/decommissioning > Sanitization",
    contextSummary: "Data sanitization removes all data from storage media before disposal or reuse through overwriting (writing patterns multiple times), degaussing (magnetic field erasure for magnetic media), or cryptographic erasure (destroying encryption keys rendering encrypted data unreadable). Sanitization method selection depends on media type, data sensitivity, and whether media will be reused or destroyed—simple deletion and formatting are insufficient as data remains recoverable. Sanitization should follow standards (NIST SP 800-88), be verified after completion, and be documented for compliance and audit purposes."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Disposal/decommissioning > Destruction",
    contextSummary: "Physical destruction renders storage media completely unusable and data irrecoverable through shredding, pulverizing, incinerating, or disintegrating physical media. Destruction is required for highest sensitivity data where any risk of recovery is unacceptable, for media that cannot be sanitized (damaged media), and for compliance requirements mandating physical destruction. Destruction should be witnessed or performed by certified vendors, documented with certificates of destruction, and disposed of in environmentally responsible manner following e-waste regulations."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Disposal/decommissioning > Certification",
    contextSummary: "Disposal certification provides documented proof that assets were properly sanitized or destroyed, including certificates of destruction from disposal vendors, sanitization logs from wiping tools, witness statements, and asset disposal records. Certification supports compliance auditing (demonstrating proper data handling), legal defensibility (proving data was destroyed per retention policies), and accountability (tracking who performed disposal). Organizations should require certificates from disposal vendors, maintain disposal documentation according to retention policies, and verify vendor credentials and disposal processes."
  },
  {
    fullPath: "Security Operations > Explain the security implications of proper hardware, software, and data asset management > Disposal/decommissioning > Data retention",
    contextSummary: "Data retention policies define how long different data types must be kept before disposal based on legal requirements, regulatory compliance, business needs, and storage costs. Retention policies prevent premature deletion of data needed for legal, compliance, or business purposes, and mandate timely disposal of data no longer needed (reducing exposure and storage costs). Retention requirements vary by data type—financial records 7 years, email 90 days, backups 30 days—requiring classification-based retention schedules, automated enforcement, legal holds for litigation, and documented destruction after retention periods expire."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management",
    contextSummary: "This objective covers the continuous process of identifying, analyzing, remediating, and reporting on security vulnerabilities through vulnerability scanning, application security testing, threat intelligence feeds, penetration testing, responsible disclosure programs, system audits, and vulnerability prioritization. Vulnerability management is a lifecycle activity involving discovery of vulnerabilities through various methods, analysis to confirm validity and assess severity, prioritization based on risk, remediation through patching or compensating controls, and validation that fixes are effective. Effective vulnerability management reduces organizational attack surface and prevents exploitation of known weaknesses."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods",
    contextSummary: "Vulnerability identification methods are techniques for discovering security weaknesses including automated vulnerability scanning, application security testing (static and dynamic analysis), package monitoring for library vulnerabilities, threat intelligence feeds providing exploit information, penetration testing simulating attacks, responsible disclosure programs receiving external reports, and system/process audits. Comprehensive vulnerability identification uses multiple methods—scanners find network and system vulnerabilities, application testing finds code flaws, threat feeds identify emerging threats, and pen tests find complex issues scanners miss. Regular identification across all methods provides complete vulnerability visibility."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Vulnerability scan",
    contextSummary: "Vulnerability scanning uses automated tools to probe systems, networks, and applications for known vulnerabilities, misconfigurations, missing patches, and security weaknesses, producing reports of findings prioritized by severity. Scanners compare system configurations against vulnerability databases (CVE), check for missing patches, identify weak configurations, detect insecure services, and test for common vulnerabilities. Effective scanning requires authenticated scans (providing credentials for deeper inspection), regular scan schedules, comprehensive asset coverage, scanner updates for latest vulnerability signatures, and integration with patch management workflows."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Application security",
    contextSummary: "Application security testing identifies vulnerabilities in software through static analysis (examining code without execution), dynamic analysis (testing running applications), and package monitoring (tracking third-party library vulnerabilities). Application vulnerabilities like SQL injection, XSS, and insecure authentication are leading breach vectors requiring dedicated testing beyond infrastructure vulnerability scanning. Comprehensive application security uses multiple testing types throughout development lifecycle—static analysis during coding, dynamic analysis in QA, package monitoring continuously, and penetration testing before production."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Application security > Static analysis",
    contextSummary: "Static application security testing (SAST) analyzes source code, bytecode, or binaries without executing programs to identify coding errors, security vulnerabilities, and policy violations early in development. Static analysis finds issues like SQL injection, buffer overflows, hardcoded secrets, and insecure cryptography by examining code structure and data flow. Benefits include finding vulnerabilities before deployment, low false positive rates for many vulnerability types, and identification of exact vulnerable code locations, though static analysis cannot detect runtime issues or configuration vulnerabilities."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Application security > Dynamic analysis",
    contextSummary: "Dynamic application security testing (DAST) tests running applications by simulating attacks against exposed interfaces (web, API, mobile) to identify vulnerabilities exploitable from external perspectives. DAST finds runtime issues like authentication bypass, injection flaws, server misconfigurations, and session management weaknesses that static analysis cannot detect. DAST provides attacker's view of vulnerabilities, works with any technology stack (black box testing), but cannot identify specific vulnerable code lines or test functionality requiring authentication without configuration."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Application security > Package monitoring",
    contextSummary: "Package monitoring (also called software composition analysis or SCA) tracks third-party libraries, frameworks, and components used in applications to identify known vulnerabilities in dependencies. Modern applications use hundreds of external packages (npm, Maven, PyPI), each potentially containing vulnerabilities that affect applications using them. Package monitoring compares dependency versions against vulnerability databases (CVE, npm advisories), alerts on vulnerable dependencies, identifies license compliance issues, and recommends updates. Effective monitoring requires dependency scanning in CI/CD, automated alerts for new vulnerabilities, and processes for updating vulnerable dependencies."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Threat feed",
    contextSummary: "Threat intelligence feeds provide information about emerging threats, active exploits, malicious indicators (IPs, domains, file hashes), and vulnerability disclosures from various sources including open-source intelligence (OSINT), commercial threat intelligence providers, information-sharing organizations (ISACs), and dark web monitoring. Threat feeds enable proactive defense by alerting to new threats before they're widely exploited, providing indicators for detection rules, and prioritizing vulnerabilities based on active exploitation. Effective threat feed usage requires integration with security tools (SIEM, firewall, IDS), correlation with internal telemetry, and processes for acting on threat intelligence."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Threat feed > Open-source intelligence (OSINT)",
    contextSummary: "Open-Source Intelligence (OSINT) for vulnerability management involves gathering security information from publicly available sources including security researcher publications, vulnerability databases (CVE, NVD), vendor advisories, security mailing lists, social media, and public repositories. OSINT provides free threat intelligence, broad coverage of disclosed vulnerabilities, and early warning of emerging threats. Organizations should monitor OSINT sources relevant to their technology stack, correlate OSINT findings with asset inventory, and establish workflows for acting on OSINT vulnerability disclosures."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Threat feed > Proprietary/third-party",
    contextSummary: "Proprietary or third-party threat intelligence feeds are commercial services providing curated, analyzed, and validated threat information including vulnerability exploitation data, attacker tactics and techniques, malicious indicators, and contextual analysis. Paid feeds offer advantages over OSINT including earlier notification, lower false positives through validation, actionable context, and support. Feed selection should consider coverage of your threat landscape, integration capabilities with existing tools, update frequency, and cost-benefit analysis of commercial intelligence versus OSINT."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Threat feed > Information-sharing organization",
    contextSummary: "Information-sharing organizations like ISACs (Information Sharing and Analysis Centers), ISAOs (Information Sharing and Analysis Organizations), and sector-specific groups facilitate threat intelligence exchange among members in similar industries or regions. These organizations provide sector-specific threat intelligence, anonymized incident information, vulnerability notifications relevant to member technologies, and collaborative defense strategies. Participation requires contributing as well as consuming intelligence, trust relationships with peers, and processes for handling potentially sensitive shared information."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Threat feed > Dark web",
    contextSummary: "Dark web monitoring tracks hidden forums, marketplaces, and communication channels where threat actors trade exploits, stolen credentials, and vulnerabilities, providing early warning of planned attacks or data breaches. Dark web intelligence reveals vulnerabilities being weaponized, credential dumps containing organizational accounts, discussions of targeting specific organizations, and zero-day exploit sales. Dark web monitoring requires specialized access and tools, expertise in threat actor communication patterns, and processes for validating intelligence and responding to discoveries like credential exposure."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Penetration testing",
    contextSummary: "Penetration testing simulates real-world attacks to identify vulnerabilities, misconfigurations, and security weaknesses that automated tools miss, providing validated findings and demonstrating actual business impact. Penetration tests combine automated scanning with manual exploitation, testing chained vulnerabilities, social engineering, and complex attack scenarios that require human intelligence. Effective penetration testing includes scoping (defining targets and rules of engagement), skilled testers with knowledge of attacker techniques, documented findings with exploitation evidence, and remediation validation through retesting."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Responsible disclosure program",
    contextSummary: "Responsible disclosure programs (also called vulnerability disclosure programs or VDPs) provide channels for external security researchers to report vulnerabilities they discover, including submission processes, response time commitments, and sometimes rewards through bug bounty programs. These programs leverage global security community expertise to identify vulnerabilities before malicious actors do, with clear guidelines protecting researchers from legal action while reporting in good faith. Effective programs require defined scope, timely response to reports, secure communication channels, fix verification processes, and optional public acknowledgment of researchers."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > Responsible disclosure program > Bug bounty program",
    contextSummary: "Bug bounty programs incentivize external security researchers to find and responsibly report vulnerabilities by offering financial rewards based on severity, encouraging discovery of issues before malicious exploitation. Bounty programs expand security testing beyond internal resources, provide competitive researcher motivation, and typically pay only for valid findings. Successful programs require clear rules of engagement, defined scope, transparent payment criteria, rapid triage and response, fair reward amounts competitive with other programs, and processes for fixing reported issues quickly."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Identification methods > System/process audit",
    contextSummary: "System and process audits involve manual or semi-automated review of configurations, procedures, access controls, and security implementations to identify vulnerabilities, compliance gaps, and procedural weaknesses. Audits examine aspects automated tools don't test well including business process security, segregation of duties, audit logging adequacy, change management compliance, and whether security procedures are followed in practice. Effective audits combine technical testing with interviews, documentation review, and compliance validation, producing findings about both technical vulnerabilities and procedural gaps."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis",
    contextSummary: "Vulnerability analysis involves confirming discovered vulnerabilities are legitimate (not false positives), understanding their exploitability and impact, prioritizing based on risk using frameworks like CVSS, and classifying by type to guide remediation. Analysis transforms raw scanner output into actionable intelligence by filtering false positives, assessing whether vulnerabilities are actually exploitable in your environment, understanding business impact, and prioritizing limited remediation resources toward highest-risk issues. Effective analysis requires understanding your environment, threat landscape, compensating controls, and business context."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Confirmation",
    contextSummary: "Vulnerability confirmation validates that findings are genuine vulnerabilities (true positives) rather than false positives through manual verification, exploit validation, or configuration review. Confirmation prevents wasting effort on false positives that consume resources without reducing risk. Confirmation methods include manual testing of flagged vulnerabilities, reviewing configurations to verify weaknesses, checking for compensating controls that mitigate risk, and validating scanner findings against actual system state. Confirmed vulnerabilities proceed to prioritization and remediation while false positives are documented to tune scanner accuracy."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Confirmation > False positive",
    contextSummary: "False positives are scanner reports of vulnerabilities that don't actually exist, caused by scanner limitations, banner version detection without verifying actual vulnerability, or presence of compensating controls. Excessive false positives waste analyst time, reduce confidence in scanning results, and create alert fatigue. Reducing false positives requires authenticated scanning for accurate detection, scanner tuning based on environment, tracking false positives to improve detection, and manual validation of high-severity findings before dedicating remediation resources."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Confirmation > False negative",
    contextSummary: "False negatives are vulnerabilities that exist but scanners fail to detect, potentially due to scanner limitations, authenticated scan failures, obfuscated vulnerabilities, or zero-day exploits not in scanner databases. False negatives are dangerous because they create false sense of security. Reducing false negatives requires using multiple scanning tools with different approaches, combining automated scanning with manual testing and penetration testing, ensuring scanners have current vulnerability signatures, and conducting authenticated scans for complete visibility."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Prioritize",
    contextSummary: "Vulnerability prioritization ranks findings by risk to focus limited remediation resources on highest-impact issues, considering severity (CVSS scores), exploitability (active exploits available), asset criticality (business importance), exposure (internet-facing vs. internal), and threat intelligence (actively exploited). Prioritization prevents being overwhelmed by vulnerability volume (large environments have thousands), ensures critical issues are addressed first, and enables risk-based resource allocation. Effective prioritization uses frameworks (CVSS), threat context (exploit availability), and business impact to create remediation roadmaps addressing highest risks first."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Common Vulnerability Scoring System (CVSS)",
    contextSummary: "Common Vulnerability Scoring System (CVSS) is an industry standard framework that provides numerical severity scores (0-10) for vulnerabilities based on exploitability (attack vector, complexity, privileges required), impact (confidentiality, integrity, availability), and scope. CVSS helps prioritize vulnerabilities consistently, communicate severity to stakeholders, and make risk-based decisions. CVSS v3 includes Base Score (intrinsic vulnerability characteristics), Temporal Score (exploit availability, patch availability), and Environmental Score (organizational context). CVSS should inform but not solely determine prioritization—consider threat intelligence, asset criticality, and business context."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Common Vulnerability Enumeration (CVE)",
    contextSummary: "Common Vulnerabilities and Exposures (CVE) is a dictionary of publicly disclosed security vulnerabilities maintained by MITRE, assigning unique identifiers (CVE-YYYY-NNNNN) to enable consistent vulnerability references across tools, databases, and organizations. CVE provides standardized naming preventing confusion from multiple names for same vulnerability, enables correlation across security tools, and facilitates information sharing. CVE entries include identifier, brief description, and references, but don't include risk scores (see CVSS), patches (see vendor advisories), or detailed analysis. Organizations should track vulnerabilities by CVE ID for consistency across vulnerability management activities."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Vulnerability classification",
    contextSummary: "Vulnerability classification categorizes vulnerabilities by type (injection, authentication, misconfiguration, cryptographic), affected component (OS, application, network device), attack vector (network, local, physical), and other dimensions to guide remediation and understand vulnerability patterns. Classification enables pattern analysis (repeated misconfiguration types indicate training needs), guides remediation teams (network vulnerabilities to network team), supports metrics (tracking vulnerability types over time), and informs security improvements. Common classification schemes include OWASP Top 10 (web applications), CWE (Common Weakness Enumeration), and custom organizational taxonomies."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch7)
}

export { batch7 }
