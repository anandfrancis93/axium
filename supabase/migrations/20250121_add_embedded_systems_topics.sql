-- Add Embedded Systems and RTOS topics to Cybersecurity subject

DO $$
DECLARE
  v_subject_id UUID;
  v_embedded_systems_id UUID;
  v_rtos_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Level 1: Embedded Systems
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, NULL, 'Embedded Systems',
    'An electronic system that is designed to perform a specific, dedicated function, such as a microcontroller in a medical drip or components in a control system managing a water treatment plant. Embedded systems are used in various specialized applications, including consumer electronics, industrial automation, automotive systems, medical devices, and more.', 1)
  RETURNING id INTO v_embedded_systems_id;

  -- Level 2: Embedded Systems subcategories
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_embedded_systems_id, 'Home appliances',
      'Such as refrigerators, washing machines, and coffee makers, contain embedded systems that control their functions and operations.', 2),
    (v_subject_id, v_embedded_systems_id, 'Smartphones and tablets',
      'Contain a variety of embedded systems, including processors, sensors, and communication modules.', 2),
    (v_subject_id, v_embedded_systems_id, 'Automotive systems',
      'Like modern cars contain embedded systems including engine control units, entertainment systems, and safety systems like airbags and anti-lock brakes.', 2),
    (v_subject_id, v_embedded_systems_id, 'Industrial automation',
      'Embedded systems exist in control systems and machinery, such as robots, assembly lines, and sensors.', 2),
    (v_subject_id, v_embedded_systems_id, 'Medical devices',
      'Such as pacemakers, insulin pumps, and blood glucose monitors, contain embedded systems that control their functions and provide data to healthcare providers.', 2),
    (v_subject_id, v_embedded_systems_id, 'Aerospace and defense',
      'Like aircraft, satellites, and military equipment use embedded systems for navigation, communication, and control.', 2);

  -- Level 1: Real-Time Operating Systems (RTOS)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, NULL, 'Real-Time Operating Systems (RTOS)',
    'A type of OS that prioritizes deterministic execution of operations to ensure consistent response for time-critical tasks. A Real-Time Operating Systems (RTOS) is a type of operating system designed for use in applications that require real-time processing and response. They are purpose-specific operating systems designed for high levels of stability and processing speed.', 1)
  RETURNING id INTO v_rtos_id;

  -- Level 2: RTOS subcategories
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_rtos_id, 'Examples of RTOS',
      'The VxWorks operating system is commonly used in aerospace and defense systems. VxWorks provides real-time performance and reliability and is therefore well suited for use in aircraft control systems, missile guidance systems, and other critical defense systems. Another example of an RTOS is FreeRTOS, an open-source operating system used in many embedded systems, such as robotics, industrial automation, and consumer electronics. In the automotive industry, RTOS is used in engine control, transmission control, and active safety systems applications. For example, the AUTOSAR (Automotive Open System Architecture) standard defines a framework for developing automotive software, including using RTOS for certain applications. In medical devices, RTOS is used for applications such as patient monitoring systems, medical imaging, and automated drug delivery systems. In industrial control systems, RTOS is used for process control and factory automation applications. For example, the Siemens SIMATIC WinCC Open Architecture system uses an RTOS to provide real-time performance and reliability for industrial automation applications.', 2),
    (v_subject_id, v_rtos_id, 'Risks Associated with RTOS',
      'A security breach involving RTOS can have serious consequences. RTOS software can be complex and difficult to secure, which makes it challenging to identify and address vulnerabilities that could be exploited by attackers. Another security risk associated with RTOS is the potential for system-level attacks. An attacker who gains access to an RTOS-based system could potentially disrupt critical processes or gain control over the system it is designed to control. This can lead to serious consequences considering the types of applications that rely on RTOS, such as medical devices and industrial control systems. A security breach could result in harm to people or damage to equipment.', 2);

END $$;
