-- Add advanced Zero Trust Architecture topics to Cybersecurity subject

DO $$
DECLARE
  v_subject_id UUID;
  v_zta_id UUID;
  v_concepts_id UUID;
  v_control_data_id UUID;
  v_examples_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Get Zero Trust Architecture (ZTA) ID
  SELECT id INTO v_zta_id FROM topics WHERE name = 'Zero Trust Architecture (ZTA)' AND subject_id = v_subject_id;

  -- Level 2: Zero Trust Security Concepts
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Zero Trust Security Concepts',
    'Core security concepts that form the foundation of Zero Trust Architecture, including adaptive identity, threat scope reduction, policy-driven access control, and device posture assessment.', 2)
  RETURNING id INTO v_concepts_id;

  -- Level 3: Zero Trust Security Concepts subtopics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_concepts_id, 'Adaptive identity',
      'It recognizes that user identities are not static and that identity verification must be continuous and based on a user''s current context and the resources they are attempting to access.', 3),
    (v_subject_id, v_concepts_id, 'Threat scope reduction',
      'It means that access to network resources is granted on a need-to-know basis, and access is limited to only those resources required to complete a specific task. This concept reduces the network''s attack surface and limits the damage that a successful attack can cause.', 3),
    (v_subject_id, v_concepts_id, 'Policy-driven access control',
      'It describes how access control policies are used to enforce access restrictions based on user identity, device posture, and network context.', 3),
    (v_subject_id, v_concepts_id, 'Device posture',
      'It refers to the security status of a device, including its security configurations, software versions, and patch levels. In a security context, device posture assessment involves evaluating the security status of a device to determine whether it meets certain security requirements or poses a risk to the network.', 3);

  -- Level 2: Control Plane and Data Plane
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Control Plane and Data Plane',
    'The two fundamental architectural planes in Zero Trust Architecture. The control plane defines policies and makes access decisions, while the data plane establishes secure sessions for information transfers based on control plane decisions.', 2)
  RETURNING id INTO v_control_data_id;

  -- Level 3: Control Plane and Data Plane subtopics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_control_data_id, 'Control Plane',
      'In zero trust architecture, functions that define policy and determine access decisions. The control plane manages policies that dictate how users and devices are authorized to access network resources. It is implemented through a centralized policy decision point. The policy decision point is responsible for defining policies that limit access to resources on a need-to-know basis, monitoring network activity for suspicious behavior, and updating policies to reflect changing network conditions and security threats. The policy decision point is comprised of two subsystems: The policy engine is configured with subject and host identities and credentials, access control policies, up-to-date threat intelligence, behavioral analytics, and other results of host and network security scanning and monitoring. This comprehensive state data allows it to define an algorithm and metrics for making dynamic authentication and authorization decisions on a per-request basis. The policy administrator is responsible for managing the process of issuing access tokens and establishing or tearing down sessions, based on the decisions made by the policy engine. The policy administrator implements an interface between the control plane and the data plane. Where systems in the control plane define policies and make decisions, systems in the data plane establish sessions for secure information transfers.', 3),
    (v_subject_id, v_control_data_id, 'Data Plane',
      'In the data plane, a subject (user or service) uses a system (such as a client host PC, laptop, or smartphone) to make requests for a given resource. A resource is typically an enterprise app running on a server or cloud. Each request is mediated by a policy enforcement point. The enforcement point might be implemented as a software agent running on the client host that communicates with an app gateway. The policy enforcement point interfaces with the policy administrator to set up a secure data pathway if access is approved, or tear down a session if access is denied or revoked.', 3);

  -- Level 2: Goal of Zero Trust Architecture
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Goal of Zero Trust Architecture',
    'The goal of zero trust design is to make this implicit trust zone as small as possible and as transient as possible. Trusted sessions might only be established for individual transactions. This granular or microsegmented approach is in contrast with perimeter-based models, where trust is assumed once a user has authenticated and joined the network. In zero trust, place in the network is not a sufficient reason to trust a subject request. Similarly, even if a user is nominally authenticated, behavioral analytics might cause a request to be blocked or a session to be terminated. Separating the control plane and data plane is significant because it allows for a more flexible and scalable network architecture. The centralized control plane ensures consistency for access request handling across both the managed enterprise network and unmanaged Internet or third-party networks, regardless of the devices being used or the user''s location. This makes managing access control policies and monitoring network activity for suspicious behavior easier. Continuous monitoring via the independent control plane means that sessions can be terminated if anomalous behavior is detected.', 2);

  -- Level 2: Zero Trust Architecture Examples
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_zta_id, 'Zero Trust Architecture Examples',
    'Real-world implementations of Zero Trust Architecture by major technology companies and security vendors, demonstrating practical applications of zero trust principles.', 2)
  RETURNING id INTO v_examples_id;

  -- Level 3: Zero Trust Architecture Examples subtopics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_examples_id, 'Google BeyondCorp',
      'Google''s BeyondCorp is a widely recognized example of a zero trust security architecture. BeyondCorp uses a system of multiple security layers, including identity verification, device verification, and access control policies, to secure Google''s internal network. This has enabled Google to provide its employees with remote access to company resources while maintaining high security.', 3),
    (v_subject_id, v_examples_id, 'Cisco Zero Trust Architecture',
      'Cisco has developed a comprehensive zero trust security architecture incorporating network segmentation, access control policies, and threat detection and response capabilities. The architecture is designed to protect against a wide range of cyber threats, including insider threats and external attacks.', 3),
    (v_subject_id, v_examples_id, 'Palo Alto Networks Prisma Access',
      'Prisma Access is a cloud-delivered security service that uses a zero trust architecture to secure network traffic. It provides secure access to cloud and Internet resources while also preventing data exfiltration and other cyber threats.', 3);

END $$;
