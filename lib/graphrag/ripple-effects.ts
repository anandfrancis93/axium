/**
 * Ripple Effect & Dependency Chain Analysis
 * 
 * Extracts cascading impact paths from the knowledge graph for systems thinking
 * questions at Bloom levels 5-6 (Evaluate, Create).
 */

import { createSession } from '@/lib/neo4j/client'

export interface DependencyChainNode {
    id: string
    name: string
}

export interface DependencyChain {
    chain: DependencyChainNode[]
    depth: number
    allMastered: boolean
    avgMastery: number
}

export interface CrossDomainImpact {
    ripplePath: string[]
    originDomain: string
    impactedDomain: string
    depth: number
}

export interface RippleEffectContext {
    dependencyChains: DependencyChain[]
    crossDomainImpacts: CrossDomainImpact[]
    totalImpactedTopics: number
}

/**
 * Get dependency chains showing how changes in a topic ripple through the system
 * Only includes chains where ALL topics are mastered by the user
 * 
 * @param topicId - Central topic ID
 * @param masteredTopicIds - Array of topic IDs the user has mastered (>=70%)
 * @param maxHops - Maximum chain length (default: 4)
 * @returns Array of dependency chains
 */
export async function getRippleEffectChains(
    topicId: string,
    masteredTopicIds: string[],
    maxHops: number = 4
): Promise<DependencyChain[]> {
    const session = createSession()

    try {
        // Query: Find all downstream paths where every node is mastered
        const result = await session.run(`
      MATCH path = (source:Topic {id: $topicId})-[:HAS_TOPIC|HAS_SUBTOPIC*1..${maxHops}]->(target:Topic)
      WHERE all(node IN nodes(path) WHERE node.id IN $masteredTopicIds)
        AND target.hierarchy_level >= source.hierarchy_level
      WITH path, 
           [node IN nodes(path) | {id: node.id, name: node.name}] as chainNodes,
           length(path) as depth
      RETURN chainNodes, depth
      ORDER BY depth DESC
      LIMIT 5
    `, { topicId, masteredTopicIds })

        return result.records.map(record => ({
            chain: record.get('chainNodes'),
            depth: record.get('depth'),
            allMastered: true, // By query design
            avgMastery: 0 // Will be calculated by caller with user progress data
        }))
    } finally {
        await session.close()
    }
}

/**
 * Find cross-domain ripple effects (e.g., Cryptography → Legal/Regulatory)
 * Shows how a change in one subject cascades to impact other subjects
 * 
 * @param topicId - Central topic ID
 * @param masteredTopicIds - Array of mastered topic IDs
 * @param maxHops - Maximum chain length (default: 4)
 * @returns Array of cross-domain impact paths
 */
export async function getCrossDomainImpacts(
    topicId: string,
    masteredTopicIds: string[],
    maxHops: number = 4
): Promise<CrossDomainImpact[]> {
    const session = createSession()

    try {
        // Query: Find paths that cross subject boundaries
        const result = await session.run(`
      MATCH path = (source:Topic {id: $topicId})-[:HAS_TOPIC|HAS_SUBTOPIC*1..${maxHops}]->(target:Topic)
      MATCH (source)-[:BELONGS_TO*]->(sourceSubject:Subject)
      MATCH (target)-[:BELONGS_TO*]->(targetSubject:Subject)
      WHERE targetSubject.id <> sourceSubject.id
        AND all(node IN nodes(path) WHERE node.id IN $masteredTopicIds)
      WITH path,
           [node IN nodes(path) | node.name] as ripplePath,
           sourceSubject.name as originDomain,
           targetSubject.name as impactedDomain,
           length(path) as depth
      RETURN ripplePath, originDomain, impactedDomain, depth
      ORDER BY depth ASC
      LIMIT 3
    `, { topicId, masteredTopicIds })

        return result.records.map(record => ({
            ripplePath: record.get('ripplePath'),
            originDomain: record.get('originDomain'),
            impactedDomain: record.get('impactedDomain'),
            depth: record.get('depth')
        }))
    } finally {
        await session.close()
    }
}

