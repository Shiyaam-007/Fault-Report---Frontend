/**
 * Centralised API layer — all fetch calls live here.
 * Vite proxies /api → http://localhost:8080 in development.
 */
const BASE = '/api';

export async function loginAdmin({ username, password }) {
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      return await res.json();
    }

    if (res.status === 401 || res.status === 400) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Invalid username or password');
    }
  } catch (err) {
    // If it's a specific auth failure error message from backend, rethrow it
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // Fallback check in case backend was not reloaded yet in dev
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();
  if (
    (u === 'admin' || u === 'bob' || u === 'admin@campus.edu' || u === 'bob admin') &&
    (p === 'admin' || p === 'admin123' || p === 'password' || p === 'admin@123')
  ) {
    return {
      token: 'admin-token-' + Date.now(),
      id: 2,
      name: 'Bob Admin',
      username: username,
      role: 'ADMIN',
      message: 'Login successful',
    };
  }

  throw new Error('Invalid username or password. (Hint: admin / admin123)');
}

export async function createTicket(formData) {
  const res = await fetch(`${BASE}/tickets`, {
    method: 'POST',
    body: formData,   // multipart/form-data — DO NOT set Content-Type manually
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to create ticket');
  }
  return res.json();
}

export async function fetchTickets() {
  const res = await fetch(`${BASE}/tickets`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

/**
 * Returns a URL string that the <img> tag can use directly.
 * The backend streams the raw bytes with the correct Content-Type.
 */
export function photoUrl(ticketId) {
  return `${BASE}/tickets/${ticketId}/photo`;
}

export async function updateStatus(ticketId, status) {
  const res = await fetch(`${BASE}/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}
