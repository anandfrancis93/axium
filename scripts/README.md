# Curriculum Import Scripts

This directory contains scripts for parsing, generating summaries, and importing the CompTIA Security+ curriculum into Neo4j.

## Overview

The curriculum data pipeline:

1. **Parse** curriculum markdown → JSON with hierarchy
2. **Generate** context summaries for all entities
3. **Import** to Neo4j graph database
4. **Validate** imported data

## Scripts

### Curriculum Parser

**`parse-curriculum.ts`** - Parses curriculum markdown into structured JSON

```bash
npx tsx scripts/parse-curriculum.ts
```

Output: `curriculum-parsed.json` with 844 entities

### Context Summary Generation

**Batch scripts** - Generate AI summaries for curriculum entities

```bash
# Individual batches (already completed)
npx tsx scripts/batch-9-summaries.ts
npx tsx scripts/batch-10-summaries.ts
npx tsx scripts/batch-11a-summaries.ts
npx tsx scripts/batch-11b-summaries.ts
npx tsx scripts/batch-11c-summaries.ts
```

**`list-missing-summaries.ts`** - Check which entities need summaries

```bash
npx tsx scripts/list-missing-summaries.ts
```

### Neo4j Import

**`import-to-neo4j.ts`** - Import curriculum data to Neo4j

**Test Mode** (first 20 entities):
```bash
npx tsx scripts/import-to-neo4j.ts --test
```

**Test with custom limit**:
```bash
npx tsx scripts/import-to-neo4j.ts --test --limit=50
```

**Full Import** (all 844 entities):
```bash
npx tsx scripts/import-to-neo4j.ts
```

**Options**:
- `--test` - Test mode (imports limited entities)
- `--limit=N` - Number of entities in test mode (default: 20)
- `--batch=N` - Batch size for import (default: 100)
- `--no-clear` - Don't clear existing data (append mode)

**Examples**:
```bash
# Test with first 10 entities
npx tsx scripts/import-to-neo4j.ts --test --limit=10

# Full import with smaller batches
npx tsx scripts/import-to-neo4j.ts --batch=50

# Append to existing data (don't clear)
npx tsx scripts/import-to-neo4j.ts --no-clear
```

### Neo4j Validation

**`validate-neo4j.ts`** - Validate imported data

```bash
npx tsx scripts/validate-neo4j.ts
```

Checks:
- Total node count
- Nodes by type (Domain, Objective, Topic, Subtopic, Sub-subtopic)
- Relationship counts (PARENT_OF, CHILD_OF)
- Orphaned nodes (missing parents)
- Depth distribution
- Context summary coverage
- Sample hierarchy queries
- Sample search queries

## Workflow

### Initial Setup

1. Ensure Neo4j is running and credentials are in `.env.local`:
   ```env
   NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=xxx
   NEO4J_DATABASE=neo4j
   ```

2. Parse curriculum (if not already done):
   ```bash
   npx tsx scripts/parse-curriculum.ts
   ```

3. Verify all summaries generated:
   ```bash
   npx tsx scripts/list-missing-summaries.ts
   ```
   Should show: `Missing summaries: 0`

### Test Import

1. Run test import with 20 entities:
   ```bash
   npx tsx scripts/import-to-neo4j.ts --test
   ```

2. Validate test import:
   ```bash
   npx tsx scripts/validate-neo4j.ts
   ```

3. Verify in Neo4j Browser:
   - Navigate to Neo4j console
   - Run: `MATCH (n:CurriculumEntity) RETURN n LIMIT 25`

### Full Import

1. Run full import (844 entities):
   ```bash
   npx tsx scripts/import-to-neo4j.ts
   ```

2. Validate full import:
   ```bash
   npx tsx scripts/validate-neo4j.ts
   ```

3. Expected output:
   - Total: 844 entities
   - Domain: 5
   - Objective: 28
   - Topic: 182
   - Subtopic: 538
   - Sub-subtopic: 91
   - PARENT_OF relationships: 839 (844 - 5 root domains)
   - CHILD_OF relationships: 839
   - No orphaned nodes
   - 100% context summary coverage

## Data Structure

