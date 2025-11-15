/**
 * Context Summaries Batch 4 (Entities 101-200)
 * Covers: Cryptographic tools, Obfuscation, Certificates, Threats/Vulnerabilities domain
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch4 = [
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Tools > Hardware security module (HSM)",
    contextSummary: "A Hardware Security Module (HSM) is a dedicated physical device that provides secure cryptographic key generation, storage, and operations in tamper-resistant hardware. HSMs protect high-value cryptographic keys from extraction or compromise by performing cryptographic operations within the secure hardware boundary. They are used for certificate authorities, payment processing, database encryption, and any scenario requiring the highest level of key protection and regulatory compliance."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Tools > Key management system",
    contextSummary: "A key management system (KMS) is a centralized solution for generating, storing, distributing, rotating, and revoking cryptographic keys throughout their lifecycle. KMS provides automated key rotation, access controls, audit logging, and integration with applications and encryption services. Cloud-based KMS solutions like AWS KMS, Azure Key Vault, and Google Cloud KMS enable scalable key management for cloud infrastructure and applications."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Tools > Secure enclave",
    contextSummary: "A secure enclave is an isolated execution environment within a processor that protects sensitive code and data from access by the main operating system or other applications. Examples include Intel SGX, ARM TrustZone, and Apple's Secure Enclave, which provide hardware-based isolation for cryptographic operations, biometric data processing, and secure key storage. Secure enclaves enable confidential computing where data remains encrypted even during processing."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Obfuscation",
    contextSummary: "Obfuscation techniques make data less readable or recognizable without completely encrypting it, providing security through obscurity while maintaining some data usability. Common obfuscation methods include steganography (hiding data within other data), tokenization (replacing sensitive data with non-sensitive tokens), and data masking (obscuring portions of data). While not as secure as encryption, obfuscation can reduce risk when full encryption isn't practical or when some data visibility is needed."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Obfuscation > Steganography",
    contextSummary: "Steganography is the practice of hiding secret data within ordinary, non-secret files or messages to avoid detection. Unlike encryption which makes data unreadable, steganography conceals the existence of the secret data itself by embedding it in images, audio files, videos, or text. Common techniques include modifying least significant bits in image pixels, hiding data in unused file header space, or using invisible watermarks."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Obfuscation > Tokenization",
    contextSummary: "Tokenization replaces sensitive data with non-sensitive surrogate values (tokens) that have no exploitable meaning or value outside the specific system. The original data is stored securely in a token vault, and tokens can be mapped back to original values only by authorized systems. Tokenization is commonly used for credit card processing (PCI DSS compliance), protecting personally identifiable information (PII), and reducing the scope of regulatory compliance."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Obfuscation > Data masking",
    contextSummary: "Data masking obscures sensitive data by replacing it with fictitious but realistic-looking values while maintaining data format and usability. Masking techniques include substitution (replacing with random values), shuffling (rearranging data within a column), and redaction (partially hiding values like XXX-XX-1234 for SSN). Data masking is used in non-production environments, analytics, testing, and when displaying sensitive data to unauthorized users."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Hashing",
    contextSummary: "Hashing is a one-way cryptographic function that transforms input data into a fixed-size string of characters (hash value) that cannot be reversed to obtain the original data. Hash functions are used for verifying data integrity, storing passwords securely, digital signatures, and file integrity checking. Secure hash algorithms include SHA-256, SHA-3, and bcrypt, while MD5 and SHA-1 are considered weak and should be avoided."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Salting",
    contextSummary: "Salting adds random data to passwords before hashing to prevent attackers from using pre-computed rainbow tables to crack password hashes. Each password gets a unique random salt value that is stored alongside the hash, ensuring identical passwords produce different hash values. Salting significantly increases the computational difficulty of password cracking attacks and is a critical security practice for password storage."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Digital signatures",
    contextSummary: "Digital signatures use asymmetric cryptography to provide authentication, integrity, and non-repudiation for digital documents and messages. The sender creates a signature by hashing the message and encrypting the hash with their private key; recipients verify the signature using the sender's public key. Digital signatures prove the document came from the claimed sender, hasn't been altered, and the sender cannot deny creating it."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Key stretching",
    contextSummary: "Key stretching is a technique that makes weak passwords more resistant to brute-force attacks by applying a cryptographic function thousands or millions of times. Algorithms like PBKDF2, bcrypt, and Argon2 deliberately slow down the hashing process, making password cracking computationally expensive. Key stretching transforms short, potentially weak passwords into longer, more secure cryptographic keys suitable for encryption."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Blockchain",
    contextSummary: "Blockchain is a distributed ledger technology that maintains a tamper-evident, chronological chain of cryptographically linked blocks containing transaction records. Each block contains a cryptographic hash of the previous block, transaction data, and a timestamp, making historical alterations computationally infeasible. Blockchain provides decentralized trust, immutability, and transparency for cryptocurrencies, smart contracts, supply chain tracking, and distributed applications."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Open public ledger",
    contextSummary: "An open public ledger is a transparent, publicly accessible blockchain where all transactions are visible to anyone, though identities may be pseudonymous. Public ledgers like Bitcoin and Ethereum enable anyone to view transaction history, verify balances, and validate the integrity of the blockchain without requiring permission. The openness provides transparency and trust through public auditability while cryptography protects transaction authorization and user privacy."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates",
    contextSummary: "Digital certificates are electronic documents that bind public keys to identities (individuals, organizations, or devices) and are issued by trusted certificate authorities. Certificates contain the public key, owner information, validity period, and CA's digital signature, enabling secure communications, authentication, and trust establishment. Certificates are fundamental to PKI, SSL/TLS encryption, code signing, and email security."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Certificate authorities",
    contextSummary: "Certificate authorities (CAs) are trusted third-party organizations that verify identities and issue digital certificates after validating the certificate requester's credentials. CAs sign certificates with their private key, and browsers/systems trust CAs' root certificates by default, creating a chain of trust. Major CAs include DigiCert, Let's Encrypt, and GlobalSign, and they must follow strict security standards and audit requirements."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Certificate revocation lists (CRLs)",
    contextSummary: "Certificate Revocation Lists (CRLs) are published lists of certificates that have been revoked before their expiration date due to compromise, key loss, or other security concerns. CAs periodically publish updated CRLs that clients download to check if a certificate is still valid. CRLs can become large and introduce latency, leading many systems to prefer OCSP for real-time revocation checking."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Online Certificate Status Protocol (OCSP)",
    contextSummary: "Online Certificate Status Protocol (OCSP) is a real-time protocol for checking the revocation status of digital certificates by querying the CA's OCSP responder. Unlike CRLs which require downloading entire lists, OCSP provides immediate responses for specific certificates, reducing bandwidth and improving performance. OCSP stapling allows web servers to include signed OCSP responses with SSL/TLS handshakes, further improving efficiency and privacy."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Self-signed",
    contextSummary: "Self-signed certificates are digital certificates signed by the certificate creator rather than a trusted certificate authority. While self-signed certificates provide encryption, they don't provide third-party identity verification, causing browser warnings and trust issues. Self-signed certificates are acceptable for internal testing, development environments, or isolated systems but should not be used for public-facing production services."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Third-party",
    contextSummary: "Third-party certificates are issued by trusted commercial or public certificate authorities after verifying the requester's identity and domain ownership. These certificates are automatically trusted by browsers and operating systems because the CA's root certificate is pre-installed in trust stores. Third-party certificates are required for public websites, production services, and any scenario requiring user trust and avoiding browser warnings."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Root of trust",
    contextSummary: "The root of trust is the foundational component of PKI where trust originates, typically a root certificate authority whose certificate is pre-installed and implicitly trusted by operating systems and browsers. All certificate validation chains back to a trusted root CA certificate. Compromise of a root CA is catastrophic as it undermines trust for all certificates issued under that root, making root CA security absolutely critical."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Certificate signing request (CSR) generation",
    contextSummary: "A Certificate Signing Request (CSR) is a message sent to a certificate authority containing the applicant's public key and identity information, requesting a digitally signed certificate. The CSR process ensures the private key never leaves the requester's control while proving ownership of the corresponding public key. CSR generation includes creating a key pair, encoding identity details (organization, domain name), and submitting the CSR to the CA for validation and signing."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Certificates > Wildcard",
    contextSummary: "Wildcard certificates secure a domain and all its first-level subdomains using a single certificate with an asterisk in the domain name (e.g., *.example.com). Wildcard certificates simplify certificate management and reduce costs when securing multiple subdomains, but they don't cover deeper subdomain levels (e.g., *.example.com covers mail.example.com but not test.mail.example.com). Security considerations include increased impact if the private key is compromised since all subdomains are affected."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations",
    contextSummary: "Threats, Vulnerabilities, and Mitigations is a comprehensive domain covering threat actors and their motivations, common attack vectors, types of vulnerabilities, indicators of malicious activity, and security mitigation techniques. This domain equips security professionals to identify potential threats, understand attack methodologies, detect malicious activities, and implement appropriate countermeasures. Mastery of this domain is essential for proactive threat hunting, incident response, and building defense-in-depth strategies."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations",
    contextSummary: "This objective examines different categories of threat actors (nation-states, hacktivists, organized crime, insider threats, unskilled attackers), their attributes (resources, sophistication, internal vs external), and motivations (financial gain, espionage, disruption, revenge, political beliefs). Understanding threat actor profiles helps security teams anticipate attack methods, prioritize defenses, and tailor security strategies based on the most likely threats to their organization."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors",
    contextSummary: "Threat actors are individuals, groups, or entities that pose security risks to organizations through malicious activities or unintentional actions. Different threat actors possess varying levels of resources, technical sophistication, persistence, and motivations, requiring different defensive strategies. Understanding threat actor types helps organizations assess risk, prioritize security investments, and implement appropriate controls based on the threats most relevant to their industry and assets."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors > Nation-state",
    contextSummary: "Nation-state threat actors are government-sponsored groups with extensive resources, advanced capabilities, and long-term strategic objectives such as espionage, intellectual property theft, or critical infrastructure disruption. These actors have access to zero-day exploits, custom malware, and can sustain multi-year campaigns. Nation-state attacks target government agencies, defense contractors, critical infrastructure, and organizations with valuable intelligence or strategic assets."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors > Nation-state > Advanced persistent threat (APT)",
    contextSummary: "Advanced Persistent Threat (APT) refers to sophisticated, long-term campaigns typically conducted by nation-state actors or well-funded groups that maintain persistent access to target networks. APTs use advanced techniques, custom malware, social engineering, and zero-day exploits to infiltrate, move laterally, and exfiltrate data over extended periods while evading detection. APT groups are named and tracked by security researchers (e.g., APT28, APT29) based on their tools, tactics, and procedures."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors > Unskilled attacker",
    contextSummary: "Unskilled attackers (also called script kiddies) are individuals with limited technical knowledge who use pre-built tools, scripts, or exploit kits created by others to conduct attacks. While less sophisticated, unskilled attackers are numerous, unpredictable, and can cause damage through automated attacks, social engineering, or exploiting known vulnerabilities. Their attacks are typically opportunistic rather than targeted and can be defeated with basic security hygiene."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors > Hacktivist",
    contextSummary: "Hacktivists are individuals or groups who use hacking techniques to promote political agendas, social causes, or ideological beliefs. Common hacktivist activities include website defacement, DDoS attacks, data leaks, and disruption of services to draw attention to their cause. Groups like Anonymous have conducted high-profile hacktivist campaigns, and while their technical sophistication varies, they can be persistent and willing to face legal consequences for their beliefs."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors > Insider threat",
    contextSummary: "Insider threats are current or former employees, contractors, or business partners with authorized access who intentionally or unintentionally cause harm to the organization. Malicious insiders may steal data, sabotage systems, or commit fraud, while negligent insiders create risks through careless behavior. Insider threats are particularly dangerous because they bypass perimeter defenses, understand organizational weaknesses, and have legitimate access that makes detection difficult."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors > Organized crime",
    contextSummary: "Organized crime groups are profit-driven threat actors operating sophisticated cybercriminal enterprises involving ransomware, banking trojans, credit card fraud, identity theft, and dark web marketplaces. These groups have business-like structures, specialized roles, customer support for ransomware victims, and affiliate programs. Organized cybercrime is a multi-billion dollar industry with groups like REvil, Conti, and LockBit operating as professional criminal organizations."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Threat actors > Shadow IT",
    contextSummary: "Shadow IT refers to information technology systems, devices, software, applications, and services used within organizations without explicit IT department approval or knowledge. While not malicious actors, shadow IT creates security risks through unmanaged access, lack of security controls, data leakage, and compliance violations. Common examples include employees using personal cloud storage, unapproved collaboration tools, or consumer-grade applications for business purposes."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Attributes of threat actors",
    contextSummary: "Threat actor attributes are characteristics that define their capabilities, resources, origin, and operational methods. Key attributes include whether they are internal or external to the organization, the level of resources and funding available, and their technical sophistication and capability. Understanding these attributes helps security teams assess the severity of threats, predict attack methods, and allocate defensive resources appropriately."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Attributes of threat actors > Internal",
    contextSummary: "Internal threat actors are individuals with authorized access to organizational systems, networks, and data, including employees, contractors, business partners, or vendors. Internal actors have legitimate credentials, understand organizational processes and weaknesses, and can bypass perimeter security controls. Their actions may be malicious (intentional data theft, sabotage) or unintentional (accidental data exposure, security policy violations), both requiring different mitigation strategies."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Attributes of threat actors > External",
    contextSummary: "External threat actors are individuals or groups outside the organization who attempt to gain unauthorized access to systems and data. External threats include nation-states, cybercriminals, hacktivists, and competitors who must overcome perimeter defenses, authentication mechanisms, and security controls. External attackers typically use reconnaissance, social engineering, exploit vulnerabilities, or supply chain attacks to gain initial access."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Attributes of threat actors > Resources/funding",
    contextSummary: "Resources and funding determine a threat actor's capabilities, including access to advanced tools, zero-day exploits, skilled personnel, and infrastructure for sustained campaigns. Nation-states and organized crime have substantial resources enabling custom malware development, long-term operations, and sophisticated attacks, while unskilled attackers have limited resources and rely on free tools. Resource levels directly correlate with attack sophistication, persistence, and difficulty of defense."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Attributes of threat actors > Level of sophistication/capability",
    contextSummary: "Level of sophistication and capability reflects a threat actor's technical expertise, tool development skills, operational security, and ability to conduct complex, multi-stage attacks. Sophisticated actors like APT groups develop custom malware, use multiple zero-days, and employ advanced evasion techniques, while less sophisticated actors use publicly available tools and exploit known vulnerabilities. Sophistication levels guide defensive strategies, with advanced threats requiring threat hunting, behavioral analysis, and proactive defense."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors",
    contextSummary: "Threat actor motivations are the underlying goals and objectives driving malicious activities, ranging from financial gain to political beliefs to personal revenge. Understanding motivations helps predict target selection, attack methods, and persistence levels. Common motivations include data exfiltration, espionage, service disruption, blackmail, financial gain, philosophical/political beliefs, ethical hacking, revenge, chaos/disruption, and warfare, each requiring different defensive priorities."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Data exfiltration",
    contextSummary: "Data exfiltration is the unauthorized transfer of data from an organization, motivated by selling information, competitive advantage, espionage, or compliance violations. Attackers target intellectual property, customer data, financial records, trade secrets, and personally identifiable information (PII). Data exfiltration attacks emphasize stealth and persistence, using techniques like slow data transfers, encrypted channels, and legitimate cloud services to avoid detection."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Espionage",
    contextSummary: "Espionage involves stealing confidential information for strategic, political, military, or economic advantage, typically conducted by nation-state actors or competitors. Cyber espionage targets government secrets, military technology, intellectual property, diplomatic communications, and strategic plans. Espionage campaigns are often long-term, sophisticated operations that prioritize stealth over disruption to maintain ongoing access to valuable intelligence."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Service disruption",
    contextSummary: "Service disruption aims to interrupt business operations, deny service availability, or damage organizational reputation through DDoS attacks, system sabotage, or infrastructure attacks. Motivations include hacktivism, competitive sabotage, extortion, or diversion tactics during other attacks. Service disruption can cause financial losses, customer dissatisfaction, and regulatory penalties, making availability a critical security objective."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Blackmail",
    contextSummary: "Blackmail involves threatening to release sensitive information, disrupt operations, or cause harm unless demands (typically financial) are met. Ransomware is a form of digital blackmail that encrypts data and demands payment for decryption. Other blackmail tactics include threatening to expose data breaches, publish stolen information, or execute DDoS attacks, leveraging fear and urgency to coerce victims into compliance."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Financial gain",
    contextSummary: "Financial gain is the most common threat actor motivation, driving cybercriminals to conduct ransomware attacks, steal credit card data, commit wire fraud, operate cryptojacking operations, and sell stolen information. Financially motivated attacks are pragmatic and opportunistic, targeting organizations based on likelihood of payment, data value, and ease of exploitation. The profitability of cybercrime has created a thriving underground economy with specialized services and tools."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Philosophical/political beliefs",
    contextSummary: "Philosophical or political beliefs motivate hacktivists and ideologically driven actors to conduct attacks supporting their causes, protesting policies, or promoting social change. These actors target organizations, governments, or entities they view as opposing their values. While less sophisticated than APTs, politically motivated actors can be persistent, creative, and willing to face legal consequences, making them unpredictable and potentially damaging."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Ethical",
    contextSummary: "Ethical motivations drive white-hat hackers and security researchers to identify vulnerabilities and improve security through authorized penetration testing, bug bounty programs, and responsible disclosure. Ethical hackers follow rules of engagement, obtain permission before testing, and report findings to help organizations fix vulnerabilities. Their work strengthens security ecosystems, though gray-hat hackers may blur ethical boundaries by testing systems without explicit permission."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Revenge",
    contextSummary: "Revenge motivates disgruntled employees, terminated contractors, or individuals who feel wronged to retaliate against organizations through data theft, sabotage, or disclosure of confidential information. Revenge-driven attacks can be highly targeted, leveraging insider knowledge of systems and vulnerabilities. The emotional nature of revenge can lead to reckless, destructive actions with less concern for consequences, making these insiders particularly dangerous."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > Disruption/chaos",
    contextSummary: "Disruption and chaos motivations drive attackers who seek to cause maximum damage, confusion, or disorder without specific financial or political goals. These attackers may release destructive malware, conduct random attacks, or create widespread disruption for entertainment or notoriety. While less common than other motivations, chaos-driven attacks can be highly damaging due to their unpredictability and lack of negotiation opportunities."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Compare and contrast common threat actors and motivations > Motivations of threat actors > War",
    contextSummary: "Warfare motivations drive nation-state actors to conduct cyber operations as part of military conflicts, including attacking critical infrastructure, disrupting communications, spreading propaganda, and degrading enemy capabilities. Cyber warfare can precede or accompany kinetic military operations, targeting power grids, financial systems, transportation, and command-and-control systems. These attacks represent the most serious threat level, potentially causing physical damage and loss of life."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces",
    contextSummary: "This objective covers the pathways and entry points attackers use to compromise systems, including message-based vectors (email, SMS, IM), file and image-based attacks, vulnerable software, unsupported systems, unsecure networks, open ports, default credentials, supply chain risks, and human-targeted social engineering. Understanding threat vectors helps organizations identify and protect their attack surface by implementing layered defenses at each potential entry point."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Message-based",
    contextSummary: "Message-based threat vectors use communication channels like email, SMS, instant messaging, and social media to deliver malware, phishing links, or malicious attachments. These vectors exploit user trust, urgency, and curiosity to trick recipients into opening attachments, clicking links, or revealing credentials. Message-based attacks are highly effective due to their scale, social engineering techniques, and ability to bypass technical controls by targeting human vulnerabilities."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Message-based > Email",
    contextSummary: "Email is the most common threat vector, used to deliver phishing attacks, malware, ransomware, business email compromise, and spam. Attackers use spoofed sender addresses, malicious attachments, embedded links, and social engineering to compromise recipients. Email security requires multi-layered defenses including spam filters, malware scanning, link protection, DMARC/SPF/DKIM authentication, and user training to recognize suspicious messages."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Message-based > Short Message Service (SMS)",
    contextSummary: "SMS (text messaging) is used as a threat vector through smishing (SMS phishing) attacks that send fraudulent text messages with malicious links, fake alerts, or requests for sensitive information. SMS attacks exploit trust in text messages, bypass email filters, and leverage mobile device vulnerabilities. Common SMS threats include fake delivery notifications, banking alerts, account verification requests, and two-factor authentication bypasses."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Message-based > Instant messaging (IM)",
    contextSummary: "Instant messaging platforms (Slack, Teams, WhatsApp, Telegram) serve as threat vectors for malware distribution, phishing, and social engineering attacks. Attackers exploit the informal, trusted nature of IM communications and the prevalence of link sharing. IM threats include malicious file shares, credential harvesting, impersonation attacks, and malware that spreads through contact lists, requiring security controls like link scanning, file inspection, and user awareness."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Message-based > Web / Social Media",
    contextSummary: "Web and social media platforms serve as threat vectors through malicious advertisements, compromised websites, fake profiles, phishing campaigns, and misinformation spread. Attackers use social engineering, clickbait, fake news, and impersonation on platforms like Facebook, Twitter, LinkedIn to distribute malware, harvest credentials, or manipulate users. Social media threats leverage trust networks, viral sharing, and the volume of content to evade detection and reach large audiences."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Image-based",
    contextSummary: "Image-based threat vectors hide malicious code or payloads within image files using steganography or exploit vulnerabilities in image processing libraries. Attackers embed malware in image metadata, use polyglot files that function as both images and executables, or exploit buffer overflows in image parsers. Image-based threats are effective because images are commonly shared, often bypass security scanning, and users don't expect images to contain executable code."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > File-based",
    contextSummary: "File-based threat vectors use malicious documents, executables, scripts, and archives to deliver malware through downloads, email attachments, file shares, or removable media. Common file types include weaponized Office documents with macros, PDFs with exploits, executable files disguised with multiple extensions, and compressed archives that evade scanning. File-based attacks exploit user trust, social engineering, and vulnerabilities in file parsing to execute malicious code."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Voice call",
    contextSummary: "Voice calls are used as threat vectors through vishing (voice phishing) where attackers impersonate legitimate entities like banks, tech support, or government agencies to manipulate victims into revealing sensitive information or performing actions. Vishing exploits urgency, authority, and fear through spoofed caller IDs, social engineering scripts, and psychological manipulation. Voice calls can bypass written communication filters and leverage human psychology more effectively than text-based attacks."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Removable device",
    contextSummary: "Removable devices like USB drives, external hard drives, and SD cards serve as threat vectors for malware delivery, data exfiltration, and air-gap bridge attacks. Attackers use malicious USB devices with hidden payloads, BadUSB attacks that reprogram firmware, or social engineering by leaving infected drives in public places. Removable devices bypass network security controls and can compromise air-gapped systems, requiring physical access controls and endpoint protection."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Vulnerable software",
    contextSummary: "Vulnerable software contains security flaws, bugs, or weaknesses that attackers exploit to gain unauthorized access, execute code, or cause denial of service. Vulnerabilities arise from coding errors, design flaws, missing input validation, insecure configurations, or outdated components. Timely patching, vulnerability scanning, secure development practices, and security testing are essential to reduce the attack surface created by vulnerable software."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Vulnerable software > Client-based",
    contextSummary: "Client-based vulnerable software includes applications running on user devices such as web browsers, office suites, PDF readers, media players, and email clients. Client-side vulnerabilities are exploited through malicious websites, documents, or files that users interact with. Common client-side attacks include drive-by downloads, exploit kits, and malicious macros, requiring endpoint protection, application patching, and browser security features like sandboxing."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Vulnerable software > Agentless",
    contextSummary: "Agentless vulnerabilities exist in software that doesn't require client-side agents or installations, such as web applications, network services, APIs, and cloud services accessed through browsers or built-in protocols. Agentless vulnerabilities are exploited remotely through network attacks, injection flaws, authentication bypasses, or API abuse. While agentless systems reduce client-side management, they still require server-side security controls, input validation, and secure coding practices."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Unsupported systems and applications",
    contextSummary: "Unsupported systems and applications are software or hardware that no longer receive security updates, patches, or vendor support due to end-of-life (EOL) status. These systems accumulate vulnerabilities over time without remediation options, making them prime targets for attackers. Common examples include Windows XP, Windows Server 2003, and legacy applications, requiring isolation, compensating controls, or replacement to maintain security."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Unsecure networks",
    contextSummary: "Unsecure networks lack proper encryption, authentication, or access controls, exposing data to interception, eavesdropping, and man-in-the-middle attacks. Common unsecure networks include open Wi-Fi hotspots, improperly configured wireless networks, unencrypted Bluetooth connections, and legacy wired networks without port security. Users connecting to unsecure networks risk credential theft, session hijacking, and malware injection, requiring VPNs and encrypted protocols for protection."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Unsecure networks > Wireless",
    contextSummary: "Unsecure wireless networks using weak encryption (WEP), no authentication, or open access points allow attackers to intercept traffic, steal credentials, and perform man-in-the-middle attacks. Wireless vulnerabilities include rogue access points, evil twin attacks, deauthentication attacks, and WPS vulnerabilities. Securing wireless networks requires strong encryption (WPA3), enterprise authentication (802.1X), network segmentation, and wireless intrusion detection systems."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Unsecure networks > Wired",
    contextSummary: "Unsecure wired networks without port security, VLANs, or network access control allow unauthorized physical access to plug in devices and gain network connectivity. Wired network threats include unauthorized network jacks, rogue devices, MAC address spoofing, and physical taps. Securing wired networks requires 802.1X authentication, port security, disabled unused ports, physical security for network equipment, and network access control (NAC) solutions."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Unsecure networks > Bluetooth",
    contextSummary: "Unsecure Bluetooth connections using default PINs, discoverable mode, or weak pairing mechanisms enable bluejacking, bluesnarfing, and unauthorized device pairing attacks. Bluetooth vulnerabilities allow attackers to intercept communications, access device data, or use paired devices as entry points to networks. Bluetooth security requires disabling discoverability when not needed, using strong authentication, keeping firmware updated, and avoiding public pairing."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Open service ports",
    contextSummary: "Open service ports are network ports listening for connections that expand the attack surface by providing entry points for attackers to probe for vulnerabilities, exploit services, or conduct reconnaissance. Unnecessary open ports create opportunities for brute-force attacks, service exploitation, and information disclosure. Security best practices include closing unused ports, using firewalls to restrict access, disabling unnecessary services, and regular port scanning to validate configurations."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Default credentials",
    contextSummary: "Default credentials are pre-configured usernames and passwords (like admin/admin or admin/password) that manufacturers set on devices and applications, creating significant security risks when not changed. Attackers use lists of common default credentials to gain unauthorized access to routers, IoT devices, databases, and network equipment. Changing default credentials immediately upon deployment is a critical security practice to prevent easy compromise."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Supply chain",
    contextSummary: "Supply chain threat vectors involve compromising hardware, software, or services during development, distribution, or support processes before reaching end users. Supply chain attacks can inject backdoors, malware, or vulnerabilities at the manufacturer, distributor, service provider, or update mechanism level. High-profile examples include SolarWinds and Kaseya attacks, making supply chain security critical through vendor assessment, code signing verification, and third-party risk management."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Supply chain > Managed service providers (MSPs)",
    contextSummary: "Managed Service Providers (MSPs) are third-party companies that manage IT infrastructure, security, and operations for multiple clients, making them high-value targets for supply chain attacks. Compromising an MSP provides attackers with access to multiple downstream customers simultaneously. MSP security risks require strong authentication, network segmentation between clients, monitoring of MSP access, and contractual security requirements including incident response procedures."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Supply chain > Vendors",
    contextSummary: "Vendors supplying software, hardware, or services can introduce supply chain risks through vulnerable products, malicious inserts, backdoors, or inadequate security practices. Vendor compromise can affect all customers using their products or services. Vendor risk management includes security assessments, code review, software bill of materials (SBOM), contractual security requirements, and continuous monitoring of vendor security posture and breach notifications."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Supply chain > Suppliers",
    contextSummary: "Suppliers provide components, raw materials, or services that feed into products or operations, creating supply chain dependencies and potential security risks. Supplier compromises can introduce counterfeit components, hardware implants, or substandard security practices that affect final products. Supply chain security for suppliers requires provenance verification, quality assurance, secure logistics, and supply chain transparency through audits and certifications."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering",
    contextSummary: "Human vectors and social engineering exploit psychological manipulation, trust, and human error rather than technical vulnerabilities to compromise security. Common techniques include phishing, vishing, smishing, pretexting, impersonation, and manipulation tactics leveraging urgency, authority, or fear. Social engineering is highly effective because humans are often the weakest link in security, requiring security awareness training, skepticism toward unsolicited requests, and verification procedures."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Phishing",
    contextSummary: "Phishing uses fraudulent emails, websites, or messages impersonating legitimate entities to trick victims into revealing credentials, financial information, or installing malware. Phishing attacks range from mass campaigns with generic messages to spear phishing targeting specific individuals with personalized content. Indicators include suspicious sender addresses, urgent language, spelling errors, suspicious links, unexpected attachments, and requests for sensitive information."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Vishing",
    contextSummary: "Vishing (voice phishing) uses phone calls to impersonate banks, tech support, government agencies, or colleagues to manipulate victims into revealing information or performing actions. Vishing attackers use caller ID spoofing, convincing scripts, urgency tactics, and psychological pressure. Common vishing scenarios include fake IRS calls, tech support scams, banking fraud alerts, and executive impersonation requesting urgent wire transfers."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Smishing",
    contextSummary: "Smishing (SMS phishing) uses text messages to deliver phishing attacks, often with shortened URLs that obscure destinations and malicious links that download malware or redirect to fake websites. Smishing messages impersonate delivery services, banks, government agencies, or employers using urgent language to prompt immediate action. The mobile context and trust in SMS make smishing effective at bypassing email filters and catching users off-guard."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Pharming",
    contextSummary: "Pharming redirects users from legitimate websites to malicious sites without their knowledge by poisoning DNS caches, modifying host files, or exploiting router vulnerabilities. Unlike phishing which requires user action, pharming automatically redirects users even when they type correct URLs. Pharming attacks steal credentials and sensitive data from users who believe they're on legitimate sites, requiring DNS security (DNSSEC), secure DNS servers, and certificate validation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Misinformation/disinformation",
    contextSummary: "Misinformation (false information spread unintentionally) and disinformation (false information spread deliberately) manipulate public opinion, damage reputations, influence decisions, or create confusion. In cybersecurity contexts, misinformation can spread false threat warnings, fake security updates, or fraudulent security advice. Disinformation campaigns may target organizations through fake news, manipulated media, or coordinated social media attacks to damage brands or influence stakeholders."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Impersonation",
    contextSummary: "Impersonation involves pretending to be someone else—executives, IT support, vendors, or colleagues—to gain trust and manipulate victims into providing information or access. Impersonation attacks exploit authority, familiarity, and social norms. Techniques include spoofed emails, fake caller IDs, stolen credentials, and physical impersonation with fake badges or uniforms. Verification procedures, out-of-band confirmation, and awareness of impersonation tactics are essential defenses."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Impersonation > Persuasive/consensus/liking",
    contextSummary: "These social engineering principles exploit human psychology through persuasion (logical arguments), consensus (everyone else is doing it), and liking (building rapport or similarity). Attackers use these techniques to lower defenses by seeming reasonable, citing social proof of others complying, or creating friendly connections before making requests. These psychological tactics make victims more likely to comply with requests that would otherwise seem suspicious."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Impersonation > Coercion/threat/urgency",
    contextSummary: "Coercion, threats, and urgency tactics pressure victims into immediate action without time for reflection or verification. Attackers create artificial time constraints (account will be closed, legal action pending) or imply consequences for non-compliance. Urgency and fear override rational decision-making, causing victims to bypass normal security procedures. Effective defenses include policies requiring verification for urgent requests and training to recognize artificial urgency."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Business email compromise",
    contextSummary: "Business Email Compromise (BEC) is a sophisticated scam where attackers impersonate executives, vendors, or business partners via email to trick employees into transferring funds or revealing sensitive information. BEC attacks often involve extensive reconnaissance, spoofed domains, compromised email accounts, and social engineering. Common scenarios include CEO fraud (fake executive requesting wire transfer), vendor payment redirection, and W-2 information requests targeting HR departments."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Pretexting",
    contextSummary: "Pretexting creates fabricated scenarios or identities to manipulate victims into providing information or access. Attackers research targets, create convincing cover stories (IT support, vendor, auditor), and use details to establish credibility. Pretexting may involve multiple interactions to build trust before making the actual request. Effective against help desks, customer service, and administrative staff, pretexting requires verification procedures and awareness of common pretext scenarios."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Watering hole",
    contextSummary: "Watering hole attacks compromise websites frequently visited by target victims (industry forums, news sites, professional associations) to infect visitors with malware. Like predators at a watering hole, attackers identify where targets congregate online and poison those sites. Watering hole attacks are sophisticated, targeting specific groups rather than mass audiences, and exploit trust in legitimate websites. Defenses include web filtering, endpoint protection, and browser isolation."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Brand impersonation",
    contextSummary: "Brand impersonation uses fake websites, emails, or social media accounts mimicking trusted brands (banks, tech companies, shipping services) to trick victims into revealing credentials or payment information. Attackers register similar domains, copy logos and branding, and create convincing fake communications. Brand impersonation exploits user trust in established companies and is commonly used in phishing campaigns, requiring user vigilance in verifying URLs and email sources."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain common threat vectors and attack surfaces > Human vectors/social engineering > Typosquatting",
    contextSummary: "Typosquatting (URL hijacking) registers domain names similar to popular websites to capture users who make typing errors (gogle.com instead of google.com). Typosquatting sites may host malware, phishing pages, malicious advertisements, or redirect to competitor sites. Attackers exploit common typos, alternative TLDs (.cm instead of .com), and character substitutions. Organizations protect brands by registering common typosquatting variants and monitoring for abusive domains."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities",
    contextSummary: "This objective covers different categories of vulnerabilities including application vulnerabilities (memory injection, buffer overflows, race conditions), operating system vulnerabilities, web-based vulnerabilities (SQL injection, XSS), hardware/firmware vulnerabilities, virtualization vulnerabilities, and cloud-specific vulnerabilities. Understanding vulnerability types helps security professionals identify weaknesses, prioritize patching, implement appropriate controls, and conduct effective vulnerability assessments."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Application",
    contextSummary: "Application vulnerabilities are security flaws in software code, logic, or design that attackers exploit to compromise confidentiality, integrity, or availability. Common application vulnerabilities include memory corruption (buffer overflows, use-after-free), injection flaws, authentication bypasses, insecure deserialization, and race conditions. Application security requires secure coding practices, input validation, security testing, code review, and timely patching of discovered vulnerabilities."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Application > Memory injection",
    contextSummary: "Memory injection vulnerabilities allow attackers to insert malicious code into application memory and execute it, bypassing security controls. Types include code injection (inserting executable code), DLL injection (forcing applications to load malicious libraries), and process injection (injecting code into running processes). Memory injection enables privilege escalation, credential theft, and persistent malware. Defenses include Data Execution Prevention (DEP), Address Space Layout Randomization (ASLR), and Control Flow Guard."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Application > Buffer overflow",
    contextSummary: "Buffer overflow vulnerabilities occur when programs write more data to a buffer than it can hold, overwriting adjacent memory and potentially allowing attackers to execute arbitrary code or crash applications. Stack-based and heap-based buffer overflows can be exploited to hijack program execution, inject malicious code, or bypass security controls. Modern protections include stack canaries, ASLR, DEP, and safe programming languages with automatic bounds checking."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Application > Race conditions",
    contextSummary: "Race conditions occur when program behavior depends on timing or sequence of events, creating windows where attackers can manipulate state between check and use operations. Race conditions can lead to privilege escalation, bypassing authentication, or data corruption. Classic examples include TOCTOU (Time-of-Check-Time-of-Use) vulnerabilities where file permissions are checked before use, allowing modification in between. Prevention requires atomic operations, proper locking, and avoiding time-sensitive security checks."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Application > Race conditions > Time-of-check (TOC)",
    contextSummary: "Time-of-check (TOC) is the first part of a TOCTOU race condition where the program checks a condition, permission, or resource state. In TOC vulnerabilities, the check operation verifies security conditions (file permissions, authentication status, resource availability) but doesn't guarantee the condition remains unchanged until use. Attackers exploit the time gap between check and use to modify state, creating a race condition vulnerability."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Application > Race conditions > Time-of-use (TOU)",
    contextSummary: "Time-of-use (TOU) is the second part of a TOCTOU race condition where the program acts on the resource after the check, assuming conditions haven't changed. TOU vulnerabilities occur when attackers modify resources, permissions, or state between the check operation and the use operation. Classic example: checking file permissions, attacker swapping the file with a symlink to a privileged file, then the program uses the privileged file. Prevention requires atomic check-and-use operations."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Application > Malicious update",
    contextSummary: "Malicious update vulnerabilities occur when software update mechanisms are compromised to distribute malware instead of legitimate updates. Attackers may compromise update servers, perform man-in-the-middle attacks on unencrypted update channels, or exploit weak code signing verification. Malicious updates affect all users trusting the update mechanism simultaneously, making them high-impact supply chain attacks. Protection requires code signing, encrypted update channels, certificate pinning, and update verification."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Operating system (OS)-based",
    contextSummary: "Operating system vulnerabilities are security flaws in OS kernels, system services, drivers, or core components that can compromise entire systems. OS vulnerabilities enable privilege escalation, system crashes, unauthorized access, or complete system compromise. Common OS vulnerabilities include kernel exploits, privilege escalation flaws, driver vulnerabilities, and insecure default configurations. OS security requires timely patching, hardening, minimal installation, and security monitoring."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Web-based",
    contextSummary: "Web-based vulnerabilities are security flaws in web applications, web servers, or web protocols that attackers exploit through HTTP/HTTPS interactions. Common web vulnerabilities include injection flaws (SQL, command, LDAP), cross-site scripting (XSS), cross-site request forgery (CSRF), insecure authentication, and broken access controls. The OWASP Top 10 lists the most critical web application security risks, guiding developers and security teams in securing web applications."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Web-based > Structured Query Language injection (SQLi)",
    contextSummary: "SQL injection (SQLi) vulnerabilities allow attackers to inject malicious SQL code into application queries, enabling unauthorized database access, data theft, modification, or deletion. SQLi occurs when applications concatenate user input directly into SQL statements without validation or parameterization. Attackers can bypass authentication, dump entire databases, or execute administrative commands. Prevention requires parameterized queries (prepared statements), input validation, least privilege database accounts, and web application firewalls."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Web-based > Cross-site scripting (XSS)",
    contextSummary: "Cross-site scripting (XSS) vulnerabilities allow attackers to inject malicious scripts into web pages viewed by other users, executing in victims' browsers with the web application's trust level. XSS types include stored (persistent in database), reflected (in URL parameters), and DOM-based (client-side manipulation). XSS enables session hijacking, credential theft, defacement, and malware distribution. Prevention requires output encoding, Content Security Policy (CSP), input validation, and proper context-aware sanitization."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Hardware",
    contextSummary: "Hardware vulnerabilities are security flaws in physical components, processors, memory, or peripheral devices that can be exploited to compromise systems. Hardware vulnerabilities may result from design flaws, manufacturing defects, or intentional backdoors. Examples include Spectre/Meltdown processor vulnerabilities, DMA attacks through peripheral devices, and firmware-level exploits. Hardware vulnerabilities are particularly serious because they affect multiple systems and may require hardware replacement rather than software patches."
  },
  {
    fullPath: "Threats, Vulnerabilities, and Mitigations > Explain various types of vulnerabilities > Hardware > Firmware",
    contextSummary: "Firmware vulnerabilities are security flaws in low-level software embedded in hardware devices that controls hardware functions. Firmware runs with high privileges and persists across reboots, making firmware vulnerabilities particularly dangerous. Examples include BIOS/UEFI vulnerabilities, router firmware exploits, and IoT device firmware flaws. Firmware attacks can survive OS reinstallation and are difficult to detect. Protection requires firmware updates, secure boot, verified boot, and firmware integrity monitoring."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch4)
}

export { batch4 }
