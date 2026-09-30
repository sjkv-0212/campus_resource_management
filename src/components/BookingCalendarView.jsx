import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  MapPin,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building,
  Users,
  Eye,
  CalendarCheck
} from 'lucide-react';

// Robust date normalization helper converting any date representation to 'YYYY-MM-DD'
export function toDateKey(dateInput) {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}

const STATUS_CONFIG = {
  Confirmed: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', badgeBg: 'rgba(16, 185, 129, 0.25)' },
  Pending: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', badgeBg: 'rgba(245, 158, 11, 0.25)' },
  Approved: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#60a5fa', badgeBg: 'rgba(59, 130, 246, 0.25)' },
  Cancelled: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171', badgeBg: 'rgba(239, 68, 68, 0.25)' }
};

const CATEGORIES = ['All', 'Classroom', 'Laboratory', 'Seminar Hall', 'Equipment'];

export default function BookingCalendarView({
  resources = [],
  bookings = [],
  currentRole = null,
  onOpenBookingModal,
  onBookSlot
}) {
  const isAdmin = currentRole?.id === 'admin';
  const canBook = currentRole?.id === 'student' || currentRole?.id === 'faculty' || isAdmin;

  // Calendar View Mode: 'Month' (default actual calendar), 'Week', 'Day'
  const [viewMode, setViewMode] = useState('Month');

  // Currently viewed date in calendar navigation
  const [currentDate, setCurrentDate] = useState(() => {
    // If there are bookings, pick the latest booking date or fallback to today
    return new Date();
  });

  // Selected booking modal state
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Past date warning toast message
  const [pastDateWarning, setPastDateWarning] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [onlyMyBookings, setOnlyMyBookings] = useState(false);

  const todayKey = toDateKey(new Date());

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'Month') {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === 'Week') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'Month') {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === 'Week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter bookings based on current search & category
  const filteredBookings = useMemo(() => {
    const uName = (currentRole?.user?.name || '').trim().toLowerCase();
    const uEmail = (currentRole?.user?.email || '').trim().toLowerCase();
    const uId = currentRole?.user?.id || currentRole?.id;

    return bookings.filter((b) => {
      if (onlyMyBookings) {
        const matchesUser =
          (b.bookedById && b.bookedById === uId) ||
          (b.bookedByEmail && b.bookedByEmail.toLowerCase() === uEmail) ||
          (b.bookedBy && b.bookedBy.toLowerCase() === uName);
        if (!matchesUser) return false;
      }

      if (categoryFilter !== 'All') {
        if ((b.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          (b.resourceName || '').toLowerCase().includes(q) ||
          (b.bookedBy || '').toLowerCase().includes(q) ||
          (b.purpose || '').toLowerCase().includes(q) ||
          (b.room || '').toLowerCase().includes(q) ||
          (b.id || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, categoryFilter, onlyMyBookings, currentRole]);

  // Group bookings by dateKey for fast lookup
  const bookingsByDate = useMemo(() => {
    const map = new Map();
    filteredBookings.forEach((b) => {
      const key = toDateKey(b.date);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return map;
  }, [filteredBookings]);

  // Generate Month Grid (Sunday - Saturday)
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isPast: key < todayKey
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isPast: key < todayKey
      });
    }

    // Next month padding days to complete full grid (35 or 42 cells)
    const targetLength = days.length > 35 ? 42 : 35;
    const remaining = targetLength - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isPast: key < todayKey
      });
    }

    return days;
  }, [currentDate, todayKey]);

  // Generate Week Days (7 days of current week, Sunday to Saturday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 = Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = toDateKey(d);
      return {
        date: d,
        dateKey: key,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayLong: d.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: key === todayKey,
        isPast: key < todayKey
      };
    });
  }, [currentDate, todayKey]);

  // Title strings for header
  const headerTitle = useMemo(() => {
    if (viewMode === 'Month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'Week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.monthName} ${start.dayNumber} – ${end.monthName} ${end.dayNumber}, ${end.date.getFullYear()}`;
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [viewMode, currentDate, weekDays]);

  const handleCellClickToBook = (dateKey) => {
    if (dateKey && dateKey < todayKey) {
      setPastDateWarning(`You cannot book in a past date (${dateKey}). Reservations are only permitted for today or future dates.`);
      return; // Stop immediately, do not open booking page!
    }
    setPastDateWarning('');
    if (!canBook) return;
    if (onBookSlot) {
      onBookSlot('', dateKey);
    } else if (onOpenBookingModal) {
      onOpenBookingModal();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Calendar Top Control Header */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.4)'
                }}
              >
                <CalendarIcon size={22} color="#818cf8" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                  Campus Booking Calendar
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Browse real-time reservation schedules and room allocations across the campus
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls: Mode switcher, Navigation, +Book Slot */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* View Mode Switcher: Month / Week / Day */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '4px'
              }}
            >
              {['Month', 'Week', 'Day'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === mode ? 'var(--primary)' : 'transparent',
                    color: viewMode === mode ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: viewMode === mode ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === mode ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Navigator: Prev, Today, Next */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '4px 8px'
              }}
            >
              <button
                onClick={handlePrev}
                title="Previous"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={handleToday}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--primary-light)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Today
              </button>

              <span
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: 'var(--text-highlight)',
                  minWidth: viewMode === 'Week' ? '180px' : '140px',
                  textAlign: 'center'
                }}
              >
                {headerTitle}
              </span>

              <button
                onClick={handleNext}
                title="Next"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {canBook && (
              <button
                onClick={onOpenBookingModal}
                className={isAdmin ? "" : "btn-glass-primary"}
                style={isAdmin ? {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  color: '#fff',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                } : { padding: '8px 16px', fontSize: '0.84rem' }}
              >
                <Plus size={15} />
                <span>{isAdmin ? '+ Admin Book Slot' : '+ Book Slot'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar: Search, Categories, My Bookings toggle & Status Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid var(--glass-border)'
          }}
        >
          {/* Left filters: Search & Category pills */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="text"
                placeholder="Search room or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input"
                style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem' }}
              />
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: categoryFilter === cat ? 'var(--primary)' : 'var(--glass-border)',
                    background: categoryFilter === cat ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    color: categoryFilter === cat ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.74rem',
                    fontWeight: categoryFilter === cat ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* My Bookings Only Filter */}
            {canBook && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  color: onlyMyBookings ? 'var(--primary-light)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginLeft: '4px'
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyMyBookings}
                  onChange={(e) => setOnlyMyBookings(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <span>My Bookings Only</span>
              </label>
            )}
          </div>

          {/* Status Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Status:</span>
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: cfg.border,
                    boxShadow: `0 0 6px ${cfg.border}`
                  }}
                />
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past Date Warning Alert Banner */}
      {pastDateWarning && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.28) 0%, rgba(245, 158, 11, 0.18) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertCircle size={20} color="#fca5a5" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                Cannot Book Past Date
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fecaca', marginTop: '2px' }}>
                {pastDateWarning}
              </div>
            </div>
          </div>

          <button
            onClick={() => setPastDateWarning('')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ACTUAL CALENDAR: MONTH VIEW (Standard 7-column calendar grid) */}
      {/* ========================================================================= */}
      {viewMode === 'Month' && (
        <div
          className="glass-panel"
          style={{
            padding: '16px',
            overflowX: 'auto',
            background: 'rgba(15, 23, 42, 0.45)',
            border: '1px solid var(--glass-border)'
          }}
        >
          {/* Days of week header: Sun, Mon, Tue, Wed, Thu, Fri, Sat */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '8px',
              marginBottom: '10px'
            }}
          >
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => (
              <div
                key={dayName}
                style={{
                  textAlign: 'center',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.04em',
                  color: idx === 0 || idx === 6 ? 'var(--primary-light)' : 'var(--text-main)',
                  textTransform: 'uppercase'
                }}
              >
                <span>{dayName}</span>
              </div>
            ))}
          </div>

          {/* Month Calendar Cells (7 x 5 or 7 x 6 grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '8px'
            }}
          >
            {monthGridDays.map((dayObj, idx) => {
              const dayBookings = bookingsByDate.get(dayObj.dateKey) || [];
              const hasBookings = dayBookings.length > 0;

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: '120px',
                    borderRadius: '12px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: dayObj.isToday
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.6) 100%)'
                      : dayObj.isCurrentMonth
                      ? 'rgba(255, 255, 255, 0.025)'
                      : 'rgba(0, 0, 0, 0.25)',
                    border: dayObj.isToday
                      ? '2px solid rgba(99, 102, 241, 0.6)'
                      : '1px solid var(--glass-border)',
                    boxShadow: dayObj.isToday ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none',
                    opacity: dayObj.isCurrentMonth ? 1 : 0.45,
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Top Bar of Day Cell: Date number, Today badge, Book Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: dayObj.isToday ? 800 : 700,
                          color: dayObj.isToday ? '#ffffff' : dayObj.isCurrentMonth ? 'var(--text-highlight)' : 'var(--text-dim)',
                          width: dayObj.isToday ? '24px' : 'auto',
                          height: dayObj.isToday ? '24px' : 'auto',
                          borderRadius: '50%',
                          background: dayObj.isToday ? 'var(--primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {dayObj.dayNumber}
                      </span>

                      {dayObj.isToday && (
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            color: '#818cf8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          Today
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {hasBookings && (
                        <span
                          style={{
                            fontSize: '0.66rem',
                            padding: '1px 6px',
                            borderRadius: '999px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: 'var(--primary-light)',
                            fontWeight: 700
                          }}
                        >
                          {dayBookings.length}
                        </span>
                      )}

                      {canBook && !dayObj.isPast && (
                        <button
                          onClick={() => handleCellClickToBook(dayObj.dateKey)}
                          title={`Book on ${dayObj.dateKey}`}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.7rem'
                          }}
                        >
                          <Plus size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Displayed Inside This Calendar Day */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      flex: 1,
                      overflowY: 'auto',
                      maxHeight: '110px'
                    }}
                  >
                    {hasBookings ? (
                      dayBookings.map((b) => {
                        const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.Confirmed;
                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedEvent(b)}
                            title={`Click to view details: ${b.resourceName} (${b.time})`}
                            style={{
                              background: cfg.bg,
                              borderLeft: `3px solid ${cfg.border}`,
                              borderRadius: '6px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = `0 4px 10px ${cfg.bg}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {/* Resource Name */}
                            <div
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: 'var(--text-highlight)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {b.resourceName}
                            </div>

                            {/* Time Slot */}
                            <div
                              style={{
                                fontSize: '0.67rem',
                                color: cfg.text,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontWeight: 600
                              }}
                            >
                              <Clock size={10} />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {b.time}
                              </span>
                            </div>

                            {/* Booked By Person */}
                            <div
                              style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              👤 {b.bookedBy}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      canBook && (
                        <div
                          onClick={() => handleCellClickToBook(dayObj.dateKey)}
                          style={{
                            height: '100%',
                            minHeight: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px',
                            border: '1px dashed transparent',
                            color: dayObj.isPast ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            cursor: dayObj.isPast ? 'not-allowed' : 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (dayObj.isPast) {
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                              e.currentTarget.style.color = '#fca5a5';
                            } else {
                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                              e.currentTarget.style.color = 'var(--text-dim)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = dayObj.isPast ? 'rgba(255, 255, 255, 0.15)' : 'transparent';
                          }}
                        >
                          {dayObj.isPast ? 'Past Date' : '+ Book'}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEK VIEW (7 Column schedule planner with full cards) */}
      {/* ========================================================================= */}
      {viewMode === 'Week' && (
        <div
          className="glass-panel"
          style={{
            padding: '16px',
            overflowX: 'auto',
            background: 'rgba(15, 23, 42, 0.45)',
            border: '1px solid var(--glass-border)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(180px, 1fr))',
              gap: '12px'
            }}
          >
            {weekDays.map((dayObj) => {
              const dayBookings = bookingsByDate.get(dayObj.dateKey) || [];

              return (
                <div
                  key={dayObj.dateKey}
                  style={{
                    background: dayObj.isToday
                      ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: dayObj.isToday
                      ? '1px solid rgba(99, 102, 241, 0.5)'
                      : '1px solid var(--glass-border)',
                    borderRadius: '14px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '440px'
                  }}
                >
                  {/* Column Header */}
                  <div
                    style={{
                      textAlign: 'center',
                      paddingBottom: '10px',
                      marginBottom: '12px',
                      borderBottom: '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {dayObj.dayName}
                    </div>
                    <div
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: dayObj.isToday ? 'var(--primary-light)' : 'var(--text-highlight)',
                        marginTop: '2px'
                      }}
                    >
                      {dayObj.dayNumber}
                    </div>
                    {dayObj.isToday && (
                      <span
                        style={{
                          fontSize: '0.64rem',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontWeight: 700
                        }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Bookings Stack in Week View */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    {dayBookings.length > 0 ? (
                      dayBookings.map((b) => {
                        const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.Confirmed;
                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedEvent(b)}
                            style={{
                              background: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              borderRadius: '10px',
                              padding: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              boxShadow: `0 4px 12px ${cfg.bg}`,
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: cfg.badgeBg,
                                  color: cfg.text,
                                  fontWeight: 800
                                }}
                              >
                                {b.status}
                              </span>
                              <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>
                                {b.id}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-highlight)', marginTop: '2px' }}>
                              {b.resourceName}
                            </div>

                            <div style={{ fontSize: '0.72rem', color: cfg.text, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Clock size={12} />
                              <span>{b.time}</span>
                            </div>

                            {b.room && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={11} color="var(--primary-light)" />
                                <span>{b.room}</span>
                              </div>
                            )}

                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              👤 <strong>{b.bookedBy}</strong>
                            </div>

                            {b.purpose && (
                              <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                "{b.purpose}"
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '16px',
                          textAlign: 'center'
                        }}
                      >
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                          No reservations
                        </p>
                        {dayObj.isPast ? (
                          <div
                            onClick={() => handleCellClickToBook(dayObj.dateKey)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              color: 'var(--text-dim)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}
                            title="Past date — cannot book"
                          >
                            <span>Past Date</span>
                            <span style={{ fontSize: '0.66rem', color: '#fca5a5' }}>Closed</span>
                          </div>
                        ) : canBook && (
                          <button
                            onClick={() => handleCellClickToBook(dayObj.dateKey)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: 'var(--primary-light)',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            + Book Slot
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DAY VIEW (Detailed chronological schedule for current date) */}
      {/* ========================================================================= */}
      {viewMode === 'Day' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Full agenda for all scheduled smart campus rooms and equipment
              </p>
            </div>
            {toDateKey(currentDate) < todayKey ? (
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#fca5a5',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '8px'
                }}
              >
                Past Date — Reservations Closed
              </span>
            ) : canBook && (
              <button
                onClick={() => handleCellClickToBook(toDateKey(currentDate))}
                className="btn-glass-primary"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Plus size={14} />
                <span>+ Book On This Date</span>
              </button>
            )}
          </div>

          {(() => {
            const dayKey = toDateKey(currentDate);
            const isDayPast = dayKey < todayKey;
            const dayBookings = bookingsByDate.get(dayKey) || [];

            if (dayBookings.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '14px' }}>
                  <CalendarCheck size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '4px' }}>
                    No bookings scheduled for this date
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {isDayPast ? 'This date has passed. Bookings can only be made for today or future dates.' : 'All rooms, labs, and equipment are currently open for reservation.'}
                  </p>
                  {!isDayPast && canBook && (
                    <button
                      onClick={() => handleCellClickToBook(dayKey)}
                      className="btn-glass-primary"
                      style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                    >
                      Reserve Now
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {dayBookings.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.Confirmed;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedEvent(b)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${cfg.border}`,
                        borderLeft: `4px solid ${cfg.border}`,
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: cfg.badgeBg,
                            color: cfg.text
                          }}
                        >
                          {b.status}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{b.id}</span>
                      </div>

                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '6px' }}>
                        {b.resourceName}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cfg.text, fontWeight: 600 }}>
                          <Clock size={13} />
                          <span>{b.time}</span>
                        </div>
                        {b.room && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={13} color="var(--primary-light)" />
                            <span>{b.room}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#34d399" />
                          <span>Booked by: <strong style={{ color: 'var(--text-main)' }}>{b.bookedBy}</strong></span>
                        </div>
                        {b.purpose && (
                          <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Purpose: "{b.purpose}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOOKING DETAIL MODAL (Opens when clicking any booking card) */}
      {/* ========================================================================= */}
      {selectedEvent && (
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
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              borderRadius: '20px',
              border: `1px solid ${STATUS_CONFIG[selectedEvent.status]?.border || 'rgba(99, 102, 241, 0.4)'}`,
              boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Status and Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: STATUS_CONFIG[selectedEvent.status]?.badgeBg,
                    color: STATUS_CONFIG[selectedEvent.status]?.text,
                    border: `1px solid ${STATUS_CONFIG[selectedEvent.status]?.border}`
                  }}
                >
                  {selectedEvent.status}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  {selectedEvent.id}
                </span>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Resource Title */}
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '4px' }}>
              {selectedEvent.resourceName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {selectedEvent.category || 'Campus Resource'}
            </p>

            {/* Detailed Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                marginBottom: '20px',
                fontSize: '0.82rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>DATE</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedEvent.date}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>TIME SLOT</div>
                <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                  {selectedEvent.time}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>LOCATION / ROOM</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedEvent.room || 'Campus Premises'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>ATTENDEES</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedEvent.attendees ? `${selectedEvent.attendees} People` : 'Standard'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>BOOKED BY</div>
                <div style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>
                  {selectedEvent.bookedBy}{' '}
                  {selectedEvent.userRole && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                      ({selectedEvent.userRole})
                    </span>
                  )}
                </div>
                {selectedEvent.bookedByEmail && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {selectedEvent.bookedByEmail}
                  </div>
                )}
              </div>

              {selectedEvent.purpose && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>PURPOSE</div>
                  <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>
                    "{selectedEvent.purpose}"
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-glass-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                Close
              </button>
              {canBook && (
                <button
                  onClick={() => {
                    const resName = selectedEvent.resourceName;
                    setSelectedEvent(null);
                    if (onBookSlot) {
                      onBookSlot(resName, '');
                    }
                  }}
                  className="btn-glass-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                >
                  <Plus size={15} />
                  <span>Book Similar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
