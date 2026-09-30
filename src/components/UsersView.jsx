import React, { useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { ROLES } from '../data/mockData';

export default function UsersView({ currentRole }) {
  const [search, setSearch] = useState('');

  if (currentRole?.id !== 'admin') {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '36px 28px' }}>
          <ShieldAlert size={48} color="#f87171" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '8px' }}>
            Administrator Access Only
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Only system administrators can access the full campus member directory and role hierarchy. Your active persona is <strong>{currentRole?.name || 'User'}</strong>.
          </p>
        </div>
      </div>
    );
  }

  const usersList = ROLES.map((role) => ({
    ...role.user,
    roleId: role.id,
    role: role.name,
    avatar: role.avatar,
    color: role.color,
    status: 'Active'
  }));

  const filtered = usersList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Campus Users & Role Hierarchy
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Manage credentials, permissions, and directory of academic & operational personnel
            </p>
          </div>

        </div>

        <div style={{ position: 'relative', maxWidth: '350px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search campus members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map((user) => {
          const matchingRole = ROLES.find(r => r.id === user.roleId);
          const color = matchingRole?.color || '#64748b';
          const isCurrent = currentRole.name === user.role;

          return (
            <div
              key={user.id}
              className="glass-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                border: isCurrent ? `2px solid ${color}` : '1px solid var(--glass-border)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: color + '20',
                      border: `1px solid ${color}50`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    {user.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-highlight)' }}>
                      {user.name}
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: user.color,
                        background: user.color + '15',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <div>🏢 {user.department}</div>
                  <div style={{ marginTop: '3px' }}>✉️ {user.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  {user.status}
                </span>

                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: isCurrent ? color : `${color}20`,
                    border: `1px solid ${color}50`,
                    color: isCurrent ? '#fff' : color,
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {isCurrent ? `Active (${user.role})` : user.role}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
