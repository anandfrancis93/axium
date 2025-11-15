/**
 * Context Summaries Batch 8 (Entities 501-600)
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch8 = [
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Exposure factor",
    contextSummary: "Exposure factor is the percentage of asset value that would be lost if a vulnerability were exploited, used in quantitative risk analysis to calculate single loss expectancy (SLE = Asset Value × Exposure Factor). Exposure factor varies by vulnerability type—data breach might have 100% exposure factor for affected data, while DoS might have 0% (availability lost but asset value retained). Understanding exposure factor helps prioritize vulnerabilities based on potential financial impact rather than just technical severity."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Environmental variables",
    contextSummary: "Environmental variables in vulnerability analysis are organization-specific factors that modify vulnerability risk including existing compensating controls, network architecture (DMZ vs. internal), asset placement, security measures in place, and ability to exploit vulnerabilities in specific environments. A vulnerability with high CVSS score might have low actual risk due to environmental factors—SQL injection on internet-facing server is higher risk than on isolated internal database. CVSS Environmental Score adjusts base vulnerability scoring based on these organizational context factors."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Industry/organizational impact",
    contextSummary: "Industry and organizational impact considers how vulnerability exploitation would affect specific business operations, reputation, compliance, and competitive position, varying significantly across organizations and sectors. Healthcare organizations prioritize patient safety system vulnerabilities, financial institutions prioritize transaction system integrity, and retailers focus on payment card vulnerabilities. Impact analysis considers business disruption costs, regulatory penalties for compliance violations, reputation damage, competitive intelligence theft, and safety consequences to guide prioritization beyond technical severity."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Analysis > Risk tolerance",
    contextSummary: "Risk tolerance (also called risk appetite) is the amount of risk an organization is willing to accept, influencing vulnerability remediation priorities and timelines based on organizational culture, industry, and regulatory requirements. Risk-averse organizations remediate even low-severity vulnerabilities quickly, while others accept higher risk to avoid operational disruption or costs. Risk tolerance varies by asset type—production systems may have low tolerance requiring immediate patching, while development systems accept more risk with longer remediation windows."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Vulnerability response and remediation",
    contextSummary: "Vulnerability response and remediation addresses discovered vulnerabilities through patching (applying vendor fixes), risk transfer (cyber insurance), segmentation (isolating vulnerable systems), compensating controls (additional protections when patching isn't feasible), and documented exceptions for accepted risks. Remediation approach depends on vulnerability severity, asset criticality, patch availability, business impact of remediation, and organizational risk tolerance. Effective remediation tracks vulnerabilities through resolution, validates fixes, and maintains metrics on remediation timeliness."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Vulnerability response and remediation > Patching",
    contextSummary: "Patching applies vendor-provided updates to fix vulnerabilities, being the most direct and complete remediation approach when patches are available and can be safely deployed. Patch management includes testing patches in non-production environments, scheduling deployment windows, maintaining backout plans, prioritizing critical patches, and tracking patch status across assets. Challenges include patch availability lag, compatibility issues, operational constraints preventing downtime, and legacy systems that cannot be patched requiring compensating controls."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Vulnerability response and remediation > Insurance",
    contextSummary: "Cyber insurance transfers financial risk from security incidents by providing coverage for breach response costs, legal fees, regulatory fines, business interruption, and liability claims. Insurance doesn't prevent or remediate vulnerabilities but mitigates financial impact when exploited. Insurance considerations include coverage limits, deductibles, required security controls (MFA, EDR, backups), exclusions (ransomware payments may not be covered), and premium costs relative to risk, with insurers increasingly requiring vulnerability management evidence for coverage."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Vulnerability response and remediation > Segmentation",
    contextSummary: "Network segmentation isolates vulnerable systems in separate network zones with restricted connectivity, limiting attacker lateral movement and reducing blast radius when vulnerabilities are exploited. Segmentation is a compensating control for unpatchable systems (legacy ICS/SCADA, EOL systems), reducing risk by preventing network-based exploitation. Effective segmentation uses firewalls between segments, allows only necessary traffic, implements micro-segmentation for critical assets, and monitors inter-segment communications for anomalies."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Vulnerability response and remediation > Compensating controls",
    contextSummary: "Compensating controls are alternative security measures implemented when primary remediation (patching) is not feasible due to system constraints, business requirements, or vendor limitations, reducing risk without fixing the underlying vulnerability. Examples include WAF virtual patching for web vulnerabilities that can't be immediately fixed, network ACLs blocking vulnerable services, IPS signatures detecting exploitation attempts, and enhanced monitoring for vulnerable systems. Compensating controls require documentation, periodic review, and should be temporary until proper remediation is possible."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Vulnerability response and remediation > Exceptions and exemptions",
    contextSummary: "Vulnerability exceptions (also called risk acceptances) formally document decisions not to remediate specific vulnerabilities due to business constraints, low risk, or remediation cost exceeding risk. Exceptions require executive approval, time-limited periods (requiring review), documented justification, compensating controls, and tracking to prevent forgotten vulnerabilities. Exception processes prevent indefinite risk acceptance, ensure decision-makers understand risks, require periodic re-evaluation as threat landscape changes, and maintain audit trails of security decisions."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Validation of remediation",
    contextSummary: "Remediation validation confirms that vulnerability fixes were successfully applied and effective through rescanning, audits, and verification activities, ensuring vulnerabilities are actually resolved rather than just marked closed. Validation prevents false closure where patches failed to apply, configurations weren't properly changed, or fixes didn't address root causes. Effective validation includes automated rescanning after remediation, manual verification of complex fixes, and periodic audits of previously remediated vulnerabilities to detect recurrence."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Validation of remediation > Rescanning",
    contextSummary: "Vulnerability rescanning runs the same vulnerability scans that identified issues to verify they no longer appear, confirming that patches were applied, configurations changed, or services disabled as intended. Automated rescanning should occur shortly after remediation (verifying immediate fix) and periodically thereafter (detecting recurrence from configuration drift or system rebuilds). Rescanning provides objective evidence of remediation but may miss issues if scanners have false negatives or if fixes addressed symptoms rather than root causes."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Validation of remediation > Audit",
    contextSummary: "Remediation audits manually verify that fixes were properly implemented through configuration review, documentation inspection, and process validation, providing assurance beyond automated scanning. Audits validate complex remediations (architecture changes, process improvements), verify compensating controls are functioning, ensure exception approvals are current, and check that remediation documentation is accurate. Regular audits sample closed vulnerabilities to verify actual resolution, detect patterns of incomplete remediation, and improve remediation processes."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Validation of remediation > Verification",
    contextSummary: "Remediation verification confirms that fixes resolve vulnerabilities without breaking functionality or introducing new issues through testing and validation before closing vulnerability tickets. Verification includes confirming patches installed successfully, testing application functionality after patches, validating configuration changes achieved intended results, and ensuring compensating controls operate correctly. Incomplete verification can result in closed vulnerabilities that remain exploitable, broken applications from incompatible patches, or ineffective compensating controls creating false security confidence."
  },
  {
    fullPath: "Security Operations > Explain various activities associated with vulnerability management > Reporting",
    contextSummary: "Vulnerability management reporting communicates vulnerability status, trends, and risk to stakeholders through metrics, dashboards, and periodic reports enabling informed decisions and demonstrating program effectiveness. Reports should include vulnerability counts by severity, mean time to remediate, aging (time vulnerabilities remain open), top vulnerable assets, exception status, and trend analysis. Effective reporting tailors content to audience—executive reports focus on risk trends and program effectiveness, technical reports provide actionable details for remediation teams."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools",
    contextSummary: "This objective covers continuous security monitoring through systems, applications, and infrastructure monitoring, key monitoring activities (log aggregation, alerting, scanning, reporting, archiving, response), and tools (SCAP, SIEM, antivirus, DLP, SNMP, NetFlow, vulnerability scanners). Monitoring provides visibility into security events, detects attacks and policy violations, enables incident response, and demonstrates compliance. Students learn to select appropriate monitoring tools, configure alerting, respond to alerts, and tune monitoring systems to balance detection with false positive management."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Monitoring computing resources",
    contextSummary: "Monitoring computing resources involves observing systems (servers, workstations, devices), applications (software, services, transactions), and infrastructure (networks, cloud, facilities) to detect security events, performance issues, and anomalous behavior. Comprehensive monitoring coverage ensures visibility across the entire environment—endpoint monitoring detects malware, application monitoring identifies attacks and errors, network monitoring reveals suspicious traffic. Resource monitoring generates logs, metrics, and events that feed SIEM systems for correlation and alerting."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Monitoring computing resources > Systems",
    contextSummary: "System monitoring observes servers, workstations, mobile devices, and endpoints for security events including authentication attempts, privilege changes, process creation, file modifications, and resource utilization anomalies. System monitoring uses OS logs (Windows Event Logs, syslog), endpoint detection and response (EDR) agents, file integrity monitoring, and configuration compliance scanning. Effective system monitoring establishes baselines for normal behavior, alerts on deviations like unauthorized software installation or unusual admin activity, and integrates with SIEM for correlation."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Monitoring computing resources > Applications",
    contextSummary: "Application monitoring tracks software behavior including authentication, transactions, errors, performance metrics, and security events like injection attempts or access control violations. Application monitoring uses application logs, runtime application self-protection (RASP), API monitoring, database activity monitoring, and web application firewalls. Monitoring detects application attacks (SQLi, XSS, authentication bypass), identifies performance degradation indicating DoS, tracks data access for compliance, and provides debugging information for security incidents."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Monitoring computing resources > Infrastructure",
    contextSummary: "Infrastructure monitoring observes network devices, cloud resources, security appliances, and facility systems for security events, performance issues, and availability problems. Infrastructure monitoring includes network flow analysis (NetFlow), firewall logs, IDS/IPS alerts, cloud activity logs (CloudTrail, Azure Monitor), load balancer metrics, and environmental monitoring (HVAC, power). Comprehensive infrastructure monitoring provides visibility into traffic patterns, detects network-based attacks, identifies misconfigurations, and ensures security controls are functioning correctly."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities",
    contextSummary: "Security monitoring activities are the operational tasks performed to maintain visibility and detect threats including log aggregation (collecting logs centrally), alerting (notifying on security events), scanning (proactive vulnerability and compliance checks), reporting (communicating status and trends), archiving (long-term log retention), and alert response/remediation. These activities work together—scanning identifies issues, aggregation provides data, alerting notifies security teams, response remediates issues, and reporting demonstrates effectiveness. Effective monitoring requires all activities working in coordination."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Log aggregation",
    contextSummary: "Log aggregation collects logs from distributed systems, applications, and devices into centralized repositories for analysis, correlation, retention, and compliance. Aggregation uses agents on systems, syslog forwarding, API collection, or agentless polling to gather logs from diverse sources. Centralized logs enable correlation across systems (detecting multi-stage attacks), long-term retention for compliance and forensics, efficient searching and analysis, and protection of logs from tampering on compromised systems."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Alerting",
    contextSummary: "Security alerting generates notifications when monitoring detects events exceeding thresholds, matching threat signatures, or violating policies, enabling timely response to security incidents. Effective alerting balances sensitivity (detecting threats) with specificity (minimizing false positives), prioritizes alerts by severity, routes to appropriate teams, and includes context for investigation. Alert fatigue from excessive false positives causes analysts to ignore alerts, requiring continuous tuning, correlation to reduce noise, and automation to handle low-severity alerts."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Scanning",
    contextSummary: "Security scanning proactively identifies vulnerabilities, misconfigurations, and compliance violations through vulnerability scanners, configuration compliance tools, and security assessment platforms. Scanning complements passive monitoring—monitoring detects active attacks, scanning identifies weaknesses before exploitation. Scan scheduling balances thoroughness with performance impact, authenticated scans provide deeper visibility, and scan results should integrate with vulnerability management workflows for remediation tracking."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Reporting",
    contextSummary: "Security monitoring reporting communicates security posture, incidents, trends, and compliance status through dashboards, automated reports, and ad-hoc analysis for various stakeholders. Reports should be tailored to audience—executives need trend summaries and risk indicators, security teams need incident details and metrics, auditors need compliance evidence. Effective reporting includes key performance indicators (mean time to detect/respond), incident statistics, vulnerability trends, and compliance status with visualizations making data accessible."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Archiving",
    contextSummary: "Log archiving maintains long-term storage of security logs for compliance, forensic investigation, trend analysis, and legal requirements, often retaining data for months or years after operational relevance expires. Archiving requires secure storage protecting log integrity, efficient compression reducing storage costs, retention policies defining how long logs are kept, and retrieval processes enabling access when needed. Compliance regulations often mandate specific retention periods (HIPAA 6 years, PCI DSS 1 year), and archived logs must be protected from tampering and unauthorized access."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Alert response and remediation / validation",
    contextSummary: "Alert response and remediation involves investigating security alerts, validating whether they represent genuine threats, and taking corrective action including quarantining affected systems, tuning alerts to reduce false positives, and documenting response activities. Response includes alert triage (determining severity and validity), investigation (gathering context and evidence), containment (preventing spread), remediation (fixing root cause), and validation (confirming resolution). Systematic response processes with playbooks ensure consistent handling, reduce response time, and capture lessons learned."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Alert response and remediation / validation > Quarantine",
    contextSummary: "Quarantine isolates suspected compromised systems, files, or users from the network to prevent malware spread, lateral movement, or data exfiltration while investigation and remediation proceed. Quarantine may involve network isolation (VLAN changes, firewall rules), account suspension, file isolation by antivirus, or system disconnection. Quarantine decisions balance security (preventing damage) with business impact (user productivity), require clear authority and procedures, and should be followed by investigation to determine if quarantine was warranted and what remediation is needed."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Activities > Alert response and remediation / validation > Alert tuning",
    contextSummary: "Alert tuning adjusts detection rules, thresholds, and filters to improve alert quality by reducing false positives while maintaining detection of genuine threats, addressing alert fatigue and improving analyst efficiency. Tuning involves analyzing false positive patterns, refining detection logic, adding contextual filters (exclude known-good activities), adjusting sensitivity thresholds, and suppressing duplicate alerts. Effective tuning requires balancing false positive reduction against false negative risk—overly aggressive tuning can miss real threats, requiring careful validation and periodic review."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools",
    contextSummary: "Security monitoring tools provide capabilities for log collection, correlation, alerting, and analysis including SCAP for configuration compliance, benchmarks for secure configuration standards, agents or agentless monitoring, SIEM for event correlation, antivirus for malware detection, DLP for data protection, SNMP traps for device alerts, NetFlow for traffic analysis, and vulnerability scanners. Tool selection considers environment coverage, integration capabilities, scalability, cost, and required expertise. Effective security monitoring uses multiple integrated tools providing comprehensive visibility."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Security Content Automation Protocol (SCAP)",
    contextSummary: "Security Content Automation Protocol (SCAP) is a suite of standards enabling automated vulnerability detection, configuration compliance checking, and patch verification using standardized security content. SCAP includes CVE (vulnerability naming), CCE (configuration enumeration), CPE (platform naming), CVSS (severity scoring), XCCDF (compliance checklists), and OVAL (vulnerability definitions). SCAP-validated scanners use standardized content enabling consistent security assessment across different tools and organizations."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Benchmarks",
    contextSummary: "Security benchmarks are documented configuration standards defining secure settings for operating systems, applications, and devices, published by organizations like CIS (Center for Internet Security) and DISA (STIG guides). Benchmarks provide prescriptive hardening guidance based on security best practices, vendor recommendations, and community consensus. Compliance checking tools compare actual configurations against benchmarks, identifying deviations and misconfigurations. Organizations should select appropriate benchmark profiles (Level 1 for broad compatibility, Level 2 for higher security) based on environment requirements."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Agents/agentless",
    contextSummary: "Agent-based monitoring installs software on monitored systems to collect detailed information and perform actions, while agentless monitoring uses network protocols, APIs, or scanning without software installation. Agents provide deeper visibility (memory, processes, file system), enable real-time monitoring, allow response actions (quarantine, remediation), but require deployment and maintenance. Agentless reduces overhead and deployment complexity, works with unmanaged devices, but has limited visibility and may miss local events. Many environments use hybrid approaches—agents on managed systems, agentless for network devices and cloud resources."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Security information and event management (SIEM)",
    contextSummary: "Security Information and Event Management (SIEM) platforms aggregate logs from diverse sources, correlate events to detect complex attacks, provide centralized alerting and dashboards, and support compliance reporting and forensic investigation. SIEMs collect logs via agents, syslog, or APIs; normalize data into common formats; apply correlation rules detecting multi-stage attacks; alert on security events; and provide search and analysis capabilities. Effective SIEM requires quality log sources, tuned correlation rules, defined use cases, trained analysts, and integration with incident response workflows."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Antivirus",
    contextSummary: "Antivirus (AV) software detects and removes malware through signature-based detection (known malware patterns), heuristic analysis (suspicious behavior), and sandboxing (executing files in isolated environments to observe behavior). Modern AV has evolved to endpoint detection and response (EDR) providing behavioral monitoring, threat hunting, and incident response capabilities beyond traditional signature detection. Effective AV requires regular signature updates, integration with threat intelligence, centralized management, and layered with other controls since no AV detects 100% of malware."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Data loss prevention (DLP)",
    contextSummary: "Data Loss Prevention (DLP) tools monitor data in use, in transit, and at rest to detect and prevent unauthorized transmission, access, or storage of sensitive information through content inspection, contextual analysis, and policy enforcement. DLP identifies sensitive data (credit cards, SSNs, confidential documents) through pattern matching, keywords, or data fingerprinting; monitors endpoints, email, web traffic, and cloud storage; and enforces policies by blocking, alerting, or encrypting. DLP implementation requires classifying sensitive data, defining policies, tuning to reduce false positives, and user training to avoid circumvention."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Simple Network Management Protocol (SNMP) traps",
    contextSummary: "SNMP traps are unsolicited messages sent by network devices, servers, and appliances to monitoring systems when significant events occur (interface down, high CPU, security events), enabling real-time alerting for infrastructure issues. Traps complement periodic polling—polling discovers current state, traps provide immediate notification of changes. SNMP security has evolved from insecure SNMPv1/v2c (cleartext community strings) to SNMPv3 with encryption and authentication. Trap monitoring requires SNMP manager systems, trap-to-alert correlation, and security controls protecting SNMP traffic and management access."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > NetFlow",
    contextSummary: "NetFlow and similar protocols (sFlow, IPFIX) collect metadata about network traffic flows (source/destination IPs and ports, protocol, byte counts, timestamps) without capturing full packet contents, enabling traffic analysis, anomaly detection, and capacity planning. Flow data reveals communication patterns, identifies unexpected connections (command and control traffic), detects data exfiltration (unusual upload volumes), and supports forensic investigation. Flow collection has lower overhead than full packet capture, enables longer retention, but lacks application-layer details requiring packet capture for deep investigation."
  },
  {
    fullPath: "Security Operations > Explain security alerting and monitoring concepts and tools > Tools > Vulnerability scanners",
    contextSummary: "Vulnerability scanners automatically probe systems and applications for security weaknesses, missing patches, misconfigurations, and known vulnerabilities, providing prioritized reports of findings. Scanners use authenticated scans (with credentials for deeper inspection) or unauthenticated scans (external perspective), compare configurations against vulnerability databases, and identify exploitable weaknesses. Scanner effectiveness requires regular signature updates, comprehensive asset coverage, authenticated scanning where possible, integration with patch management, and processes for validating and remediating findings."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security",
    contextSummary: "This objective covers modifying and configuring existing security infrastructure to improve protection including firewall rules and access lists, IDS/IPS signatures and trending, web filters, operating system hardening, implementation of least privilege through access controls, endpoint protection, and email security. Rather than deploying new solutions, this focuses on optimizing and adapting existing security capabilities to address evolving threats, business changes, and security gaps. Students learn to analyze scenarios and determine appropriate configuration changes to enhance security posture."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Firewall",
    contextSummary: "Firewall modification involves updating rules and access control lists, managing allowed ports and protocols, and configuring screened subnets (DMZs) to control traffic flow and enforce security policies. Firewall changes require understanding traffic requirements, following change management, testing rules before deployment, and maintaining rule documentation. Common modifications include adding rules for new services, tightening overly permissive rules, removing obsolete rules that increase complexity, implementing geo-blocking, and adjusting DMZ configurations for new internet-facing services."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Firewall > Rules",
    contextSummary: "Firewall rules define which traffic is permitted or denied based on criteria like source/destination IP addresses, ports, protocols, and direction, processed in order from top to bottom with first match determining action. Rule management best practices include specific rules before general rules, explicit deny at the end, least privilege (allow only necessary traffic), regular rule reviews removing obsolete entries, documentation explaining business justification, and logging denied traffic for visibility. Poorly maintained rule sets become overly complex, contain contradictory or unused rules, and create security gaps or performance issues."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Firewall > Access lists",
    contextSummary: "Access Control Lists (ACLs) are ordered sets of permit/deny statements controlling traffic on routers and firewalls based on packet characteristics, functioning as packet filters for security and traffic management. ACLs can be standard (filtering by source IP only) or extended (filtering by source/destination IP, port, protocol, flags), applied inbound or outbound on interfaces. ACL best practices include planning before implementation, using named ACLs for clarity, documenting rules, placing specific rules first, and being aware of implicit deny at end of most ACLs."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Firewall > Ports/protocols",
    contextSummary: "Firewall port and protocol management controls which network services are accessible by permitting or blocking specific TCP/UDP ports and IP protocols, implementing least functionality principle. Common modifications include allowing only required ports (HTTP/443, HTTPS/443, SSH/22, specific application ports), blocking risky protocols (Telnet/23, FTP/21, SMB/445 from internet), and closing unused ports reducing attack surface. Port management requires understanding application requirements, using standard ports when possible, documenting non-standard port assignments, and reviewing allowed ports periodically to remove unnecessary access."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Firewall > Screened subnets",
    contextSummary: "Screened subnets (formerly called DMZ or demilitarized zones) are network segments isolated between firewalls where internet-facing services are placed, protecting internal networks from direct internet exposure. Screened subnet architecture uses two firewalls—perimeter firewall between internet and DMZ allowing only service-specific traffic, internal firewall between DMZ and internal network with strict rules. Modifications include adding services to DMZ, adjusting firewall rules for new requirements, implementing additional DMZ segments for different security zones, and ensuring DMZ servers cannot initiate connections to internal networks."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > IDS/IPS",
    contextSummary: "IDS/IPS modification enhances intrusion detection and prevention through signature updates, trend analysis identifying attack patterns, tuning to reduce false positives, and adjusting blocking policies. Modifications address new threats (adding signatures), improve accuracy (tuning thresholds), and optimize performance (disabling unnecessary signatures). Effective IDS/IPS management requires regular signature updates, analyzing trends to detect campaigns, balancing detection sensitivity with false positive rates, and maintaining exception lists for known-good traffic that triggers signatures."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > IDS/IPS > Trends",
    contextSummary: "IDS/IPS trend analysis examines patterns in detected attacks, blocked traffic, and security events over time to identify coordinated attack campaigns, emerging threats, and systemic security issues. Trend analysis reveals reconnaissance activities (port scanning trends), targeted attacks (repeated attempts against specific systems), worm propagation (similar attacks from many sources), and policy violations (inappropriate network usage). Analyzing trends enables proactive defense through new signatures for detected attack patterns, blocking source IPs of persistent attackers, and addressing systemic vulnerabilities that attackers repeatedly target."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > IDS/IPS > Signatures",
    contextSummary: "IDS/IPS signatures are patterns or rules that identify specific attacks, exploits, or malicious traffic through packet content, protocol anomalies, or behavioral patterns. Signature management includes regular updates for new vulnerabilities and exploits, enabling/disabling signatures based on environment relevance, creating custom signatures for organization-specific threats, and tuning signatures to reduce false positives. Signature-based detection is effective against known attacks but cannot detect zero-days or novel attacks, requiring complementary anomaly-based detection and behavioral analysis."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter",
    contextSummary: "Web filtering controls which websites and content categories users can access through URL filtering, content categorization, reputation scoring, and malware scanning, preventing access to malicious or inappropriate sites. Web filter modifications include updating category restrictions, adding allowed/blocked URLs, adjusting filtering policies by user/group, and enabling SSL inspection for encrypted traffic. Web filters are deployed as agent-based (software on endpoints), centralized proxies (network chokepoint), or cloud-based (filtering regardless of location), with implementation affecting management, bypassing difficulty, and remote user coverage."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter > Agent-based",
    contextSummary: "Agent-based web filtering installs software on devices that enforces web access policies locally, providing protection even when devices are off the corporate network and preventing bypass through network configuration changes. Agent-based filtering enables consistent policy enforcement for remote workers, applies user-specific policies based on login, continues working if network connectivity is lost, and prevents bypassing by changing DNS or using VPNs. Challenges include agent deployment and updates, performance impact on devices, and users potentially tampering with agents if they have administrative rights."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter > Centralized proxy",
    contextSummary: "Centralized proxy-based web filtering forces all HTTP/HTTPS traffic through proxy servers that inspect, filter, and log requests before forwarding to destinations, providing central policy enforcement and visibility. Proxy filtering offers comprehensive logging for compliance and forensics, SSL inspection capabilities, caching for performance, and central management. Limitations include requiring on-network connectivity (remote users need VPN), potential performance bottlenecks at proxy, ability to bypass by using non-standard ports or protocols, and configuration requirements forcing traffic through proxy."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter > URL scanning",
    contextSummary: "URL scanning examines requested web addresses against databases of known malicious sites, phishing domains, malware distribution points, and categorized content to block access before pages load. URL scanning uses real-time reputation lookups, categorization databases (adult content, gambling, weapons), and threat intelligence feeds identifying newly identified malicious sites. Effective URL scanning requires frequent database updates, multiple reputation sources to minimize false negatives, SSL inspection to examine encrypted traffic, and allowing legitimate miscategorized sites through exception processes."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter > Content categorization",
    contextSummary: "Content categorization classifies websites into categories (social media, gaming, news, adult content, gambling, weapons, malware) enabling policy-based filtering allowing or blocking entire categories rather than individual URLs. Category-based filtering provides scalable control (blocking millions of gambling sites by blocking category), policy flexibility (different rules for different user groups), and adaptation to new sites (automatically categorized). Categorization challenges include miscategorized sites requiring exceptions, sites with mixed content, and rapidly changing site purposes requiring recategorization."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter > Block rules",
    contextSummary: "Web filter block rules explicitly deny access to specific URLs, domains, IP addresses, or content patterns that pose security risks or violate acceptable use policies. Block rules complement category filtering by addressing specific threats (blocking C2 domains from threat intelligence), policy violations (blocking competitors or time-wasting sites), or miscategorized sites. Block rule management requires threat intelligence integration, regular review and cleanup of obsolete rules, documentation of business justification, and careful testing to avoid blocking required sites."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter > Reputation",
    contextSummary: "URL reputation scoring uses threat intelligence and analysis of website characteristics (domain age, hosting location, known associations) to assess trustworthiness and likelihood of malicious content. Reputation-based filtering blocks or warns about newly registered domains (often used for phishing), sites hosted in certain countries, domains associated with malware campaigns, and sites with suspicious characteristics. Reputation complements category and signature filtering by identifying threats before they're explicitly categorized or signatures created, but may have higher false positive rates requiring review."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Operating system security",
    contextSummary: "Operating system security modifications harden OS configurations through Group Policy (Windows domain settings), SELinux/AppArmor (Linux mandatory access control), application allow lists (permitting only approved software), and secure configurations based on benchmarks and best practices. OS security enhancements address default configurations that prioritize convenience over security, implement defense-in-depth at the system level, enforce organizational policies consistently, and reduce attack surface by disabling unnecessary features. Effective OS security requires understanding platform capabilities, balancing security with usability, and testing changes before broad deployment."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Operating system security > Group Policy",
    contextSummary: "Group Policy is a Windows feature enabling centralized configuration management of domain-joined systems, enforcing security settings, application restrictions, and user/computer policies from Active Directory. Group Policy manages password policies, account lockout, audit logging, user rights assignment, security options, software installation, firewall rules, and application settings. Security improvements through Group Policy include enforcing screen locks, disabling removable media, restricting administrative tools, configuring Windows Defender, deploying security baselines, and ensuring consistent security across all domain systems."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Operating system security > SELinux/AppArmor",
    contextSummary: "SELinux (Security-Enhanced Linux) and AppArmor are Linux mandatory access control (MAC) frameworks that restrict program capabilities beyond traditional file permissions, confining applications and daemons to defined security policies. MAC prevents compromised applications from accessing unauthorized files or performing privileged operations even if running as root. SELinux uses complex policy files defining allowed actions, while AppArmor uses simpler path-based profiles. Enabling and configuring MAC enhances Linux security but requires understanding policies, troubleshooting policy violations, and maintaining policies as systems change."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Implementation of secure protocols",
    contextSummary: "Implementing secure protocols replaces insecure legacy protocols with encrypted, authenticated alternatives including HTTPS instead of HTTP, SSH instead of Telnet, SFTP/SCP instead of FTP, LDAPS instead of LDAP, and SNMPv3 instead of SNMPv1/v2c. Protocol upgrades protect confidentiality (encryption), integrity (tamper detection), and authentication (verifying endpoints). Implementation requires updating systems and applications to support secure protocols, configuring certificates, disabling insecure protocols, and updating client configurations to use secure alternatives."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Implementation of secure protocols > Protocol selection",
    contextSummary: "Protocol selection chooses appropriate secure communication protocols based on use case requirements, compatibility constraints, and security needs. Selection criteria include encryption strength (algorithms and key lengths), authentication methods (passwords, certificates, tokens), compliance requirements (FIPS 140-2, PCI DSS), performance impact, client support, and management overhead. Best practices favor TLS 1.2+ for web traffic, SSH for remote administration, IPsec or WireGuard for VPNs, and protocols supporting forward secrecy preventing decryption of past traffic if keys are compromised."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Implementation of secure protocols > Port selection",
    contextSummary: "Secure protocol port selection uses standard well-known ports for secure protocols (HTTPS/443, SSH/22, FTPS/990, SMTPS/465, LDAPS/636) enabling proper firewall filtering and reducing confusion. While non-standard ports provide security through obscurity, they complicate configuration, break port-based filtering, and don't provide real security against determined attackers. Standard port usage enables proper firewall rules, IDS/IPS signature matching, and security tool visibility, though non-standard ports may be appropriate for management interfaces or when avoiding automated attacks targeting standard ports."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Implementation of secure protocols > Transport method",
    contextSummary: "Transport method selection determines how security is applied to communications—application-layer protocols (HTTPS, SFTP) provide end-to-end encryption visible to applications, while network-layer protocols (IPsec, VPN) provide transparent encryption below application awareness. Application-layer encryption integrates security into protocols, enables protocol-specific features (HTTP/2), and works across different network paths. Network-layer encryption provides transparent protection for multiple protocols, works with legacy applications, but may not protect through proxies or NAT, requiring consideration of where encryption terminates and what intermediate devices need visibility."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management",
    contextSummary: "This objective covers implementing and maintaining systems and processes for verifying user identities and controlling access to resources including provisioning and de-provisioning accounts, implementing permission assignments, managing access reviews, and configuring multifactor authentication. Identity and access management (IAM) ensures that only authorized users access appropriate resources, implements least privilege, enables auditing, and supports compliance. Effective IAM requires lifecycle management from hiring to termination, regular access reviews preventing privilege creep, and strong authentication preventing credential compromise."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Provisioning/de-provisioning user accounts",
    contextSummary: "Provisioning creates new user accounts with appropriate access when employees are hired or change roles, while de-provisioning removes or disables accounts when employees leave or change roles, preventing unauthorized access. Provisioning processes define what access new users receive, require approvals, follow least privilege, and integrate with HR systems for automation. De-provisioning must occur promptly at termination (especially involuntary), disable rather than delete accounts initially (preserving audit trails), revoke remote access, collect company assets, and disable shared accounts the user could access."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications",
    contextSummary: "Permission assignment grants users, groups, or roles access to resources based on job requirements, implementing least privilege principle. Permission strategies include user-based (permissions assigned directly to individuals), group-based (permissions granted to groups, users inherit via membership), and role-based access control (permissions bundled into roles, users assigned roles). Permission implications include accumulation over time (privilege creep), inheritance complexities, shared account risks, and need for regular reviews ensuring permissions remain appropriate."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications > User accounts",
    contextSummary: "User accounts are individual identities for people accessing systems, enabling authentication, authorization, auditing, and accountability. User account management includes unique accounts for each person (enabling attribution), appropriate naming conventions, password policies, account expiration dates, and attributes defining access rights. Security practices include prohibiting shared accounts, enforcing account lockout policies, monitoring for suspicious authentication patterns, requiring periodic password changes or password-less authentication, and implementing least privilege for account permissions."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications > Group-based",
    contextSummary: "Group-based permissions assign access rights to groups (roles, departments, teams) rather than individuals, with users inheriting permissions through group membership, simplifying administration and ensuring consistent access. Group strategies improve scalability (manage permissions once for many users), ensure consistency (all group members have same access), and simplify auditing (review group membership). Challenges include nested group complexity, users belonging to multiple groups (cumulative permissions), and groups needing regular review to remove members who no longer need access."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications > Location-based",
    contextSummary: "Location-based access control restricts access based on user's physical or network location—allowing VPN access only from certain countries, requiring additional authentication from untrusted networks, or blocking access from geographic regions where organization has no presence. Location-based controls detect impossible travel (logins from distant locations in unrealistic timeframes), implement geo-fencing (restricting access to sensitive data from certain regions), and add risk-based authentication (requiring MFA from unusual locations). Implementation uses IP geolocation, GPS, Wi-Fi location, or network detection."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications > Role-based",
    contextSummary: "Role-Based Access Control (RBAC) assigns permissions to roles representing job functions (engineer, manager, accountant), with users receiving permissions by role assignment rather than individual grants. RBAC simplifies administration (create roles once, assign users to roles), ensures consistency (all users in role have same access), facilitates reviews (review role permissions and role membership), and supports segregation of duties (roles designed to prevent conflict). Effective RBAC requires well-defined roles, periodic role content review, and preventing excessive roles creating equivalent individual permission assignments."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications > Attribute-based",
    contextSummary: "Attribute-Based Access Control (ABAC) makes access decisions based on attributes of users, resources, and environmental context (time, location, risk) using policies evaluating multiple attributes dynamically. ABAC enables fine-grained context-aware access control—allowing document access only to users in same department during business hours from corporate network. ABAC offers flexibility exceeding RBAC but requires more complex policy definition, attribute management, and policy evaluation infrastructure. ABAC suits dynamic environments with complex access requirements difficult to express in roles."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications > Mandatory",
    contextSummary: "Mandatory Access Control (MAC) enforces access policies centrally defined by system administrators based on security labels and clearances, with users unable to modify permissions on objects they create. MAC implements military/government classification models (Top Secret, Secret, Confidential) where users with lower clearance cannot access higher-classified data. MAC provides strong assurance that security policies are enforced consistently and cannot be bypassed by users, but requires extensive classification effort and specialized operating systems (SELinux, Trusted Solaris)."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Permission assignments and implications > Least privilege",
    contextSummary: "Least privilege principle grants users minimum permissions necessary to perform job duties, reducing attack surface and limiting damage from compromised accounts or malicious insiders. Implementing least privilege involves identifying required access through job analysis, denying by default (explicit permission required), granting temporary elevated privileges when needed, and regular reviews removing unnecessary access. Challenges include user requests for unnecessary access, applications requiring excessive permissions, and operational friction from too-restrictive access requiring balance with productivity."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access reviews",
    contextSummary: "Access reviews (also called access certification or recertification) periodically verify that users' access rights remain appropriate for current job responsibilities, removing unnecessary permissions and detecting orphaned accounts. Reviews should occur at regular intervals (quarterly, annually), when users change roles, and for privileged accounts more frequently. Review processes involve managers attesting that direct reports' access is appropriate, system owners reviewing who accesses their systems, and removal of access not affirmed, with exceptions requiring justification."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication",
    contextSummary: "Multifactor authentication (MFA) requires users to provide two or more authentication factors from different categories (something you know, something you have, something you are) to verify identity, significantly reducing credential theft risk. MFA implementation considers factors (passwords + authenticator apps + biometrics), user experience (seamless vs. intrusive), risk-based authentication (requiring MFA for sensitive operations or unusual access), and recovery procedures for lost factors. MFA should be required for privileged access, remote access, and access to sensitive data, with gradual rollout to all users."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Implementations",
    contextSummary: "MFA implementations vary in security strength, user experience, and cost including SMS/voice (convenient but vulnerable to interception), authenticator apps (TOTP codes), hardware tokens (FIDO2 security keys), push notifications (mobile app approval), and biometrics. Implementation considerations include supported authentication factors, user device requirements, fallback methods when primary factor unavailable, deployment complexity, and cost. Modern implementations favor FIDO2/WebAuthn for phishing resistance, with SMS as fallback despite interception risks."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Factors",
    contextSummary: "Authentication factors are different categories of credentials used to verify identity including something you know (passwords, PINs), something you have (tokens, smart cards, phones), something you are (biometrics), somewhere you are (location), and something you do (behavioral patterns). True MFA requires factors from different categories—password plus security question is single-factor (both knowledge). Factor selection balances security (biometrics hard to steal but can't be changed if compromised), user experience (biometrics convenient, hardware tokens require carrying), and cost."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Factors > Something you know",
    contextSummary: "Something you know factors are knowledge-based authentication including passwords, PINs, passphrases, and security questions that verify identity through memorized information. Knowledge factors are most common but vulnerable to guessing, phishing, social engineering, and password reuse across sites. Security practices include password complexity requirements, prohibiting common passwords, regular password changes (or password-less approaches), password managers for unique passwords, and combining knowledge factors with other factor types for MFA."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Factors > Something you have",
    contextSummary: "Something you have factors are possession-based authentication using physical devices or digital tokens including hardware security keys (FIDO2), smart cards, authenticator apps generating time-based codes (TOTP), SMS codes sent to registered phones, and certificate-based authentication. Possession factors are stronger than knowledge factors since attackers need physical access or device compromise. Security considerations include protecting devices from theft, backup authentication methods when device is lost, and vulnerabilities like SMS interception or app-based token cloning."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch8)
}

export { batch8 }
