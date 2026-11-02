import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Sparkles } from 'lucide-react';
import styles from './PrizeCard.module.css';

export const PrizeCard = ({ prize, giveawayStatus = 'ACTIVE' }) => {
  if (!prize) return null;

  const isFirstPrize = prize.position?.toLowerCase().includes('1st');

  const formatCurrencyLabel = (currency) => {
    if (currency === 'VE') return 'VEs';
    if (currency === 'SVE') return 'SVEs';
    return 'Tokens';
  };

  const isEnded = giveawayStatus === 'ENDED';

  return (
    <div className={styles.card}>
      {/* Glow highlight for 1st prize */}
      {isFirstPrize && <div className={styles.topGlow} />}

      {/* Header: Position & Winner limit */}
      <div className={styles.cardHeader}>
        <span className={`${styles.positionBadge} ${isFirstPrize ? styles.badgeFirst : ''}`}>
          {isFirstPrize && <Sparkles size={11} style={{ marginRight: '4px' }} />}
          {prize.position}
        </span>
        <span className={styles.winnerCountBadge}>
          <Trophy size={13} />
          {prize.winnerCount} {prize.winnerCount === 1 ? 'Winner' : 'Winners'}
        </span>
      </div>

      {/* Prize Visual with fixed aspect ratio container */}
      <div className={styles.imageWrap}>
        <div className={styles.imageAura} />
        <img
          src={prize.image}
          alt={prize.name}
          className={styles.prizeImg}
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className={styles.contentBody}>
        <h3 className={styles.prizeName} title={prize.name}>{prize.name}</h3>
        <p className={styles.description}>{prize.description}</p>

        {/* Metadata: Entry Fee & Est Value */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Required Entry</span>
            <span className={`${styles.metaValue} ${styles.feeHighlight}`}>
              {prize.entryFee} {formatCurrencyLabel(prize.entryCurrency)}
            </span>
          </div>

          <div className={styles.metaItem} style={{ textAlign: 'right' }}>
            <span className={styles.metaLabel}>Est. Value</span>
            <span className={styles.metaValue}>{prize.approxValue || 'Priceless'}</span>
          </div>
        </div>
      </div>

      {/* Footer CTA: Leads to Dedicated Details Page */}
      <div className={styles.cardFooter}>
        <Link
          to={`/giveaway/${prize.slug}`}
          className={`${styles.joinBtn} ${isEnded ? styles.joinBtnEnded : ''}`}
        >
          <span>{isEnded ? 'View Results' : 'View Details & Join'}</span>
          <ArrowRight size={15} className={styles.arrowIcon} />
        </Link>
      </div>
    </div>
  );
};

export default PrizeCard;
