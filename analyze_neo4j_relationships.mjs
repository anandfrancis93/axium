import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function analyzeRelationships() {
  const session = driver.session()

  try {
    console.log('=== RELATIONSHIP ANALYSIS ===\n')

    // Count by type
    console.log('Relationship Type Distribution:')
    const typeCount = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) AS relationship_type, count(r) AS count
      ORDER BY count DESC
    `)
    typeCount.records.forEach(r => {
      console.log(`  ${r.get('relationship_type').padEnd(20)} : ${r.get('count').toNumber()}`)
    })

    console.log('\n=== SAMPLE RELATIONSHIPS ===\n')

    // Sample each relationship type
    const types = ['PART_OF', 'DEPENDS_ON', 'PARENT_OF', 'CHILD_OF', 'RELATED_CONCEPT', 'IS_A', 'PREVENTS', 'USES', 'PREREQUISITE']

    for (const relType of types) {
      console.log(`\n${relType}:`)
      const sample = await session.run(`
        MATCH (a)-[r:${relType}]->(b)
        RETURN a.name AS from, b.name AS to
        LIMIT 3
      `)

      if (sample.records.length > 0) {
        sample.records.forEach(r => {
          console.log(`  "${r.get('from')}" -> "${r.get('to')}"`)
        })
      } else {
        console.log('  (no examples found)')
      }
    }

    console.log('\n=== POTENTIAL IMPROVEMENTS ===\n')
    console.log('Current relationships are quite generic. For cybersecurity education, consider:')
    console.log('')
    console.log('SECURITY-SPECIFIC:')
    console.log('  - PROTECTS_AGAINST  (Firewall -> DDoS Attack)')
    console.log('  - EXPLOITS          (SQL Injection -> Database Vulnerability)')
    console.log('  - MITIGATES         (Encryption -> Data Breach)')
    console.log('  - DETECTS           (IDS -> Intrusion Attempt)')
    console.log('  - AUTHENTICATES     (OAuth -> User Identity)')
    console.log('  - ENCRYPTS          (AES -> Sensitive Data)')
    console.log('  - ATTACKS           (Malware -> System)')
    console.log('  - DEFENDS           (Antivirus -> Malware)')
    console.log('  - MONITORS          (SIEM -> Network Traffic)')
    console.log('')
    console.log('TECHNICAL:')
    console.log('  - IMPLEMENTS        (SSL/TLS -> Encryption Protocol)')
    console.log('  - REQUIRES          (HTTPS -> Certificate)')
    console.log('  - CONFIGURES        (Firewall Rule -> Port Access)')
    console.log('  - ENABLES           (VPN -> Remote Access)')
    console.log('  - LOGS              (Security Event -> Audit Trail)')
    console.log('  - ALERTS            (IDS -> Security Team)')
    console.log('  - VALIDATES         (Certificate Authority -> Digital Certificate)')
    console.log('')
    console.log('EDUCATIONAL:')
    console.log('  - EXAMPLE_OF        (Phishing -> Social Engineering)')
    console.log('  - CATEGORY_OF       (Symmetric -> Encryption Type)')
    console.log('  - VARIANT_OF        (WPA3 -> WPA)')
    console.log('  - SUPERSEDES        (TLS 1.3 -> TLS 1.2)')
    console.log('  - COMPARED_TO       (RSA -> ECC)')

  } finally {
    await session.close()
  }

  await driver.close()
}

analyzeRelationships().catch(console.error)
