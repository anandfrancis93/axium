-- Migration: Add Cloud Computing topics
-- Adds Cloud Computing as Level 1 trunk with deployment models

DO $$
DECLARE
  v_subject_id UUID;
  v_cloud_computing_id UUID;
  v_cloud_deployment_model_id UUID;
  v_cloud_security_considerations_id UUID;
  v_cloud_service_model_id UUID;
  v_csp_responsibility_matrix_id UUID;
  v_csp_responsibilities_id UUID;
  v_customer_responsibilities_id UUID;
  v_resilient_architecture_id UUID;
  v_ha_service_levels_id UUID;
  v_virtualization_id UUID;
  v_responsiveness_id UUID;
  v_sdn_id UUID;
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

  -- Level 2: Cloud Service Provider (CSP) Responsibility Matrix
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_cloud_computing_id, 'Cloud Service Provider (CSP) Responsibility Matrix',
    'Identifies that responsibility for the implementation of security as applications, data, and workloads are transitioned into a cloud platform are shared between the customer and the cloud service provider (CSP).', 2)
  RETURNING id INTO v_csp_responsibility_matrix_id;

  -- Level 3: Cloud Service Provider Responsibilities
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_csp_responsibility_matrix_id, 'Cloud Service Provider Responsibilities',
    'Security responsibilities that are the obligation of the cloud service provider to implement and maintain.', 3)
  RETURNING id INTO v_csp_responsibilities_id;

  -- Level 4: Specific CSP Responsibilities
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_csp_responsibilities_id, 'Physical Security of the Infrastructure',
      'Physical security of the infrastructure', 4),
    (v_subject_id, v_csp_responsibilities_id, 'Securing Computer, Storage, and Network Equipment',
      'Securing computer, storage, and network equipment', 4),
    (v_subject_id, v_csp_responsibilities_id, 'Securing Foundational Elements of Networking',
      'Securing foundational elements of networking, such as DDoS protection', 4),
    (v_subject_id, v_csp_responsibilities_id, 'Cloud Storage Backup and Recovery',
      'Cloud storage backup and recovery', 4),
    (v_subject_id, v_csp_responsibilities_id, 'Security of Cloud Infrastructure Resource Isolation',
      'Security of cloud infrastructure resource isolation among tenants', 4),
    (v_subject_id, v_csp_responsibilities_id, 'Tenant Resource Identity and Access Control',
      'Tenant resource identity and access control', 4),
    (v_subject_id, v_csp_responsibilities_id, 'Security, Monitoring, and Incident Response for Infrastructure',
      'Security, monitoring, and incident response for the infrastructure', 4),
    (v_subject_id, v_csp_responsibilities_id, 'Securing and Managing Datacenters',
      'Securing and managing the datacenters located in multiple geographic regions', 4);

  -- Level 3: Cloud Service Customer Responsibilities
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_csp_responsibility_matrix_id, 'Cloud Service Customer Responsibilities',
    'Security responsibilities that are the obligation of the cloud service customer to implement and maintain.', 3)
  RETURNING id INTO v_customer_responsibilities_id;

  -- Level 4: Specific Customer Responsibilities
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_customer_responsibilities_id, 'User Identity Management',
      'User identity management', 4),
    (v_subject_id, v_customer_responsibilities_id, 'Configuring Geographic Location for Data Storage',
      'Configuring the geographic location for storing data and running services', 4),
    (v_subject_id, v_customer_responsibilities_id, 'User and Service Access Controls',
      'User and service access controls to cloud resources', 4),
    (v_subject_id, v_customer_responsibilities_id, 'Data and Application Security Configuration',
      'Data and application security configuration', 4),
    (v_subject_id, v_customer_responsibilities_id, 'Protection of Operating Systems',
      'Protection of operating systems, when deployed', 4),
    (v_subject_id, v_customer_responsibilities_id, 'Use and Configuration of Encryption',
      'Use and configuration of encryption, especially the protection of keys', 4);

  -- Level 2: Resilient Cloud Architecture
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_cloud_computing_id, 'Resilient Cloud Architecture',
    'Architectural approaches and technologies that ensure cloud systems remain available, reliable, and performant even in the face of failures or disruptions.', 2)
  RETURNING id INTO v_resilient_architecture_id;

  -- Level 3: Virtualization
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_resilient_architecture_id, 'Virtualization',
    'A computing environment where multiple independent operating systems can be installed to a single hardware platform and run simultaneously.', 3)
  RETURNING id INTO v_virtualization_id;

  -- Level 4: Virtualization Types
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_virtualization_id, 'Application Virtualization',
      'A software delivery model where the code runs on a server and is streamed to a client. Application virtualization is a more limited type of virtual desktop infrastructure (VDI). Rather than run the whole client desktop as a virtual platform, the client either accesses an application hosted on a server or streams the application from the server to the client for local processing. Most application virtualization solutions are based on Citrix XenApp (formerly MetaFrame Presentation Server), though Microsoft has developed an App-V product with its Windows Server range and VMware has the ThinApp product. These solution types are often used with HTML5 remote desktop apps, referred to as "clientless" because users can access them through ordinary web browser software.', 4),
    (v_subject_id, v_virtualization_id, 'Containerization',
      'An operating system virtualization deployment containing everything required to run a service, application, or microservice. Containerization is a powerful technology that has transformed application packaging and deployment. Containers encapsulate all necessary components for software, including code, libraries, and configurations, within a portable unit termed a "container." Isolating software in this way ensures consistent application behavior regardless of the underlying platform on which it runs. Software containers parallel the use of physical containers utilized in the shipping industry.', 4);

  -- Level 3: Other Core Resilience Technologies
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_resilient_architecture_id, 'High Availability (HA)',
      'A metric that defines how closely systems approach the goal of providing data availability 100% of the time while maintaining a high level of system performance.', 3),
    (v_subject_id, v_resilient_architecture_id, 'Data Replication',
      'Automatically copying data between two processing systems either simultaneously on both systems (synchronous) or from a primary to a secondary location (asynchronous). Data replication allows businesses to copy data to where it can be utilized most effectively. The cloud may be used as a central storage area, making data available among all business units. Data replication requires low latency network connections, security, and data integrity. CSPs offer several data storage performance tiers (cloud.google.com/storage/docs/storage-classes). The terms "hot storage" and "cold storage" refer to how quickly data is retrieved. Hot storage retrieves data more quickly than cold, but the quicker the data retrieval, the higher the cost. Different applications have diverse replication requirements. A database generally needs low-latency, synchronous replication, as a transaction often cannot be considered complete until it has been made on all replicas. A mechanism to replicate data to backup storage might not have such high requirements, depending on the criticality of the data.', 3),
    (v_subject_id, v_resilient_architecture_id, 'Serverless Computing',
      'Features and capabilities of a server without needing to perform server administration tasks. Serverless computing offloads infrastructure management to the cloud service provider—for example, configuring file storage capability without the requirement of first building and deploying a file server. Serverless computing is a cloud computing model in which the cloud provider manages the infrastructure and automatically allocates resources as needed, charging only for the actual usage of the application. In this approach, organizations do not need to manage servers and other infrastructure, allowing them to focus on developing and deploying applications. Some examples of serverless computing applications include chatbots designed to simulate conversations with human users to automate customer support, sales, marketing tasks, and mobile backends. These are comprised of the server-side components of mobile applications designed to provide data processing, storage, communication services, and event-driven processing that respond to events or triggers in real time such as sensor readings, alerts, or other similar events. Major cloud providers like Amazon Web Services (AWS), Microsoft Azure, and Google Cloud offer serverless computing capabilities, making it easier for organizations to leverage this technology. Serverless computing provides a scalable, cost-effective, and easy-to-manage infrastructure for event-driven and data-processing tasks. With serverless, all the architecture is hosted within a cloud, but unlike "traditional" virtual private cloud (VPC) offerings, services such as authentication, web applications, and communications aren''t developed and managed as applications running on VM instances within the cloud. Instead, the applications are developed as functions and microservices, each interacting with other functions to facilitate client requests. Billing is based on execution time rather than hourly charges. Examples of this type of service include AWS Lambda (aws.amazon.com/lambda), Google Cloud Functions (cloud.google.com/functions), and Microsoft Azure Functions (azure.microsoft.com/services/functions). Serverless platforms eliminate the need to manage physical or virtual server instances, so there is little to no management effort for software and patches, administration privileges, or file system security monitoring. There is no requirement to provision multiple servers for redundancy or load balancing. As all of the processing is taking place within the cloud, there is little emphasis on the provision of a corporate network. The service provider manages this underlying architecture. The principal network security job is to ensure that the clients accessing the services have not been compromised. Serverless architecture depends heavily on event-driven orchestration to facilitate operations. For example, multiple services are triggered when a client connects to an application. The application needs to authenticate the user and device, identify the location of the device and its address properties, create a session, load authorizations for the action, use application logic to process the action, read or commit information from a database, and log the transaction. This design logic differs from applications written in a "monolithic" server-based environment.', 3),
    (v_subject_id, v_resilient_architecture_id, 'Virtual Private Cloud (VPC)',
      'A private network segment made available to a single cloud consumer on a public cloud.', 3),
    (v_subject_id, v_resilient_architecture_id, 'Microservices',
      'An independent, single-function module with well-defined and lightweight interfaces and operations. Typically this style of architecture allows for rapid, frequent, and reliable delivery of complex applications. Microservices is an architectural approach to building software applications as a collection of small and independent services focusing on a specific business capability. Each microservice is designed to be modular, with a well-defined interface and a single responsibility. This approach allows developers to build and deploy complex applications more efficiently by breaking them down into smaller, more manageable components. Microservices also enable teams to work independently on different application features, making it easier to scale and update individual components without affecting the entire system. Overall, microservices promise to help organizations build more agile, scalable, and resilient applications that adapt quickly to changing business needs. Risks associated with this model are largely attributed to integration issues. While individual components operate well independently, they often reveal problems difficult to isolate and resolve once they are integrated. Microservices and Infrastructure as Code (IaC) are related technologies, and Microservices architecture is often implemented using IaC practices. Using IaC, developers can define and deploy infrastructure as code, ensuring consistency and repeatability across different environments. This allows for more efficient development and deployment of microservices since developers can independently automate the provisioning and deploying infrastructure for each microservice.', 3),
    (v_subject_id, v_resilient_architecture_id, 'Infrastructure as Code (IaC)',
      'Provisioning architecture in which deployment of resources is performed by scripted automation and orchestration. Infrastructure as Code (IaC) is a software engineering practice that manages computing infrastructure using machine-readable definition files. These files contain code written in a specific format that can be read and executed by machines. These files manage and provision computing infrastructure. Machine-readable definition files are written in formats like YAML, JSON, and HCL (HashiCorp Configuration Language.) They contain information about the desired infrastructure state, including configuration settings, networking requirements, security policies, and other settings. By using machine-readable definition files, infrastructure can be deployed and managed automatically and consistently, reducing the risk of errors caused by manual intervention. These files are typically version-controlled and can be treated like any other code in a software project. IaC allows developers and operations teams to automate the process of deploying and managing infrastructure, reducing the likelihood of errors and inconsistencies that can arise from manual configuration. By using IaC, teams can also easily replicate infrastructure across different environments, such as development, staging, and production, and ensure that their infrastructure configuration is consistent and reproducible.', 3);

  -- Level 3: Responsiveness
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_resilient_architecture_id, 'Responsiveness',
    'Load balancing, edge computing, and auto-scaling are critical mechanisms to ensure responsiveness, improve performance, and effectively handle fluctuating workloads.', 3)
  RETURNING id INTO v_responsiveness_id;

  -- Level 4: Responsiveness Mechanisms
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_responsiveness_id, 'Load Balancing',
      'It distributes network traffic across multiple servers or services to improve performance and provide high availability. In the cloud, load balancers are intermediaries (proxies) between users and back-end resources like virtual machines or containers. They distribute incoming requests to different resources using sophisticated algorithms and handle server capacity, response time, and workload.', 4),
    (v_subject_id, v_responsiveness_id, 'Edge Computing',
      'It optimizes the geographic location of resources and services to enable faster processing and reduced latency. Instead of routing all data to a centralized cloud datacenter, edge computing utilizes distributed computing resources to minimize the distance data needs to travel, reducing network latency and improving responsiveness. Edge computing is particularly beneficial for applications that require real-time or low-latency processing, such as IoT devices, content delivery networks (CDNs), and latency-sensitive applications.', 4),
    (v_subject_id, v_responsiveness_id, 'Auto-Scaling',
      'It is an automated process that adjusts the computing resources allocated to an application based on demand. Auto-scaling allows cloud infrastructure to dynamically scale resources up or down to match the real-time workload requirements. For example, during periods of high demand, additional resources are provisioned automatically to handle the increased load, ensuring optimal performance and responsiveness. In contrast, when demand decreases, unnecessary resources are released back into a shared pool to reduce operating costs or to make them available to other workloads.', 4);

  -- Level 3: High Availability Service Levels
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_resilient_architecture_id, 'High Availability Service Levels',
    'Different tiers of data replication strategies that provide varying levels of availability and disaster recovery protection.', 3)
  RETURNING id INTO v_ha_service_levels_id;

  -- Level 4: Specific Service Levels
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_ha_service_levels_id, 'Local Replication',
      'It replicates your data within a single datacenter in the region where you created your storage account. The replicas are often in separate fault domains and upgrade domains.', 4),
    (v_subject_id, v_ha_service_levels_id, 'Regional Replication (Zone-redundant Storage)',
      'It replicates your data across multiple datacenters within one or two regions. This safeguards data and access in the event a single datacenter is destroyed or goes offline.', 4),
    (v_subject_id, v_ha_service_levels_id, 'Geo-redundant Storage (GRS)',
      'It replicates your data to a secondary region that is distant from the primary region. This safeguards data in the event of a regional outage or a disaster.', 4);

  -- Level 3: Software-defined Networking (SDN)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_resilient_architecture_id, 'Software-defined Networking (SDN)',
    'APIs and compatible hardware/virtual appliances allowing for programmable network appliances and systems. A software-defined networking (SDN) application can be used to define policy decisions on the control plane. These decisions are then implemented on the data plane by a network controller application, which interfaces with the network devices using APIs. The interface between the SDN applications and the SDN controller is described as the "northbound" API, while that between the controller and appliances is the "southbound" API. SDN can be used to manage compatible physical appliances, but also virtual switches, routers, and firewalls. The architecture supporting the rapid deployment of virtual networking using general-purpose VMs and containers is called network functions virtualization (NFV) (redhat.com/en/topics/virtualization/what-is-nfv). This architecture saves network and security administrators the job and complexity of configuring appliance settings properly to enforce a desired policy. It also allows for fully automated deployment (or provisioning) of network links, appliances, and servers. This makes SDN an important part of the latest automation and orchestration technologies.', 3)
  RETURNING id INTO v_sdn_id;

  -- Level 4: SDN Planes
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_sdn_id, 'Management Plane',
      'Monitors traffic conditions and network status.', 4),
    (v_subject_id, v_sdn_id, 'Control Plane',
      'Makes decisions about how traffic should be prioritized, secured, and where it should be switched.', 4),
    (v_subject_id, v_sdn_id, 'Data Plane',
      'Handles the switching and routing of traffic and imposition of security access controls.', 4);

  -- Level 3: Network Functions Virtualization (NFV)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_resilient_architecture_id, 'Network Functions Virtualization (NFV)',
      'Provisioning virtual network appliances, such as switches, routers, and firewalls, via VMs and containers.', 3);

END $$;
