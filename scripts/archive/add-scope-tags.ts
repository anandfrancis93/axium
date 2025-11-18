import neo4j from 'neo4j-driver'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Define scope tags and their keyword patterns
const SCOPE_TAGS = {
  'cryptography': [
    'encrypt', 'decrypt', 'cipher', 'hash', 'key', 'certificate', 'pki', 'ssl', 'tls',
    'cryptographic', 'aes', 'rsa', 'sha', 'digital signature', 'crypto'
  ],
  'network-security': [
    'firewall', 'network', 'router', 'switch', 'vpn', 'vlan', 'subnet', 'dns', 'dhcp',
    'proxy', 'gateway', 'port', 'protocol', 'tcp', 'udp', 'ip', 'wifi', 'wireless',
    'bluetooth', 'cellular', 'segmentation', 'dmz', 'nat'
  ],
  'access-control': [
    'access control', 'authorization', 'permission', 'privilege', 'role', 'rbac', 'abac',
    'dac', 'mac', 'least privilege', 'separation of duties', 'authentication'
  ],
  'identity-management': [
    'identity', 'authentication', 'mfa', 'multifactor', 'password', 'biometric',
    'sso', 'single sign-on', 'federation', 'ldap', 'active directory', 'iam',
    'credential', 'token', 'oauth', 'saml'
  ],
  'threat-intelligence': [
    'threat', 'actor', 'apt', 'malware', 'virus', 'trojan', 'ransomware', 'phishing',
    'attack', 'exploit', 'osint', 'threat intelligence', 'indicator', 'ioc'
  ],
  'vulnerability-management': [
    'vulnerability', 'cve', 'cvss', 'patch', 'scanner', 'assessment', 'pentest',
    'penetration test', 'exploit', 'weakness', 'exposure'
  ],
  'incident-response': [
    'incident', 'response', 'forensic', 'investigation', 'containment', 'eradication',
    'recovery', 'playbook', 'siem', 'soc', 'alert'
  ],
  'compliance': [
    'compliance', 'regulation', 'gdpr', 'hipaa', 'pci', 'sox', 'audit', 'policy',
    'standard', 'framework', 'iso', 'nist', 'attestation'
  ],
  'risk-management': [
    'risk', 'assessment', 'analysis', 'mitigation', 'acceptance', 'transfer',
    'avoidance', 'likelihood', 'impact', 'threat modeling', 'bia', 'business impact'
  ],
  'cloud-security': [
    'cloud', 'saas', 'paas', 'iaas', 'container', 'serverless', 'microservice',
    'api', 'aws', 'azure', 'gcp'
  ],
  'physical-security': [
    'physical', 'badge', 'camera', 'surveillance', 'alarm', 'lock', 'perimeter',
    'facility', 'environmental', 'hvac'
  ],
  'application-security': [
    'application', 'software', 'code', 'development', 'sdlc', 'devops', 'devsecops',
    'injection', 'xss', 'csrf', 'buffer overflow', 'api security'
  ],
  'data-protection': [
    'data', 'privacy', 'classification', 'masking', 'tokenization', 'dlp',
    'data loss prevention', 'retention', 'disposal', 'backup', 'recovery'
  ],
  'endpoint-security': [
    'endpoint', 'antivirus', 'edr', 'host', 'workstation', 'mobile', 'byod',
    'mdm', 'hardening', 'patch management'
  ],
  'monitoring-logging': [
    'monitoring', 'logging', 'log', 'syslog', 'alert', 'detection', 'ids', 'ips',
    'metrics', 'dashboard', 'analytics'
  ],
  'governance': [
    'governance', 'policy', 'procedure', 'standard', 'guideline', 'framework',
    'committee', 'oversight', 'stakeholder'
  ],
  'security-operations': [
    'operation', 'soc', 'automation', 'orchestration', 'playbook', 'runbook',
    'ticketing', 'escalation'
  ],
  'architecture': [
    'architecture', 'design', 'infrastructure', 'topology', 'zero trust',
    'defense in depth', 'resilience', 'availability', 'scalability'
  ],
  'third-party-risk': [
    'vendor', 'third party', 'supplier', 'supply chain', 'outsourcing',
    'service provider', 'due diligence'
  ],
  'awareness-training': [
    'awareness', 'training', 'education', 'phishing campaign', 'user education',
    'security culture', 'behavior'
  ]
}

