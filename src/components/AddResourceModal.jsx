import React, { useState } from 'react';
import { X, Plus, Layers, MapPin, Users, ShieldCheck, Check } from 'lucide-react';

export default function AddResourceModal({ isOpen, onClose, onAddResource }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [inCharge, setInCharge] = useState('');
  const [equipmentInput, setEquipmentInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !location) return;

    const newRes = {
      id: 'res-' + Date.now(),
      name,
      category,
      location,
      capacity: parseInt(capacity) || 50,
      status: 'Available',
      equipment: equipmentInput.split(',').map(item => item.trim()).filter(Boolean),
      inCharge,
      image:
        category === 'Laboratory'
          ? 'https://images.unsplash.com/photo-1562774053-701939374585?w=500&auto=format&fit=crop&q=80'
          : category === 'Seminar Hall'
          ? 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&auto=format&fit=crop&q=80'
    };

    onAddResource(newRes);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Add New Campus Resource
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Register a new lab, hall, classroom or equipment
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Resource Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Cyber Security & Forensics Lab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="glass-input"
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="" style={{ background: '#1e1b4b' }}>Select category</option>
                <option value="Laboratory" style={{ background: '#1e1b4b' }}>Laboratory</option>
                <option value="Seminar Hall" style={{ background: '#1e1b4b' }}>Seminar Hall</option>
                <option value="Classroom" style={{ background: '#1e1b4b' }}>Classroom</option>
                <option value="Equipment" style={{ background: '#1e1b4b' }}>Equipment</option>
                <option value="Auditorium" style={{ background: '#1e1b4b' }}>Auditorium</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Capacity (Seats)</label>
              <input
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="glass-input"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Location / Room</label>
            <input
              type="text"
              required
              placeholder="e.g. Tech Block - Floor 3 (Room 304)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="glass-input"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assigned Supervisor</label>
            <input
              type="text"
              value={inCharge}
              onChange={(e) => setInCharge(e.target.value)}
              className="glass-input"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Equipment & Features (Comma separated)
            </label>
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              placeholder="e.g. Smart Board, PA System, 4K Projector"
              className="glass-input"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-glass-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-glass-primary"
            >
              <Plus size={16} />
              <span>Create Resource</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
