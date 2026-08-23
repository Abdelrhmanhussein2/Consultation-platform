import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Strictly clear localStorage and sessionStorage on app startup (No token storage in browser storage)
  useEffect(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore
    }
  }, []);

  // Fetch verified user object strictly from backend DB using the token
  const fetchCurrentUser = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setLoading(false);
        return userData;
      } else {
        setToken(null);
        setUser(null);
        setLoading(false);
        return null;
      }
    } catch (err) {
      console.error('Failed to fetch user identity from backend DB:', err);
      setToken(null);
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  // Handle successful login (in-memory token state only)
  const login = async (accessToken) => {
    if (!accessToken) return;
    setToken(accessToken);
    return await fetchCurrentUser(accessToken);
  };

  // Handle logout
  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        // Ignore logout network errors
      }
    }
    setToken(null);
    setUser(null);
  };

  // Manual refresh user data
  const refreshUser = () => {
    if (token) {
      return fetchCurrentUser(token);
    }
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
