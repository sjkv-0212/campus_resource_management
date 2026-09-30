import crypto from 'node:crypto';
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import {
  createAccount,
  createBooking,
  createResource,
  dashboardSummary,
  deleteBooking,
  deleteResource,
  findAccountByEmail,
  findAccountById,
  findBookingById,
  findResourceById,
  getBookings,
  getDashboard,
  getNotifications,
  getResources,
  hasBookingConflict,
  initializeDatabase,
  listAccounts,
  markNotificationsRead,
  publicAccount,
  roleForAccount,
  updateBooking,
  updateResource,
  createNotification
} from './db.js';
import { openapiDocument } from './openapi.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'smart-campus-development-secret';
const campusEmail = /^[^\s@]+@ritrjpm\.ac\.in$/i;
const validRoles = new Set(['admin', 'faculty', 'student', 'lab_incharge', 'support_staff']);

app.use(cors());
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

const sendError = (response, status, message) => response.status(status).json({ error: message });
const createToken = (account) => jwt.sign({ sub: account.id, roleId: account.roleId }, jwtSecret, { expiresIn: '8h' });

const authenticate = async (request, response, next) => {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return sendError(response, 401, 'Bearer token required.');
  try {
    request.auth = jwt.verify(token, jwtSecret);
    request.account = await findAccountById(request.auth.sub);
    if (!request.account) return sendError(response, 401, 'Account no longer exists.');
    return next();
  } catch {
    return sendError(response, 401, 'Invalid or expired token.');
  }
};

app.get('/api/health', (request, response) => response.json({ status: 'ok', service: 'smart-campus-api' }));

