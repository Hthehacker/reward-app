import React from 'react';
import { ArrowRight, Sparkles, Shield, Gift, Trophy } from 'lucide-react';
import Countdown from '../Countdown/Countdown.jsx';
import heroVisual from '../../assets/hero-rewards.svg';
import styles from './GiveawayHero.module.css';

export const GiveawayHero = ({ giveaway, onScrollToPrizes, onScrollToHowItWorks }) => {
  if (!giveaway) return null;

  const isLive = giveaway.status === 'ACTIVE';
  const isEnded = giveaway.status === 'ENDED';
  const isUpcoming = giveaway.status === 'UPCOMING';

  return (
    <section className={styles.heroSection}>
      <div className="container">
        <div className={styles.heroCard}>
          <div className={styles.ambientGlow}></div>

          <div className="row align-items-center">
            {/* Content Left */}
            <div className="col-lg-7">
              <div className={styles.contentWrapper}>
                <div className={styles.badgeRow}>
                  <div className="badge-exclusive">
                    <Sparkles size={13} />
                    EXCLUSIVE GIVEAWAY
                  </div>

                  {isLive && <div className="badge-live">GIVEAWAY LIVE</div>}
                  {isEnded && <div className="badge-ended">GIVEAWAY ENDED</div>}
                  {isUpcoming && <div className="badge-upcoming">STARTS IN 3 DAYS</div>}
                </div>

                <h1 className={styles.mainHeading}>
                  Giveaway <span className={styles.gradientText}>Rewards</span>
                </h1>

                <p className={styles.supportingText}>
                  {giveaway.subtitle ||
                    'Complete eligible activities, collect entries and get a chance to win exciting rewards.'}
                </p>

                <div className={styles.ctaGroup}>
                  <button
                    className="btn-veloop-primary"
                    onClick={onScrollToPrizes}
                  >
                    <span>{isEnded ? 'View Winners & Prizes' : 'Enter Giveaway'}</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    className="btn-veloop-secondary"
                    onClick={onScrollToHowItWorks}
                  >
                    <span>How It Works</span>
                  </button>
                </div>

                <div className={styles.countdownWrapper}>
                  {isLive && (
                    <Countdown
                      targetDate={giveaway.endAt}
                      label="Giveaway Ends In"
                    />
                  )}
                  {isUpcoming && (
                    <Countdown
                      targetDate={giveaway.startAt}
                      label="Starts In"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Illustration Right */}
            <div className="col-lg-5">
              <div className={styles.visualCol}>
                <div className={styles.illustrationContainer}>
                  <img
                    src={heroVisual}
                    alt="Giveaway Rewards Vault"
                    className={styles.heroImg}
                  />

                  {/* Floating Social Badge */}
                  <div className={styles.floatingTag}>
                    <Trophy size={20} className={styles.tagIcon} />
                    <div>
                      <div className={styles.tagText}>1,240+ Rewards Won</div>
                      <div className={styles.tagSub}>100% Provably Fair</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiveawayHero;
