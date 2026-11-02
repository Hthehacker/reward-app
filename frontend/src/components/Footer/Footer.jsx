import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/veloop-logo.svg';
import { scrollToSection, scrollToTop } from '../../utils/scrollHelper.js';
import styles from './Footer.module.css';

export const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleFooterAnchor = (e, targetId) => {
    e.preventDefault();
    if (location.pathname === '/') {
      scrollToSection(targetId);
      window.history.replaceState(null, '', `/#${targetId}`);
    } else {
      navigate(`/#${targetId}`, { state: { scrollTo: targetId } });
    }
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      scrollToTop();
      window.history.replaceState(null, '', '/');
    }
  };
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topRow}>
          <div className={styles.brandCol}>
            <img src={logo} alt="VELOOP Rewards" className={styles.logoImg} />
            <p className={styles.brandDesc}>
              The premier reward experience. Earn virtual credits through genuine platform engagement and unlock authentic tech rewards and vouchers.
            </p>
          </div>

          <div className={styles.linksCol}>
            <div className={styles.linkGroup}>
              <span className={styles.groupTitle}>Giveaway</span>
              <Link to="/" className={styles.linkItem} onClick={handleHomeClick}>Giveaway Home</Link>
              <a href="#prizes" className={styles.linkItem} onClick={(e) => handleFooterAnchor(e, 'prizes')}>Active Prize Pool</a>
              <a href="#winners-section" className={styles.linkItem} onClick={(e) => handleFooterAnchor(e, 'winners-section')}>Official Winners</a>
              <a href="#how-it-works" className={styles.linkItem} onClick={(e) => handleFooterAnchor(e, 'how-it-works')}>How to Enter</a>
            </div>

            <div className={styles.linkGroup}>
              <span className={styles.groupTitle}>Integrity</span>
              <a href="#rules-faq" className={styles.linkItem} onClick={(e) => handleFooterAnchor(e, 'rules-faq')}>Official Rules</a>
              <a href="#rules-faq" className={styles.linkItem} onClick={(e) => handleFooterAnchor(e, 'rules-faq')}>Terms of Service</a>
              <a href="#rules-faq" className={styles.linkItem} onClick={(e) => handleFooterAnchor(e, 'rules-faq')}>Privacy Policy</a>
              <a href="#rules-faq" className={styles.linkItem} onClick={(e) => handleFooterAnchor(e, 'rules-faq')}>Anti-Fraud Charter</a>
            </div>

            <div className={styles.linkGroup}>
              <span className={styles.groupTitle}>Assistance</span>
              <span className={styles.linkItem}>support@veloop.io</span>
              <span className={styles.linkItem}>Live Help Center</span>
              <span className={styles.linkItem}>Claim Verification</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <span className={styles.copyText}>
            © {new Date().getFullYear()} VELOOP Rewards Ecosystem. All rights reserved. Not affiliated with Apple or Amazon.
          </span>
          <span className={styles.supportNotice}>
            Have questions? Contact{' '}
            <a href="mailto:support@veloop.io" className={styles.supportLink}>
              VELOOP Rewards Support
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
