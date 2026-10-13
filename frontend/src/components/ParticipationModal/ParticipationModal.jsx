import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api.js';
import styles from './ParticipationModal.module.css';

export const ParticipationModal = ({
  isOpen,
  onClose,
  giveawayId,
  prize,
  currentBalance,
  currencyLabel,
  onJoinSuccess
}) => {
  if (!isOpen || !prize) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const entryFee = prize.entryFee || 0;
  const balanceAfter = Math.max(0, currentBalance - entryFee);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.joinGiveaway(giveawayId, prize.prizeId);

      // Trigger celebratory reward confetti (subtle, restrained)
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#6366f1', '#f59e0b', '#10b981']
      });

      setSuccessData(res.data);
      if (onJoinSuccess) onJoinSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Participation request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>

        {successData ? (
          /* Successful Join State */
          <div className={styles.successWrap}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={40} />
            </div>
            <h2 className={styles.successTitle}>🎉 You're In!</h2>
            <p className={styles.successMsg}>
              Your participation for the <strong>{prize.name}</strong> giveaway has been successfully recorded.
            </p>

            <div className={styles.ledgerBox}>
              <div className={styles.ledgerRow}>
                <span className={styles.label}>Entry Fee Paid:</span>
                <span className={styles.value}>
                  {entryFee} {currencyLabel}
                </span>
              </div>
              <div className={styles.ledgerRow}>
                <span className={styles.label}>Updated Wallet Balance:</span>
                <span className={`${styles.value} ${styles.valueGreen}`}>
                  {successData.newBalance} {currencyLabel}
                </span>
              </div>
              <div className={styles.ledgerRow}>
                <span className={styles.label}>Transaction Reference:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                  {successData.transactionId}
                </span>
              </div>
            </div>

            <p style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
              Good luck! Winners will be announced when the countdown concludes.
            </p>

            <button
              className="btn-veloop-primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={onClose}
            >
              <span>View Giveaway Status</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Confirmation State */
          <div>
            <div className={styles.header}>
              <h2 className={styles.title}>Confirm Participation</h2>
              <div className={styles.prizeHighlight}>🎁 {prize.name}</div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div className={styles.ledgerBox}>
              <div className={styles.ledgerRow}>
                <span className={styles.label}>Entry Fee:</span>
                <span className={`${styles.value} ${styles.valueRed}`}>
                  - {entryFee} {currencyLabel}
                </span>
              </div>

              <div className={styles.ledgerRow}>
                <span className={styles.label}>Your Current Balance:</span>
                <span className={styles.value}>
                  {currentBalance} {currencyLabel}
                </span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.ledgerRow}>
                <span className={styles.label}>Balance After Joining:</span>
                <span className={`${styles.value} ${styles.valueGreen}`}>
                  {balanceAfter} {currencyLabel}
                </span>
              </div>
            </div>

            <p className={styles.notice}>
              By continuing, you confirm that you have reviewed the official giveaway rules and understand that entry fees are authoritative and non-refundable upon draw entry.
            </p>

            <div className={styles.btnRow}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spinner-border spinner-border-sm" />
                    <span>Joining Giveaway...</span>
                  </>
                ) : (
                  <span>Confirm & Join</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipationModal;
