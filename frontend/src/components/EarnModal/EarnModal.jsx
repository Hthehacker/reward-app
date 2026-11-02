import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Zap,
  Coins,
  Gift,
  Share2,
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './EarnModal.module.css';

const QUEST_ACTIVITIES = [
  {
    id: 'daily_checkin',
    title: 'Daily Platform Check-In',
    description: 'Claim your consecutive login bonus for participating today.',
    rewardCurrency: 'VE',
    rewardAmount: 50,
    icon: Coins,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)'
  },
  {
    id: 'community_survey',
    title: 'Community Product Feedback',
    description: 'Provide quick ratings on platform prizes to help us choose next week’s pool.',
    rewardCurrency: 'VE',
    rewardAmount: 150,
    icon: Gift,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)'
  },
  {
    id: 'social_share',
    title: 'Social Share & Referral Quest',
    description: 'Share your referral link on Twitter, Telegram or WhatsApp with community peers.',
    rewardCurrency: 'SVE',
    rewardAmount: 200,
    icon: Share2,
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.12)'
  },
  {
    id: 'security_audit_verify',
    title: 'Profile & Device Security Verification',
    description: 'Confirm your browser device fingerprint signature for fraud protection pass.',
    rewardCurrency: 'SVE',
    rewardAmount: 300,
    icon: Zap,
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.12)'
  },
  {
    id: 'community_tokens_drop',
    title: 'Community Token Airdrop Faucet',
    description: 'Claim free VELOOP platform tokens for everyday low-barrier lucky draws.',
    rewardCurrency: 'TOKEN',
    rewardAmount: 500,
    icon: TrendingUp,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)'
  }
];

export const EarnModal = ({ isOpen, onClose }) => {
  const { user, addBalance, openAuthModal } = useAuth();
  const [claimingId, setClaimingId] = useState(null);
  const [completedIds, setCompletedIds] = useState(() => {
    // Read from session storage so users remember what they claimed today
    try {
      return JSON.parse(sessionStorage.getItem('veloop_claimed_quests') || '[]');
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  const handleClaim = async (quest) => {
    if (!user) {
      onClose();
      openAuthModal('login');
      return;
    }

    setClaimingId(quest.id);
    try {
      await addBalance(quest.rewardCurrency, quest.rewardAmount, quest.title);

      // Trigger celebratory confetti
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#c084fc', '#f59e0b', '#10b981']
      });

      const updated = [...completedIds, quest.id];
      setCompletedIds(updated);
      try {
        sessionStorage.setItem('veloop_claimed_quests', JSON.stringify(updated));
      } catch {}
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close earn modal">
          <X size={18} />
        </button>

        <div className={styles.header}>
          <div className={styles.headerBadge}>
            <Sparkles size={14} />
            <span>Interactive Earn Events</span>
          </div>
          <h2 className={styles.title}>Earn Real Giveaway Credits</h2>
          <p className={styles.sub}>
            Participate in real-time community events to atomically credit your account with VEs, SVEs, and platform Tokens.
          </p>
        </div>

        {/* Current User Balances Bar */}
        {user && (
          <div className={styles.userBalanceBar}>
            <div className={styles.balancePillItem}>
              <span className={styles.pillLabel}>Your VEs:</span>
              <span className={styles.pillVal} style={{ color: '#38bdf8' }}>
                {user.balances?.VEs ?? 0}
              </span>
            </div>
            <div className={styles.balancePillItem}>
              <span className={styles.pillLabel}>Your SVEs:</span>
              <span className={styles.pillVal} style={{ color: '#c084fc' }}>
                {user.balances?.SVEs ?? 0}
              </span>
            </div>
            <div className={styles.balancePillItem}>
              <span className={styles.pillLabel}>Tokens:</span>
              <span className={styles.pillVal} style={{ color: '#f59e0b' }}>
                {user.balances?.tokens ?? 0}
              </span>
            </div>
          </div>
        )}

        {/* Quest List */}
        <div className={styles.taskList}>
          {QUEST_ACTIVITIES.map((quest) => {
            const isCompleted = completedIds.includes(quest.id);
            const isClaiming = claimingId === quest.id;
            const Icon = quest.icon;

            return (
              <div
                key={quest.id}
                className={`${styles.taskItem} ${isCompleted ? styles.taskItemDone : ''}`}
              >
                <div
                  className={styles.questIconBox}
                  style={{ background: quest.bg, color: quest.color }}
                >
                  <Icon size={20} />
                </div>

                <div className={styles.taskInfo}>
                  <div className={styles.taskTitleRow}>
                    <span className={styles.taskTitle}>{quest.title}</span>
                    <span
                      className={styles.rewardTag}
                      style={{ color: quest.color, borderColor: quest.color }}
                    >
                      +{quest.rewardAmount} {quest.rewardCurrency}s
                    </span>
                  </div>
                  <p className={styles.taskDesc}>{quest.description}</p>
                </div>

                <button
                  className={`${styles.claimBtn} ${isCompleted ? styles.claimBtnDone : ''}`}
                  onClick={() => handleClaim(quest)}
                  disabled={isCompleted || isClaiming}
                >
                  {isClaiming ? (
                    <>
                      <Loader2 size={14} className="fa-spin" />
                      <span>Crediting…</span>
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Claimed</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Earn</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.footerWrap}>
          <div className={styles.footerNote}>
            Credits are cryptographically audited and deducted automatically upon giveaway entry.
          </div>
          <button className="btn-veloop-secondary w-100" onClick={onClose}>
            Done / Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default EarnModal;
