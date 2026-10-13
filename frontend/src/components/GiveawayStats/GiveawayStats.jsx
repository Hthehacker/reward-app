import React from 'react';
import { Gift, Users, Trophy, Hourglass } from 'lucide-react';
import styles from './GiveawayStats.module.css';

export const GiveawayStats = ({ stats, giveaway }) => {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className="row g-3 g-md-4">
          {/* Total Giveaways */}
          <div className="col-6 col-lg-3">
            <div className={styles.statCard}>
              <div className={`${styles.iconWrap} ${styles.iconCyan}`}>
                <Gift size={22} />
              </div>
              <div className={styles.info}>
                <span className={styles.title}>Total Giveaways</span>
                <span className={styles.value}>{stats?.activeGiveawayLabel || '24 Active'}</span>
                <span className={styles.subtext}>Verified rounds</span>
              </div>
            </div>
          </div>

          {/* Total Participants */}
          <div className="col-6 col-lg-3">
            <div className={styles.statCard}>
              <div className={`${styles.iconWrap} ${styles.iconIndigo}`}>
                <Users size={22} />
              </div>
              <div className={styles.info}>
                <span className={styles.title}>Total Participants</span>
                <span className={styles.value}>{stats?.totalParticipants || '8.5K+'}</span>
                <span className={styles.subtext}>Active members</span>
              </div>
            </div>
          </div>

          {/* Prizes Won */}
          <div className="col-6 col-lg-3">
            <div className={styles.statCard}>
              <div className={`${styles.iconWrap} ${styles.iconGold}`}>
                <Trophy size={22} />
              </div>
              <div className={styles.info}>
                <span className={styles.title}>Prizes Won</span>
                <span className={styles.value}>{stats?.prizesWon || '1.2K+'}</span>
                <span className={styles.subtext}>Claimed & delivered</span>
              </div>
            </div>
          </div>

          {/* Giveaway Cycle / Duration */}
          <div className="col-6 col-lg-3">
            <div className={styles.statCard}>
              <div className={`${styles.iconWrap} ${styles.iconGreen}`}>
                <Hourglass size={22} />
              </div>
              <div className={styles.info}>
                <span className={styles.title}>Giveaway Cycle</span>
                <span className={styles.value}>14 Days</span>
                <span className={styles.subtext}>Bi-weekly draws</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiveawayStats;
