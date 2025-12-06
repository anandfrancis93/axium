# Topic Hierarchy Analysis & Robustification

## Executive Summary
This document analyzes the topic hierarchy after a "robustification" pass. The goal was to integrate ~675 "orphaned" Level 4 topics (roots) into the main topic tree by assigning them to existing or newly created Level 1 domains.

**Results:**
- **Total Topics:** 925
- **Orphans Before:** ~675
- **Orphans After:** 34
- **New L1 Domains Created/Promoted:**
    - `Application Security`
    - `Cloud Security`
    - `Endpoint Security`
    - `Network Security`
    - `Physical Security`

## Changes Implemented

1.  **L1 Domain Creation**:
    - Several major domains were missing from the top level or existed only as unstructured lists. These were promoted to Level 1.
    - **Physical Security**: Grouped topics like `Bollards`, `Lighting` (which were L1) and `Guards`, `Fencing` (L4 orphans) under this new parent.
    - **Cloud Security**: Consolidated cloud models (`SaaS`, `PaaS`) and concepts (`CASB`, `Virtualization`) under this parent.
    
2.  **Orphan Categorization**:
    - Used keyword matching to assign ~640 orphans to specific parents.
    - **Attacks**: Mapped `Buffer Overflow`, `Injection`, etc., to `Application Security` or `Malware & Threats`.
    - **Network**: Mapped `Firewall`, `VPN`, `Bluetooth`, `ARP` to `Network Security`.
    - **Endpoint**: Mapped `Antivirus`, `Patch Management` to `Endpoint Security`.

## Current Tree Structure

The following is the generated ASCII tree of the topics as of 2025-12-05:

