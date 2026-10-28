import React, { useState, useEffect } from 'react';
import { Trophy, Award, Sparkles } from 'lucide-react';
import { api } from '../../services/api.js';
import styles from './WinnerSlider.module.css';

export const WinnerSlider = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'User VE****21 won an iPhone 15 Pro!' },
    { id: 2, text: 'Another lucky participant won an Apple Watch Series 9!' },
    { id: 3, text: 'Participant VE****54 won AirPods Pro!' },
    { id: 4, text: 'User VE****92 won an Amazon ₹2,000 Gift Card!' },
    { id: 5, text: 'User VE****82 won an iPhone 15 Pro!' },
    { id: 6, text: 'Someone won a ₹500 Amazon Voucher!' }
  ]);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await api.getWinnerTicker();
        if (res.data && res.data.length > 0) {
          setMessages(res.data);
        }
      } catch (e) {
        // Fallback already pre-set
      }
    };
    fetchTicker();
  }, []);

  // Double the list for infinite seamless marquee loop
  const displayItems = [...messages, ...messages];

  return (
    <div className={styles.tickerWrapper}>
      <div className={styles.liveTag}>
        <h6>Recent winner</h6>
      </div>
      <div className={styles.scrollTrack}>
        {displayItems.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className={styles.tickerItem}>
            <Trophy size={14} className={styles.trophyIcon} />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WinnerSlider;
