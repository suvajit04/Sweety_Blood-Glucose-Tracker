import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Activity, BarChart3, CalendarDays, ChevronDown, LayoutDashboard, LogOut, Menu, Plus, Users, X } from 'lucide-react';
import { Brand } from '../components/Brand';
import { useAuth } from '../context/AuthContext';

const patientNavigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/readings', label: 'My readings', icon: Activity },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];
const doctorNavigation = [
  { to: '/doctor/patients', label: 'My patients', icon: Users },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigation = user?.role === 'DOCTOR' ? doctorNavigation : patientNavigation;

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpen]);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll on mobile when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation menu backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Sidebar navigation">
        <div className="sidebar-brand">
          <Link
            to={user?.role === 'DOCTOR' ? '/doctor/patients' : '/dashboard'}
            className="sidebar-brand-link"
            onClick={() => setMobileOpen(false)}
          >
            <Brand />
          </Link>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-caption">
          {user?.role === 'DOCTOR' ? 'CLINICAL SPACE' : 'YOUR SPACE'}
        </div>

        <nav className="side-nav" aria-label="Main menu">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">
              <CalendarDays size={16} />
            </span>
            <strong>Little steps add up.</strong>
            <p>Keep a steady routine and log your readings when you can.</p>
          </div>
          <div className="sidebar-footer">
            Made with care <span className="heart-span">♥</span>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-toggle"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="topbar-journal-chip">
              <span className="journal-pulse-dot" />
              <span className="journal-text">
                {user?.role === 'DOCTOR' ? 'Clinical Portal' : 'Your health journal'}
              </span>
            </div>
            <div className="topbar-date">
              <CalendarDays size={14} />
              <span>{todayFormatted}</span>
            </div>
          </div>

          <div className="topbar-actions">
            {user?.role !== 'DOCTOR' && (
              <button
                className="top-add-button"
                onClick={() => navigate('/readings?new=1')}
                title="Add a new reading"
              >
                <Plus size={16} strokeWidth={2.4} />
                <span>Add reading</span>
              </button>
            )}

            <div className="profile-wrap" ref={profileRef}>
              <button
                className={`profile-button ${profileOpen ? 'active' : ''}`}
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                aria-label="Account options"
              >
                <span className="avatar">
                  {user?.name?.charAt(0).toUpperCase() ?? 'S'}
                </span>
                <span className="profile-name">
                  {user?.name ?? 'My account'}
                </span>
                <ChevronDown size={15} className={`profile-chevron ${profileOpen ? 'open' : ''}`} />
              </button>

              {profileOpen && (
                <div className="profile-menu" role="menu">
                  <div className="profile-menu-header">
                    <span className="avatar menu-avatar">
                      {user?.name?.charAt(0).toUpperCase() ?? 'S'}
                    </span>
                    <div className="profile-menu-user">
                      <strong className="profile-menu-name">{user?.name}</strong>
                      <span className="profile-menu-email">{user?.email}</span>
                      <span className="profile-role-tag">
                        {user?.role === 'DOCTOR' ? 'Doctor' : 'Patient'}
                      </span>
                    </div>
                  </div>
                  <div className="profile-menu-divider" />
                  <button className="profile-logout-button" onClick={handleLogout} role="menuitem">
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
