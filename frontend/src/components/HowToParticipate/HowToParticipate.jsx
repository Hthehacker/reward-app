import React from 'react';
import { UserCheck, Zap, Ticket, Clock, Trophy, ChevronRight } from 'lucide-react';
import styles from './HowToParticipate.module.css';

const STEPS = [
  {
    step: '01',
    icon: <UserCheck size={18} />,
    title: 'Sign In',
    desc: 'Access or create your verified VELOOP account.'
  },
  {
    step: '02',
    icon: <Zap size={18} />,
    title: 'Earn Credits',
    desc: 'Hold required VEs, SVEs, or Tokens from activities.'
  },
  {
    step: '03',
    icon: <Ticket size={18} />,
    title: 'Choose & Enter',
    desc: 'Pick your prize and confirm one guaranteed entry.'
  },
  {
    step: '04',
    icon: <Clock size={18} />,
    title: 'Live Countdown',
    desc: 'Monitor real-time timer until the cycle concludes.'
  },
  {
    step: '05',
    icon: <Trophy size={18} />,
    title: 'Claim Prize',
    desc: 'Winners submit postal address or voucher email.'
  }
];

export const HowToParticipate = () => {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className="container">
        {/* Compact Header */}
        <div className={styles.headerWrap}>
          <div className={styles.tagBadge}>EASY 5-STEP PROCESS</div>
          <h2 className={styles.title}>How to Participate?</h2>
          <p className={styles.subtitle}>
            Enter exclusive draws in seconds with fair, verifiable server-side selection.
          </p>
        </div>

        {/* Compact Stepper Container */}
        <div className={styles.stepperContainer}>
          <div className={styles.stepperTrack}>
            {STEPS.map((item, idx) => (
              <React.Fragment key={item.step}>
                <div className={styles.stepItem}>
                  <div className={styles.stepIndicatorRow}>
                    <div className={styles.iconCircle}>
                      {item.icon}
                    </div>
                    <span className={styles.stepBadge}>{item.step}</span>
                  </div>

                  <div className={styles.stepTextWrap}>
                    <h3 className={styles.stepTitle}>{item.title}</h3>
                    <p className={styles.stepDesc}>{item.desc}</p>
                  </div>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className={styles.connectorArrow}>
                    <ChevronRight size={16} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToParticipate;
