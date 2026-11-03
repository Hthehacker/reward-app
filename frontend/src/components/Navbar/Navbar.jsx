import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Coins,
  Zap,
  ShieldAlert,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ChevronDown,
  Gift,
  Trophy,
  Award,
  HelpCircle,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { scrollToSection, scrollToTop } from '../../utils/scrollHelper.js';
import logo from '../../assets/veloop-logo.svg';
import styles from './Navbar.module.css';

/**
 * Navbar – Redesigned premium navigation system for VELoop Rewards.
 * Features:
 *   - Clean brand identity and sleek glassmorphic desktop bar
 *   - Interactive drop-down for user accounts, logout, and direct Admin Dashboard access
 *   - Direct one-click Admin Panel navigation for admin users
 *   - Fluid responsive drawer for mobile/tablet with touch targets & zero overflow
 *   - Smooth body scroll lock during mobile menu display with clean unlock before scrolling
 */
export const Navbar = ({ onOpenEarnModal }) => {
  const { user, isLoggedIn, isAdmin, login, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMobile = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const toggleMobile = () => {
    setMobileMenuOpen((prev) => {
      const next = !prev;
      if (!next) {
        document.body.style.overflow = '';
      }
      return next;
    });
  };

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle ESC key to dismiss drawer or dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) closeMobile();
        if (profileDropdownOpen) setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, profileDropdownOpen]);

  // Check if link matches section or path
  const isGiveawaysActive = location.pathname === '/' || location.pathname.startsWith('/giveaway');

  const handleNavAnchor = (e, targetId) => {
    if (e && e.preventDefault) e.preventDefault();
    closeMobile();

    if (location.pathname === '/') {
      scrollToSection(targetId);
      window.history.replaceState(null, '', `/#${targetId}`);
    } else {
      navigate(`/#${targetId}`, { state: { scrollTo: targetId } });
    }
  };

  const handleHomeClick = (e) => {
    closeMobile();
    if (location.pathname === '/') {
      if (e && e.preventDefault) e.preventDefault();
      scrollToTop();
      window.history.replaceState(null, '', '/');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className="container">
        <div className={styles.navContainer}>
          {/* Brand Logo */}
          <Link to="/" className={styles.brandLink} onClick={handleHomeClick}>
            <img src={logo} alt="VELoop Rewards" className={styles.logoImg} />
          </Link>

          {/* Desktop Navigation Links */}
          <ul className={styles.navLinks}>
            <li>
              <Link
                to="/"
                className={`${styles.navLink} ${isGiveawaysActive ? styles.active : ''}`}
                onClick={handleHomeClick}
              >
                Giveaways
              </Link>
            </li>
            <li>
              <a
                href="#prizes"
                className={styles.navLink}
                onClick={(e) => handleNavAnchor(e, 'prizes')}
              >
                Prize Pool
              </a>
            </li>
            <li>
              <a
                href="#how-it-works"
                className={styles.navLink}
                onClick={(e) => handleNavAnchor(e, 'how-it-works')}
              >
                How to Enter
              </a>
            </li>
            <li>
              <a
                href="#winners-section"
                className={styles.navLink}
                onClick={(e) => handleNavAnchor(e, 'winners-section')}
              >
                Official Winners
              </a>
            </li>
            <li>
              <a
                href="#rules-faq"
                className={styles.navLink}
                onClick={(e) => handleNavAnchor(e, 'rules-faq')}
              >
                Rules & FAQ
              </a>
            </li>
          </ul>

          {/* Right Action Area */}
          <div className={styles.rightArea}>
            {isLoggedIn ? (
              <>
                {/* Authoritative Currency Ticker (Desktop/Tablet) – Only shown for normal users */}
                {!isAdmin && (
                  <div className={styles.balancePill}>
                    <div className={styles.balanceItem} title="Veloop Entries (VEs)">
                      <Coins size={14} className={styles.veText} />
                      <span className={styles.veText}>{user?.balances?.VEs ?? 0}</span>
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>VEs</span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.balanceItem} title="Special Veloop Entries (SVEs)">
                      <Zap size={14} className={styles.sveText} />
                      <span className={styles.sveText}>{user?.balances?.SVEs ?? 0}</span>
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>SVEs</span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.balanceItem} title="Platform Tokens">
                      <span className={styles.tokenText}>🪙</span>
                      <span className={styles.tokenText}>{user?.balances?.tokens ?? 0}</span>
                    </div>

                    {onOpenEarnModal && (
                      <button
                        className={styles.earnQuickBtn}
                        onClick={onOpenEarnModal}
                        title="Earn additional VEs"
                        aria-label="Earn more VEs"
                      >
                        <PlusCircle size={13} />
                        <span>Earn</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Direct Admin Panel Navigation Button for Admins */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={styles.adminNavBtn}
                    title="Access VELoop Admin Dashboard"
                    aria-label="Admin Dashboard"
                  >
                    <ShieldAlert size={14} className={styles.adminIcon} />
                    <span className={styles.adminBtnText}>Admin Panel</span>
                    <span className={styles.adminBtnTextShort}>Admin</span>
                  </Link>
                )}

                {/* Profile Dropdown Menu */}
                <div className={styles.profileMenuWrapper} ref={dropdownRef}>
                  <button
                    className={styles.profileTriggerBtn}
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    aria-label="User Account Menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    <div className={styles.userAvatar}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} color="#94a3b8" />
                  </button>

                  {profileDropdownOpen && (
                    <div className={styles.profileDropdown}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownUserName}>{user?.name}</div>
                        <div className={styles.dropdownUserId}>
                          ID: {user?.userId} {isAdmin && '• [Admin]'}
                        </div>
                      </div>

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            className={styles.dropdownItem}
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <LayoutDashboard size={15} color="#c084fc" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link
                            to="/admin/prizes"
                            className={styles.dropdownItem}
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Trophy size={15} color="#38bdf8" />
                            <span>Prize Catalog</span>
                          </Link>
                          <div className={styles.dropdownDivider} />
                        </>
                      )}

                      {!isAdmin && onOpenEarnModal && (
                        <button
                          className={styles.dropdownItem}
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenEarnModal();
                          }}
                        >
                          <Sparkles size={15} color="#f59e0b" />
                          <span>Earn Reward Credits</span>
                        </button>
                      )}

                      <button
                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.authBtnGroup}>
                <button
                  type="button"
                  className={styles.adminDirectNavBtn}
                  onClick={() => login({ userId: 'VE_ADMIN' })}
                  title="Direct 1-Click Admin Access"
                >
                  <ShieldAlert size={14} />
                  <span>👑 Admin Login</span>
                </button>
                <button
                  className={styles.signInBtn}
                  onClick={() => openAuthModal('login')}
                >
                  Sign In
                </button>
                <button
                  className={styles.registerBtn}
                  onClick={() => openAuthModal('register')}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              className={`${styles.mobileMenuToggle} ${mobileMenuOpen ? styles.toggleOpen : ''}`}
              onClick={toggleMobile}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER & BACKDROP (Portal to document.body for true viewport-relative positioning) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className={`${styles.mobileDrawerBackdrop} ${mobileMenuOpen ? styles.backdropOpen : ''}`}
              onClick={closeMobile}
              aria-hidden="true"
            />

            <aside
              className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.drawerOpen : ''}`}
              aria-hidden={!mobileMenuOpen}
            >
              <div className={styles.mobileDrawerHeader}>
                <Link to="/" onClick={handleHomeClick} className={styles.brandLink}>
                  <img src={logo} alt="VELoop" className={styles.logoImg} />
                </Link>
                <button onClick={closeMobile} className={styles.closeMobileBtn} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              {/* Navigation list */}
              <ul className={styles.mobileNavList}>
                <li>
                  <Link
                    to="/"
                    className={styles.mobileNavLink}
                    onClick={handleHomeClick}
                  >
                    <span>Giveaways</span>
                    <Gift size={16} />
                  </Link>
                </li>
                <li>
                  <a
                    href="#prizes"
                    className={styles.mobileNavLink}
                    onClick={(e) => handleNavAnchor(e, 'prizes')}
                  >
                    <span>Prize Pool</span>
                    <Trophy size={16} />
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className={styles.mobileNavLink}
                    onClick={(e) => handleNavAnchor(e, 'how-it-works')}
                  >
                    <span>How to Enter</span>
                    <HelpCircle size={16} />
                  </a>
                </li>
                <li>
                  <a
                    href="#winners-section"
                    className={styles.mobileNavLink}
                    onClick={(e) => handleNavAnchor(e, 'winners-section')}
                  >
                    <span>Official Winners</span>
                    <Award size={16} />
                  </a>
                </li>
                <li>
                  <a
                    href="#rules-faq"
                    className={styles.mobileNavLink}
                    onClick={(e) => handleNavAnchor(e, 'rules-faq')}
                  >
                    <span>Rules & FAQ</span>
                    <HelpCircle size={16} />
                  </a>
                </li>
              </ul>

              {/* User Card / Balances on Mobile */}
              {isLoggedIn ? (
                <div className={styles.mobileBalancesCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div className={styles.userAvatar}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {user?.userId}</div>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={styles.mobileAdminNavBtn}
                      onClick={closeMobile}
                    >
                      <ShieldAlert size={16} />
                      <span>Open Admin Panel</span>
                    </Link>
                  )}

                  {!isAdmin && (
                    <div className={styles.mobileBalancesGrid}>
                      <div className={styles.mobileBalBox}>
                        <span className={`${styles.mobileBalVal} ${styles.veText}`}>
                          {user?.balances?.VEs ?? 0}
                        </span>
                        <span className={styles.mobileBalLbl}>VEs</span>
                      </div>
                      <div className={styles.mobileBalBox}>
                        <span className={`${styles.mobileBalVal} ${styles.sveText}`}>
                          {user?.balances?.SVEs ?? 0}
                        </span>
                        <span className={styles.mobileBalLbl}>SVEs</span>
                      </div>
                      <div className={styles.mobileBalBox}>
                        <span className={`${styles.mobileBalVal} ${styles.tokenText}`}>
                          {user?.balances?.tokens ?? 0}
                        </span>
                        <span className={styles.mobileBalLbl}>Tokens</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      closeMobile();
                      logout();
                    }}
                    className={styles.dropdownItem}
                    style={{ color: '#fda4af', marginTop: '14px', justifyContent: 'center' }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className={styles.adminDirectNavBtn}
                    onClick={() => {
                      closeMobile();
                      login({ userId: 'VE_ADMIN' });
                    }}
                  >
                    <ShieldAlert size={15} />
                    <span>👑 Direct Admin Login</span>
                  </button>
                  <button
                    className={styles.signInBtn}
                    onClick={() => {
                      closeMobile();
                      openAuthModal('login');
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    className={styles.registerBtn}
                    onClick={() => {
                      closeMobile();
                      openAuthModal('register');
                    }}
                  >
                    Create Account
                  </button>
                </div>
              )}
            </aside>
          </>,
          document.body
        )}
    </nav>
  );
};

export default Navbar;
