-- Migration: Add Cloud Computing topics
-- Adds Cloud Computing as Level 1 trunk with deployment models

DO $$
DECLARE
  v_subject_id UUID;
  v_cloud_computing_id UUID;
  v_cloud_deployment_model_id UUID;
  v_cloud_security_considerations_id UUID;
  v_cloud_service_model_id UUID;
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

  -- Level 2: Cloud Security Considerations (branch under Cloud Computing)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_cloud_computing_id, 'Cloud Security Considerations',
    'Security-related architectural approaches and considerations for cloud deployments, including tenant isolation, resource management, and infrastructure control models.', 2)
  RETURNING id INTO v_cloud_security_considerations_id;

  -- Level 3: Cloud Security Architecture Types
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_cloud_security_considerations_id, 'Single-tenant Architecture',
      'It provides dedicated infrastructure to a single customer, ensuring that only that customer can access the infrastructure. This model offers the highest level of security as the customer has complete control over the infrastructure. However, it can be more expensive than multi-tenant architecture, and the customer is responsible for managing and securing the infrastructure.', 3),
    (v_subject_id, v_cloud_security_considerations_id, 'Multi-tenant Architecture',
      'It is when multiple customers share the same infrastructure, with each customer''s data and applications separated logically from other customers. This model is cost-effective but can increase the risk of unauthorized access or data leakage if not properly secured.', 3),
    (v_subject_id, v_cloud_security_considerations_id, 'Hybrid Architecture',
      'It uses public and private cloud infrastructure. This model provides greater flexibility and control over sensitive data and applications by allowing customers to store sensitive data on private cloud infrastructure while using public cloud infrastructure for less sensitive workloads. However, it also requires careful management to ensure proper integration and security between the public and private clouds.', 3),
    (v_subject_id, v_cloud_security_considerations_id, 'Serverless Architecture',
      'It is when the cloud provider manages the infrastructure and automatically scales resources up or down based on demand. This model can be more secure than traditional architectures because the cloud provider manages and secures the infrastructure. However, customers must still take steps to secure access to their applications and data.', 3);

  -- Level 2: Cloud Service Model (branch under Cloud Computing)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_cloud_computing_id, 'Cloud Service Model',
    'Classifying the provision of cloud services and the limit of the cloud service provider''s responsibility as software, platform, infrastructure, and so on.', 2)
  RETURNING id INTO v_cloud_service_model_id;

  -- Level 3: Specific Cloud Service Models
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_cloud_service_model_id, 'Software as a Service (SaaS)',
      'A cloud service model that provisions fully developed application services to users. Rather than purchasing software licenses for a given number of seats, a business accesses software hosted on a supplier''s servers on a pay-as-you-go or lease arrangement (on-demand). The virtual infrastructure allows developers to provision on-demand applications much more quickly than previously. The applications are developed and tested in the cloud without the need to test and deploy on client computers. Examples include Microsoft Office 365 (microsoft.com/en-us/microsoft-365/enterprise), Salesforce (salesforce.com), and Google G Suite (gsuite.google.com).', 3),
    (v_subject_id, v_cloud_service_model_id, 'Platform as a Service (PaaS)',
      'A cloud service model that provisions application and database services as a platform for development of apps. It provides resources somewhere between SaaS and IaaS. A typical PaaS solution would provide servers and storage network infrastructure (as per IaaS) but also provide a multi-tier web application/database platform on top. This platform could be based on Oracle and MS SQL or PHP and MySQL. Examples include Oracle Database (oracle.com/database), Microsoft Azure SQL Database (azure.microsoft.com/services/sql-database), and Google App Engine (cloud.google.com/appengine). Distinct from SaaS, this platform would not be configured to do anything. Your developers would create the software (the CRM or e‑commerce application) that runs using the platform. The service provider would be responsible for the integrity and availability of the platform components, and you would be responsible for the security of the application you created on the platform.', 3),
    (v_subject_id, v_cloud_service_model_id, 'Infrastructure as a Service (IaaS)',
      'A cloud service model that provisions virtual machines and network infrastructure. It is a means of provisioning IT resources such as servers, load balancers, and storage area network (SAN) components quickly. Rather than purchase these components and the Internet links they require, you rent them as needed from the service provider''s datacenter. Examples include Amazon Elastic Compute Cloud (aws.amazon.com/ec2), Microsoft Azure Virtual Machines (azure.microsoft.com/services/virtual-machines), Oracle Cloud (oracle.com/cloud), and OpenStack (openstack.org).', 3),
    (v_subject_id, v_cloud_service_model_id, 'Third-Party Vendors',
      'Third-party vendors are external entities that provide organizations with goods, services, or technology solutions. In cloud computing, third-party vendors refer to the providers offering cloud services to businesses using infrastructure-, platform-, or software-as-a-service models. As a third party, careful consideration regarding cloud service provider selection, contract negotiation, service performance, compliance, and communication practices is paramount. Organizations must adopt robust vendor management strategies to mitigate cloud platform risks, ensure service quality, and optimize cloud deployments. Service-level agreements (SLAs) are contractual agreements between organizations and cloud service providers that outline the expected levels of service delivery. SLAs define metrics, such as uptime, performance, and support response times, along with penalties or remedies if service levels are not met. SLAs provide a framework to hold vendors accountable for delivering services at required performance levels. Organizations must assess the security practices implemented by vendors to protect their sensitive data, including data encryption, access controls, vulnerability management, incident response procedures, and regulatory compliance, and are responsible for ensuring compliance with data privacy requirements, especially if they handle personally identifiable information (PII) or operate in regulated industries. Vendor lock-in makes switching to alternative vendors or platforms challenging or impossible, and so organizations must carefully evaluate data portability, interoperability, and standardization to mitigate vendor lock-in risks. Strategies like multi-cloud or hybrid cloud deployments can provide flexibility and reduce reliance on a single vendor.', 3);

END $$;
