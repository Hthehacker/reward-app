import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import styles from "./Countdown.module.css";

export const Countdown = ({ targetDate, onExpire, label = "Ends In" }) => {
  const calculateTimeLeft = () => {
    if (!targetDate)
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    const difference = new Date(targetDate).getTime() - new Date().getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);

      if (updated.total <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.total <= 0) {
    return (
      <div className={styles.timerContainer}>
        <div className={styles.endedBadge}>
          <Clock size={16} />
          <span>Giveaway Ended</span>
        </div>
      </div>
    );
  }

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={styles.timerContainer}>
      <span className={styles.label}>
        <Clock size={15} />
        {label}
      </span>
      <div className={styles.unitGroup}>
        <div className={styles.unitBox}>
          <span className={styles.digits}>{pad(timeLeft.days)}</span>
          <span className={styles.unitLabel}>Days</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.unitBox}>
          <span className={styles.digits}>{pad(timeLeft.hours)}</span>
          <span className={styles.unitLabel}>Hrs</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.unitBox}>
          <span className={styles.digits}>{pad(timeLeft.minutes)}</span>
          <span className={styles.unitLabel}>Mins</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.unitBox}>
          <span className={styles.digits}>{pad(timeLeft.seconds)}</span>
          <span className={styles.unitLabel}>Secs</span>
        </div>
      </div>
    </div>
  );
};

export default Countdown;
