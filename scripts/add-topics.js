const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const newTopics = [
  { name: 'Risk Tolerance', description: "Determines the thresholds that separate different levels of risk." },
  { name: 'Risk Reporting', description: "A periodic summary of relevant information about a project's current risks. It provides a summarized overview of known risks, realized risks, and their impact on the organization." },
  { name: 'Business Impact Analysis (BIA)', description: "Systematic activity that identifies organizational risks and determines their effect on ongoing, mission critical operations." },
  { name: 'Mission Essential Function (MEF)', description: "Business or organizational activity that is too critical to be deferred for anything more than a few hours, if at all." },
  { name: 'Maximum Tolerable Downtime (MTD)', description: "The longest period that a process can be inoperable without causing irrevocable business failure." },
  { name: 'Recovery Time Objective (RTO)', description: "The maximum time allowed to restore a system after a failure event." },
  { name: 'Work Recovery Time (WRT)', description: "In disaster recovery, time additional to the RTO of individual systems to perform reintegration and testing of a restored or upgraded system following an event." },
  { name: 'Recovery Point Objective (RPO)', description: "The longest period that an organization can tolerate lost data being unrecoverable." },
  { name: 'Mean Time Between Failures (MTBF)', description: "Metric for a device or component that predicts the expected time between failures." },
  { name: 'Mean Time To Repair (MTTR)', description: "Metric representing average time taken for a device or component to be repaired, replaced, or otherwise recover from a failure." },
  { name: 'Due Diligence', description: "A legal principle that a subject has used best practice or reasonable care when setting up, configuring, and maintaining a system." },
  { name: 'Conflict of Interest', description: "When an individual or organization has investments or obligations that could compromise their ability to act objectively, impartially, or in the best interest of another party." },
  { name: 'Memorandum of Understanding (MOU)', description: "Usually a preliminary or exploratory agreement to express an intent to work together that is not legally binding and does not involve the exchange of money." },
  { name: 'Nondisclosure Agreement (NDA)', description: "An agreement that stipulates that entities will not share confidential information, knowledge, or materials with unauthorized third parties." },
  { name: 'Memorandum of Agreement (MOA)', description: "Legal document forming the basis for two parties to cooperate without a formal contract (a cooperative agreement). MOAs are often used by public bodies." },
  { name: 'Business Partnership Agreement (BPA)', description: "Agreement by two companies to work together closely, such as the partner agreements that large IT companies set up with resellers and solution providers." },
  { name: 'Master Service Agreement (MSA)', description: "A contract that establishes precedence and guidelines for any business documents that are executed between two parties." },
  { name: 'Service-level Agreement (SLA)', description: "An agreement that sets the service requirements and expectations between a consumer and a provider." },
  { name: 'Statement of Work (SOW) / Work Order (WO)', description: "A document that defines the expectations for a specific business arrangement." },
  { name: 'Questionnaires (Vendor Management)', description: "In vendor management, structured means of obtaining consistent information, enabling more effective risk analysis and comparison." },
  { name: 'Rules of Engagement (RoE)', description: "A definition of how a pen test will be executed and what constraints will be in place. This provides the pen tester with guidelines to consult as they conduct their tests so that they don't have to constantly ask management for permission to do something." },
  { name: 'Active Reconnaissance', description: "Penetration testing techniques that interact with target systems directly." },
  { name: 'Passive Reconnaissance', description: "Penetration testing techniques that do not interact with target systems directly." },
  { name: 'Offensive Penetration Testing', description: "The \"hostile\" or attacking team in a penetration test or incident response exercise." },
  { name: 'Defensive Penetration Testing', description: "The defensive team in a penetration test or incident response exercise." },
  { name: 'Physical Penetration Testing', description: "Assessment techniques that extend to site and other physical security systems." },
  { name: 'Integrated Penetration Testing', description: "A holistic approach that combines different types of penetration testing methodologies and techniques to evaluate an organization's security operations." },
  { name: 'Regulated Data', description: "Information that has storage and handling compliance requirements defined by national and state legislation and/or industry regulations." },
  { name: 'Trade Secret', description: "Intellectual property that gives a company a competitive advantage but hasn't been registered with a copyright, trademark, or patent." },
  { name: 'Legal Data', description: "Documents and records that relate to matters of law, such as contracts, property, court cases, and regulatory filings." },
  { name: 'Financial Data', description: "Data held about bank and investment accounts, plus information such as payroll and tax returns." },
  { name: 'Human-readable Data', description: "Information stored in a file type that human beings can access and understand using basic viewer software, such as documents, images, video, and audio." },
  { name: 'Non-human-readable Data', description: "Information stored in a file that human beings cannot read without a specialized processor to decode the binary or complex structure." },
  { name: 'Data Classification', description: "The process of applying confidentiality and privacy labels to information." },
  { name: 'Proprietary Information', description: "Information created by an organization, typically about the products or services that it makes or provides." },
  { name: 'Data Sovereignty', description: "In data protection, the principle that countries and states may impose individual requirements on data collected or stored within their jurisdiction." },
  { name: 'Data Subjects', description: "An individual that is identified by privacy data." },
  { name: 'Data Inventories', description: "List of classified data or information stored or processed by a system." },
  { name: 'Data Retention', description: "The process an organization uses to maintain the existence of and control over certain data in order to comply with business policies and/or applicable laws and regulations." },
  { name: 'Data Breach', description: "When confidential or private data is read, copied, or changed without authorization. Data breach events may have notification and reporting requirements." },
  { name: 'Escalated (Support Procedures)', description: "In the context of support procedures, incident response, and breach-reporting, escalation is the process of involving expert and senior staff to assist in problem management." },
  { name: 'Health Insurance Portability and Accountability Act (HIPAA)', description: "US federal law that protects the storage, reading, modification, and transmission of personal healthcare data." },
  { name: 'Database Encryption', description: "Applying encryption at the table, field, or record level via a database management system rather than via the file system." },
  { name: 'Code of Conduct', description: "Professional behavior depends on basic ethical standards, such as honesty and fairness. Some professions may have developed codes of ethics to cover difficult situations; some businesses may also have a code of ethics to communicate the values it expects its employees to practice." },
  { name: 'Clean Desk Policy', description: "An organizational policy that mandates employee work areas be free from potentially sensitive information; sensitive documents must not be left out where unauthorized personnel might see them." },
  { name: 'Computer-based Training (CBT)', description: "Training and education programs delivered using computer devices and e-learning instructional models and design." },
  { name: 'Anomalous Behavior Recognition', description: "Systems that automatically detect users, hosts, and services that deviate from what is expected, or systems and training that encourage reporting of this by employees." },
  { name: 'Operational Technology (OT)', description: "A communications network designed to implement an industrial control system rather than data networking." }
];

