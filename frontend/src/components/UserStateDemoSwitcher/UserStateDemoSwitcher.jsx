import React, { useState } from 'react';
import { Sliders, RefreshCw, X, Sparkles, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { isDemoMode } from '../../config/demoConfig.js';
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
  if (!isDemoMode) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const {
    user,
    isAdmin,
    switchDemoUser,
    currentGiveaway,
    refreshGiveaway,
    showToast,
    openAdminModal
  } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserId = user ? user.userId : 'VISITOR';
  const giveawayStatus = currentGiveaway?.status || 'ACTIVE';

  const verifyAdminPermission = () => {
    if (!isAdmin) {
      showToast('RBAC Restricted: Select "8. Admin" profile to perform administrative actions.', 'error');
      return false;
    }
    return true;
  };

  const handleStatusChange = async (status) => {
    if (!verifyAdminPermission()) return;
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
    if (!verifyAdminPermission()) return;
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
    if (!verifyAdminPermission()) return;
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
          <span className={styles.sectionLabel}>Test User Persona</span>
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

          {/* Admin Role Status Notice */}
          <div style={{ marginTop: '8px', fontSize: '0.72rem', color: isAdmin ? '#4ade80' : '#94a3b8' }}>
            Current Role: <strong>{isAdmin ? '🛡️ Administrator' : '👤 Standard User / Visitor'}</strong>
          </div>

          {/* Giveaway Lifecycle Selector */}
          <span className={styles.sectionLabel}>Giveaway Lifecycle</span>
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
          <span className={styles.sectionLabel}>Admin Operations</span>
          <div className={styles.secondaryRow}>
            <button
              className={styles.miniBtn}
              onClick={handleSelectWinners}
              disabled={actionLoading}
              title="Runs server-side winner selection (Admin Only)"
            >
              Draw Winners
            </button>
            <button
              className={styles.miniBtn}
              onClick={handleResetDatabase}
              disabled={actionLoading}
              title="Reset demo data (Admin Only)"
            >
              <RefreshCw size={11} style={{ display: 'inline', marginRight: '4px' }} />
              Reset DB
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setIsOpen(false);
                openAdminModal();
              }}
              style={{
                marginTop: '10px',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(126, 34, 206, 0.25) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#e9d5ff',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ShieldAlert size={13} />
              Open Full Admin Panel
            </button>
          )}
        </div>
      )}

      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        <Sliders size={15} />
        <span>Demo Controls</span>
        <span
          style={{
            background: isAdmin ? '#9333ea' : '#0284c7',
            color: '#fff',
            fontSize: '0.68rem',
            padding: '2px 6px',
            borderRadius: '999px',
            fontWeight: 700
          }}
        >
          {isAdmin ? 'ADMIN' : currentUserId}
        </span>
      </button>
    </div>
  );
};

export default UserStateDemoSwitcher;
