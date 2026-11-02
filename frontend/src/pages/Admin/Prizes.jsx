import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Tag,
  Package,
  Layers
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Prizes.module.css';

// Preset stock images readily available in public assets
const PRESET_IMAGES = [
  { label: 'iPhone 15 Pro', url: '/assets/prizes/prize-iphone-15-pro.webp' },
  { label: 'Apple Watch Series 9', url: '/assets/prizes/prize-apple-watch-s9.webp' },
  { label: 'AirPods Pro (2nd Gen)', url: '/assets/prizes/prize-airpods-pro.webp' },
  { label: '₹2,000 Amazon Voucher', url: '/assets/prizes/prize-amazon-2000.webp' },
  { label: '₹500 Amazon Voucher', url: '/assets/prizes/prize-amazon-500.webp' },
  { label: '₹20 Amazon Voucher', url: '/assets/prizes/prize-amazon-20.webp' }
];

const AdminPrizes = () => {
  const { showToast } = useAuth();

  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  // Modal dialog state (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    position: '1st Prize',
    type: 'physical',
    entryCurrency: 'VE',
    entryFee: 200,
    winnerCount: 1,
    approxValue: '₹50,000',
    image: '/assets/prizes/prize-iphone-15-pro.webp',
    description: '',
    fullDescription: '',
    claimInstructions: ''
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    prize: null,
    loading: false
  });

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminGetPrizes();
      setPrizes(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch prizes');
      showToast(err.message || 'Failed to load prize list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  // Filtered prizes
  const filteredPrizes = prizes.filter((p) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.prizeId?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesCurrency = currencyFilter === 'all' || p.entryCurrency === currencyFilter;

    return matchesSearch && matchesType && matchesCurrency;
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPrize(null);
    setFormData({
      name: '',
      slug: '',
      position: 'Prize',
      type: 'physical',
      entryCurrency: 'VE',
      entryFee: 250,
      winnerCount: 1,
      approxValue: '₹25,000',
      image: PRESET_IMAGES[0].url,
      description: '',
      fullDescription: '',
      claimInstructions: 'Fulfillment includes doorstep insured delivery. Government ID required.'
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (prize) => {
    setEditingPrize(prize);
    setFormData({
      name: prize.name || '',
      slug: prize.slug || '',
      position: prize.position || 'Prize',
      type: prize.type || 'physical',
      entryCurrency: prize.entryCurrency || 'VE',
      entryFee: prize.entryFee ?? 100,
      winnerCount: prize.winnerCount || 1,
      approxValue: prize.approxValue || '',
      image: prize.image || PRESET_IMAGES[0].url,
      description: prize.description || '',
      fullDescription: prize.fullDescription || '',
      claimInstructions: prize.claimInstructions || ''
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      showToast('Name and description are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPrize) {
        await api.adminUpdatePrize(editingPrize.prizeId, formData);
        showToast(`Prize "${formData.name}" updated successfully!`, 'success');
      } else {
        await api.adminCreatePrize(formData);
        showToast(`Prize "${formData.name}" created successfully!`, 'success');
      }
      setIsModalOpen(false);
      fetchPrizes();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteDialog.prize) return;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await api.adminDeletePrize(deleteDialog.prize.prizeId);
      showToast(`Prize "${deleteDialog.prize.name}" deleted.`, 'success');
      setDeleteDialog({ isOpen: false, prize: null, loading: false });
      fetchPrizes();
    } catch (err) {
      showToast(err.message || 'Could not delete prize.', 'error');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // Compute summary stats
  const totalPrizes = prizes.length;
  const physicalCount = prizes.filter((p) => p.type === 'physical').length;
  const voucherCount = prizes.filter((p) => p.type === 'gift_card').length;
  const assignedCount = prizes.filter((p) => (p.assignedGiveawaysCount || 0) > 0).length;

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h2>Prize Catalog & Management</h2>
          <p>Create, configure, and assign high-value prizes across active & upcoming giveaways.</p>
        </div>
        <button onClick={handleOpenCreate} className={styles.primaryBtn}>
          <Plus size={18} />
          <span>Add New Prize</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Trophy size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{totalPrizes}</div>
            <div className={styles.statLabel}>Total Prizes</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc' }}>
            <Package size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{physicalCount}</div>
            <div className={styles.statLabel}>Physical Hardware</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Tag size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{voucherCount}</div>
            <div className={styles.statLabel}>Digital Vouchers</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{assignedCount}</div>
            <div className={styles.statLabel}>Assigned in Giveaways</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search prizes by name, description, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Prize Types</option>
          <option value="physical">Physical Gadget</option>
          <option value="gift_card">Gift Card Voucher</option>
          <option value="digital">Digital Asset</option>
        </select>

        <select
          className={styles.filterSelect}
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
        >
          <option value="all">All Entry Currencies</option>
          <option value="VE">VE (Standard)</option>
          <option value="SVE">SVE (Special)</option>
          <option value="TOKEN">TOKEN (Community)</option>
        </select>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading prize catalog…</p>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <AlertTriangle className={styles.emptyIcon} style={{ color: '#f43f5e' }} />
          <h3>Failed to Load Prizes</h3>
          <p>{error}</p>
          <button onClick={fetchPrizes} className={styles.secondaryBtn} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      ) : filteredPrizes.length === 0 ? (
        <div className={styles.emptyState}>
          <Trophy className={styles.emptyIcon} />
          <h3>No Prizes Found</h3>
          <p>Try adjusting your search query or add a brand new prize to your catalog.</p>
          <button onClick={handleOpenCreate} className={styles.primaryBtn} style={{ marginTop: '14px' }}>
            <Plus size={16} />
            <span>Create First Prize</span>
          </button>
        </div>
      ) : (
        <div className={styles.prizesGrid}>
          {filteredPrizes.map((prize) => {
            const isAssigned = (prize.assignedGiveawaysCount || 0) > 0;
            return (
              <div key={prize.prizeId || prize._id} className={styles.prizeCard}>
                <div className={styles.prizeImageWrap}>
                  <img src={prize.image} alt={prize.name} className={styles.prizeImg} />
                  <span className={styles.positionBadge}>{prize.position || 'Prize'}</span>
                  <span className={styles.typeBadge}>{prize.type}</span>
                </div>

                <div className={styles.prizeBody}>
                  <div className={styles.prizeTitleRow}>
                    <h3 className={styles.prizeName}>{prize.name}</h3>
                    <span className={styles.prizeIdTag}>{prize.prizeId}</span>
                  </div>

                  <p className={styles.prizeDesc}>{prize.description}</p>

                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Required Entry</span>
                      <span className={`${styles.metaValue} ${styles.feeHighlight}`}>
                        {prize.entryFee} {prize.entryCurrency}s
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Est. Market Value</span>
                      <span className={styles.metaValue}>{prize.approxValue || 'Priceless'}</span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Winners Pool</span>
                      <span className={styles.metaValue}>{prize.winnerCount} Selected</span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Slug URL</span>
                      <span className={styles.metaValue} style={{ fontSize: '0.78rem' }}>
                        /{prize.slug}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.prizeFooter}>
                  {isAssigned ? (
                    <span className={styles.assignedBadge} title="Assigned in active or completed giveaways">
                      <CheckCircle2 size={14} />
                      <span>In {prize.assignedGiveawaysCount} Giveaway(s)</span>
                    </span>
                  ) : (
                    <span className={styles.unassignedBadge} title="Available for new giveaways">
                      <span>Unassigned</span>
                    </span>
                  )}

                  <div className={styles.actionBtnGroup}>
                    <button
                      onClick={() => handleOpenEdit(prize)}
                      className={styles.editBtn}
                      title="Edit Prize"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteDialog({ isOpen: true, prize, loading: false })}
                      className={styles.deleteBtn}
                      title="Delete Prize"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Trophy size={20} color="#38bdf8" />
                <span>{editingPrize ? 'Edit Prize Information' : 'Add New Giveaway Prize'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  {/* Name */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>
                      Prize Name <span>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sony PlayStation 5 Slim"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className={styles.formLabel}>URL Slug</label>
                    <input
                      type="text"
                      placeholder="auto-generated-if-empty"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className={styles.formLabel}>Prize Tier / Position</label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Prize, Lucky Draw"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className={styles.formLabel}>Prize Category Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="physical">Physical Hardware</option>
                      <option value="gift_card">Digital Gift Card Voucher</option>
                      <option value="digital">Digital Reward / Token</option>
                    </select>
                  </div>

                  {/* Winner Count */}
                  <div>
                    <label className={styles.formLabel}>Number of Winners Selected</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.winnerCount}
                      onChange={(e) => setFormData({ ...formData, winnerCount: parseInt(e.target.value, 10) || 1 })}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Entry Currency */}
                  <div>
                    <label className={styles.formLabel}>Required Entry Currency</label>
                    <select
                      value={formData.entryCurrency}
                      onChange={(e) => setFormData({ ...formData, entryCurrency: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="VE">VEs (Standard Points)</option>
                      <option value="SVE">SVEs (Special Reward Credits)</option>
                      <option value="TOKEN">Tokens (Community)</option>
                    </select>
                  </div>

                  {/* Entry Fee */}
                  <div>
                    <label className={styles.formLabel}>Entry Fee Amount</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.entryFee}
                      onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value, 10) || 0 })}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Approx Value */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Estimated Retail Value</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹54,990 or $499"
                      value={formData.approxValue}
                      onChange={(e) => setFormData({ ...formData, approxValue: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Image Selector & Presets */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>
                      Prize Image URL or Local Asset <span>*</span>
                    </label>
                    <div className={styles.imageSelectorWrap}>
                      <div className={styles.imagePreviewBox}>
                        <img
                          src={formData.image || PRESET_IMAGES[0].url}
                          alt="Preview"
                          className={styles.previewThumb}
                          onError={(e) => {
                            e.target.src = PRESET_IMAGES[0].url;
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            required
                            placeholder="Enter image URL or choose a preset below"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            className={styles.formInput}
                          />
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                            Choose from stock presets or provide a custom image URL.
                          </div>
                        </div>
                      </div>

                      <div className={styles.presetGallery}>
                        {PRESET_IMAGES.map((preset) => (
                          <button
                            type="button"
                            key={preset.url}
                            className={`${styles.presetThumbBtn} ${formData.image === preset.url ? styles.selectedPreset : ''}`}
                            onClick={() => setFormData({ ...formData, image: preset.url })}
                            title={preset.label}
                          >
                            <img src={preset.url} alt={preset.label} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>
                      Short Description (Card Summary) <span>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Brief headline feature shown in prize grid"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Full Description */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Full Detailed Description</label>
                    <textarea
                      placeholder="Comprehensive specifications, unboxing details, warranty info"
                      value={formData.fullDescription}
                      onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                      className={styles.formTextarea}
                    />
                  </div>

                  {/* Claim Instructions */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Fulfillment & Claim Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Courier delivery requiring address confirmation, or instant digital code"
                      value={formData.claimInstructions}
                      onChange={(e) => setFormData({ ...formData, claimInstructions: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.secondaryBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                  {submitting ? 'Saving…' : editingPrize ? 'Save Changes' : 'Create Prize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteDialog.isOpen && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteDialog({ isOpen: false, prize: null, loading: false })}>
          <div className={styles.modalDialog} style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#f43f5e' }}>
                <AlertTriangle size={20} />
                <span>Confirm Prize Deletion</span>
              </h3>
              <button
                onClick={() => setDeleteDialog({ isOpen: false, prize: null, loading: false })}
                className={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete{' '}
                <strong style={{ color: '#f8fafc' }}>"{deleteDialog.prize?.name}"</strong> (
                {deleteDialog.prize?.prizeId})?
              </p>
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.82rem',
                  color: '#fda4af',
                  marginTop: '12px'
                }}
              >
                Safety Notice: Prizes currently assigned to active or completed giveaways cannot be deleted until those giveaways are updated or archived.
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setDeleteDialog({ isOpen: false, prize: null, loading: false })}
                className={styles.secondaryBtn}
                disabled={deleteDialog.loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className={styles.primaryBtn}
                style={{ background: '#f43f5e', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)' }}
                disabled={deleteDialog.loading}
              >
                {deleteDialog.loading ? 'Deleting…' : 'Yes, Delete Prize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrizes;
