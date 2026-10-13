import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, Zap, ShieldCheck, UserCheck, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/veloop-logo.svg';
import styles from './Navbar.module.css';

export const Navbar = ({ onOpenEarnModal }) => {
  const { user, isLoggedIn, logout, login } = useAuth();

  return (
    <nav className={styles.navbar}>
      <div className="container">
        <div className={styles.navContainer}>
          {/* Logo */}
          <Link to="/" className={styles.brandLink}>
            <img src={logo} alt="VELOOP Rewards" className={styles.logoImg} />
          </Link>

          {/* Nav links */}
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
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{user.userId}</span>
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
