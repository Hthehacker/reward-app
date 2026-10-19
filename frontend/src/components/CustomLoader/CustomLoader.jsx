import React, { useState, useEffect } from 'react';
import { Sparkles, Award } from 'lucide-react';
import loaderGiftBox from '../../assets/loader-gift-box.webp';
import styles from './CustomLoader.module.css';

const MESSAGES = [
  "Preparing today's rewards...",
  "Checking active giveaways...",
  "Loading available prizes...",
  "Bringing your rewards closer..."
];

export const CustomLoader = ({ minHeight }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loaderOverlay} style={minHeight ? { minHeight } : {}}>
      <div className={styles.loaderCard}>
        <div className={styles.innerContent}>
          <div className={styles.vaultGraphic}>
            <div className={styles.outerRing}></div>
            <div className={styles.centerGift}>
              <img src={loaderGiftBox} alt="Loading Rewards" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
            </div>
          </div>
          <span className={styles.brandLabel}>VELOOP REWARDS</span>
          <div className={styles.rotatingMessage}>{MESSAGES[messageIndex]}</div>
          <div className={styles.dotsContainer}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return <div className={styles.skeletonCard}></div>;
};

export default CustomLoader;
