# Frontend Enhancement Plan - GraphRAG Integration

**Date:** 2025-01-14
**Status:** Planning Phase
**Goal:** Integrate Phase 2 & 3 GraphRAG features into existing comprehensive UI

---

## Executive Summary

**Major Discovery:** The Axium frontend is **far more complete than expected**. A comprehensive learning system already exists with:
- 4-step learning flow (confidence → answer → recognition → feedback)
- RL-based question selection with decision transparency
- Performance analytics dashboard
- Session persistence and progress tracking
- AI-powered explanations

**This is NOT a "build from scratch" effort.** This is a **targeted enhancement** to showcase GraphRAG semantic features (difficulty, prerequisites, relationships) built in Phases 2-3.

---

## What Already EXISTS ✅

### 1. **Learning Session Flow** (`/subjects/[subject]/[chapter]/quiz`)
**Status:** ✅ Fully Implemented (1,251 lines)

**Features:**
- 4-step flow:
  1. Confidence selection (1-5 scale)
  2. Answer submission (MCQ with options)
  3. Recognition method (new knowledge, remembered, deduced)
  4. Feedback with detailed reward breakdown
- RL decision transparency:
  - Thompson Sampling badge
  - Spaced Repetition badge
  - Dimension Coverage badge
- Reward breakdown (calibration, recognition, spacing, response time, streak)
- Session persistence (localStorage)
- Multi-topic support
- AI explanations with text selection
- Unlock notifications
- Progress indicators

**GraphRAG Integration Points:**
- ❌ No difficulty score display
- ❌ No prerequisite awareness
- ❌ No "what this unlocks" motivation
- ❌ No semantic relationship context

---

### 2. **Performance Dashboard** (`/performance`)
**Status:** ✅ Fully Implemented

**Features:**
- Overall stats (topics started, mastered, questions answered, accuracy)
- Subject-level performance cards
- Chapter-level drill-down
- Topic-level analytics
- Empty states with CTAs

**GraphRAG Integration Points:**
- ❌ No learning depth visualization
- ❌ No prerequisite path progress
- ❌ No domain mastery roadmap

---

### 3. **Subject Navigation** (`/subjects`)
**Status:** ✅ Fully Implemented

**Features:**
- Subject listing with cards
- Chapter browsing
- Topic selection
- Empty states

**GraphRAG Integration Points:**
- ❌ No prerequisite-based topic ordering
- ❌ No difficulty indicators
- ❌ No "you're ready for this" suggestions

---

### 4. **Admin Tools** (`/admin/graphrag`)
**Status:** ✅ Fully Implemented

**Features:**
- GraphRAG enable/disable toggle
- RAG mode switching (vector, graph, hybrid, side-by-side)
- Chapter indexing triggers
- Job status monitoring
- Question generation testing

**GraphRAG Integration Points:**
- ✅ Full admin control over GraphRAG
- ⚠️ Could add semantic relationship audit tools

---

### 5. **UI Components**
**Status:** ✅ Components Exist

**Available:**
- `RLPhaseBadge` - 6 RL phases (cold start → meta-learning)
- `QuestionFormatBadge` - 10 question formats (MCQ, fill-blank, etc.)
- `ChapterMasteryOverview` - Dimension-based mastery tracking
- `Tooltip` - Rich tooltips with progressive disclosure
- `Modal` - Dialog overlays
- `UnlockNotification` - Celebrate achievements
- `ExplanationModal` - AI explanations

**Missing:**
- ❌ `DifficultyBadge` - Display 1-10 difficulty scale
- ❌ `PrerequisitePathView` - Prerequisite dependency graph
- ❌ `SemanticRelationshipCard` - IS_A, PART_OF visualization
- ❌ `LearningDepthIndicator` - DAG depth display
- ❌ `UnlockPreview` - "What you'll unlock" motivation

---

## What's MISSING ❌ (GraphRAG Features)

### Priority 1: Core Semantic Features

#### 1.1 **Difficulty Score Display**
**Location:** Quiz page, topic selection, performance dashboard

