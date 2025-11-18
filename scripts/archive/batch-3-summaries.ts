/**
 * Context Summaries Batch 3 (Entities 71-100)
 */

import { updateSummariesByPath } from './update-summaries-by-path'

const batch3 = [
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Downtime",
    contextSummary: "Downtime refers to periods when systems or services are unavailable to users, often necessary during change implementation for system restarts, configuration updates, or hardware replacements. Planned downtime should be scheduled during maintenance windows, communicated to stakeholders, and minimized through careful planning. Unplanned downtime due to failed changes highlights the importance of testing and backout plans."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Service restart",
    contextSummary: "Service restart involves stopping and restarting system services to apply configuration changes, load updated software, or clear memory issues. Restarts may be required after security patches, configuration updates, or to recover from service degradation. Service restarts can cause brief outages and should be planned during maintenance windows, with consideration for service dependencies and restart order."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Application restart",
    contextSummary: "Application restart involves stopping and restarting applications to apply updates, clear cached data, or resolve performance issues. Application restarts may affect users currently connected and require coordination with business stakeholders. Proper planning includes notifying users, saving work in progress, and verifying application functionality after restart, especially for critical business applications."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Legacy applications",
    contextSummary: "Legacy applications are older software systems that may no longer be actively maintained or updated but remain critical to business operations. Changes to infrastructure, security controls, or dependencies can break legacy applications that weren't designed for modern environments. Special considerations include compatibility testing, vendor support availability, technical debt, and potential need for compensating controls when security updates aren't available."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Technical implications > Dependencies",
    contextSummary: "Dependencies are relationships between systems, applications, services, or components where one relies on another to function properly. Changes must account for dependencies to prevent cascading failures or security gaps. Dependency mapping identifies which systems communicate, share data, or rely on common infrastructure, enabling proper change sequencing, coordination, and testing of integrated systems."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Documentation",
    contextSummary: "Documentation in change management captures the what, why, how, and when of changes to systems and security controls. Proper documentation enables knowledge transfer, supports troubleshooting, demonstrates compliance, and maintains institutional knowledge. Critical documentation includes updated system diagrams, network topology maps, configuration settings, security policies, procedures, and version control history."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Documentation > Updating diagrams",
    contextSummary: "Updating diagrams involves revising network topology diagrams, system architecture diagrams, data flow diagrams, and other visual documentation to reflect changes made to the environment. Accurate diagrams are essential for security analysis, incident response, troubleshooting, and compliance audits. Outdated diagrams can lead to security misconfigurations, failed incident response, and compliance violations."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Documentation > Updating policies/procedures",
    contextSummary: "Updating policies and procedures ensures that organizational rules and step-by-step processes reflect current system configurations, security controls, and operational practices. When changes modify how systems work or how security is enforced, related policies and procedures must be revised and communicated to relevant personnel. Outdated documentation can result in policy violations, audit findings, and inconsistent security practices."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of change management processes and the impact to security > Version control",
    contextSummary: "Version control tracks changes to files, configurations, code, and documents over time, maintaining a history of who made changes, what was changed, and when changes occurred. Version control enables rollback to previous versions, comparison between versions, and collaborative development. For security, version control provides audit trails, change attribution, and the ability to review security-relevant configuration changes."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions",
    contextSummary: "This objective covers cryptographic solutions that protect data confidentiality, integrity, and authenticity through encryption, hashing, digital signatures, and key management. Understanding cryptography is essential for securing data at rest and in transit, implementing public key infrastructure (PKI), and selecting appropriate cryptographic algorithms and key lengths. Students learn when and how to apply cryptographic tools to address specific security requirements."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Public key infrastructure (PKI)",
    contextSummary: "Public Key Infrastructure (PKI) is a framework that manages digital certificates and public/private key pairs to enable secure communications, authentication, and data protection. PKI includes certificate authorities (CAs) that issue and revoke certificates, registration authorities (RAs) that verify identities, and certificate repositories. PKI enables secure email, SSL/TLS for web traffic, code signing, and digital signatures."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Public key infrastructure (PKI) > Public key",
    contextSummary: "A public key is the openly shared half of an asymmetric key pair used in public key cryptography. The public key can be freely distributed and is used to encrypt data that only the corresponding private key can decrypt, or to verify digital signatures created with the private key. Public keys are embedded in digital certificates issued by certificate authorities to bind identities to key pairs."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Public key infrastructure (PKI) > Private key",
    contextSummary: "A private key is the secret half of an asymmetric key pair that must be kept confidential and securely protected. The private key is used to decrypt data encrypted with the corresponding public key or to create digital signatures that can be verified with the public key. Compromise of a private key allows attackers to decrypt confidential communications or impersonate the key owner."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Public key infrastructure (PKI) > Key escrow",
    contextSummary: "Key escrow is a process where cryptographic keys are stored with a trusted third party to enable key recovery in specific circumstances such as legal investigations, employee departure, or disaster recovery. While key escrow provides business continuity and legal compliance benefits, it introduces security risks if the escrow service is compromised. Organizations must balance the need for key recovery against the increased attack surface of centralized key storage."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption",
    contextSummary: "Encryption is the process of transforming plaintext data into ciphertext using cryptographic algorithms and keys to protect confidentiality. Encryption can be applied at different levels (full-disk, partition, file, volume, database, record) and in different contexts (data at rest, data in transit). Understanding encryption types (symmetric, asymmetric), algorithms, key lengths, and key exchange mechanisms is essential for implementing effective data protection."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Level",
    contextSummary: "Encryption level refers to the granularity at which encryption is applied to data, ranging from full-disk encryption protecting entire storage devices to record-level encryption protecting individual database entries. Each level offers different trade-offs between security, performance, and management complexity. Choosing the appropriate encryption level depends on data sensitivity, compliance requirements, performance constraints, and operational workflows."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Level > Full-disk",
    contextSummary: "Full-disk encryption (FDE) encrypts all data on a storage device including the operating system, applications, and user files, protecting against data theft if the device is lost or stolen. FDE typically uses hardware-based encryption (self-encrypting drives) or software-based encryption (BitLocker, FileVault) with keys protected by TPM or user passwords. FDE provides transparent protection with minimal performance impact but doesn't protect data when the system is running and unlocked."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Level > Partition",
    contextSummary: "Partition encryption encrypts specific disk partitions rather than the entire disk, allowing selective protection of sensitive data while leaving other partitions unencrypted. This approach offers flexibility for dual-boot systems, system recovery partitions, or separating sensitive data from less critical information. Partition encryption provides targeted protection with less overhead than full-disk encryption but requires careful configuration to avoid exposing sensitive data."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Level > File",
    contextSummary: "File encryption encrypts individual files or folders rather than entire disks or partitions, providing granular protection for specific sensitive documents. Users can selectively encrypt confidential files while leaving other data unencrypted for easier sharing or access. File encryption offers flexibility and portability but requires users to consciously decide which files need protection, potentially leading to inconsistent security practices."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Level > Volume",
    contextSummary: "Volume encryption encrypts logical storage volumes that may span multiple physical disks or consist of portions of disks. Volume encryption is commonly used in network-attached storage (NAS), storage area networks (SAN), and virtualized environments. This approach protects data at the storage layer independently of the operating system, enabling encryption for multiple systems sharing storage infrastructure."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Level > Database",
    contextSummary: "Database encryption protects data stored in databases by encrypting entire databases, specific tables, columns, or cells. Database encryption can be implemented at the storage level (transparent data encryption encrypting database files), application level (encrypting data before storage), or column level (encrypting specific sensitive fields). This approach protects against database file theft, unauthorized administrator access, and compliance violations."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Level > Record",
    contextSummary: "Record encryption encrypts individual database records or rows rather than entire tables or databases, providing the most granular level of database protection. This approach allows different records to be encrypted with different keys based on data sensitivity or ownership. Record-level encryption offers strong security and access control but introduces complexity in key management, query performance, and application integration."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Transport/communication",
    contextSummary: "Transport/communication encryption (also called encryption in transit) protects data while it travels across networks using protocols like TLS/SSL, IPsec, SSH, and VPNs. This encryption prevents eavesdropping, man-in-the-middle attacks, and data interception on untrusted networks. Transport encryption is essential for protecting sensitive communications over the internet, wireless networks, and between distributed systems."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Asymmetric",
    contextSummary: "Asymmetric encryption (also called public key encryption) uses mathematically related key pairs where data encrypted with one key can only be decrypted with the other key. This enables secure key distribution, digital signatures, and authentication without requiring secure key exchange. Common asymmetric algorithms include RSA, ECC (elliptic curve cryptography), and Diffie-Hellman key exchange, though they are slower than symmetric encryption."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Symmetric",
    contextSummary: "Symmetric encryption uses the same key for both encryption and decryption, making it faster and more efficient than asymmetric encryption but requiring secure key distribution. Common symmetric algorithms include AES (Advanced Encryption Standard), 3DES, and ChaCha20. Symmetric encryption is used for encrypting large amounts of data, disk encryption, and protecting data at rest after keys are securely exchanged using asymmetric methods."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Key exchange",
    contextSummary: "Key exchange is the process of securely establishing symmetric encryption keys between communicating parties without transmitting the keys directly over insecure channels. Methods include Diffie-Hellman key exchange (generates shared secret through mathematical operations), RSA key exchange (encrypts symmetric keys with public keys), and ephemeral key exchange (generates temporary keys for forward secrecy). Secure key exchange prevents man-in-the-middle attacks and key interception."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Algorithms",
    contextSummary: "Cryptographic algorithms are mathematical functions that transform plaintext into ciphertext (and vice versa) using encryption keys. Choosing appropriate algorithms involves considering security strength, performance, compatibility, and regulatory compliance. Modern recommended algorithms include AES for symmetric encryption, RSA and ECC for asymmetric encryption, and SHA-256/SHA-3 for hashing, while outdated algorithms like DES and MD5 should be avoided."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Encryption > Key length",
    contextSummary: "Key length is the size of the cryptographic key measured in bits, directly affecting the security strength and computational difficulty of breaking encryption. Longer keys provide stronger security but require more computational resources. Current recommendations include 128-256 bits for symmetric encryption (AES), 2048-4096 bits for RSA, and 256-384 bits for elliptic curve cryptography (ECC), with requirements evolving as computing power increases."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Tools",
    contextSummary: "Cryptographic tools are hardware and software solutions that implement encryption, key management, and cryptographic operations. These tools range from operating system features to dedicated hardware security modules. Understanding when and how to use tools like TPM, HSM, key management services, and cryptographic libraries is essential for implementing robust data protection while managing keys securely."
  },
  {
    fullPath: "General Security Concepts > Explain the importance of using appropriate cryptographic solutions > Tools > Trusted Platform Module (TPM)",
    contextSummary: "Trusted Platform Module (TPM) is a hardware chip that provides secure storage for cryptographic keys, platform measurements, and security credentials. TPM enables hardware-based encryption, secure boot verification, and protection against firmware attacks by storing keys in tamper-resistant hardware rather than software. TPMs are used for full-disk encryption (BitLocker), platform integrity verification, and hardware-rooted trust in secure computing."
  }
]

// Run if called directly
if (require.main === module) {
  updateSummariesByPath(batch3)
}

export { batch3 }
