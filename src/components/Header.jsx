import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Plus,
  Menu,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';

export default function Header({
  currentRole,
  theme,
  setTheme,
  unreadCount,
  notifications,
  onOpenBookingModal,
  setIsMobileOpen,
  setActiveTab
}) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);

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
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentRole.color} 0%, #3b82f6 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: `0 0 16px ${currentRole.color}60`,
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            {currentRole.avatar}
          </div>
          <div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-highlight)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Welcome, {currentRole.user.name}</span>
              <span>👋</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: currentRole.color,
                  background: currentRole.color + '18',
                  border: `1px solid ${currentRole.color}40`,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                {currentRole.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentRole.user.department}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Mobile Mockup, Theme, Notifications, New Booking */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Assigned Role Badge (Secure, non-switchable) */}
        <div
          title={`Assigned Campus Role: ${currentRole.name}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <span style={{ fontSize: '1.05rem' }}>{currentRole.avatar}</span>
          <span className="hide-on-mobile">Role: <strong style={{ color: currentRole.color || 'var(--primary-light)' }}>{currentRole.name}</strong></span>
        </div>


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
        >
          {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
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
      </div>
    </header>
  );
}
