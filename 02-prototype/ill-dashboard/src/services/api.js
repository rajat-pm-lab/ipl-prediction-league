const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('ill_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  health: () => fetchAPI('/health'),
  config: () => fetchAPI('/config'),
  
  leaderboard: {
    weekly: (week) => fetchAPI(`/leaderboard/weekly?week=${week}`),
    stage: (stage) => fetchAPI(`/leaderboard/stage?stage=${stage}`),
    overall: () => fetchAPI('/leaderboard/overall'),
    cumulative: () => fetchAPI('/leaderboard/cumulative'),
  },

  player: {
    get: (id) => fetchAPI(`/player/${id}`),
    predictions: (id, week) => 
      fetchAPI(`/player/${id}/predictions${week ? `?week=${week}` : ''}`),
  },

  matches: {
    list: (week) => fetchAPI(`/matches${week ? `?week=${week}` : ''}`),
    get: (matchNum) => fetchAPI(`/matches/${matchNum}`),
  },

  auth: {
    login: (email, password) => 
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (name, email, password) =>
      fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => fetchAPI('/auth/me'),
  },

  admin: {
    matchResult: (matchId, result, winner) =>
      fetchAPI('/admin/match-result', {
        method: 'POST',
        body: JSON.stringify({ matchId, result, winner }),
      }),
    syncPredictions: (weekNumber, predictions) =>
      fetchAPI('/admin/sync-predictions', {
        method: 'POST',
        body: JSON.stringify({ weekNumber, predictions }),
      }),
    overrideScore: (predictionId, newPoints, reason) =>
      fetchAPI('/admin/override-score', {
        method: 'POST',
        body: JSON.stringify({ predictionId, newPoints, reason }),
      }),
    auditLog: () => fetchAPI('/admin/audit-log'),
  },
};

export function setToken(token) {
  localStorage.setItem('ill_token', token);
}

export function getToken() {
  return localStorage.getItem('ill_token');
}

export function clearToken() {
  localStorage.removeItem('ill_token');
}
