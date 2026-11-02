import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Gift, Trophy, Activity, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api.js';
import styles from './Giveaways.module.css';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.adminGetAnalytics();
        setStats(data.data);
      } catch (err) {
        setError(err.message || 'Error loading analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2>Analytics & Audit Telemetry</h2>
          <p>Comprehensive overview of platform activity, security audit trail, and database volume.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading analytics…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            <div
              style={{
                background: '#0d111a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8' }}>
                <Users size={20} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>TOTAL USERS</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
                {stats?.userCount || 0}
              </div>
            </div>

            <div
              style={{
                background: '#0d111a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c084fc' }}>
                <Gift size={20} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>GIVEAWAYS</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
                {stats?.giveawayCount || 0}
              </div>
            </div>

            <div
              style={{
                background: '#0d111a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981' }}>
                <Activity size={20} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>TOTAL ENTRIES</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
                {stats?.participantCount || 0}
              </div>
            </div>

            <div
              style={{
                background: '#0d111a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
                <Trophy size={20} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>WINNERS DRAWN</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
                {stats?.winnerCount || 0}
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className={styles.card} style={{ marginTop: '10px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>System Audit Logs</h3>
            </div>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User ID</th>
                    <th>Outcome</th>
                    <th>Metadata Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentLogs?.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <span style={{ fontWeight: 600, color: '#38bdf8' }}>{log.action}</span>
                      </td>
                      <td>
                        <code>{log.userId || 'SYSTEM'}</code>
                      </td>
                      <td>
                        <span
                          style={{
                            color: log.result === 'SUCCESS' ? '#10b981' : '#f43f5e',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}
                        >
                          ● {log.result}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '300px' }}>
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
