import crypto from 'node:crypto';
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import swaggerUi from 'swagger-ui-express';
import {
  createAccount,
  createBooking,
  createResource,
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
  updateAccount,
  updateAccountApproval,
  updateResource,
  createNotification
} from './db.js';
import { openapiDocument } from './openapi.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'smart-campus-development-secret';
const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const senderEmail = String(process.env.SMTP_FROM || '').trim() || 'administrator744@gmail.com';
const apiBaseUrl = (process.env.API_BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
const campusEmail = /^[^\s@]+@ritrjpm\.ac\.in$/i;
const validRoles = new Set(['admin', 'faculty', 'student', 'lab_incharge', 'support_staff']);
const hasSmtpUser = Boolean(process.env.SMTP_USER);
const hasSmtpPass = Boolean(process.env.SMTP_PASS);
const hasIncompleteSmtpCredentials = hasSmtpUser !== hasSmtpPass;
const emailTransport = process.env.SMTP_HOST && !hasIncompleteSmtpCredentials
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      ...(process.env.SMTP_USER && process.env.SMTP_PASS
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : {})
    })
  : null;

  if (hasIncompleteSmtpCredentials) {
    console.warn('SMTP_USER and SMTP_PASS must both be set. Admin email notifications are disabled until SMTP is configured.');
  }

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

const sendError = (response, status, message) => response.status(status).json({ error: message });
const createToken = (account) => jwt.sign({ sub: account.id, roleId: account.roleId }, jwtSecret, { expiresIn: '8h' });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

const renderEmailApprovalPage = ({ heading, message, token = '', account = null, isPending = false }) => {
  const details = account
    ? `<div style="background:#123943;border:1px solid #087e78;border-radius:18px;padding:22px;margin:28px 0;">
        <p style="margin:0 0 10px;"><strong>Registered Email:</strong> ${escapeHtml(account.email)}</p>
        <p style="margin:0 0 10px;"><strong>Role:</strong> ${escapeHtml(roleForAccount(account).name)}</p>
        <p style="margin:0;"><strong>Department:</strong> ${escapeHtml(account.department)}</p>
      </div>`
    : '';
  const actions = isPending
    ? `<form method="post" action="/api/email/account-approval" style="text-align:center;margin:28px 0 0;">
        <input type="hidden" name="token" value="${escapeHtml(token)}">
        <button type="submit" name="approvalStatus" value="approved" style="display:block;width:100%;border:0;border-radius:12px;background:#10b981;color:#fff;font-weight:700;font-size:16px;padding:16px;cursor:pointer;">Approve Request</button>
        <button type="submit" name="approvalStatus" value="rejected" style="display:block;width:100%;border:1px solid #ef4444;border-radius:12px;background:transparent;color:#fca5a5;font-weight:700;font-size:14px;padding:13px;margin-top:12px;cursor:pointer;">Reject Request</button>
      </form>`
    : '';

  return `<!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)} | Smart Campus Portal</title></head>
      <body style="margin:0;background:#0d172b;color:#e2e8f0;font-family:Arial,sans-serif;padding:32px 16px;">
        <main style="max-width:560px;margin:0 auto;border:1px solid #334155;border-radius:26px;overflow:hidden;background:#1e293b;box-shadow:0 18px 48px rgba(0,0,0,.35);">
          <header style="background:linear-gradient(120deg,#10b981,#06b6d4);padding:36px 24px;text-align:center;color:#fff;">
            <h1 style="font-size:26px;margin:0;">Smart Campus Portal</h1>
            <p style="font-size:15px;margin:10px 0 0;">Ramco Institute of Technology</p>
          </header>
          <section style="padding:36px 32px;">
            <h2 style="font-size:21px;margin:0 0 16px;color:#f8fafc;">${escapeHtml(heading)}</h2>
            <p style="font-size:15px;line-height:1.7;color:#b6c2d2;margin:0;">${escapeHtml(message)}</p>
            ${details}
            ${actions}
            ${isPending ? '<p style="font-size:12px;line-height:1.6;color:#8492a6;margin:28px 0 0;">This secure review link expires in 7 days. Opening this page does not change the account; choose an action above to confirm.</p>' : ''}
          </section>
          <footer style="background:#111b2e;border-top:1px solid #334155;padding:22px;text-align:center;color:#8492a6;font-size:12px;">Smart Campus Reservation System · Ramco Institute of Technology</footer>
        </main>
      </body>
    </html>`;
};

