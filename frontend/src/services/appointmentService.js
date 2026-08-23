import { apiFetch } from './api';

export const appointmentService = {
  // Book an appointment
  async bookAppointment(data, token) {
    return await apiFetch('/api/appointments/', {
      method: 'POST',
      body: JSON.stringify(data)
    }, token);
  },

  // Pay for an appointment
  async payAppointment(id, token, method = 'card') {
    return await apiFetch(`/api/appointments/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: method })
    }, token);
  },

  // Get my appointments (client history)
  async getMyAppointments(token) {
    return await apiFetch('/api/appointments/my', {
      method: 'GET'
    }, token);
  },

  // Cancel appointment
  async cancelAppointment(id, reason, token) {
    return await apiFetch(`/api/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }, token);
  },

  // Rate completed appointment
  async rateAppointment(id, rating, feedback, token) {
    return await apiFetch(`/api/appointments/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback })
    }, token);
  },

  // Join video meeting room token
  async joinVideoSession(appointmentId, token) {
    return await apiFetch(`/api/sessions/${appointmentId}/join`, {
      method: 'POST'
    }, token);
  }
};

export default appointmentService;
