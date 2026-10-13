import React from 'react';
import { Eye, ShieldCheck, Scale, Award } from 'lucide-react';
import styles from './TrustSection.module.css';

export const TrustSection = () => {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.trustGrid}>
          {/* 1 */}
          <div className={styles.trustItem}>
            <div className={styles.iconBox}>
              <Eye size={22} />
            </div>
            <h3 className={styles.title}>100% Transparent</h3>
            <p className={styles.desc}>
              Giveaway rules, entry criteria, and selection parameters are fully visible to all members before entry.
            </p>
          </div>

          {/* 2 */}
          <div className={styles.trustItem}>
            <div className={styles.iconBox}>
              <ShieldCheck size={22} />
            </div>
            <h3 className={styles.title}>Fintech-Grade Security</h3>
            <p className={styles.desc}>
              User identity and fulfillment records are encrypted. We never expose private emails, phone numbers, or addresses.
            </p>
          </div>

          {/* 3 */}
          <div className={styles.trustItem}>
            <div className={styles.iconBox}>
              <Scale size={22} />
            </div>
            <h3 className={styles.title}>Fair Participation</h3>
            <p className={styles.desc}>
              Strict one-entry-per-member enforcement with automated anti-bot device verification for genuine participants.
            </p>
          </div>

          {/* 4 */}
          <div className={styles.trustItem}>
            <div className={styles.iconBox}>
              <Award size={22} />
            </div>
            <h3 className={styles.title}>Reward Authenticity</h3>
            <p className={styles.desc}>
              Prizes are brand-new, factory-sealed authentic devices and direct merchant gift cards with active redemption guarantees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
