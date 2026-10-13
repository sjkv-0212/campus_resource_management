export const ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    title: 'System Administrator',
    avatar: '👨‍💼',
    badge: 'System Superuser',
    color: '#4f46e5',
    bgGradient: 'from-indigo-600 to-blue-500',
    description: 'Full system oversight & management',
    permissions: [
      'Manage users & roles',
      'Manage all resources',
      'Approve/Reject bookings',
      'View reports & analytics',
      'System audit logs & security'
    ],
    user: {
      name: 'Prof. Rajesh Kumar',
      email: 'admin.rajesh@smartcampus.edu',
      department: 'Dean of Academic Infrastructure',
      phone: '9876543211',
      id: 'ADM-9021',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'faculty',
    name: 'Faculty',
    title: 'Professor / Lecturer',
    avatar: '👩‍🏫',
    badge: 'Teaching Faculty',
    color: '#0ea5e9',
    bgGradient: 'from-cyan-500 to-blue-600',
    description: 'Academic booking & lecture allocation',
    permissions: [
      'Request & book resources',
      'View own bookings',
      'Cancel/Reschedule bookings',
      'View notifications',
      'Generate department reports'
    ],
    user: {
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@smartcampus.edu',
      department: 'Computer Science & Engineering',
      phone: '9876543210',
      id: 'FAC-4082',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'student',
    name: 'Student',
    title: 'Undergraduate / Graduate',
    avatar: '👩‍🎓',
    badge: 'Student Council',
    color: '#8b5cf6',
    bgGradient: 'from-purple-500 to-indigo-600',
    description: 'Study spaces, lab access & clubs',
    permissions: [
      'Request & book student resources',
      'View own bookings',
      'Cancel bookings',
      'View notifications',
      'Check live availability'
    ],
    user: {
      name: 'Ananya Verma',
      email: 'ananya.v21@student.smartcampus.edu',
      department: 'Information Technology (Year 3)',
      phone: '9876543212',
      id: 'STU-1829',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'lab_incharge',
    name: 'Lab In Charge',
    title: 'Technical Supervisor',
    avatar: '👨‍🔬',
    badge: 'Lab Supervisor',
    color: '#10b981',
    bgGradient: 'from-emerald-500 to-teal-600',
    description: 'Hardware, software & lab scheduling',
    permissions: [
      'Manage lab resources',
      'Approve/Reject lab bookings',
      'Manage lab schedules',
      'View lab utilization',
      'Handle maintenance requests'
    ],
    user: {
      name: 'Er. Sandeep Nair',
      email: 'sandeep.nair@smartcampus.edu',
      department: 'Advanced Computing Labs',
      phone: '9876543213',
      id: 'LAB-5510',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'support_staff',
    name: 'Support Staff',
    title: 'Facility & Inventory Staff',
    avatar: '👨‍🔧',
    badge: 'Campus Operations',
    color: '#f59e0b',
    bgGradient: 'from-amber-500 to-orange-600',
    description: 'Logistics, maintenance & audits',
    permissions: [
      'Manage resource inventory',
      'Update resource status',
      'Handle maintenance tickets',
      'View booking schedule',
      'Generate usage logs'
    ],
    user: {
      name: 'Vikram Singh',
      email: 'vikram.staff@smartcampus.edu',
      department: 'Estate & Facilities Support',
      phone: '9876543214',
      id: 'STF-3012',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  }
];

export const KEY_FEATURES = [
  {
    id: 'role-based',
    title: 'Role Based Access',
    desc: 'Fine-grained permissions for Admins, Faculty, Students & Staff.',
    icon: 'Users',
    color: '#4f46e5'
  },
  {
    id: 'resource-mgmt',
    title: 'Resource Management',
    desc: 'Centralized catalog of labs, halls, classrooms and equipment.',
    icon: 'Layers',
    color: '#0284c7'
  },
  {
    id: 'booking-sched',
    title: 'Booking & Scheduling',
    desc: 'Intuitive multi-step reservation system with instant confirmation.',
    icon: 'CalendarDays',
    color: '#2563eb'
  },
  {
    id: 'conflict-detect',
    title: 'Conflict Detection',
    desc: 'Real-time double-booking prevention and alternative suggestions.',
    icon: 'AlertTriangle',
    color: '#eab308'
  },
  {
    id: 'notifications',
    title: 'Notifications (Email & In-App)',
    desc: 'Instant alerts on approval, rejection, and upcoming booking reminders.',
    icon: 'BellRing',
    color: '#3b82f6'
  },
  {
    id: 'reports-dash',
    title: 'Reports & Dashboard',
    desc: 'Visual analytics, utilization trends and exportable campus audit logs.',
    icon: 'BarChart3',
    color: '#6366f1'
  },
  {
    id: 'realtime-avail',
    title: 'Real-time Availability',
    desc: 'Live status indicators for instant space occupancy tracking.',
    icon: 'Clock',
    color: '#10b981'
  },
  {
    id: 'secure-scale',
    title: 'Secure & Scalable',
    desc: 'Enterprise-grade encryption, JWT session management and audit trails.',
    icon: 'ShieldCheck',
    color: '#8b5cf6'
  }
];

export const INITIAL_RESOURCES = [
  {
    id: 'res-1',
    name: 'Data Structures Lab',
    category: 'Laboratory',
    location: 'Main Block - Floor 2 (Lab 201)',
    capacity: 65,
    status: 'Available',
    equipment: ['65 i7 Workstations', 'Dual Projectors', 'Gigabit LAN', 'Smart Board'],
    inCharge: 'Er. Sandeep Nair',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'res-2',
    name: 'Seminar Hall A',
    category: 'Seminar Hall',
    location: 'Main Block - Ground Floor',
    capacity: 250,
    status: 'Available',
    equipment: ['Surround Sound PA', '4K Laser Projector', 'Stage Lighting', 'Podium Mic'],
    inCharge: 'Prof. Rajesh Kumar',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'res-3',
    name: 'Projector - 1 (Epson 4K)',
    category: 'Equipment',
    location: 'AV Store Room - 101',
    capacity: 1,
    status: 'Available',
    equipment: ['HDMI & Wireless Dongle', 'Tripod Stand', 'Remote Laser Pointer'],
    inCharge: 'Vikram Singh',
    image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'res-4',
    name: 'Classroom - 301',
    category: 'Classroom',
    location: 'Block - C (Floor 3)',
    capacity: 80,
    status: 'Booked',
    equipment: ['Wall Mounted Projector', 'Acoustic Panels', 'Audio Amp'],
    inCharge: 'Dr. Priya Sharma',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'res-5',
    name: 'Chemistry Lab',
    category: 'Laboratory',
    location: 'Science Block - Floor 1',
    capacity: 45,
    status: 'Maintenance',
    equipment: ['Fume Hoods', 'Centrifuge', 'Spectrophotometer', 'Safety Showers'],
    inCharge: 'Dr. R. Venkataraman',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'res-6',
    name: 'AI & Robotics Center',
    category: 'Laboratory',
    location: 'CS Block - Floor 4 (Lab 402)',
    capacity: 50,
    status: 'Available',
    equipment: ['12 NVIDIA RTX 4090 Rigs', 'TurtleBot 4', 'VR Headsets', 'High-speed Fiber'],
    inCharge: 'Dr. Priya Sharma',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'res-7',
    name: 'Auditorium Magna',
    category: 'Auditorium',
    location: 'Central Block (Grand Wing)',
    capacity: 1200,
    status: 'Booked',
    equipment: ['Line Array Sound System', 'Motorized Screen', 'Green Rooms', 'Live Broadcast Station'],
    inCharge: 'Prof. Rajesh Kumar',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'res-8',
    name: 'Physics Optics Lab',
    category: 'Laboratory',
    location: 'Science Block - Floor 2',
    capacity: 40,
    status: 'Available',
    equipment: ['Laser Interferometer', 'Spectrometer', 'Dark Room Enclosures'],
    inCharge: 'Dr. Anita Joshi',
    image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=500&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'BK-1049',
    resourceName: 'Data Structures Lab',
    category: 'Laboratory',
    room: 'Lab - 201',
    date: '14 May 2025',
    time: '10:00 AM - 12:00 PM',
    bookedBy: 'Dr. Priya Sharma',
    userRole: 'Faculty',
    purpose: 'CS201 Practical Lab Exam & Evaluation',
    status: 'Confirmed',
    attendees: 58
  },
  {
    id: 'BK-1050',
    resourceName: 'Seminar Hall A',
    category: 'Seminar Hall',
    room: 'Main Block',
    date: '15 May 2025',
    time: '02:00 PM - 04:00 PM',
    bookedBy: 'Dr. Priya Sharma',
    userRole: 'Faculty',
    purpose: 'Guest Lecture on Generative AI & LLMs',
    status: 'Confirmed',
    attendees: 180
  },
  {
    id: 'BK-1051',
    resourceName: 'Projector - 3 (Portable HD)',
    category: 'Equipment',
    room: 'Admin Block - Meeting Room 2',
    date: '16 May 2025',
    time: '09:00 AM - 11:00 AM',
    bookedBy: 'Dr. Priya Sharma',
    userRole: 'Faculty',
    purpose: 'Curriculum Review Committee Meeting',
    status: 'Pending',
    attendees: 14
  },
  {
    id: 'BK-1052',
    resourceName: 'Classroom - 301',
    category: 'Classroom',
    room: 'Block - C',
    date: '18 May 2025',
    time: '11:00 AM - 01:00 PM',
    bookedBy: 'Prof. Arvind Menon',
    userRole: 'Faculty',
    purpose: 'Algorithms Tutorial & Problem Solving',
    status: 'Confirmed',
    attendees: 70
  },
  {
    id: 'BK-1053',
    resourceName: 'AI & Robotics Center',
    category: 'Laboratory',
    room: 'CS Block - Floor 4',
    date: '19 May 2025',
    time: '03:00 PM - 05:00 PM',
    bookedBy: 'Ananya Verma',
    userRole: 'Student',
    purpose: 'Robotics Club Hackathon Sprint',
    status: 'Pending',
    attendees: 25
  },
  {
    id: 'BK-1054',
    resourceName: 'Chemistry Lab',
    category: 'Laboratory',
    room: 'Science Block',
    date: '16 May 2025',
    time: '09:00 AM - 05:00 PM',
    bookedBy: 'Vikram Singh',
    userRole: 'Support Staff',
    purpose: 'Annual Ventilation & Safety Maintenance',
    status: 'Maintenance',
    attendees: 4
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Booking Confirmed',
    message: 'Your booking for Seminar Hall A on 15 May has been confirmed.',
    time: '2m ago',
    type: 'success',
    read: false,
    icon: 'CheckCircle2'
  },
  {
    id: 'notif-2',
    title: 'Pending Approval',
    message: 'Your booking request for Projector - 3 on 16 May is pending Admin approval.',
    time: '15m ago',
    type: 'warning',
    read: false,
    icon: 'Clock'
  },
  {
    id: 'notif-3',
    title: 'Upcoming Reminder',
    message: 'Reminder: You have a booking for Data Structures Lab tomorrow at 10:00 AM.',
    time: '1h ago',
    type: 'info',
    read: false,
    icon: 'BellRing'
  },
  {
    id: 'notif-4',
    title: 'Maintenance Alert',
    message: 'Maintenance scheduled for Chemistry Lab on 16 May. Rescheduling advised.',
    time: '3h ago',
    type: 'maintenance',
    read: true,
    icon: 'AlertTriangle'
  },
  {
    id: 'notif-5',
    title: 'New Resource Added',
    message: 'AI & Robotics Center (Lab 402) is now available for reservation.',
    time: '1d ago',
    type: 'info',
    read: true,
    icon: 'Layers'
  }
];

export const TIMETABLE_DAYS = [
  { day: 'Sun', date: '11', full: 'Sun 11' },
  { day: 'Mon', date: '12', full: 'Mon 12' },
  { day: 'Tue', date: '13', full: 'Tue 13' },
  { day: 'Wed', date: '14', full: 'Wed 14' },
  { day: 'Thu', date: '15', full: 'Thu 15' },
  { day: 'Fri', date: '16', full: 'Fri 16' },
  { day: 'Sat', date: '17', full: 'Sat 17' },
];

export const TIMETABLE_RESOURCES = [
  'Classroom - 101',
  'Classroom - 102',
  'Lab - 201',
  'Lab - 202',
  'Seminar Hall A',
  'Seminar Hall B',
  'Chemistry Lab',
  'Auditorium Magna'
];

export const TIMETABLE_EVENTS = [
  {
    resource: 'Classroom - 101',
    dayIndex: 1, // Mon 12
    title: 'DSA Class',
    time: '9:00 - 11:00 AM',
    faculty: 'Dr. Priya Sharma',
    status: 'Confirmed',
    color: '#10b981'
  },
  {
    resource: 'Classroom - 102',
    dayIndex: 3, // Wed 14
    title: 'AI Lab',
    time: '9:00 - 11:00 AM',
    faculty: 'Prof. Arvind Menon',
    status: 'Pending',
    color: '#f59e0b'
  },
  {
    resource: 'Lab - 201',
    dayIndex: 2, // Tue 13
    title: 'DBMS Class',
    time: '10:00 - 12:00 PM',
    faculty: 'Dr. K. Swaminathan',
    status: 'Approved',
    color: '#3b82f6'
  },
  {
    resource: 'Lab - 202',
    dayIndex: 4, // Thu 15
    title: 'Web Dev Lab',
    time: '1:00 - 3:00 PM',
    faculty: 'Dr. Priya Sharma',
    status: 'Approved',
    color: '#3b82f6'
  },
  {
    resource: 'Seminar Hall A',
    dayIndex: 5, // Fri 16
    title: 'Campus Seminar',
    time: '2:00 - 4:00 PM',
    faculty: 'Dean Academics',
    status: 'Confirmed',
    color: '#ef4444'
  },
  {
    resource: 'Seminar Hall B',
    dayIndex: 3, // Wed 14
    title: 'Career Placement Talk',
    time: '11:00 AM - 1:00 PM',
    faculty: 'Placement Cell',
    status: 'Approved',
    color: '#3b82f6'
  },
  {
    resource: 'Chemistry Lab',
    dayIndex: 5, // Fri 16
    title: 'Lab Maintenance',
    time: 'All Day',
    faculty: 'Vikram Singh (Staff)',
    status: 'Cancelled',
    color: '#6b7280'
  }
];

export const AVAILABILITY_STATS = [
  {
    category: 'Classrooms',
    available: 18,
    total: 25,
    percentage: 72,
    color: '#10b981'
  },
  {
    category: 'Laboratories',
    available: 8,
    total: 12,
    percentage: 66,
    color: '#3b82f6'
  },
  {
    category: 'Seminar Halls',
    available: 3,
    total: 5,
    percentage: 60,
    color: '#8b5cf6'
  },
  {
    category: 'Projectors & AV',
    available: 15,
    total: 20,
    percentage: 75,
    color: '#f59e0b'
  }
];

export const MONTHLY_BOOKING_TREND = [
  { date: 'May 1', count: 18 },
  { date: 'May 5', count: 28 },
  { date: 'May 10', count: 22 },
  { date: 'May 15', count: 46 },
  { date: 'May 20', count: 39 },
  { date: 'May 25', count: 62 },
  { date: 'May 31', count: 54 }
];

export const TOP_RESOURCES = [
  { rank: 1, name: 'Lab - 201 (DS Lab)', bookings: 45, util: '92%' },
  { rank: 2, name: 'Seminar Hall A', bookings: 38, util: '85%' },
  { rank: 3, name: 'Projector - 1 (Epson 4K)', bookings: 30, util: '78%' },
  { rank: 4, name: 'Classroom - 301', bookings: 26, util: '68%' },
  { rank: 5, name: 'AI & Robotics Center', bookings: 22, util: '64%' }
];
