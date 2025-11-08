# Knowledge Graph System

## Overview

The knowledge graph explicitly stores semantic relationships between topics, enabling discovery of cross-branch connections that embeddings alone cannot find.

**Example**: "Access badge" (physical security) → "Preventative control" (security control type)

## Problem Solved

**Embeddings (vector similarity)** can only find topics with similar words:
- "Access badge" → "ID card", "keycard" ✓
- "Access badge" → "Preventative control" ✗ (different words)

**Knowledge Graph** stores explicit relationships:
- "Access badge" **IS-A** "Preventative control" ✓
- "MFA" **MITIGATES** "Password attacks" ✓
- "Encryption" **ENABLES** "Confidentiality" ✓

## Relationship Types

### 1. IS-A (Type/Instance)
**Description**: Source is a type or instance of target

**Examples**:
- "Access badge" IS-A "Preventative control"
- "Phishing" IS-A "Social engineering attack"
- "AES" IS-A "Encryption algorithm"

**Use Case**: Taxonomic classification, understanding categories

---

### 2. PART-OF (Component)
**Description**: Source is a component or element of target

**Examples**:
- "Policy Engine" PART-OF "Control Plane"
- "Authentication" PART-OF "Identity management"
- "Hash function" PART-OF "Cryptographic primitives"

**Use Case**: Understanding system architecture, hierarchical decomposition

---

### 3. REQUIRES (Prerequisite)
**Description**: Source requires target as prerequisite knowledge

**Examples**:
- "Apply" REQUIRES "Understand" (Bloom taxonomy)
- "Public key cryptography" REQUIRES "Symmetric encryption"
- "Penetration testing" REQUIRES "Vulnerability assessment"

**Use Case**: Learning paths, prerequisite tracking

---

### 4. CONTRASTS-WITH (Opposition)
**Description**: Source is opposite or alternative to target

**Examples**:
- "Preventative control" CONTRASTS-WITH "Detective control"
- "Symmetric encryption" CONTRASTS-WITH "Asymmetric encryption"
- "Allow list" CONTRASTS-WITH "Block list"

**Use Case**: Comparing alternatives, understanding trade-offs

---

### 5. ENABLES (Enablement)
**Description**: Source makes target possible or achievable

**Examples**:
- "Encryption" ENABLES "Confidentiality"
- "MFA" ENABLES "Strong authentication"
- "Logging" ENABLES "Incident detection"

**Use Case**: Understanding how controls achieve objectives

---

### 6. MITIGATES (Risk Reduction)
**Description**: Source reduces or prevents risk of target

**Examples**:
- "MFA" MITIGATES "Password attacks"
- "Firewalls" MITIGATE "Unauthorized network access"
- "Input validation" MITIGATES "Injection attacks"

**Use Case**: Threat modeling, control effectiveness

---

## Database Schema

```sql
CREATE TYPE relationship_type AS ENUM (
  'is_a', 'part_of', 'requires', 'contrasts_with', 'enables', 'mitigates'
);

CREATE TABLE topic_relationships (
  id UUID PRIMARY KEY,
  source_topic_id UUID REFERENCES topics(id),
  target_topic_id UUID REFERENCES topics(id),
  relationship_type relationship_type,
  confidence FLOAT (0.0-1.0),
  reasoning TEXT,
  created_by TEXT ('ai' or 'manual'),
  reviewed BOOLEAN,
  created_at TIMESTAMPTZ
);
```

## Building the Graph

### Hybrid Approach (AI + Human Review)

**Step 1: AI Extraction**
```bash
# Process all topics
node scripts/build-knowledge-graph.mjs --mode=full

# Process single topic
node scripts/build-knowledge-graph.mjs --mode=incremental --topic-id=<uuid>
```

**Step 2: Review Suggestions**
```bash
# List relationships needing review (confidence 0.70-0.89)
node scripts/build-knowledge-graph.mjs --mode=review
```

**Step 3: Approve/Reject**
- High confidence (≥0.90): Auto-approved
- Medium confidence (0.70-0.89): Needs human review
- Low confidence (<0.70): Not stored

### How AI Extraction Works

