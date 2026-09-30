import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { ROLES } from '../src/data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, 'data.json');

let isMongoConnected = false;

export const readDatabase = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { accounts: [], resources: [], bookings: [], notifications: [] };
  }
};

export const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write data.json:', err.message);
  }
};

const accountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  roleId: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true }
}, { timestamps: true });

const resourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, default: 0 },
  status: { type: String, default: 'Available' },
  equipment: { type: [String], default: [] },
  inCharge: { type: String, default: '' },
  image: { type: String, default: '' }
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  resourceName: { type: String, required: true },
  category: { type: String, default: '' },
  room: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  bookedBy: { type: String, required: true },
  bookedById: { type: String, default: '' },
  bookedByEmail: { type: String, default: '' },
  userRole: { type: String, default: '' },
  purpose: { type: String, default: '' },
  status: { type: String, default: 'Pending' },
  attendees: { type: Number, default: 0 },
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: String, default: '' },
  cancelledAt: { type: String, default: '' }
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: String, default: '' },
  type: { type: String, default: 'info' },
  read: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  targetRole: { type: String, default: '' },
  targetUserId: { type: String, default: '' }
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);
const Resource = mongoose.model('Resource', resourceSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Notification = mongoose.model('Notification', notificationSchema);

export const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-campus', {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log('MongoDB connected successfully.');

    // Auto-seed initial records from server/data.json if MongoDB database is freshly initialized
    const accountCount = await Account.countDocuments();
    if (accountCount === 0) {
      console.log('Seeding initial records from server/data.json into MongoDB...');
      const localData = readDatabase();
      if (localData.accounts?.length) await Account.insertMany(localData.accounts);
      if (localData.resources?.length) await Resource.insertMany(localData.resources);
      if (localData.bookings?.length) await Booking.insertMany(localData.bookings);
      if (localData.notifications?.length) await Notification.insertMany(localData.notifications);
      console.log('Initial data seeded successfully into MongoDB.');
    }
  } catch (error) {
    isMongoConnected = false;
    console.log(`Notice: MongoDB not available (${error.message}).`);
    console.log('Running seamlessly with local file database (server/data.json).');
  }
};

export const findAccountById = async (id) => {
  if (isMongoConnected) return Account.findOne({ id }).lean();
  return readDatabase().accounts.find((item) => item.id === id) || null;
};

export const findAccountByEmail = async (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (isMongoConnected) return Account.findOne({ email: normalized }).lean();
  return readDatabase().accounts.find((item) => item.email.toLowerCase() === normalized) || null;
};

export const createAccount = async (item) => {
  const db = readDatabase();
  if (!db.accounts.some((a) => a.id === item.id || a.email.toLowerCase() === item.email.toLowerCase())) {
    db.accounts.push(item);
    writeDatabase(db);
  }
  if (isMongoConnected) return Account.create(item);
  return item;
};

export const listAccounts = async () => {
  if (isMongoConnected) return Account.find({}).sort({ createdAt: -1 }).lean();
  return readDatabase().accounts;
};

export const getResources = async () => {
  if (isMongoConnected) return Resource.find({}).sort({ createdAt: -1 }).lean();
  return readDatabase().resources;
};

export const findResourceById = async (id) => {
  if (isMongoConnected) return Resource.findOne({ id }).lean();
  return readDatabase().resources.find((item) => item.id === id) || null;
};

export const createResource = async (item) => {
  const db = readDatabase();
  db.resources.unshift(item);
  writeDatabase(db);
  if (isMongoConnected) return Resource.create(item);
  return item;
};

export const updateResource = async (id, changes) => {
  const db = readDatabase();
  const index = db.resources.findIndex((r) => r.id === id);
  if (index !== -1) {
    db.resources[index] = { ...db.resources[index], ...changes, id };
    writeDatabase(db);
  }
  if (isMongoConnected) {
    const resource = await Resource.findOneAndUpdate(
      { id },
      { $set: changes },
      { new: true }
    );
    return resource ? resource.toObject() : (index !== -1 ? db.resources[index] : null);
  }
  return index !== -1 ? db.resources[index] : null;
};

