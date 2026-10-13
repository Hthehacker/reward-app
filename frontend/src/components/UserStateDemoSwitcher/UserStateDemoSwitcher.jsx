import React, { useState } from 'react';
import { Sliders, RefreshCw, X, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import styles from './UserStateDemoSwitcher.module.css';

const PRESET_USER_PROFILES = [
  { id: 'VISITOR', label: '1. Visitor (Logged Out / Sign In Prompt)' },
  { id: 'VE10025', label: '2. Aarav - Eligible (850 VEs, Can Join)' },
  { id: 'VE10099', label: '3. Priya - Insufficient Balance (120 VEs)' },
  { id: 'VE10042', label: '4. Rohan - Already Participating ✓' },
  { id: 'VE10088', label: '5. Ananya - Apple Watch Winner (Physical Claim)' },
  { id: 'VE10077', label: '6. Kabir - Amazon Voucher Winner (Digital Claim)' },
  { id: 'VE10012', label: '7. Meera - Non-Winner (Ended Event)' },
  { id: 'VE_ADMIN', label: '8. Admin (Full Control)' }
];

export const UserStateDemoSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, switchDemoUser, currentGiveaway, refreshGiveaway, showToast } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserId = user ? user.userId : 'VISITOR';
  const giveawayStatus = currentGiveaway?.status || 'ACTIVE';

  const handleStatusChange = async (status) => {
    if (!currentGiveaway) return;
    setActionLoading(true);
    try {
      await api.adminSetStatus(currentGiveaway.giveawayId, status);
      await refreshGiveaway();
      showToast(`Giveaway status transitioned to ${status}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectWinners = async () => {
    if (!currentGiveaway) return;
    setActionLoading(true);
    try {
      const res = await api.adminSelectWinners(currentGiveaway.giveawayId);
      await refreshGiveaway();
      showToast(`Provably fair draw complete! Finalized ${res.data?.length || 0} winners.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    setActionLoading(true);
    try {
      await api.adminResetDemo();
      await refreshGiveaway();
      showToast('Database reset and re-seeded with demo records!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.floatingBar}>
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Demo State Switcher
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* User State Selector */}
          <span className={styles.sectionLabel}>Test User Persona (Req #54)</span>
          <select
            className={styles.selectInput}
            value={currentUserId}
            onChange={(e) => switchDemoUser(e.target.value)}
          >
            {PRESET_USER_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Giveaway Lifecycle Selector */}
          <span className={styles.sectionLabel}>Giveaway Lifecycle (Req #11, #23)</span>
          <div className={styles.actionBtnGroup}>
            <button
              className={`${styles.statusBtn} ${giveawayStatus === 'ACTIVE' ? styles.statusBtnActive : ''}`}
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={actionLoading}
            >
              ACTIVE
            </button>
            <button
              className={`${styles.statusBtn} ${giveawayStatus === 'ENDED' ? styles.statusBtnActive : ''}`}
              onClick={() => handleStatusChange('ENDED')}
              disabled={actionLoading}
            >
              ENDED
            </button>
            <button
              className={`${styles.statusBtn} ${giveawayStatus === 'UPCOMING' ? styles.statusBtnActive : ''}`}
              onClick={() => handleStatusChange('UPCOMING')}
              disabled={actionLoading}
            >
              UPCOMING
            </button>
          </div>

          {/* Quick Admin Actions */}
          <span className={styles.sectionLabel}>Backend Engines</span>
          <div className={styles.secondaryRow}>
            <button
              className={styles.miniBtn}
              onClick={handleSelectWinners}
              disabled={actionLoading}
              title="Runs server-side winner selection"
            >
              Draw Winners
            </button>
            <button
              className={styles.miniBtn}
              onClick={handleResetDatabase}
              disabled={actionLoading}
              title="Reset demo data"
            >
              <RefreshCw size={11} style={{ display: 'inline', marginRight: '4px' }} />
              Reset DB
            </button>
          </div>
        </div>
      )}

      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        <Sliders size={15} />
        <span>Demo Controls</span>
        <span
          style={{
            background: '#0284c7',
            color: '#fff',
            fontSize: '0.68rem',
            padding: '2px 6px',
            borderRadius: '999px'
          }}
        >
          {currentUserId}
        </span>
      </button>
    </div>
  );
};

export default UserStateDemoSwitcher;
