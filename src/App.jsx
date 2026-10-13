import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ResourcesView from './components/ResourcesView';
import BookingCalendarView from './components/BookingCalendarView';
import BookingsView from './components/BookingsView';
import ReportsView from './components/ReportsView';
import AnalyticsView from './components/AnalyticsView';
import NotificationsView from './components/NotificationsView';
import UsersView from './components/UsersView';
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import BookingWizardModal from './components/BookingWizardModal';
import AddResourceModal from './components/AddResourceModal';
import {
  ROLES,
  INITIAL_RESOURCES
} from './data/mockData';

export default function App() {
  // Always display login page on launch/initial load instead of auto-logging in
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState(ROLES[1]); // Default Faculty role
  const [theme, setTheme] = useState('dark');
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Clear persistent auto-login on startup so login page always shows first
    localStorage.removeItem('smart-campus-session');
  }, []);

  const fetchCampusData = async (overrideToken = null) => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const token = overrideToken || currentRole?.token || session.token || '';
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [resourcesResponse, bookingsResponse, notificationsResponse] = await Promise.all([
        fetch('http://localhost:4000/api/resources', { headers }),
        fetch('http://localhost:4000/api/bookings', { headers }),
        fetch('http://localhost:4000/api/notifications', { headers })
      ]);

      if (resourcesResponse.ok) {
        const savedResources = await resourcesResponse.json();
        if (savedResources && savedResources.length > 0) {
          setResources((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(savedResources)) return prev;
            return savedResources;
          });
        }
      }

      if (bookingsResponse.ok) {
        const savedBookings = await bookingsResponse.json();
        setBookings((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(savedBookings)) return prev;
          return savedBookings;
        });
      }

      if (notificationsResponse.ok) {
        const savedNotifications = await notificationsResponse.json();
        setNotifications((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(savedNotifications)) return prev;
          return savedNotifications;
        });
      }
    } catch (error) {
      console.error('Error loading campus data:', error.message);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCampusData();

    // Live background polling every 8s so admin approvals and status updates reflect automatically
    const interval = setInterval(() => {
      fetchCampusData();
    }, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentRole?.id, currentRole?.user?.email, currentRole?.token]);

  // Modals & Drawers
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Prefilled reservation parameters
  const [preselectedResource, setPreselectedResource] = useState('');
  const [preselectedDate, setPreselectedDate] = useState('');

  // Unread notification count
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLoginSuccess = (newRole) => {
    setCurrentRole(newRole);
    setBookings([]);
    setNotifications([]);
    setIsAuthenticated(true);
    const query = new URLSearchParams(window.location.search);
    const requestedTab = query.get('tab');
    setActiveTab(
      newRole.id === 'admin' && ['users', 'bookings'].includes(requestedTab)
        ? requestedTab
        : 'dashboard'
    );
    const existingSession = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const userObj = newRole.user || {};
    localStorage.setItem('smart-campus-session', JSON.stringify({
      token: newRole.token || existingSession.token || '',
      roleId: newRole.id,
      fullName: userObj.name || userObj.fullName || '',
      email: userObj.email || '',
      phone: userObj.phone || '',
      department: userObj.department || ''
    }));

    if (newRole.token) {
      fetchCampusData(newRole.token);
    }
  };

  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const handleAddNewBooking = async (newBooking) => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const authToken = currentRole?.token || session.token || '';
    const response = await fetch('http://localhost:4000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(newBooking)
    });
    const savedBooking = await response.json();
    if (!response.ok) throw new Error(savedBooking.error || 'Unable to save booking.');

    setBookings((prev) => [savedBooking, ...prev.filter((b) => b.id !== savedBooking.id)]);
    fetchCampusData(authToken);
    return savedBooking;
  };

  const handleMarkNotificationsRead = async () => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const authToken = currentRole?.token || session.token || '';
    try {
      const response = await fetch('http://localhost:4000/api/notifications', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + authToken }
      });
      const updatedNotifications = await response.json();
      if (!response.ok) {
        alert(updatedNotifications.error || 'Failed to mark notifications as read.');
        return;
      }
      setNotifications(updatedNotifications);
    } catch (error) {
      alert(error.message || 'Unable to mark notifications as read.');
    }
  };

  const handleAddResource = async (newRes) => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const authToken = currentRole?.token || session.token || '';
    const response = await fetch('http://localhost:4000/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(newRes)
    });
    const savedResource = await response.json();
    if (!response.ok) throw new Error(savedResource.error || 'Unable to save resource.');
    setResources((prev) => [savedResource, ...prev]);
  };

  const handleUpdateResourceStatus = async (id, newStatus) => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const authToken = currentRole?.token || session.token || '';
    const response = await fetch(`http://localhost:4000/api/resources/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || 'Failed to update resource availability.');
      return;
    }
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  };

  const handleDeleteResource = async (id) => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const authToken = currentRole?.token || session.token || '';
    const targetResource = resources.find((r) => r.id === id);
    const response = await fetch(`http://localhost:4000/api/resources/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.error || 'Failed to delete resource.');
      return;
    }
    setResources((prev) => prev.filter((r) => r.id !== id));
    if (targetResource) {
      const nameNorm = targetResource.name.trim().toLowerCase();
      setBookings((prev) => prev.filter((b) => (b.resourceName || '').trim().toLowerCase() !== nameNorm));
    }
  };

  const handleUpdateBookingStatus = async (id, newStatus, reason = '') => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const authToken = currentRole?.token || session.token || '';
    const response = await fetch(`http://localhost:4000/api/bookings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        status: newStatus,
        cancellationReason: reason
      })
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || 'Failed to update booking status.');
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              ...result,
              status: newStatus,
              ...(newStatus === 'Cancelled'
                ? { cancellationReason: result.cancellationReason || reason }
                : {})
            }
          : b
      )
    );

    fetchCampusData(authToken);
  };

  const handleDeleteBooking = async (id) => {
    const session = JSON.parse(localStorage.getItem('smart-campus-session') || '{}');
    const response = await fetch(`http://localhost:4000/api/bookings/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.token || ''}`
      }
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.error || 'Failed to delete booking.');
      return;
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const triggerBookResource = (resourceName) => {
    setPreselectedResource(resourceName);
    setPreselectedDate('');
    setIsBookingModalOpen(true);
  };

  const triggerBookSlot = (resourceName, dateStr) => {
    setPreselectedResource(resourceName);
    setPreselectedDate(dateStr);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Ambient Animated Gradient Mesh in Background */}
      <div className="ambient-bg">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />
        <div className="ambient-blob blob-3" />
        <div className="ambient-blob blob-4" />
      </div>

      {/* Main Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        currentRole={currentRole}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onSignOut={() => {
          localStorage.removeItem('smart-campus-session');
            setIsAuthenticated(false);
        }}
      />

      {/* Content Area */}
      <div className="main-content-area">
        {/* Top Header */}
        <Header
          currentRole={currentRole}
          theme={theme}
          setTheme={setTheme}
          unreadCount={unreadCount}
          notifications={notifications}
          onOpenBookingModal={() => {
            setPreselectedResource('');
            setPreselectedDate('');
            setIsBookingModalOpen(true);
          }}
          setIsMobileOpen={setIsMobileOpen}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          onSignOut={() => {
            localStorage.removeItem('smart-campus-session');
            setIsAuthenticated(false);
          }}
        />

        {/* View Router */}
        <main style={{ flex: 1, position: 'relative', zIndex: 10, paddingBottom: '40px' }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              resources={resources}
              bookings={bookings}
              currentRole={currentRole}
              onOpenBookingModal={() => setIsBookingModalOpen(true)}
              setActiveTab={setActiveTab}
              onSelectResource={(item) => triggerBookResource(item.resourceName)}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesView
              resources={resources}
              setResources={setResources}
              onOpenAddModal={() => setIsAddResourceModalOpen(true)}
              onBookResource={triggerBookResource}
              onUpdateStatus={handleUpdateResourceStatus}
              onDeleteResource={handleDeleteResource}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              currentRole={currentRole}
              reviewUserId={new URLSearchParams(window.location.search).get('reviewUser') || ''}
            />
          )}

          {activeTab === 'calendar' && (
            <BookingCalendarView
              resources={resources}
              bookings={bookings}
              currentRole={currentRole}
              onOpenBookingModal={() => setIsBookingModalOpen(true)}
              onBookSlot={triggerBookSlot}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              bookings={bookings}
              setBookings={setBookings}
              currentRole={currentRole}
              onOpenBookingModal={() => setIsBookingModalOpen(true)}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteBooking={handleDeleteBooking}
              isMyBookingsOnly={false}
              reviewBookingId={new URLSearchParams(window.location.search).get('reviewBooking') || ''}
            />
          )}

          {activeTab === 'my-bookings' && (
            <BookingsView
              bookings={bookings}
              setBookings={setBookings}
              currentRole={currentRole}
              onOpenBookingModal={() => setIsBookingModalOpen(true)}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteBooking={handleDeleteBooking}
              isMyBookingsOnly={true}
            />
          )}

          {activeTab === 'reports' && <ReportsView resources={resources} bookings={bookings} />}

          {activeTab === 'analytics' && (
            <AnalyticsView
              resources={resources}
              bookings={bookings}
              setActiveTab={setActiveTab}
              onSelectResource={(item) => triggerBookResource(item.resourceName)}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              setNotifications={setNotifications}
              onMarkAllRead={handleMarkNotificationsRead}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentRole={currentRole}
              setCurrentRole={setCurrentRole}
              onSignOut={() => {
                localStorage.removeItem('smart-campus-session');
                setIsAuthenticated(false);
              }}
            />
          )}

        </main>
      </div>

      {/* Interactive Modals */}
      <BookingWizardModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        resources={resources}
        bookings={bookings}
        onAddNewBooking={handleAddNewBooking}
        currentRole={currentRole}
        preselectedResource={preselectedResource}
        preselectedDate={preselectedDate}
      />

      <AddResourceModal
        isOpen={isAddResourceModalOpen}
        onClose={() => setIsAddResourceModalOpen(false)}
        onAddResource={handleAddResource}
      />
    </div>
  );
}