For each topic:
1. Get 50 candidate topics (different branches, different domains)
2. Ask Claude: "What relationships exist between source and candidates?"
3. Claude analyzes and returns:
   ```json
   [
     {
       "candidate_id": 1,
       "relationship": "is_a",
       "confidence": 0.95,
       "reasoning": "Access badges are physical security controls that prevent unauthorized access"
     }
   ]
   ```
4. Store relationships in database
5. Mark high-confidence as auto-approved

## Usage in Code

### Finding Related Topics

```typescript
// Get related topics using knowledge graph
const { data: relatedTopics } = await supabase.rpc('get_related_topics_kg', {
  p_topic_id: topicId,
  p_min_confidence: 0.7,
  p_limit: 10
});

// Returns:
[
  {
    topic_id: "...",
    topic_name: "Preventative controls",
    relationship_type: "is_a",
    confidence: 0.95,
    reasoning: "Access badges prevent unauthorized access"
  }
]
```

### Bidirectional Relationships

```typescript
// Get both incoming and outgoing relationships
const { data: allRelationships } = await supabase.rpc('get_all_relationships', {
  p_topic_id: topicId,
  p_min_confidence: 0.7
});

// Returns relationships in both directions:
// - Outgoing: "Access badge" → "Preventative control"
// - Incoming: "Physical security" → "Access badge"
```

## Display in UI

When a user answers a question about "Access badge":

**Topic Details**: (hierarchical path)
```
General Security Concepts
  └─ Physical security
    └─ Access badge
```

**Related Topics**: (knowledge graph)
```
Preventative controls (IS-A)
├─ Security fundamentals
  └─ Security controls
    └─ Preventative controls

Physical access controls (PART-OF)
├─ General Security Concepts
  └─ Physical security
    └─ Physical access controls

Authentication (ENABLES)
├─ General Security Concepts
  └─ Identity and Access Management
    └─ Authentication
```

## Advantages

### 1. Cross-Branch Discovery
- Find "Preventative control" when studying "Access badge"
- Even though they're in different hierarchy branches

### 2. Semantic Understanding
- Embeddings: word similarity
- Knowledge graph: conceptual relationships

### 3. Explainability
- Each relationship includes reasoning
- Students understand WHY topics are related

### 4. Incremental Growth
- Add new topics → extract relationships automatically
- Graph grows with content

### 5. Human Oversight
- AI suggests, humans approve
- Low-confidence relationships flagged for review

## Maintenance

### Adding New Topics
```bash
# After creating a new topic in admin panel
node scripts/build-knowledge-graph.mjs --mode=incremental --topic-id=<new-topic-id>
```

### Reviewing Relationships
```bash
# List relationships needing review
node scripts/build-knowledge-graph.mjs --mode=review

# Approve in database
UPDATE topic_relationships
SET reviewed = true
WHERE id = '<relationship-id>';
```

### Rebuilding Graph
```bash
# Truncate existing relationships
TRUNCATE topic_relationships;

# Rebuild from scratch
node scripts/build-knowledge-graph.mjs --mode=full
```

## Performance

- **Lookups**: Fast (indexed on source_topic_id, relationship_type)
- **Initial build**: ~200 topics × 1 sec = ~3-4 minutes
- **Incremental updates**: <5 seconds per topic
- **Storage**: Minimal (~100-500 relationships for 200 topics)

## Future Enhancements

1. **Graph Visualization**: Show topic relationships as network diagram
2. **Relationship Strength**: Weight by confidence + usage frequency
3. **Transitive Relationships**: If A requires B and B requires C, infer A requires C
4. **User Feedback**: Learners can suggest missing relationships
5. **Multi-hop Discovery**: Find topics 2-3 steps away in graph

## Migration Path

1. ✅ Create schema (`20250108_create_topic_relationships.sql`)
2. ✅ Build extraction script (`scripts/build-knowledge-graph.mjs`)
3. ⏳ Apply migration to database
4. ⏳ Run initial graph build
5. ⏳ Update `findRelatedTopics()` to query knowledge graph
6. ⏳ Test with "Access badge" → "Preventative control"

---

**Status**: Schema designed, extraction script ready, awaiting database migration application.