export const deleteResource = async (id) => {
  const existing = await findResourceById(id);
  const db = readDatabase();
  const initLen = db.resources.length;
  db.resources = db.resources.filter((item) => item.id !== id);
  if (existing?.name) {
    const resNameNorm = existing.name.trim().toLowerCase();
    db.bookings = db.bookings.filter((b) => (b.resourceName || '').trim().toLowerCase() !== resNameNorm);
  }
  writeDatabase(db);
  if (isMongoConnected) {
    const result = await Resource.deleteOne({ id });
    if (existing?.name) {
      await Booking.deleteMany({ resourceName: { $regex: new RegExp(`^${existing.name.trim()}$`, 'i') } });
    }
    return result.deletedCount > 0 || db.resources.length < initLen;
  }
  return db.resources.length < initLen;
};

export const findBookingById = async (id) => {
  if (isMongoConnected) return Booking.findOne({ id }).lean();
  return readDatabase().bookings.find((item) => item.id === id) || null;
};

export const getBookings = async (scope = null) => {
  const allResources = await getResources();
  const validResourceNames = new Set(allResources.map((resource) => (resource.name || '').trim().toLowerCase()));

  const isValidBooking = (booking) => {
    if (!booking) return false;
    const resourceName = (booking.resourceName || '').trim().toLowerCase();
    return Boolean(resourceName && validResourceNames.has(resourceName));
  };

  const matchesScope = (booking, activeScope) => {
    if (!activeScope || activeScope.roleId === 'admin') return true;

    const uName = (activeScope.userName || '').trim().toLowerCase();
    const uEmail = (activeScope.userEmail || '').trim().toLowerCase();
    const uId = activeScope.userId;

    if (activeScope.roleId === 'student' || activeScope.roleId === 'faculty') {
      return (
        (booking.bookedById && booking.bookedById === uId) ||
        (booking.bookedByEmail && booking.bookedByEmail.toLowerCase() === uEmail) ||
        (booking.bookedBy && booking.bookedBy.toLowerCase() === uName)
      );
    }

    if (activeScope.roleId === 'lab_incharge') {
      return booking.category === 'Laboratory' || (booking.resourceName && booking.resourceName.toLowerCase().includes('lab'));
    }

    if (activeScope.roleId === 'support_staff') {
      return booking.category !== 'Laboratory';
    }

    return true;
  };

  if (isMongoConnected) {
    const allBookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
    const validBookings = allBookings.filter(isValidBooking);
    if (!scope || scope.roleId === 'admin') return validBookings;
    return validBookings.filter((booking) => matchesScope(booking, scope));
  }

  const db = readDatabase();
  const validBookings = db.bookings.filter(isValidBooking);
  if (!scope || scope.roleId === 'admin') {
    return validBookings;
  }

  return validBookings.filter((booking) => matchesScope(booking, scope));
};

export const hasBookingConflict = async (item) => {
  if (isMongoConnected) {
    const existing = await Booking.findOne({
      resourceName: item.resourceName,
      date: item.date,
      time: item.time,
      status: { $ne: 'Cancelled' }
    });
    return !!existing;
  }
  return readDatabase().bookings.some(
    (b) => b.resourceName === item.resourceName && b.date === item.date && b.time === item.time && b.status !== 'Cancelled'
  );
};

export const createBooking = async (item) => {
  const db = readDatabase();
  db.bookings.unshift(item);
  writeDatabase(db);
  if (isMongoConnected) return Booking.create(item);
  return item;
};

export const updateBooking = async (id, changes) => {
  const db = readDatabase();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index !== -1) {
    db.bookings[index] = { ...db.bookings[index], ...changes, id };
    writeDatabase(db);
  }
  if (isMongoConnected) {
    const booking = await Booking.findOneAndUpdate(
      { id },
      { $set: changes },
      { new: true }
    );
    return booking ? booking.toObject() : (index !== -1 ? db.bookings[index] : null);
  }
  return index !== -1 ? db.bookings[index] : null;
};

export const deleteBooking = async (id) => {
  const db = readDatabase();
  const initLen = db.bookings.length;
  db.bookings = db.bookings.filter((b) => b.id !== id);
  writeDatabase(db);
  if (isMongoConnected) {
    const result = await Booking.deleteOne({ id });
    return result.deletedCount > 0 || db.bookings.length < initLen;
  }
  return db.bookings.length < initLen;
};

