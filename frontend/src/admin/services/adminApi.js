/**
 * DIWAN TAX PLATFORM - ADMIN API CLIENT
 * Connects the Admin Command Center with FastAPI Backend (/api/super-admin/*)
 */

const API_BASE = '/api';

// Strictly In-Memory Token Reference (No localStorage / No sessionStorage for maximum security)
let inMemoryAdminToken = '';

const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
};

/**
 * Get current Auth Token from in-memory state, Cookies, or LocalStorage
 */
export function getAdminToken() {
  if (typeof window !== 'undefined') {
    if (window.__ADMIN_TOKEN__) return window.__ADMIN_TOKEN__;
    try {
      const storedToken = getCookie('token') || getCookie('admin_token') || localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (storedToken) return storedToken;
    } catch {}
  }
  return inMemoryAdminToken;
}

/**
 * Set current Auth Token in-memory only
 */
export function setAdminToken(token) {
  inMemoryAdminToken = token || '';
  if (typeof window !== 'undefined') {
    window.__ADMIN_TOKEN__ = token || '';
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

export async function adminJoinSession(appointmentId) {
  return adminRequest(`/super-admin/sessions/${appointmentId}/join`, {
    method: 'POST'
  });
}

export async function updateAdminSessionStatus(appointmentId, status) {
  return adminRequest(`/super-admin/sessions/${appointmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function getUserStats() {
  return adminRequest('/super-admin/stats/users');
}

export async function adminAddUser(userData) {
  return adminRequest('/super-admin/users/add', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

/* ══════════════════════════════════════════════════════════════════
   SUPPORT TICKETS
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminTickets(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminRequest(`/super-admin/tickets${query ? `?${query}` : ''}`);
}

export async function createAdminTicket(ticketData) {
  return adminRequest('/super-admin/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
}

export async function replyAdminTicket(ticketId, { reply_text, is_internal = false, status_update = null }) {
  return adminRequest(`/super-admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply_text, is_internal, status_update })
  });
}

export async function updateAdminTicketStatus(ticketId, updateData) {
  return adminRequest(`/super-admin/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
}

export async function closeAdminTicket(ticketId, resolutionNotes = '') {
  return adminRequest(`/super-admin/tickets/${ticketId}/close`, {
    method: 'PATCH',
    body: JSON.stringify({ resolution_notes: resolutionNotes })
  });
}


/* ══════════════════════════════════════════════════════════════════
   SETTINGS (7 SECTIONS)
   ══════════════════════════════════════════════════════════════════ */
export async function getAllPlatformSettings() {
  return adminRequest('/super-admin/settings');
}

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

export async function updateAdminPermissions(adminId, permissions) {
  return adminRequest(`/super-admin/admins/${adminId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions })
  });
}

export async function getAdminRoles() {
  return adminRequest('/super-admin/roles');
}

export async function createAdminRole(roleData) {
  return adminRequest('/super-admin/roles', {
    method: 'POST',
    body: JSON.stringify(roleData)
  });
}

export async function updateAdminRole(roleId, roleData) {
  return adminRequest(`/super-admin/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify(roleData)
  });
}

export async function deleteAdminRole(roleId) {
  return adminRequest(`/super-admin/roles/${roleId}`, {
    method: 'DELETE'
  });
}

export async function assignUserRole(userId, { role_name, role_type, permissions }) {
  return adminRequest(`/super-admin/users/${userId}/assign-role`, {
    method: 'POST',
    body: JSON.stringify({ role_name, role_type, permissions })
  });
}

export async function getAdminUsersList(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminRequest(`/super-admin/users/all${query ? `?${query}` : ''}`);
}




/* ══════════════════════════════════════════════════════════════════
   REPORTS & ANALYTICS
   ══════════════════════════════════════════════════════════════════ */
export async function getReportsAnalytics(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.from_date) query.append('from_date', params.from_date);
  if (params.to_date) query.append('to_date', params.to_date);
  if (params.user_type && params.user_type !== 'all') query.append('user_type', params.user_type);
  if (params.sector && params.sector !== 'all') query.append('sector', params.sector);
  if (params.city && params.city !== 'all') query.append('city', params.city);
  if (params.status && params.status !== 'all') query.append('status', params.status);

  const qs = query.toString();
  return adminRequest(`/super-admin/analytics/reports${qs ? `?${qs}` : ''}`);
}

/* ══════════════════════════════════════════════════════════════════
   NOTIFICATIONS & BROADCAST
   ══════════════════════════════════════════════════════════════════ */
export async function createAdminUser(userData) {
  return adminRequest('/super-admin/users/add', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function sendBroadcastNotification({ title, message, audience = 'all' }) {
  return adminRequest('/super-admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify({ title, message, audience })
  });
}

/* ══════════════════════════════════════════════════════════════════
   PAYMENTS & TRANSFERS
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminPayments() {
  return adminRequest('/super-admin/payments');
}

export async function processAdminPaymentAction(paymentId, action, extra = {}) {
  return adminRequest(`/super-admin/payments/${paymentId}/action`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      notes: extra.notes || extra.admin_notes || '',
      ref: extra.ref || extra.transfer_reference || ''
    })
  });
}

export async function deleteAdminPayment(paymentId) {
  return adminRequest(`/super-admin/payments/${paymentId}`, {
    method: 'DELETE'
  });
}

export async function getAdminTicketDetail(ticketId) {
  return adminRequest(`/super-admin/tickets/${ticketId}`);
}





