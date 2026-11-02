import React, { useEffect, useState } from 'react';
import {
  Play,
  Clock,
  Trophy,
  Users
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Giveaways.module.css';

const AdminGiveaways = () => {
  const { showToast } = useAuth();
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchGiveaways = async () => {
    try {
      setLoading(true);
      const res = await api.adminGetGiveaways();
      setGiveaways(res.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load giveaways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const handleStatusChange = async (giveawayId, newStatus) => {
    setActionLoadingId(giveawayId);
    try {
      await api.adminSetStatus(giveawayId, newStatus);
      showToast(`Giveaway status updated to ${newStatus}`, 'success');
      fetchGiveaways();
    } catch (err) {
      showToast(err.message || 'Failed to change status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSelectWinners = async (giveawayId) => {
    if (!window.confirm('Run winner selection algorithm now? This will randomly select winners among participants.')) {
      return;
    }
    setActionLoadingId(giveawayId);
    try {
      const res = await api.adminSelectWinners(giveawayId);
      showToast(`Winners selected successfully! (${res.data?.winnersCount || 0} winners)`, 'success');
      fetchGiveaways();
    } catch (err) {
      showToast(err.message || 'Winner selection failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2>Giveaways Management</h2>
          <p>Monitor lifecycle states, prize pool associations, and trigger provably-fair winner draws.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading giveaways…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event ID & Title</th>
                  <th>Status</th>
                  <th>Assigned Prizes</th>
                  <th>Participants</th>
                  <th>Schedule Window</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {giveaways.map((g) => {
                  const isActive = g.status === 'ACTIVE';
                  const isEnded = g.status === 'ENDED';
                  const isUpcoming = g.status === 'UPCOMING';
                  const isLoading = actionLoadingId === g.giveawayId;

                  return (
                    <tr key={g._id || g.giveawayId}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                          {g.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {g.giveawayId} • /{g.slug}
                        </div>
                      </td>

                      <td>
                        {isActive && <span className={styles.badgeActive}>● Active Live</span>}
                        {isEnded && <span className={styles.badgeEnded}>Ended</span>}
                        {isUpcoming && <span className={styles.badgeUpcoming}>Upcoming</span>}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Trophy size={14} color="#f59e0b" />
                          <span style={{ fontWeight: 600 }}>{g.prizes?.length || 0} Prizes</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {g.prizes?.slice(0, 2).map((p) => p.name).join(', ')}
                          {(g.prizes?.length || 0) > 2 ? '…' : ''}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} color="#38bdf8" />
                          <span style={{ fontWeight: 700 }}>{g.participantsCount || 0}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {new Date(g.startAt).toLocaleDateString()} – {new Date(g.endAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(g.endAt) > new Date() ? 'Ends soon' : 'Expired'}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {isActive && (
                            <button
                              onClick={() => handleStatusChange(g.giveawayId, 'ENDED')}
                              disabled={isLoading}
                              className={styles.actionBtn}
                              title="End Giveaway"
                              style={{ color: '#f59e0b' }}
                            >
                              <Clock size={14} />
                            </button>
                          )}

                          {isUpcoming && (
                            <button
                              onClick={() => handleStatusChange(g.giveawayId, 'ACTIVE')}
                              disabled={isLoading}
                              className={styles.actionBtn}
                              title="Set Active"
                              style={{ color: '#10b981' }}
                            >
                              <Play size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleSelectWinners(g.giveawayId)}
                            disabled={isLoading}
                            className={styles.actionBtn}
                            title="Run Winner Selection"
                            style={{ color: '#38bdf8' }}
                          >
                            <Trophy size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGiveaways;