**Implementation:**
```tsx
// New component: components/DifficultyBadge.tsx
interface DifficultyBadgeProps {
  score: number  // 1-10
  showLabel?: boolean
  showDescription?: boolean
}

export function DifficultyBadge({ score, showLabel, showDescription }: DifficultyBadgeProps) {
  const color = score <= 3 ? 'text-green-400' : score <= 6 ? 'text-yellow-400' : 'text-red-400'
  const label = score <= 3 ? 'Beginner' : score <= 6 ? 'Intermediate' : 'Advanced'

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`text-sm font-semibold ${color}`}>
        {showLabel ? label : `Difficulty ${score}/10`}
      </div>
      {showDescription && (
        <Tooltip content={`Difficulty: ${score}/10 - ${getDescription(score)}`}>
          <InfoIcon size={14} className="text-gray-500" />
        </Tooltip>
      )}
    </div>
  )
}
```

**Integration Points:**
- Quiz page header: Show current question difficulty
- Topic cards: Display average topic difficulty
- Performance dashboard: Filter by difficulty range

**Effort:** 2-3 hours

---

#### 1.2 **Prerequisite Path Visualization**
**Location:** Topic selection, performance dashboard

**Implementation:**
```tsx
// New component: components/PrerequisitePathView.tsx
interface PrerequisitePathViewProps {
  targetTopicId: string
  targetTopicName: string
}

export function PrerequisitePathView({ targetTopicId, targetTopicName }: PrerequisitePathViewProps) {
  const [path, setPath] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/semantic/learning-path?targetEntity=${targetTopicId}`)
      .then(res => res.json())
      .then(data => setPath(data))
  }, [targetTopicId])

  if (!path) return <LoadingState />

  return (
    <div className="neuro-card">
      <h3 className="text-lg font-semibold mb-4">Learning Path to {targetTopicName}</h3>
      <div className="space-y-3">
        {path.path.map((node: any, idx: number) => (
          <div key={node.id} className="flex items-center gap-3">
            <div className="neuro-inset w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-400">
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-200">{node.name}</div>
              <div className="text-xs text-gray-500">
                Difficulty {node.difficultyScore}/10 • ~{node.estimatedStudyTime} min
              </div>
            </div>
            <DifficultyBadge score={node.difficultyScore} />
            {idx < path.path.length - 1 && (
              <div className="text-gray-600">→</div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 neuro-inset rounded-lg">
        <div className="text-sm text-gray-400">Total Path</div>
        <div className="text-lg font-semibold text-blue-400">
          {path.totalNodes} topics • ~{Math.round(path.estimatedTotalTime / 60)} hours
        </div>
      </div>
    </div>
  )
}
```

**Integration Points:**
- Topic detail page: "Prerequisites" section with expandable path
- Dashboard: "Recommended Next Steps" with prerequisite awareness
- Quiz page: "You're working toward..." context

**Effort:** 4-6 hours

---

#### 1.3 **"What This Unlocks" Motivation**
**Location:** Quiz page feedback, topic cards

**Implementation:**
```tsx
// New component: components/UnlockPreview.tsx
interface UnlockPreviewProps {
  currentTopicId: string
  currentBloomLevel: number
}

export function UnlockPreview({ currentTopicId, currentBloomLevel }: UnlockPreviewProps) {
  const [unlocks, setUnlocks] = useState<any[]>([])

  useEffect(() => {
    // Fetch concepts that depend on this topic
    fetch(`/api/semantic/prerequisites/${currentTopicId}`)
      .then(res => res.json())
      .then(data => {
        // Filter to concepts where this is a prerequisite
        const dependents = data.enablesConcepts || []
        setUnlocks(dependents)
      })
  }, [currentTopicId])

  if (unlocks.length === 0) return null

  return (
    <div className="neuro-raised p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎯</span>
        <h4 className="text-sm font-semibold text-gray-300">What You'll Unlock</h4>
      </div>
      <div className="space-y-2">
        {unlocks.slice(0, 3).map((concept: any) => (
          <div key={concept.id} className="text-xs text-gray-400 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>{concept.name}</span>
          </div>
        ))}
        {unlocks.length > 3 && (
          <div className="text-xs text-gray-500">+ {unlocks.length - 3} more...</div>
        )}
      </div>
    </div>
  )
}
```

**Integration Points:**
- Quiz feedback: "Great! You're one step closer to unlocking..."
- Topic cards: "Unlocks: X advanced concepts"
- Dashboard: "Your progress unlocked Y new topics"

**Effort:** 3-4 hours

---

#### 1.4 **Semantic Relationship Visualization**
**Location:** Topic detail page, quiz context panel

**Implementation:**
```tsx
// New component: components/SemanticRelationshipCard.tsx
interface SemanticRelationshipCardProps {
  topicId: string
}

export function SemanticRelationshipCard({ topicId }: SemanticRelationshipCardProps) {
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    // Use cache-first API
    fetch(`/api/graphrag/context/${topicId}`)
      .then(res => res.json())
      .then(data => setContext(data))
  }, [topicId])

  if (!context) return <LoadingState />

  const { semanticRelationships } = context

  return (
    <div className="neuro-card">
      <h3 className="text-lg font-semibold mb-4">Concept Relationships</h3>

      {/* IS_A Relationships */}
      {semanticRelationships.isA.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Is a type of...</h4>
          <div className="space-y-2">
            {semanticRelationships.isA.map((rel: any) => (
              <div key={rel.id} className="neuro-inset p-2 rounded-lg text-sm">
                <div className="text-gray-300">{rel.name}</div>
                <div className="text-xs text-gray-500 mt-1">{rel.reasoning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PART_OF Relationships */}
      {semanticRelationships.partOf.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-cyan-400 mb-2">Part of...</h4>
          <div className="space-y-2">
            {semanticRelationships.partOf.map((rel: any) => (
              <div key={rel.id} className="neuro-inset p-2 rounded-lg text-sm">
                <div className="text-gray-300">{rel.name}</div>
                <div className="text-xs text-gray-500 mt-1">{rel.reasoning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {semanticRelationships.prerequisites.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-yellow-400 mb-2">Prerequisites</h4>
          <div className="space-y-2">
            {semanticRelationships.prerequisites.map((rel: any) => (
              <div key={rel.id} className="neuro-inset p-2 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-gray-300">{rel.name}</div>
                  <DifficultyBadge score={rel.difficultyScore || 5} />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {rel.strategy} • {rel.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Integration Points:**
- Topic detail page: Expandable "Relationships" section
- Quiz sidebar: Contextual "This concept is..."
- Admin tools: Relationship audit view

**Effort:** 5-6 hours

---

#### 1.5 **Learning Depth Indicator**
**Location:** Performance dashboard, topic cards

**Implementation:**
```tsx
// New component: components/LearningDepthIndicator.tsx
interface LearningDepthIndicatorProps {
  depth: number  // 0 = root, higher = deeper in DAG
  maxDepth?: number
}

export function LearningDepthIndicator({ depth, maxDepth = 10 }: LearningDepthIndicatorProps) {
  const percentage = (depth / maxDepth) * 100
  const color = depth === 0 ? 'text-green-400' : depth <= 3 ? 'text-blue-400' : 'text-purple-400'
  const label = depth === 0 ? 'Foundation' : depth <= 3 ? 'Intermediate' : 'Advanced'

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-500">Depth {depth}</div>
      <div className="neuro-inset h-2 w-24 rounded-full overflow-hidden">
        <div
          className={`h-full ${color.replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className={`text-xs font-medium ${color}`}>{label}</div>
    </div>
  )
}
```

**Integration Points:**
- Topic cards: Show depth level
- Dashboard: Filter by depth range
- Quiz page: "You're at depth X in the knowledge graph"

**Effort:** 2-3 hours

---

### Priority 2: Enhanced Navigation

#### 2.1 **Prerequisite-Aware Topic Ordering**
**Location:** Subject/chapter pages

**Implementation:**
- Sort topics by learning depth (shallow first)
- Highlight topics with unmet prerequisites
- Show "Ready to learn" badge for topics with prerequisites met
- Disable topics with missing prerequisites (with explanation)

**Effort:** 3-4 hours

---

#### 2.2 **Smart Recommendations**
**Location:** Dashboard

**Implementation:**
```tsx
// New section in dashboard
<div className="neuro-card">
  <h2 className="text-xl font-semibold mb-4">Recommended Next Steps</h2>
  {recommendations.map(rec => (
    <div key={rec.id} className="neuro-raised p-4 mb-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-200">{rec.name}</h3>
          <div className="text-sm text-gray-500">
            {rec.prerequisitesMet ? '✅ Prerequisites met' : `⚠️ Need ${rec.missingCount} prerequisites`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DifficultyBadge score={rec.difficulty} />
          <LearningDepthIndicator depth={rec.depth} />
        </div>
      </div>
    </div>
  ))}
</div>
```

**Effort:** 4-5 hours

---

### Priority 3: Performance Analytics Enhancements

#### 3.1 **Domain Mastery Roadmap**
**Location:** Performance dashboard

**Implementation:**
- Fetch domain learning paths from cache
- Visualize progress through domain roadmap
- Show completed vs remaining concepts
- Estimate time to domain mastery

**Effort:** 5-6 hours

---

#### 3.2 **Semantic Relationship Network Graph**
**Location:** Admin tools or topic detail page

**Implementation:**
- D3.js or Cytoscape.js graph visualization
- Nodes = topics, edges = relationships
- Color by difficulty, size by depth
- Interactive exploration

**Effort:** 8-10 hours (optional, advanced feature)

---

## Implementation Roadmap

### Phase 1: Core Display Enhancements (1-2 days)
**Goal:** Show GraphRAG data in existing UI

- [ ] Create `DifficultyBadge` component
- [ ] Create `LearningDepthIndicator` component
- [ ] Integrate difficulty scores in quiz page
- [ ] Integrate difficulty scores in topic cards
- [ ] Add learning depth to performance dashboard

**Total Effort:** 8-10 hours

---

### Phase 2: Prerequisite & Path Features (2-3 days)
**Goal:** Add prerequisite awareness and path visualization

- [ ] Create `PrerequisitePathView` component
- [ ] Create `UnlockPreview` component
- [ ] Integrate prerequisite paths in topic detail pages
- [ ] Add "what this unlocks" to quiz feedback
- [ ] Implement prerequisite-aware topic ordering

**Total Effort:** 12-15 hours

---

### Phase 3: Semantic Relationships (1-2 days)
**Goal:** Visualize IS_A, PART_OF, cross-references

- [ ] Create `SemanticRelationshipCard` component
- [ ] Integrate relationships in topic detail pages
- [ ] Add relationship context to quiz sidebar
- [ ] Build admin relationship audit view

**Total Effort:** 6-8 hours

---

### Phase 4: Smart Recommendations (1 day)
**Goal:** AI-driven next steps based on GraphRAG

- [ ] Implement recommendation algorithm
- [ ] Create dashboard recommendation section
- [ ] Add "You're ready for..." notifications
- [ ] Show recommended learning paths

**Total Effort:** 4-5 hours

---

### Phase 5: Polish & Testing (1 day)
**Goal:** End-to-end testing and refinement

- [ ] Test all new components
- [ ] Verify cache integration performance
- [ ] Polish UI transitions and loading states
- [ ] User acceptance testing
- [ ] Documentation updates

**Total Effort:** 6-8 hours

---

## Total Estimated Effort

**Minimum Viable Enhancement (Phase 1-2):** 20-25 hours (3-4 days)
**Full Enhancement (Phase 1-5):** 36-46 hours (5-6 days)
**Optional Advanced Features (Network Graph):** +8-10 hours

---

## API Integration Points

### Existing APIs to Use:
1. ✅ `/api/semantic/learning-path` - Get prerequisite paths
2. ✅ `/api/semantic/prerequisites/[entityId]` - Get prerequisites and enabled concepts
3. ✅ `/api/graphrag/context/[entityId]` - Get full GraphRAG context

### New APIs Needed:
1. ❌ `/api/recommendations` - Smart next-step recommendations
2. ❌ `/api/semantic/domain-progress` - Domain mastery progress

---

## Success Metrics

**User-Facing Value:**
- Users can see difficulty before attempting topics
- Users understand prerequisite dependencies
- Users are motivated by "what this unlocks"
- Users discover semantic relationships naturally

**Technical Value:**
- GraphRAG semantic features are visible and useful
- Phase 2-3 work is validated with real usage
- Cache layer improves performance (5-10x faster than Neo4j)
- Foundation for future RL enhancements

---

## Risk Mitigation

**Risk 1: Over-engineering**
- **Mitigation:** Start with Phase 1-2 (core features), gather feedback

**Risk 2: Performance issues with graph queries**
- **Mitigation:** Use cache-first approach (lib/cache/semantic.ts)

**Risk 3: UI clutter**
- **Mitigation:** Progressive disclosure (tooltips, collapsible sections)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize features** based on user value
3. **Start with Phase 1** (core display enhancements)
4. **Iterate based on feedback**

---

**Created:** 2025-01-14
**Author:** Claude
**Status:** Ready for Review
