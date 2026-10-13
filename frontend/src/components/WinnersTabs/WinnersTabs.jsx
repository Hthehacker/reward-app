import React, { useState, useEffect } from 'react';
import { Trophy, History, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api.js';
import styles from './WinnersTabs.module.css';

export const WinnersTabs = ({ currentGiveaway }) => {
  const [activeTab, setActiveTab] = useState('CURRENT'); // 'CURRENT' | 'PREVIOUS'
  const [currentWinnersData, setCurrentWinnersData] = useState(null);
  const [previousWinners, setPreviousWinners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentGiveaway) return;

    const fetchWinners = async () => {
      setLoading(true);
      try {
        const [currRes, prevRes] = await Promise.all([
          api.getGiveawayWinners(currentGiveaway.giveawayId),
          api.getPreviousWinners()
        ]);
        setCurrentWinnersData(currRes.data);
        setPreviousWinners(prevRes.data || []);
      } catch (err) {
        console.error('Failed fetching winners data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [currentGiveaway?.giveawayId, currentGiveaway?.status]);

  const isLive = currentGiveaway?.status === 'ACTIVE' || currentGiveaway?.status === 'UPCOMING';

  return (
    <section id="winners-section" className={styles.section}>
      <div className="container">
        <div className={styles.headerWrap}>
          <h2 className={styles.title}>Official Giveaway Winners</h2>
          <p className={styles.subtitle}>
            Verifiable transparency. Winner IDs are safely masked to protect user privacy.
          </p>
        </div>

        {/* Tab Controls */}
        <div className={styles.tabControls}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'CURRENT' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('CURRENT')}
          >
            <Trophy size={16} />
            Current Giveaway Winners
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'PREVIOUS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('PREVIOUS')}
          >
            <History size={16} />
            Previous Winners History
          </button>
        </div>

        {/* Tab Content 1: Current Giveaway Winners */}
        {activeTab === 'CURRENT' && (
          <div>
            {isLive ? (
              /* Requirement #21: Giveaway is still live - strictly do not falsely display winners! */
              <div className={styles.liveNoticeBox}>
                <div className={styles.noticeIcon}>
                  <Clock size={28} />
                </div>
                <h3 className={styles.noticeTitle}>Giveaway Is Currently Live</h3>
                <p className={styles.noticeText}>
                  Winners have not yet been finalized. Provably fair random winner selection will occur automatically when the countdown timer reaches zero.
                </p>
                <div className={styles.noticeMeta}>
                  <span className="badge-live">Status: LIVE</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Winner announcement: Coming after giveaway ends
                  </span>
                </div>
              </div>
            ) : (
              /* Giveaway Ended: Display Finalized Winners */
              <div>
                {currentWinnersData?.winners && currentWinnersData.winners.length > 0 ? (
                  <div className="row g-3">
                    {currentWinnersData.winners.map((winner) => (
                      <div key={winner._id} className="col-12 col-md-6 col-lg-4">
                        <div className={styles.winnerCard}>
                          <div className={styles.winnerLeft}>
                            <div className={styles.trophyBadge}>
                              <Trophy size={20} />
                            </div>
                            <div className={styles.winnerDetails}>
                              <span className={styles.winnerName}>{winner.userName}</span>
                              <span className={styles.winnerPrize}>{winner.prizeName}</span>
                            </div>
                          </div>

                          <div className={styles.winnerMeta}>
                            <span className={styles.maskedBadge}>{winner.maskedId}</span>
                            <span className={styles.statusClaimed}>
                              <CheckCircle2 size={12} />
                              {winner.status === 'CLAIMED' ? 'Claim Verified' : 'Selection Confirmed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyStateBox}>
                    <p>Winners are currently being verified by the automated draw engine.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Previous Winners */}
        {activeTab === 'PREVIOUS' && (
          <div>
            {previousWinners.length > 0 ? (
              <div className="row g-3">
                {previousWinners.map((winner) => (
                  <div key={winner._id} className="col-12 col-md-6 col-lg-4">
                    <div className={styles.winnerCard}>
                      <div className={styles.winnerLeft}>
                        <div className={styles.trophyBadge}>
                          <Trophy size={20} />
                        </div>
                        <div className={styles.winnerDetails}>
                          <span className={styles.winnerName}>{winner.userName}</span>
                          <span className={styles.winnerPrize}>{winner.prizeName}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {winner.giveawayName}
                          </span>
                        </div>
                      </div>

                      <div className={styles.winnerMeta}>
                        <span className={styles.maskedBadge}>{winner.userId}</span>
                        <span className={styles.dateText}>
                          {new Date(winner.selectedAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className={styles.statusClaimed}>
                          <CheckCircle2 size={12} />
                          Delivered ✓
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateBox}>
                <p>No previous winners recorded yet. Previous winners will appear here after a giveaway is completed.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default WinnersTabs;
