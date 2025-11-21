-- Migration: Add Computing Architecture topics
-- Adds Centralized and Decentralized Computing Architecture topics

DO $$
DECLARE
  v_subject_id UUID;
  v_centralized_architecture_id UUID;
  v_decentralized_architecture_id UUID;
BEGIN
  -- Get the Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity' LIMIT 1;

  -- Level 1: Centralized Computing Architecture
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, NULL, 'Centralized Computing Architecture',
    'A model where all data processing and storage is performed in a single location. It refers to a model where all data processing and storage is performed in a single location, typically a central server. All users and devices rely on the central server to access and process data and depend upon the server administrator and controlling organization''s trustworthiness regarding security and privacy decisions. Examples of centralized computing architecture include mainframe computers and client-server architectures.', 1)
  RETURNING id INTO v_centralized_architecture_id;

  -- Level 1: Decentralized Computing Architecture
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, NULL, 'Decentralized Computing Architecture',
    'A model in which data processing and storage are distributed across multiple locations or devices. It is a model in which data processing and storage are distributed across multiple locations or devices. No single device or location is responsible for all data processing and storage. Decentralized computing architectures are an increasingly important design trend impacting modern infrastructures.', 1)
  RETURNING id INTO v_decentralized_architecture_id;

  -- Level 2: Decentralized Computing Technologies
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_decentralized_architecture_id, 'Blockchain',
      'It is a distributed ledger technology that allows for secure, transparent, and decentralized transactions.', 2),
    (v_subject_id, v_decentralized_architecture_id, 'Peer-to-Peer (P2P) Networks',
      'They are networks designed to distribute processing and data storage among participating nodes instead of relying on a central server.', 2),
    (v_subject_id, v_decentralized_architecture_id, 'Content Delivery Networks (CDNs)',
      'They distribute content across multiple servers to improve performance, reliability, and scalability.', 2),
    (v_subject_id, v_decentralized_architecture_id, 'Internet of Things (IoT)',
      'These devices can be connected in a decentralized network to share data and processing power.', 2),
    (v_subject_id, v_decentralized_architecture_id, 'Distributed Databases',
      'They distribute data across multiple servers, ensuring that data is always available, even if one server goes down.', 2),
    (v_subject_id, v_decentralized_architecture_id, 'Tor (The Onion Router)',
      'It is a network that enables anonymous communication and browsing. Tor routes traffic through a network of volunteer-operated servers, or nodes, to hide a user''s location and internet activity.', 2);

END $$;
