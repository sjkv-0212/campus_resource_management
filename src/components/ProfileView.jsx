import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  CheckCircle2,
  Save,
  RotateCcw,
  Lock,
  LogOut,
  AlertCircle
} from 'lucide-react';

export default function ProfileView({ currentRole, setCurrentRole, onSignOut }) {
  const user = currentRole?.user || {};

  const [fullName, setFullName] = useState(user.name || user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [department, setDepartment] = useState(user.department || 'Computer Science & Engineering');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Keep form in sync when currentRole changes
  useEffect(() => {
    setFullName(user.name || user.fullName || '');
    setPhone(user.phone || '');
    setDepartment(user.department || 'Computer Science & Engineering');
  }, [currentRole]);

  const departmentsList = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Dean of Academic Infrastructure',
    'Advanced Computing Labs',
    'Estate & Facilities Support',
    'Administration'
  ];

  const hasChanges =
    fullName.trim() !== (user.name || user.fullName || '').trim() ||
    phone.trim() !== (user.phone || '').trim() ||
    department.trim() !== (user.department || '').trim();

  const handleReset = () => {
    setFullName(user.name || user.fullName || '');
    setPhone(user.phone || '');
    setDepartment(user.department || 'Computer Science & Engineering');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Phone number must contain exactly 10 digits.');
      return;
    }

    setIsSaving(true);
    try {
      const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
      const response = await fetch('http://localhost:4000/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token || ''}`
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone,
          department: department.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.error || 'Failed to update profile.');
        setIsSaving(false);
        return;
      }

      // Update currentRole in React state
      const updatedUser = {
        ...user,
        ...result.user,
        name: result.user.name,
        fullName: result.user.name,
        phone: result.user.phone,
        department: result.user.department
      };

      setCurrentRole(prev => ({
        ...prev,
        user: updatedUser
      }));

      // Update localStorage session
      localStorage.setItem('smart-campus-session', JSON.stringify({
        ...session,
        fullName: result.user.name,
        phone: result.user.phone,
        department: result.user.department
      }));

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setErrorMessage('Cannot reach server. Please ensure backend is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const roleColor = currentRole?.color || '#4f46e5';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              My Profile Information
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: roleColor,
                background: roleColor + '20',
                border: `1px solid ${roleColor}50`,
                padding: '3px 10px',
                borderRadius: '8px'
              }}
            >
              {currentRole?.name || 'Campus Member'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage your verified campus credentials and update your personal information.
          </p>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '0.84rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Main Profile Summary Card */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '24px',
          background: `linear-gradient(135deg, ${roleColor}15 0%, rgba(255,255,255,0.03) 100%)`,
          border: `1px solid ${roleColor}40`
        }}
      >
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${roleColor} 0%, #3b82f6 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.8rem',
            boxShadow: `0 0 24px ${roleColor}60`,
            border: '3px solid rgba(255,255,255,0.3)',
            flexShrink: 0
          }}
        >
          {currentRole?.avatar || '👤'}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              {user.name || user.fullName || 'Campus Member'}
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                padding: '3px 9px',
                borderRadius: '8px'
              }}
            >
              <CheckCircle2 size={13} /> Verified Member
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {currentRole?.name} • {currentRole?.title || 'Campus Member'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '12px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={15} color={roleColor} />
              <span>{user.email || 'campus@ritrjpm.ac.in'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={15} color={roleColor} />
              <span>{user.phone || 'Not provided'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} color={roleColor} />
              <span>{user.department || 'Academic Department'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Card */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Edit Profile Information
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Update and manage your personal contact and academic details.
            </p>
          </div>
          {hasChanges && (
            <span style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.3)', fontWeight: 600 }}>
              Unsaved Changes
            </span>
          )}
        </div>

        {successMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '0.85rem', marginBottom: '20px' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', fontSize: '0.85rem', marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <User size={15} color={roleColor} />
                <span>Full Name</span>
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Priya Sharma"
                className="glass-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Phone size={15} color={roleColor} />
                <span>Phone Number</span>
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone number"
                className="glass-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Department */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Building2 size={15} color={roleColor} />
                <span>Department / Branch</span>
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="glass-input"
                style={{ width: '100%' }}
              >
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept} style={{ background: '#1e1b4b' }}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Institute Email (Read-Only) */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Mail size={15} color="var(--text-muted)" />
                <span>Institute Email (Fixed)</span>
                <Lock size={12} color="var(--text-muted)" />
              </label>
              <input
                type="email"
                disabled
                value={user.email || 'campus@ritrjpm.ac.in'}
                className="glass-input"
                style={{ width: '100%', opacity: 0.65, cursor: 'not-allowed', background: 'rgba(255, 255, 255, 0.02)' }}
                title="Institute email cannot be changed as it is your campus identity."
              />
            </div>

            {/* Assigned Role (Read-Only) */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Shield size={15} color={roleColor} />
                <span>Assigned Campus Role</span>
              </label>
              <input
                type="text"
                disabled
                value={`${currentRole?.name || 'Member'} (${currentRole?.title || ''})`}
                className="glass-input"
                style={{ width: '100%', opacity: 0.65, cursor: 'not-allowed', background: 'rgba(255, 255, 255, 0.02)' }}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="btn-glass-secondary"
              style={{ opacity: hasChanges ? 1 : 0.5, cursor: hasChanges ? 'pointer' : 'not-allowed' }}
            >
              <RotateCcw size={15} />
              <span>Discard Changes</span>
            </button>

            <button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="btn-glass-primary"
              style={{ opacity: hasChanges ? 1 : 0.5, cursor: hasChanges ? 'pointer' : 'not-allowed' }}
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
