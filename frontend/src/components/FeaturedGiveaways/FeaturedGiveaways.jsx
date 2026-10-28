import React, { useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import PrizeCard from '../ParticipationModal/PrizeCard/PrizeCard.jsx';
import styles from './FeaturedGiveaways.module.css';

export const FeaturedGiveaways = ({ prizes = [], giveawayStatus = 'ACTIVE' }) => {
  const [filter, setFilter] = useState('ALL');

  const filteredPrizes = prizes.filter((prize) => {
    if (filter === 'PHYSICAL') return prize.type === 'physical';
    if (filter === 'VOUCHERS') return prize.type === 'gift_card';
    if (filter === 'TOKENS') return prize.entryCurrency === 'TOKEN';
    return true;
  });

  return (
    <section id="prizes" className={styles.section}>
      <div className="container">
        <div className={styles.headerWrap}>
          <div className={styles.sectionBadge}>
            <Sparkles size={13} />
            CURRENT PRIZE POOL
          </div>
          <h2 className={styles.sectionTitle}>Featured Giveaway Rewards</h2>
          <p className={styles.sectionSub}>
            Participate with your earned virtual credits. All rewards are authentic, verified, and backed by VELOOP guarantee.
          </p>

          <div className={styles.filterRow}>
            <button
              className={`${styles.filterBtn} ${filter === 'ALL' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All Rewards ({prizes.length})
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'PHYSICAL' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('PHYSICAL')}
            >
              Flagship Hardware
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'VOUCHERS' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('VOUCHERS')}
            >
              Amazon Vouchers
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'TOKENS' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('TOKENS')}
            >
              Token Draw
            </button>
          </div>
        </div>

        <div className="row g-4">
          {filteredPrizes.map((prize) => (
            <div key={prize.prizeId || prize._id} className="col-12 col-md-6 col-lg-4">
              <PrizeCard prize={prize} giveawayStatus={giveawayStatus} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedGiveaways;
