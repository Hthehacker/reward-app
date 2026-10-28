import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Coins, Zap, ShieldCheck, UserCheck, PlusCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/veloop-logo.svg';
import styles from './Navbar.module.css';

export const Navbar = ({ onOpenEarnModal }) => {
  const { user, isLoggedIn, logout, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className="container">
        <div className={styles.navContainer}>
          {/* Logo */}
          <Link to="/" className={styles.brandLink} onClick={handleLinkClick}>
            <img src={logo} alt="VELOOP Rewards" className={styles.logoImg} />
          </Link>

          {/* Desktop Nav links */}
          <ul className={styles.navLinks}>
            <li>
              <Link to="/" className={styles.navLink}>Giveaways</Link>
            </li>
            <li>
              <a href="#prizes" className={styles.navLink}>Prizes</a>
            </li>
            <li>
              <a href="#how-it-works" className={styles.navLink}>How to Enter</a>
            </li>
            <li>
              <a href="#winners-section" className={styles.navLink}>Winners</a>
            </li>
            <li>
              <a href="#rules-faq" className={styles.navLink}>Rules & FAQ</a>
            </li>
          </ul>

          {/* User state and Balances */}
          <div className={styles.rightArea}>
            {isLoggedIn ? (
              <>
                <div className={styles.balancePill}>
                  <div className={styles.balanceItem} title="Veloop Entries (VEs)">
                    <Coins size={14} className={styles.veText} />
                    <span className={styles.veText}>{user.balances?.VEs ?? 0}</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>VEs</span>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.balanceItem} title="Special Veloop Entries (SVEs)">
                    <Zap size={14} className={styles.sveText} />
                    <span className={styles.sveText}>{user.balances?.SVEs ?? 0}</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>SVEs</span>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.balanceItem} title="VELOOP Platform Tokens">
                    <span className={styles.tokenText}>🪙</span>
                    <span className={styles.tokenText}>{user.balances?.tokens ?? 0}</span>
                  </div>

                  {onOpenEarnModal && (
                    <button
                      className={styles.earnQuickBtn}
                      onClick={onOpenEarnModal}
                      title="Complete daily activity to earn more VEs"
                      aria-label="Earn more VEs"
                    >
                      <PlusCircle size={13} />
                      Earn
                    </button>
                  )}
                </div>

                <div className={styles.userBadge} title={`Logged in as ${user.name} (${user.userId})`}>
                  <div className={styles.userAvatar}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="d-none d-sm-inline">{user.name.split(' ')[0]}</span>
                  <span className="d-none d-md-inline" style={{ color: '#64748b', fontSize: '0.75rem' }}>{user.userId}</span>
                </div>
              </>
            ) : (
              <button
                className="btn-veloop-primary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                onClick={() => login('VE10025')}
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              className={styles.menuToggleBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className="container">
          <ul className={styles.mobileNavLinks}>
            <li>
              <Link to="/" className={styles.mobileNavLink} onClick={handleLinkClick}>
                Giveaways
              </Link>
            </li>
            <li>
              <a href="#prizes" className={styles.mobileNavLink} onClick={handleLinkClick}>
                Prize Pool
              </a>
            </li>
            <li>
              <a href="#how-it-works" className={styles.mobileNavLink} onClick={handleLinkClick}>
                How to Enter
              </a>
            </li>
            <li>
              <a href="#winners-section" className={styles.mobileNavLink} onClick={handleLinkClick}>
                Official Winners
              </a>
            </li>
            <li>
              <a href="#rules-faq" className={styles.mobileNavLink} onClick={handleLinkClick}>
                Rules & FAQ
              </a>
            </li>
          </ul>

          {isLoggedIn && (
            <div className={styles.mobileUserSection}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className={styles.userAvatar}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>
                      {user.name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      ID: {user.userId}
                    </div>
                  </div>
                </div>

                {onOpenEarnModal && (
                  <button
                    className="btn-veloop-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenEarnModal();
                    }}
                  >
                    <PlusCircle size={14} />
                    <span>Earn Credits</span>
                  </button>
                )}
              </div>

              {/* Full Balance Grid on Mobile */}
              <div className={styles.mobileBalancesList}>
                <div className={styles.mobileBalanceCard}>
                  <span className={`${styles.mobileBalanceVal} ${styles.veText}`}>
                    {user.balances?.VEs ?? 0}
                  </span>
                  <span className={styles.mobileBalanceLbl}>VEs Balance</span>
                </div>
                <div className={styles.mobileBalanceCard}>
                  <span className={`${styles.mobileBalanceVal} ${styles.sveText}`}>
                    {user.balances?.SVEs ?? 0}
                  </span>
                  <span className={styles.mobileBalanceLbl}>SVEs Balance</span>
                </div>
                <div className={styles.mobileBalanceCard}>
                  <span className={`${styles.mobileBalanceVal} ${styles.tokenText}`}>
                    {user.balances?.tokens ?? 0}
                  </span>
                  <span className={styles.mobileBalanceLbl}>Tokens</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
