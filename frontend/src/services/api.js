const API_BASE = import.meta.env.VITE_API_URL;

// Helper to get active authentication token from localStorage
const getHeaders = () => {
  const token = localStorage.getItem('veloop_token');
  const userId = localStorage.getItem('veloop_user_id') || 'VE10025';
  const deviceHash = localStorage.getItem('veloop_device_hash') || 'dev_web_client_fp_01';

  const headers = {
    'Content-Type': 'application/json',
    'x-device-hash': deviceHash,
    'x-user-id': userId
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (res) => {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errorObj = json.error || {};
    const err = new Error(errorObj.message || 'An unexpected request error occurred');
    err.code = errorObj.code || 'REQUEST_FAILED';
    err.details = errorObj;
    throw err;
  }
  return json;
};

export const api = {
  // Giveaways
  getCurrentGiveaway: async () => {
    const res = await fetch(`${API_BASE}/giveaways/current`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getGiveawayById: async (idOrSlug) => {
    const res = await fetch(`${API_BASE}/giveaways/${idOrSlug}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getPreviousGiveaways: async () => {
    const res = await fetch(`${API_BASE}/giveaways/previous`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getGiveawayStats: async () => {
    const res = await fetch(`${API_BASE}/giveaways/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getWinnerTicker: async () => {
    const res = await fetch(`${API_BASE}/giveaways/ticker`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Winners
  getGiveawayWinners: async (id) => {
    const res = await fetch(`${API_BASE}/giveaways/${id}/winners`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getPreviousWinners: async () => {
    const res = await fetch(`${API_BASE}/giveaways/previous/winners`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Participation
  getMyStatus: async (giveawayId) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/my-status`, { headers: getHeaders() });
    return handleResponse(res);
  },

  joinGiveaway: async (giveawayId, prizeId) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prizeId })
    });
    return handleResponse(res);
  },

  // Prize Claim
  getMyClaimStatus: async (giveawayId) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/my-claim`, { headers: getHeaders() });
    return handleResponse(res);
  },

  submitPrizeClaim: async (giveawayId, payload) => {
    const res = await fetch(`${API_BASE}/giveaways/${giveawayId}/claim`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Auth & Demo Users
  login: async (userId) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getDemoUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/demo-users`, { headers: getHeaders() });
    return handleResponse(res);
  },

  earnBalance: async (currency, amount, activity) => {
    const res = await fetch(`${API_BASE}/auth/earn-balance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currency, amount, activity })
    });
    return handleResponse(res);
  },

  // Admin Controls
  adminSetStatus: async (giveawayId, status) => {
    const res = await fetch(`${API_BASE}/admin/giveaways/${giveawayId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  adminSelectWinners: async (giveawayId) => {
    const res = await fetch(`${API_BASE}/admin/giveaways/${giveawayId}/select-winners`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  adminGetAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: getHeaders() });
    return handleResponse(res);
  },

  adminGetFraudEvents: async () => {
    const res = await fetch(`${API_BASE}/admin/fraud-events`, { headers: getHeaders() });
    return handleResponse(res);
  },

  adminResetDemo: async () => {
    const res = await fetch(`${API_BASE}/admin/reset-demo`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
