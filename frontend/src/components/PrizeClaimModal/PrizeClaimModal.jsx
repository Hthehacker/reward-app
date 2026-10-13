import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, Clock, Send, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { api } from '../../services/api.js';
import styles from './PrizeClaimModal.module.css';

export const PrizeClaimModal = ({ isOpen, onClose, winnerRecord, giveawayTitle, onClaimSuccess }) => {
  if (!isOpen || !winnerRecord) return null;

  const isPhysical = winnerRecord.prizeType === 'physical';

  // Physical form fields
  const [fullName, setFullName] = useState(winnerRecord.userName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Digital voucher form field
  const [emailAddress, setEmailAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimResult, setClaimResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = isPhysical
        ? {
            physicalDetails: {
              fullName,
              phoneNumber,
              completeAddress,
              city,
              state,
              pinCode
            }
          }
        : {
            digitalDetails: {
              emailAddress
            }
          };

      const res = await api.submitPrizeClaim(winnerRecord.giveawayId, payload);
      setClaimResult(res.data);
      if (onClaimSuccess) onClaimSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to submit prize claim.');
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

        <div className={styles.headerArea}>
          <div className={styles.celebrateIcon}>
            <Trophy size={30} />
          </div>
          <h2 className={styles.title}>🎉 Congratulations!</h2>
          <div className={styles.prizeWonText}>You won {winnerRecord.prizeName}!</div>
        </div>

        {/* Winner Verification Summary */}
        <div className={styles.verificationStrip}>
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Giveaway</span>
            <span className={styles.stripValue}>{giveawayTitle || 'Summer Rewards'}</span>
          </div>
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Winner Status</span>
            <span className={styles.stripValue} style={{ color: '#34d399' }}>Verified Winner ✓</span>
          </div>
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Prize Type</span>
            <span className={styles.stripValue} style={{ textTransform: 'capitalize' }}>
              {winnerRecord.prizeType}
            </span>
          </div>
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Claim Deadline</span>
            <span className={styles.stripValue} style={{ color: '#f59e0b' }}>
              7 Days Remaining
            </span>
          </div>
        </div>

        {claimResult ? (
          /* Success / Submitted State */
          <div className={styles.submittedBox}>
            <CheckCircle2 size={42} color="#34d399" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>
              Claim Submitted ✓
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>
              Our fulfillment team will verify and dispatch your prize.
            </p>
            {claimResult.trackingNumber && (
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Fulfillment Reference:</span>
                <div className={styles.trackingCode}>{claimResult.trackingNumber}</div>
              </div>
            )}
            <button
              className="btn-veloop-secondary"
              style={{ marginTop: '20px', width: '100%' }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          /* Form Area */
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {isPhysical ? (
              /* Physical Prize Form: Collects name, phone, address, city, state, PIN */
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name (As on Government ID)</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Roy"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number (For Delivery OTP)</label>
                  <input
                    type="tel"
                    required
                    className={styles.input}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Complete Delivery Address</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={completeAddress}
                    onChange={(e) => setCompleteAddress(e.target.value)}
                    placeholder="Flat/House No, Building, Street, Landmark"
                  />
                </div>

                <div className="row g-2">
                  <div className="col-5">
                    <div className={styles.formGroup}>
                      <label className={styles.label}>City</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mumbai"
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className={styles.formGroup}>
                      <label className={styles.label}>State</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                      />
                    </div>
                  </div>
                  <div className="col-3">
                    <div className={styles.formGroup}>
                      <label className={styles.label}>PIN Code</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="400001"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Amazon Gift Card Form: Collects email ONLY */
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Amazon Voucher Recipient Email
                </label>
                <input
                  type="email"
                  required
                  className={styles.input}
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter email where you want to receive your gift card"
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  No physical delivery address needed for digital vouchers.
                </span>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span>Submitting Claim...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Claim</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PrizeClaimModal;
