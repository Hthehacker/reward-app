import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  Plus,
  Minus,
  ArrowRight,
  RefreshCw,
  Users as UsersIcon,
  History,
  X,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Coins.module.css';

const CoinsPage = () => {
  const { showToast } = useAuth();

  // Core Data State
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalVEs: 0,
    totalSVEs: 0,
    totalTokens: 0,
    totalDistributedCoins: 0,
    totalUsersWithBalances: 0,
    totalTransactions: 0
  });

  // UI State
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'history'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [txFilterType, setTxFilterType] = useState('ALL');
  const [txFilterCurrency, setTxFilterCurrency] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustType, setAdjustType] = useState('ADD'); // 'ADD' | 'DEDUCT'
  const [adjustCurrency, setAdjustCurrency] = useState('VE'); // 'VE' | 'SVE' | 'TOKEN'
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all initial coin data
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [usersRes, statsRes, txRes] = await Promise.all([
        api.adminGetUsers({ limit: 100 }),
        api.adminGetCoinStats().catch(() => ({ success: true, data: {} })),
        api.adminGetCoinTransactions({ limit: 50 }).catch(() => ({ success: true, data: { transactions: [] } }))
      ]);

      const usersList = usersRes.data?.users || usersRes.users || (Array.isArray(usersRes.data) ? usersRes.data : []);
      setUsers(usersList);

      if (statsRes.data) {
        setStats(statsRes.data);
      }

      if (txRes.data?.transactions) {
        setTransactions(txRes.data.transactions);
      }

      if (isManualRefresh) {
        showToast('Coin balances & audit logs updated', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to load coin data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.userId?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Filtered transactions for history tab
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txFilterType !== 'ALL' && tx.type !== txFilterType) return false;
      if (txFilterCurrency !== 'ALL' && tx.currency !== txFilterCurrency) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          tx.userId?.toLowerCase().includes(term) ||
          tx.userName?.toLowerCase().includes(term) ||
          tx.transactionId?.toLowerCase().includes(term) ||
          tx.reason?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [transactions, txFilterType, txFilterCurrency, searchTerm]);

  // Open modal pre-configured for a user
  const handleOpenModal = (user = null, defaultType = 'ADD', defaultCurrency = 'VE') => {
    const targetUser = user || (users.find((u) => u.role !== 'admin') || null);
    setSelectedUser(targetUser);
    setAdjustType(defaultType);
    setAdjustCurrency(defaultCurrency);
    setAdjustAmount('');
    setAdjustReason('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  // Helper to get current balance for selected user & currency
  const getCurrentUserBalance = (user, curr) => {
    if (!user || !user.balances) return 0;
    if (curr === 'VE') return user.balances.VEs ?? 0;
    if (curr === 'SVE') return user.balances.SVEs ?? 0;
    if (curr === 'TOKEN') return user.balances.tokens ?? 0;
    return 0;
  };

  // Calculate projected balance
  const currentBal = getCurrentUserBalance(selectedUser, adjustCurrency);
  const parsedAmt = parseInt(adjustAmount, 10) || 0;
  const projectedBal =
    adjustType === 'ADD' ? currentBal + parsedAmt : currentBal - parsedAmt;
  const isDeficit = adjustType === 'DEDUCT' && parsedAmt > currentBal;

  // Handle Form Submit
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      showToast('Please select a recipient user', 'error');
      return;
    }

    if (selectedUser.role === 'admin') {
      showToast('Admins cannot hold personal coin balances', 'error');
      return;
    }

    if (!parsedAmt || parsedAmt <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if (isDeficit) {
      showToast(`Cannot deduct more than user's available balance (${currentBal})`, 'error');
      return;
    }

    if (!adjustReason.trim() || adjustReason.trim().length < 3) {
      showToast('Please provide a descriptive reason for this balance change', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.adminAdjustCoins({
        userId: selectedUser.userId,
        currency: adjustCurrency,
        amount: parsedAmt,
        type: adjustType,
        reason: adjustReason.trim()
      });

      showToast(res.message || 'Balance adjusted successfully!', 'success');
      handleCloseModal();
      // Reload stats and transactions immediately
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to adjust balance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2>Coin Management & Authoritative Balances</h2>
          <p>
            Inspect member wallets, distribute promotional credits, execute security debits, and audit transactional flows.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => loadData(true)}
            title="Refresh coin data"
            disabled={refreshing || loading}
          >
            <RefreshCw size={18} className={refreshing ? styles.spinner : ''} />
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => handleOpenModal()}
          >
            <Coins size={16} />
            <span>Adjust User Balance</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className={styles.statsGrid}>
        {/* Total Distributed Coins */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGold}`}>
            <Coins size={26} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {stats.totalDistributedCoins?.toLocaleString() ?? 0}
            </div>
            <div className={styles.statLabel}>Total Coins Distributed</div>
            <div className={styles.statBreakdown}>
              <span className={styles.breakdownItem} style={{ color: '#38bdf8' }}>
                {stats.totalVEs?.toLocaleString() ?? 0} VEs
              </span>
              <span>•</span>
              <span className={styles.breakdownItem} style={{ color: '#c084fc' }}>
                {stats.totalSVEs?.toLocaleString() ?? 0} SVEs
              </span>
              <span>•</span>
              <span className={styles.breakdownItem} style={{ color: '#f59e0b' }}>
                {stats.totalTokens?.toLocaleString() ?? 0} Tokens
              </span>
            </div>
          </div>
        </div>

        {/* User Wallets Monitored */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconCyan}`}>
            <UsersIcon size={26} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {stats.totalUsersWithBalances ?? users.filter((u) => u.role !== 'admin').length}
            </div>
            <div className={styles.statLabel}>Community Wallets Monitored</div>
            <div className={styles.statBreakdown}>
              <span style={{ color: '#94a3b8' }}>
                Excludes administrator role accounts
              </span>
            </div>
          </div>
        </div>

        {/* Total Audited Transactions */}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconPurple}`}>
            <History size={26} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {stats.totalTransactions ?? transactions.length}
            </div>
            <div className={styles.statLabel}>Audited Coin Transactions</div>
            <div className={styles.statBreakdown}>
              <span style={{ color: '#10b981' }}>Immutable ledger tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <UsersIcon size={16} />
          <span>User Balances</span>
          <span className={styles.tabCount}>{filteredUsers.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          <span>Transaction Audit History</span>
          <span className={styles.tabCount}>{filteredTransactions.length}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder={
              activeTab === 'users'
                ? 'Search users by name, email, or user ID…'
                : 'Search transactions by user, reason, or TXN ID…'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {activeTab === 'history' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className={styles.filterSelect}
              value={txFilterType}
              onChange={(e) => setTxFilterType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="ADD">Credits (+ ADD)</option>
              <option value="DEDUCT">Debits (- DEDUCT)</option>
            </select>

            <select
              className={styles.filterSelect}
              value={txFilterCurrency}
              onChange={(e) => setTxFilterCurrency(e.target.value)}
            >
              <option value="ALL">All Currencies</option>
              <option value="VE">VEs Only</option>
              <option value="SVE">SVEs Only</option>
              <option value="TOKEN">Tokens Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p style={{ marginTop: '12px' }}>Loading authoritative coin records…</p>
        </div>
      ) : activeTab === 'users' ? (
        /* USER BALANCES TABLE */
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
                  <th>Platform Tokens</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isUserAdmin = u.role === 'admin';
                    return (
                      <tr key={u._id || u.userId}>
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.userName}>{u.name}</span>
                            <span className={styles.userEmail}>{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.idBadge}>{u.userId}</span>
                        </td>
                        <td>
                          {isUserAdmin ? (
                            <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>
                              ADMIN
                            </span>
                          ) : (
                            <span className={styles.roleBadge}>Member</span>
                          )}
                        </td>
                        <td>
                          {isUserAdmin ? (
                            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>— (No Personal Balance)</span>
                          ) : (
                            <span className={styles.valVe}>
                              {(u.balances?.VEs ?? 0).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td>
                          {isUserAdmin ? (
                            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>—</span>
                          ) : (
                            <span className={styles.valSve}>
                              {(u.balances?.SVEs ?? 0).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td>
                          {isUserAdmin ? (
                            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>—</span>
                          ) : (
                            <span className={styles.valToken}>
                              {(u.balances?.tokens ?? 0).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isUserAdmin ? (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                              Protected
                            </span>
                          ) : (
                            <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                              <button
                                className={styles.addCoinBtn}
                                onClick={() => handleOpenModal(u, 'ADD', 'VE')}
                                title={`Add coins to ${u.name}`}
                              >
                                <Plus size={13} />
                                <span>Add</span>
                              </button>
                              <button
                                className={styles.deductCoinBtn}
                                onClick={() => handleOpenModal(u, 'DEDUCT', 'VE')}
                                title={`Deduct coins from ${u.name}`}
                              >
                                <Minus size={13} />
                                <span>Deduct</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TRANSACTION HISTORY TABLE */
        <div className={styles.card}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Admin ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance Transition</th>
                  <th>Reason / Audit Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                      No coin adjustment transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx._id || tx.transactionId}>
                      <td>
                        <span className={styles.idBadge}>{tx.transactionId}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(tx.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {tx.userName || tx.userId}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                            {tx.userId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {tx.adminId}
                        </span>
                      </td>
                      <td>
                        {tx.type === 'ADD' ? (
                          <span className={styles.typeBadgeAdd}>
                            <Plus size={11} /> ADD
                          </span>
                        ) : (
                          <span className={styles.typeBadgeDeduct}>
                            <Minus size={11} /> DEDUCT
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={tx.type === 'ADD' ? styles.amountCredit : styles.amountDebit}>
                          {tx.type === 'ADD' ? '+' : '-'}
                          {tx.amount?.toLocaleString()} {tx.currency}s
                        </span>
                      </td>
                      <td>
                        <div className={styles.balanceTransition}>
                          <span>{tx.balanceBefore?.toLocaleString()}</span>
                          <ArrowRight size={12} color="#64748b" />
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {tx.balanceAfter?.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.reasonText} title={tx.reason}>
                          {tx.reason}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COIN ADJUSTMENT MODAL */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <h3>
                <Coins size={20} color="#f59e0b" />
                <span>Adjust User Coin Balance</span>
              </h3>
              <button className={styles.closeBtn} onClick={handleCloseModal} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAdjustSubmit}>
              <div className={styles.modalBody}>
                {/* User Selector / Preview */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Member Account</label>
                  {selectedUser ? (
                    <div className={styles.targetUserPreview}>
                      <div>
                        <div className={styles.userPreviewName}>{selectedUser.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {selectedUser.email}
                        </div>
                      </div>
                      <div className={styles.userPreviewId}>{selectedUser.userId}</div>
                    </div>
                  ) : (
                    <select
                      className={styles.formSelect}
                      onChange={(e) => {
                        const u = users.find((x) => x.userId === e.target.value);
                        setSelectedUser(u);
                      }}
                      required
                    >
                      <option value="">Select a user account…</option>
                      {users
                        .filter((u) => u.role !== 'admin')
                        .map((u) => (
                          <option key={u.userId} value={u.userId}>
                            {u.name} ({u.userId}) — {u.email}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Adjustment Type Selector (Add vs Deduct) */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Adjustment Operation</label>
                  <div className={styles.typeSelector}>
                    <button
                      type="button"
                      className={`${styles.typeBtn} ${adjustType === 'ADD' ? styles.typeBtnAddActive : ''}`}
                      onClick={() => setAdjustType('ADD')}
                    >
                      <Plus size={16} />
                      <span>Add Coins (Credit)</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.typeBtn} ${adjustType === 'DEDUCT' ? styles.typeBtnDeductActive : ''}`}
                      onClick={() => setAdjustType('DEDUCT')}
                    >
                      <Minus size={16} />
                      <span>Deduct Coins (Debit)</span>
                    </button>
                  </div>
                </div>

                {/* Currency Selector */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Currency Type</label>
                  <div className={styles.currencyGrid}>
                    <button
                      type="button"
                      className={`${styles.currencyBtn} ${adjustCurrency === 'VE' ? styles.currencyActive : ''}`}
                      onClick={() => setAdjustCurrency('VE')}
                    >
                      <span style={{ display: 'block' }}>VEs</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Veloop Entries</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.currencyBtn} ${adjustCurrency === 'SVE' ? styles.currencyActive : ''}`}
                      onClick={() => setAdjustCurrency('SVE')}
                    >
                      <span style={{ display: 'block' }}>SVEs</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Special Entries</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.currencyBtn} ${adjustCurrency === 'TOKEN' ? styles.currencyActive : ''}`}
                      onClick={() => setAdjustCurrency('TOKEN')}
                    >
                      <span style={{ display: 'block' }}>Tokens</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Platform Tokens</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.formLabel}>Adjustment Amount</label>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Current Balance: <strong style={{ color: '#f8fafc' }}>{currentBal.toLocaleString()} {adjustCurrency}s</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter coin amount (e.g. 250)"
                    className={styles.formInput}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                  />
                  <div className={styles.chipsRow}>
                    {[50, 100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={styles.chipBtn}
                        onClick={() => setAdjustAmount(String(amt))}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Projected Balance Preview */}
                {parsedAmt > 0 && (
                  <div className={styles.previewBox}>
                    <div className={styles.previewLabel}>Projected Balance After Adjustment</div>
                    <div className={styles.previewMath}>
                      <span style={{ color: '#94a3b8' }}>{currentBal.toLocaleString()}</span>
                      <span style={{ color: adjustType === 'ADD' ? '#10b981' : '#f43f5e' }}>
                        {adjustType === 'ADD' ? `+${parsedAmt}` : `-${parsedAmt}`}
                      </span>
                      <ArrowRight size={14} color="#64748b" />
                      <span
                        style={{
                          color: isDeficit ? '#f43f5e' : '#38bdf8',
                          fontSize: '1.05rem',
                          fontWeight: 800
                        }}
                      >
                        {projectedBal.toLocaleString()} {adjustCurrency}s
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Banner for Negative Balance */}
                {isDeficit && (
                  <div className={styles.errorBanner}>
                    <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    <strong>Insufficient Balance:</strong> User only holds {currentBal} {adjustCurrency}s. Cannot deduct {parsedAmt} {adjustCurrency}s as negative balances are strictly forbidden.
                  </div>
                )}

                {/* Reason Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Audit Reason <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <textarea
                    placeholder="Provide a mandatory reason for this balance adjustment (e.g. Community promotion grant, Task bonus credit, Fraud recovery, etc.)"
                    className={styles.formTextarea}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    required
                  />
                  <div className={styles.chipsRow}>
                    {[
                      'Promotional Activity Grant',
                      'Task Completion Bonus',
                      'Customer Support Resolution',
                      'Security / Fraud Deduction',
                      'Correction Adjustment'
                    ].map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={styles.chipBtn}
                        onClick={() => setAdjustReason(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${adjustType === 'ADD' ? styles.submitBtnAdd : styles.submitBtnDeduct}`}
                  disabled={
                    submitting ||
                    !selectedUser ||
                    selectedUser.role === 'admin' ||
                    !parsedAmt ||
                    parsedAmt <= 0 ||
                    isDeficit ||
                    !adjustReason.trim()
                  }
                >
                  {submitting ? (
                    <>
                      <div className={styles.spinner} style={{ width: '16px', height: '16px' }} />
                      <span>Processing…</span>
                    </>
                  ) : adjustType === 'ADD' ? (
                    <>
                      <Plus size={16} />
                      <span>Credit +{parsedAmt || 0} {adjustCurrency}s</span>
                    </>
                  ) : (
                    <>
                      <Minus size={16} />
                      <span>Deduct -{parsedAmt || 0} {adjustCurrency}s</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinsPage;
