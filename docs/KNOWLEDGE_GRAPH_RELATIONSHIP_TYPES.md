# Knowledge Graph Relationship Types

This document defines all relationship types used in the Axium knowledge graph for cybersecurity education.

## Overview

The knowledge graph uses **domain-specific relationship types** to create meaningful connections between concepts. This enables better question generation, context retrieval, and learning path recommendations.

## Relationship Type Categories

### 1. TAXONOMY (Classification & Hierarchy)
Relationships that define how concepts are categorized and organized.

| Type | Description | Example |
|------|-------------|---------|
| `IS_A` | Type/subtype relationship | Phishing IS_A Social Engineering |
| `PART_OF` | Component/whole relationship | TCP PART_OF Network Protocol Suite |
| `CATEGORY_OF` | Classification | Symmetric CATEGORY_OF Encryption |
| `EXAMPLE_OF` | Concrete instance | WannaCry EXAMPLE_OF Ransomware |
| `VARIANT_OF` | Alternative version | WPA3 VARIANT_OF WPA |

### 2. SECURITY (Attack & Defense)
Relationships specific to cybersecurity concepts.

| Type | Description | Example |
|------|-------------|---------|
| `PROTECTS_AGAINST` | Defense mechanism | Firewall PROTECTS_AGAINST Unauthorized Access |
| `EXPLOITS` | Attack leverages vulnerability | SQL Injection EXPLOITS Input Validation Flaw |
| `ATTACKS` | Offensive action | Malware ATTACKS System Resources |
| `DEFENDS` | Protective measure | Antivirus DEFENDS Malware Infection |
| `MITIGATES` | Reduces risk | Encryption MITIGATES Data Breach |
| `DETECTS` | Identifies threat | IDS DETECTS Intrusion Attempt |
| `PREVENTS` | Blocks occurrence | 2FA PREVENTS Unauthorized Login |
| `VULNERABLE_TO` | Weakness exposed to | Legacy System VULNERABLE_TO Zero-Day Exploit |

### 3. TECHNICAL (Implementation & Function)
Relationships describing technical implementation and operation.

| Type | Description | Example |
|------|-------------|---------|
| `IMPLEMENTS` | Realizes specification | SSL/TLS IMPLEMENTS Encryption Protocol |
| `USES` | Utilizes component | HTTPS USES SSL/TLS |
| `REQUIRES` | Dependency for operation | SSH REQUIRES Public Key Infrastructure |
| `ENABLES` | Makes possible | VPN ENABLES Secure Remote Access |
| `CONFIGURES` | Sets parameters | Firewall Rule CONFIGURES Port Access |
| `ENCRYPTS` | Applies encryption | AES ENCRYPTS Sensitive Data |
| `DECRYPTS` | Removes encryption | Private Key DECRYPTS Encrypted Message |
| `AUTHENTICATES` | Verifies identity | OAuth AUTHENTICATES User Identity |
| `AUTHORIZES` | Grants permission | Access Control AUTHORIZES Resource Access |
| `VALIDATES` | Confirms correctness | Certificate Authority VALIDATES Digital Certificate |

### 4. FUNCTIONAL (Operational Activities)
Relationships describing what systems do in operation.

| Type | Description | Example |
|------|-------------|---------|
| `MONITORS` | Observes activity | SIEM MONITORS Network Traffic |
| `LOGS` | Records events | Security System LOGS Access Attempts |
| `ALERTS` | Notifies of event | IDS ALERTS Security Team |
| `FILTERS` | Selectively processes | Spam Filter FILTERS Email Messages |
| `BLOCKS` | Prevents action | Firewall BLOCKS Malicious IP |
| `ALLOWS` | Permits action | Whitelist ALLOWS Trusted Domain |
| `SCANS` | Examines for issues | Vulnerability Scanner SCANS Network Hosts |

### 5. EDUCATIONAL (Learning & Prerequisites)
Relationships for learning path construction.

| Type | Description | Example |
|------|-------------|---------|
| `DEPENDS_ON` | Requires prior knowledge | Public Key Crypto DEPENDS_ON Prime Numbers |
| `PREREQUISITE_FOR` | Needed before learning | TCP/IP PREREQUISITE_FOR Network Security |
| `SIMILAR_TO` | Comparable concept | Hashing SIMILAR_TO Encryption |
| `CONTRASTS_WITH` | Different approach | Symmetric CONTRASTS_WITH Asymmetric Encryption |
| `COMPARED_TO` | Side-by-side evaluation | RSA COMPARED_TO ECC |
| `SUPERSEDES` | Replaces older version | TLS 1.3 SUPERSEDES TLS 1.2 |

### 6. LOGICAL (Cause & Effect)
Relationships describing logical connections.

| Type | Description | Example |
|------|-------------|---------|
| `CAUSES` | Directly leads to | Buffer Overflow CAUSES Code Execution |
| `SOLVES` | Addresses problem | Patch SOLVES Vulnerability |
| `LEADS_TO` | Results in outcome | Weak Password LEADS_TO Account Compromise |
| `RESULTS_IN` | Produces consequence | Phishing RESULTS_IN Credential Theft |
| `TRIGGERS` | Initiates event | Anomaly TRIGGERS IDS Alert |

