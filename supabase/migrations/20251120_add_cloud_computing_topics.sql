-- Migration: Add Cloud Computing topics
-- Adds 2 new topics to the Cybersecurity subject

DO $$
DECLARE
  v_subject_id UUID;
  v_cloud_computing_id UUID;
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

END $$;
