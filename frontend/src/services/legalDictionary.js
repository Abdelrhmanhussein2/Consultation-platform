// frontend/src/services/legalDictionary.js
// Legal dictionary & semantic suggestion service
// Calls backend GET /api/legal/terms/suggest.
// Enforces fail-closed: NEVER returns mock or stub data.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch legislative term suggestions from the verified backend.
 * Returns: { matched: boolean, options: Array }
 * Throws on network/server errors to allow the UI to handle unavailable state.
 */
export async function getLegalSuggestionAsync(userQuery) {
  if (!userQuery || !userQuery.trim()) {
    return { matched: false, options: [] };
  }

  const url = `${API_BASE}/api/legal/terms/suggest?q=${encodeURIComponent(userQuery.trim())}&limit=5`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData.detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return await res.json();
}
