import { updateSummariesByPath } from './update-summaries-by-path'

const batch11c = [
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk appetite > Expansionary",
    contextSummary: "Expansionary risk appetite represents a willingness to accept higher levels of risk in pursuit of growth opportunities, innovation, or competitive advantage. Organizations with expansionary appetite invest in emerging technologies, enter new markets, and pursue aggressive strategies while implementing proportionate security controls."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk appetite > Conservative",
    contextSummary: "Conservative risk appetite reflects minimal tolerance for risk, prioritizing security and stability over growth or innovation. Organizations with conservative appetite implement extensive controls, avoid emerging technologies until proven, and require high confidence levels before accepting any risk."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk appetite > Neutral",
    contextSummary: "Neutral risk appetite represents balanced risk tolerance, accepting moderate risks when benefits justify exposure while implementing standard security controls. Organizations with neutral appetite evaluate risks case-by-case, balancing security requirements with business objectives and industry norms."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk management strategies > Transfer",
    contextSummary: "Risk transfer involves shifting risk responsibility to third parties through insurance policies, contractual agreements, outsourcing arrangements, or service-level agreements. This strategy reduces direct exposure while maintaining accountability for ensuring transferred risks are adequately managed."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk management strategies > Accept",
    contextSummary: "Risk acceptance involves acknowledging risk existence and choosing to proceed without additional mitigation when costs exceed benefits or risks fall within tolerance levels. This strategy requires formal documentation, management approval, and continuous monitoring of accepted risks."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk management strategies > Accept > Exemption",
    contextSummary: "Risk exemption provides temporary exception from security requirements due to technical limitations, business constraints, or transition periods, with defined expiration dates and compensating controls. Exemptions require executive approval, documented justification, and regular review until permanent solutions are implemented."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk management strategies > Accept > Exception",
    contextSummary: "Risk exception grants permanent deviation from security policies for unique circumstances where requirements cannot be met, with compensating controls to reduce exposure. Exceptions require business justification, risk assessment, executive approval, and annual recertification to ensure continued validity."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk management strategies > Avoid",
    contextSummary: "Risk avoidance involves eliminating risk exposure by not engaging in high-risk activities, discontinuing vulnerable services, or choosing alternative approaches with lower risk profiles. This strategy is appropriate when risks exceed acceptable thresholds and cannot be adequately mitigated."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk management strategies > Mitigate",
    contextSummary: "Risk mitigation reduces likelihood or impact through security controls, process improvements, technology upgrades, or procedural changes to bring exposure within acceptable levels. This most common strategy balances security investment with residual risk, implementing layered defenses proportionate to threat levels."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Risk reporting",
    contextSummary: "Risk reporting communicates risk status, trends, and treatment progress to stakeholders through dashboards, executive summaries, detailed assessments, and risk register updates. Effective reporting provides actionable insights, supports decision-making, demonstrates compliance, and ensures appropriate visibility at all organizational levels."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Business impact analysis",
    contextSummary: "Business Impact Analysis (BIA) identifies critical business functions, quantifies downtime impacts, determines recovery priorities, and establishes recovery objectives to support continuity planning. BIA assesses financial losses, operational disruptions, regulatory consequences, and reputational damage to inform resource allocation and recovery strategies."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Business impact analysis > Recovery time objective (RTO)",
    contextSummary: "Recovery Time Objective (RTO) defines maximum acceptable downtime for systems or processes before business impact becomes unacceptable, measured from disruption to restoration. RTO drives recovery strategy selection, technology investments, and backup frequency to ensure critical services resume within defined timeframes."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Business impact analysis > Recovery point objective (RPO)",
    contextSummary: "Recovery Point Objective (RPO) defines maximum acceptable data loss measured in time, determining how recent backup or replicated data must be to meet business requirements. RPO influences backup frequency, replication methods, and storage strategies to minimize data loss during disruptions."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Business impact analysis > Mean time to repair (MTTR)",
    contextSummary: "Mean Time to Repair (MTTR) measures average time required to restore failed components or systems to operational status, indicating recovery efficiency and capability. Lower MTTR values demonstrate effective incident response, spare part availability, skilled personnel, and well-documented recovery procedures."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain elements of the risk management process > Business impact analysis > Mean time between failures (MTBF)",
    contextSummary: "Mean Time Between Failures (MTBF) measures average operational time between system failures, indicating reliability and availability of components or services. Higher MTBF values demonstrate system stability, quality components, effective maintenance, and predictable operational performance for capacity planning."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor assessment > Penetration testing",
    contextSummary: "Vendor penetration testing evaluates security posture of third-party systems through authorized simulated attacks identifying vulnerabilities, configuration weaknesses, and potential breach paths. Organizations require vendors to conduct regular pentests, provide results, and remediate findings to ensure services don't introduce security gaps."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor assessment > Right-to-audit clause",
    contextSummary: "Right-to-audit clauses grant organizations contractual authority to examine vendor security controls, compliance status, and operational practices through on-site inspections or document reviews. These clauses ensure ongoing visibility, verify control effectiveness, validate compliance claims, and identify risks before they impact operations."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor assessment > Evidence of internal audits",
    contextSummary: "Evidence of internal audits demonstrates vendor commitment to security through self-assessment reports, audit findings, remediation tracking, and control testing results. Organizations review audit evidence to verify vendors maintain effective security programs, address identified gaps, and continuously improve controls."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor assessment > Independent assessments",
    contextSummary: "Independent assessments provide third-party validation of vendor security through SOC 2 reports, ISO certifications, HITRUST assessments, or specialized audits by qualified firms. These objective evaluations reduce assessment burden, provide standardized frameworks, and offer greater confidence than vendor self-assessments."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor assessment > Supply chain analysis",
    contextSummary: "Supply chain analysis examines vendor dependencies, subcontractors, component sources, and upstream risks that could impact service delivery or security. This assessment identifies single points of failure, geographic concentrations, fourth-party risks, and potential cascading impacts from supplier compromises."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor selection > Due diligence",
    contextSummary: "Due diligence involves comprehensive investigation of vendor capabilities, financial stability, security posture, compliance status, and reputation before engagement. This process includes background checks, reference validation, financial analysis, security questionnaires, and site visits to ensure vendors meet organizational requirements."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor selection > Conflict of interest",
    contextSummary: "Conflict of interest assessment identifies relationships, financial interests, or competing obligations that could compromise vendor objectivity, loyalty, or performance. Organizations evaluate ownership structures, board memberships, customer relationships, and personal connections to ensure vendors act in client's best interests."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types",
    contextSummary: "Third-party agreements establish legal frameworks defining services, responsibilities, performance standards, security requirements, and liability terms between organizations and vendors. Agreement types range from broad framework contracts (MSAs, MOUs) to specific operational documents (SLAs, SOWs) to protective arrangements (NDAs, BPAs)."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types > Service-level agreement (SLA)",
    contextSummary: "Service-Level Agreements (SLAs) define specific performance metrics, availability targets, response times, and quality standards vendors must meet, with remedies for non-compliance. SLAs establish measurable expectations, enable performance monitoring, provide accountability, and trigger penalties or credits when standards aren't achieved."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types > Memorandum of agreement (MOA)",
    contextSummary: "Memorandum of Agreement (MOA) establishes formal understanding between organizations regarding collaborative efforts, shared responsibilities, or partnership terms with legal binding force. MOAs define roles, resource commitments, timelines, and deliverables for joint initiatives while maintaining organizational independence."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types > Memorandum of understanding (MOU)",
    contextSummary: "Memorandum of Understanding (MOU) documents mutual intent and general terms for cooperation between organizations without creating legally binding obligations. MOUs express commitment, outline objectives, define collaboration scope, and establish goodwill before formal contracts, often used in preliminary partnership stages."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types > Master service agreement (MSA)",
    contextSummary: "Master Service Agreements (MSAs) establish overarching terms, conditions, and framework governing multiple projects or ongoing relationships between organizations and vendors. MSAs streamline individual transactions, reduce negotiation overhead, standardize legal terms, and enable rapid engagement through work orders or statements of work."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types > Work order (WO) / Statement of work (SOW)",
    contextSummary: "Work Orders (WO) and Statements of Work (SOW) define specific project scope, deliverables, timelines, acceptance criteria, and pricing under master agreements. These documents provide detailed task descriptions, resource requirements, milestones, and success metrics for individual engagements while inheriting terms from parent MSAs."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types > Non-disclosure agreement (NDA)",
    contextSummary: "Non-Disclosure Agreements (NDAs) protect confidential information shared between organizations during evaluations, partnerships, or service delivery by restricting disclosure and use. NDAs define confidential materials, permitted purposes, protection obligations, exclusions, and breach remedies to safeguard intellectual property and sensitive data."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Agreement types > Business partners agreement (BPA)",
    contextSummary: "Business Partners Agreements (BPAs) establish comprehensive terms for strategic partnerships including revenue sharing, joint development, market collaboration, and mutual obligations. BPAs address intellectual property rights, governance structures, dispute resolution, exit provisions, and long-term commitment frameworks beyond simple vendor relationships."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Vendor monitoring",
    contextSummary: "Vendor monitoring involves continuous oversight of third-party performance, security posture, compliance status, and risk exposure through metrics tracking, audit reviews, and incident reporting. Ongoing monitoring identifies degrading performance, emerging risks, control failures, or changing circumstances requiring intervention or contract renegotiation."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Questionnaires",
    contextSummary: "Security questionnaires systematically gather information about vendor controls, practices, certifications, and capabilities through standardized questions covering technical, operational, and compliance domains. Questionnaires enable risk assessment, vendor comparison, gap identification, and due diligence documentation while reducing assessment effort through templates and automation."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain the processes associated with third-party risk assessment and management > Rules of engagement",
    contextSummary: "Rules of engagement define acceptable boundaries, authorized activities, communication protocols, and operational constraints when vendors access systems or data. These rules specify permitted actions, restricted areas, notification requirements, incident procedures, and escalation paths to prevent unauthorized access while enabling legitimate operations."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Consequences of non-compliance",
    contextSummary: "Non-compliance consequences include regulatory penalties, legal liabilities, operational restrictions, and reputational damage that impact organizational viability and stakeholder trust. Understanding potential consequences motivates compliance investment, informs risk decisions, and demonstrates the business case for security programs aligned with regulatory requirements."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Consequences of non-compliance > Fines",
    contextSummary: "Regulatory fines impose financial penalties for compliance violations, ranging from thousands to millions of dollars based on violation severity, duration, and organizational size. Fines serve as enforcement mechanisms, deter non-compliance, and provide revenue for regulatory agencies while potentially exceeding the cost of proper security implementation."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Consequences of non-compliance > Sanctions",
    contextSummary: "Sanctions restrict organizational operations through business prohibitions, market exclusions, technology restrictions, or partnership limitations imposed by regulators or industry bodies. These punitive measures can prevent government contracts, limit market access, or exclude organizations from payment networks until compliance is restored."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Consequences of non-compliance > Reputational damage",
    contextSummary: "Reputational damage from compliance failures erodes customer trust, partner confidence, and market perception through negative publicity, breach notifications, and regulatory enforcement actions. Long-lasting reputational impacts can reduce customer acquisition, increase churn, lower stock prices, and create competitive disadvantages exceeding direct financial penalties."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Consequences of non-compliance > Loss of license",
    contextSummary: "Loss of license or certification revokes legal authority to operate in regulated industries, process specific data types, or offer services requiring compliance validation. License revocation represents existential threat for healthcare providers, financial institutions, and other regulated entities where compliance is fundamental to business operations."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Consequences of non-compliance > Contractual impacts",
    contextSummary: "Contractual impacts include customer contract terminations, vendor relationship dissolution, insurance policy invalidation, or partnership agreement breaches resulting from compliance failures. These consequences create immediate revenue loss, increase operating costs, limit growth opportunities, and force business model changes to regain market access."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Compliance monitoring > Due diligence/care",
    contextSummary: "Due diligence and due care establish legal standards requiring organizations to implement reasonable security measures and maintain vigilant oversight to protect stakeholder interests. Due diligence involves researching appropriate controls while due care ensures ongoing proper implementation, together demonstrating responsible stewardship reducing legal liability."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Compliance monitoring > Attestation and acknowledgement",
    contextSummary: "Attestation and acknowledgement processes require formal statements from personnel confirming awareness, understanding, and commitment to security policies and regulatory requirements. These documented confirmations establish accountability, demonstrate training effectiveness, support compliance audits, and provide legal evidence of organizational compliance efforts."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Compliance monitoring > Internal and external",
    contextSummary: "Internal and external compliance monitoring combines organizational self-assessment with independent third-party validation to ensure comprehensive oversight and objective evaluation. Internal monitoring provides continuous visibility while external audits offer credibility, expertise, and unbiased assessment of control effectiveness and regulatory adherence."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Compliance monitoring > Automation",
    contextSummary: "Compliance automation uses tools to continuously monitor control effectiveness, detect configuration drift, generate compliance reports, and remediate violations without manual intervention. Automation increases monitoring frequency, reduces assessment costs, improves consistency, enables real-time visibility, and scales compliance programs across complex environments."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Privacy > Legal implications > Local/regional",
    contextSummary: "Local and regional privacy regulations establish data protection requirements for specific geographic areas such as California's CCPA, regional frameworks like GDPR, or city-level ordinances governing data collection and processing. Organizations must understand jurisdictional requirements, implement appropriate controls, and maintain compliance across all operating locations."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Privacy > Legal implications > National",
    contextSummary: "National privacy regulations establish country-wide data protection frameworks such as PIPEDA in Canada, LGPD in Brazil, or sector-specific laws like HIPAA in the United States. These regulations define citizen rights, organizational obligations, cross-border transfer restrictions, and enforcement mechanisms requiring tailored compliance programs for each jurisdiction."
  },
  {
    fullPath: "Security Program Management and Oversight > Summarize elements of effective security compliance > Privacy > Legal implications > Global",
    contextSummary: "Global privacy implications arise from international data transfers, multinational operations, and varying regulatory frameworks requiring organizations to navigate complex compliance landscapes. Organizations must implement controls satisfying the most restrictive applicable regulations, manage cross-border data flows through approved mechanisms, and maintain compliance across all operational jurisdictions."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain types and purposes of audits and assessments > Penetration testing > Reconnaissance > Passive",
    contextSummary: "Passive reconnaissance gathers information about targets through public sources, OSINT techniques, and observation without directly interacting with target systems. This approach includes searching public records, analyzing DNS data, reviewing social media, and examining public-facing websites to understand attack surfaces while minimizing detection risk."
  },
  {
    fullPath: "Security Program Management and Oversight > Explain types and purposes of audits and assessments > Penetration testing > Reconnaissance > Active",
    contextSummary: "Active reconnaissance directly interacts with target systems through port scanning, service enumeration, vulnerability scanning, and network mapping to gather detailed technical information. This approach provides comprehensive intelligence about services, versions, and configurations but generates detectable traffic that may trigger security monitoring and defensive responses."
  },
  {
    fullPath: "Security Program Management and Oversight > Given a scenario, implement security awareness practices > Phishing > Campaigns",
    contextSummary: "Phishing campaigns simulate real-world attacks by sending controlled phishing emails to employees, measuring susceptibility, and providing immediate training when users click malicious links or submit credentials. Regular campaigns build resilience, identify high-risk groups, demonstrate improvement over time, and create security-conscious culture through realistic practice."
  }
]

if (require.main === module) {
  updateSummariesByPath(batch11c)
    .then(() => {
      console.log('\n🎉 COMPLETE! All 844 entity summaries generated (100%)')
    })
    .catch((error) => {
      console.error('Error updating summaries:', error)
      process.exit(1)
    })
}

export { batch11c }
