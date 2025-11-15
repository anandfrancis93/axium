/**
 * Context Summaries Batch 6 (Entities 301-400)
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch6 = [
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Centralized vs. decentralized",
    contextSummary: "Centralized architectures concentrate control, data, and processing in a single location or system, offering easier management and security oversight but creating single points of failure. Decentralized architectures distribute these functions across multiple nodes, improving resilience and scalability but introducing complexity in security enforcement and policy consistency. Organizations must balance centralized control benefits against decentralized resilience when designing security architecture."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Containerization",
    contextSummary: "Containerization packages applications with their dependencies into isolated containers that share the host operating system kernel, providing lightweight virtualization for consistent deployment across environments. Containers offer improved resource efficiency and faster deployment than traditional VMs but introduce security considerations including shared kernel vulnerabilities, container escape risks, and image supply chain security. Container security requires image scanning, runtime protection, orchestration security, and proper isolation controls."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Virtualization",
    contextSummary: "Virtualization creates multiple virtual machines (VMs) running on a single physical host through a hypervisor layer, enabling resource optimization, isolation, and flexibility. Security benefits include VM isolation, snapshot capabilities, and rapid provisioning, but risks include hypervisor vulnerabilities, VM escape attacks, and resource exhaustion. Proper virtualization security requires hypervisor hardening, VM segmentation, resource limits, and monitoring for anomalous inter-VM communication."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > IoT",
    contextSummary: "Internet of Things (IoT) devices are connected sensors, actuators, and smart devices that collect and exchange data, often with limited processing power and security capabilities. IoT security challenges include weak default credentials, lack of update mechanisms, insecure protocols, physical access risks, and massive attack surfaces. Securing IoT requires network segmentation, strong authentication, encrypted communication, regular firmware updates, and monitoring for anomalous device behavior."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Industrial control systems (ICS)",
    contextSummary: "Industrial Control Systems (ICS) are specialized computing systems that monitor and control industrial processes in manufacturing, energy, water treatment, and critical infrastructure. ICS security is challenging due to legacy systems, proprietary protocols, safety priorities over security, physical consequences of attacks, and limited ability to patch or restart systems. ICS security requires network segmentation, physical security, protocol analysis, safety system integrity, and specialized monitoring."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Supervisory control and data acquisition (SCADA)",
    contextSummary: "Supervisory Control and Data Acquisition (SCADA) systems are a type of ICS that provide centralized monitoring and control of geographically distributed infrastructure like power grids, pipelines, and water systems. SCADA systems often use legacy protocols designed without security considerations, have long lifespans making updates difficult, and control critical infrastructure making them high-value targets. SCADA security focuses on network isolation, protocol security, authentication, monitoring for unauthorized commands, and backup control systems."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Real-time operating system (RTOS)",
    contextSummary: "Real-Time Operating Systems (RTOS) are specialized operating systems designed to process data and events within strict time constraints, commonly used in embedded systems, medical devices, and industrial control. RTOS security is challenging due to minimal security features (prioritizing deterministic timing over protection), limited resources for security controls, and difficulty updating firmware. Security approaches include minimal attack surface, code signing, secure boot, and external protection through network segmentation."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Embedded systems",
    contextSummary: "Embedded systems are specialized computing devices integrated into larger products to perform dedicated functions, such as automotive controllers, medical devices, or smart appliances. Security challenges include resource constraints limiting security controls, long operational lifespans, difficulty updating firmware, physical access risks, and diverse attack surfaces. Embedded security requires secure design, hardware security features, code signing, secure boot, tamper detection, and physical security."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > High availability",
    contextSummary: "High availability (HA) is the design principle of ensuring systems remain operational and accessible with minimal downtime through redundancy, failover mechanisms, and fault tolerance. HA architectures use redundant components, load balancing, clustering, geographic distribution, and automated failover to eliminate single points of failure. Security considerations for HA include maintaining security consistency across redundant systems, protecting failover mechanisms, and ensuring backups don't become security weaknesses."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations",
    contextSummary: "Architecture considerations are the key factors that influence security architecture decisions including availability, resilience, cost, responsiveness, scalability, deployment ease, risk management, recovery capabilities, and patching. Each architecture model presents different trade-offs across these dimensions—cloud offers scalability but introduces shared responsibility, on-premises provides control but requires capital investment, containers enable rapid deployment but increase complexity. Effective security architecture balances these competing considerations based on organizational priorities and risk tolerance."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Availability",
    contextSummary: "Availability is the degree to which systems and data are accessible to authorized users when needed, often measured as uptime percentage (e.g., 99.99% or 'four nines'). Architecture choices significantly impact availability—cloud and distributed systems improve availability through redundancy, while centralized systems create single points of failure. Security must balance availability requirements with protection controls, as overly restrictive security can reduce availability while poor security can enable attacks that cause outages."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Resilience",
    contextSummary: "Resilience is the ability of systems to withstand, recover from, and adapt to adverse conditions including attacks, failures, and disasters while maintaining essential functions. Resilient architectures incorporate redundancy, diversity, graceful degradation, rapid recovery, and continuous monitoring to survive disruptions. Security resilience requires designing for failure, implementing defense in depth, maintaining recovery capabilities, and ensuring security controls themselves don't become single points of failure."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Cost",
    contextSummary: "Cost considerations in security architecture include capital expenses (hardware, licenses, infrastructure), operational expenses (cloud services, staffing, maintenance), and hidden costs (downtime, breaches, compliance violations). Cloud architectures shift from CapEx to OpEx, on-premises requires upfront investment, and hybrid approaches balance both. Security investments must demonstrate value through risk reduction, and cost-effective security often involves leveraging existing platforms, automating operations, and prioritizing controls based on risk."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Responsiveness",
    contextSummary: "Responsiveness is the speed at which systems respond to user requests, data queries, or security events, directly impacting user experience and operational effectiveness. Architecture choices affect responsiveness—edge computing and CDNs reduce latency, encryption and security scanning add processing time, and cloud distance can introduce network delays. Security architecture must balance protection with performance, using efficient controls, strategic placement, and caching to maintain responsiveness."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Scalability",
    contextSummary: "Scalability is the ability to increase or decrease system capacity to handle changing workloads by adding or removing resources. Cloud and containerized architectures offer elastic horizontal scalability (adding more instances), while traditional systems often rely on vertical scaling (more powerful hardware). Security controls must scale with workload, maintaining protection as systems grow without becoming bottlenecks, requiring automated security, distributed enforcement, and efficient architectures."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Ease of deployment",
    contextSummary: "Ease of deployment refers to how quickly and simply systems can be installed, configured, and made operational, influenced by automation, standardization, and architecture complexity. Cloud and containerized solutions offer rapid deployment through infrastructure as code and pre-configured images, while traditional infrastructure requires manual setup. Security can complicate deployment through hardening requirements, but automation, templates, and DevSecOps practices can integrate security into streamlined deployment processes."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Risk transference",
    contextSummary: "Risk transference is the process of shifting security and operational risks to third parties through contracts, insurance, or service agreements, most commonly seen when moving to cloud services. Cloud providers assume infrastructure security responsibility, managed security services transfer monitoring and response, and cyber insurance transfers financial risk. Organizations must understand shared responsibility models, ensure contractual obligations match risk requirements, and maintain controls over risks that cannot be transferred."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Ease of recovery",
    contextSummary: "Ease of recovery is the speed and simplicity with which systems can be restored to normal operations after failures, attacks, or disasters, determined by backup strategies, documentation, and recovery automation. Cloud and virtualized environments enable rapid recovery through snapshots and infrastructure as code, while complex architectures or poorly documented systems complicate recovery. Recovery planning requires tested procedures, accessible backups, clear documentation, and minimal dependencies to ensure rapid restoration."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Patch availability",
    contextSummary: "Patch availability refers to whether and how quickly security updates are released for systems, applications, and components to address discovered vulnerabilities. Cloud services typically provide automated patching, commercial software has regular update cycles, but legacy systems, embedded devices, and EOL products may have no patches available. Security architecture should favor actively maintained platforms, plan for regular patching, and implement compensating controls for systems that cannot be patched."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Inability to patch",
    contextSummary: "Inability to patch occurs when systems cannot receive security updates due to end-of-life status, operational constraints (ICS/SCADA requiring continuous operation), vendor limitations, or compatibility issues. Systems that cannot be patched require compensating controls including network segmentation, strict access control, monitoring for exploitation attempts, virtual patching through WAFs or IPSs, and migration planning. Organizations must track unpatchable systems and implement defense-in-depth to protect them."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Power",
    contextSummary: "Power considerations in security architecture include energy consumption, backup power requirements, cooling needs, and environmental impact, particularly relevant for data centers and edge deployments. Cloud architectures centralize power management and offer economies of scale, while on-premises requires UPS, generators, and redundant power distribution. Security systems themselves require power (security appliances, monitoring), and power failures can disable security controls, making power resilience essential for security architecture."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Considerations > Compute",
    contextSummary: "Compute considerations involve processing power requirements for running applications, security controls, encryption, and analytics workloads across the architecture. Security operations like encryption, threat detection, log analysis, and malware scanning are computationally intensive and can impact system performance. Architecture decisions must ensure adequate compute resources for both business workloads and security controls, using efficient algorithms, hardware acceleration (HSMs, GPUs), and distributed processing to maintain both security and performance."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure",
    contextSummary: "This objective covers practical application of security principles to enterprise infrastructure design and implementation including device placement, security zones, attack surface reduction, connectivity management, failure mode planning, and selection of appropriate security controls. Students learn to analyze infrastructure scenarios and apply layered security through strategic placement of firewalls, IDS/IPS, proxies, and other security devices. Understanding infrastructure security principles enables designing defensible networks that balance security with operational requirements."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations",
    contextSummary: "Infrastructure considerations are the key factors that guide secure network design including where to place security devices, how to segment networks into security zones, minimizing attack surface, managing connectivity, planning for failure scenarios, and selecting appropriate security appliances. Proper infrastructure security requires understanding network topology, traffic flows, trust boundaries, and how security controls interact. These considerations ensure security is integrated into infrastructure design rather than bolted on afterward."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Device placement",
    contextSummary: "Device placement is the strategic positioning of security devices (firewalls, IDS/IPS, proxies) within network architecture to enforce security policies, monitor traffic, and protect critical assets. Placement decisions consider trust boundaries, traffic flows, performance impact, and defense-in-depth principles—firewalls at perimeter and between zones, IDS/IPS where they can monitor critical traffic, proxies controlling outbound access. Poor placement can create security gaps, blind spots, or performance bottlenecks."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Security zones",
    contextSummary: "Security zones are network segments grouped by trust level, security requirements, or function, separated by security controls that enforce access policies between zones. Common zones include public DMZ (internet-facing services), internal networks (employee workstations), restricted zones (sensitive data), and management networks (infrastructure administration). Zone-based security uses firewalls and access controls to limit lateral movement, contain breaches, and enforce least privilege at the network level."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Attack surface",
    contextSummary: "Attack surface is the sum of all points where unauthorized users could attempt to enter, extract data, or cause damage to a system or network. Reducing attack surface involves minimizing exposed services, closing unnecessary ports, removing unused software, limiting network connectivity, and reducing the number of ways attackers can interact with systems. Smaller attack surfaces are easier to defend, monitor, and maintain, making attack surface reduction a fundamental security principle."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Connectivity",
    contextSummary: "Connectivity considerations involve managing how systems, networks, and users connect while balancing accessibility with security, including network paths, remote access, partner connections, and internet exposure. Secure connectivity requires encryption (VPN, TLS), authentication, authorization, monitoring, and appropriate network controls. Organizations must provide necessary connectivity for business operations while preventing unauthorized access and protecting data in transit."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Failure modes",
    contextSummary: "Failure modes describe how security devices and systems behave when they malfunction, lose power, or encounter errors, critical for maintaining security during adverse conditions. Understanding failure modes (fail-open vs. fail-closed) allows architects to balance security with availability based on device criticality and business requirements. Proper failure mode design ensures security is maintained during failures while avoiding total service outages from security device malfunctions."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Failure modes > Fail-open",
    contextSummary: "Fail-open (also called fail-to-allow) is a failure mode where security devices allow all traffic to pass when they malfunction, prioritizing availability over security. This mode is appropriate for non-critical security layers where service continuity is paramount and other controls provide protection. The risk is that failures disable security controls, potentially allowing attacks during outages, so fail-open should only be used where business impact of blocking traffic exceeds security risk."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Failure modes > Fail-closed",
    contextSummary: "Fail-closed (also called fail-to-block) is a failure mode where security devices block all traffic when they malfunction, prioritizing security over availability. This mode is appropriate for critical security controls protecting sensitive assets where allowing uncontrolled access is unacceptable. The risk is that failures cause service outages, so fail-closed devices should have high availability designs (redundancy, clustering) to minimize failure probability while maintaining security during malfunctions."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Device attribute",
    contextSummary: "Device attributes are characteristics that define how security devices interact with network traffic and systems, including whether they actively block traffic or passively monitor, and whether they're inline with traffic flow or receive copies for analysis. Understanding device attributes is essential for proper security architecture—active/inline devices can prevent attacks but create performance bottlenecks and failure points, while passive/monitoring devices provide visibility without impacting traffic flow. Selecting appropriate attributes balances security enforcement with operational requirements."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Device attribute > Active vs. passive",
    contextSummary: "Active security devices take action on traffic by blocking, modifying, or terminating connections based on security policies (firewalls, IPS, proxies), while passive devices only monitor and alert without affecting traffic flow (IDS, network monitors). Active devices provide enforcement and prevention but can impact performance and create single points of failure, while passive devices offer visibility and detection without disrupting operations. Security architecture typically uses both—active controls at critical boundaries, passive monitoring for comprehensive visibility."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Device attribute > Inline vs. tap/monitor",
    contextSummary: "Inline devices sit directly in the network path where all traffic passes through them, enabling blocking and enforcement but creating potential bottlenecks and failure points. Tap/monitor devices receive copies of network traffic through switch port mirroring (SPAN) or network taps without being in the direct path, providing visibility without affecting performance or availability. Inline placement is required for prevention controls (firewalls, IPS), while tap/monitor is suitable for detection and analysis (IDS, forensics)."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Network appliances",
    contextSummary: "Network appliances are dedicated hardware or virtual devices that provide specific security functions within the infrastructure including jump servers, proxies, intrusion detection/prevention systems, load balancers, and sensors. Appliances offer specialized performance, purpose-built security features, and simplified management compared to general-purpose servers. Proper security architecture strategically places appliances based on their functions, integrates them with monitoring and management systems, and maintains them through regular updates and configuration reviews."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Network appliances > Jump server",
    contextSummary: "A jump server (also called bastion host) is a hardened system that provides controlled access to devices in different security zones, typically used to administer servers in restricted networks from less trusted networks. Jump servers centralize and audit administrative access, enforce strong authentication, limit allowed protocols, and create a choke point for monitoring privileged activities. They reduce attack surface by eliminating direct connections to critical systems, but become high-value targets requiring extensive hardening and monitoring."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Network appliances > Proxy server",
    contextSummary: "A proxy server intermediates requests between clients and servers, acting on behalf of clients to retrieve resources while providing security controls, caching, and traffic inspection. Forward proxies control outbound internet access, enforcing acceptable use policies, scanning for malware, and hiding internal IP addresses. Reverse proxies protect web servers by handling external requests, providing SSL termination, load balancing, and web application firewall capabilities."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Network appliances > Intrusion prevention system (IPS)",
    contextSummary: "An Intrusion Prevention System (IPS) is an active security device that monitors network traffic for malicious activity and automatically blocks or drops detected threats in real-time. IPS devices sit inline with traffic flow, using signatures, anomaly detection, and protocol analysis to identify attacks like exploits, malware, and policy violations. IPS provides automated threat prevention but requires careful tuning to minimize false positives that could block legitimate traffic and must be designed with high availability to avoid becoming a single point of failure."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Network appliances > Intrusion detection system (IDS)",
    contextSummary: "An Intrusion Detection System (IDS) passively monitors network traffic or host activity to identify suspicious patterns, policy violations, and known attacks, generating alerts for security teams to investigate. Unlike IPS, IDS does not block traffic, making it suitable for monitoring without risk of disrupting operations. IDS deployments use network taps or span ports for visibility, detect both known signatures and anomalous behavior, and require skilled analysts to triage alerts and respond to detected threats."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Network appliances > Load balancer",
    contextSummary: "Load balancers distribute incoming network traffic across multiple servers to optimize resource utilization, maximize throughput, minimize response time, and avoid server overload. Beyond performance, load balancers provide security benefits including hiding internal server architecture, enabling zero-downtime maintenance, detecting and isolating failed servers, and implementing SSL/TLS termination to offload encryption processing. Load balancers support high availability by routing traffic away from failed systems and can provide basic DDoS protection through rate limiting and connection management."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Network appliances > Sensors",
    contextSummary: "Network sensors are monitoring devices placed throughout infrastructure to collect data about network traffic, system behavior, and security events for analysis and threat detection. Sensors may include IDS probes, netflow collectors, packet capture appliances, endpoint agents, and specialized detection systems. Effective sensor deployment requires strategic placement for comprehensive visibility, secure communication channels to management systems, and integration with SIEM platforms for correlation and alerting."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Port security",
    contextSummary: "Port security refers to controls that protect network switch ports from unauthorized device connections and attacks, preventing unauthorized devices from accessing the network and limiting what authorized devices can do. Port security techniques include MAC address filtering, limiting the number of devices per port, disabling unused ports, 802.1X authentication requiring credentials before network access, and monitoring for rogue devices. Effective port security combines authentication (802.1X), authorization (VLAN assignment), and accounting (connection logging)."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Port security > 802.1X",
    contextSummary: "802.1X is a network access control standard that requires devices to authenticate before gaining network access, using a three-party architecture with the supplicant (client), authenticator (switch), and authentication server (RADIUS). 802.1X prevents unauthorized devices from connecting to network ports, supports various authentication methods through EAP, enables dynamic VLAN assignment based on user/device identity, and provides accounting for network access. Implementation requires 802.1X-capable switches, RADIUS infrastructure, and client configuration."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Port security > Extensible Authentication Protocol (EAP)",
    contextSummary: "Extensible Authentication Protocol (EAP) is a flexible authentication framework used within 802.1X that supports multiple authentication methods including passwords, certificates, tokens, and biometrics. Common EAP types include EAP-TLS (certificate-based, most secure), PEAP (tunneled password authentication), and EAP-TTLS (flexible tunneled authentication). EAP choice depends on security requirements, infrastructure capabilities, and client support—certificate-based methods provide strongest security but require PKI infrastructure."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Firewall types",
    contextSummary: "Firewall types represent different generations and capabilities of firewalls, evolving from simple packet filters to sophisticated next-generation systems that combine multiple security functions. Modern firewall types include web application firewalls (WAF) protecting web applications, unified threat management (UTM) combining multiple security features, next-generation firewalls (NGFW) with application awareness and integrated threat intelligence, and Layer 4/Layer 7 capabilities. Selecting appropriate firewall types depends on what traffic requires protection, required features, performance needs, and architectural complexity."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Firewall types > Web application firewall (WAF)",
    contextSummary: "A Web Application Firewall (WAF) is a specialized firewall that protects web applications by inspecting HTTP/HTTPS traffic, detecting and blocking application-layer attacks like SQL injection, cross-site scripting (XSS), and authentication bypass. WAFs understand web protocols and application logic, using signature-based rules, behavioral analysis, and positive security models (allowing only known-good inputs). WAFs can be deployed as reverse proxies, cloud services, or embedded in application delivery controllers, providing protection that network firewalls cannot."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Firewall types > Unified threat management (UTM)",
    contextSummary: "Unified Threat Management (UTM) appliances combine multiple security functions into a single device including firewall, IPS, antivirus, web filtering, VPN, and anti-spam capabilities. UTM simplifies security management, reduces device count, and provides integrated threat protection, making it popular for small to medium businesses. Trade-offs include performance constraints when multiple features are enabled simultaneously, vendor lock-in, and single point of failure for all security functions requiring high availability designs."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Firewall types > Next-generation firewall (NGFW)",
    contextSummary: "Next-Generation Firewalls (NGFW) extend traditional firewall capabilities with application-level inspection, integrated intrusion prevention, user/device identity awareness, and threat intelligence integration. NGFWs can identify and control applications regardless of port or protocol, enforce policies based on user identity rather than just IP address, and automatically block traffic to known malicious destinations. NGFWs provide deeper visibility and more granular control than traditional firewalls but require more configuration effort and processing power."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Infrastructure considerations > Firewall types > Layer 4/Layer 7",
    contextSummary: "Layer 4 (Transport Layer) and Layer 7 (Application Layer) refer to the OSI model layers at which firewalls inspect and make decisions about network traffic. Layer 4 firewalls make decisions based on TCP/UDP port numbers, connection state, and basic header information, offering high performance with limited visibility. Layer 7 firewalls inspect application content, understanding protocols like HTTP, DNS, and SMTP to make decisions based on URLs, commands, or data patterns, providing deep visibility and control at the cost of performance."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access",
    contextSummary: "Secure communication and access technologies enable safe connectivity between remote users, branch offices, and cloud resources through encryption, authentication, and secure tunneling. Key technologies include VPNs for encrypted remote access, tunneling protocols like TLS and IPsec that protect data in transit, SD-WAN for secure optimized WAN connectivity, and SASE architectures that converge networking and security. Implementing secure communication requires selecting appropriate technologies based on use cases, performance requirements, and security needs."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access > Virtual private network (VPN)",
    contextSummary: "Virtual Private Networks (VPNs) create encrypted tunnels over untrusted networks (typically the internet) to provide secure remote access or site-to-site connectivity. VPNs protect data confidentiality and integrity through encryption, authenticate endpoints to prevent unauthorized access, and can hide network topology from external observers. VPN types include remote access VPNs (individual users connecting to corporate network), site-to-site VPNs (connecting offices), and client-to-client (mesh) VPNs."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access > Remote access",
    contextSummary: "Remote access enables users to connect to organizational networks and resources from external locations using technologies like VPNs, remote desktop protocols, and zero trust network access (ZTNA). Secure remote access requires strong authentication (MFA), encrypted connections, endpoint security validation, least privilege access, and monitoring for anomalous behavior. Organizations must balance security with user experience, providing necessary access while protecting against credential theft, malware, and unauthorized access."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access > Tunneling",
    contextSummary: "Tunneling encapsulates one network protocol within another, creating secure communication channels through untrusted networks by encrypting the inner protocol. Tunneling enables VPNs, secure site-to-site connections, and protocol traversal through firewalls. Common tunneling protocols include TLS (encrypting application protocols), IPsec (encrypting IP packets), SSH (encrypted terminal and port forwarding), and GRE (generic encapsulation). Tunneling provides confidentiality, integrity, and authentication for network communications."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access > Tunneling > Transport Layer Security (TLS)",
    contextSummary: "Transport Layer Security (TLS) is a cryptographic protocol that provides encryption, authentication, and integrity for communications over networks, most commonly used to secure HTTP (HTTPS) but also protecting email, VoIP, and other protocols. TLS uses asymmetric cryptography for key exchange and authentication (certificates), symmetric encryption for data confidentiality, and message authentication codes for integrity. TLS has largely replaced the outdated SSL protocol, with TLS 1.2 and 1.3 providing modern security while older versions should be disabled."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access > Tunneling > Internet protocol security (IPSec)",
    contextSummary: "Internet Protocol Security (IPsec) is a protocol suite that authenticates and encrypts IP packets to secure communications at the network layer, commonly used for site-to-site VPNs and some remote access VPNs. IPsec provides two modes—transport mode (encrypts only payload) and tunnel mode (encrypts entire packet including headers)—and uses Authentication Header (AH) for integrity and Encapsulating Security Payload (ESP) for encryption. IPsec requires complex configuration but provides strong security and operates transparently to applications."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access > Software-defined wide area network (SD-WAN)",
    contextSummary: "Software-Defined Wide Area Network (SD-WAN) is a virtualized approach to managing WAN connections that uses software to control connectivity, optimize traffic routing, and enforce security policies across multiple connection types (MPLS, internet, LTE). SD-WAN provides automated failover, application-aware routing, encryption, and centralized management, reducing costs by leveraging cheaper internet connections while maintaining security and performance. Security integration includes IPsec encryption, integrated firewalls, and secure web gateways."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Secure communication/access > Secure access service edge (SASE)",
    contextSummary: "Secure Access Service Edge (SASE) is a cloud-based architecture that converges network and security functions into a unified service delivered from the cloud edge, including SD-WAN, secure web gateway, cloud access security broker (CASB), firewall-as-a-service, and zero trust network access. SASE provides consistent security regardless of where users and applications are located, scales elastically, reduces latency by processing traffic at nearby edge locations, and simplifies management. SASE represents a shift from appliance-based security to cloud-delivered services."
  },
  {
    fullPath: "Security Architecture > Given a scenario, apply security principles to secure enterprise infrastructure > Selection of effective controls",
    contextSummary: "Selection of effective controls involves choosing the most appropriate security measures for a given scenario based on threat landscape, asset value, regulatory requirements, organizational risk tolerance, and operational constraints. Effective control selection requires understanding control types (preventive, detective, corrective), defense-in-depth layering, cost-benefit analysis, and how controls interact. Security professionals must evaluate multiple control options, considering their effectiveness against relevant threats, operational impact, and how they fit within the overall security architecture."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data",
    contextSummary: "This objective covers strategies and concepts for protecting data throughout its lifecycle including understanding data types and classifications, data states (at rest, in transit, in use), sovereignty and geolocation requirements, and methods to secure data through encryption, hashing, masking, tokenization, and other techniques. Data protection requires classifying data by sensitivity, applying appropriate controls based on classification, understanding regulatory requirements, and implementing defense-in-depth protection. Students learn to select appropriate data protection methods based on data sensitivity, usage patterns, and compliance requirements."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data types",
    contextSummary: "Data types are categories of information based on sensitivity, legal requirements, or business value including regulated data (subject to compliance requirements), trade secrets, intellectual property, legal information, financial information, and distinctions between human-readable and non-human-readable formats. Understanding data types is essential for applying appropriate protection—regulated data requires specific controls mandated by law, trade secrets need strict access control and confidentiality, financial data requires integrity and auditability. Data type classification drives protection strategies and control selection."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data types > Regulated",
    contextSummary: "Regulated data is information subject to legal or industry compliance requirements that mandate specific protection, handling, and breach notification procedures, such as HIPAA (healthcare), PCI DSS (payment cards), GDPR (EU personal data), and SOX (financial reporting). Regulated data requires documented controls, access restrictions, encryption, audit logging, and regular compliance assessments. Organizations must identify what regulated data they possess, understand applicable requirements, implement required controls, and maintain evidence of compliance through documentation and audits."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data types > Trade secret",
    contextSummary: "Trade secrets are confidential business information that provides competitive advantage, such as formulas, processes, customer lists, or strategic plans, protected through secrecy rather than patents. Trade secret protection requires strict access control (need-to-know basis), non-disclosure agreements, marking of confidential information, employee training, and monitoring for unauthorized disclosure. Unlike patents, trade secrets have no expiration but require continuous protection—once publicly disclosed, protection is lost, making prevention of theft and accidental disclosure critical."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data types > Intellectual property",
    contextSummary: "Intellectual property (IP) encompasses creations of the mind including inventions (patents), artistic works (copyrights), designs, symbols (trademarks), and trade secrets that have commercial value. IP protection requires technical controls (access restrictions, DRM, watermarking), legal protections (patents, copyrights, NDAs), and organizational policies (classification, handling procedures). Digital IP is particularly vulnerable to theft through cyber attacks, insider threats, and accidental disclosure, requiring encryption, monitoring, and data loss prevention."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data types > Legal information",
    contextSummary: "Legal information includes attorney-client communications, litigation materials, contracts, regulatory filings, and other legally significant documents that may be privileged or subject to discovery in legal proceedings. Legal information requires protection to maintain confidentiality, privilege, and evidentiary integrity, using access controls, encryption, legal holds (preventing deletion during litigation), and audit trails. Improper handling can waive legal privilege, expose sensitive strategy, or result in sanctions, making proper classification and protection essential."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data types > Financial information",
    contextSummary: "Financial information includes banking details, payment card data, account numbers, transaction records, and financial statements requiring protection for confidentiality, integrity, and regulatory compliance. Financial data protection involves encryption (especially for payment cards per PCI DSS), access controls, transaction logging, segregation of duties, and fraud detection. Compromise of financial data can result in fraud, identity theft, competitive disadvantage, and regulatory penalties, making it a high-priority target for attackers."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data types > Human-readable and non-human-readable",
    contextSummary: "Human-readable data is information in formats that people can directly understand (text documents, spreadsheets, emails), while non-human-readable data is encoded or structured for computer processing (encrypted data, binary files, database records, compiled code). This distinction matters for data protection—human-readable data is vulnerable to shoulder surfing, accidental disclosure, and insider theft, while non-human-readable data may require specialized tools for attacks but offers less value if stolen without keys or parsing tools. Protection strategies differ accordingly, with human-readable data often requiring screen privacy, print controls, and DLP, while non-human-readable data needs encryption key protection."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data classifications",
    contextSummary: "Data classifications are standardized labels that categorize information by sensitivity, value, and required protection level, such as public, internal, confidential, restricted, sensitive, private, and critical. Classification enables consistent protection by defining handling requirements for each level—public data requires minimal protection, confidential requires access controls and encryption, restricted requires strict need-to-know access. Effective classification requires clear definitions, user training, labeling systems, and automated enforcement through DLP and access controls."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data classifications > Sensitive",
    contextSummary: "Sensitive data is information that requires protection from unauthorized disclosure to prevent harm to individuals or the organization, such as personal information, employee records, or internal communications. Sensitive data requires access controls, encryption for storage and transmission, audit logging, and careful handling procedures. While less restrictive than confidential or restricted classifications, sensitive data still warrants significant protection—unauthorized disclosure could cause embarrassment, identity theft, or competitive disadvantage."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data classifications > Confidential",
    contextSummary: "Confidential data is highly sensitive information that would cause significant damage if disclosed, such as trade secrets, strategic plans, non-public financial data, or sensitive personal information. Confidential data requires strong access controls (need-to-know, role-based access), encryption at rest and in transit, DLP monitoring, strict handling procedures, and executive-level breach notification. Unauthorized disclosure could result in competitive harm, regulatory penalties, reputation damage, or legal liability."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data classifications > Public",
    contextSummary: "Public data is information approved for unrestricted disclosure with no confidentiality concerns, such as published marketing materials, public website content, press releases, and published research. While public data requires no confidentiality controls, it still needs integrity protection to prevent unauthorized modification and availability protection to ensure access. Organizations must have clear processes for designating data as public to prevent accidental disclosure of sensitive information through classification errors."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data classifications > Restricted",
    contextSummary: "Restricted data is the most sensitive classification, requiring the highest level of protection and limited to the smallest possible audience, such as executive communications, merger/acquisition plans, or extremely sensitive trade secrets. Restricted data requires strict need-to-know access, strong encryption, physical security for storage, monitoring of all access, no external sharing without executive approval, and immediate breach notification. This classification should be used sparingly for only the most critical information where unauthorized disclosure would cause severe organizational harm."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data classifications > Private",
    contextSummary: "Private data is personal information belonging to individuals that requires protection to prevent privacy violations, identity theft, or regulatory non-compliance, such as social security numbers, health records, or personal contact information. Private data protection is often mandated by privacy regulations (GDPR, CCPA, HIPAA) requiring consent, purpose limitation, access controls, encryption, breach notification, and individual rights (access, deletion, portability). Organizations must inventory private data, understand applicable regulations, implement required protections, and document processing activities."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Data classifications > Critical",
    contextSummary: "Critical data is information essential for organizational operations where loss or corruption would severely impact business continuity, such as production databases, configuration management data, or transaction records. Critical data requires high availability (redundancy, backups, disaster recovery), integrity protection (checksums, version control, access controls), and comprehensive monitoring. While critical emphasizes availability and integrity over confidentiality, this data often also requires confidentiality protection, making it subject to multiple overlapping classification levels and protection requirements."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > General data considerations",
    contextSummary: "General data considerations are overarching factors that influence data protection strategies including data states (at rest, in transit, in use), data sovereignty (legal jurisdiction over data), and geolocation (physical location of data storage and processing). Understanding these considerations is essential for comprehensive data protection—data requires different controls depending on its state, legal requirements vary by jurisdiction requiring sovereignty planning, and data location affects latency, regulations, and physical security. These considerations inform architecture decisions about where and how to store, process, and transmit data."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > General data considerations > Data states",
    contextSummary: "Data states refer to the three conditions in which data exists—at rest (stored on disk, tape, or other media), in transit (moving across networks), and in use (being actively processed in memory)—each requiring different protection approaches. Data at rest needs storage encryption and access controls, data in transit requires encrypted communication protocols (TLS, IPsec), and data in use is most vulnerable requiring memory encryption, secure enclaves, or trusted execution environments. Comprehensive data protection must address all three states, as attacks may target whichever state has the weakest protection."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > General data considerations > Data states > Data at rest",
    contextSummary: "Data at rest is information stored on persistent media such as hard drives, SSDs, databases, backup tapes, or cloud storage when not being actively used or transmitted. Protecting data at rest requires encryption (full-disk, file-level, or database encryption), access controls (file permissions, database privileges), physical security of storage media, and secure disposal when no longer needed. Data at rest is vulnerable to theft of physical media, unauthorized access by privileged users, and forensic recovery from improperly disposed devices."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > General data considerations > Data states > Data in transit",
    contextSummary: "Data in transit is information actively moving across networks including internal LANs, WANs, the internet, or wireless connections. Protecting data in transit requires encryption protocols (TLS, IPsec, SSH), secure network architecture, certificate validation to prevent man-in-the-middle attacks, and VPNs for untrusted networks. Data in transit is vulnerable to eavesdropping, packet capture, man-in-the-middle attacks, and session hijacking, making encryption essential for any sensitive data crossing networks."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > General data considerations > Data states > Data in use",
    contextSummary: "Data in use is information actively being processed, viewed, or modified by applications and users, residing in computer memory (RAM), CPU caches, or GPU memory. Data in use is most difficult to protect because it must be in unencrypted form for processing, making it vulnerable to memory dumps, cold boot attacks, malware memory scraping, and privileged user access. Protection approaches include memory encryption, secure enclaves (Intel SGX, AMD SEV), application-level encryption, access controls, and minimizing how long sensitive data remains in memory."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > General data considerations > Data sovereignty",
    contextSummary: "Data sovereignty is the concept that data is subject to the laws and regulations of the country or region where it is physically located, creating legal obligations for data protection, access, and privacy. Data sovereignty requires organizations to understand where data resides, what legal jurisdictions apply, requirements for cross-border data transfer, and potential government access rights. Cloud computing complicates sovereignty as data may be stored in multiple countries or move dynamically, requiring clear contracts, data residency controls, and understanding of cloud provider data locations."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > General data considerations > Geolocation",
    contextSummary: "Geolocation in data protection refers to the physical location of data storage and processing, affecting latency, disaster recovery, regulatory compliance, and legal jurisdiction. Geolocation decisions consider data sovereignty requirements (EU data must stay in EU for GDPR), performance (proximity to users reduces latency), disaster recovery (geographic diversity for business continuity), and legal risks (some jurisdictions have broad government access rights). Cloud services must provide transparency about data locations and allow customers to control or restrict where data is stored and processed."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data",
    contextSummary: "Methods to secure data are specific technical techniques and controls used to protect data confidentiality, integrity, and availability including geographic restrictions, encryption, hashing, masking, tokenization, obfuscation, segmentation, and permission restrictions. Effective data security uses multiple methods in combination (defense-in-depth), selecting techniques appropriate to the data's classification, state, and usage requirements. Understanding the strengths and limitations of each method enables security professionals to design comprehensive data protection strategies that balance security with operational needs."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Geographic restrictions",
    contextSummary: "Geographic restrictions limit where data can be stored, processed, or accessed based on physical location, implemented to meet data sovereignty requirements, reduce legal risk, or comply with export controls. Geographic restrictions can be enforced through data residency controls (storing data only in approved countries), geo-blocking (preventing access from certain locations), and data localization (processing data within specific jurisdictions). While geographic restrictions address legal and compliance needs, they can impact performance, disaster recovery, and operational flexibility."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Encryption",
    contextSummary: "Encryption protects data confidentiality by transforming plaintext into ciphertext using cryptographic algorithms and keys, making data unreadable without the decryption key. Data encryption can be applied at various levels (full-disk, file, database, field) and states (at rest, in transit, in use), using symmetric algorithms (AES) for performance or asymmetric algorithms (RSA, ECC) for key exchange. Effective encryption requires strong algorithms, adequate key lengths, secure key management, and understanding of when and where to encrypt data based on threats and requirements."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Hashing",
    contextSummary: "Hashing is a one-way cryptographic function that produces a fixed-size output (hash or digest) from variable-length input, used to verify data integrity and store passwords securely without encryption. Hashes are deterministic (same input always produces same output) but computationally infeasible to reverse, making them suitable for password storage, file integrity verification, and digital signatures. Secure hashing requires collision-resistant algorithms (SHA-256, SHA-3, bcrypt for passwords), salting to prevent rainbow table attacks, and appropriate iterations/work factors to slow brute-force attempts."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Masking",
    contextSummary: "Data masking (also called obfuscation or anonymization) replaces sensitive data with fictitious but realistic-looking values to protect confidentiality while maintaining data utility for testing, development, or analytics. Masking techniques include substitution (replacing real values with fake ones), shuffling (randomly reordering values within a column), or nulling (replacing with blank values), and can be static (permanent replacement) or dynamic (masked on-the-fly during access). Effective masking preserves data relationships and formats needed for testing while preventing identification of real individuals or exposure of actual values."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Tokenization",
    contextSummary: "Tokenization replaces sensitive data with non-sensitive substitutes called tokens that have no intrinsic value but map back to original data through a secure token vault, commonly used to protect payment card data and personal information. Unlike encryption, tokens are random values with no mathematical relationship to original data, preventing decryption without access to the token vault. Tokenization reduces compliance scope (systems storing only tokens don't need same controls as systems with actual sensitive data), but requires protecting the token vault and maintaining token-to-data mappings."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Obfuscation",
    contextSummary: "Obfuscation makes data or code difficult to understand by transforming it into a more complex or confusing form while maintaining functionality, used to protect intellectual property in software, hide sensitive data patterns, or make analysis more difficult. Code obfuscation techniques include renaming variables to meaningless names, adding dummy code, encrypting strings, and control flow alterations. While obfuscation provides some protection against casual analysis, it is not cryptographically strong—determined attackers with sufficient time and tools can often reverse obfuscation, so it should complement rather than replace strong security controls."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Segmentation",
    contextSummary: "Data segmentation divides data into separate partitions, databases, or networks based on classification, sensitivity, or business unit, limiting access and reducing blast radius of breaches. Segmentation enables targeted protection (applying stronger controls to sensitive segments), compliance scoping (isolating regulated data), and performance optimization. Implementation uses network segmentation (VLANs, firewalls), database partitioning, separate storage systems, or multi-tenancy controls, combined with access policies that restrict cross-segment access to authorized purposes."
  },
  {
    fullPath: "Security Architecture > Compare and contrast concepts and strategies to protect data > Methods to secure data > Permission restrictions",
    contextSummary: "Permission restrictions control who can access, modify, or delete data through access control mechanisms including file system permissions, database privileges, application-level authorization, and role-based access control. Effective permission management follows least privilege (granting minimum necessary access), separation of duties (preventing any individual from completing sensitive processes alone), and regular access reviews to remove unnecessary permissions. Permission restrictions should be granular (controlling access at appropriate levels), consistently enforced, logged for audit, and regularly validated to prevent privilege creep."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture",
    contextSummary: "This objective addresses designing security architectures that maintain operations during adverse events and recover quickly from failures, attacks, or disasters through resilience and recovery mechanisms. Resilience concepts include high availability through load balancing and clustering, diverse recovery sites (hot, cold, warm), geographic dispersion to survive regional disasters, platform diversity to prevent single points of failure, and multi-cloud strategies. Understanding resilience and recovery is critical because security is not just about prevention—systems must continue functioning during attacks and restore quickly when compromised."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > High availability",
    contextSummary: "High availability in security architecture ensures that systems, security controls, and data remain accessible during component failures, attacks, or maintenance through redundancy and fault tolerance. HA implementations include redundant security devices, active-active or active-passive clustering, load balancing across multiple systems, and geographic distribution. Security architecture must ensure that HA mechanisms themselves don't create vulnerabilities (synchronized security policies, consistent configurations, secure failover) and that availability doesn't compromise security through overly permissive fail-open configurations."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > High availability > Load balancing vs. clustering",
    contextSummary: "Load balancing distributes traffic across multiple servers to optimize performance and provide redundancy, while clustering combines multiple servers into a single logical system that provides failover if a node fails. Load balancing focuses on distributing work for performance and can handle partial failures gracefully, while clustering emphasizes availability with automatic failover to standby systems. Both approaches improve resilience—load balancers continue operating with reduced capacity if servers fail, clusters maintain full service through automated failover, and they're often used together for comprehensive high availability."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Site considerations",
    contextSummary: "Site considerations in disaster recovery planning address the type and location of backup facilities that can assume operations if the primary site becomes unavailable, categorized as hot (fully operational duplicate), warm (partially configured), or cold (empty facility) sites. Site selection balances cost (hot sites are expensive to maintain), recovery time objectives (hot sites enable fastest recovery), and geographic dispersion (sites must be far enough apart to survive regional disasters). Effective site planning also considers personnel availability, connectivity, security controls replication, and testing procedures."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Site considerations > Hot",
    contextSummary: "A hot site is a fully operational duplicate facility with current hardware, software, data replication, and connectivity that can assume production workloads immediately or within minutes of a disaster. Hot sites provide the fastest recovery (near-zero RTO) through real-time data replication, redundant infrastructure, and continuous readiness, but require significant investment in duplicate systems, software licenses, and maintenance. Hot sites are essential for mission-critical systems where even brief outages cause severe business impact, and require regular testing to ensure failover procedures work correctly."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Site considerations > Cold",
    contextSummary: "A cold site is a facility with physical space, power, cooling, and network connectivity but without pre-installed hardware, software, or current data, requiring days or weeks to become operational. Cold sites are the least expensive disaster recovery option, suitable for non-critical systems or organizations with longer acceptable recovery times. Recovery from cold sites requires procurement and installation of hardware, restoration of software and data from backups, network configuration, and testing before resuming operations."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Site considerations > Warm",
    contextSummary: "A warm site is partially configured with some hardware and software pre-installed but requires data restoration, configuration updates, and final setup before becoming operational, typically recovering within hours to days. Warm sites balance cost and recovery time, offering faster recovery than cold sites at lower expense than hot sites. Warm sites may have periodic data replication rather than real-time synchronization and require documented recovery procedures, regular testing, and trained personnel to complete activation within acceptable recovery time objectives."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Site considerations > Geographic dispersion",
    contextSummary: "Geographic dispersion places critical systems, data, and recovery sites in multiple physical locations separated by sufficient distance to survive regional disasters affecting one location, such as natural disasters, power outages, or localized attacks. Effective geographic dispersion considers threats spanning different ranges—separate buildings for localized incidents, different cities for regional disasters, different countries for national-level events. Geographic dispersion must balance separation distance (further improves resilience but increases latency and complexity) with practical considerations like connectivity, personnel access, and regulatory requirements."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Platform diversity",
    contextSummary: "Platform diversity uses different operating systems, hypervisors, hardware vendors, or cloud providers across critical systems to prevent single vulnerabilities or failures from affecting all systems simultaneously. Diversity protects against vendor-specific vulnerabilities, supply chain compromises, widespread attacks targeting specific platforms, and vendor outages. While diversity improves resilience, it increases complexity, management overhead, and staff training requirements, so it should be applied strategically to the most critical systems rather than uniformly."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Multi-cloud systems",
    contextSummary: "Multi-cloud systems distribute workloads and data across multiple cloud service providers (AWS, Azure, GCP) to prevent dependence on a single provider, improve negotiating power, and survive provider-specific outages or service degradations. Multi-cloud resilience benefits include avoiding vendor lock-in, meeting data residency requirements through provider selection, and maintaining operations if one provider experiences issues. Challenges include increased complexity in management, security policy enforcement across providers, data synchronization, identity federation, and cost optimization across different pricing models."
  },
  {
    fullPath: "Security Architecture > Explain the importance of resilience and recovery in security architecture > Continuity of operations",
    contextSummary: "Continuity of operations (COOP) ensures that essential functions continue during and after disruptions through planning, alternate facilities, distributed operations, and resilient architectures. COOP planning identifies mission-essential functions, defines recovery time and point objectives, establishes alternate operating locations, prepares recovery procedures, and conducts regular testing. Effective COOP integrates resilience into architecture design rather than treating it as an afterthought, ensuring systems can degrade gracefully, maintain critical functions under stress, and recover in prioritized order based on business needs."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch6)
}

export { batch6 }
