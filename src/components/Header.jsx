import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Plus,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  User,
  ArrowRight
} from 'lucide-react';

export default function Header({
  currentRole,
  theme,
  setTheme,
  unreadCount,
  notifications,
  onOpenBookingModal,
  setIsMobileOpen,
  setActiveTab,
  activeTab
}) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = currentRole?.user || {};
  const userName = user.name || user.fullName || 'Campus Member';
  const userDept = user.department || 'Campus Department';
  const userRoleName = currentRole?.name || user.role || 'Member';
  const roleColor = currentRole?.color || '#4f46e5';
  const userAvatar = currentRole?.avatar || '👤';
  const isProfileActive = activeTab === 'profile';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      {/* Left: Hamburger & User Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setIsMobileOpen(prev => !prev)}
          className="mobile-hamburger"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px'
          }}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div
          onClick={() => setActiveTab('profile')}
          title="Click to view & edit your profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '12px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${roleColor} 0%, #3b82f6 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              boxShadow: `0 0 16px ${roleColor}60`,
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            {userAvatar}
          </div>
          <div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-highlight)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Welcome, {userName}</span>
              <span>👋</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: roleColor,
                  background: roleColor + '18',
                  border: `1px solid ${roleColor}40`,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                {userRoleName}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {userDept}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls: New Booking, Theme, Notifications, and Corner Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick New Booking Button (Only for Students and Faculty) */}
        {(currentRole?.id === 'student' || currentRole?.id === 'faculty') && (
          <button
            onClick={onOpenBookingModal}
            className="btn-glass-primary"
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <Plus size={16} />
            <span className="hide-on-mobile">+ New Booking</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Light/Dark Glass"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
          aria-label="Toggle light or dark theme"
        >
          {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
                  border: '2px solid var(--bg-base)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '340px',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border-light)',
                borderRadius: '18px',
                padding: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                zIndex: 60
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-highlight)' }}>
                  Notifications
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                  {unreadCount} New
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.12)',
                      border: notif.read ? '1px solid var(--glass-border)' : '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      gap: '10px'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {notif.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
                      {notif.type === 'warning' && <Clock size={16} color="#f59e0b" />}
                      {notif.type === 'maintenance' && <AlertTriangle size={16} color="#ec4899" />}
                      {notif.type === 'info' && <Layers size={16} color="#3b82f6" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {notif.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowNotifMenu(false);
                  setActiveTab('notifications');
                }}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '8px',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  color: 'var(--primary-light)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>

        {/* Profile in the Corner (Opens Profile Page directly) */}
        <div>
          <button
            onClick={() => setActiveTab('profile')}
            id="corner-profile-button"
            title="Open Profile Page"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px 4px 6px',
              borderRadius: '14px',
              background: isProfileActive
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(6, 182, 212, 0.25) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: isProfileActive ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isProfileActive ? '0 0 16px rgba(99, 102, 241, 0.4)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isProfileActive) {
                e.currentTarget.style.borderColor = 'var(--primary-light)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProfileActive) {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
          >
            {/* Corner Avatar Circle */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${roleColor} 0%, #3b82f6 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                boxShadow: `0 0 10px ${roleColor}50`,
                border: '1.5px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {userAvatar}
            </div>

            {/* Corner Name & Role Tag */}
            <div className="hide-on-mobile" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: isProfileActive ? '#fff' : 'var(--text-highlight)',
                  lineHeight: '1.2',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {userName}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: roleColor,
                  lineHeight: '1.1'
                }}
              >
                {userRoleName}
              </span>
            </div>

            <User
              size={14}
              color={isProfileActive ? '#818cf8' : 'var(--text-muted)'}
              style={{ marginLeft: '2px' }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
