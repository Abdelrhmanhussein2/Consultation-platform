import { apiFetch } from './api';

export const chatAiService = {
  /**
   * Generates AI reply for an appointment chat using Groq LLM backend
   */
  async generateReply(params) {
    const res = await apiFetch('/api/chat/ai/generate-reply', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'فشل توليد الرد بالذكاء الاصطناعي');
    }
    return await res.json();
  },

  /**
   * Directly asks the AI tax advisor a question
   */
  async directAsk(question, context = null) {
    const res = await apiFetch('/api/chat/ai/direct-ask', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'فشل استدعاء المستشار الذكي');
    }
    return await res.json();
  }
};

