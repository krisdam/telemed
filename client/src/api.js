// When frontend and backend are deployed separately (e.g. frontend on Vercel,
// backend on Railway), set VITE_API_URL to the backend's URL. Same-origin
// deploys (single Node server serving both) can leave it unset.
const API_ROOT = import.meta.env.VITE_API_URL || '';
const BASE = `${API_ROOT}/api`;

function getToken() {
  return localStorage.getItem('telecare_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/me'),
  plans: () => request('/plans'),
  changePlan: (plan) => request('/plan/change', { method: 'POST', body: JSON.stringify({ plan }) }),
  slots: () => request('/slots'),
  submitIntake: (body) => request('/intake', { method: 'POST', body: JSON.stringify(body) }),
  book: (body) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  myAppointments: () => request('/appointments/mine'),
  appointment: (id) => request(`/appointments/${id}`),
  providerQueue: () => request('/provider/queue'),
  completeVisit: (id, body) => request(`/provider/appointments/${id}/complete`, { method: 'POST', body: JSON.stringify(body) }),
};

export function saveSession(token) {
  localStorage.setItem('telecare_token', token);
}

export function clearSession() {
  localStorage.removeItem('telecare_token');
}

export { getToken };