## Usage Guidelines

### 1. Choose the Most Specific Type
Always prefer the most specific relationship type that accurately describes the connection:

- ❌ **Generic**: Firewall PREVENTS DDoS Attack
- ✅ **Specific**: Firewall PROTECTS_AGAINST DDoS Attack

### 2. Security Context
For cybersecurity topics, prioritize SECURITY category types:

```
SQL Injection EXPLOITS Input Validation
WAF PROTECTS_AGAINST SQL Injection
Input Sanitization MITIGATES SQL Injection
```

### 3. Technical Implementation
For system design and implementation:

```
HTTPS IMPLEMENTS Secure Communication
HTTPS REQUIRES SSL/TLS Certificate
SSL/TLS ENCRYPTS Network Traffic
```

### 4. Learning Paths
For educational prerequisites:

```
Networking Basics PREREQUISITE_FOR Network Security
Encryption DEPENDS_ON Cryptographic Algorithms
AES COMPARED_TO RSA
```

## Benefits

### Better Question Generation
Specific relationships enable more accurate question context:
- "What does a firewall PROTECT_AGAINST?" (not just "prevent")
- "What EXPLOITS SQL injection?" (attack vectors)
- "What REQUIRES multi-factor authentication?" (dependencies)

### Improved Context Retrieval
When generating questions about "Encryption":
- Find what it PROTECTS_AGAINST (threats)
- Find what IMPLEMENTS it (technologies)
- Find what DEPENDS_ON it (prerequisites)
- Find what it's COMPARED_TO (alternatives)

### Richer Knowledge Representation
Instead of generic "related to" connections, we have semantic meaning:

**Before (generic):**
```
Firewall -> DDoS Attack (related)
```

**After (specific):**
```
Firewall PROTECTS_AGAINST DDoS Attack
DDoS Attack EXPLOITS Network Bandwidth
Rate Limiting MITIGATES DDoS Attack
IDS DETECTS DDoS Attack
```

## Migration Plan

### Current State
Your existing graph has mostly hierarchy relationships:
- CHILD_OF, PARENT_OF: 1,678 relationships (hierarchy)
- IS_A: 399 (taxonomy)
- PREREQUISITE: 338 (learning)
- RELATED_CONCEPT: 110 (vague)

### Next Steps

1. **Re-process existing content** with new relationship types
2. **Rebuild knowledge graph** to extract richer relationships
3. **Query patterns** will become more meaningful:
   - Find all attack vectors: `MATCH ()-[r:EXPLOITS]->() RETURN r`
   - Find defenses: `MATCH ()-[r:PROTECTS_AGAINST]->() RETURN r`
   - Find prerequisites: `MATCH ()-[r:PREREQUISITE_FOR]->() RETURN r`

## Example Knowledge Graph

```cypher
// Firewall concept with rich relationships
(:Tool {name: "Firewall"})-[:PROTECTS_AGAINST]->(:Threat {name: "DDoS Attack"})
(:Tool {name: "Firewall"})-[:MONITORS]->(:Asset {name: "Network Traffic"})
(:Tool {name: "Firewall"})-[:BLOCKS]->(:Action {name: "Unauthorized Access"})
(:Tool {name: "Firewall"})-[:USES]->(:Technique {name: "Packet Filtering"})
(:Tool {name: "Firewall"})-[:LOGS]->(:Event {name: "Connection Attempts"})

// Attack chain
(:Attack {name: "SQL Injection"})-[:EXPLOITS]->(:Vulnerability {name: "Input Validation Flaw"})
(:Attack {name: "SQL Injection"})-[:LEADS_TO]->(:Impact {name: "Data Breach"})
(:Defense {name: "Input Sanitization"})-[:MITIGATES]->(:Attack {name: "SQL Injection"})
(:Defense {name: "WAF"})-[:PROTECTS_AGAINST]->(:Attack {name: "SQL Injection"})

// Learning path
(:Concept {name: "Networking Basics"})-[:PREREQUISITE_FOR]->(:Concept {name: "Network Security"})
(:Concept {name: "Network Security"})-[:DEPENDS_ON]->(:Concept {name: "TCP/IP"})
(:Concept {name: "Symmetric Encryption"})-[:CONTRASTS_WITH]->(:Concept {name: "Asymmetric Encryption"})
```

## Querying Examples

### Find all attack vectors for SQL Injection
```cypher
MATCH (attack:Concept {name: "SQL Injection"})-[:EXPLOITS]->(vuln)
RETURN attack, vuln
```

### Find all defenses against a threat
```cypher
MATCH (defense)-[:PROTECTS_AGAINST]->(threat {name: "DDoS Attack"})
RETURN defense.name AS defense_mechanism
```

### Find learning prerequisites for a topic
```cypher
MATCH path = (prereq)-[:PREREQUISITE_FOR*]->(topic {name: "Network Security"})
RETURN path
ORDER BY length(path)
```

### Find attack chains (what leads to what)
```cypher
MATCH chain = (start)-[:LEADS_TO|RESULTS_IN*1..3]->(end)
WHERE start.name = "Phishing"
RETURN chain
```

---

**Last Updated**: 2025-01-16
**Status**: Active - Use these relationship types for all knowledge graph extraction
