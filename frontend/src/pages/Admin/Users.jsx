import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import styles from './Giveaways.module.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.adminGetUsers();
        // Extract array from response payload
        const usersList = res.data?.users || res.users || (Array.isArray(res.data) ? res.data : []);
        setUsers(usersList);
      } catch (err) {
        setError(err.message || 'Error loading users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    return (
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2>User Accounts & Balances</h2>
          <p>Inspect registered community members, role permissions, and authoritative currency credits.</p>
        </div>
      </div>

      <div style={{ maxWidth: '380px' }}>
        <input
          type="text"
          placeholder="Filter users by name, email, or ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#0d111a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '0.88rem'
          }}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading users…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Member ID</th>
                  <th>Role</th>
                  <th>VEs Balance</th>
                  <th>SVEs Balance</th>
                  <th>Tokens</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                    </td>
                    <td>
                      <code style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{u.userId}</code>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className={styles.badgeAdmin}>ADMIN</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Member</span>
                      )}
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span style={{ color: '#64748b', fontSize: '0.82rem' }}>—</span>
                      ) : (
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                          {u.balances?.VEs ?? 0}
                        </span>
                      )}
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span style={{ color: '#64748b', fontSize: '0.82rem' }}>—</span>
                      ) : (
                        <span style={{ color: '#c084fc', fontWeight: 700 }}>
                          {u.balances?.SVEs ?? 0}
                        </span>
                      )}
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span style={{ color: '#64748b', fontSize: '0.82rem' }}>—</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                          {u.balances?.tokens ?? 0}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
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

export default Users;
