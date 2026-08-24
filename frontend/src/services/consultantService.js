import { apiFetch } from './api';

export const consultantService = {
  // Get all approved consultants with optional filters
  async getConsultants(filters = {}, token) {
    const params = new URLSearchParams();
    if (filters.specialization_id) params.append('specialization_id', filters.specialization_id);
    if (filters.service_name) params.append('service_name', filters.service_name);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.min_rating) params.append('min_rating', filters.min_rating);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/api/consultants/${queryString}`, {
      method: 'GET'
    }, token);
  },

  // Get consultant public profile
  async getConsultantProfile(profileId, token) {
    return await apiFetch(`/api/consultants/${profileId}`, {
      method: 'GET'
    }, token);
  },

  // Get consultant active services
  async getConsultantServices(profileId, token) {
    return await apiFetch(`/api/consultants/${profileId}/services`, {
      method: 'GET'
    }, token);
  },

  // Get available time slots for a consultant
  async getAvailableSlots(profileId, startDate, endDate, durationMinutes = 60, token) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      duration_minutes: durationMinutes
    });
    return await apiFetch(`/api/consultants/${profileId}/available-slots?${params.toString()}`, {
      method: 'GET'
    }, token);
  },

  // Get all active specializations
  async getSpecializations() {
    return await apiFetch('/api/specializations/', {
      method: 'GET'
    });
  },

  // Get consultant financial wallet balance
  async getWallet(token) {
    return await apiFetch('/api/consultants/me/wallet', {
      method: 'GET'
    }, token);
  },

  // Get logged-in consultant's incoming appointments
  async getIncomingAppointments(token) {
    return await apiFetch('/api/appointments/incoming', {
      method: 'GET'
    }, token);
  },

  // Approve a pending booking request
  async approveAppointment(appointmentId, token) {
    return await apiFetch(`/api/appointments/${appointmentId}/approve`, {
      method: 'POST'
    }, token);
  },

  // Reject/Cancel a booking request
  async rejectAppointment(appointmentId, reason, token) {
    return await apiFetch(`/api/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      body: { reason }
    }, token);
  },

  // Get my own consultant profile details
  async getMyProfile(token) {
    return await apiFetch('/api/consultants/me/profile', {
      method: 'GET'
    }, token);
  },

  // Update my own consultant profile details
  async updateMyProfile(profileData, token) {
    return await apiFetch('/api/consultants/me/profile', {
      method: 'PUT',
      body: profileData
    }, token);
  },

  // Get all my services (including inactive)
  async getMyServices(token) {
    return await apiFetch('/api/consultants/me/services', {
      method: 'GET'
    }, token);
  },

  // Add a new service
  async addService(serviceData, token) {
    return await apiFetch('/api/consultants/me/services', {
      method: 'POST',
      body: serviceData
    }, token);
  },

  // Update a service
  async updateService(serviceId, serviceData, token) {
    return await apiFetch(`/api/consultants/me/services/${serviceId}`, {
      method: 'PUT',
      body: serviceData
    }, token);
  },

  // Toggle a service active/inactive
  async toggleService(serviceId, token) {
    return await apiFetch(`/api/consultants/me/services/${serviceId}/toggle`, {
      method: 'PATCH'
    }, token);
  },

  // Get my weekly availability settings
  async getAvailabilities(token) {
    return await apiFetch('/api/consultants/me/availability', {
      method: 'GET'
    }, token);
  },

  // Save weekly availability settings
  async setAvailability(availabilities, token) {
    return await apiFetch('/api/consultants/me/availability', {
      method: 'PUT',
      body: availabilities
    }, token);
  },

  // Get consultant's clients list
  async getClients(token, page = 1, limit = 20) {
    return await apiFetch(`/api/consultants/me/clients?page=${page}&limit=${limit}`, {
      method: 'GET'
    }, token);
  },

  // Get registered bank account details
  async getBankAccount(token) {
    return await apiFetch('/api/consultants/me/bank-account', {
      method: 'GET'
    }, token);
  },

  // Register or update bank account details
  async saveBankAccount(bankData, token) {
    return await apiFetch('/api/consultants/me/bank-account', {
      method: 'PUT',
      body: bankData
    }, token);
  },

  // Request a new payout withdrawal
  async requestPayout(amount, token) {
    return await apiFetch('/api/consultants/me/payouts', {
      method: 'POST',
      body: { amount }
    }, token);
  }
};

export default consultantService;
