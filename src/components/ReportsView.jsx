import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  Users,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  ArrowUpRight
} from 'lucide-react';
export default function ReportsView({ resources, bookings }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const bookingsThisMonth = bookings.filter((booking) => booking.date?.startsWith(currentMonth));
  const activeUsers = new Set(bookings.map((booking) => booking.bookedBy).filter(Boolean)).size;
  const usedResources = new Set(bookings.map((booking) => booking.resourceName)).size;
  const utilizationRate = resources.length ? Math.round((usedResources / resources.length) * 100) : 0;
  const barData = [1, 2, 3, 4].map((week) => {
    const count = bookingsThisMonth.filter((booking) => Math.ceil(Number(booking.date.slice(-2)) / 7) === week).length;
    return { label: `Week ${week}`, count, height: count ? Math.max(8, count * 18) : 0 };
  });
  const topResources = resources
    .map((resource) => ({
      name: resource.name,
      bookings: bookings.filter((booking) => booking.resourceName === resource.name).length
    }))
    .filter((resource) => resource.bookings > 0)
    .sort((first, second) => second.bookings - first.bookings)
    .slice(0, 5)
    .map((resource, index) => ({
      ...resource,
      rank: index + 1,
      util: resources.length ? Math.round((resource.bookings / bookings.length) * 100) : 0
    }));

  const triggerDownload = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['Resource', 'Bookings', 'Status'],
      ...topResources.map((resource) => [resource.name, resource.bookings, 'Active'])
    ];
    const csvText = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    triggerDownload('campus-resource-report.csv', csvText, 'text/csv;charset=utf-8;');
  };

  const handleDownloadPdf = () => {
    const pdfText = `Campus Resource Audit\n\n` +
      `Utilization Rate: ${utilizationRate}%\n` +
      `Bookings This Month: ${bookingsThisMonth.length}\n` +
      `Active Users: ${activeUsers}\n` +
      `Used Resources: ${usedResources}\n\n` +
      `Top Resources:\n` +
      topResources.map((resource) => `- ${resource.name}: ${resource.bookings} bookings`).join('\n');

    const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${pdfText.length + 100} >>\nstream\nBT\n/F1 16 Tf\n50 760 Td\n(${pdfText.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000066 00000 n \n0000000125 00000 n \n0000000452 00000 n \n0000001458 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n1545\n%%EOF`;

    triggerDownload('campus-resource-audit.pdf', pdfContent, 'application/pdf');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Campus Reports & Resource Analytics
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Data-driven insights into room occupancy, peak hours, and equipment efficiency
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportCsv}
              className="btn-glass-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <FileSpreadsheet size={15} color="#10b981" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="btn-glass-primary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              <Download size={15} />
              <span>Download PDF Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Analytics Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Metric 1: Utilization Rate */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
              Utilization Rate
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <ArrowUpRight size={13} />
              <span>+0% vs last month</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
            {/* Circular Gauge */}
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#radialGradient)"
                  strokeDasharray={`${utilizationRate}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{utilizationRate}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Campus Avg</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>• Resources: <strong style={{ color: '#38bdf8' }}>{resources.length}</strong></div>
              <div style={{ color: 'var(--text-muted)' }}>• Used: <strong style={{ color: '#c084fc' }}>{usedResources}</strong></div>
              <div style={{ color: 'var(--text-muted)' }}>• Bookings: <strong style={{ color: '#34d399' }}>{bookings.length}</strong></div>
            </div>
          </div>
        </div>

        {/* Metric 2: Bookings This Month */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
              Bookings This Month
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <ArrowUpRight size={13} />
              <span>+0%</span>
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '14px' }}>
            {bookingsThisMonth.length}
          </div>

          {/* Bar chart mockup */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '65px', gap: '10px', padding: '0 8px' }}>
            {barData.map((bar, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${bar.height}px`,
                    background: 'linear-gradient(180deg, #6366f1 0%, rgba(99, 102, 241, 0.3) 100%)',
                    borderRadius: '6px 6px 0 0',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
                  }}
                />
                <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric 3: User Activity */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
              User Activity
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <ArrowUpRight size={13} />
              <span>+0%</span>
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
            {activeUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Active Users this week
          </div>

          {/* Sparkline curve */}
          <svg viewBox="0 0 200 45" style={{ width: '100%', height: '45px' }}>
            <path
              d="M 10 35 Q 40 10, 80 25 T 140 15 T 190 8"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Top Resources Leaderboard */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: '6px' }}>
          Top Utilized Resources
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Highest reservation frequency and occupancy hours
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topResources.map((item) => (
            <div
              key={item.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: item.rank === 1 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem'
                  }}
                >
                  #{item.rank}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-highlight)' }}>
                  {item.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                    {item.bookings} Bookings
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {item.util} Capacity
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