/**
 * Get comprehensive ripple effect context for a topic
 * Combines dependency chains and cross-domain impacts
 * 
 * @param topicId - Central topic ID
 * @param masteredTopicIds - Array of mastered topic IDs
 * @param userMasteryMap - Map of topic ID to mastery percentage
 * @param maxHops - Maximum chain length
 * @returns Complete ripple effect context
 */
export async function getRippleEffectContext(
    topicId: string,
    masteredTopicIds: string[],
    userMasteryMap: Map<string, number>,
    maxHops: number = 4
): Promise<RippleEffectContext> {
    // Get dependency chains and cross-domain impacts in parallel
    const [chains, crossDomain] = await Promise.all([
        getRippleEffectChains(topicId, masteredTopicIds, maxHops),
        getCrossDomainImpacts(topicId, masteredTopicIds, maxHops)
    ])

    // Calculate average mastery for each chain
    const chainsWithMastery = chains.map(chain => {
        const masteryValues = chain.chain
            .map(node => userMasteryMap.get(node.id) || 0)
            .filter(m => m > 0)

        const avgMastery = masteryValues.length > 0
            ? masteryValues.reduce((sum, m) => sum + m, 0) / masteryValues.length
            : 0

        return {
            ...chain,
            avgMastery
        }
    })

    // Count total unique impacted topics
    const impactedTopics = new Set<string>()
    chainsWithMastery.forEach(chain => {
        chain.chain.forEach(node => impactedTopics.add(node.id))
    })

    return {
        dependencyChains: chainsWithMastery,
        crossDomainImpacts: crossDomain,
        totalImpactedTopics: impactedTopics.size
    }
}

/**
 * Format dependency chains as text for LLM context
 * 
 * @param chains - Array of dependency chains
 * @returns Formatted text
 */
export function formatDependencyChains(chains: DependencyChain[]): string {
    if (chains.length === 0) {
        return 'No dependency chains available (isolated topic).\n'
    }

    let text = '🔗 DEPENDENCY CHAINS (Impact Paths):\n\n'

    chains.forEach((chain, index) => {
        const chainPath = chain.chain.map(node => node.name).join(' → ')
        text += `Chain ${index + 1} (${chain.depth} hops): ${chainPath}\n`
        text += `  All mastered: ✅ (avg ${chain.avgMastery.toFixed(0)}%)\n\n`
    })

    return text
}

/**
 * Format cross-domain impacts as text for LLM context
 * 
 * @param impacts - Array of cross-domain impacts
 * @returns Formatted text
 */
export function formatCrossDomainImpacts(impacts: CrossDomainImpact[]): string {
    if (impacts.length === 0) {
        return ''
    }

    let text = '🌐 CROSS-DOMAIN RIPPLES:\n\n'

    impacts.forEach((impact, index) => {
        const path = impact.ripplePath.join(' → ')
        text += `Impact ${index + 1}: ${path}\n`
        text += `  ${impact.originDomain} → ${impact.impactedDomain}\n\n`
    })

    return text
}

/**
 * Generate ripple effect scenario instructions for LLM
 * 
 * @param chains - Dependency chains
 * @param topicName - Central topic name
 * @returns Scenario instructions
 */
export function generateRippleScenarioInstructions(
    chains: DependencyChain[],
    topicName: string
): string {
    if (chains.length === 0) {
        return `Note: ${topicName} is relatively isolated. Focus on internal analysis without cascading dependencies.\n`
    }

    let text = '💡 RIPPLE EFFECT SCENARIOS FOR BLOOM 5-6:\n\n'
    text += `Use these chains to create cascading impact questions:\n`

    chains.forEach((chain, index) => {
        const endpoint = chain.chain[chain.chain.length - 1].name
        text += `- "If ${topicName} fails, trace impact through Chain ${index + 1} to ${endpoint}"\n`
    })

    if (chains.length >= 2) {
        text += `- "Compare ripple speed: Chain 1 vs Chain ${chains.length}"\n`
        text += `- "Design remediation: Which chain link should be reinforced first?"\n`
    }

    text += '\n'
    return text
}
