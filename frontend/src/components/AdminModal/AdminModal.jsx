import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  RefreshCw,
  Clock,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import styles from './AdminModal.module.css';

export const AdminModal = () => {
  const {
    isAdminModalOpen,
    closeAdminModal,
    isAdmin,
    refreshGiveaway,
    showToast
  } = useAuth();

  const [activeTab, setActiveTab] = useState('giveaways'); // 'giveaways' | 'lifecycle' | 'logs'
  const [giveawaysList, setGiveawaysList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state for Create / Edit Giveaway
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('UPCOMING');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [fraudEvents, setFraudEvents] = useState([]);

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetGiveaways();
      if (res.data) setGiveawaysList(res.data);
    } catch (err) {
      setError(err.message || 'Could not load admin giveaways');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const [logsRes, fraudRes] = await Promise.all([
        api.adminGetAuditLogs(),
        api.adminGetFraudEvents()
      ]);
      if (logsRes.data) setAuditLogs(logsRes.data);
      if (fraudRes.data) setFraudEvents(fraudRes.data);
    } catch (e) {
      console.warn('Failed loading logs', e);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen && isAdmin) {
      fetchAdminData();
      if (activeTab === 'logs') fetchLogs();
    }
  }, [isAdminModalOpen, isAdmin, activeTab]);

  if (!isAdminModalOpen) return null;

  if (!isAdmin) {
    return (
      <div className={styles.modalOverlay} onClick={closeAdminModal}>
        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.accessDenied}>
            <ShieldAlert size={48} color="#ef4444" />
            <h3>Access Denied (403 Forbidden)</h3>
            <p>You must be signed in with an authorized Administrator account.</p>
            <button className="btn-veloop-primary mt-3" onClick={closeAdminModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setStatus('UPCOMING');
    setStartAt('');
    setEndAt('');
  };

  const handleEditClick = (g) => {
    setIsEditing(true);
    setEditId(g.giveawayId || g._id);
    setTitle(g.title);
    setSubtitle(g.subtitle || '');
    setDescription(g.description || '');
    setStatus(g.status || 'ACTIVE');
    setStartAt(g.startAt ? new Date(g.startAt).toISOString().slice(0, 16) : '');
    setEndAt(g.endAt ? new Date(g.endAt).toISOString().slice(0, 16) : '');
  };

  const handleSaveGiveaway = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        status,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined
      };

      if (isEditing && editId) {
        await api.adminUpdateGiveaway(editId, payload);
        showToast('Giveaway updated successfully!', 'success');
      } else {
        await api.adminCreateGiveaway(payload);
        showToast('New Giveaway created successfully!', 'success');
      }

      resetForm();
      await fetchAdminData();
      await refreshGiveaway();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGiveaway = async (id, gTitle) => {
    if (!window.confirm(`Are you sure you want to delete giveaway "${gTitle}"?`)) return;
    setActionLoading(true);
    try {
      await api.adminDeleteGiveaway(id);
      showToast(`Giveaway "${gTitle}" deleted.`, 'success');
      await fetchAdminData();
      await refreshGiveaway();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(true);
    try {
      await api.adminSetStatus(id, newStatus);
      showToast(`Status changed to ${newStatus}`, 'success');
      await fetchAdminData();
      await refreshGiveaway();
    } catch (err) {
      showToast(err.message || 'Failed changing status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrawWinners = async (id, gTitle) => {
    setActionLoading(true);
    try {
      const res = await api.adminSelectWinners(id);
      showToast(`Draw concluded! ${res.data?.length || 0} winners finalized for ${gTitle}.`, 'success');
      await fetchAdminData();
      await refreshGiveaway();
    } catch (err) {
      showToast(err.message || 'Winner selection failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDemoDb = async () => {
    if (!window.confirm('Are you sure you want to reset all records and reseed demo data?')) return;
    setActionLoading(true);
    try {
      await api.adminResetDemo();
      showToast('Database reset and re-seeded successfully.', 'success');
      await fetchAdminData();
      await refreshGiveaway();
      if (activeTab === 'logs') fetchLogs();
    } catch (err) {
      showToast(err.message || 'Reset failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={closeAdminModal}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.brandTitle}>
            <div className={styles.adminBadgeIcon}>
              <ShieldAlert size={20} color="#a855f7" />
            </div>
            <div>
              <h3 className={styles.modalTitle}>VELOOP Admin Control Panel</h3>
              <p className={styles.modalSubtitle}>Manage Giveaways, Lifecycles & Security Logs</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={closeAdminModal}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'giveaways' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('giveaways')}
          >
            Manage Giveaways ({giveawaysList.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'lifecycle' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('lifecycle')}
          >
            Status & Draw Winners
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Audit & Fraud Logs
          </button>
        </div>

        {/* Tab 1: Manage Giveaways (CRUD) */}
        {activeTab === 'giveaways' && (
          <div className={styles.tabContent}>
            {/* Create / Edit Form */}
            <div className={styles.formCard}>
              <h4 className={styles.formTitle}>
                {isEditing ? `Edit Giveaway (${editId})` : 'Create New Giveaway Event'}
              </h4>
              <form onSubmit={handleSaveGiveaway} className={styles.adminForm}>
                <div className={styles.formRow}>
                  <div className={styles.formCol}>
                    <label className={styles.formLabel}>Title *</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="e.g. Winter Tech Bonanza"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formCol}>
                    <label className={styles.formLabel}>Status</label>
                    <select
                      className={styles.selectField}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ENDED">ENDED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formCol}>
                  <label className={styles.formLabel}>Subtitle</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Short engaging headline"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                </div>

                <div className={styles.formCol}>
                  <label className={styles.formLabel}>Description *</label>
                  <textarea
                    rows={2}
                    className={styles.textareaField}
                    placeholder="Full giveaway details and terms..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formCol}>
                    <label className={styles.formLabel}>Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className={styles.inputField}
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                    />
                  </div>
                  <div className={styles.formCol}>
                    <label className={styles.formLabel}>End Date & Time</label>
                    <input
                      type="datetime-local"
                      className={styles.inputField}
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.btnRow}>
                  <button type="submit" className={styles.primaryActionBtn} disabled={actionLoading}>
                    {isEditing ? 'Save Changes' : 'Create Giveaway'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      className={styles.secondaryActionBtn}
                      onClick={resetForm}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Existing Giveaways Table */}
            <div className={styles.tableCard}>
              <h4 className={styles.formTitle}>Existing Giveaways in Database</h4>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Current?</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giveawaysList.map((g) => (
                      <tr key={g.giveawayId || g._id}>
                        <td className={styles.monoText}>{g.giveawayId}</td>
                        <td style={{ fontWeight: 600 }}>{g.title}</td>
                        <td>
                          <span
                            className={`${styles.statusPill} ${
                              g.status === 'ACTIVE'
                                ? styles.statusActive
                                : g.status === 'ENDED'
                                ? styles.statusEnded
                                : styles.statusUpcoming
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>
                        <td>{g.isCurrent ? '⭐ Yes' : 'No'}</td>
                        <td>
                          <div className={styles.actionCell}>
                            <button
                              className={styles.editBtn}
                              onClick={() => handleEditClick(g)}
                              title="Edit giveaway"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className={styles.delBtn}
                              onClick={() => handleDeleteGiveaway(g.giveawayId || g._id, g.title)}
                              title="Delete giveaway"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lifecycle & Draw Winners */}
        {activeTab === 'lifecycle' && (
          <div className={styles.tabContent}>
            <div className={styles.cardSection}>
              <h4 className={styles.formTitle}>Manage Event States & Provably Fair Draws</h4>
              <div className={styles.lifecycleGrid}>
                {giveawaysList.map((g) => (
                  <div key={g.giveawayId} className={styles.lifecycleCard}>
                    <div className={styles.lifecycleHeader}>
                      <div>
                        <span className={styles.monoText}>{g.giveawayId}</span>
                        <h5 className={styles.cardEventTitle}>{g.title}</h5>
                      </div>
                      <span
                        className={`${styles.statusPill} ${
                          g.status === 'ACTIVE'
                            ? styles.statusActive
                            : g.status === 'ENDED'
                            ? styles.statusEnded
                            : styles.statusUpcoming
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>

                    <div className={styles.lifecycleActions}>
                      <span className={styles.subLabel}>Transition Status:</span>
                      <div className={styles.statusButtonGroup}>
                        <button
                          className={`${styles.smallStatusBtn} ${g.status === 'ACTIVE' ? styles.btnActiveState : ''}`}
                          onClick={() => handleStatusChange(g.giveawayId, 'ACTIVE')}
                          disabled={actionLoading}
                        >
                          ACTIVE
                        </button>
                        <button
                          className={`${styles.smallStatusBtn} ${g.status === 'ENDED' ? styles.btnActiveState : ''}`}
                          onClick={() => handleStatusChange(g.giveawayId, 'ENDED')}
                          disabled={actionLoading}
                        >
                          ENDED
                        </button>
                        <button
                          className={`${styles.smallStatusBtn} ${g.status === 'UPCOMING' ? styles.btnActiveState : ''}`}
                          onClick={() => handleStatusChange(g.giveawayId, 'UPCOMING')}
                          disabled={actionLoading}
                        >
                          UPCOMING
                        </button>
                      </div>

                      <div className="mt-3">
                        <button
                          className={styles.drawWinnerBtn}
                          onClick={() => handleDrawWinners(g.giveawayId, g.title)}
                          disabled={actionLoading}
                        >
                          <Trophy size={14} />
                          <span>Run Provably Fair Draw</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Audit Logs & Security */}
        {activeTab === 'logs' && (
          <div className={styles.tabContent}>
            <div className={styles.logsContainer}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className={styles.formTitle}>Security & Audit Logs</h4>
                <button className={styles.secondaryActionBtn} onClick={fetchLogs}>
                  <RefreshCw size={13} style={{ marginRight: '6px' }} />
                  Refresh Logs
                </button>
              </div>

              <div className={styles.logsCard}>
                <h5 className={styles.subLabel}>Recent Financial & Participation Logs</h5>
                <div className={styles.logsList}>
                  {auditLogs.slice(0, 15).map((log) => (
                    <div key={log._id} className={styles.logRow}>
                      <span className={styles.logAction}>{log.action}</span>
                      <span className={styles.monoText}>{log.userId}</span>
                      <span style={{ color: log.result === 'SUCCESS' ? '#4ade80' : '#f87171' }}>
                        {log.result}
                      </span>
                      <span className={styles.logTime}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {fraudEvents.length > 0 && (
                <div className={`${styles.logsCard} mt-3`}>
                  <h5 className={styles.subLabel} style={{ color: '#f87171' }}>
                    Fraud Engine Flagged Events
                  </h5>
                  <div className={styles.logsList}>
                    {fraudEvents.slice(0, 10).map((ev) => (
                      <div key={ev._id} className={styles.logRow}>
                        <span className={styles.logAction}>{ev.eventType}</span>
                        <span>User: {ev.userId}</span>
                        <span>Risk Score: {ev.riskScore}/100</span>
                        <span className={styles.logTime}>
                          {new Date(ev.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Demo DB */}
              <div className="mt-4 p-3 rounded" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem', fontWeight: 700 }}>
                      Reset Demo Seed Database
                    </h5>
                    <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                      Wipes current test state and restores verified default demo records.
                    </p>
                  </div>
                  <button
                    className={styles.delBtn}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                    onClick={handleResetDemoDb}
                    disabled={actionLoading}
                  >
                    Reset & Seed DB
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
