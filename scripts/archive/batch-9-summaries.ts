/**
 * Context Summaries Batch 9 (Remaining Missing Entities - Part 1)
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch9 = [
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Web filter > Universal Resource Locator (URL) scanning",
    contextSummary: "URL scanning examines requested web addresses against databases of known malicious sites, phishing domains, malware distribution points, and categorized content to block access before pages load. URL scanning uses real-time reputation lookups, categorization databases, and threat intelligence feeds identifying newly identified malicious sites. Effective URL scanning requires frequent database updates, multiple reputation sources to minimize false negatives, SSL inspection to examine encrypted traffic, and allowing legitimate miscategorized sites through exception processes."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Operating system security > SELinux",
    contextSummary: "SELinux (Security-Enhanced Linux) is a Linux mandatory access control (MAC) framework that restricts program capabilities beyond traditional file permissions, confining applications and daemons to defined security policies that prevent compromised applications from accessing unauthorized resources. SELinux uses complex policy files defining allowed actions, operates in enforcing mode (blocking violations) or permissive mode (logging only), and requires understanding of security contexts. Enabling and configuring SELinux enhances Linux security but requires troubleshooting policy violations, understanding audit logs, and maintaining policies as systems change."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > DNS filtering",
    contextSummary: "DNS filtering blocks access to malicious or inappropriate websites by intercepting DNS queries and refusing to resolve domains associated with malware, phishing, command-and-control servers, or policy-violating categories. DNS filtering operates at network infrastructure level (firewall, DNS server) or endpoint level, preventing connections before HTTP requests occur. Implementation provides simple deployment, works across all applications and protocols, prevents DNS-based attacks (DNS tunneling, DGA domains), but can be bypassed by using alternative DNS servers or direct IP connections requiring additional controls."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Email security",
    contextSummary: "Email security protects against spam, phishing, malware, business email compromise, and data leakage through authentication protocols (DMARC, DKIM, SPF), email gateways filtering malicious content, DLP scanning outbound mail, and encryption. Email security is critical as email remains the primary attack vector for phishing, ransomware delivery, and credential theft. Comprehensive email security combines anti-spam filtering, malware scanning, URL rewriting and sandboxing, authentication verification, encryption for sensitive content, and user training to recognize threats."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Email security > Domain-based Message Authentication Reporting and Conformance (DMARC)",
    contextSummary: "DMARC (Domain-based Message Authentication, Reporting and Conformance) is an email authentication protocol that allows domain owners to specify how receivers should handle messages that fail SPF or DKIM validation, preventing email spoofing and phishing. DMARC policies instruct receivers to quarantine, reject, or accept failing messages, and provide reports showing authentication results and potential abuse. DMARC implementation requires publishing DNS records, monitoring reports to ensure legitimate email passes, and gradually moving from monitor mode to enforcement reducing spoofed emails using your domain."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Email security > DomainKeys Identified Mail (DKIM)",
    contextSummary: "DKIM (DomainKeys Identified Mail) uses cryptographic signatures to verify that email content hasn't been tampered with during transit and that it genuinely originated from the claimed sending domain. DKIM works by servers signing outbound messages with private keys, and receivers verifying signatures using public keys published in DNS. DKIM prevents email content modification in transit, validates sending domain, and when combined with SPF and DMARC, provides strong email authentication reducing phishing and spoofing effectiveness."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Email security > Sender Policy Framework (SPF)",
    contextSummary: "SPF (Sender Policy Framework) is an email authentication method that specifies which mail servers are authorized to send email for a domain, helping receivers detect forged sender addresses and reduce spam/phishing. SPF works through DNS records listing authorized sending IP addresses or servers, with receivers checking if sending server matches authorized list. SPF prevents simple email spoofing but doesn't protect against forwarding scenarios, requires maintaining accurate IP lists as infrastructure changes, and works best combined with DKIM and DMARC for comprehensive authentication."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Email security > Gateway",
    contextSummary: "Email gateways (also called email security gateways or SEGs) are dedicated appliances or cloud services that filter all inbound and outbound email, blocking malware, spam, phishing attempts, and enforcing data loss prevention policies. Gateways scan attachments and URLs, rewrite URLs to check destinations before users click, sandbox suspicious files, encrypt sensitive content, and provide quarantine management. Gateway placement can be cloud-based (filtering before reaching mail servers), on-premises (physical or virtual appliances), or hybrid, with cloud gaining popularity for threat intelligence updates and scalability."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > File integrity monitoring",
    contextSummary: "File Integrity Monitoring (FIM) tracks changes to critical system files, configurations, and binaries by creating cryptographic hashes and alerting when files are modified, detecting unauthorized changes that could indicate compromise or policy violations. FIM monitors operating system files, application binaries, configuration files, and sensitive data, comparing current state against baselines and alerting on unexpected changes. FIM implementation requires defining critical files to monitor, establishing change windows for legitimate updates, integrating alerts with incident response, and using FIM for compliance (PCI DSS requirement 11.5)."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > DLP",
    contextSummary: "Data Loss Prevention (DLP) monitors data in use, in transit, and at rest to detect and prevent unauthorized transmission, access, or storage of sensitive information through content inspection, contextual analysis, and policy enforcement. DLP identifies sensitive data through pattern matching (credit cards, SSNs), keywords, document fingerprinting, or classification labels; monitors endpoints, email, web traffic, and cloud storage; and enforces policies by blocking, alerting, encrypting, or quarantining. Effective DLP requires classifying sensitive data, defining policies balancing security with productivity, tuning to reduce false positives, and user training."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Network access control (NAC)",
    contextSummary: "Network Access Control (NAC) enforces security policies before allowing devices to connect to networks, verifying device compliance, user authentication, and security posture before granting access. NAC can check for updated antivirus, OS patches, host firewall status, and authorized device status, placing non-compliant devices in quarantine VLANs with limited access for remediation. NAC implementations include 802.1X for wired/wireless authentication, posture assessment agents checking compliance, and guest network isolation, providing visibility and control over which devices access corporate resources."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > Endpoint detection and response (EDR)/extended detection and response (XDR)",
    contextSummary: "EDR (Endpoint Detection and Response) continuously monitors endpoints for suspicious behaviors, provides threat detection beyond signature-based antivirus, enables investigation through forensic data collection, and facilitates response through isolation or remediation. XDR extends EDR by correlating telemetry across endpoints, networks, cloud, and email for unified threat detection and response. EDR/XDR capabilities include behavioral analysis detecting zero-days, automated response actions, threat hunting tools, root cause analysis, and integration with threat intelligence providing context-aware defense and reducing mean time to detect/respond."
  },
  {
    fullPath: "Security Operations > Given a scenario, modify enterprise capabilities to enhance security > User behavior analytics",
    contextSummary: "User and Entity Behavior Analytics (UEBA) establishes baseline patterns for user and entity behavior, then detects anomalies that could indicate compromised accounts, insider threats, or policy violations. UEBA uses machine learning to identify unusual login patterns, abnormal data access, privilege escalation, or lateral movement that rule-based systems miss. Use cases include detecting credential theft (logins from new locations), insider threats (unusual file access patterns), and compromised accounts (abnormal activity patterns), providing risk scores and context for security investigations."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Provisioning / de-provisioning user accounts",
    contextSummary: "User account provisioning creates accounts with appropriate access when employees join or change roles, while de-provisioning disables or removes accounts when employees leave, ensuring timely access grant and revocation preventing unauthorized access. Automated provisioning integrates with HR systems to trigger account creation with role-based access templates, while de-provisioning must occur immediately upon termination (especially involuntary) including disabling accounts, revoking remote access, and collecting credentials. Effective lifecycle management prevents orphaned accounts, ensures consistent access provisioning, maintains audit trails, and coordinates with managers for access approvals."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Identity proofing",
    contextSummary: "Identity proofing verifies that individuals are who they claim to be before issuing credentials or granting access, preventing account creation with false identities. Identity proofing methods include verifying government-issued IDs, knowledge-based authentication answering personal questions, documentary verification checking credentials against authoritative sources, and biometric verification. Rigor of identity proofing should match risk and compliance requirements—high-assurance applications require stronger proofing (NIST Identity Assurance Level 3) with in-person verification or biometrics."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Federation",
    contextSummary: "Identity federation allows organizations to trust identities and authentication performed by partner organizations, enabling users to access resources across organizational boundaries with single credentials. Federation uses protocols like SAML, OAuth, and OpenID Connect where identity providers authenticate users and service providers trust those assertions. Federation benefits include simplified user experience (no duplicate accounts), reduced credential management, and enabling B2B collaboration, but requires trust relationships, consistent attribute mapping, and understanding of liability when trusting external authentication."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Single sign-on (SSO)",
    contextSummary: "Single Sign-On (SSO) allows users to authenticate once and access multiple applications without re-entering credentials, improving user experience and security by reducing password fatigue and enabling stronger authentication. SSO implementations use protocols like SAML for enterprise applications, OAuth/OpenID Connect for web and mobile apps, or Kerberos for Windows environments. SSO benefits include reduced password-related help desk tickets, enabling MFA in one place protecting all apps, centralized access control, but creates single point of compromise if SSO credentials are stolen."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Single sign-on (SSO) > Lightweight Directory Access Protocol (LDAP)",
    contextSummary: "LDAP (Lightweight Directory Access Protocol) provides centralized directory services for storing user accounts, groups, and attributes that applications query for authentication and authorization. LDAP directories like Active Directory or OpenLDAP serve as identity stores for SSO systems, enabling consistent user information across applications. LDAP security requires encrypted connections (LDAPS), strong authentication, access controls limiting who can query or modify directory data, and monitoring for enumeration attempts that gather information for attacks."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Single sign-on (SSO) > Open authorization (OAuth)",
    contextSummary: "OAuth is an authorization framework enabling applications to access user resources on other services without sharing passwords, commonly used for 'Log in with Google/Facebook' scenarios and API access delegation. OAuth 2.0 uses access tokens granted by authorization servers after user consent, allowing third-party apps limited access to user data. Security considerations include validating redirect URIs preventing token theft, using authorization code flow with PKCE for public clients, short token lifetimes, and refresh token rotation reducing compromise impact."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Single sign-on (SSO) > Security Assertions Markup Language (SAML)",
    contextSummary: "SAML (Security Assertions Markup Language) is an XML-based standard for exchanging authentication and authorization data between identity providers and service providers, commonly used for enterprise SSO. SAML workflows involve users authenticating to identity providers which generate signed assertions, and service providers accepting these assertions to grant access. SAML security requires validating signatures preventing assertion forgery, short assertion validity periods, and protecting against XML signature wrapping attacks through proper validation libraries and configuration."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Interoperability",
    contextSummary: "Identity and access management interoperability enables different IAM systems, applications, and organizations to work together through standardized protocols, data formats, and interfaces. Interoperability standards include SAML for federation, SCIM for user provisioning, OAuth/OpenID Connect for modern authentication, and LDAP for directory queries. Achieving interoperability requires mapping attributes between systems (email, employee ID, role), handling protocol translations, managing trust relationships, and testing integration workflows ensuring consistent user experience across heterogeneous environments."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Attestation",
    contextSummary: "Access attestation (also called access certification) is the process where managers or system owners periodically review and affirm that users' access rights remain appropriate for their current job responsibilities. Attestation campaigns present reviewers with lists of users and their access rights, requiring explicit approval or removal, creating accountability and audit trails. Effective attestation occurs regularly (quarterly, annually), focuses on high-risk access (privileged accounts, sensitive systems), automates workflows reducing manual effort, and tracks attestation completion rates ensuring reviews actually occur."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls",
    contextSummary: "Access controls are mechanisms that restrict who can access resources and what actions they can perform, implementing security policies through authentication, authorization, and accountability. Access control models include Mandatory Access Control (centrally enforced labels), Discretionary Access Control (owner-controlled), Role-Based Access Control (permissions through job roles), Rule-Based Access Control (automated decisions based on conditions), Attribute-Based Access Control (context-aware policies), time-of-day restrictions, and least privilege principle. Effective access control combines appropriate models for different resources, regular reviews, logging for accountability, and balancing security with operational needs."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls > Mandatory",
    contextSummary: "Mandatory Access Control (MAC) enforces access policies centrally defined by system administrators based on security labels and clearances, with users unable to modify permissions on objects they create or own. MAC implements classification-based models where data is labeled (Top Secret, Secret, Confidential) and users have clearances, with access granted only when clearance level meets or exceeds data classification. MAC provides strong assurance that security policies cannot be bypassed, suits military and highly regulated environments, but requires extensive classification effort, specialized operating systems (SELinux, Trusted Solaris), and may impede collaboration."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls > Discretionary",
    contextSummary: "Discretionary Access Control (DAC) allows resource owners to control who can access their resources by setting permissions at their discretion, the most common access control model in operating systems (file permissions). DAC provides flexibility enabling collaboration and data sharing, but relies on users making good security decisions and can lead to inappropriate access if owners are careless with permissions. DAC risks include Trojan horses (malicious programs acting with user's permissions), permission creep (accumulation of unnecessary access), and difficulty enforcing consistent organizational policies when control is distributed."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls > Role-based",
    contextSummary: "Role-Based Access Control (RBAC) assigns permissions to roles representing job functions rather than to individual users, with users receiving access by assignment to appropriate roles. RBAC simplifies administration (managing roles instead of individual permissions), ensures consistency (all users in role have identical access), supports segregation of duties (mutually exclusive roles preventing fraud), and facilitates access reviews (reviewing role membership and role permissions). Effective RBAC requires well-designed roles matching organizational structure, avoiding role explosion, and periodic review of both role definitions and role assignments."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls > Rule-based",
    contextSummary: "Rule-Based Access Control uses predefined rules and conditions to automatically make access decisions based on attributes like time, location, device type, or risk level without requiring administrator intervention for each access request. Rules can enforce business logic (accountants access financial systems only during business hours), security requirements (require MFA from external networks), or compliance mandates (restrict export-controlled data by citizenship). Rule-based control enables dynamic, context-aware access decisions, scales well for large environments, but requires careful rule design to avoid unintended denials or overly permissive access."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls > Attribute-based",
    contextSummary: "Attribute-Based Access Control (ABAC) makes fine-grained access decisions by evaluating policies against attributes of users (department, clearance, role), resources (classification, owner, sensitivity), and environmental context (time, location, threat level). ABAC policies express complex conditions like 'allow access to Secret documents by users with Secret clearance in same department during business hours from corporate network.' ABAC offers flexibility exceeding simpler models but requires robust attribute management, policy authoring tools, and performant policy evaluation engines, suited for dynamic environments with complex access requirements."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls > Time-of-day restrictions",
    contextSummary: "Time-of-day restrictions limit when users can authenticate or access resources, allowing access only during approved hours (business hours for employees, specific maintenance windows for contractors). Time restrictions reduce attack windows by preventing off-hours access when malicious activity is less likely to be noticed, enforce separation between work and personal time, and demonstrate least privilege by limiting access to when it's needed. Implementation uses access control systems checking current time against user profiles, with exceptions for on-call staff and emergency access procedures."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Access controls > Least privilege",
    contextSummary: "Least privilege is the security principle of granting users the minimum permissions necessary to perform their job functions and no more, reducing attack surface, limiting damage from compromised accounts, and constraining insider threats. Implementing least privilege involves analyzing actual job requirements, starting with minimal access and adding as needed, using just-in-time elevation for temporary privilege needs, and regular reviews removing accumulated unnecessary permissions. Challenges include user resistance requesting excessive access, legacy applications requiring more privileges than necessary, and operational friction from overly restrictive access requiring balance."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Implementations > Biometrics",
    contextSummary: "Biometric authentication verifies identity through unique biological characteristics including fingerprints, facial recognition, iris scans, voice recognition, or behavioral patterns. Biometrics provide strong authentication difficult to steal or share, convenient user experience (no passwords to remember), and enable continuous authentication monitoring for session anomalies. Biometric challenges include privacy concerns, false acceptance/rejection rates, inability to change biometrics if compromised, presentation attacks (fake fingerprints), and requiring specialized hardware, making them ideal for high-security scenarios or combined with other factors."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Implementations > Hard/soft authentication tokens",
    contextSummary: "Hard tokens are physical devices generating time-based one-time passwords (TOTP), while soft tokens are applications on smartphones generating equivalent codes. Both provide possession-based authentication factor stronger than passwords alone. Hard tokens offer better security (separate device, no malware risk) but higher cost and logistics (procurement, replacement), while soft tokens leverage existing smartphones offering convenience and lower cost but creating dependency on device availability. Token-based MFA is more resistant to phishing than SMS but vulnerable to real-time phishing attacks that intercept and use codes immediately."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Implementations > Security keys",
    contextSummary: "Security keys are hardware devices implementing FIDO2/WebAuthn standards providing phishing-resistant authentication through public key cryptography and challenge-response protocols. Security keys bind authentication to specific domains preventing phishing since keys won't respond to fake sites, require user presence (touch) preventing remote attacks, and support passwordless authentication. Keys like YubiKey work across platforms and services, provide strongest MFA protection, but require users to carry devices, have backup authentication methods for loss, and face compatibility challenges with legacy systems."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Factors > Something you are",
    contextSummary: "Something you are authentication factors verify identity through biometric characteristics unique to individuals including fingerprints, facial recognition, iris/retina scans, voice patterns, or behavioral traits like typing rhythm. Biometric factors provide convenient authentication (no passwords to remember), are difficult to forge or share, enable continuous authentication, but cannot be changed if compromised and raise privacy concerns about biometric data storage. Biometric authentication should use secure storage (local device processing, encrypted templates), liveness detection preventing presentation attacks, and combine with other factors for high-assurance scenarios."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Multifactor authentication > Factors > Somewhere you are",
    contextSummary: "Somewhere you are (also called location-based authentication) uses physical or network location as an authentication factor, verifying users are in expected locations before granting access. Location verification uses GPS coordinates, IP geolocation, network detection (corporate Wi-Fi), or proximity to known devices (Bluetooth beacons). Location factors detect anomalies like impossible travel (accessing from distant locations too quickly), enable geofencing (restricting access from certain regions), and add context for risk-based authentication, but can be spoofed through VPNs or GPS manipulation requiring additional security controls."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts",
    contextSummary: "Password concepts encompass best practices for password creation, management, and policies including length, complexity, reuse prevention, expiration policies, password managers facilitating unique strong passwords, and passwordless authentication eliminating passwords entirely. Modern password guidance emphasizes length over complexity (passphrases stronger than complex short passwords), unique passwords for each account (preventing credential stuffing), password managers enabling compliance with these requirements, and moving toward passwordless methods (FIDO2, biometrics, magic links) eliminating password vulnerabilities. Organizations must balance security requirements with usability to prevent users circumventing policies through weak compliance."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Password best practices",
    contextSummary: "Password best practices have evolved from complex requirements causing user frustration toward length-focused, user-friendly approaches recommended by NIST, emphasizing long passwords or passphrases, uniqueness across accounts, checking against common/compromised password lists, and eliminating forced periodic changes that encourage predictable patterns. Modern best practices include minimum 12-15 character length, screening against breach databases (Have I Been Pwned), allowing all printable characters including spaces, requiring changes only when compromise suspected, and enabling password managers rather than imposing complexity requirements that lead to weak patterns like 'Password1!'."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Password best practices > Length",
    contextSummary: "Password length is the number of characters in a password, with longer passwords exponentially stronger against brute force attacks than short complex ones. Current recommendations favor 12-15 character minimum for user passwords, 15+ for administrative accounts, with passphrases (multiple words) providing both length and memorability. Length trumps complexity—'correct horse battery staple' (28 characters) is far stronger than 'P@ssw0rd!' despite lower complexity. Organizations should enforce minimum lengths, allow maximum lengths of 64+ characters, and consider passwordless authentication eliminating length concerns entirely."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Password best practices > Complexity",
    contextSummary: "Password complexity requirements mandate character diversity (uppercase, lowercase, numbers, symbols) to resist dictionary attacks, though modern guidance de-emphasizes complexity in favor of length and uniqueness. Traditional complexity rules (minimum 8 characters, uppercase, lowercase, number, symbol) often result in predictable patterns (Password1!, Summer2024!) as users game the requirements. Current best practices focus on screening passwords against common/breached password lists, encouraging passphrases for natural complexity, and avoiding complexity rules that reduce usability without proportional security gains."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Password best practices > Reuse",
    contextSummary: "Password reuse is using the same password across multiple accounts or systems, creating cascading risk where one compromised account enables credential stuffing attacks accessing all accounts sharing that password. Preventing reuse requires password history (blocking recently used passwords), checking against breached password databases, and encouraging password managers enabling unique passwords for each account. Organizations should prevent reuse within their systems through password history enforcement and educate users about risks of reusing work passwords on personal accounts."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Password best practices > Expiration",
    contextSummary: "Password expiration policies force periodic password changes after specified intervals (e.g., 90 days), originally intended to limit compromise windows but increasingly questioned as users create predictable patterns meeting requirements (Password1, Password2, Password3). Modern guidance from NIST and Microsoft recommends eliminating mandatory periodic expiration, requiring changes only when compromise is suspected or detected, arguing that forced expiration encourages weak passwords and doesn't significantly improve security. Exceptions include highly privileged accounts where periodic rotation provides defense-in-depth."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Password best practices > Age",
    contextSummary: "Password age policies include minimum age (preventing users from quickly cycling through password history to reuse old passwords) and maximum age (requiring password changes after specified time). Minimum age prevents gaming password history by rapidly changing passwords multiple times to return to preferred password. Maximum age (expiration) is increasingly disfavored as it encourages weak, predictable passwords. Modern recommendations maintain minimum age (1 day preventing rapid changes) while eliminating maximum age except when compromise is suspected or for privileged accounts requiring periodic rotation."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Password managers",
    contextSummary: "Password managers are applications that securely store and auto-fill passwords, enabling users to maintain unique, complex passwords for every account without memorization burden. Password managers generate strong random passwords, encrypt password vaults with master passwords, sync across devices, warn about reused or weak passwords, and integrate with browsers and applications. Enterprise password managers add features like sharing credentials securely, policy enforcement, privileged access management, and audit logging. Organizations should encourage or mandate password manager use, provide enterprise solutions, and train users on secure master password selection."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Password concepts > Passwordless",
    contextSummary: "Passwordless authentication eliminates passwords entirely, instead using biometrics, security keys (FIDO2), magic links sent to email, or push notifications to mobile devices for authentication. Passwordless methods resist phishing (nothing to steal), eliminate password fatigue, reduce help desk password reset costs, and improve user experience. Implementations include Windows Hello (biometrics + TPM), FIDO2 security keys (hardware cryptographic authentication), WebAuthn (browser standards for passwordless), and SMS/email magic links. Passwordless transition requires fallback authentication for device loss, user training, and application support for modern authentication protocols."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Privileged access management tools",
    contextSummary: "Privileged Access Management (PAM) tools control, monitor, and audit access to privileged accounts (administrators, root, service accounts) through password vaulting, just-in-time privilege elevation, session recording, and ephemeral credentials. PAM addresses privileged account risks including shared passwords, standing administrative access, lack of accountability, and credential theft. PAM solutions provide password rotation, approval workflows for privileged access, session isolation, activity recording for audit, and emergency break-glass access with comprehensive logging. Effective PAM implementation requires identifying all privileged accounts, onboarding them into PAM, eliminating shared passwords, and enforcing policies requiring PAM for administrative access."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Privileged access management tools > Just-in-time permissions",
    contextSummary: "Just-in-time (JIT) permissions grant elevated privileges only when needed and only for the duration required, rather than granting standing administrative access that increases attack surface and insider threat risk. JIT implementations require users to request privilege elevation with business justification, obtain approval (automated or manual), receive temporary credentials or group membership, and have access automatically revoked after time limit or task completion. JIT reduces credential theft impact (temporary credentials expire), improves accountability (access tied to specific requests), and enforces least privilege, though requiring robust request/approval workflows and user acceptance of occasional access friction."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Privileged access management tools > Password vaulting",
    contextSummary: "Password vaulting securely stores privileged account passwords in encrypted vaults, checking out passwords to authorized users temporarily while maintaining audit trails of who accessed which accounts when. Vaults automatically rotate passwords after use (users never know actual password), provide session isolation (prevent credential reuse), and enable emergency access procedures with comprehensive logging. Password vaulting eliminates shared administrator passwords, provides accountability for privileged access, enables rapid credential rotation, and allows automatic password changes during incidents suspending compromised accounts."
  },
  {
    fullPath: "Security Operations > Given a scenario, implement and maintain identity and access management > Privileged access management tools > Ephemeral credentials",
    contextSummary: "Ephemeral credentials are temporary authentication credentials automatically created when needed and destroyed after use or time expiration, minimizing credential exposure and reducing the value of stolen credentials. Ephemeral credentials implementations include short-lived API keys, temporary service account passwords, session tokens with brief lifetimes, and dynamic cloud credentials valid for hours. Benefits include reduced credential theft impact (credentials quickly expire), no long-lived secrets to secure, and forcing regular re-authentication, though requiring infrastructure supporting dynamic credential generation and applications tolerating credential rotation."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch9)
}

export { batch9 }
