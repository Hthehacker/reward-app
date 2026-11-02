import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { isDemoMode } from '../config/demoConfig.js';

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
  const [participationStatus, setParticipationStatus] = useState(null);

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
    if (!isDemoMode) return;
    try {
      const res = await api.getDemoUsers();
      if (res.data) setDemoUsers(res.data);
    } catch {
      // Demo users list unavailable (e.g. in production mode)
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

  const checkParticipation = async (giveawayId, activeUser) => {
    const currentUser = activeUser !== undefined ? activeUser : user;
    const currentGId = giveawayId || currentGiveaway?.giveawayId;

    if (!currentUser || !currentGId || currentUser.role === 'admin' || currentUser.userId === 'VISITOR') {
      setParticipationStatus(null);
      return null;
    }

    try {
      const res = await api.getMyStatus(currentGId);
      if (res && res.data) {
        setParticipationStatus(res.data);
        return res.data;
      }
    } catch {
      setParticipationStatus(null);
      return null;
    }
  };

  const markAsJoined = (joinData) => {
    setParticipationStatus((prev) => ({
      ...(prev || {}),
      isParticipating: true,
      participation: joinData?.participation || joinData,
      entryCount: 1
    }));
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
      showToast(e.message || 'Login failed', 'error');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore server errors – client state is cleared
    }
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setParticipationStatus(null);
    localStorage.setItem('veloop_user_id', 'VISITOR');
    showToast('Signed out (Visitor Mode)', 'info');
  };

  const switchDemoUser = async (userId) => {
    if (!isDemoMode) {
      console.warn('[Security Guard]: Demo persona switching is strictly disabled in production.');
      return;
    }
    if (userId === 'VISITOR') {
      await logout();
      return;
    }
    const res = await login({ userId });
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
    } catch {
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
      // 1. First check if user is already authenticated via session/cookie
      try {
        const meRes = await api.getMe();
        if (meRes && meRes.data) {
          setUser(meRes.data);
          setIsLoggedIn(true);
          setIsAdmin(meRes.data.role === 'admin');
          localStorage.setItem('veloop_user_id', meRes.data.userId);
          setIsAuthLoading(false);
          return;
        }
      } catch {
        // Not authenticated via active cookie session
      }

      // 2. In demo mode (staging/dev), check stored demo persona or fallback
      if (isDemoMode) {
        const storedId = localStorage.getItem('veloop_user_id');
        if (storedId && storedId !== 'VISITOR') {
          try {
            const res = await api.login({ userId: storedId });
            if (res.data) {
              setUser(res.data);
              setIsLoggedIn(true);
              setIsAdmin(res.data.role === 'admin');
            }
          } catch {
            setUser(null);
            setIsLoggedIn(false);
            setIsAdmin(false);
          }
        } else if (!storedId) {
          // Default initial demo user for instant exploratory review
          try {
            const res = await api.login({ userId: 'VE10025' });
            if (res.data) {
              setUser(res.data);
              setIsLoggedIn(true);
              setIsAdmin(res.data.role === 'admin');
            }
          } catch {
            setUser(null);
            setIsLoggedIn(false);
            setIsAdmin(false);
          }
        }
      }
      setIsAuthLoading(false);
    };

    init();
    const timeout = setTimeout(() => setIsAuthLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  // Sync participation status whenever user or active giveaway changes
  useEffect(() => {
    if (user && user.userId !== 'VISITOR' && user.role !== 'admin' && currentGiveaway?.giveawayId) {
      checkParticipation(currentGiveaway.giveawayId, user);
    } else {
      setParticipationStatus(null);
    }
  }, [user?.userId, currentGiveaway?.giveawayId]);

  return (
    <AuthContext.Provider
      value={{
        isDemoMode,
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
        participationStatus,
        isParticipating: Boolean(participationStatus?.isParticipating),
        markAsJoined,
        refreshParticipation: checkParticipation,
        setParticipationStatus,
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
