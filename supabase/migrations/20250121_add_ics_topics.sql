-- Add Industrial Control Systems (ICS) topics to Cybersecurity subject

DO $$
DECLARE
  v_subject_id UUID;
  v_ics_id UUID;
  v_ics_apps_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Level 1: Industrial control systems (ICS)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, NULL, 'Industrial control systems (ICS)',
    'Network managing embedded devices (computer systems that are designed to perform a specific, dedicated function). Industrial control systems (ICSs) provide mechanisms for workflow and process automation. These systems control machinery used in critical infrastructure, like power suppliers, water suppliers, health services, telecommunications, and national security services. An ICS that manages process automation within a single site is usually referred to as a distributed control system (DCS). An ICS comprises plant devices and equipment with embedded programmable logic controllers (PLCs). The PLCs are linked either by an operational technology (OT) fieldbus serial network or by industrial Ethernet to actuators that operate valves, motors, circuit breakers, and other mechanical components, plus sensors that monitor some local state, such as temperature. Output and configuration of a PLC are performed by one or more human-machine interfaces (HMIs). An HMI might be a local control panel or software running on a computing host. PLCs are connected within a control loop, and the whole process automation system can be governed by a control server. Another important concept is the data historian or a database of all the information the control loop generated.', 1)
  RETURNING id INTO v_ics_id;

  -- Level 2: Core ICS components and related topics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_ics_id, 'Operational Technology (OT)',
      'A communications network designed to implement an industrial control system rather than data networking.', 2),
    (v_subject_id, v_ics_id, 'Human-machine Interfaces (HMIs)',
      'Input and output controls on a PLC to allow a user to configure and monitor the system.', 2),
    (v_subject_id, v_ics_id, 'Supervisory Control and Data Acquisition (SCADA)',
      'A type of industrial control system that manages large-scale, multiple-site devices and equipment spread over geographically large areas from a host computer. A supervisory control and data acquisition (SCADA) system takes the place of a control server in large-scale, multiple-site ICSs. SCADA typically run as software on ordinary computers, gathering data from and managing plant devices and equipment with embedded PLCs, referred to as field devices. SCADA typically use WAN communications, such as cellular or satellite, to link the SCADA server to field devices.', 2);

  -- Level 2: ICS/SCADA Applications (parent for Level 3 applications)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_ics_id, 'ICS/SCADA Applications',
    'Industrial control systems and SCADA are used across various critical sectors including energy, industrial operations, manufacturing, logistics, and facility management.', 2)
  RETURNING id INTO v_ics_apps_id;

  -- Level 3: Specific ICS/SCADA Application areas
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_ics_apps_id, 'Energy',
      'It refers to power generation and distribution. More widely, utilities include water/sewage and transportation networks.', 3),
    (v_subject_id, v_ics_apps_id, 'Industrial',
      'It can refer specifically to mining and refining raw materials, involving hazardous high heat and pressure furnaces, presses, centrifuges, pumps, and so on.', 3),
    (v_subject_id, v_ics_apps_id, 'Fabrication and Manufacturing',
      'It can refer to creating components and assembling them into products. Embedded systems are used to control automated production systems, such as forges, mills, and assembly lines. These systems must work to extremely high precision.', 3),
    (v_subject_id, v_ics_apps_id, 'Logistics',
      'It refers to moving things from where they were made or assembled to where they need to be, either within a factory or for distribution to customers. Embedded technology is used in control of automated transport and lift systems plus sensors for component tracking.', 3),
    (v_subject_id, v_ics_apps_id, 'Facilities',
      'It can refer to site and building management systems, typically operating automated heating, ventilation, and air conditioning (HVAC), lighting, and security systems.', 3);

END $$;
