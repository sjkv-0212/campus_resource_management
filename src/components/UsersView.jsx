import React, { useEffect, useState } from 'react';
import { Check, Clock3, Search, ShieldAlert, X } from 'lucide-react';
import { ROLES } from '../data/mockData';

export default function UsersView({ currentRole }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    if (currentRole?.id !== 'admin') return;
    let isCurrent = true;

    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
        const response = await fetch('http://localhost:4000/api/users', {
          headers: { Authorization: `Bearer ${session.token || ''}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load campus users.');
        if (isCurrent) setUsers(result);
      } catch (loadError) {
        if (isCurrent) setError(loadError.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadUsers();
    return () => { isCurrent = false; };
  }, [currentRole?.id]);

  const updateApproval = async (user, approvalStatus) => {
    setUpdatingId(user.id);
    setError('');
    try {
      const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
      const response = await fetch(`http://localhost:4000/api/users/${encodeURIComponent(user.id)}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token || ''}`
        },
        body: JSON.stringify({ approvalStatus })
      });
      const updatedUser = await response.json();
      if (!response.ok) throw new Error(updatedUser.error || 'Unable to update account approval.');
      setUsers((currentUsers) => currentUsers.map((item) => item.id === user.id ? updatedUser : item));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId('');
    }
  };

  if (currentRole?.id !== 'admin') {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '36px 28px' }}>
          <ShieldAlert size={48} color="#f87171" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '8px' }}>
            Administrator Access Only
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Only administrators can review account requests and view the campus directory.
          </p>
        </div>
      </div>
    );
  }

  const filteredUsers = users
    .slice()
    .sort((first, second) => Number(second.approvalStatus === 'pending') - Number(first.approvalStatus === 'pending'))
    .filter((user) => [user.name, user.email, user.role, user.department]
      .some((value) => String(value || '').toLowerCase().includes(search.toLowerCase())));
  const pendingCount = users.filter((user) => user.approvalStatus === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Campus Users
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {pendingCount} account request{pendingCount === 1 ? '' : 's'} awaiting review
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: '350px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="search"
            aria-label="Search campus users"
            placeholder="Search campus members..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="glass-input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>
      </div>

      {error && <p role="alert" style={{ color: '#fca5a5', margin: 0 }}>{error}</p>}
      {isLoading && <p style={{ color: 'var(--text-muted)' }}>Loading users...</p>}
      {!isLoading && filteredUsers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No users found.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredUsers.map((user) => {
          const matchingRole = ROLES.find((role) => role.id === user.roleId);
          const color = matchingRole?.color || '#64748b';
          const approvalStatus = user.approvalStatus || 'approved';
          const isPending = approvalStatus === 'pending';
          const isUpdating = updatingId === user.id;

          return (
            <div key={user.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: isPending ? '1px solid #fbbf24' : '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    {user.avatar || matchingRole?.avatar || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-highlight)' }}>{user.name}</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color, background: `${color}15`, padding: '2px 8px', borderRadius: '6px' }}>
                      {user.role || matchingRole?.name || user.roleId}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <div>{user.department || 'Department not provided'}</div>
                  <div>{user.email}</div>
                  {user.phone && <div>{user.phone}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.76rem', color: isPending ? '#fbbf24' : approvalStatus === 'approved' ? '#10b981' : '#f87171', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                  {isPending ? <Clock3 size={14} /> : approvalStatus === 'approved' ? <Check size={14} /> : <X size={14} />}
                  {approvalStatus[0].toUpperCase() + approvalStatus.slice(1)}
                </span>
                {isPending && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn-glass-primary" disabled={isUpdating} onClick={() => updateApproval(user, 'approved')}>
                      <Check size={15} /> Approve
                    </button>
                    <button type="button" className="btn-glass-secondary" disabled={isUpdating} onClick={() => updateApproval(user, 'rejected')} style={{ color: '#f87171' }}>
                      <X size={15} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
