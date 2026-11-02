import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { isDemoMode } from '../../config/demoConfig.js';
import styles from './AuthModal.module.css';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    demoUsers
  } = useAuth();

  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!emailOrId.trim()) {
      setError('Please enter your Email or User ID.');
      return;
    }
    setLoading(true);
    try {
      const payload = emailOrId.includes('@')
        ? { email: emailOrId.trim(), password }
        : { userId: emailOrId.trim(), password };
      await login(payload);
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!registerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: registerEmail.trim(),
        password: registerPassword
      });
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      await login({ userId });
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={closeAuthModal}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brandTitle}>
            <div className={styles.iconCircle}>
              <ShieldCheck size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 className={styles.modalTitle}>VELOOP Rewards</h3>
              <p className={styles.modalSubtitle}>Secure Authentication Portal</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${authModalTab === 'login' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setError(null);
              openAuthModal('login');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${authModalTab === 'register' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setError(null);
              openAuthModal('register');
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error banner */}
        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Login Form */}
        {authModalTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address or User ID</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder={isDemoMode ? "e.g. aarav.sharma@veloop.io or VE10025" : "e.g. yourname@example.com"}
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
                {isDemoMode && <span className={styles.hintText}>Default for demo: Veloop2026!</span>}
              </div>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.inputField}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <span>{loading ? 'Authenticating...' : 'Sign In to Rewards'}</span>
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Accounts Selection (Demo Mode Only) */}
            {isDemoMode && (
              <div className={styles.demoSection}>
                <span className={styles.demoTitle}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Instant Demo Sign-In:
                </span>
                <div className={styles.demoChips}>
                  <button
                    type="button"
                    className={styles.demoChip}
                    onClick={() => handleQuickDemoSelect('VE10025')}
                  >
                    Aarav (Member)
                  </button>
                  <button
                    type="button"
                    className={styles.demoChip}
                    onClick={() => handleQuickDemoSelect('VE10088')}
                  >
                    Ananya (Winner)
                  </button>
                  <button
                    type="button"
                    className={`${styles.demoChip} ${styles.adminChip}`}
                    onClick={() => handleQuickDemoSelect('VE_ADMIN')}
                  >
                    Admin (Director)
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. Maya Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.inputField}
                  placeholder="e.g. maya.patel@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password (minimum 6 characters)</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.inputField}
                  placeholder="Create a secure password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.perksBox}>
              <span className={styles.perksTitle}>New Account Welcome Credits:</span>
              <div className={styles.perksRow}>
                <span>+500 VEs</span>
                <span>+500 SVEs</span>
                <span>+2000 Tokens</span>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <span>{loading ? 'Creating Account...' : 'Create Account & Claim Welcome Credits'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
