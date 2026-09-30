import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  BookOpen,
  Laptop,
  Building,
  Video,
  Layers,
  CalendarCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity
} from 'lucide-react';

export default function AnalyticsView({
  resources = [],
  bookings = [],
  setActiveTab,
  onSelectResource,
  currentRole
}) {
  const [graphMode, setGraphMode] = useState('category'); // 'category' | 'day'
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);
  const [hoveredBarCategory, setHoveredBarCategory] = useState(null);

  // ---------------------------------------------------------------------------
  // Resource Calculations
  // ---------------------------------------------------------------------------
  const totalRes = resources.length || 1;
  const availableResCount = resources.filter((r) => r.status === 'Available').length;
  const bookedResCount = resources.filter((r) => r.status === 'Booked').length;
  const maintenanceResCount = resources.filter((r) => r.status === 'Maintenance').length;
  const otherResCount = Math.max(0, totalRes - availableResCount - bookedResCount - maintenanceResCount);

  const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
  const confirmedCount = activeBookings.filter((b) => b.status === 'Confirmed').length;
  const pendingCount = activeBookings.filter((b) => b.status === 'Pending').length;
  const overallUtilizationRate = Math.round(((bookedResCount + maintenanceResCount) / totalRes) * 100);

  // ---------------------------------------------------------------------------
  // Donut Chart Calculations
  // ---------------------------------------------------------------------------
  const donutSegments = [
    {
      id: 'available',
      label: 'Available Spaces',
      shortLabel: 'Available',
      count: availableResCount,
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      gradient: ['#10b981', '#34d399']
    },
    {
      id: 'booked',
      label: 'Booked / Reserved',
      shortLabel: 'Booked',
      count: bookedResCount,
      color: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.45)',
      gradient: ['#6366f1', '#818cf8']
    },
    {
      id: 'maintenance',
      label: 'Under Maintenance',
      shortLabel: 'Maintenance',
      count: maintenanceResCount,
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      gradient: ['#f59e0b', '#fbbf24']
    }
  ];

  if (otherResCount > 0) {
    donutSegments.push({
      id: 'other',
      label: 'Other Campus Facilities',
      shortLabel: 'Other',
      count: otherResCount,
      color: '#0ea5e9',
      glow: 'rgba(14, 165, 233, 0.45)',
      gradient: ['#0ea5e9', '#38bdf8']
    });
  }

  const donutR = 48;
  const donutCx = 65;
  const donutCy = 65;
  const donutC = 2 * Math.PI * donutR;
  let accumulatedDonutOffset = 0;

  const donutSegmentsWithGeometry = donutSegments.map((segment) => {
    const fraction = totalRes > 0 ? segment.count / totalRes : 0;
    const strokeLength = fraction * donutC;
    const offset = accumulatedDonutOffset;
    accumulatedDonutOffset += strokeLength;
    const percent = Math.round(fraction * 100);
    return {
      ...segment,
      fraction,
      percent,
      strokeLength,
      offset
    };
  });

  // ---------------------------------------------------------------------------
  // Category Demand Calculations
  // ---------------------------------------------------------------------------
  const categoriesList = [
    {
      name: 'Classroom',
      label: 'Classrooms',
      icon: BookOpen,
      color: '#38bdf8',
      gradient: 'linear-gradient(180deg, #38bdf8 0%, rgba(56, 189, 248, 0.25) 100%)'
    },
    {
      name: 'Laboratory',
      label: 'Laboratories',
      icon: Laptop,
      color: '#6366f1',
      gradient: 'linear-gradient(180deg, #818cf8 0%, rgba(99, 102, 241, 0.25) 100%)'
    },
    {
      name: 'Seminar Hall',
      label: 'Seminar Halls',
      icon: Building,
      color: '#ec4899',
      gradient: 'linear-gradient(180deg, #f472b6 0%, rgba(236, 72, 153, 0.25) 100%)'
    },
    {
      name: 'Equipment',
      label: 'AV Equipment',
      icon: Video,
      color: '#f59e0b',
      gradient: 'linear-gradient(180deg, #fbbf24 0%, rgba(245, 158, 11, 0.25) 100%)'
    }
  ];

  const categoryStats = categoriesList.map((catItem) => {
    const countRes = resources.filter((r) => (r.category || '').toLowerCase() === catItem.name.toLowerCase()).length;
    const catBookings = bookings.filter((b) => {
      if (b.status === 'Cancelled') return false;
      if (b.category && b.category.toLowerCase() === catItem.name.toLowerCase()) return true;
      const matchedRes = resources.find((r) => r.name === b.resourceName || r.id === b.resourceId);
      return matchedRes && (matchedRes.category || '').toLowerCase() === catItem.name.toLowerCase();
    });

    const activeCount = catBookings.length;
    const loadPercent = countRes > 0 ? Math.min(100, Math.round((activeCount / countRes) * 100)) : 0;

    return {
      ...catItem,
      resourceCount: countRes,
      bookingCount: activeCount,
      loadPercent
    };
  });

  const maxCategoryBookings = Math.max(...categoryStats.map((c) => c.bookingCount), 1);
  const highestDemandCategory = categoryStats.slice().sort((a, b) => b.bookingCount - a.bookingCount)[0]?.label || 'Laboratories';

  // ---------------------------------------------------------------------------
  // Weekday Demand Calculations
  // ---------------------------------------------------------------------------
  const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = WEEK_DAYS.map((dayName, idx) => {
    const dayBookings = bookings.filter((b) => {
      if (b.status === 'Cancelled' || !b.date) return false;
      const d = new Date(b.date);
      if (isNaN(d.getTime())) return false;
      const dayIndex = (d.getDay() + 6) % 7;
      return dayIndex === idx;
    });
    return {
      day: dayName,
      count: dayBookings.length,
      color: '#6366f1'
    };
  });
  const maxDayBookings = Math.max(...dayStats.map((d) => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(99, 102, 241, 0.15) 100%)',
                  padding: '8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.4)'
                }}
              >
                <PieChart size={24} color="#818cf8" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                  Campus Analytics & Capacity Intelligence
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Real-time demand analysis, facility load distribution and space allocation audits
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.78rem',
                color: '#34d399',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                  display: 'inline-block'
                }}
              />
              <span>Live Synchronized</span>
            </div>

            <button
              onClick={() => setActiveTab('resources')}
              className="btn-glass-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <span>Manage Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px'
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: '20px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(255,255,255,0.02) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Capacity Load</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '8px' }}>
              <Activity size={16} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
            {overallUtilizationRate}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {bookedResCount} booked / {maintenanceResCount} in maintenance
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '20px',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(255,255,255,0.02) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Reservations</span>
            <div style={{ background: 'rgba(14, 165, 233, 0.2)', padding: '6px', borderRadius: '8px' }}>
              <CalendarCheck size={16} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
            {activeBookings.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '4px' }}>
            {confirmedCount} confirmed • {pendingCount} pending
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '20px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(255,255,255,0.02) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Available Spaces</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
            {availableResCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Ready for instant allocation ({Math.round((availableResCount / totalRes) * 100)}%)
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '20px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(255,255,255,0.02) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Peak Demand Category</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={16} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.2 }}>
            {highestDemandCategory}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Highest reservation frequency
          </div>
        </div>
      </div>

      {/* Main Visualizations: Demand Graph & Donut Chart Side by Side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Widget 1: Campus Demand & Reservation Volume Graph */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '8px' }}>
                  <BarChart3 size={18} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  Campus Demand Analysis
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Real-time reservation volume & capacity load
              </p>
            </div>

            {/* Graph Mode Segmented Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                fontSize: '0.74rem'
              }}
            >
              <button
                onClick={() => setGraphMode('category')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: graphMode === 'category' ? '#4f46e5' : 'transparent',
                  color: graphMode === 'category' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                By Facility
              </button>
              <button
                onClick={() => setGraphMode('day')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: graphMode === 'day' ? '#4f46e5' : 'transparent',
                  color: graphMode === 'day' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                Weekly Load
              </button>
            </div>
          </div>

          {/* Graph Content */}
          {graphMode === 'category' ? (
            <div>
              {/* Bars Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '165px',
                  gap: '16px',
                  padding: '12px 10px 0 10px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {categoryStats.map((item) => {
                  const Icon = item.icon;
                  const barHeightPercent = Math.max(16, Math.round((item.bookingCount / (maxCategoryBookings + 1)) * 100));
                  const isHovered = hoveredBarCategory?.name === item.name;

                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setHoveredBarCategory(item)}
                      onMouseLeave={() => setHoveredBarCategory(null)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      {/* Value pill */}
                      <div
                        style={{
                          marginBottom: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isHovered ? '#ffffff' : item.color,
                          background: isHovered ? item.color : 'rgba(255, 255, 255, 0.06)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          border: `1px solid ${item.color}50`,
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.bookingCount} {item.bookingCount === 1 ? 'Req' : 'Reqs'}
                      </div>

                      {/* Bar Column */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '56px',
                          height: `${barHeightPercent}%`,
                          background: item.gradient,
                          borderRadius: '8px 8px 2px 2px',
                          boxShadow: isHovered ? `0 0 16px ${item.color}90` : `0 0 8px ${item.color}40`,
                          transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                          transformOrigin: 'bottom',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: '#ffffff',
                            opacity: 0.7
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Labels below bars */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '10px 8px 0 8px'
                }}
              >
                {categoryStats.map((item) => {
                  const Icon = item.icon;
                  const isHovered = hoveredBarCategory?.name === item.name;
                  return (
                    <div
                      key={item.name}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.76rem',
                          fontWeight: isHovered ? 700 : 600,
                          color: isHovered ? 'var(--text-highlight)' : 'var(--text-main)',
                          transition: 'color 0.2s'
                        }}
                      >
                        <Icon size={13} color={item.color} />
                        <span>{item.label}</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {item.resourceCount} Units ({item.loadPercent}% Load)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Weekly Load Mode */
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '165px',
                  gap: '10px',
                  padding: '12px 10px 0 10px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {dayStats.map((item) => {
                  const barHeightPercent = Math.max(14, Math.round((item.count / (maxDayBookings + 1)) * 100));
                  return (
                    <div
                      key={item.day}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                        {item.count}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '40px',
                          height: `${barHeightPercent}%`,
                          background: 'linear-gradient(180deg, #6366f1 0%, rgba(14, 165, 233, 0.3) 100%)',
                          borderRadius: '6px 6px 2px 2px',
                          boxShadow: '0 0 10px rgba(99, 102, 241, 0.35)'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 8px 0 8px' }}>
                {dayStats.map((item) => (
                  <span key={item.day} style={{ flex: 1, textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {item.day}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Insight Banner */}
          <div
            style={{
              marginTop: '18px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} color="#34d399" />
              <span>
                Highest Demand Category: <strong style={{ color: '#fff' }}>{highestDemandCategory}</strong>
              </span>
            </div>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>
              {activeBookings.length} Active Reservations Campus-Wide
            </span>
          </div>
        </div>

        {/* Widget 2: Resource Allocation & Capacity Donut Chart */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '8px' }}>
                  <PieChart size={18} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  Resource Allocation
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Live occupancy & operational status breakdown
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  display: 'inline-block'
                }}
              />
              <span>Live Audit</span>
            </div>
          </div>

          {/* Donut and Legend Layout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '24px',
              padding: '10px 0'
            }}
          >
            {/* SVG Donut Visual */}
            <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
              <svg viewBox="0 0 130 130" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <circle
                  cx={donutCx}
                  cy={donutCy}
                  r={donutR}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="14"
                />

                {donutSegmentsWithGeometry.map((segment) => {
                  if (segment.count <= 0) return null;
                  const isHovered = hoveredDonutSegment?.id === segment.id;

                  return (
                    <circle
                      key={segment.id}
                      cx={donutCx}
                      cy={donutCy}
                      r={donutR}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={isHovered ? '17' : '13.5'}
                      strokeDasharray={`${Math.max(0, segment.strokeLength - 2.5)} ${donutC - Math.max(0, segment.strokeLength - 2.5)}`}
                      strokeDashoffset={-segment.offset}
                      transform={`rotate(-90 ${donutCx} ${donutCy})`}
                      strokeLinecap="round"
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        filter: isHovered ? `drop-shadow(0 0 10px ${segment.color})` : 'none'
                      }}
                      onMouseEnter={() => setHoveredDonutSegment(segment)}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Metric */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  width: '90px'
                }}
              >
                {hoveredDonutSegment ? (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: hoveredDonutSegment.color, lineHeight: 1 }}>
                      {hoveredDonutSegment.count}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '3px', textTransform: 'uppercase' }}>
                      {hoveredDonutSegment.shortLabel}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#ffffff', fontWeight: 700 }}>
                      {hoveredDonutSegment.percent}%
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-highlight)', lineHeight: 1 }}>
                      {totalRes}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Total Units
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#10b981', fontWeight: 700 }}>
                      {Math.round((availableResCount / totalRes) * 100)}% Avail
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Donut Legend Cards */}
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {donutSegmentsWithGeometry.map((segment) => {
                const isHovered = hoveredDonutSegment?.id === segment.id;
                return (
                  <div
                    key={segment.id}
                    onMouseEnter={() => setHoveredDonutSegment(segment)}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isHovered ? segment.color : 'rgba(255, 255, 255, 0.06)'}`,
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: segment.color,
                            boxShadow: `0 0 6px ${segment.color}`,
                            display: 'inline-block'
                          }}
                        />
                        <span style={{ fontWeight: 600, color: isHovered ? '#ffffff' : 'var(--text-main)' }}>
                          {segment.label}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: segment.color }}>
                        {segment.count} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({segment.percent}%)</span>
                      </span>
                    </div>

                    <div
                      style={{
                        height: '4px',
                        borderRadius: '999px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        overflow: 'hidden',
                        marginTop: '6px'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${segment.percent}%`,
                          background: segment.color,
                          borderRadius: '999px',
                          boxShadow: `0 0 6px ${segment.color}`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setActiveTab('resources')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-light)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Manage All Resources in Catalog</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Detailed Category Capacity Inventory Table */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Campus Facility Capacity Inventory
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Comprehensive category-level breakdown of units, booking load, and availability
            </p>
          </div>
          <button
            onClick={() => setActiveTab('resources')}
            className="btn-glass-primary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <span>View Full Catalog</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {categoryStats.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: `${cat.color}20`, padding: '6px', borderRadius: '8px' }}>
                      <Icon size={16} color={cat.color} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-highlight)' }}>
                      {cat.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: cat.color,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: `${cat.color}15`
                    }}
                  >
                    {cat.loadPercent}% Load
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Total Venues: <strong style={{ color: '#fff' }}>{cat.resourceCount}</strong></span>
                  <span>Active Bookings: <strong style={{ color: cat.color }}>{cat.bookingCount}</strong></span>
                </div>

                <div
                  style={{
                    height: '6px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${cat.loadPercent}%`,
                      background: cat.color,
                      borderRadius: '999px',
                      boxShadow: `0 0 6px ${cat.color}`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
