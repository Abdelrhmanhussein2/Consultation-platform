/**
 * Centralized API service helper with Bearer token authentication and 401 Silent Refresh Interceptor
 * Strictly uses Cookies (document.cookie) for token storage.
 */
const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
};

const setCookie = (name, value, days = null) => {
  try {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = `${name}=${encodeURIComponent(value || '')}${expires}; path=/; SameSite=Lax`;
  } catch {}
};

const isTokenExpiringSoon = (tokenStr) => {
  if (!tokenStr) return true;
  try {
    const payloadBase64 = tokenStr.split('.')[1];
    if (!payloadBase64) return false;
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    if (!payload.exp) return false;
    const nowInSec = Math.floor(Date.now() / 1000);
    return (payload.exp - nowInSec) < 120; // Expiring in under 2 minutes
  } catch {
    return false;
  }
};

let isRefreshingPromise = null;

export const refreshAccessTokenSilently = async () => {
  if (isRefreshingPromise) {
    return isRefreshingPromise;
  }

  isRefreshingPromise = (async () => {
    const refreshToken = getCookie('refresh_token');
    if (!refreshToken) return null;

    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newAccess = refreshData.access_token;
        const newRefresh = refreshData.refresh_token || refreshToken;
        setCookie('token', newAccess);
        setCookie('refresh_token', newRefresh);
        return newAccess;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshingPromise = null;
    }
  })();

  return isRefreshingPromise;
};

export const apiFetch = async (url, options = {}, token = null) => {
  let currentToken = token || getCookie('token');

  // Proactive Refresh: If token expires within 2 minutes, refresh BEFORE sending request
  if (currentToken && isTokenExpiringSoon(currentToken) && !url.includes('/api/auth/')) {
    const freshToken = await refreshAccessTokenSilently();
    if (freshToken) {
      currentToken = freshToken;
    }
  }

  const buildHeaders = (authToken) => {
    const h = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };
    if (authToken) {
      h['Authorization'] = `Bearer ${authToken}`;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      h['Content-Type'] = 'application/json';
    }
    return h;
  };

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  let response = await fetch(url, { ...options, headers: buildHeaders(currentToken), body });

  // 401 Interceptor: Try silent token refresh once if unauthorized (using mutex lock)
  if (response.status === 401 && !url.includes('/api/auth/')) {
    const newAccess = await refreshAccessTokenSilently();
    if (newAccess) {
      response = await fetch(url, { ...options, headers: buildHeaders(newAccess), body });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || 'حدث خطأ في الطلب';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return response.json().catch(() => ({}));
};
