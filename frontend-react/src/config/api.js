// Central place for API base URL + a fetch wrapper that auto-attaches
// the Bearer token from the logged-in user. Backend routes like /history,
// /evaluate-interview and /clear-history are token-protected
// (see routes/deps.py -> get_current_user_id), so any fetch to them
// WITHOUT this header will always 401 — use apiFetch for those.

export const API_BASE = "http://127.0.0.1:8000";

function getToken() {
  try {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user?.token || null;
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}