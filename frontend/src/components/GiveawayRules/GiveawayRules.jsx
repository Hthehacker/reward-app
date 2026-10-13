import React from 'react';
import { CheckCircle2, AlertCircle, ShieldAlert, Award, Calendar, FileText } from 'lucide-react';
import styles from './GiveawayRules.module.css';

const DEFAULT_RULES = [
  {
    icon: <CheckCircle2 size={16} />,
    title: 'Eligibility & Account Verification',
    text: 'Open to verified VELOOP members aged 18+ in supported territories. Accounts with active violations are restricted.'
  },
  {
    icon: <FileText size={16} />,
    title: 'Single-Entry Policy Per Event',
    text: 'A user may submit only one participation entry per giveaway round. Multiple entries from the same individual are rejected.'
  },
  {
    icon: <Award size={16} />,
    title: 'Authoritative Currency Deduction',
    text: 'Entry fees (VEs, SVEs, or Tokens) are verified server-side and atomically deducted upon entry confirmation. All entries are final.'
  },
  {
    icon: <Calendar size={16} />,
    title: 'Winner Selection & Claim Window',
    text: 'Random selection is finalized when the timer expires. Winners must submit verification details within 7 calendar days.'
  },
  {
    icon: <ShieldAlert size={16} />,
    title: 'Disqualification & Anti-Abuse',
    text: 'Scripting, botting, VPN spoofing, or device ring abuse will trigger automatic disqualification and balance forfeiture.'
  },
  {
    icon: <AlertCircle size={16} />,
    title: 'Prize Delivery & Fulfillment',
    text: 'Hardware prizes are shipped via insured tracked courier. Digital gift card codes are issued directly to verified emails.'
  }
];

export const GiveawayRules = ({ customRules }) => {
  const rules = customRules || DEFAULT_RULES;

  return (
    <section id="rules-faq" className={styles.rulesSection}>
      <div className="container">
        <div className={styles.titleWrap}>
          <h2 className={styles.title}>Giveaway Rules & Guidelines</h2>
          <p className={styles.sub}>
            Please review the official participation rules and fair play guidelines before entering.
          </p>
        </div>

        <div className={styles.rulesGrid}>
          {rules.map((rule, idx) => (
            <div key={idx} className={styles.ruleCard}>
              <h4 className={styles.ruleTitle}>
                {rule.icon || <CheckCircle2 size={16} />}
                {rule.title}
              </h4>
              <p className={styles.ruleText}>{rule.description || rule.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GiveawayRules;
