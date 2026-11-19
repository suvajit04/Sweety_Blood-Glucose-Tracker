import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, CalendarDays, ChevronDown, LayoutDashboard, LogOut, Menu, Plus, X } from 'lucide-react';
import { Brand } from '../components/Brand';
import { useAuth } from '../context/AuthContext';

const patientNavigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/readings', label: 'My readings', icon: Activity },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];
const doctorNavigation = [
  { to: '/doctor/patients', label: 'My patients', icon: Activity },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigation = user?.role === 'DOCTOR' ? doctorNavigation : patientNavigation;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
        <div className="sidebar-caption">YOUR SPACE</div>
        <nav className="side-nav">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span className="tip-icon"><CalendarDays size={17} /></span><strong>Little steps add up.</strong><p>Keep a steady routine and log your readings when you can.</p></div>
          <div className="sidebar-footer">Made with care <span>♥</span></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button menu-toggle" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="topbar-date"><CalendarDays size={15} /> Your health journal</div>
          <div className="topbar-actions">
            {user?.role !== 'DOCTOR' && <button className="top-add-button" onClick={() => navigate('/readings?new=1')}><Plus size={16} /> Add reading</button>}
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
                <span className="avatar">{user?.name?.charAt(0).toUpperCase() ?? 'S'}</span>
                <span className="profile-name">{user?.name ?? 'My account'}</span><ChevronDown size={15} />
              </button>
              {profileOpen && <div className="profile-menu"><div className="profile-email">{user?.email}</div><button onClick={handleLogout}><LogOut size={16} /> Sign out</button></div>}
            </div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
