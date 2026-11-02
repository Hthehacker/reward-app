import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

// Create a context for authentication state
const AuthContext = createContext();

/**
 * AuthProvider – wraps the app and supplies auth state & helpers.
 * State includes:
 *   • user – the authenticated user object (or null)
 *   • isLoggedIn – boolean shortcut
 *   • isAdmin – boolean shortcut for role === 'admin'
 *   • isAuthLoading – true while the initial session check is in progress
 *   • modal control & toast UI helpers (preserved from original code)
 */
export const AuthProvider = ({ children }) => {
  // Core auth state
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // UI helpers (unchanged from original implementation)
  const [demoUsers, setDemoUsers] = useState([]);
  const [currentGiveaway, setCurrentGiveaway] = useState(null);
  const [giveawayLoading, setGiveawayLoading] = useState(true);
  const [giveawayError, setGiveawayError] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Auth & admin modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // "login" | "register"
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // ---------- UI Helpers ----------
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openAdminModal = () => setIsAdminModalOpen(true);
  const closeAdminModal = () => setIsAdminModalOpen(false);

  // ---------- Data Fetching ----------
  const fetchDemoUsers = async () => {
    try {
      const res = await api.getDemoUsers();
      if (res.data) setDemoUsers(res.data);
    } catch (e) {
      console.warn('Failed loading demo users', e);
    }
  };

  const fetchCurrentGiveaway = async () => {
    setGiveawayLoading(true);
    setGiveawayError(null);
    try {
      const res = await api.getCurrentGiveaway();
      setCurrentGiveaway(res.data);
      setServerTime(res.serverTime);
    } catch (err) {
      setGiveawayError(err.message || "We couldn't load the giveaway information.");
    } finally {
      setGiveawayLoading(false);
    }
  };

  // ---------- Auth Operations ----------
  const register = async ({ name, email, password }) => {
    try {
      const res = await api.register({ name, email, password });
      if (res.data) {
        setUser(res.data);
        setIsLoggedIn(true);
        setIsAdmin(res.data.role === 'admin');
        localStorage.setItem('veloop_user_id', res.data.userId);
        showToast(`Welcome ${res.data.name}! Account created.`, 'success');
        closeAuthModal();
        return res.data;
      }
    } catch (e) {
      showToast(e.message || 'Registration failed', 'error');
      throw e;
    }
  };

  const login = async (credentials = 'VE10025') => {
    try {
      const res = await api.login(credentials);
      if (res.data) {
        setUser(res.data);
        setIsLoggedIn(true);
        setIsAdmin(res.data.role === 'admin');
        localStorage.setItem('veloop_user_id', res.data.userId);
        const roleLabel = res.data.role === 'admin' ? ' [Admin]' : '';
        showToast(`Signed in as ${res.data.name}${roleLabel}`, 'success');
        closeAuthModal();
        return res.data;
      }
    } catch (e) {
      console.error('Login error:', e);
      showToast(e.message || 'Login failed', 'error');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore server errors – we still clear client state
    }
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.setItem('veloop_user_id', 'VISITOR');
    showToast('Signed out (Visitor Mode)', 'info');
  };

  const switchDemoUser = async (userId) => {
    if (userId === 'VISITOR') {
      await logout();
      return;
    }
    const res = await login({ userId });
    // login already updates state
    return res;
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.data) {
        setUser(res.data);
        setIsLoggedIn(true);
        setIsAdmin(res.data.role === 'admin');
      }
    } catch (e) {
      // If refresh fails, treat as unauthenticated
      setUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  // ---------- Initial Load ----------
  useEffect(() => {
    fetchDemoUsers();
    fetchCurrentGiveaway();

    const init = async () => {
      const storedId = localStorage.getItem('veloop_user_id');
      if (storedId && storedId !== 'VISITOR') {
        try {
          const res = await api.login({ userId: storedId });
          if (res.data) {
            setUser(res.data);
            setIsLoggedIn(true);
            setIsAdmin(res.data.role === 'admin');
          }
        } catch (_) {}
      } else {
        try {
          const res = await api.login({ userId: 'VE10025' });
          if (res.data) {
            setUser(res.data);
            setIsLoggedIn(true);
            setIsAdmin(res.data.role === 'admin');
          }
        } catch (_) {}
      }
      setIsAuthLoading(false);
    };
    init();
    const timeout = setTimeout(() => setIsAuthLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isAdmin,
        isAuthLoading,
        demoUsers,
        currentGiveaway,
        giveawayLoading,
        giveawayError,
        serverTime,
        toastMessage,
        showToast,
        register,
        login,
        logout,
        switchDemoUser,
        refreshUser,
        refreshGiveaway: fetchCurrentGiveaway,
        addBalance: async (currency = 'VE', amount = 200, activity = 'Task Bonus') => {
          if (!user || isAdmin) return;
          try {
            const res = await api.earnBalance(currency, amount, activity);
            if (res.data) {
              setUser((prev) => ({
                ...prev,
                balances: res.data.balances,
              }));
              showToast(`Earned +${amount} ${currency}s via ${activity}!`, 'success');
            }
          } catch (err) {
            showToast(err.message, 'error');
          }
        },
        // Modal control
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isAdminModalOpen,
        openAdminModal,
        closeAdminModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
