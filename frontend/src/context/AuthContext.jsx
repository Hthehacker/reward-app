import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('veloop_token') || '');
  const [demoUsers, setDemoUsers] = useState([]);
  const [currentGiveaway, setCurrentGiveaway] = useState(null);
  const [giveawayLoading, setGiveawayLoading] = useState(true);
  const [giveawayError, setGiveawayError] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Show temporary toast feedback
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load demo users list and current authenticated user
  const fetchDemoUsers = async () => {
    try {
      const res = await api.getDemoUsers();
      if (res.data) setDemoUsers(res.data);
    } catch (e) {
      console.warn('Failed loading demo users', e);
    }
  };

  // Load current giveaway authoritative record
  const fetchCurrentGiveaway = async () => {
    setGiveawayLoading(true);
    setGiveawayError(null);
    try {
      const res = await api.getCurrentGiveaway();
      setCurrentGiveaway(res.data);
      setServerTime(res.serverTime);
    } catch (err) {
      console.error('Failed fetching giveaway:', err);
      setGiveawayError(err.message || 'We couldn\'t load the giveaway information.');
    } finally {
      setGiveawayLoading(false);
    }
  };

  // Login as specific user
  const login = async (userId = 'VE10025') => {
    try {
      const res = await api.login(userId);
      if (res.data) {
        setUser(res.data);
        setToken(res.data.token);
        localStorage.setItem('veloop_token', res.data.token);
        localStorage.setItem('veloop_user_id', res.data.userId);
        localStorage.setItem('veloop_device_hash', res.data.deviceHash);
        showToast(`Signed in as ${res.data.name} (${res.data.userId})`, 'success');
        return res.data;
      }
    } catch (e) {
      console.error('Login error:', e);
      showToast(e.message || 'Login failed', 'error');
    }
  };

  // Logout to visitor state
  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('veloop_token');
    localStorage.setItem('veloop_user_id', 'VISITOR');
    showToast('Switched to Visitor mode (Signed Out)', 'info');
  };

  // Switch demo user
  const switchDemoUser = async (userId) => {
    if (userId === 'VISITOR') {
      logout();
      return;
    }
    await login(userId);
  };

  // Refresh user balance from authoritative DB
  const refreshUser = async () => {
    if (!token && !localStorage.getItem('veloop_user_id')) return;
    try {
      const res = await api.getMe();
      if (res.data) setUser(res.data);
    } catch (e) {
      // If error, ignore
    }
  };

  // Quick top-up for insufficient balance state testing
  const addBalance = async (currency = 'VE', amount = 200, activity = 'Task Bonus') => {
    if (!user) return;
    try {
      const res = await api.earnBalance(currency, amount, activity);
      if (res.data) {
        setUser((prev) => ({
          ...prev,
          balances: res.data.balances
        }));
        showToast(`Earned +${amount} ${currency}s via ${activity}!`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Initial mount
  useEffect(() => {
    fetchDemoUsers();
    fetchCurrentGiveaway();

    const storedUserId = localStorage.getItem('veloop_user_id');
    if (storedUserId === 'VISITOR') {
      setUser(null);
    } else {
      login(storedUserId || 'VE10025');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        token,
        demoUsers,
        currentGiveaway,
        giveawayLoading,
        giveawayError,
        serverTime,
        toastMessage,
        showToast,
        login,
        logout,
        switchDemoUser,
        refreshUser,
        refreshGiveaway: fetchCurrentGiveaway,
        addBalance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
