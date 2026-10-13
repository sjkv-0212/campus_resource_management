import React, { useState } from 'react';
import {
  Layers,
  CalendarDays,
  Clock,
  Hourglass,
  ArrowRight,
  Plus,
  Search,
  Calendar,
  FileText,
  AlertCircle,
  Sparkles,
  MapPin,
  CalendarCheck,
  X
} from 'lucide-react';

export default function DashboardView({
  resources,
  bookings,
  currentRole,
  onOpenBookingModal,
  setActiveTab,
  onSelectResource
}) {
  const [selectedVenueBooking, setSelectedVenueBooking] = useState(null);

  const roleId = currentRole?.id || 'faculty';
  const totalResourcesCount = resources.length;
  const availableResourcesCount = resources.filter(r => r.status === 'Available').length;

  const isPersonalRole = roleId === 'student' || roleId === 'faculty';
  const uName = (currentRole?.user?.name || '').trim().toLowerCase();
  const uEmail = (currentRole?.user?.email || '').trim().toLowerCase();
  const uId = currentRole?.user?.id || currentRole?.id;

  const myBookings = isPersonalRole
    ? bookings.filter(b =>
        (b.bookedById && b.bookedById === uId) ||
        (b.bookedByEmail && b.bookedByEmail.toLowerCase() === uEmail) ||
        (b.bookedBy && b.bookedBy.toLowerCase() === uName)
      )
    : bookings;

  const activeBookings = (isPersonalRole ? myBookings : bookings).filter(b => b.status !== 'Cancelled');
  const confirmedCount = activeBookings.filter(b => b.status === 'Confirmed').length;
  const pendingCount = activeBookings.filter(b => b.status === 'Pending').length;

  // Show newest and pending bookings first so newly requested bookings show immediately
  const displayActiveBookings = [...activeBookings].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (b.status === 'Pending' && a.status !== 'Pending') return 1;
    return (b.date || '').localeCompare(a.date || '');
  });

  const availabilityLabels = {
    Classroom: 'Classrooms',
    Laboratory: 'Laboratories',
    'Seminar Hall': 'Seminar Halls',
    Equipment: 'Projectors & AV'
  };
  const availabilityColors = {
    Classroom: '#10b981',
    Laboratory: '#3b82f6',
    'Seminar Hall': '#8b5cf6',
    Equipment: '#f59e0b'
  };
  const availabilityByCategory = new Map();
  resources.forEach((resource) => {
    const category = resource.category || 'Other';
    const stat = availabilityByCategory.get(category) || {
      category: availabilityLabels[category] || category,
      available: 0,
      total: 0,
      percentage: 0,
      color: availabilityColors[category] || '#0ea5e9'
    };
    stat.total += 1;
    if (resource.status === 'Available') stat.available += 1;
    stat.percentage = Math.round((stat.available / stat.total) * 100);
    availabilityByCategory.set(category, stat);
  });
  const availabilityStats = Array.from(availabilityByCategory.values());

  const statCards = [
    {
      id: 'stat-1',
      title: roleId === 'admin' ? 'Total Campus Resources' : roleId === 'lab_incharge' ? 'Managed Laboratories' : roleId === 'support_staff' ? 'Campus Facilities' : 'Available Spaces',
      value: String(roleId === 'student' || roleId === 'faculty' ? availableResourcesCount : totalResourcesCount),
      label: roleId === 'student' || roleId === 'faculty' ? 'Ready to Book' : 'Catalog Active',
      icon: Layers,
      color: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.15)',
      borderColor: 'rgba(99, 102, 241, 0.3)',
      onClick: () => setActiveTab('resources')
    },
    {
      id: 'stat-2',
      title: roleId === 'admin' ? 'Total Reservations' : roleId === 'lab_incharge' ? 'Lab Bookings' : roleId === 'support_staff' ? 'Facility Bookings' : 'My Active Bookings',
      value: String(activeBookings.length),
      label: roleId === 'admin' ? 'All Roles Combined' : roleId === 'lab_incharge' ? 'In Your Labs' : roleId === 'support_staff' ? 'In Facilities' : 'Personal Reservations',
      icon: CalendarDays,
      color: '#0ea5e9',
      bgGlow: 'rgba(14, 165, 233, 0.15)',
      borderColor: 'rgba(14, 165, 233, 0.3)',
      onClick: () => setActiveTab(roleId === 'student' || roleId === 'faculty' ? 'my-bookings' : 'bookings')
    },
    {
      id: 'stat-3',
      title: 'Active / Confirmed',
      value: String(confirmedCount),
      label: 'Approved & Scheduled',
      icon: Clock,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      onClick: () => setActiveTab(roleId === 'student' || roleId === 'faculty' ? 'my-bookings' : 'bookings')
    },
    {
      id: 'stat-4',
      title: roleId === 'admin' || roleId === 'lab_incharge' || roleId === 'support_staff' ? 'Pending Approvals' : 'Pending Requests',
      value: String(pendingCount),
      label: roleId === 'admin' || roleId === 'lab_incharge' || roleId === 'support_staff' ? 'Awaiting Your Review' : 'Under Review',
      icon: Hourglass,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      onClick: () => setActiveTab(roleId === 'student' || roleId === 'faculty' ? 'my-bookings' : 'bookings')
    }
  ];

  const isAdmin = roleId === 'admin';
  const cancelledBookings = myBookings.filter(b => b.status === 'Cancelled' && (b.cancellationReason || b.cancelledBy));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      
      {/* Cancellation Notice Banner for User */}
      {cancelledBookings.length > 0 && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertCircle size={22} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fca5a5' }}>
                Reservation Cancelled by {cancelledBookings[0].cancelledBy || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Your booking for <strong style={{ color: '#fff' }}>{cancelledBookings[0].resourceName}</strong> on {cancelledBookings[0].date} ({cancelledBookings[0].time}) was cancelled.
                {cancelledBookings[0].cancellationReason && (
                  <span style={{ color: '#fca5a5', fontWeight: 600 }}> Reason: "{cancelledBookings[0].cancellationReason}"</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab(isPersonalRole ? 'my-bookings' : 'bookings')}
            className="btn-glass-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '8px 16px',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>View All Cancelled</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 4 Glassmorphic Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px'
        }}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              onClick={stat.onClick}
              className="glass-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: `1px solid ${stat.borderColor}`,
                background: `linear-gradient(135deg, ${stat.bgGlow} 0%, rgba(255,255,255,0.02) 100%)`
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: stat.color + '20',
                  border: `1px solid ${stat.color}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 15px ${stat.color}40`
                }}
              >
                <Icon size={26} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {stat.title}
                </div>
                <div
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-highlight)',
                    lineHeight: '1.1',
                    marginTop: '2px'
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Grid: Row 1 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Widget 1: Upcoming Bookings */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                {isPersonalRole ? 'My Upcoming Reservations' : 'Upcoming Bookings'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {isPersonalRole ? 'Your requested and approved campus slots' : 'Allocated slots across campus venues'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab(isPersonalRole ? 'my-bookings' : 'bookings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-light)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>{isPersonalRole ? 'View My Bookings' : 'View All Bookings'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayActiveBookings.length > 0 ? (
              displayActiveBookings.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  className="hover-card-highlight"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-highlight)' }}>
                        {item.resourceName}
                      </span>
                      <span
                        className={
                          item.status === 'Confirmed'
                            ? 'badge-confirmed'
                            : item.status === 'Pending'
                            ? 'badge-pending'
                            : 'badge-maintenance'
                        }
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {item.status === 'Confirmed' ? '✓ Approved' : item.status === 'Pending' ? '⏳ Pending Approval' : item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {item.date} • {item.time}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--primary-light)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      <span>{item.room}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedVenueBooking(item)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-main)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    Details
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '28px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No active reservations right now. Cancelled bookings can be reviewed in your bookings history.
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Resource Availability (Today) */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                Resource Availability <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>(Today)</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Live occupancy rate across campus facilities
              </p>
            </div>
            <button
              onClick={() => setActiveTab('resources')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-light)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>View All Resources</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {availabilityStats.length > 0 ? availabilityStats.map((stat) => (
              <div key={stat.category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stat.category}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <strong style={{ color: 'var(--text-highlight)' }}>{stat.available}</strong> / {stat.total} Available ({stat.percentage}%)
                  </span>
                </div>
                
                {/* Progress bar */}
                <div
                  style={{
                    height: '8px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${stat.percentage}%`,
                      background: `linear-gradient(90deg, ${stat.color} 0%, #06b6d4 100%)`,
                      borderRadius: '999px',
                      boxShadow: `0 0 10px ${stat.color}80`,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No resources have been added yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid: Row 2 - Quick Actions */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            Quick Actions
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            One-click shortcuts to common campus operations
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px'
          }}
        >
          {isPersonalRole ? (
            <button
              onClick={onOpenBookingModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(99, 102, 241, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.25)'
              }}
              className="quick-action-btn"
            >
              <div style={{ background: '#4f46e5', padding: '8px', borderRadius: '10px' }}>
                <Plus size={18} color="#fff" />
              </div>
              <span>New Booking</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('bookings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(99, 102, 241, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.25)'
              }}
              className="quick-action-btn"
            >
              <div style={{ background: '#4f46e5', padding: '8px', borderRadius: '10px' }}>
                <CalendarCheck size={18} color="#fff" />
              </div>
              <span>
                {roleId === 'admin'
                  ? 'Review Bookings'
                  : roleId === 'lab_incharge'
                  ? 'Lab Bookings'
                  : 'Facility Bookings'}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('resources')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s'
            }}
            className="quick-action-btn"
          >
            <div style={{ background: 'rgba(14, 165, 233, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Search size={18} color="#38bdf8" />
            </div>
            <span>Check Availability</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s'
            }}
            className="quick-action-btn"
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Calendar size={18} color="#34d399" />
            </div>
            <span>View Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab(isPersonalRole ? 'my-bookings' : roleId === 'admin' ? 'reports' : 'bookings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s'
            }}
            className="quick-action-btn"
          >
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px' }}>
              {isPersonalRole ? <Clock size={18} color="#fbbf24" /> : <FileText size={18} color="#fbbf24" />}
            </div>
            <span>{isPersonalRole ? 'My Bookings' : 'Audit Reports'}</span>
          </button>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={14} color="#818cf8" />
          <span>Real-time conflict detection active for all new reservation requests.</span>
        </div>
      </div>

      {/* Venue & Booking Details Modal */}
      {selectedVenueBooking && (() => {
        const venueResource = resources.find(
          (r) => (r.name || '').trim().toLowerCase() === (selectedVenueBooking.resourceName || '').trim().toLowerCase()
        ) || null;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px'
            }}
            onClick={() => setSelectedVenueBooking(null)}
          >
            <div
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Image / Pattern Banner */}
              <div
                style={{
                  height: venueResource?.image ? '160px' : '100px',
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.35) 0%, rgba(6, 182, 212, 0.25) 100%)',
                  overflow: 'hidden'
                }}
              >
                {venueResource?.image && (
                  <img
                    src={venueResource.image}
                    alt={selectedVenueBooking.resourceName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <button
                  onClick={() => setSelectedVenueBooking(null)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '16px',
                    display: 'flex',
                    gap: '8px'
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {venueResource?.category || selectedVenueBooking.category || 'Campus Facility'}
                  </span>
                  <span
                    style={{
                      background: selectedVenueBooking.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(245, 158, 11, 0.85)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '999px'
                    }}
                  >
                    {selectedVenueBooking.status}
                  </span>
                </div>
              </div>

              {/* Venue Body Details */}
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '4px' }}>
                    {selectedVenueBooking.resourceName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    <MapPin size={14} color="var(--primary-light)" />
                    <span>{selectedVenueBooking.room || venueResource?.location || 'Campus Premises'}</span>
                  </div>
                </div>

                {/* Venue Specifications Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.8rem',
                    marginBottom: '16px'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>SEATING CAPACITY</span>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {venueResource?.capacity ? `${venueResource.capacity} Seats` : 'Open Capacity'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>VENUE IN-CHARGE</span>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {venueResource?.inCharge || 'Department Admin'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>SCHEDULED DATE</span>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {selectedVenueBooking.date}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>TIME ALLOCATION</span>
                    <div style={{ fontWeight: 700, color: '#34d399' }}>
                      {selectedVenueBooking.time}
                    </div>
                  </div>
                </div>

                {/* Equipment & Facilities available */}
                {venueResource?.equipment && venueResource.equipment.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      VENUE EQUIPMENT:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {venueResource.equipment.map((eq, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            color: 'var(--text-muted)'
                          }}
                        >
                          ✓ {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host / Booking Party Info */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    fontSize: '0.78rem',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Host / Reserved By:</span>{' '}
                      <strong style={{ color: 'var(--text-highlight)' }}>{selectedVenueBooking.bookedBy}</strong>{' '}
                      {selectedVenueBooking.userRole && (
                        <span style={{ color: 'var(--primary-light)', fontSize: '0.72rem' }}>
                          ({selectedVenueBooking.userRole})
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {selectedVenueBooking.id}
                    </span>
                  </div>
                  {selectedVenueBooking.purpose && (
                    <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{selectedVenueBooking.purpose}"
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions - Keeping booking separate */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedVenueBooking(null)}
                    className="btn-glass-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                  >
                    Close
                  </button>

                  {roleId === 'admin' ? (
                    <button
                      onClick={() => {
                        const targetName = selectedVenueBooking.resourceName;
                        setSelectedVenueBooking(null);
                        if (onSelectResource) onSelectResource({ resourceName: targetName });
                      }}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>⚡ Admin Reserve Venue</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const targetName = selectedVenueBooking.resourceName;
                        setSelectedVenueBooking(null);
                        if (onSelectResource) onSelectResource({ resourceName: targetName });
                      }}
                      className="btn-glass-primary"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                    >
                      <Plus size={15} />
                      <span>Book This Venue</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
