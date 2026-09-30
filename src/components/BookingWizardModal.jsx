import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Building,
  Users,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFutureDateString = (daysAhead = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatReadableDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const isPastDate = (selectedDate) => {
  if (!selectedDate) return false;
  return selectedDate < getTodayDateString();
};

const isSlotInPastForToday = (selectedDate, timeStr) => {
  if (!selectedDate || !timeStr) return false;
  const today = getTodayDateString();
  if (selectedDate !== today) return false;

  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let [_, hours, minutes, ampm] = match;
  let h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;

  const slotDate = new Date();
  slotDate.setHours(h, m, 0, 0);
  return slotDate <= new Date();
};

export default function BookingWizardModal({
  isOpen,
  onClose,
  resources = [],
  bookings = [],
  onAddNewBooking,
  preselectedResource = '',
  preselectedDate = ''
}) {
  const [step, setStep] = useState(1);
  const [resource, setResource] = useState(preselectedResource || (resources[0]?.name || ''));
  const [date, setDate] = useState(preselectedDate || '');
  const [dateInputError, setDateInputError] = useState('');
  const [startTime, setStartTime] = useState('11:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState('30');
  const [hasConflict, setHasConflict] = useState(false);
  const [newBookingId, setNewBookingId] = useState('BK-1055');

  const todayStr = getTodayDateString();
  const datePast = (date && isPastDate(date)) || Boolean(dateInputError);
  const dateMissing = !date && !dateInputError;
  const timeSlotPastToday = !datePast && isSlotInPastForToday(date, startTime);
  const step2Invalid = !date || datePast || timeSlotPastToday || hasConflict || Boolean(dateInputError);
  const step3Invalid = !purpose.trim();

  const isNextDisabled =
    (step === 2 && step2Invalid) ||
    (step === 3 && step3Invalid);

  useEffect(() => {
    if (isOpen) {
      if (preselectedResource && preselectedDate) {
        setStep(2);
      } else {
        setStep(1);
      }
      if (preselectedResource) setResource(preselectedResource);
      else if (resources[0]?.name) setResource(resources[0].name);

      if (preselectedDate) setDate(preselectedDate);
      else setDate('');

      setDateInputError('');
      setStartTime('11:00 AM');
      setEndTime('01:00 PM');
      setPurpose('');
      setAttendees('30');
    }
  }, [isOpen, preselectedResource, preselectedDate, resources]);

  // Conflict detection checking both real database bookings and fallback
  useEffect(() => {
    if (!resource || !date) {
      setHasConflict(false);
      return;
    }
    const slotString = `${startTime} - ${endTime}`;
    const conflicting = bookings.some(
      (b) =>
        b.status !== 'Cancelled' &&
        b.resourceName &&
        b.resourceName.toLowerCase() === resource.toLowerCase() &&
        b.date === date &&
        (b.time === slotString || (b.time && b.time.includes(startTime)))
    );
    setHasConflict(conflicting);
  }, [resource, date, startTime, endTime, bookings]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 2) {
      if (step2Invalid) return;
      setStep(3);
    } else if (step === 3) {
      if (step3Invalid) return;
      // Trigger confirmation & confetti
      const genId = 'BK-' + Math.floor(1000 + Math.random() * 9000);
      setNewBookingId(genId);

      const targetRes = resources.find(r => r.name === resource);

      onAddNewBooking({
        id: genId,
        resourceName: resource,
        category: targetRes?.category || '',
        room: targetRes?.location || '',
        date: date,
        time: `${startTime} - ${endTime}`,
        bookedBy: '',
        userRole: '',
        purpose: purpose.trim(),
        status: 'Confirmed',
        attendees: parseInt(attendees) || 0
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setStep(4);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const stepsList = [
    { num: 1, title: 'Select Resource', desc: 'Choose resource type' },
    { num: 2, title: 'Select Date & Time', desc: 'Pick slot & check conflict' },
    { num: 3, title: 'Submit Request', desc: 'Purpose & attendees' },
    { num: 4, title: 'Confirmation', desc: 'Instant booking pass' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border-light)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--glass-border)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Resource Reservation Wizard
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Fast-track 4-step smart campus reservation
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 4-Step Flow Stepper (Matches Reference Image) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            padding: '16px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--glass-border)',
            gap: '8px'
          }}
        >
          {stepsList.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  opacity: isCurrent || isCompleted ? 1 : 0.4
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCompleted
                      ? '#10b981'
                      : isCurrent
                      ? 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginBottom: '4px',
                    boxShadow: isCurrent ? '0 0 12px rgba(99, 102, 241, 0.6)' : 'none'
                  }}
                >
                  {isCompleted ? <Check size={16} /> : s.num}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }} className="hide-on-mobile">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div style={{ padding: '24px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {date && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="#818cf8" />
                    <span>Booking for Selected Date: <strong style={{ color: '#fff' }}>{date}</strong></span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Step 1: Choose venue for this date
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Select Resource / Facility:
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  {resources.length} campus spaces
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {resources.map((r) => {
                  const isSelected = resource === r.name;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setResource(r.name)}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-highlight)' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {r.category} • {r.capacity} Seats
                        </div>
                      </div>
                      <span
                        className={
                          r.status === 'Available'
                            ? 'badge-available'
                            : r.status === 'Booked'
                            ? 'badge-booked'
                            : 'badge-maintenance'
                        }
                        style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}
                      >
                        {r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Reservation Date:</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#818cf8',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '1px 8px',
                        borderRadius: '999px',
                        letterSpacing: '0.3px'
                      }}
                    >
                      Future Dates Only
                    </span>
                  </label>
                  {dateInputError || datePast ? (
                    <span style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 700 }}>
                      Please enter the date correctly
                    </span>
                  ) : dateMissing ? (
                    <span style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 600 }}>
                      Required
                    </span>
                  ) : null}
                </div>

                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    const val = e.target.value;
                    const validity = e.target.validity;
                    if (validity?.badInput) {
                      setDateInputError('Please enter the date correctly');
                      setDate('');
                    } else if (validity?.rangeUnderflow || (val && isPastDate(val))) {
                      setDateInputError('Please enter the date correctly');
                      setDate(val);
                    } else {
                      setDateInputError('');
                      setDate(val);
                    }
                  }}
                  onInput={(e) => {
                    if (e.target.validity?.badInput) {
                      setDateInputError('Please enter the date correctly');
                    } else if (e.target.value && isPastDate(e.target.value)) {
                      setDateInputError('Please enter the date correctly');
                    } else if (e.target.value) {
                      setDateInputError('');
                    }
                  }}
                  className="glass-input"
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    borderColor: dateInputError || datePast ? '#ef4444' : dateMissing ? 'rgba(99, 102, 241, 0.4)' : 'var(--glass-border)'
                  }}
                  required
                />

                {(dateInputError || datePast) && (
                  <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <AlertTriangle size={14} color="#ef4444" />
                    <span>Please enter the date correctly (only current & future dates are allowed).</span>
                  </div>
                )}

                {/* Quick Date Selector Chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '2px' }}>
                    Quick Select:
                  </span>
                  {[
                    { label: `Today (${formatReadableDate(todayStr)})`, val: todayStr },
                    { label: `Tomorrow (${formatReadableDate(getFutureDateString(1))})`, val: getFutureDateString(1) },
                    { label: `+2 Days (${formatReadableDate(getFutureDateString(2))})`, val: getFutureDateString(2) },
                    { label: `Next Week (${formatReadableDate(getFutureDateString(7))})`, val: getFutureDateString(7) },
                    { label: `+1 Month (${formatReadableDate(getFutureDateString(30))})`, val: getFutureDateString(30) }
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => {
                        setDate(chip.val);
                        setDateInputError('');
                      }}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: date === chip.val ? 700 : 500,
                        padding: '3px 10px',
                        borderRadius: '8px',
                        border: date === chip.val ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                        background: date === chip.val ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: date === chip.val ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Start Time:
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    <option value="09:00 AM" style={{ background: '#1e1b4b' }}>09:00 AM</option>
                    <option value="10:00 AM" style={{ background: '#1e1b4b' }}>10:00 AM</option>
                    <option value="11:00 AM" style={{ background: '#1e1b4b' }}>11:00 AM</option>
                    <option value="02:00 PM" style={{ background: '#1e1b4b' }}>02:00 PM</option>
                    <option value="04:00 PM" style={{ background: '#1e1b4b' }}>04:00 PM</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    End Time:
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    <option value="11:00 AM" style={{ background: '#1e1b4b' }}>11:00 AM</option>
                    <option value="12:00 PM" style={{ background: '#1e1b4b' }}>12:00 PM</option>
                    <option value="01:00 PM" style={{ background: '#1e1b4b' }}>01:00 PM</option>
                    <option value="04:00 PM" style={{ background: '#1e1b4b' }}>04:00 PM</option>
                    <option value="06:00 PM" style={{ background: '#1e1b4b' }}>06:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Validation & Conflict Detection Banner */}
              {dateInputError || datePast ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <AlertTriangle size={18} color="#ef4444" />
                  <div>
                    <strong>Please enter the date correctly:</strong> Only current date ({todayStr}) and future dates can be reserved.
                  </div>
                </div>
              ) : dateMissing ? (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--primary-light)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Info size={16} />
                  <span>Only current and future dates are available. Please select today ({todayStr}) or an upcoming date to continue.</span>
                </div>
              ) : timeSlotPastToday ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <AlertTriangle size={18} color="#ef4444" />
                  <div>
                    <strong>Slot Expired for Today:</strong> The start time <strong>{startTime}</strong> has already passed. Please select an upcoming slot.
                  </div>
                </div>
              ) : hasConflict ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <AlertTriangle size={18} color="#ef4444" />
                  <div>
                    <strong>Conflict Detected:</strong> {resource} is already booked on {date} for this time slot. Please choose another slot or facility.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#6ee7b7',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>No scheduling conflicts found. This slot is 100% available!</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Purpose of Booking / Subject: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {step3Invalid && (
                    <span style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 600 }}>
                      Required to continue
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. CS201 Lab Exam / Department Guest Lecture"
                  className="glass-input"
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    borderColor: step3Invalid ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'
                  }}
                />
                {step3Invalid && (
                  <div style={{ color: '#fca5a5', fontSize: '0.74rem', marginTop: '4px' }}>
                    * Please enter the purpose of booking before submitting your request.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Expected Attendees:
                  </label>
                  <input
                    type="number"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Booking Department:
                  </label>
                  <input
                    type="text"
                    defaultValue="Computer Science & Eng"
                    disabled
                    className="glass-input"
                    style={{ width: '100%', marginTop: '6px', opacity: 0.7 }}
                  />
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <strong>Summary:</strong> Requesting <strong>{resource}</strong> on <strong>{date || 'Unspecified date'}</strong> ({startTime} - {endTime}).
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)'
                }}
              >
                <CheckCircle2 size={36} color="#10b981" />
              </div>

              <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '4px' }}>
                Booking Confirmed!
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '380px', marginBottom: '16px' }}>
                Your reservation request for <strong>{resource}</strong> has been confirmed and logged in the central campus registry.
              </p>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px dashed var(--primary-light)',
                  borderRadius: '14px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Reference ID</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                    {newBookingId}
                  </div>
                </div>
                <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Date & Slot</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {date} ({startTime})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          {step > 1 && step < 4 ? (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="btn-glass-secondary"
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className="btn-glass-primary"
              style={{
                padding: '8px 20px',
                fontSize: '0.86rem',
                opacity: isNextDisabled ? 0.45 : 1,
                cursor: isNextDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{step === 3 ? 'Submit Request' : 'Continue'}</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="btn-glass-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Done & View Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