async function main() {
  // Check which topics already exist
  const topicNames = newTopics.map(t => t.name);
  const { data: existing, error: checkError } = await supabase
    .from('topics')
    .select('name')
    .in('name', topicNames);

  if (checkError) {
    console.log('Error checking existing topics:', checkError);
    return;
  }

  const existingNames = new Set(existing.map(t => t.name));

  console.log('=== Already exist (' + existingNames.size + ') ===');
  existing.forEach(t => console.log('  ✓ ' + t.name));

  const toAdd = newTopics.filter(t => !existingNames.has(t.name));

  console.log('\n=== To be added (' + toAdd.length + ') ===');
  toAdd.forEach(t => console.log('  + ' + t.name));

  if (toAdd.length === 0) {
    console.log('\nNo new topics to add.');
    return;
  }

  // Add missing topics with default values
  const topicsToInsert = toAdd.map(t => ({
    name: t.name,
    description: t.description,
    hierarchy_level: 4,  // Leaf level
    subject_id: 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',  // Cybersecurity
    available_bloom_levels: [1, 2, 3, 4, 5, 6]
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('topics')
    .insert(topicsToInsert)
    .select('name');

  if (insertError) {
    console.log('\nError inserting topics:', insertError);
    return;
  }

  console.log('\n=== Successfully added (' + inserted.length + ') ===');
  inserted.forEach(t => console.log('  ✓ ' + t.name));
}

main().catch(console.error);
