import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { scrollToSection } from '../../utils/scrollHelper.js';

import Navbar from '../../components/Navbar/Navbar.jsx';
import GiveawayHero from '../../components/GiveawayHero/GiveawayHero.jsx';
import WinnerSlider from '../../components/WinnerSlider/WinnerSlider.jsx';
import GiveawayStats from '../../components/GiveawayStats/GiveawayStats.jsx';
import FeaturedGiveaways from '../../components/FeaturedGiveaways/FeaturedGiveaways.jsx';
import HowToParticipate from '../../components/HowToParticipate/HowToParticipate.jsx';
import WinnersTabs from '../../components/WinnersTabs/WinnersTabs.jsx';
import TrustSection from '../../components/TrustSection/TrustSection.jsx';
import GiveawayRules from '../../components/GiveawayRules/GiveawayRules.jsx';
import FAQ from '../../components/FAQ/FAQ.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import CustomLoader from '../../components/CustomLoader/CustomLoader.jsx';
import PrizeClaimModal from '../../components/PrizeClaimModal/PrizeClaimModal.jsx';
import ParticipationModal from '../../components/ParticipationModal/ParticipationModal.jsx';
import EarnModal from '../../components/EarnModal/EarnModal.jsx';
import UserStateDemoSwitcher from '../../components/UserStateDemoSwitcher/UserStateDemoSwitcher.jsx';
import AuthModal from '../../components/AuthModal/AuthModal.jsx';
import AdminModal from '../../components/AdminModal/AdminModal.jsx';

import styles from './GiveawayPage.module.css';

