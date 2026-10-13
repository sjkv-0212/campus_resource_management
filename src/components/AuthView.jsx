import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  ArrowLeft,
  Key,
  CheckCircle,
  Clock,
  MailCheck,
} from 'lucide-react';
import { ROLES } from '../data/mockData';

export default function AuthView({ onLoginSuccess }) {
  // viewMode: 'login' | 'register' | 'forgot' | 'reset-code' | 'registered-pending'
  const [viewMode, setViewMode] = useState('login');
  const [registeredUser, setRegisteredUser] = useState(null);
  const isRegister = viewMode === 'register';

  // Login & Registration fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [selectedRoleId, setSelectedRoleId] = useState('faculty');

  // Password reset fields
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status feedback
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
        if (result.error && result.error.toLowerCase().includes('awaiting administrator approval')) {
          setError('Your account is currently awaiting administrator approval. You will receive an email as soon as your account is approved.');
        } else {
          setError(result.error || 'Unable to authenticate. Please try again.');
        }
        return;
      }
      if (isRegister) {
        const matchingRole = ROLES.find((r) => r.id === selectedRoleId);
        setRegisteredUser({
          name: result.user?.name || fullName.trim(),
          email: normalizedEmail,
          role: result.user?.role || matchingRole?.name || selectedRoleId,
          department: result.user?.department || department.trim()
        });
        setEmail(normalizedEmail);
        setPassword('');
        setConfirmPassword('');
        setViewMode('registered-pending');
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

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');
    const targetEmail = (resetEmail || email).trim().toLowerCase();

    if (!targetEmail) {
      setError('Please enter your campus email address.');
      return;
    }
    if (!/^[^\s@]+@ritrjpm\.ac\.in$/i.test(targetEmail)) {
      setError('Please enter a valid campus email address (name@ritrjpm.ac.in).');
      return;
    }

    setResetEmail(targetEmail);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to send verification code.');
        setIsLoading(false);
        return;
      }

      setMessage(result.message || `A 6-digit verification code has been sent to ${targetEmail}. Please check your email inbox.`);
      setViewMode('reset-code');
      setResendCooldown(60);
    } catch {
      setError('Cannot connect to the server. Please verify the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const targetEmail = (resetEmail || email).trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code received in your email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          otp: cleanOtp,
          newPassword
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to reset password. Please check your verification code.');
        setIsLoading(false);
        return;
      }

      setEmail(targetEmail);
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setViewMode('login');
      setMessage(result.message || 'Password reset successful! You can now log in with your new password.');
    } catch {
      setError('Cannot connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode) => {
    setViewMode(mode);
    setError('');
    setMessage('');
    if (mode === 'forgot') {
      setResetEmail(email.trim());
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else if (mode === 'login' || mode === 'register') {
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
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
                background:
                  viewMode === 'registered-pending'
                    ? '#d97706'
                    : viewMode === 'reset-code'
                    ? '#059669'
                    : viewMode === 'forgot'
                    ? '#d97706'
                    : '#4f46e5',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}
            >
              {viewMode === 'register' && 'REGISTER'}
              {viewMode === 'login' && 'LOGIN'}
              {viewMode === 'forgot' && 'PASSWORD RESET'}
              {viewMode === 'reset-code' && 'VERIFY OTP'}
              {viewMode === 'registered-pending' && 'PENDING APPROVAL'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '4px' }}>
            {viewMode === 'register' && 'Create Account'}
            {viewMode === 'login' && 'Welcome Back!'}
            {viewMode === 'forgot' && 'Reset Password'}
            {viewMode === 'reset-code' && 'Verify & Set Password'}
            {viewMode === 'registered-pending' && 'Registration Received!'}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {viewMode === 'register' && 'Join the Smart Campus Resource Network'}
            {viewMode === 'login' && 'Sign in to access campus reservation portal'}
            {viewMode === 'forgot' && 'Enter your campus email to receive a 6-digit verification code.'}
            {viewMode === 'reset-code' && `We sent a 6-digit verification code to ${resetEmail || 'your email'}. Check your email inbox.`}
            {viewMode === 'registered-pending' && 'Your account request has been submitted and is currently awaiting administrator approval.'}
          </p>

          {/* VIEW: REGISTRATION SUBMITTED / PENDING APPROVAL */}
          {viewMode === 'registered-pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(6, 182, 212, 0.08))',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '14px',
                  padding: '24px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '2px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24'
                  }}
                >
                  <Clock size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-highlight)', margin: '0 0 4px 0' }}>
                    Request Submitted for Admin Approval
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Your registration has been recorded and an email notification has been dispatched to your campus inbox.
                  </p>
                </div>
              </div>

              {/* Registration summary card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Submitted Profile Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block' }}>Applicant Name</span>
                    <strong style={{ color: 'var(--text-highlight)' }}>{registeredUser?.name || fullName || 'Member'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block' }}>Requested Role</span>
                    <strong style={{ color: '#38bdf8' }}>{registeredUser?.role || 'Member'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block' }}>Campus Email</span>
                    <strong style={{ color: 'var(--text-highlight)' }}>{registeredUser?.email || email}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block' }}>Department</span>
                    <span style={{ color: 'var(--text-muted)' }}>{registeredUser?.department || department}</span>
                  </div>
                </div>
              </div>

              {/* Information timeline / Next steps */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '0.8rem',
                  lineHeight: '1.55',
                  color: 'var(--text-muted)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, marginBottom: '8px' }}>
                  <MailCheck size={16} />
                  <span>Emails & Approval Process</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>
                    <strong style={{ color: 'var(--text-highlight)' }}>Confirmation Email:</strong> We have dispatched an acknowledgment email to <code style={{ color: '#38bdf8' }}>{registeredUser?.email || email}</code>.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text-highlight)' }}>Admin Notification:</strong> Campus administrators have received your request for verification.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text-highlight)' }}>Login & Booking Access:</strong> Once approved by the administrator, you will receive an approval email and can sign in to make bookings!
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(registeredUser?.email || email);
                    switchMode('login');
                  }}
                  className="btn-glass-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}
                >
                  <ArrowLeft size={16} />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD (STEP 1: REQUEST OTP) */}
          {viewMode === 'forgot' && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Campus Email Address
                </label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@ritrjpm.ac.in"
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '36px' }}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-glass-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px', fontSize: '0.92rem', opacity: isLoading ? 0.7 : 1 }}
              >
                <span>{isLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
                <ArrowRight size={16} />
              </button>

              {error && <p role="alert" style={{ color: '#fca5a5', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{error}</p>}
              {message && <p role="status" style={{ color: '#86efac', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{message}</p>}

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD (STEP 2: VERIFY OTP & ENTER NEW PASSWORD) */}
          {viewMode === 'reset-code' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    6-Digit Verification Code
                  </label>
                  {resendCooldown > 0 ? (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 582910"
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '36px', letterSpacing: '4px', fontWeight: 700, fontSize: '1rem' }}
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  New Password
                </label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-glass-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px', fontSize: '0.92rem', opacity: isLoading ? 0.7 : 1 }}
              >
                <span>{isLoading ? 'Updating Password...' : 'Save & Reset Password'}</span>
                <ArrowRight size={16} />
              </button>

              {error && <p role="alert" style={{ color: '#fca5a5', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{error}</p>}
              {message && <p role="status" style={{ color: '#86efac', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{message}</p>}

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Cancel & Return to Login
                </button>
              </div>
            </form>
          )}

          {/* VIEW: LOGIN & REGISTRATION */}
          {(viewMode === 'login' || viewMode === 'register') && (
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
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        switchMode('forgot');
                      }}
                      style={{ fontSize: '0.74rem', color: 'var(--primary-light)', textDecoration: 'none', cursor: 'pointer' }}
                    >
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
              {message && !error && <p role="status" style={{ color: '#86efac', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{message}</p>}
            </form>
          )}

          {/* Mode Switcher Footer */}
          {(viewMode === 'login' || viewMode === 'register') && (
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isRegister ? (
                <span>
                  Already have an account?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Login
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Register here
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Campus Illustration & Features Card */}
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
              <span>Real-time availability of 128+ spaces & resources</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Direct approval workflow for department heads</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Instant Email & In-App notifications on booking status</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
