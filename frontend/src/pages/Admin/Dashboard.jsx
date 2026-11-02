import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Gift,
  Trophy,
  Users,
  UserCheck,
  Award,
  BarChart3,
  Coins,
  Menu,
  X,
  ExternalLink,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import logo from '../../assets/veloop-logo.svg';
import styles from './Dashboard.module.css';

/**
 * AdminDashboard – Master layout for VELoop Rewards administration.
 * Features:
 *   - Modern dark gradient sidebar with responsive drawer for mobile/tablet
 *   - Dedicated Prize Management navigation section
 *   - Sticky glassmorphic topbar with quick actions (View Site, Reset Demo, User Profile)
 *   - Fluid responsive grid container that eliminates horizontal scroll
 */
const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, showToast } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const navItems = [
    {
      to: '/admin/giveaways',
      label: 'Giveaways',
      icon: Gift,
      description: 'Manage giveaway events & status'
    },
    {
      to: '/admin/prizes',
      label: 'Prize Management',
      icon: Trophy,
      badge: 'New',
      description: 'Catalog, edit & assign prizes'
    },
    {
      to: '/admin/users',
      label: 'Users',
      icon: Users,
      description: 'Accounts, balances & roles'
    },
    {
      to: '/admin/coins',
      label: 'Coin Management',
      icon: Coins,
      badge: 'New',
      description: 'User balances, adjustments & history'
    },
    {
      to: '/admin/participants',
      label: 'Participants',
      icon: UserCheck,
      description: 'Entries & fraud monitoring'
    },
    {
      to: '/admin/winners',
      label: 'Winners',
      icon: Award,
      description: 'Selection & claim fulfillment'
    },
    {
      to: '/admin/analytics',
      label: 'Analytics & Logs',
      icon: BarChart3,
      description: 'Platform metrics & audit logs'
    }
  ];

  // Resolve current active page title for TopBar
  const currentNav = navItems.find((item) => location.pathname.startsWith(item.to));
  const pageTitle = currentNav ? currentNav.label : 'Admin Panel';

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo database? This will restore original sample giveaways, prizes, and users.')) {
      return;
    }
    setResetting(true);
    try {
      await api.adminResetDemo();
      showToast('Demo data reset successfully!', 'success');
      window.location.reload();
    } catch (err) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={styles.adminLayout}>
      {/* Mobile Backdrop */}
      {mobileDrawerOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${mobileDrawerOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.brandLink} onClick={() => setMobileDrawerOpen(false)}>
            <img src={logo} alt="VELoop" className={styles.brandLogo} />
            <span className={styles.brandBadge}>Admin</span>
          </Link>
          <button
            className={styles.closeDrawerBtn}
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close admin navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>Core Management</div>
          <ul className={styles.navList}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <li key={item.to} className={styles.navItem}>
                  <Link
                    to={item.to}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Icon size={18} className={styles.navIcon} />
                    <span>{item.label}</span>
                    {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer with Admin Profile */}
        <div className={styles.sidebarFooter}>
          <div className={styles.adminCard}>
            <div className={styles.adminAvatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className={styles.adminInfo}>
              <div className={styles.adminName}>{user?.name || 'Administrator'}</div>
              <div className={styles.adminRole}>Super Admin</div>
            </div>
            <ShieldCheck size={16} color="#38bdf8" />
          </div>

          <div className={styles.sidebarActionRow}>
            <Link to="/" className={styles.sidebarActionBtn}>
              <ExternalLink size={14} />
              <span>Live Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className={`${styles.sidebarActionBtn} ${styles.logoutBtn}`}
              title="Sign out of Admin"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.contentWrapper}>
        {/* Sticky Glassmorphic TopBar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.drawerToggleBtn}
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <h1 className={styles.topBarTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.topBarRight}>
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className={styles.resetDemoBtn}
              title="Re-seed initial demo dataset"
            >
              <RefreshCw size={14} className={resetting ? 'fa-spin' : ''} />
              <span>{resetting ? 'Resetting…' : 'Reset Demo'}</span>
            </button>

            <Link to="/" className={styles.viewSiteBtn} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              <span>View Public App</span>
            </Link>
          </div>
        </header>

        {/* Nested Content Route */}
        <main className={styles.mainContainer}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