export const GiveawayPage = () => {
  const {
    isDemoMode,
    user,
    currentGiveaway,
    giveawayLoading,
    giveawayError,
    refreshGiveaway,
    toastMessage,
    showToast,
    refreshUser,
    isParticipating,
    markAsJoined,
    refreshParticipation
  } = useAuth();

  const [stats, setStats] = useState(null);
  const [claimStatusData, setClaimStatusData] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEarnModalOpen, setIsEarnModalOpen] = useState(false);
  const [selectedPrizeForJoin, setSelectedPrizeForJoin] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleOpenJoinModal = (prize) => {
    if (!prize || isParticipating) return;
    setSelectedPrizeForJoin(prize);
    setIsJoinModalOpen(true);
  };

  const location = useLocation();

  // Load stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getGiveawayStats();
        if (res.data) setStats(res.data);
      } catch (e) {
        // Fallback handled in component
      }
    };
    fetchStats();
  }, []);

  // Check if current user is a winner in the active/ended giveaway
  useEffect(() => {
    if (!user || !currentGiveaway) {
      setClaimStatusData(null);
      return;
    }

    const checkClaimStatus = async () => {
      try {
        const res = await api.getMyClaimStatus(currentGiveaway.giveawayId);
        setClaimStatusData(res.data);
      } catch (e) {
        setClaimStatusData(null);
      }
    };

    checkClaimStatus();
  }, [user?.userId, currentGiveaway?.giveawayId, currentGiveaway?.status]);

  // Handle anchor navigation from location hash or state once data and DOM are ready
  useEffect(() => {
    const hash = location.hash ? location.hash.replace('#', '') : null;
    const targetId = hash || location.state?.scrollTo;

    if (targetId && !giveawayLoading && currentGiveaway) {
      scrollToSection(targetId);
    }
  }, [location.hash, location.state?.scrollTo, giveawayLoading, currentGiveaway]);

  const scrollToPrizes = () => {
    scrollToSection('prizes');
  };

  const scrollToHowItWorks = () => {
    scrollToSection('how-it-works');
  };

  // Themed Custom Loader during initial fetch
  if (giveawayLoading && !currentGiveaway) {
    return (
      <div className={styles.pageWrap}>
        <Navbar />
        <CustomLoader minHeight="80vh" />
        <Footer />
      </div>
    );
  }

  // Error State Handling (Req #66)
  if (giveawayError && !currentGiveaway) {
    return (
      <div className={styles.pageWrap}>
        <Navbar />
        <div className="container py-5 text-center my-auto">
          <AlertCircle size={48} color="#f43f5e" className="mb-3" />
          <h2 style={{ color: '#ffffff' }}>We couldn't load the giveaway information</h2>
          <p style={{ color: '#94a3b8' }}>{giveawayError}</p>
          <button
            className="btn-veloop-primary mt-3"
            onClick={refreshGiveaway}
          >
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isWinner = claimStatusData?.isWinner;
  const isGiveawayEnded = currentGiveaway?.status === 'ENDED';
  const isNonWinnerInEnded = isGiveawayEnded && user && !isWinner;

  return (
    <div className={styles.pageWrap}>
      {/* Toast feedback */}
      {toastMessage && (
        <div
          className={`${styles.toastNotification} ${
            toastMessage.type === 'success'
              ? styles.toastSuccess
              : toastMessage.type === 'error'
              ? styles.toastError
              : styles.toastInfo
          }`}
        >
          {toastMessage.message}
        </div>
      )}

      {/* Critical Winner Notification Banner (Req #26, #34) */}
      {isWinner && (
        <div className={styles.winnerBanner}>
          <div className="container">
            <div className={styles.bannerContainer}>
              <div className={styles.winnerBannerLeft}>
                <div className={styles.winnerBannerIcon}>
                  <Trophy size={20} />
                </div>
                <div className={styles.winnerBannerText}>
                  🎉 <strong>Congratulations!</strong> You won the{' '}
                  <span style={{ color: '#fef08a' }}>
                    {claimStatusData.winnerRecord?.prizeName}
                  </span>
                  !
                </div>
              </div>

              <button
                className={styles.claimBannerBtn}
                onClick={() => setIsClaimModalOpen(true)}
              >
                <span>Claim Your Prize</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-Winner Experience in Ended Giveaway (Req #33, #58) */}
      {isNonWinnerInEnded && (
        <div className={styles.nonWinnerBanner}>
          <div className="container">
            <div className={styles.nonWinnerContainer}>
              <span className={styles.nonWinnerText}>
                Thanks for participating! Winners have been officially announced. Better luck next time!
              </span>
              <a
                href="#winners-section"
                className="btn-veloop-secondary"
                style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('winners-section');
                }}
              >
                View Winners
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar onOpenEarnModal={() => setIsEarnModalOpen(true)} />

      {/* Social Proof Live Winner Ticker */}
      <WinnerSlider />

      {/* Hero Banner */}
      <GiveawayHero
        giveaway={currentGiveaway}
        onScrollToPrizes={scrollToPrizes}
        onScrollToHowItWorks={scrollToHowItWorks}
      />

      {/* Statistics */}
      <GiveawayStats stats={stats} giveaway={currentGiveaway} />

      {/* Prize Pool Grid */}
      <FeaturedGiveaways
        prizes={currentGiveaway?.prizes || []}
        giveawayStatus={currentGiveaway?.status}
        onJoinPrize={handleOpenJoinModal}
      />

      {/* How to Participate Visual Timeline */}
      <HowToParticipate />

      {/* Winners Section (Live status vs Ended + Previous History) */}
      <WinnersTabs currentGiveaway={currentGiveaway} />

      {/* Trust & Transparency */}
      <TrustSection />

      {/* Rules & Guidelines */}
      <GiveawayRules customRules={currentGiveaway?.rules} />

      {/* FAQ Accordion */}
      <FAQ />

      {/* Footer */}
      <Footer />

      {/* Winner Prize Claim Modal */}
      {isWinner && (
        <PrizeClaimModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          winnerRecord={claimStatusData?.winnerRecord}
          giveawayTitle={currentGiveaway?.title}
          onClaimSuccess={() => {
            refreshGiveaway();
          }}
        />
      )}

      {/* Entry Confirmation Modal (Main Page Quick Join) */}
      {selectedPrizeForJoin && (
        <ParticipationModal
          isOpen={isJoinModalOpen && !isParticipating}
          onClose={() => {
            setIsJoinModalOpen(false);
            setSelectedPrizeForJoin(null);
          }}
          giveawayId={currentGiveaway?.giveawayId}
          prize={selectedPrizeForJoin}
          currentBalance={
            user?.balances
              ? selectedPrizeForJoin.entryCurrency === 'VE'
                ? user.balances.VEs
                : selectedPrizeForJoin.entryCurrency === 'SVE'
                ? user.balances.SVEs
                : user.balances.tokens
              : 0
          }
          currencyLabel={
            selectedPrizeForJoin.entryCurrency === 'TOKEN'
              ? 'Tokens'
              : `${selectedPrizeForJoin.entryCurrency || 'VE'}s`
          }
          isAlreadyParticipating={isParticipating}
          onJoinSuccess={(data) => {
            setIsJoinModalOpen(false);
            setSelectedPrizeForJoin(null);
            markAsJoined(data);
            refreshUser();
            if (currentGiveaway?.giveawayId) {
              refreshParticipation(currentGiveaway.giveawayId, user);
            }
            showToast(`Successfully joined the ${selectedPrizeForJoin.name} giveaway!`, 'success');
          }}
        />
      )}

      {/* Earn Balance Modal */}
      <EarnModal
        isOpen={isEarnModalOpen}
        onClose={() => setIsEarnModalOpen(false)}
      />

      {/* Floating Demo Switcher (Demo Mode Only) */}
      {isDemoMode && <UserStateDemoSwitcher />}

      {/* Authentication & Admin Modals */}
      <AuthModal />
      <AdminModal />
    </div>
  );
};

export default GiveawayPage;
