import React from 'react';
import { UserCheck, Zap, Ticket, Clock, Trophy } from 'lucide-react';
import styles from './HowToParticipate.module.css';

const STEPS = [
  {
    step: '01',
    icon: <UserCheck size={20} />,
    title: 'Sign Up / Login',
    desc: 'Access your verified VELOOP account to review active events.'
  },
  {
    step: '02',
    icon: <Zap size={20} />,
    title: 'Earn Virtual Balance',
    desc: 'Hold required VEs, SVEs, or Tokens earned through activities.'
  },
  {
    step: '03',
    icon: <Ticket size={20} />,
    title: 'Confirm & Enter',
    desc: 'Select your target prize, inspect terms, and secure your entry.'
  },
  {
    step: '04',
    icon: <Clock size={20} />,
    title: 'Track Countdown',
    desc: 'Monitor real-time server timer until the giveaway cycle concludes.'
  },
  {
    step: '05',
    icon: <Trophy size={20} />,
    title: 'Winner Claim',
    desc: 'Provably fair algorithm selects winners; submit claim details.'
  }
];

export const HowToParticipate = () => {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className="container">
        <div className={styles.headerWrap}>
          <h2 className={styles.title}>How to Participate?</h2>
          <p className={styles.subtitle}>
            A transparent 5-step journey designed for seamless entry and verifiable fairness.
          </p>
        </div>

        <div className={styles.timelineGrid}>
          {STEPS.map((item) => (
            <div key={item.step} className={styles.timelineCard}>
              <span className={styles.stepNumber}>{item.step}</span>
              <div className={styles.iconWrap}>{item.icon}</div>
              <h3 className={styles.stepHeading}>{item.title}</h3>
              <p className={styles.stepDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToParticipate;
