import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { refreshAccessTokenSilently } from '../services/api';

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Helpers for persisting tokens STRICTLY via Cookies (No localStorage / No sessionStorage)
// ---------------------------------------------------------------------------
const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
};

const setCookie = (name, value, days = 7) => {
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

const removeCookie = (name) => {
  try {
    document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax`;
  } catch {}
};

// Purge any legacy auth tokens stored in localStorage to obey strict cookie security
const purgeLocalStorageTokens = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refresh_token');
  } catch {}
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    purgeLocalStorageTokens();
    return getCookie('token');
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // always start loading
  const refreshTimerRef = useRef(null);

  // -------------------------------------------------------------------------
  // Clear everything
  // -------------------------------------------------------------------------
  const clearSession = useCallback(() => {
    purgeLocalStorageTokens();
    removeCookie('token');
    removeCookie('refresh_token');
    setToken(null);
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  // -------------------------------------------------------------------------
  // Silently get a new access token using the stored refresh token
  // Returns new access token or null on failure
  // -------------------------------------------------------------------------
  const silentRefresh = useCallback(async () => {
    const newAccess = await refreshAccessTokenSilently();
    if (newAccess) {
      setToken(newAccess);
      return newAccess;
    }
    clearSession();
    return null;
  }, [clearSession]);

  // -------------------------------------------------------------------------
  // Proactive background interval check (runs every 2 minutes)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const checkAndRefresh = async () => {
      const currentToken = getCookie('token');
      const refreshToken = getCookie('refresh_token');
      if (!currentToken || !refreshToken) return;

      try {
        const payloadBase64 = currentToken.split('.')[1];
        if (!payloadBase64) return;
        const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        if (payload.exp) {
          const nowInSec = Math.floor(Date.now() / 1000);
          if (payload.exp - nowInSec < 180) { // Expires in under 3 minutes
            const newAccess = await silentRefresh();
            if (newAccess) setToken(newAccess);
          }
        }
      } catch {}
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [silentRefresh]);

  // -------------------------------------------------------------------------
  // Fetch the current user from backend using an access token
  // -------------------------------------------------------------------------
  const fetchCurrentUser = useCallback(async (authToken) => {
    if (!authToken) { setUser(null); setLoading(false); return null; }

    try {
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setLoading(false);
        return userData;
      }

      // 401 → try silent refresh once
      if (res.status === 401) {
        const newToken = await silentRefresh();
        if (!newToken) { setUser(null); setLoading(false); return null; }

        const res2 = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${newToken}`, 'Accept': 'application/json' }
        });
        if (res2.ok) {
          const userData2 = await res2.json();
          setUser(userData2);
          setLoading(false);
          return userData2;
        }
      }

      // All attempts failed
      clearSession();
      setLoading(false);
      return null;
    } catch {
      clearSession();
      setLoading(false);
      return null;
    }
  }, [silentRefresh, clearSession]);

  // -------------------------------------------------------------------------
  // On startup: restore session from Cookies
  // -------------------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      purgeLocalStorageTokens();
      const storedToken = getCookie('token');
      if (storedToken) {
        await fetchCurrentUser(storedToken);
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, [fetchCurrentUser]);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = async (accessToken, refreshToken) => {
    if (!accessToken) return null;
    purgeLocalStorageTokens();
    setCookie('token', accessToken);
    if (refreshToken) setCookie('refresh_token', refreshToken);
    setToken(accessToken);
    const userData = await fetchCurrentUser(accessToken);
    return userData;
  };

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = async () => {
    const currentToken = getCookie('token');
    const currentRefresh = getCookie('refresh_token');

    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: currentRefresh || '' })
        });
      } catch {}
    }
    clearSession();
  };

  // -------------------------------------------------------------------------
  // Manual refresh user data
  // -------------------------------------------------------------------------
  const refreshUser = () => {
    const t = getCookie('token');
    if (t) return fetchCurrentUser(t);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || null,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