### Entity Schema

Each curriculum entity has:

```typescript
{
  id: string              // Unique identifier
  name: string            // Entity name
  entityType: string      // Domain | Objective | Topic | Subtopic | Sub-subtopic
  fullPath: string        // Full hierarchical path (unique)
  depth: number           // Depth in hierarchy (0 = Domain)
  parentId: string | null // Parent entity ID (null for root)
  contextSummary: string  // 2-3 sentence AI-generated summary
  createdAt: datetime     // Import timestamp
  updatedAt: datetime     // Last update timestamp
}
```

### Relationships

- **PARENT_OF**: Parent → Child (e.g., Domain → Objective)
- **CHILD_OF**: Child → Parent (inverse for easier queries)

### Example Hierarchy

```
General Security Concepts (Domain, depth=0)
  └─ PARENT_OF → Compare and contrast various types of security controls (Objective, depth=1)
      └─ PARENT_OF → Categories (Topic, depth=2)
          └─ PARENT_OF → Technical (Subtopic, depth=3)
```

## Neo4j Queries

### Basic Queries

```cypher
// Get all domains
MATCH (d:CurriculumEntity {depth: 0})
RETURN d.name

// Get entity by path
MATCH (e:CurriculumEntity {fullPath: "General Security Concepts > Compare and contrast various types of security controls"})
RETURN e

// Get entity with children
MATCH (parent:CurriculumEntity {fullPath: "..."})
OPTIONAL MATCH (parent)-[:PARENT_OF]->(child)
RETURN parent, collect(child) AS children

// Search by name
MATCH (e:CurriculumEntity)
WHERE toLower(e.name) CONTAINS toLower("encryption")
RETURN e.name, e.fullPath, e.entityType
```

### Hierarchy Queries

```cypher
// Get full path from root to entity
MATCH path = (root:CurriculumEntity {depth: 0})-[:PARENT_OF*]->(entity:CurriculumEntity {id: "..."})
RETURN [node IN nodes(path) | node.name] AS hierarchyPath

// Get all descendants
MATCH (parent:CurriculumEntity {id: "..."})-[:PARENT_OF*]->(descendant)
RETURN descendant

// Get siblings (same parent)
MATCH (entity:CurriculumEntity {id: "..."})-[:CHILD_OF]->(parent)-[:PARENT_OF]->(sibling)
WHERE entity.id <> sibling.id
RETURN sibling
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
npx tsx -e "
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
await driver.verifyConnectivity();
console.log('Connected!');
await driver.close();
"
```

### Clear Database

```cypher
// In Neo4j Browser - delete all curriculum data
MATCH (n:CurriculumEntity)
DETACH DELETE n
```

### Re-import

```bash
# Full re-import (clears existing data)
npx tsx scripts/import-to-neo4j.ts

# Or keep existing data
npx tsx scripts/import-to-neo4j.ts --no-clear
```

## Next Steps

After successful import:

1. **Cross-references** - Find duplicate topic names across domains
2. **RELATED_CONCEPT relationships** - Link related concepts
3. **Scope tags** - Add tags (cryptography, network-security, etc.)
4. **Supabase sync** - Populate cache from Neo4j
5. **Query optimization** - Build and test performance queries
6. **Documentation** - Document schema and example queries

## File Structure

```
scripts/
├── README.md                      # This file
├── parse-curriculum.ts            # Parse markdown → JSON
├── batch-9-summaries.ts           # Summary batch 9
├── batch-10-summaries.ts          # Summary batch 10
├── batch-11a-summaries.ts         # Summary batch 11a
├── batch-11b-summaries.ts         # Summary batch 11b
├── batch-11c-summaries.ts         # Summary batch 11c (final)
├── update-summaries-by-path.ts    # Summary update utility
├── list-missing-summaries.ts      # Check missing summaries
├── import-to-neo4j.ts             # Import to Neo4j ⭐
├── validate-neo4j.ts              # Validate Neo4j data ⭐
└── ...

curriculum-parsed.json              # Parsed curriculum (844 entities)
```

---

**Status**: ✅ All 844 context summaries generated (100%)
**Next**: Run test import to Neo4j
