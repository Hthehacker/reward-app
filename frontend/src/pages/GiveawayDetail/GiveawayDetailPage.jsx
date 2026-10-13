import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Coins,
  Package,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

import Navbar from '../../components/Navbar/Navbar.jsx';
import Countdown from '../../components/Countdown/Countdown.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import CustomLoader from '../../components/CustomLoader/CustomLoader.jsx';
import ParticipationModal from '../../components/ParticipationModal/ParticipationModal.jsx';
import EarnModal from '../../components/EarnModal/EarnModal.jsx';
import UserStateDemoSwitcher from '../../components/UserStateDemoSwitcher/UserStateDemoSwitcher.jsx';

import styles from './GiveawayDetailPage.module.css';

export const GiveawayDetailPage = () => {
  const { slug } = useParams();
  const { user, isLoggedIn, login, refreshUser, currentGiveaway, showToast } = useAuth();

  const [giveaway, setGiveaway] = useState(null);
  const [prize, setPrize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [participationStatus, setParticipationStatus] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isEarnModalOpen, setIsEarnModalOpen] = useState(false);

  // Load giveaway and prize
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getGiveawayById(slug);
      setGiveaway(res.data);

      // Locate targeted prize
      let matchedPrize = res.focusedPrize;
      if (!matchedPrize && res.data?.prizes) {
        matchedPrize =
          res.data.prizes.find((p) => p.slug === slug || p.prizeId === slug) ||
          res.data.prizes[0];
      }
      setPrize(matchedPrize);

      // Check current user participation status
      if (user && res.data) {
        try {
          const partRes = await api.getMyStatus(res.data.giveawayId);
          setParticipationStatus(partRes.data);
        } catch (e) {
          setParticipationStatus(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load giveaway details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, user?.userId]);

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <Navbar />
        <CustomLoader minHeight="75vh" />
        <Footer />
      </div>
    );
  }

  if (error || !prize) {
    return (
      <div className={styles.detailPage}>
        <Navbar />
        <div className="container py-5 text-center my-auto">
          <h2 style={{ color: '#ffffff' }}>Reward Not Found</h2>
          <p style={{ color: '#94a3b8' }}>
            The requested prize giveaway details are not available or have ended.
          </p>
          <Link to="/" className="btn-veloop-primary mt-3">
            ← Return to Giveaway Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Currency resolution
  const currencyCode = prize.entryCurrency || 'VE';
  const currencyLabel =
    currencyCode === 'TOKEN' ? 'Tokens' : `${currencyCode}s`;

  // Authoritative user balance
  const currentBalance =
    user?.balances
      ? currencyCode === 'VE'
        ? user.balances.VEs
        : currencyCode === 'SVE'
        ? user.balances.SVEs
        : user.balances.tokens
      : 0;

  const entryFee = prize.entryFee;
  const hasSufficientBalance = currentBalance >= entryFee;
  const balanceDeficit = Math.max(0, entryFee - currentBalance);
  const isAlreadyParticipating = participationStatus?.isParticipating;
  const isGiveawayEnded = giveaway?.status === 'ENDED';

  return (
    <div className={styles.detailPage}>
      <Navbar onOpenEarnModal={() => setIsEarnModalOpen(true)} />

      {/* Back Navigation Bar (Req #82) */}
      <div className={styles.backNavStrip}>
        <div className="container">
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span className="d-none d-sm-inline">← Giveaway Home</span>
            <span className="d-inline d-sm-none">← Giveaway</span>
          </Link>
        </div>
      </div>

      <div className="container">
        {/* Hero Card for Prize (Req #81 & #83) */}
        <div className={styles.heroCard}>
          <div className="row align-items-center">
            <div className="col-lg-7">
              <div className={styles.badgeRow}>
                <div className="badge-exclusive">
                  <Sparkles size={13} />
                  EXCLUSIVE GIVEAWAY
                </div>
                {!isGiveawayEnded && <div className="badge-live">● GIVEAWAY LIVE</div>}
                {isGiveawayEnded && <div className="badge-ended">GIVEAWAY ENDED</div>}
              </div>

              <h1 className={styles.title}>Win an {prize.name}</h1>
              <p className={styles.subtitle}>{prize.description}</p>

              {!isGiveawayEnded && (
                <div style={{ marginTop: '12px' }}>
                  <Countdown
                    targetDate={giveaway.endAt}
                    label="Giveaway Ends In"
                  />
                </div>
              )}
            </div>

            <div className="col-lg-5">
              <div className={styles.prizeVisualWrap}>
                <img
                  src={prize.image}
                  alt={prize.name}
                  className={styles.prizeVisual}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Prize Information & Balance Verification Area (Req #84 - #89) */}
        <div className={styles.actionCard}>
          <div className={styles.gridSpecs}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Prize Tier</span>
              <span className={styles.specValue}>{prize.position}</span>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specLabel}>Winners Limit</span>
              <span className={styles.specValue}>
                {prize.winnerCount} {prize.winnerCount === 1 ? 'Winner' : 'Winners'}
              </span>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specLabel}>Active Participants</span>
              <span className={styles.specValue}>
                {giveaway.participantsCount?.toLocaleString() || '8,520+'}
              </span>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specLabel}>Required Entry Fee</span>
              <span className={styles.specValue} style={{ color: '#38bdf8' }}>
                {entryFee} {currencyLabel}
              </span>
            </div>
          </div>

          {/* User State & Balance Check Strip (Req #87 - #89, #98) */}
          {!isLoggedIn ? (
            /* Visitor State (Req #98) */
            <div className={styles.balanceCheckStrip}>
              <div className={styles.balanceColumn}>
                <span className={styles.balanceLabel}>Authentication Required</span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem' }}>
                  Please login or create an account to participate in this giveaway.
                </span>
              </div>
              <button
                className="btn-veloop-primary"
                onClick={() => login('VE10025')}
              >
                Login to Participate
              </button>
            </div>
          ) : isAlreadyParticipating ? (
            /* Already Joined State (Req #97) */
            <div className={styles.alreadyJoinedNotice}>
              <div className={styles.alreadyJoinedText}>
                <CheckCircle2 size={20} />
                <span>You're Already Participating! Your entry has been recorded.</span>
              </div>
              <Link to="/" className="btn-veloop-secondary" style={{ padding: '8px 18px' }}>
                View Giveaway Status
              </Link>
            </div>
          ) : (
            /* Logged-In User Balance Verification (Req #87, #88, #89) */
            <div>
              <div className={styles.balanceCheckStrip}>
                <div className={styles.balanceColumn}>
                  <span className={styles.balanceLabel}>Your Available Balance:</span>
                  <span className={styles.balanceAmount}>
                    {currentBalance} {currencyLabel}
                  </span>
                </div>

                <div className={styles.balanceColumn}>
                  <span className={styles.balanceLabel}>Required Entry Cost:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                    {entryFee} {currencyLabel}
                  </span>
                </div>

                <div>
                  {hasSufficientBalance ? (
                    <div className={styles.balanceStatusSufficient}>
                      <CheckCircle2 size={16} />
                      <span>✓ You have enough {currencyLabel}</span>
                    </div>
                  ) : (
                    <div className={styles.balanceStatusInsufficient}>
                      <AlertTriangle size={16} />
                      <span>
                        ⚠️ Insufficient {currencyLabel}. You need {balanceDeficit} more {currencyLabel} to participate.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action CTA Row (Req #86 & #88) */}
              <div className={styles.actionButtonRow}>
                {hasSufficientBalance ? (
                  <button
                    className={`${styles.primaryCtaBtn} ${styles.btnJoin}`}
                    onClick={() => setIsJoinModalOpen(true)}
                    disabled={isGiveawayEnded}
                  >
                    <span>
                      {isGiveawayEnded
                        ? 'Giveaway Ended'
                        : `Join Giveaway – ${entryFee} ${currencyLabel}`}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    className={`${styles.primaryCtaBtn} ${styles.btnEarn}`}
                    onClick={() => setIsEarnModalOpen(true)}
                  >
                    <Zap size={18} />
                    <span>Earn More {currencyLabel} →</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section: About the Prize (Req #93) */}
        <div className={styles.detailSection}>
          <h2 className={styles.sectionHeader}>
            <Package size={22} color="#38bdf8" />
            About the Prize
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.7 }}>
            {prize.fullDescription || prize.description}
          </p>
          <div className="mt-3 p-3 rounded" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              Fulfillment & Delivery Terms:
            </span>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              {prize.claimInstructions ||
                'Insured delivery with tracking number issued upon winner verification.'}
            </p>
          </div>
        </div>

        {/* Section: How This Giveaway Works (Req #90) */}
        <div className={styles.detailSection}>
          <h2 className={styles.sectionHeader}>
            <ShieldCheck size={22} color="#38bdf8" />
            How This Giveaway Works
          </h2>
          <div className={styles.stepsTimeline}>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>01</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Review the Giveaway</span>
                <span className={styles.stepDesc}>Inspect prize specifications, tier placement, and entry criteria.</span>
              </div>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>02</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Check Your Eligibility & Balance</span>
                <span className={styles.stepDesc}>Verify you hold sufficient {currencyLabel} in your authoritative wallet.</span>
              </div>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>03</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Confirm & Pay Entry Fee</span>
                <span className={styles.stepDesc}>Confirm your participation in the modal. Fee is atomically deducted server-side.</span>
              </div>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>04</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Participation Is Cryptographically Recorded</span>
                <span className={styles.stepDesc}>Your unique ticket and transaction ID are permanently stored in the audit ledger.</span>
              </div>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>05</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Wait Until the Giveaway Concludes</span>
                <span className={styles.stepDesc}>Track live countdown until server timer expires.</span>
              </div>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>06</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Provably Fair Random Draw</span>
                <span className={styles.stepDesc}>Our backend automated algorithm finalizes winning accounts.</span>
              </div>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>07</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Winner Claims Prize</span>
                <span className={styles.stepDesc}>Winners submit postal address (hardware) or email (vouchers) within 7 days.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Important Terms & Conditions (Req #91) */}
        <div className={styles.detailSection}>
          <h2 className={styles.sectionHeader}>
            <FileText size={22} color="#38bdf8" />
            Important Terms & Conditions
          </h2>
          <div className={styles.termsGrid}>
            <div className={styles.termsCard}>
              <div className={styles.termsLabel}>Eligibility</div>
              <div className={styles.termsBody}>
                Open to all registered and phone-verified VELOOP users aged 18+. Accounts flagged for suspicious behavior or bot activity are ineligible.
              </div>
            </div>

            <div className={styles.termsCard}>
              <div className={styles.termsLabel}>Entry Requirement</div>
              <div className={styles.termsBody}>
                Exactly {entryFee} {currencyLabel} deducted atomically. Client-side price tampering will be automatically rejected.
              </div>
            </div>

            <div className={styles.termsCard}>
              <div className={styles.termsLabel}>Claim Deadline</div>
              <div className={styles.termsBody}>
                Selected winners must finalize their delivery or email details within 7 calendar days of announcement.
              </div>
            </div>

            <div className={styles.termsCard}>
              <div className={styles.termsLabel}>Refund & Entry Policy</div>
              <div className={styles.termsBody}>
                Virtual entry currencies are non-refundable once the draw ticket is created, except in automated event cancellations.
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Entry Confirmation Modal */}
      <ParticipationModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        giveawayId={giveaway.giveawayId}
        prize={prize}
        currentBalance={currentBalance}
        currencyLabel={currencyLabel}
        onJoinSuccess={() => {
          refreshUser();
          loadData();
          showToast(`Successfully joined the ${prize.name} giveaway!`, 'success');
        }}
      />

      {/* Earn Balance Modal */}
      <EarnModal
        isOpen={isEarnModalOpen}
        onClose={() => setIsEarnModalOpen(false)}
        targetCurrency={currencyCode}
      />

      {/* Floating Demo Switcher */}
      <UserStateDemoSwitcher />
    </div>
  );
};

export default GiveawayDetailPage;
