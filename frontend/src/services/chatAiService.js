import { apiFetch } from './api';

export const chatAiService = {
  /**
   * Generates AI reply for an appointment chat using Groq LLM backend
   */
  async generateReply(params) {
    return await apiFetch('/api/chat/ai/generate-reply', {
      method: 'POST',
      body: params,
    });
  },

  /**
   * Directly asks the AI tax advisor a question
   */
  async directAsk(question, context = null) {
    return await apiFetch('/api/chat/ai/direct-ask', {
      method: 'POST',
      body: { question, context },
    });
  },

  /**
   * AI Assistant Chat Sessions Endpoints
   */
  async listSessions(skip = 0, limit = 50) {
    return await apiFetch(`/api/ai-assistant/sessions?skip=${skip}&limit=${limit}`);
  },

  async getSession(sessionId) {
    return await apiFetch(`/api/ai-assistant/sessions/${sessionId}`);
  },

  async createSession(title = null) {
    return await apiFetch('/api/ai-assistant/sessions', {
      method: 'POST',
      body: title ? { title } : {},
    });
  },

  async updateSession(sessionId, { title, is_pinned }) {
    return await apiFetch(`/api/ai-assistant/sessions/${sessionId}`, {
      method: 'PATCH',
      body: { title, is_pinned },
    });
  },

  async togglePinSession(sessionId) {
    return await apiFetch(`/api/ai-assistant/sessions/${sessionId}/pin`, {
      method: 'POST',
    });
  },

  async deleteSession(sessionId) {
    return await apiFetch(`/api/ai-assistant/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  async sendMessage(sessionId, message) {
    return await apiFetch(`/api/ai-assistant/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: { message },
    });
  },
};
