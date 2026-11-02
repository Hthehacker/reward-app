const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to build request headers (including auth token, device hash, and user identifier)
const getHeaders = () => {
  const deviceHash = localStorage.getItem('veloop_device_hash') || 'dev_web_client_fp_01';
  const token = localStorage.getItem('veloop_access_token');
  const userId = localStorage.getItem('veloop_user_id');
  const headers = {
    'Content-Type': 'application/json',
    'x-device-hash': deviceHash
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId && userId !== 'VISITOR') {
    headers['x-user-id'] = userId;
  }
  return headers;
};

// Central response handling – throws on non‑ok or API‑defined errors
const handleResponse = async (res) => {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errorObj = json.error || {};
    const err = new Error(errorObj.message || 'An unexpected request error occurred');
    err.code = errorObj.code || 'REQUEST_FAILED';
    err.status = res.status;
    err.details = errorObj;
    throw err;
  }
  return json;
};

// Wrapper to automatically refresh access token on 401 and retry the request
const originalFetch = window.fetch || fetch;
const authFetch = async (url, options = {}) => {
  const reqOptions = {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) }
  };
  let res = await originalFetch(url, reqOptions);
  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/refresh')) {
    try {
      const refreshRes = await api.refresh();
      if (refreshRes && (refreshRes.token || refreshRes.accessToken)) {
        reqOptions.headers = { ...getHeaders(), ...(options.headers || {}) };
        res = await originalFetch(url, reqOptions);
      }
    } catch (e) {
      // Refresh failed or not authenticated
    }
  }
  return res;
};
// Shadow the global fetch for this module
const fetch = authFetch;

export const api = {
  // Giveaways
  getCurrentGiveaway: async () => {
    const res = await fetch(`${API_BASE}/giveaways/current`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  getGiveawayById: async (idOrSlug) => {
    const res = await fetch(`${API_BASE}/giveaways/${idOrSlug}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  getPreviousGiveaways: async () => {
    const res = await fetch(`${API_BASE}/giveaways/previous`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  getGiveawayStats: async () => {
    const res = await fetch(`${API_BASE}/giveaways/stats`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  getWinnerTicker: async () => {
    const res = await fetch(`${API_BASE}/giveaways/ticker`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  // Winners
  getGiveawayWinners: async (id) => {
    const res = await fetch(`${API_BASE}/giveaways/${id}/winners`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  getPreviousWinners: async () => {
    const res = await fetch(`${API_BASE}/giveaways/previous/winners`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  // Participation
  getMyStatus: async (giveawayId) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/my-status`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  joinGiveaway: async (giveawayId, prizeId) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ prizeId })
    });
    return handleResponse(res);
  },
  // Prize Claim
  getMyClaimStatus: async (giveawayId) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/my-claim`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  submitPrizeClaim: async (giveawayId, payload) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/claim`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  // Auth & User Management
  register: async ({ name, email, password }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, email, password })
    });
    const json = await handleResponse(res);
    if (json.token || json.accessToken) {
      localStorage.setItem('veloop_access_token', json.token || json.accessToken);
    }
    if (json.data?.userId) {
      localStorage.setItem('veloop_user_id', json.data.userId);
    }
    if (json.data?.deviceHash) {
      localStorage.setItem('veloop_device_hash', json.data.deviceHash);
    }
    return json;
  },
  login: async (credentials) => {
    const payload = typeof credentials === 'string' ? { userId: credentials } : credentials;
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const json = await handleResponse(res);
    if (json.token || json.accessToken) {
      localStorage.setItem('veloop_access_token', json.token || json.accessToken);
    }
    if (json.data?.userId) {
      localStorage.setItem('veloop_user_id', json.data.userId);
    }
    if (json.data?.deviceHash) {
      localStorage.setItem('veloop_device_hash', json.data.deviceHash);
    }
    return json;
  },
  logout: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include'
      });
      await handleResponse(res);
    } catch (_) {}
    localStorage.removeItem('veloop_access_token');
    localStorage.setItem('veloop_user_id', 'VISITOR');
    return { success: true };
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  getDemoUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/demo-users`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  earnBalance: async (currency, amount, activity) => {
    const res = await fetch(`${API_BASE}/auth/earn-balance`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ currency, amount, activity })
    });
    return handleResponse(res);
  },
  // Token refresh endpoint
  refresh: async () => {
    const res = await originalFetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    const json = await handleResponse(res);
    if (json.token || json.accessToken) {
      localStorage.setItem('veloop_access_token', json.token || json.accessToken);
    }
    return json;
  },
  // Admin endpoints
  adminGetPrizes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/admin/prizes${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetPrizeById: async (id) => {
    const res = await fetch(`${API_BASE}/admin/prizes/${id}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminCreatePrize: async (data) => {
    const res = await fetch(`${API_BASE}/admin/prizes`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdatePrize: async (id, data) => {
    const res = await fetch(`${API_BASE}/admin/prizes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeletePrize: async (id) => {
    const res = await fetch(`${API_BASE}/admin/prizes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetGiveaways: async () => {
    const res = await fetch(`${API_BASE}/admin/giveaways`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminCreateGiveaway: async (data) => {
    const res = await fetch(`${API_BASE}/admin/giveaways`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminUpdateGiveaway: async (giveawayId, data) => {
    const res = await fetch(`${API_BASE}/admin/giveaways/${giveawayId}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  adminDeleteGiveaway: async (giveawayId) => {
    const res = await fetch(`${API_BASE}/admin/giveaways/${giveawayId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminSetStatus: async (giveawayId, status) => {
    const res = await fetch(`${API_BASE}/admin/giveaways/${giveawayId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },
  adminSelectWinners: async (giveawayId) => {
    const res = await fetch(`${API_BASE}/admin/giveaways/${giveawayId}/select-winners`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetUsers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(`${API_BASE}/admin/users${queryString}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetCoinStats: async () => {
    const res = await fetch(`${API_BASE}/admin/coins/stats`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetCoinTransactions: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.type) query.append('type', params.type);
    if (params.currency) query.append('currency', params.currency);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(`${API_BASE}/admin/coins/transactions${queryString}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminAdjustCoins: async ({ userId, currency = 'VE', amount, type, reason }) => {
    const res = await fetch(`${API_BASE}/admin/coins/adjust`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ userId, currency, amount, type, reason })
    });
    return handleResponse(res);
  },
  adminGetAnalytics: async () => {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetParticipants: async () => {
    const res = await fetch(`${API_BASE}/admin/participants`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetWinners: async () => {
    const res = await fetch(`${API_BASE}/admin/winners`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminGetFraudEvents: async () => {
    const res = await fetch(`${API_BASE}/admin/fraud-events`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  adminResetDemo: async () => {
    const res = await fetch(`${API_BASE}/admin/reset-demo`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  }
};
