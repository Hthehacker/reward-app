import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import PrizeCard from '../ParticipationModal/PrizeCard/PrizeCard.jsx';
import styles from './FeaturedGiveaways.module.css';

export const FeaturedGiveaways = ({
  prizes = [],
  giveawayStatus = 'ACTIVE',
  onJoinPrize
}) => {
  const [filter, setFilter] = useState('ALL');
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filteredPrizes = prizes.filter((prize) => {
    if (filter === 'PHYSICAL') return prize.type === 'physical';
    if (filter === 'VOUCHERS') return prize.type === 'gift_card';
    if (filter === 'TOKENS') return prize.entryCurrency === 'TOKEN';
    return true;
  });

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [filteredPrizes]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleFilterClick = (newFilter) => {
    setFilter(newFilter);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="prizes" className={styles.section}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.headerWrap}>
          <div className={styles.topRow}>
            <div>
              <div className={styles.sectionBadge}>
                <Sparkles size={10} />
                EXCLUSIVE REWARDS POOL
              </div>
              <h2 className={styles.sectionTitle}>Featured Giveaway Rewards</h2>
              <p className={styles.sectionSub}>
                Swipe through flagship devices, audio gear, and shopping vouchers.
              </p>
            </div>

            {/* Desktop Carousel Navigation Arrows */}
            <div className={styles.navArrows}>
              <button
                className={`${styles.arrowBtn} ${!canScrollLeft ? styles.arrowDisabled : ''}`}
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll rewards left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className={`${styles.arrowBtn} ${!canScrollRight ? styles.arrowDisabled : ''}`}
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll rewards right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className={styles.filterRow}>
            <button
              className={`${styles.filterBtn} ${filter === 'ALL' ? styles.filterBtnActive : ''}`}
              onClick={() => handleFilterClick('ALL')}
            >
              All Rewards ({prizes.length})
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'PHYSICAL' ? styles.filterBtnActive : ''}`}
              onClick={() => handleFilterClick('PHYSICAL')}
            >
              Flagship Hardware
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'VOUCHERS' ? styles.filterBtnActive : ''}`}
              onClick={() => handleFilterClick('VOUCHERS')}
            >
              Amazon Vouchers
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'TOKENS' ? styles.filterBtnActive : ''}`}
              onClick={() => handleFilterClick('TOKENS')}
            >
              Token Draw
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Track with touch / swipe support */}
        <div
          ref={scrollRef}
          className={styles.horizontalTrack}
          onScroll={checkScrollability}
        >
          {filteredPrizes.length > 0 ? (
            filteredPrizes.map((prize) => (
              <PrizeCard
                key={prize.prizeId || prize._id}
                prize={prize}
                giveawayStatus={giveawayStatus}
                onJoinPrize={onJoinPrize}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No rewards available under this category.</p>
            </div>
          )}
        </div>

        {/* Mobile Swipe Guidance Note */}
        <div className={styles.mobileSwipeHint}>
          <span>← Swipe horizontally to explore more rewards →</span>
        </div>
      </div>
    </section>
  );
};

export default FeaturedGiveaways;
