import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Plus,
  Check,
  X,
  Clock,
  MapPin,
  User,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Trash2
} from 'lucide-react';

const CANCELLATION_PRESETS = [
  'Emergency laboratory / facility maintenance or inspection',
  'Department / faculty examination scheduled',
  'VIP campus event or high-priority institutional meeting',
  'Facility double-booking or scheduling conflict resolution',
  'Power outage / equipment repair in progress',
  'Other / Custom reason'
];

export default function BookingsView({
  bookings,
  setBookings,
  currentRole,
  onOpenBookingModal,
  onUpdateBookingStatus,
  onDeleteBooking,
  isMyBookingsOnly = false
}) {
  const [filterStatus, setFilterStatus] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [presetReason, setPresetReason] = useState(CANCELLATION_PRESETS[0]);
  const [cancellationReason, setCancellationReason] = useState(CANCELLATION_PRESETS[0]);

  const isOwner = (b) => {
    const uName = (currentRole?.user?.name || '').trim().toLowerCase();
    const uEmail = (currentRole?.user?.email || '').trim().toLowerCase();
    const uId = currentRole?.user?.id || currentRole?.id;
    return (
      (b.bookedById && b.bookedById === uId) ||
      (b.bookedByEmail && b.bookedByEmail.trim().toLowerCase() === uEmail) ||
      (b.bookedBy && b.bookedBy.trim().toLowerCase() === uName)
    );
  };

  const canApprove = (b) => {
    if (b.status !== 'Pending') return false;
    return currentRole?.id === 'admin';
  };

  const canCancel = (b) => {
    if (b.status === 'Cancelled') return false;
    if (currentRole?.id === 'admin') return true;
    if (isOwner(b)) return true;
    return false;
  };

  const canDelete = (b) => {
    if (currentRole?.id === 'admin') return true;
    if (isOwner(b)) return true;
    return false;
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this reservation record from the database?')) {
      if (onDeleteBooking) {
        onDeleteBooking(id);
      } else {
        setBookings((prev) => prev.filter((b) => b.id !== id));
      }
    }
  };

  // For students and faculty, strictly isolate their own bookings
  const isPersonalRole = currentRole?.id === 'student' || currentRole?.id === 'faculty';
  const scopedBookings = (isMyBookingsOnly || isPersonalRole) ? bookings.filter(isOwner) : bookings;

  const activeCount = scopedBookings.filter(b => b.status !== 'Cancelled').length;
  const confirmedCount = scopedBookings.filter(b => b.status === 'Confirmed').length;
  const pendingCount = scopedBookings.filter(b => b.status === 'Pending').length;
  const cancelledCount = scopedBookings.filter(b => b.status === 'Cancelled').length;

  const displayList = scopedBookings.filter((b) => {
    let matchesStatus = true;
    if (filterStatus === 'Active') {
      matchesStatus = b.status !== 'Cancelled';
    } else if (filterStatus === 'Cancelled') {
      matchesStatus = b.status === 'Cancelled';
    } else if (filterStatus === 'All History') {
      matchesStatus = true;
    } else {
      matchesStatus = b.status === filterStatus;
    }

    const matchesSearch =
      b.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.purpose && b.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.room && b.room.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const handleApprove = (id) => {
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(id, 'Confirmed');
    } else {
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'Confirmed' } : b))
      );
    }
  };

  const handleOpenCancelModal = (booking) => {
    setCancellingBooking(booking);
    setPresetReason(CANCELLATION_PRESETS[0]);
    setCancellationReason(CANCELLATION_PRESETS[0]);
  };

  const handleConfirmCancel = () => {
    if (!cancellingBooking) return;
    const finalReason = presetReason === 'Other / Custom reason'
      ? (cancellationReason.trim() || 'Administrative cancellation')
      : (presetReason || cancellationReason || 'Administrative cancellation');

    const adminName = currentRole?.name || currentRole?.user?.name || 'Campus Administrator';

    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(cancellingBooking.id, 'Cancelled', finalReason);
    } else {
      setBookings(prev =>
        prev.map(b => (b.id === cancellingBooking.id ? {
          ...b,
          status: 'Cancelled',
          cancellationReason: finalReason,
          cancelledBy: adminName,
          cancelledAt: new Date().toISOString()
        } : b))
      );
    }
    setCancellingBooking(null);
    setCancellationReason('');
  };

  const getHeaderTitle = () => {
    if (currentRole?.id === 'student' || currentRole?.id === 'faculty') {
      return 'My Campus Reservations';
    }
    if (currentRole?.id === 'lab_incharge') {
      return 'Laboratory Bookings & Schedules';
    }
    if (currentRole?.id === 'support_staff') {
      return 'Seminar Hall & Facility Bookings';
    }
    return 'All Campus Reservations';
  };

  const getHeaderSubtitle = () => {
    if (currentRole?.id === 'student' || currentRole?.id === 'faculty') {
      return `Personal reservations and schedules for ${currentRole.user.name}`;
    }
    if (currentRole?.id === 'lab_incharge') {
      return 'View who booked laboratories with time, inspect schedules, and approve reservations';
    }
    if (currentRole?.id === 'support_staff') {
      return 'View who booked seminar halls, equipment, and general campus facilities with time';
    }
    return 'Full administrative log of all faculty, staff, and student facility allocations';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              {getHeaderTitle()}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {getHeaderSubtitle()}
            </p>
          </div>

          {(currentRole?.id === 'student' || currentRole?.id === 'faculty') && (
            <button
              onClick={onOpenBookingModal}
              className="btn-glass-primary"
              style={{ padding: '9px 18px', fontSize: '0.86rem' }}
            >
              <Plus size={16} />
              <span>+ New Reservation</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search by resource, organizer, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{ width: '100%', paddingLeft: '38px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'Active', label: 'Active', count: activeCount },
              { id: 'Confirmed', label: 'Confirmed', count: confirmedCount },
              { id: 'Pending', label: 'Pending', count: pendingCount },
              { id: 'Cancelled', label: 'Cancelled', count: cancelledCount },
              { id: 'All History', label: 'All History', count: scopedBookings.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: filterStatus === tab.id ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                  background: filterStatus === tab.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                  color: filterStatus === tab.id ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: filterStatus === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: filterStatus === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    color: filterStatus === tab.id ? '#fff' : 'var(--text-dim)',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {displayList.length > 0 ? (
          displayList.map((b) => (
            <div
              key={b.id}
              className="glass-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      {b.id}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)', marginTop: '4px' }}>
                      {b.resourceName}
                    </h3>
                  </div>

                  <span
                    className={
                      b.status === 'Confirmed'
                        ? 'badge-confirmed'
                        : b.status === 'Pending'
                        ? 'badge-pending'
                        : b.status === 'Maintenance'
                        ? 'badge-maintenance'
                        : 'badge-booked'
                    }
                    style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}
                  >
                    {b.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
                  "{b.purpose}"
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--primary-light)" />
                    <span>{b.date} • {b.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#38bdf8" />
                    <span>{b.room} ({b.category})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="#34d399" />
                    <span>Booked by: <strong>{b.bookedBy}</strong> ({b.userRole})</span>
                  </div>
                </div>
                {b.status === 'Cancelled' && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, fontSize: '0.8rem' }}>
                        <AlertCircle size={15} color="#ef4444" />
                        <span>Cancelled by {b.cancelledBy || 'Administrator'}</span>
                      </div>
                      {b.cancelledAt && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(b.cancelledAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                      <strong style={{ color: '#fff' }}>Reason: </strong>
                      {b.cancellationReason || 'Facility unavailable / administrative requirement.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Approver / Owner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--glass-border)'
                }}
              >
                {canApprove(b) && (
                  <>
                    <button
                      onClick={() => handleApprove(b.id)}
                      title="Approve Reservation"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleOpenCancelModal(b)}
                      title="Reject Reservation with Reason"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {canCancel(b) && (
                  <button
                    onClick={() => handleOpenCancelModal(b)}
                    title="Cancel Booking with Reason"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel Booking
                  </button>
                )}

                {canDelete(b) && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    title="Delete Reservation Record"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            No bookings found matching the selected criteria.
          </div>
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {cancellingBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: '#0f172a',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                <AlertCircle size={22} color="#ef4444" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-highlight)' }}>
                  Cancel Reservation
                </h3>
              </div>
              <button
                onClick={() => setCancellingBooking(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.82rem', marginBottom: '16px' }}>
              <div>Resource: <strong>{cancellingBooking.resourceName}</strong></div>
              <div>Date & Time: <strong>{cancellingBooking.date} ({cancellingBooking.time})</strong></div>
              <div>Booked by: <strong>{cancellingBooking.bookedBy}</strong> ({cancellingBooking.userRole})</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Select Reason for Cancellation: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={presetReason}
                onChange={(e) => {
                  setPresetReason(e.target.value);
                  if (e.target.value !== 'Other / Custom reason') {
                    setCancellationReason(e.target.value);
                  } else {
                    setCancellationReason('');
                  }
                }}
                className="glass-input"
                style={{ width: '100%', marginBottom: '10px' }}
              >
                {CANCELLATION_PRESETS.map((preset) => (
                  <option key={preset} value={preset} style={{ background: '#1e1b4b' }}>
                    {preset}
                  </option>
                ))}
              </select>

              {presetReason === 'Other / Custom reason' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    Type Custom Reason:
                  </label>
                  <textarea
                    rows={3}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Explain why this reservation is being cancelled so the user understands..."
                    className="glass-input"
                    style={{ width: '100%', resize: 'vertical' }}
                    required
                  />
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '18px' }}>
              ℹ️ The person who booked this resource will immediately see the cancellation and this explanation in their reservations list and notifications.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setCancellingBooking(null)}
                className="btn-glass-secondary"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={presetReason === 'Other / Custom reason' && !cancellationReason.trim()}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: (presetReason === 'Other / Custom reason' && !cancellationReason.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (presetReason === 'Other / Custom reason' && !cancellationReason.trim()) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <X size={15} />
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
