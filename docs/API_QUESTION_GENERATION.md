# Question Generation API Documentation

Complete API reference for GraphRAG-powered question generation system.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Question Generation APIs](#question-generation-apis)
4. [Question Retrieval APIs](#question-retrieval-apis)
5. [Context APIs](#context-apis)
6. [Response Formats](#response-formats)
7. [Error Handling](#error-handling)
8. [Rate Limits and Costs](#rate-limits-and-costs)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Overview

The Question Generation API uses GraphRAG (Graph-based Retrieval Augmented Generation) to create high-quality, Bloom-aligned security questions from a Neo4j knowledge graph of CompTIA Security+ curriculum.

**Base URL:** `https://yourapp.com/api`

**Features:**
- 6 Bloom taxonomy levels (Remember → Create)
- 5 question formats (MCQ Single/Multi, True/False, Fill Blank, Open-Ended)
- GraphRAG context injection for relevance
- Automatic storage and metadata tracking
- Duplicate detection
- Cost and token usage tracking

---

## Authentication

All API endpoints require authentication via Next.js session cookies or API keys (for server-side usage).

### Client-Side (Browser)

```typescript
// Automatic - uses Next.js auth session
const response = await fetch('/api/questions/generate-graphrag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...params })
})
```

### Server-Side (Scripts)

```typescript
// Use service role key (environment variable)
import { createScriptClient } from '@/lib/supabase/script-client'

const supabase = createScriptClient()
```

---

## Question Generation APIs

### 1. Generate Question (GraphRAG)

Generate a question using GraphRAG context from Neo4j knowledge graph.

**Endpoint:** `POST /api/questions/generate-graphrag`

**Request Body:**

```typescript
{
  entityId?: string,      // Neo4j entity UUID (option 1)
  entityName?: string,    // Entity name for search (option 2)
  bloomLevel: number,     // 1-6 (Required)
  format: QuestionFormat, // (Required)
  count?: number,         // Number of questions (default: 1)
  store?: boolean,        // Store in database (default: true)
  topicId?: string,       // Optional Supabase topic ID
  model?: string          // Optional Claude model override
}
```

**Question Formats:**
- `mcq_single` - Multiple choice, single correct answer
- `mcq_multi` - Multiple choice, multiple correct answers
- `fill_blank` - Fill in the blank
- `open_ended` - Open-ended essay question

**Response:**

```typescript
{
  success: boolean,
  count: number,
  questions: GeneratedQuestion[],
  stored?: string[],      // IDs of stored questions
  totalCost: number       // USD
}
```

**GeneratedQuestion Structure:**

```typescript
{
  question: string,
  options?: string[],           // For MCQs
  correctAnswer?: string,       // For MCQ single, True/False, Fill Blank
  correctAnswers?: string[],    // For MCQ multi
  explanation?: string,         // For MCQ, True/False, Fill Blank
  rubric?: string,              // For Open-ended
  keyPoints?: string[],         // For Open-ended
  bloomLevel: number,
  format: QuestionFormat,
  entityId: string,
  entityName: string,
  domain: string,
  fullPath: string,
  tokensUsed: {
    input: number,
    output: number,
    total: number
  },
  model: string
}
```

**Example Request:**

```bash
curl -X POST https://yourapp.com/api/questions/generate-graphrag \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "1dfe2982-936f-4764-9bd3-96769d32ac66",
    "bloomLevel": 2,
    "format": "mcq_single",
    "count": 1,
    "store": true
  }'
```

**Example Response:**

```json
{
  "success": true,
  "count": 1,
  "questions": [{
    "question": "A security administrator needs to explain the differences between encryption implementations to management. Which of the following best describes the key difference between symmetric and asymmetric encryption?",
    "options": [
      "A) Symmetric encryption uses the same key for encryption and decryption, while asymmetric uses different keys",
      "B) Symmetric encryption is slower but more secure than asymmetric encryption",
      "C) Asymmetric encryption can only be used for authentication, not data encryption",
      "D) Symmetric encryption uses public keys while asymmetric uses private keys"
    ],
    "correctAnswer": "A",
    "explanation": "Option A correctly explains that symmetric encryption uses the same key for both encryption and decryption...",
    "bloomLevel": 2,
    "format": "mcq_single",
    "entityId": "1dfe2982-936f-4764-9bd3-96769d32ac66",
    "entityName": "Encryption",
    "domain": "General Security Concepts",
    "fullPath": "General Security Concepts > Cryptography > Encryption",
    "tokensUsed": {
      "input": 1183,
      "output": 330,
      "total": 1513
    },
    "model": "claude-sonnet-4-20250514"
  }],
  "stored": ["550e8400-e29b-41d4-a716-446655440000"],
  "totalCost": 0.008499
}
```

---

## Question Retrieval APIs

### 2. Get Questions by Entity

Retrieve all questions generated for a specific Neo4j entity.

**Endpoint:** `GET /api/questions/by-entity`

**Query Parameters:**

```typescript
{
  entityId: string,           // Required
  bloomLevel?: number,        // Filter by Bloom level
  format?: QuestionFormat,    // Filter by format
  limit?: number              // Max results (default: 50, max: 200)
}
```

**Example:**

```bash
GET /api/questions/by-entity?entityId=1dfe2982-936f-4764-9bd3-96769d32ac66&bloomLevel=2&limit=10
```

**Response:**

```json
{
  "success": true,
  "entityId": "1dfe2982-936f-4764-9bd3-96769d32ac66",
  "entityName": "Encryption",
  "count": 5,
  "questions": [...]
}
```

### 3. Get Questions by Domain

Retrieve questions for an entire CompTIA domain.

**Endpoint:** `GET /api/questions/by-domain`

**Query Parameters:**

```typescript
{
  domain: string,           // Required (exact match)
  bloomLevel?: number,      // Filter by Bloom level
  limit?: number            // Max results (default: 100, max: 500)
}
```

**Valid Domains:**
- `General Security Concepts`
- `Threats, Vulnerabilities, and Mitigations`
- `Security Architecture`
- `Security Operations`
- `Security Program Management and Oversight`

**Example:**

```bash
GET /api/questions/by-domain?domain=General Security Concepts&bloomLevel=3&limit=20
```

### 4. Get Questions by Topic

Retrieve questions for a Supabase topic (if linked).

**Endpoint:** `GET /api/questions/by-topic`

**Query Parameters:**

```typescript
{
  topicId: string,            // Required (Supabase UUID)
  bloomLevel?: number,        // Filter by Bloom level
  format?: QuestionFormat,    // Filter by format
  difficulty?: string,        // easy, medium, hard
  sourceType?: string,        // manual, ai_generated_graphrag, ai_generated_realtime
  limit?: number              // Max results (default: 50, max: 200)
}
```

**Example:**

```bash
GET /api/questions/by-topic?topicId=a1b2c3d4-...&bloomLevel=2&format=mcq_single&difficulty=medium&limit=10
```

---

## Context APIs

### 5. Get GraphRAG Context

Retrieve complete GraphRAG context for an entity (used internally by question generation).

**Endpoint:** `GET /api/graphrag/context/[entityId]`

**Response:**

```json
{
  "id": "1dfe2982-936f-4764-9bd3-96769d32ac66",
  "name": "Encryption",
  "entityType": "Topic",
  "depth": 3,
  "summary": "Encryption is the process of converting data into...",
  "fullPath": "General Security Concepts > Cryptography > Encryption",
  "domain": "General Security Concepts",
  "objective": "1.4 Explain the importance of using appropriate cryptographic solutions",
  "scopeTags": ["cryptography", "data-protection"],
  "parentName": "Cryptography",
  "parentId": "...",
  "grandparentName": "General Security Concepts",
  "grandparentId": "...",
  "children": [{
    "id": "...",
    "name": "Symmetric Encryption",
    "entityType": "Subtopic",
    "summary": "..."
  }],
  "grandchildren": [...],
  "relatedConcepts": [{
    "id": "...",
    "name": "Hashing",
    "domain": "General Security Concepts",
    "sharedConcept": "Data Integrity",
    "strength": "high",
    "crossDomain": false
  }]
}
```

### 6. Search Entities

Search for entities by name, scope tag, or domain.

**Endpoint:** `GET /api/graphrag/search`

**Query Parameters:**

```typescript
{
  name?: string,         // Search by name
  scope?: string,        // Search by scope tag
  domain?: string,       // Search by domain
  limit?: number         // Max results (default: 50)
}
```

**Example:**

```bash
GET /api/graphrag/search?scope=cryptography&limit=20
```

---

## Response Formats

### Success Response

```typescript
{
  success: true,
  // ... endpoint-specific data
}
```

### Error Response

```typescript
{
  success: false,
  error: string,       // Error type
  message: string      // Error details
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (entity not found)
- `500` - Server Error (API failure, database error)

---

## Error Handling

### Common Errors

**Invalid Entity ID:**
```json
{
  "error": "Invalid entity ID format. Expected UUID.",
  "status": 400
}
```

**Entity Not Found:**
```json
{
  "error": "Entity not found",
  "status": 404
}
```

**Invalid Bloom Level:**
```json
{
  "error": "bloomLevel must be between 1 and 6",
  "status": 400
}
```

**Claude API Error:**
```json
{
  "success": false,
  "error": "Failed to generate question",
  "message": "Anthropic API error: 429 Rate limit exceeded"
}
```

### Retry Logic

The API includes automatic retry logic for transient errors:

- **Rate Limits (429):** Exponential backoff (1s, 2s, 4s)
- **Server Errors (5xx):** Up to 3 retries
- **Timeout:** Fails after 60 seconds

### Handling Errors in Client

```typescript
try {
  const response = await fetch('/api/questions/generate-graphrag', {...})
  const data = await response.json()

  if (!data.success) {
    console.error('Generation failed:', data.error)
    // Handle error (show message, retry, etc.)
  } else {
    // Success - use data.questions
  }
} catch (error) {
  console.error('Network error:', error)
  // Handle network failure
}
```

---

## Rate Limits and Costs

### Claude API Costs

**Model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)

**Pricing:**
- Input: $3 / million tokens
- Output: $15 / million tokens

**Average Costs:**
- Single question: $0.0068
- 100 questions: $0.68
- 1,000 questions: $6.80

**Token Usage:**
- Average input: 1,000-1,200 tokens
- Average output: 150-350 tokens
- Average total: 1,166 tokens per question

### Rate Limits

**Claude API:**
- Requests: Varies by tier
- Tokens: Varies by tier
- Concurrent: 3-5 recommended for batch generation

**Recommendations:**
- Use batch generation with delays (3-5 seconds between batches)
- Implement caching to avoid regenerating identical questions
- Monitor daily costs and set budget alerts

---

## Best Practices

### 1. Use Entity ID for Precision

```typescript
// ✅ Preferred - Precise targeting
{ entityId: "1dfe2982-936f-4764-9bd3-96769d32ac66" }

// ⚠️ Acceptable - May return first match if multiple entities have same name
{ entityName: "Encryption" }
```

### 2. Batch Generate for Efficiency

```typescript
// ✅ Generate multiple questions at once
{
  entityId: "...",
  bloomLevel: 2,
  format: "mcq_single",
  count: 5  // Generate 5 questions
}

// Less efficient - 5 separate API calls
for (let i = 0; i < 5; i++) {
  await generateQuestion({...})
}
```

### 3. Store Questions by Default

```typescript
// ✅ Store for reuse
{ store: true }  // Default

// Only disable if testing
{ store: false }
```

### 4. Use Appropriate Formats for Bloom Levels

| Bloom Level | Recommended Formats |
|-------------|---------------------|
| 1-2 (Lower) | `mcq_single`, `fill_blank` |
| 3-4 (Middle) | `mcq_multi`, `fill_blank` |
| 5-6 (Higher) | `open_ended`, `mcq_multi` |

### 5. Implement Duplicate Prevention

```typescript
// Check if questions exist before generating
const existing = await fetch(`/api/questions/by-entity?entityId=${id}&bloomLevel=2`)
const { count } = await existing.json()

if (count < 5) {
  // Generate more questions
  await generateQuestion({...})
}
```

### 6. Handle Errors Gracefully

```typescript
const maxRetries = 3
let attempt = 0

while (attempt < maxRetries) {
  try {
    const result = await generateQuestion({...})
    if (result.success) break
  } catch (error) {
    attempt++
    if (attempt === maxRetries) {
      // Log and notify user
      console.error('Failed after 3 attempts')
    }
    await sleep(2000 * attempt) // Exponential backoff
  }
}
```

---

## Examples

### Example 1: Generate a Single MCQ

```typescript
const response = await fetch('/api/questions/generate-graphrag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityId: '1dfe2982-936f-4764-9bd3-96769d32ac66',
    bloomLevel: 2,
    format: 'mcq_single',
    store: true
  })
})

const { success, questions, stored, totalCost } = await response.json()

if (success) {
  console.log('Generated question:', questions[0].question)
  console.log('Stored with ID:', stored[0])
  console.log('Cost:', `$${totalCost.toFixed(4)}`)
}
```

### Example 2: Batch Generate Questions

```typescript
const response = await fetch('/api/questions/generate-graphrag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityName: 'Firewall',
    bloomLevel: 3,
    format: 'mcq_multi',
    count: 10,  // Generate 10 questions
    store: true
  })
})

