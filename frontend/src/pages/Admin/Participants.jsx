import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import styles from './Giveaways.module.css';

const Participants = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.adminGetParticipants();
        const list = res.data?.participants || res.participants || (Array.isArray(res.data) ? res.data : []);
        setParticipants(list);
      } catch (err) {
        setError(err.message || 'Error loading participants');
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
          <h2>Participant & Entry Tracking</h2>
          <p>Real-time audit log of member entries, deducted currencies, and security validations.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading participants…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : participants.length === 0 ? (
        <div className={styles.card} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No entries recorded yet. Join active giveaways from the public app to see logs here.
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Giveaway Event</th>
                  <th>Status</th>
                  <th>Entry Fee Paid</th>
                  <th>Device / IP Hash</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                        {p.userId || 'Registered User'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ID: {p.userId}
                      </div>
                    </td>

                    <td style={{ color: '#38bdf8', fontWeight: 600 }}>
                      {p.giveawayId || 'Giveaway'}
                    </td>

                    <td>
                      <span className={styles.badgeActive}>{p.status || 'CONFIRMED'}</span>
                    </td>

                    <td>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                        {p.entryAmount || p.entryFeePaid?.amount || 250} {p.entryCurrency || 'VE'}
                      </span>
                    </td>

                    <td>
                      <code style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {p.deviceHash || 'dev_client_verified'}
                      </code>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(p.joinedAt || p.createdAt).toLocaleString()}
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

export default Participants;
