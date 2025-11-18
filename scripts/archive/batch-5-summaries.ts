/**
 * Context Summaries Batch 5 (Entities 201-300)
 * Covers: Vulnerabilities (end-of-life to zero-day), Attack indicators, Mitigation techniques, Security Architecture
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch5 = [
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Hardware > End-of-life",
    contextSummary: "End-of-life (EOL) hardware is equipment that manufacturers no longer produce, sell, or support with updates and security patches. EOL hardware accumulates vulnerabilities over time without remediation options, creating security risks that require mitigation through isolation, replacement, or compensating controls. Organizations must plan for hardware lifecycle management to replace EOL equipment before support ends and vulnerabilities become critical."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Hardware > Legacy",
    contextSummary: "Legacy hardware refers to older systems still in use despite being outdated, often lacking modern security features like hardware encryption, secure boot, or TPM. Legacy hardware may not support current operating systems or security software, limiting protective capabilities. Organizations continue using legacy hardware due to cost, compatibility with legacy applications, or critical business processes, requiring network segmentation and additional monitoring."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Virtualization",
    contextSummary: "Virtualization vulnerabilities arise from running multiple virtual machines on shared physical hardware, creating risks through hypervisor exploits, VM escape attacks, resource contention, and inadequate VM isolation. Virtualization platforms like VMware, Hyper-V, and KVM require regular patching, proper configuration, resource management, and security controls to prevent cross-VM attacks and unauthorized access to the hypervisor."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Virtualization > Virtual machine (VM) escape",
    contextSummary: "VM escape is a critical vulnerability where attackers break out of a virtual machine to access the underlying hypervisor or other VMs on the same host. Successful VM escape compromises the entire virtualization infrastructure, potentially affecting all VMs and data on the host. VM escape exploits are rare but extremely serious, requiring hypervisor patching, VM hardening, and network segmentation between VMs."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Virtualization > Resource reuse",
    contextSummary: "Resource reuse vulnerabilities occur when virtualization platforms insufficiently clear memory, storage, or other resources before reallocating them to new VMs, potentially exposing previous VM data. Attackers may recover sensitive information from reallocated memory pages, disk blocks, or network buffers. Mitigation requires secure resource wiping, memory zeroing, and proper VM deprovisioning procedures to prevent data leakage between VMs."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Cloud-specific",
    contextSummary: "Cloud-specific vulnerabilities arise from cloud service architecture, multi-tenancy, shared responsibility models, API security, and cloud configuration management. Common cloud vulnerabilities include misconfigured storage buckets, inadequate access controls, insecure APIs, insufficient encryption, and poor identity management. Cloud security requires understanding provider responsibilities, proper configuration, encryption of data at rest and in transit, and continuous monitoring."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Supply chain",
    contextSummary: "Supply chain vulnerabilities occur when attackers compromise products, services, or components during manufacturing, distribution, installation, or update processes. Supply chain attacks can insert backdoors, malware, or vulnerabilities that affect all downstream customers. Notable examples include SolarWinds and Kaseya attacks, making supply chain security critical through vendor assessment, code signing verification, and software bill of materials (SBOM) analysis."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Supply chain > Service provider",
    contextSummary: "Service provider vulnerabilities arise when third-party services (SaaS, managed security services, IT services) introduce risks through their infrastructure, personnel, or processes. Compromising a service provider grants attackers access to multiple customers simultaneously. Service provider risk management requires security assessments, contractual security requirements, monitoring of provider access, and incident response coordination."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Supply chain > Hardware provider",
    contextSummary: "Hardware provider vulnerabilities occur when manufacturers or suppliers compromise hardware through malicious firmware, backdoors, counterfeit components, or substandard security practices. Hardware-level compromises are difficult to detect and can persist across software reinstallations. Hardware supply chain security requires vendor verification, tamper-evident packaging, hardware security testing, and trusted suppliers for critical components."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Supply chain > Software provider",
    contextSummary: "Software provider vulnerabilities arise when software vendors, open-source maintainers, or development tools are compromised to inject malicious code, backdoors, or vulnerabilities into software products. Software supply chain attacks affect all users of compromised products through legitimate update mechanisms. Protection requires code signing verification, software composition analysis, dependency scanning, and monitoring of third-party libraries."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Cryptographic",
    contextSummary: "Cryptographic vulnerabilities arise from weak algorithms, insufficient key lengths, improper implementation, or flawed random number generation. Examples include using deprecated algorithms (MD5, DES), short key lengths vulnerable to brute force, reusing initialization vectors, or predictable random number generators. Cryptographic vulnerabilities enable attackers to decrypt data, forge signatures, or bypass authentication, requiring migration to modern algorithms and proper implementation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Misconfiguration",
    contextSummary: "Misconfiguration vulnerabilities result from improper system, application, or network settings that create security weaknesses. Common misconfigurations include default credentials, open ports, excessive permissions, unencrypted communications, verbose error messages, and disabled security features. Misconfiguration is a leading cause of breaches and can be prevented through security baselines, configuration management, automated scanning, and security testing."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Mobile device",
    contextSummary: "Mobile device vulnerabilities arise from operating system flaws, malicious apps, insecure configurations, lost/stolen devices, and risky user behaviors. Mobile-specific risks include side loading untrusted apps, jailbreaking/rooting that removes security protections, outdated OS versions, and connection to untrusted networks. Mobile security requires mobile device management (MDM), app vetting, encryption, remote wipe capabilities, and user training."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Mobile device > Side loading",
    contextSummary: "Side loading is installing applications from sources outside official app stores (Google Play, Apple App Store), bypassing security vetting and malware scanning. Side-loaded apps may contain malware, spyware, or trojans that official stores would reject. Side loading increases security risks by installing unverified code, requiring organizations to block side loading through MDM policies or restrict it to trusted enterprise app stores."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Mobile device > Jailbreaking",
    contextSummary: "Jailbreaking (iOS) or rooting (Android) removes manufacturer security restrictions to gain root/administrator access and install unauthorized software. While providing customization freedom, jailbreaking disables security features like sandboxing, code signing enforcement, and automatic updates, making devices vulnerable to malware. Organizations typically prohibit jailbroken devices from accessing corporate resources and use MDM solutions to detect and block them."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Zero-day",
    contextSummary: "Zero-day vulnerabilities are security flaws unknown to vendors and without available patches, making them extremely valuable for attacks since no defenses exist. The name refers to zero days of protection between discovery and exploitation. Zero-days are used by APT groups, sold on underground markets, and disclosed through bug bounties or coordinated disclosure. Defense requires behavioral detection, threat intelligence, intrusion prevention systems, and rapid incident response."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity",
    contextSummary: "This objective teaches identifying and analyzing signs of security breaches, malware infections, and malicious behavior through various attack indicators. Students learn to recognize different attack types (malware, physical, network, application, cryptographic, password attacks) and their indicators (account lockouts, impossible travel, resource consumption, missing logs). Analyzing indicators of compromise (IOCs) is essential for threat detection, incident response, and security monitoring."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks",
    contextSummary: "Malware attacks use malicious software to compromise systems, steal data, disrupt operations, or enable further attacks. Common malware types include ransomware, trojans, worms, spyware, viruses, keyloggers, logic bombs, and rootkits, each with distinct behaviors and indicators. Malware detection requires antivirus software, behavioral analysis, network monitoring, and user awareness of suspicious activity like unexpected slowdowns or unauthorized access."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Ransomware",
    contextSummary: "Ransomware encrypts victim files and demands payment for decryption keys, causing business disruption and potential data loss. Indicators include encrypted files with changed extensions, ransom notes on desktops, inability to access files, and network encryption activity. Ransomware prevention requires regular backups, patch management, email filtering, user training, and endpoint protection with behavioral detection."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Trojan",
    contextSummary: "Trojans are malicious programs disguised as legitimate software that provide unauthorized access, steal information, or download additional malware. Unlike viruses, trojans don't self-replicate but trick users into execution. Common trojans include remote access trojans (RATs), banking trojans, and downloader trojans. Indicators include unexpected network connections, new user accounts, unusual process activity, and performance degradation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Worm",
    contextSummary: "Worms are self-replicating malware that spread automatically across networks without user interaction, exploiting vulnerabilities or weak credentials. Worms cause network congestion, system crashes, and rapid infection spread. Famous examples include WannaCry and Conficker. Indicators include network bandwidth spikes, mass scanning activity, rapid infection spread, and exploitation attempts in logs. Prevention requires patching, network segmentation, and intrusion prevention systems."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Spyware",
    contextSummary: "Spyware secretly monitors and collects user information including browsing habits, keystrokes, credentials, and personal data without consent. Spyware can capture screenshots, record audio/video, track location, and exfiltrate sensitive information. Indicators include browser redirects, unexpected toolbars, performance slowdowns, increased network traffic, and modified browser settings. Anti-spyware tools and regular scanning help detect and remove spyware."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Bloatware",
    contextSummary: "Bloatware refers to pre-installed software on devices that users don't want, consuming resources and potentially creating security risks. While not always malicious, bloatware may contain adware, collect data, or introduce vulnerabilities. Bloatware is common on new computers, mobile devices, and consumer electronics. Removal improves performance and security, though some bloatware may be difficult to uninstall without manufacturer tools."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Virus",
    contextSummary: "Viruses are malicious code that attaches to legitimate programs or files and replicates when executed, spreading to other files and systems. Viruses require user action to execute and can corrupt files, delete data, or enable further attacks. Indicators include unexpected file modifications, program crashes, missing files, and antivirus alerts. Modern antivirus solutions use signature detection, heuristics, and behavioral analysis to identify and block viruses."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Keylogger",
    contextSummary: "Keyloggers record keystrokes to capture passwords, credit card numbers, and other sensitive information typed by users. Keyloggers can be software-based (malware) or hardware devices (physical keyboard interceptors). Software keylogger indicators include suspicious processes, unexpected network connections, and new startup programs. Protection requires endpoint security, two-factor authentication, virtual keyboards for sensitive input, and physical security for critical systems."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Logic bomb",
    contextSummary: "Logic bombs are malicious code dormant until triggered by specific conditions (date, event, command) then executing harmful actions like deleting files or corrupting databases. Often planted by malicious insiders for sabotage or revenge. Logic bombs are difficult to detect until activation but may be found through code review, monitoring for suspicious scheduled tasks, and behavioral analysis of privileged user actions."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Malware attacks > Rootkit",
    contextSummary: "Rootkits are stealthy malware that hide their presence and provide persistent privileged access by modifying operating system components, kernel drivers, or firmware. Rootkits conceal processes, files, network connections, and registry entries from detection tools. Kernel-mode and bootkit rootkits are extremely difficult to detect and remove. Detection requires specialized rootkit scanners, memory analysis, and comparison with known-good system states."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Physical attacks",
    contextSummary: "Physical attacks involve direct physical access to systems, facilities, or infrastructure to compromise security. Physical attack methods include brute force entry, RFID cloning, cable tapping, device theft, malicious USB insertion, and exploiting environmental controls. Physical security controls (guards, cameras, locks, environmental monitoring) combined with technical controls (full-disk encryption, tamper detection) mitigate physical attack risks."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Physical attacks > Brute force",
    contextSummary: "Physical brute force attacks use forceful methods to breach physical security barriers including breaking locks, forcing doors, cutting fences, or smashing windows. Indicators include damaged entry points, forced locks, broken glass, and triggered alarms. Physical brute force may precede theft of equipment, data exfiltration, or planting of malicious devices. Deterrence requires hardened entry points, alarm systems, and security monitoring."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Physical attacks > Radio frequency identification (RFID) cloning",
    contextSummary: "RFID cloning captures and replicates RFID signals from access badges or cards to create unauthorized duplicates that bypass physical access controls. Attackers use RFID readers to capture card data from proximity, then clone it to blank cards. Indicators include unauthorized access using valid credentials, access attempts outside normal patterns, and reports of proximity scanning devices. Protection requires encrypted RFID cards, multi-factor authentication, and monitoring for cloning devices."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Physical attacks > Environmental",
    contextSummary: "Environmental attacks exploit or manipulate physical infrastructure systems like HVAC, power, fire suppression, or cooling to cause system failures, disruption, or physical damage. Attackers may disable cooling to cause overheating, trigger fire suppression systems to damage equipment, or manipulate power systems. Indicators include environmental sensor alerts, unusual HVAC activity, power fluctuations, and temperature anomalies. Protection requires environmental monitoring, physical security for control systems, and redundant environmental controls."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks",
    contextSummary: "Network attacks target network infrastructure, protocols, or communications to intercept data, disrupt services, or gain unauthorized access. Common network attacks include DDoS, DNS attacks, wireless attacks, man-in-the-middle, credential replay, and malicious code injection. Network attack detection requires monitoring for traffic anomalies, protocol violations, scanning activity, and unusual connection patterns through intrusion detection systems and network analysis tools."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > Distributed denial-of-service (DDoS)",
    contextSummary: "DDoS attacks overwhelm target systems, networks, or services with massive traffic from multiple compromised systems (botnets), causing service unavailability. DDoS attacks can target different layers (application, transport, network) and use various techniques (volumetric, protocol, application-layer). Indicators include traffic spikes, service slowdowns, bandwidth saturation, and connection failures. Mitigation requires DDoS protection services, traffic filtering, rate limiting, and over-provisioned capacity."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > Distributed denial-of-service (DDoS) > Amplified",
    contextSummary: "Amplified DDoS attacks exploit protocols that respond with larger replies than requests, multiplying attack traffic volume. Attackers send small requests with spoofed source IPs to vulnerable servers (DNS, NTP, memcached), which send large responses to victims. Amplification factors can exceed 100x, creating massive traffic floods from relatively small botnets. Mitigation requires disabling amplification vectors, ingress filtering, and DDoS protection services."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > Distributed denial-of-service (DDoS) > Reflected",
    contextSummary: "Reflected DDoS attacks send requests to legitimate servers with the victim's spoofed IP address, causing servers to send responses to the victim. This reflects attack traffic through intermediary systems, obscuring the attacker's source while overwhelming the victim. Common reflection protocols include DNS, NTP, and SSDP. Combining reflection with amplification creates devastating DDoS attacks requiring source IP validation and DDoS mitigation services."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > Domain Name System (DNS) attacks",
    contextSummary: "DNS attacks target domain name resolution to redirect traffic, deny service, or exfiltrate data. Attack types include DNS cache poisoning (corrupting DNS records), DNS tunneling (using DNS for data exfiltration or C2 communication), DNS amplification (DDoS via DNS), and DNS hijacking. Indicators include unusual DNS query patterns, unexpected DNS traffic volume, and resolution to incorrect IPs. Protection requires DNSSEC, DNS filtering, and monitoring DNS query patterns."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > Wireless",
    contextSummary: "Wireless network attacks exploit vulnerabilities in Wi-Fi protocols, encryption, or configurations including evil twin access points, deauthentication attacks, WPS attacks, and encryption cracking. Wireless attacks can intercept traffic, steal credentials, or provide network access. Indicators include rogue access points, deauthentication storms, unexpected wireless associations, and weak signal strength variations. Protection requires WPA3 encryption, wireless IDS, rogue AP detection, and 802.1X authentication."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > On-path / Man in the Middle Attack (MiTM)",
    contextSummary: "On-path/Man-in-the-Middle (MiTM) attacks position attackers between communicating parties to intercept, modify, or inject data without detection. MiTM techniques include ARP spoofing, DNS spoofing, rogue Wi-Fi access points, and SSL stripping. Indicators include certificate warnings, unexpected network routes, ARP table anomalies, and modified content. Protection requires encrypted communications, certificate validation, secure protocols (HTTPS, SSH), and network monitoring."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > Credential replay",
    contextSummary: "Credential replay attacks capture valid authentication credentials or session tokens and reuse them to gain unauthorized access. Replay attacks exploit protocols lacking freshness mechanisms (timestamps, nonces) to prevent reuse of intercepted credentials. Indicators include duplicate authentication requests, access from multiple locations simultaneously, and session tokens used beyond normal lifetimes. Prevention requires encryption, timestamps, session management, and protocols with replay protection (Kerberos, OAuth with state parameters)."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Network attacks > Malicious code",
    contextSummary: "Malicious code in network attacks refers to code injection through network protocols, drive-by downloads from compromised websites, exploitation of network service vulnerabilities, or malicious payloads in network traffic. Network-borne malicious code can spread rapidly across networks, exploit vulnerable services, or execute remotely. Detection requires network-based antivirus, intrusion prevention systems, traffic inspection, and monitoring for exploit patterns and shellcode signatures."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Application attacks",
    contextSummary: "Application attacks exploit vulnerabilities in software applications through injection flaws, buffer overflows, replay attacks, privilege escalation, forgery, and directory traversal. Application attacks target web applications, APIs, desktop software, or mobile apps to steal data, gain unauthorized access, or execute arbitrary code. Application security requires secure coding practices, input validation, least privilege, security testing, and web application firewalls."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Application attacks > Injection",
    contextSummary: "Injection attacks insert malicious commands or code into application inputs that are executed by the application or backend systems. Common injection types include SQL injection, command injection, LDAP injection, XML injection, and code injection. Indicators include unusual database queries, system commands in logs, unexpected application behavior, and data exfiltration. Prevention requires parameterized queries, input validation, output encoding, and least privilege database access."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Application attacks > Buffer overflow",
    contextSummary: "Buffer overflow attacks write more data to memory buffers than allocated, overwriting adjacent memory to crash applications or execute arbitrary code. Stack and heap overflow exploits can hijack program execution, escalate privileges, or bypass security controls. Indicators include application crashes, segmentation faults, unexpected process behavior, and exploitation attempts in logs. Modern protections include DEP, ASLR, stack canaries, and memory-safe programming languages."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Application attacks > Replay",
    contextSummary: "Application-level replay attacks capture and retransmit valid application requests (API calls, transactions, form submissions) to perform unauthorized actions. Replay attacks exploit applications lacking anti-replay mechanisms like nonces, timestamps, or CSRF tokens. Indicators include duplicate transactions, requests outside normal patterns, and reuse of expired tokens. Prevention requires cryptographic nonces, timestamp validation, session management, and anti-CSRF tokens."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Application attacks > Privilege escalation",
    contextSummary: "Privilege escalation exploits vulnerabilities to gain higher access levels than authorized, either vertically (user to admin) or horizontally (accessing other users' resources). Privilege escalation can exploit misconfigurations, vulnerable software, or design flaws. Indicators include unauthorized administrative actions, access to restricted resources, and suspicious elevation attempts. Prevention requires least privilege, proper access controls, security testing, and monitoring of privilege use."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Application attacks > Forgery",
    contextSummary: "Forgery attacks create fake but valid-appearing requests, credentials, or data to trick systems into unauthorized actions. Common forgery attacks include Cross-Site Request Forgery (CSRF) forcing users to perform unwanted actions, request forgery manipulating API calls, and session token forgery. Indicators include unexpected state changes, actions from legitimate users they didn't perform, and suspicious cross-origin requests. Protection requires anti-CSRF tokens, same-site cookies, and request validation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Application attacks > Directory traversal",
    contextSummary: "Directory traversal attacks (path traversal) manipulate file path parameters to access files and directories outside the intended scope, using sequences like \"../\" to navigate directory structures. Attackers can read sensitive files, configuration files, or source code. Indicators include path traversal patterns in logs, access to unexpected files, and application errors. Prevention requires input validation, path canonicalization, whitelist-based file access, and running applications with minimal file system permissions."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Cryptographic attacks",
    contextSummary: "Cryptographic attacks exploit weaknesses in cryptographic algorithms, implementations, or protocols to decrypt data, forge signatures, or bypass authentication. Attack types include downgrade attacks forcing weaker encryption, collision attacks finding hash duplicates, and birthday attacks exploiting probability in hash functions. Cryptographic attack prevention requires strong algorithms, proper implementation, secure key management, and disabling legacy cryptographic options."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Cryptographic attacks > Downgrade",
    contextSummary: "Downgrade attacks force systems to use weaker, older cryptographic protocols or cipher suites that are easier to break. Attackers manipulate protocol negotiation to select vulnerable encryption methods like SSLv3, weak ciphers, or no encryption. Examples include POODLE and BEAST attacks against SSL/TLS. Indicators include use of deprecated protocols, weak cipher negotiation, and protocol version mismatches. Prevention requires disabling legacy protocols and enforcing minimum security standards."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Cryptographic attacks > Collision",
    contextSummary: "Collision attacks find two different inputs that produce the same hash output, undermining hash function integrity guarantees. Collisions enable attackers to substitute malicious content with the same hash, forge digital signatures, or create fraudulent certificates. MD5 and SHA-1 are vulnerable to collision attacks and deprecated. Indicators include identical hashes for different content. Prevention requires using collision-resistant hash functions (SHA-256, SHA-3) and retiring vulnerable algorithms."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Cryptographic attacks > Birthday",
    contextSummary: "Birthday attacks exploit probability theory (birthday paradox) to find hash collisions faster than brute force, with complexity proportional to the square root of hash space size. For a 64-bit hash, only 2^32 attempts (4 billion) are needed rather than 2^64, making birthday attacks practical against short hashes. Birthday attacks threaten digital signatures and hash-based integrity. Defense requires sufficiently long hash outputs (256+ bits) and collision-resistant algorithms."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Password attacks",
    contextSummary: "Password attacks attempt to obtain or crack passwords through various techniques including brute force, dictionary attacks, credential stuffing, password spraying, and social engineering. Password attacks exploit weak passwords, password reuse, lack of account lockout, and inadequate hashing. Defense requires strong password policies, multi-factor authentication, account lockout mechanisms, password hashing with salt, and monitoring for credential compromise."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Password attacks > Spraying",
    contextSummary: "Password spraying attacks try a few common passwords against many user accounts rather than many passwords against one account, avoiding account lockout triggers. Attackers use commonly used passwords (Password123, Summer2024) across many accounts. Indicators include failed login attempts across multiple accounts from same source, use of common passwords, and authentication failures outside lockout thresholds. Prevention requires password complexity enforcement, monitoring for spray patterns, and adaptive authentication."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Password attacks > Brute force",
    contextSummary: "Brute force password attacks systematically try all possible password combinations until finding the correct one. Effectiveness depends on password length, complexity, and hashing strength. Online brute force targets login forms while offline brute force attempts crack stolen password hashes. Indicators include massive authentication failures, high CPU usage during hash cracking, and dictionary attack patterns. Defense requires strong passwords, account lockout, rate limiting, CAPTCHA, and MFA."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators",
    contextSummary: "Indicators of malicious activity are observable signs that security incidents, attacks, or compromises may be occurring. Common indicators include account lockouts, concurrent session usage, blocked content, impossible travel, resource consumption anomalies, resource inaccessibility, unusual logging patterns, and missing logs. Analyzing indicators requires baseline understanding of normal behavior, correlation of multiple signals, and security information and event management (SIEM) systems."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Account lockout",
    contextSummary: "Account lockouts occur when authentication fails repeatedly, typically indicating brute force attacks, password spraying, or credential stuffing attempts. While lockouts protect against unauthorized access, they can also indicate compromised credentials being tested or denial-of-service against user accounts. Monitoring lockout patterns helps detect attacks and identify targeted accounts requiring additional protection like password resets or MFA enforcement."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Concurrent session usage",
    contextSummary: "Concurrent session usage occurs when the same account is logged in from multiple locations or devices simultaneously, potentially indicating credential theft or account compromise. Legitimate concurrent sessions exist (multiple browser tabs, mobile and desktop), but unusual patterns like geographically distant concurrent logins suggest compromise. Monitoring concurrent sessions helps detect credential sharing, session hijacking, or stolen credentials requiring investigation and session termination."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Blocked content",
    contextSummary: "Blocked content indicators show systems attempting to access malicious sites, download malware, or reach command-and-control servers, triggering web filters or firewalls. High volumes of blocked requests may indicate malware infections, compromised systems, or insider threats. Analyzing blocked content patterns reveals threats that security controls prevented, requiring investigation of source systems and potential deeper compromise."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Impossible travel",
    contextSummary: "Impossible travel detects authentication from geographically distant locations within timeframes too short for legitimate travel, indicating credential compromise or account takeover. For example, logins from New York and Tokyo within an hour are physically impossible. Impossible travel detection requires geolocation of login sources and temporal analysis. This indicator triggers forced password resets, MFA challenges, and security investigations."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Resource consumption",
    contextSummary: "Abnormal resource consumption includes unusual CPU usage, memory consumption, network bandwidth, disk I/O, or storage utilization indicating malicious activity. Cryptocurrency mining, DDoS bots, data exfiltration, or malware can cause resource spikes. Monitoring resource usage baselines and alerting on anomalies helps detect compromises, performance issues, or misuse requiring investigation and remediation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Resource inaccessibility",
    contextSummary: "Resource inaccessibility occurs when systems, services, files, or data become unavailable, potentially indicating ransomware, denial-of-service attacks, system compromise, or sabotage. Sudden inability to access resources requires immediate investigation to determine cause (attack, failure, misconfiguration) and initiate incident response. Backup systems and disaster recovery procedures become critical when resources are deliberately made inaccessible by attackers."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Out-of-cycle logging",
    contextSummary: "Out-of-cycle logging refers to log entries occurring at unusual times, such as administrative activity during off-hours, batch jobs running at wrong times, or access from systems during maintenance windows. Temporal anomalies in logging patterns can indicate unauthorized access, compromised accounts, or insider threats. Monitoring for out-of-cycle activities requires establishing baselines and alerting on deviations from expected patterns."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Published/documented",
    contextSummary: "Published or documented indicators refer to known indicators of compromise (IOCs) shared by security researchers, vendors, or threat intelligence feeds including malicious IP addresses, domains, file hashes, and attack signatures. Organizations use published IOCs to proactively block threats, scan for existing compromises, and update security controls. Published indicators enable collective defense through information sharing but require timely integration into security tools."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Given a scenario, analyze indicators of malicious activity > Indicators > Missing logs",
    contextSummary: "Missing logs indicate gaps in log data that should exist, potentially showing log tampering by attackers covering their tracks, log system failures, or misconfiguration. Attackers often delete or modify logs to hide malicious activity. Missing logs for critical systems or time periods require investigation and potentially indicate security incidents. Log integrity monitoring, centralized logging, and write-once log storage help prevent log tampering."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise",
    contextSummary: "This objective covers defensive techniques and security controls that reduce risk and prevent successful attacks. Mitigation techniques include network segmentation, access controls, application allow listing, isolation, patching, encryption, monitoring, least privilege, configuration enforcement, decommissioning, and hardening. Understanding when and how to apply mitigation techniques enables building defense-in-depth strategies that protect against multiple threat vectors."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Segmentation",
    contextSummary: "Network segmentation divides networks into isolated segments or zones to limit attack spread, contain breaches, and enforce security policies. Segmentation uses VLANs, subnets, firewalls, and access controls to separate different trust levels, departments, or functions. Proper segmentation prevents lateral movement, reduces blast radius of compromises, and enables granular security controls based on segment sensitivity and risk."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Access control",
    contextSummary: "Access control mechanisms enforce policies determining who can access which resources and what actions they can perform. Access controls include authentication (verifying identity), authorization (granting permissions), and accounting (logging access). Effective access control implements least privilege, separation of duties, need-to-know, and defense-in-depth through multiple control layers including physical, technical, and administrative controls."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Access control > Access control list (ACL)",
    contextSummary: "Access Control Lists (ACLs) are tables specifying which users or systems can access resources and what operations are permitted or denied. ACLs are used in filesystems, network devices, and applications to enforce access policies. ACL entries define subjects (users, groups), objects (files, network traffic), and allowed/denied actions. Proper ACL management requires regular review, least privilege, and inheritance understanding to maintain security."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Access control > Permissions",
    contextSummary: "Permissions define specific rights or privileges granted to users, groups, or processes to perform actions on resources. Common permissions include read, write, execute, delete, modify, and administrative rights. Permission management implements least privilege by granting only necessary access, using groups for scalability, and regularly reviewing permissions. Excessive permissions create security risks through privilege escalation or unauthorized access."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Application allow list",
    contextSummary: "Application allow lists (whitelisting) permit only approved applications to execute, blocking all others by default. This restrictive approach prevents malware execution, unauthorized software installation, and reduces attack surface. Application allow listing is highly effective for protecting endpoints, servers, and critical systems but requires maintenance to keep allow lists current with legitimate application needs and updates."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Isolation",
    contextSummary: "Isolation separates systems, networks, or processes from each other to prevent interaction, contain threats, and protect sensitive resources. Isolation techniques include air-gapping, network segmentation, virtual machines, containers, and sandboxing. Isolation limits lateral movement, contains malware, protects sensitive data, and enables safe analysis of potentially malicious content. Critical systems and high-risk activities benefit from isolation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Patching",
    contextSummary: "Patching applies software updates that fix security vulnerabilities, bugs, and compatibility issues. Timely patching is critical for reducing exposure to known vulnerabilities before attackers exploit them. Patch management includes testing patches, prioritizing based on risk, scheduling deployment windows, and verifying successful application. Balancing security (rapid patching) with stability (thorough testing) requires risk-based patching strategies."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Encryption",
    contextSummary: "Encryption protects data confidentiality by converting plaintext into ciphertext that requires decryption keys to read. Encryption should protect data at rest (storage), in transit (network), and in use (memory/processing). Encryption mitigates data breaches, eavesdropping, and unauthorized access but requires proper key management, algorithm selection, and performance consideration. Encryption is often required for compliance with data protection regulations."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Monitoring",
    contextSummary: "Security monitoring continuously observes systems, networks, and applications for suspicious activity, policy violations, or security incidents. Monitoring uses SIEM systems, intrusion detection, log analysis, and behavioral analytics to detect threats. Effective monitoring requires defining what to monitor, establishing baselines, creating alerts for anomalies, and responding to findings. Monitoring enables early threat detection and incident response."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Least privilege",
    contextSummary: "Least privilege grants users, processes, and systems only the minimum access rights needed to perform their functions. This principle reduces attack surface, limits damage from compromises, and prevents accidental or intentional misuse. Implementing least privilege requires understanding job functions, regular access reviews, just-in-time privilege elevation, and privileged access management. Least privilege is foundational to defense-in-depth security architectures."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Configuration enforcement",
    contextSummary: "Configuration enforcement ensures systems maintain secure settings and prevent drift from security baselines. Configuration management tools automatically detect and remediate unauthorized changes, enforce security policies, and maintain compliance. Configuration enforcement prevents security misconfigurations, ensures consistency across infrastructure, and speeds recovery from changes. Automated configuration enforcement is essential for cloud environments and large-scale infrastructure."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Decommissioning",
    contextSummary: "Decommissioning is the secure removal of systems, applications, or equipment from production including data sanitization, credential revocation, and documentation updates. Proper decommissioning prevents data leaks from abandoned systems, removes attack surface, and ensures compliance with data retention policies. Decommissioning procedures include data backup, secure data destruction, removing from inventories, and updating network/security documentation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques",
    contextSummary: "System hardening reduces attack surface by disabling unnecessary services, removing unneeded software, applying security configurations, and implementing security controls. Hardening techniques include encryption, endpoint protection, host firewalls, HIPS, disabling unused ports/protocols, changing default passwords, and removing unnecessary software. Hardening follows security baselines and best practices to minimize vulnerabilities and strengthen defenses."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques > Encryption",
    contextSummary: "Encryption as a hardening technique involves enabling full-disk encryption, encrypting sensitive files, using encrypted communications, and ensuring encryption is properly configured. Encryption hardening protects data on endpoints, servers, and mobile devices from theft or unauthorized access. Implementation includes enabling BitLocker/FileVault, configuring encrypted filesystems, requiring HTTPS, and using encrypted remote access protocols."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques > Installation of endpoint protection",
    contextSummary: "Installing endpoint protection (antivirus, anti-malware, EDR) is a fundamental hardening step that detects and blocks malicious software. Modern endpoint protection uses signatures, behavioral analysis, machine learning, and threat intelligence to identify threats. Endpoint protection must be kept updated, properly configured, and monitored for alerts. Next-generation endpoint protection includes EDR capabilities for detection, response, and forensics."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques > Host-based firewall",
    contextSummary: "Host-based firewalls filter network traffic at individual endpoints, blocking unauthorized connections and restricting network access based on rules. Host firewalls provide defense even when network firewalls are bypassed, protect against lateral movement, and enforce least-privilege network access. Host firewall hardening includes enabling firewalls, configuring default-deny rules, allowing only necessary ports/services, and centrally managing configurations."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques > Host-based intrusion prevention system (HIPS)",
    contextSummary: "Host-based Intrusion Prevention Systems (HIPS) monitor system behavior, file integrity, registry changes, and process activity to detect and block malicious actions. HIPS prevents exploitation by blocking suspicious behaviors like privilege escalation, unauthorized file modifications, or abnormal process execution. HIPS complements signature-based antivirus by detecting unknown threats through behavioral analysis, requiring tuning to avoid false positives."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques > Disabling ports/protocols",
    contextSummary: "Disabling unnecessary network ports and protocols reduces attack surface by removing potential entry points for attacks. Hardening involves closing unused ports, disabling legacy protocols (Telnet, FTP, SMBv1), and restricting services to required protocols only. Port/protocol hardening prevents exploitation of vulnerable services, reduces reconnaissance opportunities, and enforces secure alternatives (SSH instead of Telnet, SFTP instead of FTP)."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques > Default password changes",
    contextSummary: "Changing default passwords on devices, applications, and systems is a critical hardening step preventing easy compromise. Default credentials are widely known and targeted by attackers using automated scanning. Password hardening requires changing all defaults immediately upon deployment, using strong unique passwords, and documenting credentials securely. Default passwords in IoT devices, network equipment, and databases are common security weaknesses."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain the purpose of mitigation techniques used to secure the enterprise > Hardening techniques > Removal of unnecessary software",
    contextSummary: "Removing unnecessary software, services, utilities, and features reduces attack surface, eliminates vulnerabilities, and simplifies security management. Minimal installations contain only required components, following the principle of least functionality. Software removal includes uninstalling unused applications, disabling unnecessary Windows features, removing development tools from production systems, and maintaining lean containers. Less software means fewer vulnerabilities to patch and monitor."
  },
  {
    fullPath: "Security Architecture",
    contextSummary: "Security Architecture encompasses designing secure systems, networks, and infrastructures using appropriate architectural models, security controls, data protection strategies, and resilience planning. This domain covers cloud vs on-premises considerations, infrastructure as code, microservices, network segmentation, cryptography implementation, data protection methods, and business continuity. Effective security architecture balances security requirements with business needs, performance, usability, and cost."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models",
    contextSummary: "This objective examines security considerations for various architectural approaches including cloud (public, private, hybrid), on-premises, infrastructure as code, serverless, microservices, containers, virtualization, IoT, and industrial control systems. Each architecture model presents unique security challenges, benefits, and requirements. Understanding architectural security implications enables selecting appropriate models, implementing proper controls, and balancing security with functionality and cost."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts",
    contextSummary: "Architecture and infrastructure concepts include fundamental building blocks and deployment models for IT systems. Key concepts include cloud computing models, infrastructure as code, serverless computing, microservices, network infrastructure designs, embedded systems, and various deployment environments. Understanding these concepts helps security professionals design secure architectures, select appropriate controls, and address security implications specific to each architectural approach."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Cloud",
    contextSummary: "Cloud architecture uses shared, scalable resources delivered over the internet in service models (IaaS, PaaS, SaaS) and deployment models (public, private, hybrid, community). Cloud security challenges include shared responsibility, data residency, multi-tenancy, API security, and configuration management. Cloud benefits include scalability, resilience, and managed security services, but require understanding provider responsibilities, proper configuration, encryption, identity management, and compliance."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Cloud > Responsibility matrix",
    contextSummary: "The cloud responsibility matrix (shared responsibility model) defines which security controls are managed by cloud providers versus customers, varying by service model. In IaaS, customers secure OS and above; in PaaS, providers secure through runtime; in SaaS, providers secure nearly everything. Understanding responsibility boundaries is critical for ensuring security gaps don't exist. Customers always retain responsibility for data, access control, and user management."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Cloud > Hybrid considerations",
    contextSummary: "Hybrid cloud combines on-premises infrastructure with public/private cloud resources, requiring security integration across environments. Hybrid security challenges include consistent policy enforcement, secure connectivity (VPNs, direct connections), identity federation, data synchronization security, and managing different security control sets. Hybrid architectures offer flexibility and migration paths but increase complexity in security management, monitoring, and compliance across multiple environments."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Cloud > Third-party vendors",
    contextSummary: "Third-party cloud vendors provide services, integrations, or add-ons that extend cloud platforms, creating additional security dependencies and risks. Vendor risk management for cloud third parties requires security assessments, access controls, data sharing agreements, and monitoring vendor security posture. Third-party breaches or vulnerabilities can compromise cloud environments, requiring supply chain security, vendor due diligence, and contractual security requirements."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Infrastructure as code (IaC)",
    contextSummary: "Infrastructure as Code (IaC) defines infrastructure through code/configuration files enabling automated, repeatable deployments using tools like Terraform, CloudFormation, or Ansible. IaC security includes securing code repositories, secret management, configuration scanning for vulnerabilities, version control, and code review. IaC benefits include consistency, security baseline enforcement, and audit trails, but requires treating infrastructure code with software development security practices."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Serverless",
    contextSummary: "Serverless computing executes code in managed, ephemeral containers without server management, using services like AWS Lambda, Azure Functions, or Google Cloud Functions. Serverless security focuses on function code security, event-driven attack surface, IAM permissions, secrets management, and dependency vulnerabilities. While providers manage infrastructure security, customers secure application code, access controls, and data handling. Serverless reduces operational overhead but requires function-level security."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Microservices",
    contextSummary: "Microservices architecture decomposes applications into small, independent services communicating via APIs, enabling scalability and development agility. Microservices security challenges include inter-service authentication, API security, service mesh management, distributed logging/monitoring, and increased attack surface. Security requires service-to-service encryption, API gateways, zero trust networking, centralized authentication, and comprehensive observability across distributed services."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Network infrastructure",
    contextSummary: "Network infrastructure encompasses physical and logical network components including routers, switches, firewalls, load balancers, network segments, and connectivity. Network infrastructure security uses physical isolation, logical segmentation, software-defined networking, zero trust architectures, and defense-in-depth. Secure network design prevents lateral movement, enforces access policies, monitors traffic, and provides resilience through redundancy and failover capabilities."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Network infrastructure > Physical isolation",
    contextSummary: "Physical isolation (air-gapping) completely separates networks or systems from other networks with no physical connections, providing the strongest protection against network-based attacks. Air-gapped networks are used for highly sensitive systems, critical infrastructure, classified networks, and secure development environments. Physical isolation requires strict access controls, removable media scanning, and procedures to prevent bridging gaps through human actions or covert channels."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Network infrastructure > Logical segmentation",
    contextSummary: "Logical segmentation divides networks into isolated segments using VLANs, subnets, and access controls without physical separation. Logical segmentation enables flexible network design, cost-effective isolation, and simplified management while limiting lateral movement. Security relies on proper firewall rules, ACLs, and configuration management since logical segmentation can be bypassed through misconfigurations or VLAN hopping attacks, unlike physical isolation."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Network infrastructure > Software-defined networking (SDN)",
    contextSummary: "Software-Defined Networking (SDN) separates network control plane (decisions) from data plane (forwarding), enabling centralized programmable network management. SDN security benefits include dynamic policy enforcement, automated threat response, and micro-segmentation. SDN risks include controller compromise affecting entire network, API security, and complexity. SDN security requires protecting controllers, encrypting control channels, and securing northbound/southbound APIs."
  },
  {
    fullPath: "Security Architecture > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > On-premises",
    contextSummary: "On-premises architecture hosts infrastructure and applications in organization-owned facilities, providing maximum control over security, data location, and configurations. On-premises security advantages include physical control, no cloud vendor dependency, and custom security architectures. Trade-offs include higher capital costs, responsibility for all security layers, scaling limitations, and staffing requirements. On-premises remains common for regulated industries, sensitive data, and specific compliance requirements."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch5)
}

export { batch5 }
