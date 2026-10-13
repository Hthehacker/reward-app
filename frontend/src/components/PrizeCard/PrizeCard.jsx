import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users, Clock, Coins, Zap } from 'lucide-react';
import styles from './PrizeCard.module.css';

export const PrizeCard = ({ prize, giveawayStatus = 'ACTIVE', participantsCount = '2.3K+' }) => {
  if (!prize) return null;

  const isFirstPrize = prize.position?.toLowerCase().includes('1st');

  const formatCurrencyLabel = (currency) => {
    if (currency === 'VE') return 'VEs';
    if (currency === 'SVE') return 'SVEs';
    return 'Tokens';
  };

  return (
    <div className={styles.card}>
      {/* Header: Position & Winner limit */}
      <div className={styles.cardHeader}>
        <span className={`${styles.positionBadge} ${isFirstPrize ? styles.badgeFirst : ''}`}>
          {prize.position}
        </span>
        <span className={styles.winnerCountBadge}>
          <Trophy size={13} />
          {prize.winnerCount} {prize.winnerCount === 1 ? 'Winner' : 'Winners'}
        </span>
      </div>

      {/* Prize Visual */}
      <div className={styles.imageWrap}>
        <img
          src={prize.image}
          alt={prize.name}
          className={styles.prizeImg}
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className={styles.contentBody}>
        <h3 className={styles.prizeName}>{prize.name}</h3>
        <p className={styles.description}>{prize.description}</p>

        {/* Metadata: Entry Fee & Participants */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Entry Fee</span>
            <span className={`${styles.metaValue} ${styles.feeHighlight}`}>
              {prize.entryFee} {formatCurrencyLabel(prize.entryCurrency)}
            </span>
          </div>

          <div className={styles.metaItem} style={{ textAlign: 'right' }}>
            <span className={styles.metaLabel}>Est. Value</span>
            <span className={styles.metaValue}>{prize.approxValue || 'Exclusive'}</span>
          </div>
        </div>
      </div>

      {/* Footer CTA: Leads to Dedicated Individual Page */}
      <div className={styles.cardFooter}>
        <Link
          to={`/giveaway/${prize.slug}`}
          className={styles.joinBtn}
        >
          <span>View Details & Join</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default PrizeCard;