```text
Tree Verification Report
========================
Total Topics: 925 (approx, verifying count)
Total Legitimate Roots (L1-L3): 80
Remaining L4 Orphans: 34

### Topic Hierarchy
├── [L1] Accounting (AAA)
├── [L1] Advanced Persistent Threat (APT)
├── [L1] Agentless Scanning
├── [L1] Application Security
│   ├── [L2] Arbitrary Code Execution
│   ├── [L2] Injection Attack
│   ├── [L2] Patch Management
│   ├── [L2] Remote Code Execution
│   ├── [L2] Risk Avoidance
│   ├── [L2] Risk Tolerance
│   ├── [L2] Sideloading
│   ├── [L2] Spyware
│   ├── [L2] SQL Injection (SQLi)
│   ├── [L2] True Negative
│   └── [L2] Windows Logs
├── [L1] Asset Management
│   └── [L2] ITIL Configuration Management
│       ├── [L3] Baseline configuration
│       ├── [L3] Configuration Item (CI)
│       ├── [L3] Configuration management system (CMS)
│       └── [L3] Service assets
├── [L1] Attack Surface
├── [L1] Attributes of Threat Actors
├── [L1] Authentication (AAA)
│   ├── [L2] Authentication Design
│   │   ├── [L3] Availability (Authentication)
│   │   ├── [L3] Confidentiality (Authentication)
│   │   └── [L3] Integrity (Authentication)
│   ├── [L2] Authentication Factor
│   │   ├── [L3] Something You Are
│   │   ├── [L3] Something You Have
│   │   ├── [L3] Something You Know
│   │   └── [L3] Somewhere You Are
│   ├── [L2] Authentication Methods
│   │   ├── [L3] Attestation (Cryptography)
│   │   ├── [L3] Biometric Authentication
│   │   │   ├── [L4] Crossover Error Rate (CER)
│   │   │   ├── [L4] Failure to Enroll Rate (FER)
│   │   │   ├── [L4] False Acceptance Rate (FAR)
│   │   │   ├── [L4] False Rejection Rate (FRR)
│   │   │   └── [L4] Throughput (Speed)
│   │   ├── [L3] Hard Authentication Token
│   │   ├── [L3] Multifactor Authentication (MFA)
│   │   ├── [L3] Password Manager
│   │   ├── [L3] Passwordless
│   │   ├── [L3] Personal Identification Number (PIN)
│   │   ├── [L3] Soft Authentication Token
│   │   └── [L3] Token Generation
│   │       ├── [L4] Certificate-Based Authentication
│   │       └── [L4] Fast Identity Online (FIDO) Universal 2nd Factor (U2F)
│   ├── [L2] Authentication Protocols
│   │   ├── [L3] Directory Service
│   │   ├── [L3] Distinguished Name (DN)
│   │   ├── [L3] Kerberos
│   │   │   ├── [L4] Key Distribution Center (KDC)
│   │   │   ├── [L4] TGS session Key
│   │   │   └── [L4] Ticket Granting Ticket (TGT)
│   │   ├── [L3] Lightweight Directory Access Protocol (LDAP)
│   │   ├── [L3] Linux Authentication
│   │   ├── [L3] NT LAN Manager (NTLM) Authentication
│   │   ├── [L3] Pluggable Authentication Module (PAM)
│   │   └── [L3] Single Sign-on (SSO)
│   └── [L2] Password Best Practices
├── [L1] Authorization (AAA)
│   └── [L2] Access Control Models
│       ├── [L3] Attribute-based Access Control (ABAC)
│       ├── [L3] Discretionary Access Control (DAC)
│       ├── [L3] Least Privilege
│       ├── [L3] Mandatory Access Control (MAC)
│       ├── [L3] Role-based Access Control (RBAC)
│       └── [L3] Rule-based Access Control
├── [L1] Availability
├── [L1] Backup Power Generator
├── [L1] Bollards
├── [L1] Chief Information Officer (CIO)
├── [L1] Chief Security Officer (CSO)
├── [L1] Chief Technology Officer (CTO)
├── [L1] Client-Based Scanning
├── [L1] Cold Site
├── [L1] Compensating Security Control
├── [L1] Computer Incident Response Team (CIRT)
├── [L1] Confidentiality
├── [L1] Corrective Security Control
├── [L1] Cryptography
│   ├── [L2] Active Reconnaissance (Penetration Testing)
│   ├── [L2] Advanced Data Protection
│   ├── [L2] Adware
│   ├── [L2] Agent-Based Filtering
│   ├── [L2] Air-gap
│   ├── [L2] Annualized Loss Expectancy (ALE)
│   ├── [L2] Annualized Rate of Occurrence (ARO)
│   ├── [L2] Appliance Firewall
│   ├── [L2] Application Virtualization
│   ├── [L2] Asset Acquisition / Procurement
│   ├── [L2] Asset Disposal / Decommissioning
│   ├── [L2] Asymmetric Algorithm
│   ├── [L2] Asymmetric Encryption
│   │   ├── [L3] Private Key
│   │   └── [L3] Public Key
│   ├── [L2] Botnet
│   ├── [L2] Buffer Overflow
│   ├── [L2] Bug Bounty
│   ├── [L2] Business Continuity Documentation
│   ├── [L2] Cable Locks
│   ├── [L2] Canonicalization Attack
│   ├── [L2] Card Cloning (RFID)
│   ├── [L2] Centralized Web Filtering
│   ├── [L2] Cipher Suite
│   ├── [L2] Clean Desk Policy
│   ├── [L2] Client-Side / Server- Side Validation
│   ├── [L2] Cloud Automation Technologies
│   ├── [L2] Cloud Models Security
│   ├── [L2] Cloud Responsiveness
│   ├── [L2] Collision Attack
│   ├── [L2] Command Injection Attack
│   ├── [L2] Community Cloud
│   ├── [L2] Compliance Monitoring
│   ├── [L2] Computer-based Training (CBT)
│   ├── [L2] Cross-Site Scripting (XSS)
│   ├── [L2] Crypto-mining
│   ├── [L2] Crypto-Ransomware
│   ├── [L2] Cryptojacking Malware
│   ├── [L2] Dark Net
│   ├── [L2] Dark Web
│   ├── [L2] Data Destruction
│   ├── [L2] Data in Transit / Motion
│   ├── [L2] Data Owner
│   ├── [L2] Data Sanitization
│   ├── [L2] Data Sanitization / Destruction Certification
│   ├── [L2] Data Sovereignty
│   ├── [L2] Database Encryption
│   ├── [L2] Decentralized Computing Architecture
│   ├── [L2] Deep Web
│   ├── [L2] Digital Forensics - Data Acquisition
│   ├── [L2] Digital Forensics - Disk Image Acquisition
│   ├── [L2] Digital Forensics - Legal Hold
│   ├── [L2] Digital Forensics - Reporting
│   ├── [L2] Digital Forensics - System Memory Acquisition
│   ├── [L2] Directory Traversal
│   ├── [L2] Directory Traversal Attack
│   ├── [L2] Distributed Reflected DoS (DRDoS)
│   ├── [L2] DNS Server Cache Poisoning
│   ├── [L2] Domain Name System (DNS) Attacks
│   ├── [L2] Email Data Loss Prevention
│   ├── [L2] Encryption Fundamentals
│   │   ├── [L3] Ciphertext
│   │   ├── [L3] Cryptanalysis
│   │   ├── [L3] Cryptographic Algorithm
│   │   ├── [L3] Cryptographic Key
│   │   ├── [L3] Cryptographic Primitive
│   │   ├── [L3] Encryption
│   │   ├── [L3] Key Length
│   │   └── [L3] Plaintext / Cleartext
│   ├── [L2] Environmental Attack
│   ├── [L2] Evidence of Internal Audits (Vendor Assessment Method)
│   ├── [L2] Extensible Markup Language (XML)
│   ├── [L2] Fail-Closed
│   ├── [L2] Fail-Open
│   ├── [L2] Failover Tests
│   ├── [L2] False Positives, False Negatives, and Log Review
│   ├── [L2] Fencing
│   ├── [L2] Fileless Malware
│   ├── [L2] Firewall Logs
│   ├── [L2] Forward Proxy Server
│   ├── [L2] Guidelines
│   ├── [L2] Hashing
│   │   ├── [L3] Digital Signature
│   │   ├── [L3] Hash-based Message Authentication Code (HMAC)
│   │   ├── [L3] Message Digest Algorithm #5 (MD5)
│   │   └── [L3] Secure Hash Algorithm (SHA)
│   ├── [L2] High Availability
│   ├── [L2] Host-based Firewalls
│   ├── [L2] HTML5 VPN
│   ├── [L2] Hybrid Cloud
│   ├── [L2] Implicit TLS (FTPS)
│   ├── [L2] In-Band Management
│   ├── [L2] Incident Response - Preparation
│   ├── [L2] Incident Response - Testing
│   ├── [L2] Indicator of Compromise (IoC)
│   ├── [L2] Information Sharing and Analysis Centers (ISACs)
│   ├── [L2] Information-Sharing Organizations
│   ├── [L2] Infrastructure as Code (IaC)
│   ├── [L2] Input Validation
│   ├── [L2] Integrated Penetration Testing
│   ├── [L2] Intelligence Fusion - Threat Hunting
│   ├── [L2] Internet Relay Chat (IRC)
│   ├── [L2] Intrusion Detection and Prevention Systems
│   ├── [L2] Jailbreaking
│   ├── [L2] Journaling
│   ├── [L2] Jump Server
│   ├── [L2] Key Encryption Key (KEK)
│   ├── [L2] Key Management System
│   │   ├── [L3] Blockchain
│   │   ├── [L3] Diffie-Hellman (D-H)
│   │   ├── [L3] Entropy
│   │   ├── [L3] Ephemeral Session Key
│   │   ├── [L3] Hardware Security Module (HSM)
│   │   ├── [L3] Key Escrow
│   │   ├── [L3] Key Exchange
│   │   ├── [L3] Key Stretching
│   │   ├── [L3] Open Public Ledger
│   │   ├── [L3] Perfect Forward Secrecy (PFS)
│   │   ├── [L3] Pseudo Random Number Generator (PRNG)
│   │   ├── [L3] Salting
│   │   ├── [L3] True Random Number Generator (TRNG)
│   │   └── [L3] Trusted Platform Module (TPM)
│   ├── [L2] Kill Chain
│   ├── [L2] Layer 4 Firewall
│   ├── [L2] Layer 7 Firewall
│   ├── [L2] Legal Data
│   ├── [L2] Load Balancer
│   ├── [L2] Log Data
│   ├── [L2] Logs
│   ├── [L2] Malicious Update
│   ├── [L2] Maneuver - Threat Hunting
│   ├── [L2] Master Service Agreement (MSA)
│   ├── [L2] Mean Time To Repair (MTTR)
│   ├── [L2] Memorandum of Understanding (MOU)
│   ├── [L2] Monitoring Infrastructure
│   ├── [L2] National Institute of Standards and Technology (NIST)
│   ├── [L2] NetFlow
│   ├── [L2] Next-Generation Firewall (NGFW)
│   ├── [L2] Nondisclosure Agreement (NDA)
│   ├── [L2] Obfuscation
│   │   ├── [L3] Data Masking
│   │   ├── [L3] Steganography
│   │   └── [L3] Tokenization
│   ├── [L2] Opal
│   ├── [L2] Packet Analysis
│   ├── [L2] Packet Captures
│   ├── [L2] Platform as a Service (PaaS)
│   ├── [L2] Platform Diversity
│   ├── [L2] Policies
│   ├── [L2] Potentially Unwanted Programs (PUPs) / Potentially Unwanted Applications (PUAs)
│   ├── [L2] Power Redundancy
│   ├── [L2] Proprietary Data
│   ├── [L2] Proprietary Information
│   ├── [L2] Public (or Multi-tenant) Cloud
│   ├── [L2] Public Key Infrastructure (PKI)
│   │   ├── [L3] Certificate Authority (CA)
│   │   ├── [L3] Certificate Chaining / Chain of Trust
│   │   ├── [L3] Certificate Revocation List (CRL)
│   │   ├── [L3] Certificate Signing Request (CSR)
│   │   ├── [L3] Common Name (CN)
│   │   ├── [L3] Digital Certificate
│   │   ├── [L3] Online Certificate Status Protocol (OCSP)
│   │   ├── [L3] Public Key Cryptography Standards (PKCS)
│   │   ├── [L3] Root Certificate
│   │   ├── [L3] Root of Trust
│   │   ├── [L3] Self-signed Certificate
│   │   ├── [L3] Single Certificate Authority (CA)
│   │   ├── [L3] Subject Alternative Name (SAN)
│   │   ├── [L3] Third Party Certificate Authority (CA)
│   │   └── [L3] Wildcard Domain
│   ├── [L2] Qualitative Risk Analysis
│   ├── [L2] Recovery Point Objective (RPO)
│   ├── [L2] Remote Access Trojan (RAT)
│   ├── [L2] Remote Desktop Protocol (RDP)
│   ├── [L2] Restricted Data
│   ├── [L2] Reverse Proxy Server
│   ├── [L2] Risk Assessment
│   ├── [L2] Risk Deterrence / Risk Reduction
│   ├── [L2] Risk Exception
│   ├── [L2] Risk Identification
│   ├── [L2] Risk Likelihood
│   ├── [L2] Risk Reporting
│   ├── [L2] Risk Transference / Risk Sharing
│   ├── [L2] Router Firewall
│   ├── [L2] Sandbox Execution
│   ├── [L2] Screened Subnet
│   ├── [L2] Secure IMAP (IMAPS)
│   ├── [L2] Security Guards and Cameras
│   ├── [L2] Sensitive Data
│   ├── [L2] Shellcode
│   ├── [L2] Single Point of Failure
│   ├── [L2] Software Composition Analysis (SCA)
│   ├── [L2] Software Development Life Cycle (SDLC)
│   ├── [L2] Software-Defined Wide Area Network (SD-WAN)
│   ├── [L2] SSL/TLS Versions
│   ├── [L2] Standard Operating Procedures (SOPs) (Change Management)
│   ├── [L2] Static Code Analysis
│   ├── [L2] Substitution Algorithm
│   ├── [L2] Symmetric Algorithm
│   ├── [L2] Symmetric Encryption / Algorithm
│   ├── [L2] SYN Flood Attack
│   ├── [L2] Syslog
│   ├── [L2] System Monitor
│   ├── [L2] Tactics, Techniques, and Procedures (TTPs)
│   ├── [L2] Temporal Key Integrity Protocol (TKIP)
│   ├── [L2] Testing Resiliency
│   ├── [L2] Threat Hunting
│   ├── [L2] Transposition Algorithm
│   ├── [L2] Trojan
│   ├── [L2] Unified Threat Management (UTM)
│   ├── [L2] URL Analysis
│   ├── [L2] Virtual Network Computing (VNC)
│   ├── [L2] Virtual Private Network (VPN)
│   ├── [L2] Virus
│   ├── [L2] Web Application Firewall (WAF)
│   ├── [L2] Web Filtering
│   ├── [L2] Web Server Logs
│   ├── [L2] Wireless Network Installation Considerations
│   ├── [L2] Worm
│   └── [L2] Zero-Day Vulnerabilities
├── [L1] Cybersecurity Frameworks (CSF)
│   └── [L2] NIST Cybersecurity Framework
├── [L1] Detective Security Control
├── [L1] Deterrent Security Control
├── [L1] Development and operations (DevOps)
├── [L1] DevSecOps
├── [L1] Directive Security Control
├── [L1] DNS Sinkhole
├── [L1] Endpoint Security
│   ├── [L2] Choose Your Own Device (CYOD)
│   ├── [L2] Corporate Owned, Business Only (COBO)
│   ├── [L2] Endpoint Detection and Response (EDR)
│   ├── [L2] Patch
│   ├── [L2] Risk Impact
│   ├── [L2] Rooting
│   └── [L2] Statement of Work (SOW) / Work Order (WO)
├── [L1] Failover
├── [L1] Fake Telemetry
├── [L1] Fault Tolerant
├── [L1] Federation
│   ├── [L2] Identity Provider (IdP)
│   ├── [L2] Open Authorization (OAuth)
│   ├── [L2] Representational State Transfer (REST)
│   ├── [L2] Security Assertion Markup Language (SAML)
│   └── [L2] Simple Object Access Protocol (SOAP)
├── [L1] Gap analysis
├── [L1] Geographic Dispersion
├── [L1] Governance, Risk, and Compliance
│   ├── [L2] Backout Plans (Change Management)
│   ├── [L2] Business Continuity
│   ├── [L2] Centralized Computing Architecture
│   ├── [L2] Change Control
│   ├── [L2] Confidential Data
│   ├── [L2] Configuration Management
│   ├── [L2] Cybersecurity Incident
│   ├── [L2] Data Controller
│   ├── [L2] Detection
│   ├── [L2] Digital Forensics - Provenance
│   ├── [L2] Digital Forensics - Timeline
│   ├── [L2] Disaster Recovery
│   ├── [L2] E-discovery
│   ├── [L2] General Data Protection Regulation (GDPR)
│   ├── [L2] Governance
│   ├── [L2] Heat Map Risk Matrix
│   ├── [L2] Heuristics
│   ├── [L2] Isolation
│   ├── [L2] macOS Logs
│   ├── [L2] Memorandum of Agreement (MOA)
│   ├── [L2] Percent Encoding (URL)
│   ├── [L2] Preparation
│   ├── [L2] Residual Risk
│   ├── [L2] Risk Acceptance / Risk Tolerance
│   ├── [L2] Risk Mitigation / Risk Remediation
│   ├── [L2] Risk Probability
│   ├── [L2] Risk Threshold
│   ├── [L2] Service-level Agreement (SLA)
│   ├── [L2] Single Loss Expectancy (SLE)
│   ├── [L2] Supercookie
│   ├── [L2] Supervisory Control and Data Acquisition (SCADA)
│   ├── [L2] Vendor Monitoring (Vendor Assessment Method)
│   └── [L2] Workforce Multiplier
├── [L1] Honeypots
├── [L1] Hot Site
├── [L1] Human Vector
├── [L1] Identification (IAM)
├── [L1] Identity and Access Management (IAM)
│   ├── [L2] 802.1X / Port-based Network Access Control (PNAC)
│   ├── [L2] Access Badges
│   ├── [L2] Access Control List (ACL)
│   ├── [L2] Access Control Vestibule / Mantrap
│   ├── [L2] Account Lockout
│   ├── [L2] Account Management
│   │   ├── [L3] Account Policies
│   │   ├── [L3] Group Account
│   │   ├── [L3] Group Policy Objects (GPOs)
│   │   ├── [L3] Just-in-time (JIT) Permission
│   │   ├── [L3] M of N Control
│   │   ├── [L3] Privileged access management (PAM)
│   │   ├── [L3] Secure Administrative Workstation (SAW)
│   │   └── [L3] Security Identifier (SID)
│   ├── [L2] Account Restrictions
│   │   ├── [L3] Geolocation
│   │   └── [L3] Zero Standing Privileges (ZSP)
│   ├── [L2] Active Security Control
│   ├── [L2] Advanced / Enterprise Authentication
│   ├── [L2] AES Galois Counter Mode (GCM)
│   ├── [L2] Alarm Systems and Sensors
│   ├── [L2] Alerting and Monitoring Activities
│   ├── [L2] Allowed and Blocked Changes
│   ├── [L2] Amplification Attack (DDoS)
│   ├── [L2] Anomalous Behavior Recognition
│   ├── [L2] Antivirus Scan
│   ├── [L2] Application and Endpoint Logs
│   ├── [L2] Application Attacks
│   ├── [L2] Application Logs
│   ├── [L2] Application Protections
│   ├── [L2] Application Vulnerabilities
│   ├── [L2] Asset Monitoring / Tracking
│   ├── [L2] Asset Ownership Assignment / Accounting
│   ├── [L2] Asset Protection
│   ├── [L2] Attestation and Assessments (Governance & Compliance)
│   ├── [L2] Auditing (Vulnerability Assessment)
│   ├── [L2] Authentication Header (AH)
│   ├── [L2] Authentication, Authorization, and Accounting (AAA)
│   ├── [L2] Automation and Orchestration Implementation
│   ├── [L2] Automation and Scripting
│   ├── [L2] Backdoor
│   ├── [L2] Backdoors and Remote Access Trojans (RAT)
│   ├── [L2] Benchmarks
│   ├── [L2] Benchmarks and Secure Configuration Guides
│   ├── [L2] Birthday Attack
│   ├── [L2] Brute Force Password Attack
│   ├── [L2] Business Impact Analysis (BIA)
│   ├── [L2] Capacity Planning
│   ├── [L2] Change Management
│   ├── [L2] Cloud Access Security Brokers (CASB)
│   ├── [L2] Cloud Architecture Features
│   ├── [L2] Cloud Deployment Model
│   ├── [L2] Cloud Responsibility Matrix
│   ├── [L2] Cloud Security
│   │   ├── [L2] Anything as a Service (XaaS)
│   │   ├── [L2] Cloud Computing
│   │   ├── [L2] Cloud Service Provider (CSP)
│   │   ├── [L2] Data Replication (Cloud)
│   │   ├── [L2] Infrastructure as a Service (IaaS)
│   │   ├── [L2] Multi-cloud Architecture
│   │   ├── [L2] Software as a Service (SaaS)
│   │   ├── [L2] Virtual Private Cloud (VPC)
│   │   └── [L2] Virtualization
│   ├── [L2] Cloud Service Customer Responsibility
│   ├── [L2] Cloud Service Model
│   ├── [L2] Cloud Service Provider Responsibility
│   ├── [L2] Cloud-based Application Attacks
│   ├── [L2] Clustering
│   ├── [L2] Code of Conduct
│   ├── [L2] Code Signing
│   ├── [L2] Common Vulnerabilities and Exposures (CVE)
│   ├── [L2] Common Vulnerability Scoring System (CVSS)
│   ├── [L2] Concurrent Session Usage
│   ├── [L2] Conduct Policies
│   ├── [L2] Containerization / Container Virtualization
│   ├── [L2] Continuity of Operations (COOP)
│   ├── [L2] Covert Channel
│   ├── [L2] Credential Dumping
│   ├── [L2] Credential Harvesting
│   ├── [L2] Credential Replay Attack
│   ├── [L2] Credentialed Scan
│   ├── [L2] Critical Elements for Security Awareness Training
│   ├── [L2] Cross-Site Request Forgery (CSRF)
│   ├── [L2] Cryptographic Attacks
│   ├── [L2] Cryptographic Vulnerabilities
│   ├── [L2] Data / Privacy Breach
│   ├── [L2] Data at Rest
│   ├── [L2] Data Backup
│   ├── [L2] Data Classifications
│   ├── [L2] Data Custodian
│   ├── [L2] Data Exposure
│   ├── [L2] Data Governance Roles
│   ├── [L2] Data Inventories
│   ├── [L2] Data Loss Prevention (DLP)
│   ├── [L2] Data Processor
│   ├── [L2] Data Protection
│   ├── [L2] Data Protection Methods
│   ├── [L2] Data Sources, Dashboards, and Reports
│   ├── [L2] Data Sovereignty and Geographical Considerations
│   ├── [L2] Data Subject
│   ├── [L2] Data Types
│   ├── [L2] Deception Technologies
│   ├── [L2] Deep and Dark Web
│   ├── [L2] Defense in Depth
│   ├── [L2] Deperimeterization
│   ├── [L2] Dictionary Attack
│   ├── [L2] Digital Forensics
│   ├── [L2] Digital Forensics - Chain of Custody
│   ├── [L2] Digital Forensics - Preservation
│   ├── [L2] Disassociation Attack (Wireless DoS)
│   ├── [L2] Distributed Denial of Service (DDoS) Attacks
│   ├── [L2] DNS Filtering
│   ├── [L2] DNS Security Extensions (DNSSEC)
│   ├── [L2] Documentation and Version Control
│   ├── [L2] Domain-based Message Authentication, Reporting & Conformance (DMARC)
│   ├── [L2] DomainKeys Identified Mail (DKIM)
│   ├── [L2] Downgrade Attack
│   ├── [L2] EAP over LAN (EAPoL)
│   ├── [L2] Email Gateway
│   ├── [L2] Email Security
│   ├── [L2] Email Services
│   ├── [L2] Embedded Systems
│   ├── [L2] Encapsulating Security Payload (ESP)
│   ├── [L2] Enterprise Authentication
│   ├── [L2] Environmental Variables (Vulnerability Assessment)
│   ├── [L2] Error Handling
│   ├── [L2] Evaluation Scope
│   ├── [L2] Exercise Types (Penetration Testing)
│   ├── [L2] Explicit TLS (FTPES)
│   ├── [L2] Exposure Factor
│   ├── [L2] Extensible Authentication Protocol (EAP)
│   ├── [L2] Extensible Markup Language (XML) Injection
│   ├── [L2] External Assessments (Governance & Compliance)
│   ├── [L2] File Transfer Protocol (FTP)
│   ├── [L2] File Transfer Services
│   ├── [L2] Financial Data
│   ├── [L2] Firmware Vulnerabilities
│   ├── [L2] Forgery Attacks
│   ├── [L2] Function as a Service (FaaS)
│   ├── [L2] Gateways and Locks
│   ├── [L2] Governance and Accountability
│   ├── [L2] Governance Boards
│   ├── [L2] Government Entities and Groups
│   ├── [L2] Hardening
│   ├── [L2] Hashing Algorithm
│   ├── [L2] Health Insurance Portability and Accountability Act (HIPAA)
│   ├── [L2] High Availability Across Zones (Cloud)
│   ├── [L2] Host Operating System Logs
│   ├── [L2] Human-Readable Data
│   ├── [L2] Hybrid Password Attack
│   ├── [L2] Impossible Travel
│   ├── [L2] Incident Response - Analysis
│   ├── [L2] Incident Response - Containment
│   ├── [L2] Incident Response - Eradication and Recovery
│   ├── [L2] Incident Response - Lessons Learned
│   ├── [L2] Incident Response - Training
│   ├── [L2] Incident Response Lifecycle
│   ├── [L2] Industrial Control System (ICS)
│   ├── [L2] Inherent Risk
│   ├── [L2] Injection Attacks
│   ├── [L2] Internal / External Compliance Reporting
│   ├── [L2] Internal Assessments (Governance & Compliance)
│   ├── [L2] Internet Key Exchange (IKE)
│   ├── [L2] Internet of Things (IoT)
│   ├── [L2] Internet Protocol Security (IPsec)
│   ├── [L2] Intrusion Detection System (IDS)
│   ├── [L2] Key Risk Indicators (KRIs)
│   ├── [L2] Keylogger
│   ├── [L2] LDAP Secure (LDAPS)
│   ├── [L2] Legacy and End-of-Life (EOL) System Vulnerabilities
│   ├── [L2] Legal Agreements
│   ├── [L2] Legal Environment
│   ├── [L2] Lessons Learned Report (LLR)
│   ├── [L2] Lightweight Directory Access Protocol (LDAP) Injection
│   ├── [L2] Linux Logs
│   ├── [L2] Logic Bomb
│   ├── [L2] MAC Filtering
│   ├── [L2] Malicious Activity Indicators
│   ├── [L2] Malicious Code Indicators
│   ├── [L2] Malicious Process
│   ├── [L2] Malware Classification
│   ├── [L2] Memory Injection
│   ├── [L2] Metadata
│   ├── [L2] Microservices
│   ├── [L2] Misconfiguration Vulnerabilities
│   ├── [L2] Mission Essential Functions (MEF)
│   ├── [L2] Monitoring Systems and Applications
│   ├── [L2] Multi-Cloud Strategy
│   ├── [L2] Network Access Control (NAC)
│   ├── [L2] Network Attacks
│   ├── [L2] Network Data Sources
│   ├── [L2] Network Logs
│   ├── [L2] Non-Credentialed Scan
│   ├── [L2] Non-Human-Readable Data
│   ├── [L2] Offline Password Attack
│   ├── [L2] On-Path Attack / Man-in-the-Middle Attack (MiTM)
│   ├── [L2] Online Password Attack
│   ├── [L2] Open-Source Intelligence (OSINT)
│   ├── [L2] Operating System Vulnerabilities
│   ├── [L2] Package Monitoring
│   ├── [L2] Packet Filtering Firewall
│   ├── [L2] Password Attacks
│   ├── [L2] Password Spraying
│   ├── [L2] Penetration Testing (How)
│   ├── [L2] Penetration Testing (Why / Who)
│   ├── [L2] Physical Attacks
│   ├── [L2] Physical Penetration Testing
│   ├── [L2] Physical Security Control
│   ├── [L2] Platform Diversity and Defense in Depth
│   ├── [L2] Playbook
│   ├── [L2] Point-to-Point Tunneling Protocol (PPTP)
│   ├── [L2] Pre-shared Key (PSK)
│   ├── [L2] Privacy Data
│   ├── [L2] Private / Personal Data
│   ├── [L2] Private Cloud
│   ├── [L2] Privilege Escalation
│   ├── [L2] Procedures
│   ├── [L2] Proxy Server
│   ├── [L2] Public /  Unclassified Data
│   ├── [L2] Quantitative Risk Analysis
│   ├── [L2] Race Condition and TOCTOU
│   ├── [L2] Ransomware
│   ├── [L2] Real-Time Operating Systems (RTOS)
│   ├── [L2] Recognizing Risky Behaviors
│   ├── [L2] Reconnaissance
│   ├── [L2] Regulated Data
│   ├── [L2] Remote Authentication Dial-In User Service (RADIUS)
│   ├── [L2] Replay Attack
│   ├── [L2] Resilient Cloud Architecture
│   ├── [L2] Restarts, Dependencies, and Downtime
│   ├── [L2] RFID Cloning
│   ├── [L2] Risk Analysis
│   ├── [L2] Risk Appetite
│   ├── [L2] Risk Exemption
│   ├── [L2] Risk Management Processes
│   ├── [L2] Risk Management Strategies
│   ├── [L2] Risk Owner
│   ├── [L2] Risk Register
│   ├── [L2] Rogue Access Point (AP) Attack
│   ├── [L2] Rootkit
│   ├── [L2] Rules of Engagement (RoE)
│   ├── [L2] Secure Access Service Edge (SASE)
│   ├── [L2] Secure Baseline
│   ├── [L2] Secure Coding Techniques
│   ├── [L2] Secure Data Destruction
│   ├── [L2] Secure Directory Services
│   ├── [L2] Secure Enclave
│   ├── [L2] Secure File Transfer Protocol (SFTP)
│   ├── [L2] Secure POP (POP3S)
│   ├── [L2] Secure Protocols
│   ├── [L2] Secure Shell (SSH)
│   ├── [L2] Secure SMTP (SMTPS)
│   ├── [L2] Secure/Multipurpose Internet Mail Extensions (S/MIME)
│   ├── [L2] Security Awareness Training Lifecycle
│   ├── [L2] Security Compliance
│   ├── [L2] Security Information and Event Management (SIEM)
│   ├── [L2] Security Logs
│   ├── [L2] Sender Policy Framework (SPF)
│   ├── [L2] Server-Side Request Forgery (SSRF)
│   ├── [L2] Serverless Computing
│   ├── [L2] Sideloading, Rooting, and Jailbreaking
│   ├── [L2] Simple Authentication and Security Layer (SASL)
│   ├── [L2] Simple Network Management Protocol Security
│   ├── [L2] Simultaneous Authentication of Equals (SAE)
│   ├── [L2] Site Layout, Fencing, and Lighting
│   ├── [L2] Skimming (RFID)
│   ├── [L2] Software Defined Networking (SDN)
│   ├── [L2] Software Sandboxing
│   ├── [L2] SSH FTP (SFTP) and FTP Over SSL (FTPS)
│   ├── [L2] Standard Naming Convention
│   ├── [L2] Standards
│   ├── [L2] Structured Exception Handler (SEH)
│   ├── [L2] Supply Chain Analysis (Vendor Assessment Method)
│   ├── [L2] Supply Chain Attacks
│   ├── [L2] Technical Debt
│   ├── [L2] Third-Party Cloud Vendor
│   ├── [L2] Threat Feeds
│   ├── [L2] Training Topics and Techniques
│   ├── [L2] Transport Layer Security
│   ├── [L2] Transport Layer Security (TLS) VPN
│   ├── [L2] User Account Lifecycle
│   │   ├── [L3] User Account Deprovisioning
│   │   └── [L3] User Account Provisioning
│   ├── [L2] User and Role-Based Training
│   ├── [L2] Vendor Assessment Methods
│   ├── [L2] Vendor Diversity
│   ├── [L2] Vendor Selection
│   ├── [L2] Version Control
│   ├── [L2] Virtualization Vulnerabilities
│   ├── [L2] Vulnerability Analysis
│   ├── [L2] Vulnerability Assessment Methods
│   ├── [L2] Vulnerability Response and Remediation
│   ├── [L2] Vulnerability Scanning
│   ├── [L2] Vulnerability Types
│   ├── [L2] Web Application Attacks
│   ├── [L2] Wi-Fi Authentication Methods
│   ├── [L2] Wi-Fi Protected Access 3 (WPA3)
│   ├── [L2] Wi-Fi Protected Setup (WPS)
│   ├── [L2] Windows Authentication
│   ├── [L2] Wireless Attacks
│   ├── [L2] Wireless Denial of Service (DoS) Attack
│   ├── [L2] Wireless Encryption
│   ├── [L2] Wireless Replay and Key Recovery Attack
│   ├── [L2] WPA2 Pre-Shared Key Authentication
│   ├── [L2] WPA3 Personal Authentication
│   └── [L2] Zero Trust Architecture (ZTA)
├── [L1] Industrial Camouflage
├── [L1] Information Security
├── [L1] Information Systems Security Officer (ISSO)
├── [L1] Integrity
├── [L1] Intentional Threat
├── [L1] Level of Sophistication / Capability
├── [L1] Lighting
├── [L1] Lure-Based Vectors
│   ├── [L2] Document Files (Lure-Based Vector)
│   ├── [L2] Email (Message-Based Vector)
│   ├── [L2] Executable File (Lure-Based Vector)
│   ├── [L2] IM (Message-Based Vector)
│   ├── [L2] Image Files (Lure-Based Vector)
│   ├── [L2] Removable Device (Lure-Based Vector)
│   ├── [L2] SMS (Message-Based Vector)
│   ├── [L2] Web and Social Media (Message-Based Vector)
│   └── [L2] Zero-click (Message-Based Vector)
├── [L1] Malware & Threats
│   ├── [L2] Command and Control (C2 or C&C)
│   ├── [L2] Cyber Threat Intelligence (CTI)
│   ├── [L2] Defensive Penetration Testing
│   ├── [L2] Distributed DoS (DDoS)
│   ├── [L2] DNS Client Cache Poisoning
│   ├── [L2] Incident Response Policy
│   ├── [L2] Information Security Policies
│   ├── [L2] Lateral Movement
│   ├── [L2] Malware
│   ├── [L2] Memory Dump
│   ├── [L2] Missing Logs
│   ├── [L2] Out-of-cycle Logging
│   ├── [L2] Payload
│   ├── [L2] Reputational Threat Intelligence
│   ├── [L2] Risk Management
│   ├── [L2] Tabletop Exercise
│   └── [L2] Tracking Cookie
├── [L1] Managerial Security Control
├── [L1] Motivations of Threat Actors
│   ├── [L2] Blackmail
│   ├── [L2] Data exfiltration
│   ├── [L2] Disinformation
│   ├── [L2] Extortion
│   ├── [L2] Financial Motivation
│   ├── [L2] Fraud
│   ├── [L2] Political Motivation
│   └── [L2] Service Disruption
├── [L1] Network Security
│   ├── [L2] Acceptable Use Policy (AUP)
│   ├── [L2] Ad Hoc Network
│   ├── [L2] Address Resolution Protocol (ARP)
│   ├── [L2] ARP Poisoning
│   ├── [L2] Beacon
│   ├── [L2] Behavioral-based Detection
│   ├── [L2] Bluejacking
│   ├── [L2] Bluesnarfing
│   ├── [L2] Bluetooth
│   ├── [L2] Bring Your Own Device (BYOD)
│   ├── [L2] Business Partnership Agreement (BPA)
│   ├── [L2] Cellular
│   ├── [L2] Chaotic Motivation
│   ├── [L2] Configuration Baselines
│   ├── [L2] Conflict of Interest
│   ├── [L2] Cookies
│   ├── [L2] Corporate Owned, Personally Enabled (COPE)
│   ├── [L2] Data Retention
│   ├── [L2] Device Placement
│   ├── [L2] DNS Attack Indicators
│   ├── [L2] DNS Poisoning
│   ├── [L2] DNS-Based On-Path Attacks
│   ├── [L2] Enterprise Risk Management (ERM)
│   ├── [L2] Escalation (Incident Response)
│   ├── [L2] Event Viewer
│   ├── [L2] Evil Twin
│   ├── [L2] False Negative
│   ├── [L2] Global Positioning System (GPS)
│   ├── [L2] Governance Committees
│   ├── [L2] GPS Tagging
│   ├── [L2] Heat Map (Risk)
│   ├── [L2] Host-based Intrusion Detection (HIDS)
│   ├── [L2] Host-based Intrusion Prevention (HIPS)
│   ├── [L2] Incident Response Plan (IRP)
│   ├── [L2] Independent Assessments (Vendor Assessment Method)
│   ├── [L2] Indoor Positioning System (IPS)
│   ├── [L2] Internet Message Access Protocol (IMAP)
│   ├── [L2] IP Flow Information Export (IPFIX)
│   ├── [L2] Layer 4 Load Balancer
│   ├── [L2] Layer 7 Load Balancer
│   ├── [L2] Listener / Collector
│   ├── [L2] Maximum Tolerable Downtime (MTD)
│   ├── [L2] Near-field Communication (NFC)
│   ├── [L2] Network Architecture
│   ├── [L2] Network Architecture Weaknesses
│   ├── [L2] Network Attack Surface
│   ├── [L2] Network Behavior and Anomaly Detection (NBAD)
│   ├── [L2] Network Monitor
│   ├── [L2] Offensive Penetration Testing
│   ├── [L2] On-premises Network
│   ├── [L2] Passive Reconnaissance (Penetration Testing)
│   ├── [L2] Payment Card Industry Data Security Standard (PCI DSS)
│   ├── [L2] Permissions
│   ├── [L2] Personal Area Networks (PANs)
│   ├── [L2] Pivoting
│   ├── [L2] Post Office Protocol v3 (POP3)
│   ├── [L2] Questionnaires (Vendor Management)
│   ├── [L2] Radio Frequency ID (RFID)
│   ├── [L2] Recovery Time Objective (RTO)
│   ├── [L2] Reporting
│   ├── [L2] Resource Consumption
│   ├── [L2] Resource Inaccessibility
│   ├── [L2] Responsible Disclosure Programs
│   ├── [L2] Right-to-Audit Clause (Vendor Assessment Method)
│   ├── [L2] Sarbanes-Oxley Act (SOX)
│   ├── [L2] Security Content Automation Protocol (SCAP)
│   ├── [L2] Service Set Identifier (SSID)
│   ├── [L2] Signature-Based Detection
│   ├── [L2] Simple Mail Transfer Protocol (SMTP)
│   ├── [L2] Simulation Testing/Experiment
│   ├── [L2] Sinkhole
│   ├── [L2] Site Survey
│   ├── [L2] Standard Configurations
│   ├── [L2] Tethering
│   ├── [L2] Trend Analysis (IPS / IDS)
│   ├── [L2] True Positive
│   ├── [L2] Uniform Resource Locator (URL)
│   ├── [L2] Vulnerability Feed
│   ├── [L2] Wi-Fi Protected Access (WPA)
│   ├── [L2] WiFi Heat Map
│   ├── [L2] Wired Equivalent Privacy (WEP)
│   └── [L2] Work Recovery Time (WRT)
├── [L1] Non-repudiation
├── [L1] Operational Security Control
├── [L1] Physical Security
│   ├── [L2] Alert Tuning
│   ├── [L2] Antivirus
│   ├── [L2] Block List
│   ├── [L2] Blocked Content
│   ├── [L2] Brute Force Attack (Physical)
│   ├── [L2] Data in Use / Processing
│   ├── [L2] Denial of service (DoS)
│   ├── [L2] Digital Forensics - Due Process
│   ├── [L2] Digital Forensics - Write Blocker
│   ├── [L2] Endpoint Logs
│   ├── [L2] False Positive
│   ├── [L2] Geofencing
│   ├── [L2] IDS and IPS Detection Methods
│   ├── [L2] Implicit Deny
│   ├── [L2] Incident Response - Detection
│   ├── [L2] Inline Device
│   ├── [L2] Intrusion Prevention System (IPS)
│   ├── [L2] IPS/IDS Logs
│   ├── [L2] Off-site Backup
│   ├── [L2] On-site Backup
│   ├── [L2] Out-of-Band Management
│   ├── [L2] Passive Security Control
│   ├── [L2] Port Security
│   ├── [L2] Remote Access
│   ├── [L2] Replication
│   ├── [L2] Scareware
│   ├── [L2] Snapshot
│   ├── [L2] SPAN (Switched Port Analyzer) / Mirror Port
│   ├── [L2] Stateful Firewall
│   ├── [L2] Stateless Firewall
│   ├── [L2] Test Access Point (TAP)
│   ├── [L2] Trade Secrets
│   └── [L2] Video Surveillance
├── [L1] Power Distribution Unit (PDU)
├── [L1] Preventive Security Control
├── [L1] Proximity Reader
├── [L1] Redundancy
├── [L1] Resources / Funding
├── [L1] Risk
├── [L1] Security Control
├── [L1] Security Operations Center (SOC)
├── [L1] Shadow IT
├── [L1] Social Engineering
│   ├── [L2] Brand Impersonation
│   ├── [L2] Business Email Compromise
│   ├── [L2] Impersonation
│   ├── [L2] Pharming
│   ├── [L2] Phishing
│   ├── [L2] Pretexting
│   ├── [L2] SMiShing
│   ├── [L2] Typosquatting
│   ├── [L2] Vishing
│   └── [L2] Watering Hole Attack
├── [L1] Supply Chain
│   ├── [L2] Business Partner
│   ├── [L2] Managed Service Provider (MSP)
│   ├── [L2] Supplier
│   └── [L2] Vendor
├── [L1] Technical Security Control
├── [L1] Threat
├── [L1] Threat Actor
│   ├── [L2] Authorized Hacker
│   ├── [L2] External Threat Actor
│   ├── [L2] Hacker
│   ├── [L2] Hacktivist
│   ├── [L2] Insider Threat / Internal Threat Actor
│   ├── [L2] Nation-state
│   ├── [L2] Organized crime
│   ├── [L2] Unauthorized Hacker
│   ├── [L2] Unintentional or Inadvertent Insider Threat
│   ├── [L2] Unskilled attacker
│   └── [L2] Whistleblower
├── [L1] Threat Vector
├── [L1] Type-safe Programming Language
├── [L1] Unintentional Threat
├── [L1] Uninterruptible Power Supply (UPS)
├── [L1] Unsecure Network
│   ├── [L2] Bluetooth Network (Network Vector)
│   ├── [L2] Cloud Access (Network Vector)
│   ├── [L2] Default Credentials (Network Vector)
│   ├── [L2] Direct Access (Network Vector)
│   ├── [L2] Local Network Vector
│   ├── [L2] Open Service Port (Network Vector)
│   ├── [L2] Remote and Wireless Network (Network Vector)
│   ├── [L2] Remote Network Vector
│   └── [L2] Wired Network (Network Vector)
├── [L1] Unsupported Systems / Applications
├── [L1] Vulnerability
├── [L1] Vulnerable Software
└── [L1] Warm Site

### Remaining Orphans (Potential to fix)
[L4] Allow List
[L4] Call List
[L4] chmod
[L4] Closed / Proprietary
[L4] Continuous Penetration Testing
[L4] Correlation
[L4] Data Classification
[L4] Data Historian
[L4] dd command
[L4] Dependencies
[L4] Due Diligence
[L4] Dynamic Analysis
[L4] File Integrity Monitoring (FIM)
[L4] First Responder
[L4] Human-readable Data
[L4] Impact Analysis (Change Management)
[L4] Internet Header
[L4] Log Aggregation
[L4] Maintenance Windows (Change Management)
[L4] Mean Time Between Failures (MTBF)
[L4] Offboarding
[L4] Onboarding
[L4] Order of Volatility
[L4] Parallel Processing Test
[L4] Reaction Time
[L4] Root Cause Analysis
[L4] Secret Data
[L4] Self-encrypting Drives (SED)
[L4] SELinux
[L4] Stakeholders
[L4] Static Analysis
[L4] Test Results (Change Management)
[L4] Top Secret Data
[L4] Trade Secret
```

## 2025-01-22 Cryptography Correction & Categorization

### Problem 
The initial categorization script heavily polluted the **Cryptography** domain with unrelated topics (e.g., *Adware*, *Botnet*, *Cloud Automation*) due to loose keyword matching (e.g., 'Key' matching *Keylogger*, 'Hash' matching generic terms).

### Solution
A refined categorization strategy was implemented:
1.  **Reset Cryptography**: All children of the Cryptography topic were reset to orphan status to allow clean re-categorization.
2.  **Regex-based Matching**: Switched from simple string inclusion to **Strict Word Boundary Regex** ('\bKEYWORD\b') to prevent partial matches.
3.  **Refined Keywords**: Narrowed Cryptography keywords and created new L1 domains (*Cloud Security, Endpoint Security, Malware & Threats*) to catch displaced topics.

### Results
*   **Cryptography Domain**: Now contains only relevant topics.
*   **New Categories**: Correctly populated with previously miscategorized topics.
*   **Statistics**:
    *   **Total Topics**: 931
    *   **Remaining Orphans (L4)**: 36 (Down from ~675)

The topic hierarchy is now substantially more accurate and robust.