const sendAdminEmail = async (subject, text, recipientEmail = '', html = '') => {
  if (!emailTransport) return false;

  try {
    const recipients = recipientEmail
      ? [recipientEmail]
      : [...new Set((await listAccounts())
        .filter((item) => item.roleId === 'admin')
        .map((item) => String(item.email || '').trim().toLowerCase())
        .filter((email) => email && email !== senderEmail.toLowerCase()))];
    if (recipients.length === 0) return false;

    await emailTransport.sendMail({
      from: senderEmail,
      to: recipients.join(', '),
      subject,
      text,
      ...(html ? { html } : {})
    });
    return true;
  } catch (error) {
    console.error(`Unable to send administrator email: ${error.message}`);
    return false;
  }
};

const sendUserEmail = async (recipientEmail, subject, text, html = '') => {
  return sendAdminEmail(subject, text, recipientEmail, html);
};

const passwordResetOtps = new Map();

const emailAdminsAboutRegistration = async (account) => {
  const appUrl = (process.env.ADMIN_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const reviewUrl = `${appUrl}/?tab=users&reviewUser=${encodeURIComponent(account.id)}`;
  const approvalToken = jwt.sign(
    { sub: account.id, purpose: 'account-approval' },
    jwtSecret,
    { expiresIn: '7d' }
  );
  const emailApprovalUrl = `${apiBaseUrl}/api/email/account-approval?token=${encodeURIComponent(approvalToken)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#0d172b;padding:32px 16px;color:#e2e8f0;">
      <div style="max-width:560px;margin:0 auto;border:1px solid #334155;border-radius:24px;overflow:hidden;background:#1e293b;">
        <div style="background:linear-gradient(120deg,#10b981,#06b6d4);padding:30px 20px;text-align:center;color:#fff;">
          <h2 style="margin:0;font-size:22px;">Smart Campus Portal</h2>
          <p style="margin:8px 0 0;font-size:14px;">Ramco Institute of Technology · Account Review</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;line-height:1.6;color:#cbd5e1;margin:0 0 20px;">A new campus account is waiting for your review.</p>
          <div style="background:#123943;border:1px solid #087e78;border-radius:16px;padding:20px;">
            <p style="margin:0 0 10px;"><strong>Name:</strong> ${escapeHtml(account.fullName)}</p>
            <p style="margin:0 0 10px;"><strong>Email:</strong> ${escapeHtml(account.email)}</p>
            <p style="margin:0 0 10px;"><strong>Role:</strong> ${escapeHtml(roleForAccount(account).name)}</p>
            <p style="margin:0;"><strong>Department:</strong> ${escapeHtml(account.department)}</p>
          </div>
          <div style="text-align:center;margin:26px 0 18px;">
            <a href="${escapeHtml(emailApprovalUrl)}" style="display:inline-block;background:#10b981;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:12px;">Review &amp; Approve Request</a>
          </div>
          <p style="font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;margin:0;">The link opens a confirmation page. No action is taken until you confirm.</p>
          <p style="font-size:12px;text-align:center;margin:18px 0 0;"><a href="${escapeHtml(reviewUrl)}" style="color:#38bdf8;">Sign in and review in the portal</a></p>
        </div>
        <div style="background:#111b2e;padding:18px;text-align:center;color:#8492a6;font-size:11px;">Smart Campus Reservation System · Ramco Institute of Technology</div>
      </div>
    </div>`;
  return sendAdminEmail('Smart Campus account approval requested', [
    'A new Smart Campus account is awaiting approval.',
    `Name: ${account.fullName}`,
    `Email: ${account.email}`,
    `Role requested: ${roleForAccount(account).name}`,
    `Department: ${account.department}`,
    'Open the secure review page to approve or reject this request.',
    `Review and approve: ${emailApprovalUrl}`,
    `Review request: ${reviewUrl}`
  ].join('\n'), adminEmail, html);
};

const emailUserRegistrationReceived = async (account) => {
  const roleName = roleForAccount(account).name;
  const subject = 'Smart Campus - Registration Received (Pending Administrator Approval)';
  const text = [
    `Hello ${account.fullName},`,
    '',
    'Thank you for registering with the Smart Campus Portal at Ramco Institute of Technology.',
    '',
    `Your registration request as ${roleName} has been received and is currently PENDING ADMINISTRATOR APPROVAL.`,
    '',
    'Account Details:',
    `- Full Name: ${account.fullName}`,
    `- Registered Email: ${account.email}`,
    `- Role Requested: ${roleName}`,
    `- Department: ${account.department}`,
    `- Phone: ${account.phone || 'Not provided'}`,
    '',
    'What happens next?',
    '1. A campus administrator has been notified to review and verify your account.',
    '2. Once approved, you will receive an official approval email with direct login access.',
    '3. You will then be able to log in using your campus email and password and start booking campus facilities.',
    '',
    'Best regards,',
    'Smart Campus Portal Administration',
    'Ramco Institute of Technology'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 32px 16px; color: #f8fafc;">
      <div style="max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 24px; text-align: center;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Smart Campus Portal</h2>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Ramco Institute of Technology</p>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 15px; margin: 0 0 14px 0; color: #e2e8f0;">Hello <strong>${escapeHtml(account.fullName)}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0;">
            Thank you for registering with the Smart Campus Portal. Your account request as <strong>${escapeHtml(roleName)}</strong> has been received and is currently <span style="color: #fbbf24; font-weight: 700;">PENDING ADMINISTRATOR APPROVAL</span>.
          </p>
          <div style="background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.25); border-radius: 10px; padding: 18px; margin: 0 0 22px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #e2e8f0;"><strong>Registered Email:</strong> ${escapeHtml(account.email)}</p>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #e2e8f0;"><strong>Role Requested:</strong> ${escapeHtml(roleName)}</p>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #e2e8f0;"><strong>Department:</strong> ${escapeHtml(account.department)}</p>
            <p style="margin: 0; font-size: 13px; color: #fbbf24; font-weight: 600;"><strong>Status:</strong> ⏳ Awaiting Admin Approval</p>
          </div>
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #38bdf8; font-weight: 700;">What happens next?</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6; color: #94a3b8;">
              <li>A campus administrator has been notified to review your registration request.</li>
              <li>Once verified and approved, you will receive an approval email notification.</li>
              <li>After approval, you can sign in with your password to view and book campus resources.</li>
            </ul>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
            If you did not submit this registration, please contact your campus administrator immediately.
          </p>
        </div>
        <div style="background: #0f172a; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06);">
          &copy; Smart Campus Reservation System &bull; Ramco Institute of Technology
        </div>
      </div>
    </div>
  `;

  return sendUserEmail(account.email, subject, text, html);
};

const emailUserAccountApproval = async (account, status) => {
  const appUrl = (process.env.ADMIN_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const roleName = roleForAccount(account).name;

  if (status === 'approved') {
    const subject = 'Your Smart Campus Account Has Been Approved!';
    const text = [
      `Hello ${account.fullName},`,
      '',
      `Great news! Your Smart Campus registration request as ${roleName} has been approved by the administrator.`,
      '',
      'You can now sign in to the portal using your campus email and password:',
      `${appUrl}`,
      '',
      `Login Email: ${account.email}`,
      `Department: ${account.department}`,
      '',
      'Best regards,',
      'Smart Campus Portal Administration',
      'Ramco Institute of Technology'
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;background:#0d172b;padding:32px 16px;color:#f8fafc;">
        <div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:28px;overflow:hidden;border:1px solid #334155;box-shadow:0 18px 48px rgba(0,0,0,.35);">
          <div style="background:linear-gradient(120deg,#10b981,#06b6d4);padding:42px 24px;text-align:center;">
            <h2 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Smart Campus Portal</h2>
            <p style="margin:10px 0 0;color:rgba(255,255,255,.92);font-size:15px;">Ramco Institute of Technology</p>
          </div>
          <div style="padding:48px 56px;">
            <p style="font-size:17px;margin:0 0 20px;color:#e2e8f0;">Hello <strong>${escapeHtml(account.fullName)}</strong>,</p>
            <p style="font-size:16px;line-height:1.8;color:#a8b4c5;margin:0 0 28px;">
              Your account registration for the Smart Campus Portal as <strong style="color:#e2e8f0;">${escapeHtml(roleName)}</strong> has been <span style="color:#10b981;font-weight:800;">APPROVED</span> by the administrator!
            </p>
            <div style="background:#123943;border:1px solid #087e78;border-radius:18px;padding:24px 26px;margin:0 0 38px;">
              <p style="margin:0 0 12px;font-size:15px;color:#e2e8f0;"><strong>Registered Email:</strong><br><a href="mailto:${escapeHtml(account.email)}" style="color:#60a5fa;text-decoration:none;">${escapeHtml(account.email)}</a></p>
              <p style="margin:0 0 12px;font-size:15px;color:#e2e8f0;"><strong>Role:</strong> ${escapeHtml(roleName)}</p>
              <p style="margin:0;font-size:15px;color:#e2e8f0;"><strong>Department:</strong> ${escapeHtml(account.department)}</p>
            </div>
            <div style="text-align:center;margin:0 0 38px;">
              <a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;text-decoration:none;padding:18px 42px;border-radius:14px;font-size:16px;">Log In to Smart Campus</a>
            </div>
            <p style="font-size:14px;line-height:1.7;color:#8492a6;margin:0;">
              You can now log in anytime using your registered campus email and password.
            </p>
          </div>
          <div style="background:#111b2e;padding:28px 16px;text-align:center;font-size:12px;color:#8492a6;border-top:1px solid #334155;">
            Smart Campus Reservation System &bull; Ramco Institute of Technology
          </div>
        </div>
      </div>
    `;

    return sendUserEmail(account.email, subject, text, html);
  } else if (status === 'rejected') {
    const subject = 'Smart Campus Registration Status Update';
    const text = [
      `Hello ${account.fullName},`,
      '',
      `Your registration request for the Smart Campus Portal as ${roleName} was reviewed and not approved by the administrator.`,
      '',
      'If you have any questions, please contact the campus administration.',
      '',
      'Best regards,',
      'Smart Campus Portal Administration',
      'Ramco Institute of Technology'
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 32px 16px; color: #f8fafc;">
        <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
          <div style="background: #ef4444; padding: 24px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Smart Campus Portal</h2>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Registration Status Update</p>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 15px; margin: 0 0 14px 0; color: #e2e8f0;">Hello <strong>${escapeHtml(account.fullName)}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0;">
              Your registration request for the Smart Campus Portal as <strong>${escapeHtml(roleName)}</strong> was reviewed and not approved by the administrator.
            </p>
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              If you believe this was an error, please contact your department coordinator or campus administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    return sendUserEmail(account.email, subject, text, html);
  }
};

const completeAccountApproval = async (id, approvalStatus) => {
  const account = await updateAccountApproval(id, approvalStatus);
  if (!account) return null;

  try {
    await emailUserAccountApproval(account, approvalStatus);
  } catch (error) {
    console.error(`Failed to send approval email to ${account.email}:`, error.message);
  }

  await createNotification({
    title: approvalStatus === 'approved' ? 'Account Approved' : 'Registration Rejected',
    message: approvalStatus === 'approved'
      ? 'Your Smart Campus account has been approved by the administrator.'
      : 'Your registration request was rejected by the administrator.',
    targetUserId: account.id,
    targetRole: account.roleId,
    type: approvalStatus === 'approved' ? 'success' : 'warning',
    icon: approvalStatus === 'approved' ? 'CheckCircle' : 'XCircle'
  });
  return account;
};

const verifyEmailApprovalToken = (token) => {
  try {
    const payload = jwt.verify(token, jwtSecret);
    return typeof payload === 'object'
      && payload.purpose === 'account-approval'
      && typeof payload.sub === 'string'
      ? payload
      : null;
  } catch {
    return null;
  }
};

const bookingEmailDetails = (booking) => [
  `Booking ID: ${booking.id || 'Not provided'}`,
  `Resource: ${booking.resourceName || 'Not provided'}`,
  `Category: ${booking.category || 'Not provided'}`,
  `Room: ${booking.room || 'Not provided'}`,
  `Date: ${booking.date || 'Not provided'}`,
  `Time: ${booking.time || 'Not provided'}`,
  `Status: ${booking.status || 'Not provided'}`,
  `Booked by: ${booking.bookedBy || 'Not provided'}`,
  `Email: ${booking.bookedByEmail || 'Not provided'}`,
  `Purpose: ${booking.purpose || 'Not provided'}`,
  `Attendees: ${booking.attendees ?? 'Not provided'}`,
  `Cancellation reason: ${booking.cancellationReason || 'None'}`
].join('\n');

const authenticate = async (request, response, next) => {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return sendError(response, 401, 'Bearer token required.');
  try {
    request.auth = jwt.verify(token, jwtSecret);
    request.account = await findAccountById(request.auth.sub);
    if (!request.account) return sendError(response, 401, 'Account no longer exists.');
    if (request.account.approvalStatus && request.account.approvalStatus !== 'approved') {
      return sendError(response, 403, 'Account access is not approved.');
    }
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

    const isAutoApproved = roleId === 'admin';
    const account = {
      id: `user-${crypto.randomUUID()}`,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      fullName: fullName.trim(),
      roleId,
      phone: String(phone),
      department: department.trim(),
      approvalStatus: isAutoApproved ? 'approved' : 'pending'
    };
    await createAccount(account);
    await createNotification({
      title: 'New campus member registered',
      message: `${account.fullName} (${account.email}) registered as ${roleForAccount(account).name}.`,
      targetRole: 'admin',
      type: 'info',
      icon: 'UserPlus'
    });
    try {
      await emailAdminsAboutRegistration(account);
    } catch (adminMailErr) {
      console.error('Failed to notify administrator via email:', adminMailErr.message);
    }

    if (!isAutoApproved) {
      try {
        await emailUserRegistrationReceived(account);
      } catch (userMailErr) {
        console.error('Failed to send registration confirmation email to user:', userMailErr.message);
      }

      return response.status(202).json({
        message: 'Registration submitted successfully! Your account is pending administrator approval. We have sent a confirmation email to your campus inbox.',
        user: publicAccount(account)
      });
    }

    const tokenAccount = { ...account, passwordHash: account.passwordHash };
    return response.status(201).json({
      message: 'Registration successful! Welcome to Smart Campus.',
      token: createToken(tokenAccount),
      user: publicAccount(tokenAccount),
      role: roleForAccount(tokenAccount)
    });
  } catch (error) {
    if (error.code === 11000 || String(error.message).includes('duplicate key') || String(error.message).includes('E11000')) {
      return sendError(response, 409, 'An account with this email address already exists. Please log in instead.');
    }
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
    if (account.approvalStatus === 'pending') {
      await emailAdminsAboutRegistration(account);
      return sendError(response, 403, 'Your account is awaiting administrator approval.');
    }
    if (account.approvalStatus === 'rejected') {
      return sendError(response, 403, 'Your account registration was rejected. Contact an administrator.');
    }
    const tokenAccount = { ...account, passwordHash: account.passwordHash };
    await sendAdminEmail('Smart Campus user signed in', [
      'An approved Smart Campus user signed in successfully.',
      `Name: ${account.fullName}`,
      `Email: ${account.email}`,
      `Role: ${roleForAccount(account).name}`,
      `Time: ${new Date().toISOString()}`
    ].join('\n'));
    return response.json({ token: createToken(tokenAccount), user: publicAccount(tokenAccount), role: roleForAccount(tokenAccount) });
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

app.post('/api/auth/forgot-password', async (request, response) => {
  try {
    const normalizedEmail = String(request.body?.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return sendError(response, 400, 'Please enter your campus email.');
    }
    if (!campusEmail.test(normalizedEmail)) {
      return sendError(response, 400, 'Please enter a valid campus email address (name@ritrjpm.ac.in).');
    }

    const account = await findAccountByEmail(normalizedEmail);
    if (!account) {
      return sendError(response, 404, 'No account found with this campus email.');
    }

    if (!emailTransport) {
      return sendError(response, 503, 'Email service is not configured on the server. Contact administrator.');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    passwordResetOtps.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0
    });

    const subject = 'Your Smart Campus Password Reset Code';
    const text = [
      `Hello ${account.fullName},`,
      '',
      'A request was made to reset your password for the Smart Campus Portal.',
      `Your 6-digit verification code is: ${otp}`,
      '',
      'This code is valid for 15 minutes.',
      'If you did not request this password reset, please ignore this email.',
      '',
      'Regards,',
      'Smart Campus Portal Administration',
      'Ramco Institute of Technology'
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 32px 16px; color: #f8fafc;">
        <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 24px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Smart Campus Portal</h2>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Ramco Institute of Technology</p>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 15px; margin: 0 0 14px 0; color: #e2e8f0;">Hello <strong>${escapeHtml(account.fullName)}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
              We received a request to reset your password. Use the 6-digit verification code below to reset your password:
            </p>
            <div style="background: rgba(79, 70, 229, 0.15); border: 2px dashed #6366f1; border-radius: 10px; text-align: center; padding: 20px; margin: 0 0 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: monospace; display: inline-block;">${otp}</span>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">Valid for <strong>15 minutes</strong></p>
            </div>
            <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
              If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
          <div style="background: #0f172a; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06);">
            &copy; Smart Campus Reservation System &bull; Secure Authentication Service
          </div>
        </div>
      </div>
    `;

    const sent = await sendUserEmail(normalizedEmail, subject, text, html);
    if (!sent) {
      return sendError(response, 500, 'Unable to send email via SMTP server. Please verify network or credentials.');
    }

    return response.json({
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your email inbox.`
    });
  } catch (error) {
    return sendError(response, 500, error.message);
  }
});

app.post('/api/auth/reset-password', async (request, response) => {
  try {
    const { email, otp, newPassword } = request.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    if (!normalizedEmail || !cleanOtp || !newPassword) {
      return sendError(response, 400, 'Email, verification code, and new password are required.');
    }

    const record = passwordResetOtps.get(normalizedEmail);
    if (!record) {
      return sendError(response, 400, 'No active password reset request found for this email. Please request a new code.');
    }

    if (Date.now() > record.expiresAt) {
      passwordResetOtps.delete(normalizedEmail);
      return sendError(response, 400, 'The verification code has expired. Please request a new code.');
    }

    if (record.attempts >= 5) {
      passwordResetOtps.delete(normalizedEmail);
      return sendError(response, 429, 'Too many invalid attempts. Please request a new verification code.');
    }

    if (cleanOtp !== record.otp) {
      record.attempts += 1;
      return sendError(response, 400, 'Invalid verification code. Please check your email.');
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return sendError(response, 400, 'New password must be at least 6 characters.');
    }

    const account = await findAccountByEmail(normalizedEmail);
    if (!account) {
      passwordResetOtps.delete(normalizedEmail);
      return sendError(response, 404, 'Account not found.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateAccount(account.id, { passwordHash });
    passwordResetOtps.delete(normalizedEmail);

    await createNotification({
      title: 'Security Notice: Password Updated',
      message: `The password for ${account.fullName} was recently changed.`,
      targetUserId: account.id,
      targetRole: account.roleId,
      type: 'info',
      icon: 'ShieldCheck'
    });

    try {
      await sendUserEmail(
        normalizedEmail,
        'Smart Campus - Password Successfully Updated',
        `Hello ${account.fullName},\n\nYour password for Smart Campus was successfully reset.\nIf you did not perform this change, contact your campus administrator immediately.`,
        `<div style="font-family: sans-serif; color: #1e293b; padding: 20px;">
          <h3>Password Successfully Reset</h3>
          <p>Hello <strong>${escapeHtml(account.fullName)}</strong>,</p>
          <p>Your password for the Smart Campus Portal was changed successfully. You can now log in with your new password.</p>
          <p style="color: #64748b; font-size: 12px;">If you did not authorize this change, please contact the campus administrator immediately.</p>
        </div>`
      );
    } catch {}

    return response.json({
      message: 'Password reset successful! You can now log in with your new password.'
    });
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

app.patch('/api/auth/profile', authenticate, async (request, response) => {
  try {
    const { fullName, phone, department } = request.body || {};
    const updates = {};
    if (typeof fullName === 'string' && fullName.trim()) {
      updates.fullName = fullName.trim();
    }
    if (phone !== undefined && phone !== null) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return sendError(response, 400, 'Phone number must contain exactly 10 digits.');
      }
      updates.phone = cleanPhone;
    }
    if (typeof department === 'string' && department.trim()) {
      updates.department = department.trim();
    }

    if (Object.keys(updates).length === 0) {
      return sendError(response, 400, 'No valid changes provided.');
    }

    const updatedAccount = await updateAccount(request.account.id, updates);
    if (!updatedAccount) return sendError(response, 404, 'Account not found.');

    const pubUser = publicAccount(updatedAccount);
    const role = roleForAccount(updatedAccount);
    return response.json({
      message: 'Profile updated successfully!',
      user: pubUser,
      role
    });
  } catch (error) {
    return sendError(response, 500, error.message);
  }
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

    // In-app notification for Administrators to review the new booking request
    await createNotification({
      title: `New Reservation Request: ${booking.resourceName}`,
      message: `${booking.bookedBy} (${booking.userRole || 'Student'}) requested ${booking.resourceName} on ${booking.date} (${booking.time}).`,
      type: 'warning',
      icon: 'Calendar',
      targetRole: 'admin'
    });

    // In-app confirmation notification for the user who submitted the request
    await createNotification({
      title: `Booking Request Submitted: ${booking.resourceName}`,
      message: `Your booking request for ${booking.resourceName} on ${booking.date} (${booking.time}) has been submitted and is pending administrator approval.`,
      type: 'info',
      icon: 'Clock',
      targetUserId: booking.bookedById,
      targetRole: callerRoleId
    });

    const appUrl = (process.env.ADMIN_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const reviewUrl = `${appUrl}/?tab=bookings&reviewBooking=${encodeURIComponent(booking.id)}`;
    sendAdminEmail('Smart Campus booking request created', [
      'A new booking request was submitted.',
      bookingEmailDetails(booking),
      'Sign in as an administrator to approve or reject this request.',
      `Review request: ${reviewUrl}`
    ].join('\n\n'), '', [
      '<p>A new booking request was submitted.</p>',
      `<pre>${escapeHtml(bookingEmailDetails(booking))}</pre>`,
      `<p><a href="${escapeHtml(reviewUrl)}">Review and approve or reject this booking</a></p>`,
      '<p>You will need to sign in as an administrator before taking action.</p>'
    ].join('')).catch((err) => console.error('Admin email notification error:', err.message));

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

    if (request.body?.status === 'Confirmed') {
      const approvedBy = request.account.roleId === 'admin'
        ? (request.account.fullName ? `${request.account.fullName} (Admin)` : 'Campus Administrator')
        : 'Campus Administrator';

      changes.status = 'Confirmed';
      changes.approvedBy = approvedBy;
      changes.approvedAt = new Date().toISOString();

      // Automatically dispatch an in-app notification to the person who booked
      await createNotification({
        title: `Reservation Approved: ${existing.resourceName}`,
        message: `Your reservation request for ${existing.resourceName} on ${existing.date} (${existing.time}) was approved by ${approvedBy}!`,
        type: 'success',
        icon: 'CheckCircle',
        targetUserId: existing.bookedById || '',
        targetRole: (existing.userRole?.toLowerCase() === 'faculty' ? 'faculty' : 'student')
      });
    }

    if (request.body?.status === 'Cancelled') {
      const cancellationReason = request.body?.cancellationReason || 'Administrative cancellation / scheduling conflict';
      const cancelledBy = request.account.roleId === 'admin'
        ? (request.account.fullName ? `${request.account.fullName} (Admin)` : 'Campus Administrator')
        : (request.account.fullName || 'User');

      changes.status = 'Cancelled';
      changes.cancellationReason = cancellationReason;
      changes.cancelledBy = cancelledBy;
      changes.cancelledAt = new Date().toISOString();

      // Automatically dispatch an in-app notification to the person who booked
      const reasonText = cancellationReason ? ` Reason: "${cancellationReason}".` : '';
      await createNotification({
        title: `Reservation Cancelled: ${existing.resourceName}`,
        message: `Your reservation for ${existing.resourceName} on ${existing.date} (${existing.time}) was cancelled by ${cancelledBy}.${reasonText}`,
        type: 'danger',
        icon: 'AlertTriangle',
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

    sendAdminEmail(`Smart Campus booking ${updated?.status || 'updated'}`, [
      `A booking was updated by ${request.account.fullName} (${request.account.email}).`,
      bookingEmailDetails(updated || { ...existing, ...changes })
    ].join('\n\n')).catch((err) => console.error('Admin email notification error:', err.message));

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
    await sendAdminEmail('Smart Campus booking deleted', [
      `A booking was deleted by ${request.account.fullName} (${request.account.email}).`,
      bookingEmailDetails(existing)
    ].join('\n\n'));
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

const setEmailApprovalPageHeaders = (response) => {
  response.set({
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  });
};

app.get('/api/email/account-approval', async (request, response) => {
  setEmailApprovalPageHeaders(response);
  const payload = verifyEmailApprovalToken(String(request.query.token || ''));
  if (!payload) {
    return response.status(400).type('html').send(renderEmailApprovalPage({
      heading: 'Review link is invalid or expired',
      message: 'Please ask an administrator to review this registration from the Smart Campus Portal.'
    }));
  }

  try {
    const account = await findAccountById(payload.sub);
    if (!account) {
      return response.status(404).type('html').send(renderEmailApprovalPage({
        heading: 'Account request not found',
        message: 'This account request may have been removed.'
      }));
    }
    if (account.approvalStatus !== 'pending') {
      return response.status(409).type('html').send(renderEmailApprovalPage({
        heading: 'Request already reviewed',
        message: `This account request has already been ${account.approvalStatus}.`
      }));
    }
    return response.type('html').send(renderEmailApprovalPage({
      heading: 'Review account request',
      message: 'Confirm whether you want to approve or reject this Smart Campus account registration.',
      token: String(request.query.token),
      account,
      isPending: true
    }));
  } catch (error) {
    console.error('Unable to load email account approval page:', error.message);
    return response.status(500).type('html').send(renderEmailApprovalPage({
      heading: 'Unable to load request',
      message: 'The request could not be loaded. Please try again or review it in the Smart Campus Portal.'
    }));
  }
});

app.post('/api/email/account-approval', async (request, response) => {
  setEmailApprovalPageHeaders(response);
  const payload = verifyEmailApprovalToken(String(request.body?.token || ''));
  if (!payload) {
    return response.status(400).type('html').send(renderEmailApprovalPage({
      heading: 'Review link is invalid or expired',
      message: 'Please ask an administrator to review this registration from the Smart Campus Portal.'
    }));
  }

  const approvalStatus = request.body?.approvalStatus;
  if (!['approved', 'rejected'].includes(approvalStatus)) {
    return response.status(400).type('html').send(renderEmailApprovalPage({
      heading: 'Invalid review action',
      message: 'Choose either approve or reject to review this account request.'
    }));
  }

  try {
    const account = await findAccountById(payload.sub);
    if (!account) {
      return response.status(404).type('html').send(renderEmailApprovalPage({
        heading: 'Account request not found',
        message: 'This account request may have been removed.'
      }));
    }
    if (account.approvalStatus !== 'pending') {
      return response.status(409).type('html').send(renderEmailApprovalPage({
        heading: 'Request already reviewed',
        message: `This account request has already been ${account.approvalStatus}.`
      }));
    }

    const updatedAccount = await completeAccountApproval(payload.sub, approvalStatus);
    if (!updatedAccount) {
      return response.status(409).type('html').send(renderEmailApprovalPage({
        heading: 'Request already reviewed',
        message: 'Another administrator has already completed this account review.'
      }));
    }
    return response.type('html').send(renderEmailApprovalPage({
      heading: approvalStatus === 'approved' ? 'Account approved' : 'Registration rejected',
      message: `${updatedAccount.fullName}'s account request has been ${approvalStatus}.`
    }));
  } catch (error) {
    console.error('Unable to complete email account review:', error.message);
    return response.status(500).type('html').send(renderEmailApprovalPage({
      heading: 'Unable to complete review',
      message: 'The account request could not be updated. Please try again or review it in the Smart Campus Portal.'
    }));
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

app.patch('/api/users/:id/approval', authenticate, async (request, response) => {
  try {
    if (request.account.roleId !== 'admin') {
      return sendError(response, 403, 'Permission denied: Only administrators can review account requests.');
    }
    const approvalStatus = request.body?.approvalStatus;
    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return sendError(response, 400, 'Approval status must be approved or rejected.');
    }
    const currentAccount = await findAccountById(request.params.id);
    if (!currentAccount) return sendError(response, 404, 'User account not found.');
    if (currentAccount.approvalStatus !== 'pending') {
      return sendError(response, 409, 'This account request has already been reviewed.');
    }
    const account = await completeAccountApproval(request.params.id, approvalStatus);
    if (!account) return sendError(response, 409, 'This account request has already been reviewed.');

    return response.json(publicAccount(account));
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
  .then(async (migratedAccounts) => {
    for (const account of migratedAccounts) {
      await emailAdminsAboutRegistration(account);
    }
    app.listen(port, () => console.log(`Smart Campus API listening on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error(`Unable to initialize database: ${error.message}`);
    process.exitCode = 1;
  });
