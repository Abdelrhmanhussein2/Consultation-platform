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
  }
};

export default consultantService;
