import React, { useEffect, useState } from 'react';
import { Award, Trophy, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../services/api.js';
import styles from './Giveaways.module.css';

const Winners = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.adminGetWinners();
        const list = res.data?.winners || res.winners || (Array.isArray(res.data) ? res.data : []);
        setWinners(list);
      } catch (err) {
        setError(err.message || 'Error loading winners');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2>Official Giveaway Winners</h2>
          <p>Provably-fair selection results, prize distribution, and claim verification status.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading winners…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : winners.length === 0 ? (
        <div className={styles.card} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No winners selected yet. Run winner selection from the Giveaways section when a giveaway ends.
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Winner Member</th>
                  <th>Awarded Prize</th>
                  <th>Giveaway Event</th>
                  <th>Claim Status</th>
                  <th>Draw Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w) => (
                  <tr key={w._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                        {w.userName || w.userId || 'Verified Member'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ID: {w.userId || w.maskedId || '—'}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trophy size={16} color="#f59e0b" />
                        <div>
                          <div style={{ fontWeight: 700, color: '#f59e0b' }}>
                            {w.prizeName || w.prizeId?.name || 'Grand Prize'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {w.prizeType || 'physical'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ color: '#38bdf8', fontWeight: 600 }}>
                      {w.giveawayId || 'Giveaway Event'}
                    </td>

                    <td>
                      {w.status === 'CLAIMED' ? (
                        <span className={styles.badgeActive}>Claimed</span>
                      ) : (
                        <span className={styles.badgeUpcoming}>Pending Claim</span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(w.selectedAt || w.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Winners;
