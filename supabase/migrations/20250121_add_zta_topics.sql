-- Add Zero Trust Architecture (ZTA) topics to Cybersecurity subject

DO $$
DECLARE
  v_subject_id UUID;
  v_zta_id UUID;
  v_trends_id UUID;
  v_benefits_id UUID;
  v_components_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Level 1: Zero Trust Architecture (ZTA)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, NULL, 'Zero Trust Architecture (ZTA)',
    'The security design paradigm where any request (host-to-host or container-to-container) must be authenticated before being allowed. Organizations'' increased dependence on information technology has driven requirements for services to be always on, always available, and accessible from anywhere. Cloud platforms have become an essential component of technology infrastructures, driving broad software and system dependencies and widespread platform integration. The distinction between inside and outside is gone. For an organization leveraging remote workforces, running a mix of on-premises and public cloud infrastructure, and using outsourced services and contractors, the opportunity for breach is very high. Staff and employees are using computers attached to home networks, or worse, unsecured public Wi-Fi. Critical systems are accessible through various external interfaces and run software developed by outsourced, contracted external entities. In addition, many organizations design their environments to accommodate Bring Your Own Device (BYOD.) As these trends continue, implementing Zero Trust architectures will become more critical. Zero Trust architectures assume that nothing should be taken for granted and that all network access must be continuously verified and authorized. Any user, device, or application seeking access must be authenticated and verified. Zero Trust differs from traditional security models based on simply granting access to all users, devices, and applications contained within an organization''s trusted network. NIST SP 800-207 "Zero Trust Architecture" defines Zero Trust as "cybersecurity paradigms that move defenses from static, network-based perimeters to focus on users, assets, and resources." A Zero Trust architecture can protect data, applications, networks, and systems from malicious attacks and unauthorized access more effectively than a traditional architecture by ensuring that only necessary services are allowed and only from appropriate sources. Zero Trust enables organizations to offer services based on varying levels of trust, such as providing more limited access to sensitive data and systems.', 1)
  RETURNING id INTO v_zta_id;

  -- Level 2: Deperimeterization
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Deperimeterization',
    'Deperimeterization refers to a security approach that shifts the focus from defending a network''s boundaries to protecting individual resources and data within the network. As organizations adopt cloud computing, remote work, and mobile devices, traditional perimeter-based security models become less effective in addressing modern threats. Deperimeterization concepts advocate for implementing multiple security measures around individual assets, such as data, applications, and services. This approach includes robust authentication, encryption, access control, and continuous monitoring to maintain the security of critical resources, regardless of their location.', 2);

  -- Level 2: Trends Driving Deperimeterization
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Trends Driving Deperimeterization',
    'Key trends that drive the need for deperimeterization and Zero Trust architectures, including cloud computing, remote work, mobile devices, outsourcing, and wireless networks.', 2)
  RETURNING id INTO v_trends_id;

  -- Level 3: Trends
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_trends_id, 'Cloud',
      'Enterprise infrastructures are typically spread between on-premises and cloud platforms. In addition, cloud platforms may be used to distribute computing resources globally.', 3),
    (v_subject_id, v_trends_id, 'Remote Work',
      'More and more organizations have adopted either part-time or full-time remote workforces. This remote workforce expands the enterprise footprint dramatically. In addition, employees working from home are more susceptible to security lapses when they connect from insecure locations and use personal devices.', 3),
    (v_subject_id, v_trends_id, 'Mobile',
      'Modern smartphones and tablets are often used as primary computing devices as they have ample processor, memory, and storage capacity. More and more corporate data is accessed through these devices as their capabilities expand. Mobile devices and their associated operating systems have varying security features, and various budget devices are sometimes not supported by vendors shortly after release, meaning they cannot be updated or patched. In addition, mobile devices are often lost or stolen.', 3),
    (v_subject_id, v_trends_id, 'Outsourcing and Contracting',
      'Support arrangements often provide remote access to external entities, and this access can often mean that the external provider''s network serves as an entry point to the organizations they support.', 3),
    (v_subject_id, v_trends_id, 'Wireless Networks (Wi-Fi)',
      'Wireless networks are susceptible to an ever-increasing array of exploits, but oftentimes wireless networks are open and unsecured or the network security key is well known.', 3);

  -- Level 2: Benefits of a Zero Trust Architecture
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Benefits of a Zero Trust Architecture',
    'Key advantages of implementing a Zero Trust Architecture including enhanced security, better access controls, improved compliance, and increased granularity.', 2)
  RETURNING id INTO v_benefits_id;

  -- Level 3: Benefits
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_benefits_id, 'Greater security',
      'Requires all users, devices, and applications to be authenticated and verified before network access.', 3),
    (v_subject_id, v_benefits_id, 'Better access controls',
      'Include more stringent limits regarding who or what can access resources and from what locations.', 3),
    (v_subject_id, v_benefits_id, 'Improved governance and compliance',
      'Limit data access and provide greater operational visibility on user and device activity.', 3),
    (v_subject_id, v_benefits_id, 'Increased granularity',
      'Grants users access to what they need when they need it.', 3);

  -- Level 2: Components of a Zero Trust architecture
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Components of a Zero Trust architecture',
    'Essential components that make up a Zero Trust Architecture including network security, identity management, policy enforcement, cloud security, visibility, segmentation, data protection, and threat detection.', 2)
  RETURNING id INTO v_components_id;

  -- Level 3: Components
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_components_id, 'Network and endpoint security',
      'Controls access to applications, data, and networks.', 3),
    (v_subject_id, v_components_id, 'Identity and access management (IAM)',
      'Ensures only verified users can access systems and data.', 3),
    (v_subject_id, v_components_id, 'Policy-based enforcement',
      'Restricts network traffic to only legitimate requests.', 3),
    (v_subject_id, v_components_id, 'Cloud security',
      'Manages access to cloud-based applications, services, and data.', 3),
    (v_subject_id, v_components_id, 'Network visibility',
      'Analyzes network traffic and devices for suspicious activity.', 3),
    (v_subject_id, v_components_id, 'Network segmentation',
      'Controls access to sensitive data and capabilities from trusted locations.', 3),
    (v_subject_id, v_components_id, 'Data protection',
      'Controls and secures access to sensitive data, including encryption and auditing.', 3),
    (v_subject_id, v_components_id, 'Threat detection and prevention',
      'Identifies and prevents attacks against the network and the systems connected to it.', 3);

END $$;
