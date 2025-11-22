-- Add detailed Control Plane and Data Plane components to Zero Trust Architecture

DO $$
DECLARE
  v_subject_id UUID;
  v_control_plane_id UUID;
  v_data_plane_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Get Control Plane ID
  SELECT id INTO v_control_plane_id FROM topics
  WHERE name = 'Control Plane' AND subject_id = v_subject_id;

  -- Get Data Plane ID
  SELECT id INTO v_data_plane_id FROM topics
  WHERE name = 'Data Plane' AND subject_id = v_subject_id;

  -- Level 4: Control Plane components
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_control_plane_id, 'Policy Engine',
      'The policy engine is configured with inputs to enable it to make dynamic and continuous authentication and authorization decisions.', 4),
    (v_subject_id, v_control_plane_id, 'Policy Administrator',
      'The policy administrator implements an interface for communicating decisions to data plane systems.', 4);

  -- Level 4: Data Plane components
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_data_plane_id, 'Subject Credentials',
      'Subjects (users of other services) possess credentials to access resources.', 4),
    (v_subject_id, v_data_plane_id, 'Client Systems',
      'Subjects must use client systems to make requests but these are not implicitly trusted.', 4),
    (v_subject_id, v_data_plane_id, 'Policy Enforcement Point',
      'The policy enforcement point system is the only one trusted to communicate requests and receive decisions from the policy administrator.', 4),
    (v_subject_id, v_data_plane_id, 'Session Management',
      'The policy enforcement point implements encrypted session set up and tear down as directed by the policy administrator.', 4),
    (v_subject_id, v_data_plane_id, 'Implicit Trust Zone',
      'This architecture creates a limited scope and duration implicit trust zone for resource access.', 4);

END $$;
