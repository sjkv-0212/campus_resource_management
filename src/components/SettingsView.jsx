import React, { useState } from 'react';
import { Settings, Bell, Shield, Moon, Sun, Smartphone, Database, Check } from 'lucide-react';

export default function SettingsView({ theme, setTheme }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [conflictSensitivity, setConflictSensitivity] = useState('High');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '800px' }}>
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
          System & Account Preferences
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Configure reservation policies, conflict detection thresholds and notification preferences
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--primary-light)" />
          <span>Notification Channels</span>
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Email Confirmations & Reminders</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive email alerts when bookings are approved or modified</div>
          </div>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>In-App Urgent Alerts</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive instant notifications on emergency maintenance or room relocation</div>
          </div>
          <input
            type="checkbox"
            checked={inAppAlerts}
            onChange={(e) => setInAppAlerts(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="#38bdf8" />
          <span>Automated Policy & Conflicts</span>
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>AI Conflict Detection Sensitivity</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Strictness of buffer windows between consecutive bookings</div>
          </div>
          <select
            value={conflictSensitivity}
            onChange={(e) => setConflictSensitivity(e.target.value)}
            className="glass-input"
            style={{ padding: '6px 12px' }}
          >
            <option value="Standard" style={{ background: '#1e1b4b' }}>Standard (15 min buffer)</option>
            <option value="High" style={{ background: '#1e1b4b' }}>High (30 min buffer)</option>
            <option value="Strict" style={{ background: '#1e1b4b' }}>Strict (Zero overlap)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Faculty Auto-Approval</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically approve regular classroom bookings by verified faculty</div>
          </div>
          <input
            type="checkbox"
            checked={autoApprove}
            onChange={(e) => setAutoApprove(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => alert('Preferences saved successfully!')}
          className="btn-glass-primary"
        >
          <Check size={16} />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
}
