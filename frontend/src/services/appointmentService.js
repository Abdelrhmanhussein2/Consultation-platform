import { apiFetch } from './api';

export const appointmentService = {
  // Book an appointment
  async bookAppointment(data, token) {
    return await apiFetch('/api/appointments/', {
      method: 'POST',
      body: data
    }, token);
  },

  // Pay for an appointment
  async payAppointment(id, token, method = 'card') {
    return await apiFetch(`/api/appointments/${id}/pay`, {
      method: 'POST',
      body: { payment_method: method }
    }, token);
  },

  // Get my appointments (client history)
  async getMyAppointments(token) {
    return await apiFetch('/api/appointments/my', {
      method: 'GET'
    }, token);
  },

  // Get all platform appointments (admin / calendar overview)
  async getAllAppointments(token, limit = 200) {
    return await apiFetch(`/api/appointments/all?limit=${limit}`, {
      method: 'GET'
    }, token);
  },

  // Cancel appointment
  async cancelAppointment(id, reason, token) {
    return await apiFetch(`/api/appointments/${id}/cancel`, {
      method: 'POST',
      body: { reason }
    }, token);
  },

  // Rate completed appointment or consultant no-show
  async rateAppointment(id, data, token) {
    let payload = {};
    if (typeof data === 'object' && data !== null) {
      payload = {
        stars: Number(data.stars || data.rating || 5),
        comment: data.comment || data.feedback || '',
        low_rating_reason: data.low_rating_reason || ((Number(data.stars || data.rating) < 2) ? (data.comment || data.feedback || 'المستشار لم يحضر الجلسة في الموعد المحدد') : undefined)
      };
    } else {
      const starsNum = Number(data || 5);
      payload = {
        stars: starsNum,
        comment: '',
        low_rating_reason: starsNum < 2 ? 'المستشار لم يحضر الجلسة في الموعد المحدد' : undefined
      };
    }
    return await apiFetch(`/api/appointments/${id}/rate`, {
      method: 'POST',
      body: payload
    }, token);
  },

  // Reschedule an appointment
  async rescheduleAppointment(id, data, token) {
    return await apiFetch(`/api/appointments/${id}/reschedule`, {
      method: 'POST',
      body: data
    }, token);
  },

  // Join video meeting room token
  async joinVideoSession(appointmentId, token) {
    return await apiFetch(`/api/sessions/${appointmentId}/join`, {
      method: 'POST'
    }, token);
  },

  // Consultant explicitly opens the video meeting room
  async openVideoSession(appointmentId, token) {
    return await apiFetch(`/api/sessions/${appointmentId}/open`, {
      method: 'POST'
    }, token);
  },

  // Get live session attendance info (who entered, who is absent, no-show status)
  async getSessionAttendance(appointmentId, token) {
    return await apiFetch(`/api/sessions/${appointmentId}/attendance`, {
      method: 'GET'
    }, token);
  },

  // Confirm and mark no-show
  async markNoShow(appointmentId, token) {
    return await apiFetch(`/api/sessions/${appointmentId}/mark-no-show`, {
      method: 'POST'
    }, token);
  }
};

export default appointmentService;
