import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { refreshAccessTokenSilently } from '../services/api';

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Helpers for persisting tokens with Cookies & LocalStorage multi-layer fallback
// ---------------------------------------------------------------------------
const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
  } catch {}
  try {
    return localStorage.getItem(name) || sessionStorage.getItem(name) || null;
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
  try {
    if (value) {
      localStorage.setItem(name, value);
    } else {
      localStorage.removeItem(name);
    }
  } catch {}
};

const removeCookie = (name) => {
  try {
    document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax`;
  } catch {}
  try {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  } catch {}
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getCookie('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // -------------------------------------------------------------------------
  // Clear everything
  // -------------------------------------------------------------------------
  const clearSession = useCallback(() => {
    removeCookie('token');
    removeCookie('refresh_token');
    removeCookie('admin_token');
    setToken(null);
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  // -------------------------------------------------------------------------
  // Silently get a new access token using the stored refresh token
  // -------------------------------------------------------------------------
  const silentRefresh = useCallback(async () => {
    const newAccess = await refreshAccessTokenSilently();
    if (newAccess) {
      setToken(newAccess);
      setCookie('token', newAccess);
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
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

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
        if (!newToken) {
          setUser(null);
          setLoading(false);
          return null;
        }

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
  // On startup: restore session
  // -------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = getCookie('token');
      if (storedToken) {
        await fetchCurrentUser(storedToken);
      }
      if (isMounted) setLoading(false);
    };

    initAuth();

    // Absolute safety timeout: never remain loading for more than 1.2s
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [fetchCurrentUser]);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = async (accessToken, refreshToken) => {
    if (!accessToken) return null;
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
    window.location.href = '/login';
  };

  // -------------------------------------------------------------------------
  // Force update user in state (e.g. after profile edit)
  // -------------------------------------------------------------------------
  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  const refreshUser = useCallback(async () => {
    const currentToken = getCookie('token');
    if (currentToken) {
      await fetchCurrentUser(currentToken);
    }
  }, [fetchCurrentUser]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
