import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import styles from './PrizeCard.module.css';

export const PrizeCard = ({ prize, giveawayStatus = 'ACTIVE', onJoinPrize }) => {
  const { user, isParticipating, openAuthModal } = useAuth();
  if (!prize) return null;

  const isFirstPrize = prize.position?.toLowerCase().includes('1st');

  const formatCurrencyLabel = (currency) => {
    if (currency === 'VE') return 'VEs';
    if (currency === 'SVE') return 'SVEs';
    return 'Tokens';
  };

  const isEnded = giveawayStatus === 'ENDED';
  const isJoined = Boolean(isParticipating);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isJoined && !isEnded && (
            <span className={styles.joinedBadge}>
              <CheckCircle2 size={11} />
              Joined
            </span>
          )}
          <span className={styles.winnerCountBadge}>
            <Trophy size={13} />
            {prize.winnerCount} {prize.winnerCount === 1 ? 'Winner' : 'Winners'}
          </span>
        </div>
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

      {/* Footer CTA: Leads to Dedicated Details Page or Quick Join */}
      <div className={styles.cardFooter}>
        {isEnded ? (
          <Link
            to={`/giveaway/${prize.slug}`}
            className={`${styles.joinBtn} ${styles.joinBtnEnded}`}
          >
            <span>View Results</span>
            <ArrowRight size={15} className={styles.arrowIcon} />
          </Link>
        ) : isJoined ? (
          <Link
            to={`/giveaway/${prize.slug}`}
            className={`${styles.joinBtn} ${styles.joinBtnJoined}`}
          >
            <CheckCircle2 size={15} />
            <span>Joined</span>
          </Link>
        ) : onJoinPrize ? (
          <div className={styles.dualBtnRow}>
            <Link
              to={`/giveaway/${prize.slug}`}
              className={styles.detailsBtn}
              title="View prize specs & details"
            >
              Details
            </Link>
            <button
              type="button"
              className={styles.joinBtn}
              onClick={(e) => {
                e.preventDefault();
                if (!user || user.userId === 'VISITOR') {
                  openAuthModal('login');
                  return;
                }
                onJoinPrize(prize);
              }}
            >
              <span>Join ({prize.entryFee} {formatCurrencyLabel(prize.entryCurrency)})</span>
              <ArrowRight size={14} className={styles.arrowIcon} />
            </button>
          </div>
        ) : (
          <Link
            to={`/giveaway/${prize.slug}`}
            className={styles.joinBtn}
          >
            <span>View Details & Join</span>
            <ArrowRight size={15} className={styles.arrowIcon} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default PrizeCard;
