import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { ROLES } from '../data/mockData';

export default function AuthView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [selectedRoleId, setSelectedRoleId] = useState('faculty');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();

    if (isRegister) {
      if (!/^[^\s@]+@ritrjpm\.ac\.in$/i.test(normalizedEmail)) {
        setError('Use your institute email in the format name@ritrjpm.ac.in.');
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        setError('Phone number must contain exactly 10 digits.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:4000/api/auth/' + (isRegister ? 'register' : 'login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          ...(isRegister ? { fullName: fullName.trim(), roleId: selectedRoleId, phone, department } : {})
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to authenticate. Please try again.');
        return;
      }
      if (isRegister && response.status === 202) {
        setMessage(result.message || 'Registration submitted. Wait for administrator approval before logging in.');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      const matchedRole = result.role || ROLES.find((role) => role.id === result.user.roleId) || ROLES[1];
      localStorage.setItem('smart-campus-session', JSON.stringify({
        token: result.token,
        roleId: result.user.roleId,
        fullName: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        department: result.user.department
      }));
      onLoginSuccess({
        ...matchedRole,
        token: result.token,
        user: { ...matchedRole.user, ...result.user, name: result.user.name }
      });
    } catch {
      setError('Cannot connect to the server. Start the backend and try again.');
    }
  };

  const switchMode = (register) => {
    setIsRegister(register);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        minHeight: 'calc(100vh - 80px)'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '900px'
        }}
      >
        {/* Auth Form Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span
              style={{
                background: '#4f46e5',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}
            >
              {isRegister ? 'REGISTER' : 'LOGIN'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '4px' }}>
            {isRegister ? 'Create Account' : 'Welcome Back!'}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {isRegister
              ? 'Join the Smart Campus Resource Network'
              : 'Sign in to access campus reservation portal'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    className="glass-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="glass-input" style={{ width: '100%', marginTop: '6px' }}>
                    {['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Administration'].map((item) => (
                      <option key={item} value={item} style={{ background: '#1e1b4b' }}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {isRegister && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Email / Username
              </label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ritrjpm.ac.in"
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Password
                </label>
                {!isRegister && (
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Reset link sent to campus email'); }} style={{ fontSize: '0.74rem', color: 'var(--primary-light)', textDecoration: 'none' }}>
                    Forgot Password?
                  </a>
                )}
              </div>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Select Role
                </label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%' }}
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id} style={{ background: '#1e1b4b' }}>
                        {r.avatar} {r.name} — {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-glass-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px', fontSize: '0.92rem' }}
            >
              <span>{isRegister ? 'Register Account' : 'Login'}</span>
              <ArrowRight size={16} />
            </button>
            {error && <p role="alert" style={{ color: '#fca5a5', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{error}</p>}
            {message && <p role="status" style={{ color: '#86efac', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{message}</p>}
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Login
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Register here
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Campus Illustration & Features Card (From Mockup) */}
        <div
          className="glass-panel"
          style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)'
          }}
        >
          <div>
            {/* Campus Vector Art */}
            <div
              style={{
                width: '100%',
                height: '160px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '20px'
              }}
            >
              <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%', maxHeight: '140px' }}>
                {/* Sun */}
                <circle cx="170" cy="30" r="16" fill="#fbbf24" opacity="0.8" />
                {/* Ground */}
                <path d="M 0 100 Q 100 90, 200 100 L 200 120 L 0 120 Z" fill="#10b981" opacity="0.5" />
                {/* Main Campus Building */}
                <rect x="60" y="45" width="80" height="55" rx="3" fill="#b91c1c" opacity="0.9" />
                <polygon points="100,15 50,45 150,45" fill="#991b1b" />
                {/* Clock tower / Dome */}
                <rect x="90" y="25" width="20" height="20" fill="#7f1d1d" />
                <circle cx="100" cy="35" r="5" fill="#fef08a" />
                <polygon points="100,5 88,25 112,25" fill="#450a0a" />
                {/* Windows */}
                <rect x="70" y="55" width="12" height="15" rx="2" fill="#93c5fd" />
                <rect x="94" y="55" width="12" height="15" rx="2" fill="#93c5fd" />
                <rect x="118" y="55" width="12" height="15" rx="2" fill="#93c5fd" />
                <rect x="70" y="78" width="12" height="15" rx="2" fill="#93c5fd" />
                <rect x="118" y="78" width="12" height="15" rx="2" fill="#93c5fd" />
                {/* Main Door */}
                <path d="M 92 100 L 92 80 A 8 8 0 0 1 108 80 L 108 100 Z" fill="#451a03" />
                {/* Trees */}
                <circle cx="35" cy="85" r="15" fill="#047857" />
                <rect x="33" y="95" width="4" height="10" fill="#78350f" />
                <circle cx="165" cy="85" r="15" fill="#047857" />
                <rect x="163" y="95" width="4" height="10" fill="#78350f" />
              </svg>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '8px' }}>
              Smart Management for a Smarter Campus!
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Experience effortless reservations with automated conflict detection, real-time timetable synchronization, and role-based permissions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', fontSize: '0.78rem', color: 'var(--text-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Real-time availability of 128+ spaces & gear</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Direct approval workflow for department heads</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Instant SMS & Email notifications on booking status</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