const { success, questions, totalCost } = await response.json()

console.log(`Generated ${questions.length} questions for $${totalCost.toFixed(4)}`)
```

### Example 3: Retrieve and Filter Questions

```typescript
// Get all Bloom level 2 MCQs for Encryption
const response = await fetch(
  '/api/questions/by-entity?entityId=1dfe2982-936f-4764-9bd3-96769d32ac66&bloomLevel=2&format=mcq_single&limit=20'
)

const { questions } = await response.json()

questions.forEach(q => {
  console.log(`Q: ${q.question_text}`)
  console.log(`A: ${q.correct_answer}`)
})
```

### Example 4: Search and Generate

```typescript
// 1. Search for entity
const searchResponse = await fetch('/api/graphrag/search?name=Phishing')
const { results } = await searchResponse.json()

const phishingEntity = results[0]

// 2. Generate question
const genResponse = await fetch('/api/questions/generate-graphrag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityId: phishingEntity.id,
    bloomLevel: 2,
    format: 'mcq_single'
  })
})
```

### Example 5: Get All Questions for a Domain

```typescript
const response = await fetch(
  '/api/questions/by-domain?domain=General Security Concepts&limit=100'
)

const { questions, count } = await response.json()

console.log(`Found ${count} questions for General Security Concepts`)

// Group by Bloom level
const byLevel = questions.reduce((acc, q) => {
  acc[q.bloom_level] = (acc[q.bloom_level] || 0) + 1
  return acc
}, {})

console.log('Distribution:', byLevel)
```

---

## Support

**Issues:** https://github.com/yourorg/axium/issues
**Documentation:** https://yourapp.com/docs
**API Status:** https://status.yourapp.com

---

**Last Updated:** 2025-11-14
**API Version:** 1.0.0
