import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  Users,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function ResourcesView({
  resources,
  setResources,
  onOpenAddModal,
  onBookResource,
  onUpdateStatus,
  onDeleteResource,
  currentRole
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedResource, setSelectedResource] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const categories = ['All', 'Laboratory', 'Seminar Hall', 'Equipment', 'Classroom', 'Auditorium'];
  const statuses = ['All', 'Available', 'Booked', 'Maintenance'];

  // Role Permissions
  const canAddResource = currentRole?.id === 'admin';
  const canDeleteResource = currentRole?.id === 'admin';
  const canBookResource = currentRole?.id === 'student' || currentRole?.id === 'faculty';

  const canUpdateResource = (res) => {
    if (currentRole?.id === 'admin') return true;
    if (currentRole?.id === 'lab_incharge') {
      return res.category === 'Laboratory' || (res.name && res.name.toLowerCase().includes('lab'));
    }
    if (currentRole?.id === 'support_staff') {
      return res.category !== 'Laboratory';
    }
    return false;
  };

  // Filter resources
  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || res.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || res.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleStatus = (id) => {
    const item = resources.find(r => r.id === id);
    if (!item) return;
    if (!canUpdateResource(item)) {
      alert(`Permission denied: Your role (${currentRole.name}) cannot update the status of this ${item.category}.`);
      return;
    }
    const nextStatus =
      item.status === 'Available' ? 'Booked' : item.status === 'Booked' ? 'Maintenance' : 'Available';
    if (onUpdateStatus) {
      onUpdateStatus(id, nextStatus);
    } else {
      setResources(prev =>
        prev.map(r => (r.id === id ? { ...r, status: nextStatus } : r))
      );
    }
  };

  const deleteResource = (id) => {
    if (!canDeleteResource) {
      alert('Permission denied: Only Administrators can delete resources from the catalog.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this resource from the catalog?')) {
      if (onDeleteResource) {
        onDeleteResource(id);
      } else {
        setResources(prev => prev.filter(r => r.id !== id));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      
      {/* Header & Controls */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Campus Resources Catalog
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {currentRole?.id === 'admin'
                ? 'Administrator catalog oversight — add, manage, update, and inspect all campus infrastructure'
                : currentRole?.id === 'lab_incharge'
                ? 'Laboratory supervisor portal — inspect spaces and update lab availability statuses'
                : currentRole?.id === 'support_staff'
                ? 'Campus facility management — supervise and update seminar halls, auditoriums & gear availability'
                : 'Browse campus spaces, inspect equipment specifications, and reserve available resources'}
            </p>
          </div>

          {canAddResource && (
            <button
              onClick={onOpenAddModal}
              className="btn-glass-primary"
              style={{ padding: '10px 18px', fontSize: '0.88rem' }}
            >
              <Plus size={16} />
              <span>+ Add Resource</span>
            </button>
          )}
        </div>

        {/* Filters Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              placeholder="Search resources, rooms, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{ width: '100%', paddingLeft: '38px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="glass-input"
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            >
              {categories.map((c) => (
                <option key={c} value={c} style={{ background: '#1e1b4b', color: '#fff' }}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="glass-input"
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            >
              {statuses.map((s) => (
                <option key={s} value={s} style={{ background: '#1e1b4b', color: '#fff' }}>
                  {s === 'All' ? 'All Status' : s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '16px 20px' }}>Resource Name</th>
                <th style={{ padding: '16px 20px' }}>Category</th>
                <th style={{ padding: '16px 20px' }}>Location</th>
                <th style={{ padding: '16px 20px' }}>Capacity</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--glass-border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid var(--glass-border)'
                          }}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            In Charge: {item.inCharge}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--glass-border)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--primary-light)" />
                        <span>{item.location}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} color="var(--text-dim)" />
                        <span>{item.capacity} Seats</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => canUpdateResource(item) && toggleStatus(item.id)}
                        title={
                          canUpdateResource(item)
                            ? `Click to toggle availability status (Currently: ${item.status})`
                            : `Status: ${item.status} (View only for ${currentRole?.name || 'User'})`
                        }
                        className={
                          item.status === 'Available'
                            ? 'badge-available'
                            : item.status === 'Booked'
                            ? 'badge-booked'
                            : 'badge-maintenance'
                        }
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '4px 11px',
                          borderRadius: '999px',
                          cursor: canUpdateResource(item) ? 'pointer' : 'default',
                          opacity: canUpdateResource(item) ? 1 : 0.85,
                          border: canUpdateResource(item) ? '1px dashed rgba(255,255,255,0.3)' : '1px solid transparent'
                        }}
                      >
                        {item.status}
                        {canUpdateResource(item) && ' ✎'}
                      </button>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedResource(item)}
                          title="View Specifications"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-main)',
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={15} />
                        </button>

                        {currentRole?.id === 'admin' ? (
                          <button
                            onClick={() => onBookResource && onBookResource(item.name)}
                            title="Admin Facility Reservation"
                            style={{
                              background: 'rgba(168, 85, 247, 0.2)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              color: '#c084fc',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CalendarPlus size={14} />
                            <span>Admin Book</span>
                          </button>
                        ) : canBookResource ? (
                          <button
                            onClick={() => onBookResource && onBookResource(item.name)}
                            title="Book This Resource"
                            style={{
                              background: 'rgba(99, 102, 241, 0.2)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              color: '#818cf8',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CalendarPlus size={14} />
                            <span>Book</span>
                          </button>
                        ) : null}

                        {canDeleteResource && (
                          <button
                            onClick={() => deleteResource(item.id)}
                            title="Delete Resource (Administrator only)"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '6px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No campus resources match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of{' '}
            <strong>{filtered.length}</strong> resources
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: currentPage === pageNum ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  border: currentPage === pageNum ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                  color: currentPage === pageNum ? '#fff' : 'var(--text-main)',
                  fontWeight: currentPage === pageNum ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: currentPage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Resource Details Modal */}
      {selectedResource && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '550px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ position: 'relative', height: '180px' }}>
              <img
                src={selectedResource.image}
                alt={selectedResource.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => setSelectedResource(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
              <span
                className={
                  selectedResource.status === 'Available'
                    ? 'badge-available'
                    : selectedResource.status === 'Booked'
                    ? 'badge-booked'
                    : 'badge-maintenance'
                }
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '16px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backdropFilter: 'blur(6px)'
                }}
              >
                {selectedResource.status}
              </span>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                    {selectedResource.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                    <MapPin size={14} color="var(--primary-light)" />
                    <span>{selectedResource.location}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Capacity</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                    {selectedResource.capacity} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Seats</span>
                  </div>
                </div>
              </div>

              <div style={{ margin: '18px 0', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                  Equipment & Facilities:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedResource.equipment.map((eq, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      ✓ {eq}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Assigned Supervisor: <strong>{selectedResource.inCharge}</strong>
                </div>
                {currentRole?.id === 'admin' ? (
                  <button
                    onClick={() => {
                      const resName = selectedResource.name;
                      setSelectedResource(null);
                      if (onBookResource) onBookResource(resName);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CalendarPlus size={15} />
                    <span>Admin Reserve Facility</span>
                  </button>
                ) : canBookResource ? (
                  <button
                    onClick={() => {
                      const resName = selectedResource.name;
                      setSelectedResource(null);
                      if (onBookResource) onBookResource(resName);
                    }}
                    className="btn-glass-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <CalendarPlus size={15} />
                    <span>Reserve Space</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
