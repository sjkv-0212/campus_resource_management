import React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  CheckCheck,
  Trash2,
  Filter
} from 'lucide-react';

export default function NotificationsView({ notifications, setNotifications }) {
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Notifications & Campus Alerts
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Real-time approval updates, booking confirmations and maintenance schedules
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={markAllRead}
              className="btn-glass-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <CheckCheck size={15} color="#10b981" />
              <span>Mark All as Read</span>
            </button>
            <button
              onClick={clearAll}
              className="btn-glass-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <Trash2 size={15} color="#f87171" />
              <span>Clear Feed</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                border: notif.read ? '1px solid var(--glass-border)' : '1px solid rgba(99, 102, 241, 0.4)',
                background: notif.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background:
                      notif.type === 'success'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : notif.type === 'warning'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : notif.type === 'maintenance'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {notif.type === 'success' && <CheckCircle2 size={20} color="#10b981" />}
                  {notif.type === 'warning' && <Clock size={20} color="#f59e0b" />}
                  {notif.type === 'maintenance' && <AlertTriangle size={20} color="#ef4444" />}
                  {notif.type === 'info' && <Layers size={20} color="#3b82f6" />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-highlight)' }}>
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {notif.message}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                {notif.time}
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            You're all caught up! No active notifications.
          </div>
        )}
      </div>
    </div>
  );
}
