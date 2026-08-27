import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Helpers for persisting tokens
// ---------------------------------------------------------------------------
const getStored = (key) => { try { return localStorage.getItem(key) || null; } catch { return null; } };
const setStored = (key, val) => { try { localStorage.setItem(key, val); } catch {} };
const removeStored = (key) => { try { localStorage.removeItem(key); } catch {} };

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStored('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // always start loading
  const refreshTimerRef = useRef(null);

  // -------------------------------------------------------------------------
  // Clear everything
  // -------------------------------------------------------------------------
  const clearSession = useCallback(() => {
    removeStored('token');
    removeStored('refresh_token');
    setToken(null);
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  // -------------------------------------------------------------------------
  // Silently get a new access token using the stored refresh token
  // Returns new access token or null on failure
  // -------------------------------------------------------------------------
  const silentRefresh = useCallback(async () => {
    const storedRefresh = getStored('refresh_token');
    if (!storedRefresh) return null;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ refresh_token: storedRefresh })
      });

      if (!res.ok) {
        clearSession();
        return null;
      }

      const data = await res.json();
      const newAccess = data.access_token;
      const newRefresh = data.refresh_token || storedRefresh;

      setStored('token', newAccess);
      setStored('refresh_token', newRefresh);
      setToken(newAccess);
      return newAccess;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  // -------------------------------------------------------------------------
  // Schedule a silent refresh ~2 minutes before token expires (13 min cycle)
  // -------------------------------------------------------------------------
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Access token lives 15 min → refresh after 13 min
    refreshTimerRef.current = setTimeout(async () => {
      const newToken = await silentRefresh();
      if (newToken) scheduleRefresh(); // keep the cycle going
    }, 13 * 60 * 1000);
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
          scheduleRefresh();
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
  }, [silentRefresh, scheduleRefresh, clearSession]);

  // -------------------------------------------------------------------------
  // On startup: restore session from localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStored('token');
      if (storedToken) {
        await fetchCurrentUser(storedToken);
        scheduleRefresh();
      } else {
        setLoading(false);
      }
    };
    initAuth();

    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = async (accessToken, refreshToken) => {
    if (!accessToken) return null;
    setStored('token', accessToken);
    if (refreshToken) setStored('refresh_token', refreshToken);
    setToken(accessToken);
    const userData = await fetchCurrentUser(accessToken);
    if (userData) scheduleRefresh();
    return userData;
  };

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = async () => {
    const currentToken = getStored('token');
    const currentRefresh = getStored('refresh_token');

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
    const t = getStored('token');
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
