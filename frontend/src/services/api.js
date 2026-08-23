/**
 * Centralized API service helper with Bearer token authentication
 */
export const apiFetch = async (url, options = {}, token = null) => {
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is an object (and not FormData), stringify to JSON
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || 'حدث خطأ في الطلب';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return response.json().catch(() => ({}));
};