app.post('/api/auth/register', async (request, response) => {
  try {
    const { email, password, fullName, roleId, phone, department } = request.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!campusEmail.test(normalizedEmail)) return sendError(response, 400, 'Use an email in the format name@ritrjpm.ac.in.');
    if (!fullName?.trim() || !department?.trim()) return sendError(response, 400, 'Full name and department are required.');
    if (!/^\d{10}$/.test(String(phone || ''))) return sendError(response, 400, 'Phone number must contain exactly 10 digits.');
    if (!validRoles.has(roleId)) return sendError(response, 400, 'Invalid role.');
    if (typeof password !== 'string' || password.length < 6) return sendError(response, 400, 'Password must be at least 6 characters.');
    if (await findAccountByEmail(normalizedEmail)) return sendError(response, 409, 'An account with this email already exists.');

    const account = {
      id: `user-${crypto.randomUUID()}`,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      fullName: fullName.trim(),
      roleId,
      phone: String(phone),
      department: department.trim()
    };
    await createAccount(account);
    return response.status(201).json({ token: createToken(account), user: publicAccount(account), role: roleForAccount(account) });
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

app.post('/api/auth/login', async (request, response) => {
  try {
    const normalizedEmail = String(request.body?.email || '').trim().toLowerCase();
    const account = await findAccountByEmail(normalizedEmail);
    if (!account || !(await bcrypt.compare(String(request.body?.password || ''), account.passwordHash))) {
      return sendError(response, 401, 'Invalid email or password.');
    }
    const tokenAccount = { ...account, passwordHash: account.passwordHash };
    return response.json({ token: createToken(tokenAccount), user: publicAccount(tokenAccount), role: roleForAccount(tokenAccount) });
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

app.get('/api/auth/me', authenticate, (request, response) => {
  return response.json({
    user: publicAccount({ ...request.account, passwordHash: request.account.passwordHash }),
    role: roleForAccount({ ...request.account, roleId: request.account.roleId })
  });
});

// Role-Scoped Dashboard
app.get('/api/dashboard', authenticate, async (request, response) => {
  try {
    return response.json(await getDashboard(request.account));
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Resources Management
app.get('/api/resources', authenticate, async (request, response) => {
  try {
    return response.json(await getResources());
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Only Administrator can add new resources
app.post('/api/resources', authenticate, async (request, response) => {
  try {
    if (request.account.roleId !== 'admin') {
      return sendError(response, 403, 'Permission denied: Only administrators can add new resources to the catalog.');
    }
    const resource = { ...request.body, id: request.body?.id || `res-${crypto.randomUUID()}` };
    if (!resource.name || !resource.category || !resource.location) {
      return sendError(response, 400, 'Name, category, and location are required.');
    }
    await createResource(resource);
    return response.status(201).json(resource);
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Resource Availability Update: Lab In-Charge can update labs, Support Staff can update other spaces, Admin can update all
app.patch('/api/resources/:id', authenticate, async (request, response) => {
  try {
    const existing = await findResourceById(request.params.id);
    if (!existing) return sendError(response, 404, 'Resource not found.');

    const roleId = request.account.roleId;
    if (roleId === 'admin') {
      // Administrator has full authority
    } else if (roleId === 'lab_incharge') {
      const isLab = existing.category === 'Laboratory' || (existing.name && existing.name.toLowerCase().includes('lab'));
      if (!isLab) {
        return sendError(response, 403, 'Permission denied: Lab In-Charge can only update laboratory resource availability.');
      }
    } else if (roleId === 'support_staff') {
      const isGeneral = existing.category !== 'Laboratory';
      if (!isGeneral) {
        return sendError(response, 403, 'Permission denied: Support Staff can only update seminar halls and general campus facilities.');
      }
    } else {
      return sendError(response, 403, 'Permission denied: Students and Faculty cannot modify resource availability.');
    }

    const updated = await updateResource(request.params.id, request.body || {});
    return response.json(updated);
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Only Administrator can delete resources from the catalog
app.delete('/api/resources/:id', authenticate, async (request, response) => {
  try {
    if (request.account.roleId !== 'admin') {
      return sendError(response, 403, 'Permission denied: Only administrators can delete resources.');
    }
    if (!(await deleteResource(request.params.id))) {
      return sendError(response, 404, 'Resource not found.');
    }
    return response.status(204).end();
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Bookings: Role-based filtering
// - Students & Faculty see their own bookings
// - Lab In-Charge sees who booked their labs with time
// - Support Staff sees bookings for seminar halls & general spaces
// - Admin sees all bookings across the campus
app.get('/api/bookings', authenticate, async (request, response) => {
  try {
    const scope = {
      roleId: request.account.roleId,
      userId: request.account.id,
      userName: request.account.fullName,
      userEmail: request.account.email
    };
    return response.json(await getBookings(scope));
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Create booking (Only Students and Faculty can make reservations)
app.post('/api/bookings', authenticate, async (request, response) => {
  try {
    const callerRoleId = request.account.roleId;
    if (callerRoleId !== 'student' && callerRoleId !== 'faculty') {
      return sendError(
        response,
        403,
        'Permission denied: Only students and faculty can make bookings. Lab in-charges, support staff, and administrators cannot create reservations.'
      );
    }

    const role = roleForAccount({ ...request.account, roleId: callerRoleId });
    const booking = {
      ...request.body,
      id: request.body?.id || `BK-${Date.now()}`,
      bookedBy: request.body?.bookedBy || request.account.fullName,
      bookedById: request.account.id,
      bookedByEmail: request.account.email,
      userRole: request.body?.userRole || role.name,
      status: 'Pending'
    };

    if (!booking.resourceName || !booking.date || !booking.time) {
      return sendError(response, 400, 'Resource, date, and time are required.');
    }

    const allResources = await getResources();
    const matchedResource = allResources.find((r) => r.name.toLowerCase() === booking.resourceName.toLowerCase());
    if (!matchedResource) {
      return sendError(response, 400, 'Selected resource does not exist in the campus catalog.');
    }

    if (!booking.category) {
      booking.category = matchedResource.category;
      booking.room = booking.room || matchedResource.location;
    }

    if (await hasBookingConflict(booking)) {
      return sendError(response, 409, 'This resource is already booked for that date and time.');
    }

    await createBooking(booking);
    return response.status(201).json(booking);
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Booking Updates:
// - Admin: Exclusive authority to approve ('Confirmed'), reject, or reschedule bookings
// - Student & Faculty: Can only cancel ('Cancelled') their own bookings
// - Lab In-Charge & Support Staff: Cannot approve bookings
app.patch('/api/bookings/:id', authenticate, async (request, response) => {
  try {
    const existing = await findBookingById(request.params.id);
    if (!existing) return sendError(response, 404, 'Booking not found.');

    const roleId = request.account.roleId;
    const isOwner = (existing.bookedById && existing.bookedById === request.account.id) ||
                    (existing.bookedBy && existing.bookedBy.toLowerCase() === request.account.fullName.toLowerCase()) ||
                    (existing.bookedByEmail && existing.bookedByEmail.toLowerCase() === request.account.email.toLowerCase());

    if (roleId === 'admin') {
      // Administrator has exclusive authority to approve or reject
    } else if (roleId === 'student' || roleId === 'faculty') {
      if (!isOwner) {
        return sendError(response, 403, 'Permission denied: You can only modify your own bookings.');
      }
      if (request.body?.status && request.body.status !== 'Cancelled') {
        return sendError(response, 403, 'Permission denied: Students and faculty can only cancel their own bookings.');
      }
    } else {
      // Lab In-Charge and Support Staff cannot approve or reject bookings
      return sendError(response, 403, 'Permission denied: Only Administrators can approve or reject bookings.');
    }

    const changes = { ...(request.body || {}) };

    if (request.body?.status === 'Cancelled') {
      const cancellationReason = request.body?.cancellationReason || 'Administrative cancellation / scheduling conflict';
      const cancelledBy = request.account.roleId === 'admin'
        ? (request.account.fullName ? `${request.account.fullName} (Admin)` : 'Campus Administrator')
        : (request.account.fullName || 'User');

      changes.cancellationReason = cancellationReason;
      changes.cancelledBy = cancelledBy;
      changes.cancelledAt = new Date().toISOString();

      // Automatically dispatch an in-app notification to the person who booked
      const reasonText = cancellationReason ? ` Reason: "${cancellationReason}".` : '';
      await createNotification({
        title: `Reservation Cancelled: ${existing.resourceName}`,
        message: `Your reservation for ${existing.resourceName} on ${existing.date} (${existing.time}) was cancelled by ${cancelledBy}.${reasonText}`,
        type: 'danger',
        targetUserId: existing.bookedById || '',
        targetRole: (existing.userRole?.toLowerCase() === 'faculty' ? 'faculty' : 'student')
      });
    }

    const updated = await updateBooking(request.params.id, changes);

    // If booking was cancelled, automatically free the resource if no other active booking exists
    if (request.body?.status === 'Cancelled' && existing.resourceName) {
      const allActive = (await getBookings()).filter(
        (b) => b.resourceName.toLowerCase() === existing.resourceName.toLowerCase() &&
               b.id !== existing.id &&
               b.status !== 'Cancelled'
      );
      if (allActive.length === 0) {
        const allRes = await getResources();
        const matched = allRes.find((r) => r.name.toLowerCase() === existing.resourceName.toLowerCase());
        if (matched && matched.status === 'Booked') {
          await updateResource(matched.id, { status: 'Available' });
        }
      }
    }

    return response.json(updated);
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Booking Deletions:
// - Admin: Can delete any booking
// - Student & Faculty: Can delete their own bookings
// - Others: Denied
app.delete('/api/bookings/:id', authenticate, async (request, response) => {
  try {
    const existing = await findBookingById(request.params.id);
    if (!existing) return sendError(response, 404, 'Booking not found.');

    const roleId = request.account.roleId;
    const isOwner = (existing.bookedById && existing.bookedById === request.account.id) ||
                    (existing.bookedBy && existing.bookedBy.toLowerCase() === request.account.fullName.toLowerCase()) ||
                    (existing.bookedByEmail && existing.bookedByEmail.toLowerCase() === request.account.email.toLowerCase());

    if (roleId === 'admin') {
      // Allowed
    } else if (roleId === 'student' || roleId === 'faculty') {
      if (!isOwner) return sendError(response, 403, 'Permission denied: You can only delete your own bookings.');
    } else {
      return sendError(response, 403, 'Permission denied: Only administrators can delete booking records.');
    }

    await deleteBooking(request.params.id);
    return response.status(204).end();
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Notifications
app.get('/api/notifications', authenticate, async (request, response) => {
  try {
    const scope = {
      roleId: request.account.roleId,
      userId: request.account.id
    };
    return response.json(await getNotifications(scope));
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

app.patch('/api/notifications', authenticate, async (request, response) => {
  try {
    const scope = {
      roleId: request.account.roleId,
      userId: request.account.id
    };
    return response.json(await markNotificationsRead(scope));
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Only Administrator can view full user management
app.get('/api/users', authenticate, async (request, response) => {
  try {
    if (request.account.roleId !== 'admin') {
      return sendError(response, 403, 'Permission denied: Only administrators can view the user accounts list.');
    }
    const accounts = await listAccounts();
    return response.json(accounts.map((account) => publicAccount(account)));
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

// Reports Summary
app.get('/api/reports/summary', authenticate, async (request, response) => {
  try {
    const dashboardData = await getDashboard(request.account);
    return response.json(dashboardData.summary);
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

app.use((request, response) => sendError(response, 404, 'Route not found.'));

initializeDatabase()
  .then(() => app.listen(port, () => console.log(`Smart Campus API listening on http://localhost:${port}`)))
  .catch((error) => {
    console.error(`Unable to initialize database: ${error.message}`);
    process.exitCode = 1;
  });
