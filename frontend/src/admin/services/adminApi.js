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
 * Get current Auth Token from in-memory state or Cookies ONLY.
 * localStorage is intentionally excluded to prevent session hijacking after browser close.
 */
export function getAdminToken() {
  if (typeof window !== 'undefined') {
    if (window.__ADMIN_TOKEN__) return window.__ADMIN_TOKEN__;
    try {
      const storedToken = getCookie('token') || getCookie('admin_token');
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

    // Automatically trigger live reactive sync across the platform
    if (typeof window !== 'undefined' && options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      window.dispatchEvent(new CustomEvent('admin_data_updated', { detail: { endpoint } }));
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
export async function getDashboardStats(period = 'week') {
  return adminRequest(`/super-admin/dashboard/stats?period=${period}`);
}


/* ══════════════════════════════════════════════════════════════════
   USERS & COMPANIES
   ══════════════════════════════════════════════════════════════════ */
export async function getAdminUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminRequest(`/super-admin/users${query ? `?${query}` : ''}`);
}

export async function getUserFullProfile(userId) {
  return adminRequest(`/super-admin/users/${userId}/full-profile`);
}

export async function toggleUserActive(userId) {
  return adminRequest(`/super-admin/users/${userId}/toggle-active`, {
    method: 'POST'
  });
}

export async function updateUserProfile(userId, profileData) {
  return adminRequest(`/super-admin/users/${userId}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(profileData)
  });
}

export async function resetUserPassword(userId, { new_password, mode = 'admin' }) {
  return adminRequest(`/super-admin/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ new_password, mode })
  });
}

export async function deleteAdminUser(userId) {
  return adminRequest(`/super-admin/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function adminAddUserDirect(userData) {
  return adminRequest('/super-admin/users/add', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function getPendingUsers() {
  return adminRequest('/super-admin/users/pending');
}

export async function handleUserAction(userId, action, rejection_reason = '') {
  return adminRequest(`/super-admin/users/${userId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, rejection_reason })
  });
}

export async function handleConsultantAction(userId, action, rejection_reason = '') {
  return adminRequest(`/super-admin/consultants/${userId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, rejection_reason })
  });
}

export async function sendDirectUserMessage(userId, { title = 'رسالة من إدارة المنصة', message }) {
  return adminRequest(`/super-admin/users/${userId}/message`, {
    method: 'POST',
    body: JSON.stringify({ title, message })
  });
}

export async function getUserMessages(userId) {
  return adminRequest(`/super-admin/users/${userId}/messages`);
}

export async function getAppointmentMessages(appointmentId, page = 1, limit = 50) {
  return adminRequest(`/chat/${appointmentId}/messages?page=${page}&limit=${limit}`);
}

export async function sendAppointmentMessage(appointmentId, messageText) {
  return adminRequest(`/chat/${appointmentId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message_text: messageText })
  });
}

export async function getLoginHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminRequest(`/super-admin/login-history${query ? `?${query}` : ''}`);
}

export async function deleteLoginLog(logId) {
  return adminRequest(`/super-admin/login-history/${logId}`, {
    method: 'DELETE'
  });
}

export async function getAccountRoles() {
  return adminRequest('/super-admin/account-roles');
}

