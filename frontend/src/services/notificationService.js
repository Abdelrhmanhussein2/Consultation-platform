import { apiFetch } from './api';

export const notificationService = {
  // Get unread notification count
  async getUnreadCount(token) {
    return await apiFetch('/api/notifications/unread-count', {
      method: 'GET'
    }, token);
  },

  // Get notifications list
  async getMyNotifications(token) {
    return await apiFetch('/api/notifications/', {
      method: 'GET'
    }, token);
  },

  // Mark single notification as read
  async markAsRead(id, token) {
    return await apiFetch(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    }, token);
  },

  // Mark all notifications as read
  async markAllAsRead(token) {
    return await apiFetch('/api/notifications/read-all', {
      method: 'POST'
    }, token);
  }
};

export default notificationService;