interface Entity {
  id: string
  name: string
  fullPath: string
  contextSummary: string | null
}

function assignScopeTags(entity: Entity): string[] {
  const tags = new Set<string>()
  const textToAnalyze = `${entity.name} ${entity.fullPath} ${entity.contextSummary || ''}`.toLowerCase()

  for (const [tag, keywords] of Object.entries(SCOPE_TAGS)) {
    for (const keyword of keywords) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        tags.add(tag)
        break // One match is enough for this tag
      }
    }
  }

  return Array.from(tags).sort()
}

async function addScopeTags() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
  )

  const session = driver.session({ database: 'neo4j' })

  try {
    console.log('\n' + '='.repeat(80))
    console.log('Adding Scope Tags to Curriculum Entities')
    console.log('='.repeat(80))

    console.log(`\n📋 Defined ${Object.keys(SCOPE_TAGS).length} scope tag categories`)

    // Fetch all entities
    console.log('\n📥 Fetching entities from Neo4j...')
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN e.id AS id, e.name AS name, e.fullPath AS fullPath, e.contextSummary AS contextSummary
    `)

    const entities: Entity[] = result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      fullPath: record.get('fullPath'),
      contextSummary: record.get('contextSummary')
    }))

    console.log(`✅ Fetched ${entities.length} entities`)

    // Assign tags to each entity
    console.log('\n🏷️  Assigning scope tags...')
    const tagAssignments = new Map<string, string[]>()
    const tagCounts = new Map<string, number>()

    for (const entity of entities) {
      const tags = assignScopeTags(entity)
      tagAssignments.set(entity.id, tags)

      // Count tag occurrences
      tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    }

    console.log(`✅ Tags assigned to ${tagAssignments.size} entities`)

    // Update entities in Neo4j in batches
    console.log('\n💾 Updating Neo4j entities...')
    const batchSize = 100
    let updated = 0

    const updates = Array.from(tagAssignments.entries()).map(([id, tags]) => ({ id, tags }))

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)

      await session.run(`
        UNWIND $batch AS item
        MATCH (e:CurriculumEntity {id: item.id})
        SET e.scopeTags = item.tags
      `, { batch })

      updated += batch.length
      const progress = Math.round((updated / updates.length) * 100)
      process.stdout.write(`\r  Progress: ${progress}% (${updated}/${updates.length})`)
    }

    console.log('\n✅ All entities updated')

    // Statistics
    console.log('\n📊 Scope Tag Statistics:')

    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])

    console.log('\n  Tag Distribution:')
    sortedTags.forEach(([tag, count], idx) => {
      const percentage = Math.round((count / entities.length) * 100)
      const bar = '█'.repeat(Math.min(50, Math.floor(percentage / 2)))
      console.log(`    ${(idx + 1).toString().padStart(2)}. ${tag.padEnd(25)} : ${count.toString().padStart(3)} (${percentage}%) ${bar}`)
    })

    // Entities with most tags
    console.log('\n🏆 Entities with Most Tags:')
    const entitiesWithTags = Array.from(tagAssignments.entries())
      .map(([id, tags]) => {
        const entity = entities.find(e => e.id === id)!
        return { entity, tags }
      })
      .sort((a, b) => b.tags.length - a.tags.length)
      .slice(0, 10)

    entitiesWithTags.forEach((item, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2)}. ${item.entity.name} (${item.tags.length} tags)`)
      console.log(`      Tags: ${item.tags.join(', ')}`)
    })

    // Entities without tags
    const entitiesWithoutTags = Array.from(tagAssignments.entries())
      .filter(([_, tags]) => tags.length === 0)

    console.log(`\n⚠️  Entities without tags: ${entitiesWithoutTags.length}`)
    if (entitiesWithoutTags.length > 0 && entitiesWithoutTags.length <= 10) {
      entitiesWithoutTags.forEach(([id]) => {
        const entity = entities.find(e => e.id === id)!
        console.log(`    - ${entity.name}`)
      })
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Scope tags added successfully')
    console.log('='.repeat(80) + '\n')

  } finally {
    await session.close()
    await driver.close()
  }
}

if (require.main === module) {
  addScopeTags()
}

export { addScopeTags }
