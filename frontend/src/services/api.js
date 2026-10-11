// Token keys that must NEVER be written to localStorage
const TOKEN_KEYS = ['token', 'refresh_token', 'admin_token'];

const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
  } catch {}
  if (!TOKEN_KEYS.includes(name)) {
    try { return localStorage.getItem(name) || sessionStorage.getItem(name) || null; } catch {}
  }
  return null;
};

const setCookie = (name, value, days = null) => {
  try {
    let expires = '';
    if (days && !TOKEN_KEYS.includes(name)) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    // Token cookies: Session Cookie only (no expires → deleted on browser close)
    document.cookie = `${name}=${encodeURIComponent(value || '')}${expires}; path=/; SameSite=Lax`;
  } catch {}
  if (!TOKEN_KEYS.includes(name)) {
    try {
      if (value) {
        localStorage.setItem(name, value);
      } else {
        localStorage.removeItem(name);
      }
    } catch {}
  }
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

// ---------------------------------------------------------------------------
// Singleton Refresh Mutex
// ---------------------------------------------------------------------------
// Only ONE refresh request runs at a time. ALL callers share the SAME promise
// until it resolves. The promise is cleared ONLY after a small delay to avoid
// a race where a second caller sees null right as the first is resolving.
//
// Additionally: if the server returns 429 (rate-limited), we impose a cooldown
// so we don't keep hammering the endpoint and making the situation worse.
// ---------------------------------------------------------------------------

let _refreshPromise = null;           // Shared in-flight promise
let _refreshCooldownUntil = 0;        // Timestamp: don't retry before this time
const REFRESH_COOLDOWN_MS = 10_000;   // 10 seconds cooldown after a 429

export const refreshAccessTokenSilently = () => {
  // If we're still in cooldown from a previous 429, return null immediately
  if (Date.now() < _refreshCooldownUntil) {
    return Promise.resolve(null);
  }

  // If a refresh is already in flight, ALL callers share the same promise
  if (_refreshPromise) {
    return _refreshPromise;
  }

  _refreshPromise = (async () => {
    const refreshToken = getCookie('refresh_token');
    if (!refreshToken) {
      _refreshPromise = null;
      return null;
    }

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

      // 429: Rate limited → impose cooldown so we stop hammering the server
      if (refreshRes.status === 429) {
        _refreshCooldownUntil = Date.now() + REFRESH_COOLDOWN_MS;
        console.warn('[Auth] Refresh rate-limited (429). Waiting 10s before retrying.');
      }

      return null;
    } catch {
      return null;
    } finally {
      // Clear the shared promise so the NEXT refresh cycle can start fresh.
      // Small delay to handle any micro-race between concurrent callers.
      setTimeout(() => { _refreshPromise = null; }, 100);
    }
  })();

  return _refreshPromise;
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
    if (options.body && !(options.body instanceof FormData) && !h['Content-Type']) {
      h['Content-Type'] = 'application/json';
    }
    return h;
  };

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  let response = await fetch(url, { ...options, headers: buildHeaders(currentToken), body });

  // 401 Interceptor: Try silent token refresh once if unauthorized
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
