import React from 'react';
import {
  LayoutDashboard,
  Layers,
  CalendarCheck,
  BookmarkCheck,
  Calendar,
  Bell,
  BarChart3,
  PieChart,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  unreadCount,
  currentRole,
  isMobileOpen,
  setIsMobileOpen,
  onSignOut
}) {
  const roleId = currentRole?.id || 'faculty';
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resources', label: 'Resources', icon: Layers },
    ...(roleId === 'admin'
      ? [
          { id: 'bookings', label: 'All Bookings', icon: CalendarCheck },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: PieChart },
          { id: 'reports', label: 'Reports', icon: BarChart3 }
        ]
      : roleId === 'lab_incharge'
      ? [
          { id: 'bookings', label: 'Lab Bookings', icon: CalendarCheck },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'reports', label: 'Lab Reports', icon: BarChart3 }
        ]
      : roleId === 'support_staff'
      ? [
          { id: 'bookings', label: 'Facility Bookings', icon: CalendarCheck },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'reports', label: 'Facility Reports', icon: BarChart3 }
        ]
      : [
          { id: 'my-bookings', label: 'My Bookings', icon: BookmarkCheck },
          { id: 'calendar', label: 'Calendar', icon: Calendar }
        ]),
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
        />
      )}

      <aside
        style={{
          width: '270px',
          minWidth: '270px',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 45,
          transition: 'transform 0.3s ease',
        }}
        className={`sidebar-nav ${isMobileOpen ? 'mobile-show' : ''}`}
      >
        <div>
          {/* Logo & Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 8px 24px 8px',
              borderBottom: '1px solid var(--glass-border)',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(79, 70, 229, 0.5)',
                color: '#fff'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-highlight)',
                  lineHeight: '1.2'
                }}
              >
                Smart Campus
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.02em'
                }}
              >
                Resource Management
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (setIsMobileOpen) setIsMobileOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: isActive ? '1px solid var(--primary-light)' : '1px solid transparent',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(79, 70, 229, 0.35) 0%, rgba(99, 102, 241, 0.15) 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon
                      size={18}
                      color={isActive ? '#818cf8' : 'currentColor'}
                      style={{ transition: 'color 0.2s ease' }}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Role Info & Logout */}
        <div
          style={{
            paddingTop: '16px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: currentRole.color + '25',
                border: `1px solid ${currentRole.color}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}
            >
              {currentRole.avatar}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {currentRole.user.name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: currentRole.color,
                  fontWeight: 600
                }}
              >
                {currentRole.name}
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '9px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
