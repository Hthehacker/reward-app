import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

const FAQ_DATA = [
  {
    q: 'How do I participate in VELOOP giveaways?',
    a: 'Browse the prize pool, choose your preferred item, review the rules on its individual details page, and confirm your entry using your available VEs, SVEs, or platform Tokens.'
  },
  {
    q: 'How are winners selected?',
    a: 'All eligible entries are processed by our automated server-side provably fair random selection engine once the official countdown ends. No human intervention or client-side scripts are involved.'
  },
  {
    q: 'When are winners announced?',
    a: 'Winners are published immediately in the "Current Giveaway Winners" tab and displayed on the ticker once the event countdown concludes and eligibility is validated.'
  },
  {
    q: 'What happens if I win?',
    a: 'You will receive an instant banner notification on the giveaway page. A dedicated "Claim Your Prize" modal will unlock, allowing you to submit delivery details for physical goods or your verified email for Amazon vouchers.'
  },
  {
    q: 'How long do I have to claim my prize?',
    a: 'Winners have exactly 7 calendar days to submit their fulfillment details. Unclaimed rewards are forfeited after the claim deadline expires to ensure community integrity.'
  },
  {
    q: 'Can I participate in multiple giveaways?',
    a: 'Yes! While you can only enter once per giveaway event, you are free to enter different simultaneous events and every new bi-weekly cycle.'
  },
  {
    q: 'What happens after the giveaway ends?',
    a: 'The event moves to the "Previous Winners History" archive, all claims are handed over to delivery partners, and the next scheduled reward cycle begins.'
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.titleWrap}>
          <h2 className={styles.title}>Frequently Asked Questions</h2>
          <p className={styles.sub}>
            Everything you need to know about VELOOP entries, draws, and reward claims.
          </p>
        </div>

        <div className={styles.faqContainer}>
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggle(idx)}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.icon} ${isOpen ? styles.iconRotated : ''}`}
                  />
                </button>
                {isOpen && <div className={styles.faqAnswer}>{item.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
