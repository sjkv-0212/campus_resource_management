export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Smart Campus Resource Network API',
    version: '1.0.0',
    description: 'Role-Based Access Control API for authentication, dashboard data, resources, bookings, notifications, users, and reports.'
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local development server' }],
  tags: [
    { name: 'Auth' },
    { name: 'Dashboard' },
    { name: 'Resources' },
    { name: 'Bookings' },
    { name: 'Notifications' },
    { name: 'Users' },
    { name: 'Reports' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      AccountInput: {
        type: 'object', required: ['email', 'password', 'fullName', 'roleId', 'phone', 'department'],
        properties: {
          email: { type: 'string', format: 'email', example: 'name@ritrjpm.ac.in' },
          password: { type: 'string', format: 'password', minLength: 6 },
          fullName: { type: 'string', example: 'Dr. Priya Sharma' },
          roleId: { type: 'string', enum: ['admin', 'faculty', 'student', 'lab_incharge', 'support_staff'] },
          phone: { type: 'string', pattern: '^\\d{10}$', example: '9876543210' },
          department: { type: 'string', example: 'Computer Science & Engineering' }
        }
      },
      Resource: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' }, location: { type: 'string' }, capacity: { type: 'integer' }, status: { type: 'string' }, equipment: { type: 'array', items: { type: 'string' } }, inCharge: { type: 'string' }, image: { type: 'string' } } },
      Booking: { type: 'object', properties: { id: { type: 'string' }, resourceName: { type: 'string' }, category: { type: 'string' }, room: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, bookedBy: { type: 'string' }, userRole: { type: 'string' }, purpose: { type: 'string' }, status: { type: 'string' }, attendees: { type: 'integer' } } },
      Notification: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, message: { type: 'string' }, time: { type: 'string' }, type: { type: 'string' }, read: { type: 'boolean' }, icon: { type: 'string' } } }
    }
  },
  paths: {
    '/api/auth/register': { post: { tags: ['Auth'], summary: 'Submit a campus account for administrator approval', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountInput' } } } }, responses: { 202: { description: 'Registration submitted and pending approval; no JWT is issued' }, 400: { description: 'Validation error' } } } },
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Log in with a campus account', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } } } } }, responses: { 200: { description: 'JWT and public user profile' }, 401: { description: 'Invalid credentials' } } } },
    '/api/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Send 6-digit password reset OTP to campus email', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email', example: 'name@ritrjpm.ac.in' } } } } } }, responses: { 200: { description: 'Verification code sent to email' }, 400: { description: 'Invalid email' }, 404: { description: 'Account not found' } } } },
    '/api/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset password using the 6-digit OTP code received via email', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'otp', 'newPassword'], properties: { email: { type: 'string', format: 'email' }, otp: { type: 'string', example: '123456' }, newPassword: { type: 'string', format: 'password', minLength: 6 } } } } } }, responses: { 200: { description: 'Password reset successfully' }, 400: { description: 'Invalid or expired OTP' } } } },
    '/api/dashboard': { get: { tags: ['Dashboard'], security: [{ bearerAuth: [] }], summary: 'Get role-scoped dashboard data and summary counts', responses: { 200: { description: 'Role-scoped dashboard payload' } } } },
    '/api/resources': { get: { tags: ['Resources'], security: [{ bearerAuth: [] }], summary: 'List all resources', responses: { 200: { description: 'Resource list' } } }, post: { tags: ['Resources'], security: [{ bearerAuth: [] }], summary: 'Add a resource (Administrator only)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } } }, responses: { 201: { description: 'Resource created' }, 403: { description: 'Admin only' } } } },
    '/api/resources/{id}': {
      patch: { tags: ['Resources'], security: [{ bearerAuth: [] }], summary: 'Update resource availability/details (Lab In-Charge for Labs, Support Staff for general spaces, Admin for all)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } } }, responses: { 200: { description: 'Resource updated' }, 403: { description: 'Permission denied' }, 404: { description: 'Resource not found' } } },
      delete: { tags: ['Resources'], security: [{ bearerAuth: [] }], summary: 'Delete a resource (Administrator only)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Resource deleted' }, 403: { description: 'Admin only' }, 404: { description: 'Resource not found' } } }
    },
    '/api/bookings': { get: { tags: ['Bookings'], security: [{ bearerAuth: [] }], summary: 'List bookings filtered by caller role (Student/Faculty see own, Lab In-Charge sees labs, Support Staff sees facilities, Admin sees all)', responses: { 200: { description: 'Role-filtered booking list' } } }, post: { tags: ['Bookings'], security: [{ bearerAuth: [] }], summary: 'Create a booking/reservation request (Students and Faculty only)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, responses: { 201: { description: 'Booking created' }, 403: { description: 'Permission denied (Only students & faculty can book)' }, 409: { description: 'Booking conflict' } } } },
    '/api/bookings/{id}': { patch: { tags: ['Bookings'], security: [{ bearerAuth: [] }], summary: 'Update booking status (Administrator approves/rejects; Students & Faculty cancel own)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, responses: { 200: { description: 'Booking updated' }, 403: { description: 'Permission denied' }, 404: { description: 'Booking not found' } } }, delete: { tags: ['Bookings'], security: [{ bearerAuth: [] }], summary: 'Cancel/Delete a booking (Admin, or booking owner)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Booking deleted' } } } },
    '/api/notifications': { get: { tags: ['Notifications'], security: [{ bearerAuth: [] }], summary: 'List role-targeted notifications', responses: { 200: { description: 'Notification list' } } }, patch: { tags: ['Notifications'], security: [{ bearerAuth: [] }], summary: 'Mark role notifications as read', responses: { 200: { description: 'Updated notification list' } } } },
    '/api/users': { get: { tags: ['Users'], security: [{ bearerAuth: [] }], summary: 'List registered users and approval statuses (Administrator only)', responses: { 200: { description: 'User list' }, 403: { description: 'Admin only' } } } },
    '/api/users/{id}/approval': { patch: { tags: ['Users'], security: [{ bearerAuth: [] }], summary: 'Approve or reject a pending account (Administrator only)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['approvalStatus'], properties: { approvalStatus: { type: 'string', enum: ['approved', 'rejected'] } } } } } }, responses: { 200: { description: 'Account approval status updated' }, 400: { description: 'Invalid approval status' }, 403: { description: 'Admin only' }, 404: { description: 'User not found' } } } },
    '/api/reports/summary': { get: { tags: ['Reports'], security: [{ bearerAuth: [] }], summary: 'Get report summary', responses: { 200: { description: 'Usage summary' } } } }
  }
};
