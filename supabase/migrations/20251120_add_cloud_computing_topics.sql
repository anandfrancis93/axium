-- Migration: Add Cloud Computing topics
-- Adds Cloud Computing as Level 1 trunk with deployment models

DO $$
DECLARE
  v_subject_id UUID;
  v_cloud_computing_id UUID;
  v_cloud_deployment_model_id UUID;
BEGIN
  -- Get the Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity' LIMIT 1;

  -- Level 1: Cloud Computing (trunk/root topic)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, NULL, 'Cloud Computing',
    'Computing architecture where on-demand resources provisioned with the attributes of high availability, scalability, and elasticity are billed to customers on the basis of metered utilization.', 1)
  RETURNING id INTO v_cloud_computing_id;

  -- Level 2: Cloud Service Provider (branch under Cloud Computing)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_cloud_computing_id, 'Cloud Service Provider (CSP)',
    'Organization providing infrastructure, application, and/or storage services via an "as a service" subscription-based, cloud-centric offering.', 2);

  -- Level 2: Cloud Deployment Model (branch under Cloud Computing)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_cloud_computing_id, 'Cloud Deployment Model',
    'Classifying the ownership and management of a cloud as public, private, community, or hybrid.', 2)
  RETURNING id INTO v_cloud_deployment_model_id;

  -- Level 3: Specific Cloud Deployment Models
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_cloud_deployment_model_id, 'Public (or multi-tenant)',
      'A cloud that is deployed for shared use by multiple independent tenants. It is a service offered over the Internet by cloud service providers (CSPs) to cloud consumers. With this model, businesses can offer subscriptions or pay-as-you-go financing, while at the same time providing lower-tier services free of charge. As a shared resource, there are risks regarding performance and security. Multi-cloud architectures are where an organization uses services from multiple CSPs.', 3),
    (v_subject_id, v_cloud_deployment_model_id, 'Multi-cloud',
      'A cloud deployment model where the cloud consumer uses multiple public cloud services.', 3),
    (v_subject_id, v_cloud_deployment_model_id, 'Hosted Private',
      'It is hosted by a third party for the exclusive use of the organization. This is more secure and can guarantee better performance but is correspondingly more expensive.', 3),
    (v_subject_id, v_cloud_deployment_model_id, 'Private',
      'A cloud that is deployed for use by a single entity. It is cloud infrastructure that is completely private to and owned by the organization. In this case, there is likely to be one business unit dedicated to managing the cloud while other business units make use of it. With private cloud computing, organizations exercise greater control over the privacy and security of their services. This type of delivery method is geared more toward banking and governmental services that require strict access control in their operations. A private cloud could be on-premises or off-site relative to the other business units. An on-site link can obviously deliver better performance and is less likely to be subject to outages (loss of an Internet link, for instance). On the other hand, a dedicated off-site facility may provide better shared access for multiple users in different locations.', 3),
    (v_subject_id, v_cloud_deployment_model_id, 'Community',
      'A cloud that is deployed for shared use by cooperating tenants.', 3),
    (v_subject_id, v_cloud_deployment_model_id, 'Hybrid Cloud',
      'A cloud deployment that uses both private and public elements. A hybrid cloud most commonly describes a computing environment combining public and private cloud infrastructures, although any combination of cloud infrastructures constitutes a hybrid cloud. In a hybrid cloud, companies can store data in a private cloud but also leverage the resources of a public cloud when needed. This allows for greater flexibility and scalability, as well as cost savings. A hybrid cloud is commonly used because it enables companies to take advantage of the benefits of both private and public clouds. Private clouds can provide greater security and control over data, while public clouds offer more cost-effective scalability and access to a broader range of resources. A hybrid cloud also allows for a smoother transition to the cloud for companies that may need more time to migrate all of their data. A hybrid cloud also presents security challenges, such as managing multiple cloud environments and enforcing consistent security policies. One issue is the complexity of managing multiple cloud environments and integrating them with on-premises infrastructure, which can create security gaps and increase the risk of data breaches. Another concern is the potential for unauthorized access to data and applications, particularly when sensitive information is stored in the public cloud. There are often mistakes caused by confusion over the boundary between on-premises and public cloud infrastructure. Additionally, using multiple cloud providers can make it challenging to enforce consistent security policies across all environments. A hybrid cloud infrastructure can provide data redundancy features, such as replicating data across on-premises and cloud infrastructure. Data protection can be achieved through redundancy, but it can also lead to issues with data consistency stemming from synchronization problems among multiple locations. Considering that legal compliance is a critical concern when implementing any type of cloud environment, organizations must ensure that data stored in both the on-premises and cloud components of the hybrid environment comply with these mandates. This adds additional complexity to data governance and security operations. Another consideration is the establishment and enforcement of service-level agreements (SLAs). SLAs formally outline all performance, availability, and support expectations between the cloud service provider and the organization. Guaranteeing expected levels of service can be challenging when dealing with the integration of different cloud and on-premises systems. Other concerns related to the hybrid cloud include the potential for increased network latency due to large data transfer volumes between on-premises and cloud environments that impact application performance, and monitoring the hybrid environment can be more complex due to the requirement for specialized expertise and tools.', 3);

END $$;
