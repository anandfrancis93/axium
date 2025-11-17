-- Add comprehensive cryptography topics with formal textbook definitions
-- Hierarchy: Cryptography (L1) → Categories (L2) → Specific Topics (L3)

-- Get Cybersecurity subject ID
DO $$
DECLARE
  v_subject_id UUID;
  v_crypto_id UUID;
  v_encryption_fundamentals_id UUID;
  v_symmetric_id UUID;
  v_asymmetric_id UUID;
  v_hashing_id UUID;
  v_pki_id UUID;
  v_key_mgmt_id UUID;
  v_data_protection_id UUID;
  v_obfuscation_id UUID;
  v_encryption_levels_id UUID;
  v_transport_encryption_id UUID;
BEGIN
  -- Get subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- ============================================================================
  -- Level 1: Cryptography (top-level parent)
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    NULL,
    'Cryptography',
    'The science and practice of altering data to make it unintelligible to unauthorized parties.',
    1
  )
  RETURNING id INTO v_crypto_id;

  -- ============================================================================
  -- Level 2: Main Categories
  -- ============================================================================

  -- Encryption Fundamentals
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Encryption Fundamentals',
    'Basic concepts and components of encryption systems including plaintext, ciphertext, keys, and algorithms.',
    2
  )
  RETURNING id INTO v_encryption_fundamentals_id;

  -- Symmetric Encryption
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Symmetric Encryption',
    'Two-way encryption scheme in which encryption and decryption are both performed by the same key. Also known as shared-key encryption.',
    2
  )
  RETURNING id INTO v_symmetric_id;

  -- Asymmetric Encryption
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Asymmetric Encryption',
    'Encryption using public and private key pairs where keys are mathematically linked but private key is not derivable from public key.',
    2
  )
  RETURNING id INTO v_asymmetric_id;

  -- Hashing
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Hashing',
    'A function that converts an arbitrary-length string input to a fixed-length string output. A cryptographic hash function does this in a way that reduces the chance of collisions.',
    2
  )
  RETURNING id INTO v_hashing_id;

  -- Public Key Infrastructure (PKI)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Public Key Infrastructure (PKI)',
    'A framework of certificate authorities, digital certificates, software, services, and other cryptographic components deployed for the purpose of validating subject identities.',
    2
  )
  RETURNING id INTO v_pki_id;

  -- Key Management
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Key Management',
    'Procedures and tools that centralize generation, storage, distribution, revocation, and renewal of cryptographic keys.',
    2
  )
  RETURNING id INTO v_key_mgmt_id;

  -- Data Protection
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Data Protection',
    'Encryption techniques for protecting data in different states: at rest, in transit, and in use.',
    2
  )
  RETURNING id INTO v_data_protection_id;

  -- Obfuscation
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_crypto_id,
    'Obfuscation',
    'A technique that essentially "hides" or "camouflages" code or other information so that it is harder to read by unauthorized users.',
    2
  )
  RETURNING id INTO v_obfuscation_id;

  -- ============================================================================
  -- Level 3: Encryption Fundamentals Topics
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_encryption_fundamentals_id, 'Plaintext / Cleartext', 'Unencrypted data that is meant to be encrypted before it is transmitted, or the result of decryption of encrypted data.', 3),
    (v_subject_id, v_encryption_fundamentals_id, 'Ciphertext', 'Data that has been enciphered and cannot be read without the cipher key.', 3),
    (v_subject_id, v_encryption_fundamentals_id, 'Cryptographic Algorithm', 'Operations that transform a plaintext into a ciphertext with cryptographic properties, also called a cipher. There are symmetric, asymmetric, and hash cipher types.', 3),
    (v_subject_id, v_encryption_fundamentals_id, 'Cryptanalysis', 'The science, art, and practice of breaking codes and ciphers.', 3),
    (v_subject_id, v_encryption_fundamentals_id, 'Encryption', 'Scrambling the characters used in a message so that the message can be seen but not understood or modified unless it can be deciphered.', 3),
    (v_subject_id, v_encryption_fundamentals_id, 'Cryptographic Key', 'In cryptography, a specific piece of information that is used in conjunction with an algorithm to perform encryption and decryption.', 3),
    (v_subject_id, v_encryption_fundamentals_id, 'Key Length', 'Size of a cryptographic key in bits. Longer keys generally offer better security, but key lengths for different ciphers are not directly comparable.', 3),
    (v_subject_id, v_encryption_fundamentals_id, 'Cryptographic Primitive', 'A single hash function, symmetric cipher, or asymmetric cipher.', 3);

  -- ============================================================================
  -- Level 3: Symmetric Encryption (no children - definition in Level 2)
  -- ============================================================================

  -- ============================================================================
  -- Level 3: Asymmetric Encryption Topics
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_asymmetric_id, 'Asymmetric Algorithm', 'Cipher that uses public and private keys. The keys are mathematically linked using RSA or ECC algorithms, but the private key is not derivable from the public one.', 3),
    (v_subject_id, v_asymmetric_id, 'Public Key', 'During asymmetric encryption, the public key is freely distributed and used to encrypt data, which can only be decrypted by the linked private key in the pair.', 3),
    (v_subject_id, v_asymmetric_id, 'Private Key', 'In asymmetric encryption, the private key is known only to the holder and is linked to, but not derivable from, a public key distributed to those with whom the holder wants to communicate securely.', 3);

  -- ============================================================================
  -- Level 3: Hashing Topics
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_hashing_id, 'Digital Signature', 'A message digest encrypted using the sender''s private key that is appended to a message to authenticate the sender and prove message integrity.', 3),
    (v_subject_id, v_hashing_id, 'Secure Hash Algorithm (SHA)', 'A cryptographic hashing algorithm created to address possible weaknesses in MD5. The current version is SHA-2.', 3),
    (v_subject_id, v_hashing_id, 'Message Digest Algorithm #5 (MD5)', 'A cryptographic hash function producing a 128-bit output.', 3),
    (v_subject_id, v_hashing_id, 'Hash-based Message Authentication Code (HMAC)', 'A method used to verify both the integrity and authenticity of a message by combining a cryptographic hash of the message with a secret key.', 3);

  -- ============================================================================
  -- Level 3: PKI Topics
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_pki_id, 'Certificate Authority (CA)', 'A server that guarantees subject identities by issuing signed digital certificate wrappers for their public keys.', 3),
    (v_subject_id, v_pki_id, 'Third Party Certificate Authority', 'In PKI, a public CA that issues certificates for multiple domains and is widely trusted as a root trust by operating systems and browsers.', 3),
    (v_subject_id, v_pki_id, 'Digital Certificate', 'Identification and authentication information presented in the X.509 format and issued by a certificate authority (CA) as a guarantee that a key pair is valid for a particular subject.', 3),
    (v_subject_id, v_pki_id, 'Public Key Cryptography Standards (PKCS)', 'A series of standards defining the use of certificate authorities and digital certificates.', 3),
    (v_subject_id, v_pki_id, 'Root of Trust', 'The root of trust model defines how users and different CAs can trust one another. Each CA issues itself a self-signed root certificate.', 3),
    (v_subject_id, v_pki_id, 'Root Certificate', 'In PKI, a root certificate is a self-signed certificate that serves as the trust anchor and can issue certificates to intermediate CAs in a hierarchy.', 3),
    (v_subject_id, v_pki_id, 'Single Certificate Authority', 'A simple model where a single root CA issues certificates directly to users and computers, often used on private networks.', 3),
    (v_subject_id, v_pki_id, 'Certificate Chaining / Chain of Trust', 'A method of validating a certificate by tracing each CA that signs the certificate, up through the hierarchy to the root CA.', 3),
    (v_subject_id, v_pki_id, 'Self-signed Certificate', 'A digital certificate that has been signed by the entity that issued it, rather than by a CA.', 3),
    (v_subject_id, v_pki_id, 'Certificate Signing Request (CSR)', 'A Base64 ASCII file that a subject sends to a CA to get a certificate.', 3),
    (v_subject_id, v_pki_id, 'Common Name (CN)', 'An X500 attribute expressing a host or username, also used as the subject identifier for a digital certificate.', 3),
    (v_subject_id, v_pki_id, 'Subject Alternative Name (SAN)', 'A field in a digital certificate allowing a host to be identified by multiple host names/subdomains.', 3),
    (v_subject_id, v_pki_id, 'Wildcard Domain', 'In PKI, a digital certificate that will match multiple subdomains of a parent domain.', 3),
    (v_subject_id, v_pki_id, 'Online Certificate Status Protocol (OCSP)', 'Allows clients to request the status of a digital certificate, to check whether it is revoked.', 3),
    (v_subject_id, v_pki_id, 'Certificate Revocation List (CRL)', 'A list of certificates that were revoked before their expiration date.', 3);

  -- ============================================================================
  -- Level 3: Key Management Topics
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_key_mgmt_id, 'Entropy', 'A measure of disorder. Cryptographic systems should exhibit high entropy to better resist brute force attacks.', 3),
    (v_subject_id, v_key_mgmt_id, 'Pseudo Random Number Generator (PRNG)', 'The process by which an algorithm produces numbers that approximate randomness without being truly random.', 3),
    (v_subject_id, v_key_mgmt_id, 'True Random Number Generator (TRNG)', 'A method of generating random values by sampling physical phenomena that has a high rate of entropy.', 3),
    (v_subject_id, v_key_mgmt_id, 'Hardware Security Module (HSM)', 'An appliance for generating and storing cryptographic keys. This sort of solution may be less susceptible to tampering and insider threats than software-based storage.', 3),
    (v_subject_id, v_key_mgmt_id, 'Key Escrow', 'In key management, the storage of a backup key with a third party.', 3),
    (v_subject_id, v_key_mgmt_id, 'Key Exchange', 'Any method by which cryptographic keys are transferred among users, thus enabling the use of a cryptographic algorithm.', 3),
    (v_subject_id, v_key_mgmt_id, 'Diffie-Hellman (D-H)', 'A cryptographic technique that provides secure key exchange.', 3),
    (v_subject_id, v_key_mgmt_id, 'Ephemeral Session Key', 'In cryptography, a key that is used within the context of a single session only.', 3),
    (v_subject_id, v_key_mgmt_id, 'Perfect Forward Secrecy (PFS)', 'A characteristic of transport encryption that ensures if a key is compromised, the compromise will only affect a single session and not facilitate recovery of plaintext data from other sessions.', 3),
    (v_subject_id, v_key_mgmt_id, 'Salting', 'A security countermeasure that mitigates the impact of precomputed hash table attacks by adding a random value to each plaintext input.', 3),
    (v_subject_id, v_key_mgmt_id, 'Key Stretching', 'A technique that strengthens potentially weak input for cryptographic key generation, such as passwords or passphrases created by people, against brute force attacks.', 3),
    (v_subject_id, v_key_mgmt_id, 'Trusted Platform Module (TPM)', 'Specification for secure hardware-based storage of encryption keys, hashed passwords, and other user- and platform-identification information.', 3),
    (v_subject_id, v_key_mgmt_id, 'Virtual Trusted Platform Module (vTPM)', 'A virtual TPM can be implemented in a hypervisor to provide a service to virtual machines (VMs).', 3),
    (v_subject_id, v_key_mgmt_id, 'Blockchain', 'A concept in which an expanding list of transactional records listed in a public ledger is secured using cryptography.', 3),
    (v_subject_id, v_key_mgmt_id, 'Open Public Ledger', 'Distributed public record of transactions that underpins the integrity of blockchains.', 3);

  -- ============================================================================
  -- Level 3: Data Protection Topics
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_data_protection_id, 'Data at Rest', 'Information that is primarily stored on specific media, rather than moving from one medium to another.', 3),
    (v_subject_id, v_data_protection_id, 'Data in Transit / Data in Motion', 'Information that is being transmitted between two hosts, such as over a private network or the Internet.', 3),
    (v_subject_id, v_data_protection_id, 'Data in Use / Data in Processing', 'Information that is present in the volatile memory of a host, such as system memory or cache.', 3);

  -- Create Encryption Levels parent under Data Protection
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_data_protection_id,
    'Encryption Levels',
    'Target for data-at-rest encryption, ranging from more granular (file or row/record) to less granular (volume/partition/disk or database).',
    3
  )
  RETURNING id INTO v_encryption_levels_id;

  -- Level 4: Encryption Levels sub-topics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_encryption_levels_id, 'Full Disk Encryption (FDE)', 'Full-disk encryption refers to a product that encrypts the whole contents of a storage device, including metadata areas and free space.', 4),
    (v_subject_id, v_encryption_levels_id, 'Self-Encrypting Drive (SED)', 'A storage device that performs self-encryption using a cryptographic product built into the disk firmware.', 4),
    (v_subject_id, v_encryption_levels_id, 'Partition Encryption', 'Encrypting specific partitions on a disk selectively, rather than the whole disk. Partitions could be encrypted using different keys.', 4),
    (v_subject_id, v_encryption_levels_id, 'Volume Encryption', 'Encryption implemented as a software application for a volume (storage resource with single file system), such as BitLocker or FileVault.', 4),
    (v_subject_id, v_encryption_levels_id, 'File Encryption', 'Software that applies encryption to individual files or folders/directories.', 4),
    (v_subject_id, v_encryption_levels_id, 'Database-Level Encryption / Transparent Data Encryption (TDE)', 'Encryption that occurs when data is transferred between disk and memory, encrypting all records while stored on disk.', 4),
    (v_subject_id, v_encryption_levels_id, 'Record-Level Encryption / Cell/Column Encryption', 'Encryption applied to one or more fields within a database table, allowing fine-grained control over data access.', 4);

  -- Create Transport Encryption parent under Data Protection
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (
    v_subject_id,
    v_data_protection_id,
    'Transport / Communication Encryption',
    'Encryption scheme applied to data-in-motion, such as WPA, IPsec, or TLS.',
    3
  )
  RETURNING id INTO v_transport_encryption_id;

  -- ============================================================================
  -- Level 3: Obfuscation Topics
  -- ============================================================================
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_obfuscation_id, 'Steganography', 'A technique for obscuring the presence of a message, often by embedding information within a file or other entity.', 3),
    (v_subject_id, v_obfuscation_id, 'Data Masking', 'A de-identification method where generic or placeholder labels are substituted for real data while preserving the structure or format of the original data.', 3),
    (v_subject_id, v_obfuscation_id, 'Tokenization', 'A de-identification method where a unique token is substituted for real data.', 3);

END $$;

-- Summary
DO $$
DECLARE
  total_count INTEGER;
  crypto_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM topics;
  SELECT COUNT(*) INTO crypto_count FROM topics WHERE name LIKE '%Crypt%' OR name LIKE '%Encryp%' OR name LIKE '%Hash%' OR name LIKE '%Key%' OR name LIKE '%PKI%' OR name LIKE '%Certificate%';

  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'CRYPTOGRAPHY TOPICS ADDED';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Total topics in database: %', total_count;
  RAISE NOTICE 'Cryptography-related topics: %', crypto_count;
  RAISE NOTICE '=================================================================';
END $$;