export async function saveAccountRoles(rolesList) {
  return adminRequest('/super-admin/account-roles', {
    method: 'POST',
    body: JSON.stringify(rolesList)
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
  let queryObj = params;
  if (typeof params === 'string') {
    queryObj = params !== 'all' ? { status: params } : {};
  }
  const query = new URLSearchParams(queryObj).toString();
  return adminRequest(`/super-admin/tickets${query ? `?${query}` : ''}`);
}

export async function getTicketAssignees() {
  try {
    const res = await adminRequest('/super-admin/tickets/assignees');
    if (Array.isArray(res) && res.length > 0) return res;
  } catch (e) {
    console.warn('Failed to fetch from /super-admin/tickets/assignees, trying fallback', e);
  }
  try {
    const admins = await adminRequest('/super-admin/admins');
    if (Array.isArray(admins)) {
      return admins.map(a => ({
        id: a.id,
        name: a.full_name || a.email,
        email: a.email,
        role: a.role === 'super_admin' ? 'مسؤول رئيسي' : 'مشرف نظام / دعم',
        role_code: a.role,
        is_active: a.is_active
      }));
    }
  } catch (e2) {
    console.warn('Failed to fetch from fallback /super-admin/admins', e2);
  }
  return [];
}

export async function getAdminTicket(ticketId) {
  return adminRequest(`/super-admin/tickets/${ticketId}`);
}

export async function createAdminTicket(ticketData) {
  return adminRequest('/super-admin/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
}

export async function replyAdminTicket(ticketId, data) {
  const payload = typeof data === 'string'
    ? { message: data, reply_text: data }
    : {
        message: data.message || data.reply_text || '',
        reply_text: data.reply_text || data.message || '',
        is_internal: Boolean(data.is_internal),
        status_update: data.status_update || null
      };
  return adminRequest(`/super-admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateAdminTicketStatus(ticketId, updateData) {
  return adminRequest(`/super-admin/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
}

export async function closeAdminTicket(ticketId, resolutionNotes = '') {
  return adminRequest(`/super-admin/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'closed',
      internal_notes: resolutionNotes || 'Closed by admin'
    })
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
  return adminRequest(`/super-admin/users${query ? `?${query}` : ''}`);
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

export const updateAdminTicket = updateAdminTicketStatus;

/* ══════════════════════════════════════════════════════════════════
   CONTROL CENTER (AUTOMATION, R360, AI CONTROL)
   ══════════════════════════════════════════════════════════════════ */
export async function getAutomationRules(status = null, search = null) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return adminRequest(`/super-admin/automation-rules${queryString}`);
}

export async function createAutomationRule(ruleData) {
  return adminRequest('/super-admin/automation-rules', {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });
}

export async function updateAutomationRule(ruleId, ruleData) {
  return adminRequest(`/super-admin/automation-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(ruleData)
  });
}

export async function deleteAutomationRule(ruleId) {
  return adminRequest(`/super-admin/automation-rules/${ruleId}`, {
    method: 'DELETE'
  });
}

export async function getAutomationRuleEffects(limit = 50) {
  return adminRequest(`/super-admin/automation-rules/effects?limit=${limit}`);
}

export async function search360Entities(query = '', entityType = 'all', limit = 50) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (entityType) params.append('entity_type', entityType);
  if (limit) params.append('limit', limit.toString());
  return adminRequest(`/super-admin/r360/search?${params.toString()}`);
}

export async function get360EntityDetails(entityType, entityId) {
  return adminRequest(`/super-admin/r360/${entity_type_map(entityType)}/${entityId}`);
}

function entity_type_map(type) {
  if (type === 'consultant') return 'consultant';
  if (type === 'session') return 'session';
  return 'user';
}

export async function getAIControlConfig() {
  return adminRequest('/super-admin/ai-control/config');
}

export async function updateAIControlConfig(configData) {
  return adminRequest('/super-admin/ai-control/config', {
    method: 'PATCH',
    body: JSON.stringify(configData)
  });
}

export async function getPendingConsultants() {
  return adminRequest('/super-admin/consultants/pending');
}

export async function getAllInvoices(page = 1, limit = 50) {
  return adminRequest(`/invoices/all?page=${page}&limit=${limit}`);
}

export async function getOperationalAlerts() {
  return adminRequest('/super-admin/operational-alerts');
}

export async function markOperationalNotificationAsRead(notificationId) {
  return adminRequest(`/super-admin/operational-alerts/notifications/${notificationId}/read`, {
    method: 'PATCH'
  });
}

export async function markAllOperationalNotificationsAsRead() {
  return adminRequest('/super-admin/operational-alerts/notifications/read-all', {
    method: 'POST'
  });
}

export async function deleteOperationalNotification(notificationId) {
  return adminRequest(`/super-admin/operational-alerts/notifications/${notificationId}`, {
    method: 'DELETE'
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECURITY CENTER & AUDIT LOGS APIS
// ─────────────────────────────────────────────────────────────────────

export async function getSecurityMetrics() {
  return adminRequest('/super-admin/security/metrics');
}

export async function getFileDownloadLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.file_category && params.file_category !== 'all') query.append('file_category', params.file_category);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.user_role && params.user_role !== 'all') query.append('user_role', params.user_role);
  if (params.date_from) query.append('date_from', params.date_from);
  if (params.date_to) query.append('date_to', params.date_to);

  const qs = query.toString();
  return adminRequest(`/super-admin/security/downloads${qs ? `?${qs}` : ''}`);
}

export async function getSecuritySessions(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);

  const qs = query.toString();
  return adminRequest(`/super-admin/security/sessions${qs ? `?${qs}` : ''}`);
}

export async function revokeSecuritySession(sessionId) {
  return adminRequest(`/super-admin/security/sessions/${sessionId}/revoke`, {
    method: 'POST'
  });
}

export async function getAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (typeof params === 'number') {
    query.append('limit', params);
  } else {
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.action_type && params.action_type !== 'all') query.append('action_type', params.action_type);
    if (params.admin_id && params.admin_id !== 'all') query.append('admin_id', params.admin_id);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
  }

  const qs = query.toString();
  return adminRequest(`/super-admin/audit-logs${qs ? `?${qs}` : ''}`);
}



