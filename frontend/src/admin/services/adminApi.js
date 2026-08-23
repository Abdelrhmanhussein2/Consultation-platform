/**
 * DIWAN TAX PLATFORM - ADMIN API CLIENT
 * Connects the Admin Command Center with FastAPI Backend (/api/super-admin/*)
 */

const API_BASE = '/api';

/**
 * Get current Auth Token from storage / memory
 */
export function getAdminToken() {
  if (typeof window !== 'undefined') {
    return window.__ADMIN_TOKEN__ || 
           localStorage.getItem('token') || 
           localStorage.getItem('access_token') || 
           sessionStorage.getItem('token') ||
           '';
  }
  return '';
}

/**
 * Set current Auth Token
 */
export function setAdminToken(token) {
  if (typeof window !== 'undefined') {
    window.__ADMIN_TOKEN__ = token;
    try {
      localStorage.setItem('token', token);
    } catch (e) {}
  }
}

/**
 * Unified request helper
 */
async function adminRequest(endpoint, options = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    // If unauthenticated on admin routes
    if (res.status === 401) {
      console.warn('Admin session expired or token missing.');
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`Admin API Error [${endpoint}]:`, err);
    throw err;
  }
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD & STATS
   ══════════════════════════════════════════════════════════════════ */
export async function getDashboardStats() {
  return adminRequest('/super-admin/dashboard/stats');
}

export async function getAuditLogs(limit = 20) {
  return adminRequest(`/super-admin/audit-logs?limit=${limit}`);
}

/* ══════════════════════════════════════════════════════════════════
   USERS & COMPANIES
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminRequest(`/super-admin/users${query ? `?${query}` : ''}`);
}

export async function toggleUserActive(userId) {
  return adminRequest(`/super-admin/users/${userId}/toggle-active`, {
    method: 'PATCH'
  });
}

export async function getPendingCompanyApprovals() {
  return adminRequest('/super-admin/users/pending-approvals');
}

export async function approveCompanyRegistration(userId) {
  return adminRequest(`/super-admin/users/${userId}/approve`, {
    method: 'POST'
  });
}

/* ══════════════════════════════════════════════════════════════════
   CONSULTANTS & CREDENTIALS
   ══════════════════════════════════════════════════════════════════ */
export async function getPendingCredentials() {
  return adminRequest('/super-admin/credentials/pending');
}

export async function reviewCredential(credentialId, { action, rejection_reason = '' }) {
  return adminRequest(`/super-admin/credentials/${credentialId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, rejection_reason })
  });
}

/* ══════════════════════════════════════════════════════════════════
   FINANCIAL & PAYOUTS
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminPayouts(status = '') {
  return adminRequest(`/super-admin/payouts${status ? `?status=${status}` : ''}`);
}

export async function reviewPayout(payoutId, { action, transfer_reference = '', bank_name = '', rejection_reason = '' }) {
  return adminRequest(`/super-admin/payouts/${payoutId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, transfer_reference, bank_name, rejection_reason })
  });
}

/* ══════════════════════════════════════════════════════════════════
   SESSIONS & MEETINGS
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminSessions() {
  return adminRequest('/super-admin/sessions');
}

export async function getObserverToken(sessionId) {
  return adminRequest(`/super-admin/sessions/${sessionId}/observer-token`, {
    method: 'POST'
  });
}

/* ══════════════════════════════════════════════════════════════════
   SUPPORT TICKETS
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminTickets(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminRequest(`/super-admin/tickets${query ? `?${query}` : ''}`);
}

export async function replyAdminTicket(ticketId, { reply_text, is_internal = false, status_update = null }) {
  return adminRequest(`/super-admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply_text, is_internal, status_update })
  });
}

/* ══════════════════════════════════════════════════════════════════
   SETTINGS (7 SECTIONS)
   ══════════════════════════════════════════════════════════════════ */
export async function getSettingsSection(section) {
  return adminRequest(`/super-admin/settings/${section}`);
}

export async function updateSettingsSection(section, data) {
  return adminRequest(`/super-admin/settings/${section}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function testSmtpEmail(recipientEmail) {
  return adminRequest('/super-admin/settings/email/test', {
    method: 'POST',
    body: JSON.stringify({ recipient_email: recipientEmail })
  });
}

/* ══════════════════════════════════════════════════════════════════
   ADMINS & RBAC
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminsList() {
  return adminRequest('/super-admin/admins');
}

export async function createAdmin(adminData) {
  return adminRequest('/super-admin/admins', {
    method: 'POST',
    body: JSON.stringify(adminData)
  });
}

/* ══════════════════════════════════════════════════════════════════
   NOTIFICATIONS & BROADCAST
   ══════════════════════════════════════════════════════════════════ */
export async function sendBroadcastNotification({ title, message, audience = 'all' }) {
  return adminRequest('/super-admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify({ title, message, audience })
  });
}