export const getNotifications = async (scope = null) => {
  if (isMongoConnected) {
    if (!scope || scope.roleId === 'admin') {
      return Notification.find({}).sort({ createdAt: -1 }).lean();
    }
    return Notification.find({
      $or: [
        { targetRole: '' },
        { targetRole: { $exists: false } },
        { targetRole: scope.roleId },
        { targetUserId: scope.userId }
      ]
    }).sort({ createdAt: -1 }).lean();
  }
  const db = readDatabase();
  if (!scope || scope.roleId === 'admin') {
    return db.notifications;
  }
  return db.notifications.filter((n) =>
    !n.targetRole || n.targetRole === scope.roleId || n.targetUserId === scope.userId
  );
};

export const markNotificationsRead = async (scope = null) => {
  if (isMongoConnected) {
    const query = (!scope || scope.roleId === 'admin') ? {} : {
      $or: [
        { targetRole: '' },
        { targetRole: { $exists: false } },
        { targetRole: scope.roleId },
        { targetUserId: scope.userId }
      ]
    };
    await Notification.updateMany(query, { $set: { read: true } });
    return getNotifications(scope);
  }
  const db = readDatabase();
  db.notifications = db.notifications.map((n) => {
    if (!scope || scope.roleId === 'admin' || !n.targetRole || n.targetRole === scope.roleId) {
      return { ...n, read: true };
    }
    return n;
  });
  writeDatabase(db);
  return db.notifications;
};

export const createNotification = async (item) => {
  const db = readDatabase();
  const notificationItem = {
    id: item.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: item.title,
    message: item.message,
    time: item.time || 'Just now',
    type: item.type || 'warning',
    read: false,
    icon: item.icon || 'AlertTriangle',
    targetRole: item.targetRole || '',
    targetUserId: item.targetUserId || ''
  };
  db.notifications.unshift(notificationItem);
  writeDatabase(db);
  if (isMongoConnected) {
    try {
      await Notification.create(notificationItem);
    } catch (err) {
      console.error('Error creating Mongo notification:', err.message);
    }
  }
  return notificationItem;
};

export const roleForAccount = (account) => ROLES.find((role) => role.id === account.roleId) || ROLES[1];

export const publicAccount = (account) => {
  const role = roleForAccount(account);
  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    phone: account.phone,
    department: account.department,
    roleId: role.id,
    role: role.name,
    title: role.title,
    avatar: role.avatar,
    permissions: role.permissions
  };
};

export const dashboardSummary = (database, roleId = 'admin') => ({
  role: roleId,
  totalResources: database.resources.length,
  availableResources: database.resources.filter((resource) => resource.status === 'Available').length,
  activeBookings: database.bookings.filter((booking) => ['Confirmed', 'Pending'].includes(booking.status)).length,
  unreadNotifications: database.notifications.filter((notification) => !notification.read).length
});

export const getDashboard = async (account = null) => {
  const scope = account ? {
    roleId: account.roleId,
    userId: account.id,
    userName: account.fullName,
    userEmail: account.email
  } : null;

  const [allResources, scopedBookings, scopedNotifications] = await Promise.all([
    getResources(),
    getBookings(scope),
    getNotifications(scope)
  ]);

  // For specific roles, resources can be tagged or scoped
  let displayedResources = allResources;
  if (account && account.roleId === 'lab_incharge') {
    displayedResources = allResources.filter((r) => r.category === 'Laboratory' || r.name.toLowerCase().includes('lab'));
  } else if (account && account.roleId === 'support_staff') {
    displayedResources = allResources.filter((r) => r.category !== 'Laboratory');
  }

  return {
    role: account ? account.roleId : 'admin',
    resources: displayedResources,
    allResourcesCount: allResources.length,
    bookings: scopedBookings,
    notifications: scopedNotifications,
    summary: {
      role: account ? account.roleId : 'admin',
      totalResources: displayedResources.length,
      availableResources: displayedResources.filter((r) => r.status === 'Available').length,
      activeBookings: scopedBookings.filter((b) => ['Confirmed', 'Pending'].includes(b.status)).length,
      unreadNotifications: scopedNotifications.filter((n) => !n.read).length
    }
  };
};