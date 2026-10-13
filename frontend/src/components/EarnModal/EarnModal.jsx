import React, { useState } from 'react';
import { X, Sparkles, Check, Zap, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './EarnModal.module.css';

const SAMPLE_TASKS = [
  { id: 1, title: 'Daily Platform Check-In', currency: 'VE', amount: 50, activity: 'Daily Login Streak' },
  { id: 2, title: 'Complete Quick Product Survey', currency: 'VE', amount: 150, activity: 'Community Survey' },
  { id: 3, title: 'Connect Identity Profile', currency: 'VE', amount: 200, activity: 'Profile Verification' },
  { id: 4, title: 'Special Engagement Quest', currency: 'SVE', amount: 300, activity: 'Audio Quest' }
];

export const EarnModal = ({ isOpen, onClose, targetCurrency = 'VE' }) => {
  if (!isOpen) return null;

  const { addBalance } = useAuth();
  const [completedTasks, setCompletedTasks] = useState([]);

  const handleClaim = async (task) => {
    await addBalance(task.currency, task.amount, task.activity);
    setCompletedTasks((prev) => [...prev, task.id]);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>Earn Virtual Credits</h2>
          <p className={styles.sub}>
            Complete eligible activities to increase your balance and qualify for draws.
          </p>
        </div>

        <div className={styles.taskList}>
          {SAMPLE_TASKS.map((task) => {
            const isDone = completedTasks.includes(task.id);
            return (
              <div key={task.id} className={styles.taskItem}>
                <div className={styles.taskInfo}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  <span className={styles.taskReward}>
                    +{task.amount} {task.currency}s
                  </span>
                </div>

                <button
                  className={styles.claimBtn}
                  onClick={() => handleClaim(task)}
                  disabled={isDone}
                  style={isDone ? { opacity: 0.5, borderColor: '#34d399', color: '#34d399' } : {}}
                >
                  {isDone ? 'Completed ✓' : 'Complete & Earn'}
                </button>
              </div>
            );
          })}
        </div>

        <button
          className="btn-veloop-secondary"
          style={{ width: '100%', marginTop: '20px' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EarnModal;
