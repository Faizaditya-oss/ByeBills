import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth.js';
import { initializeStorage } from '../services/storage.js';

const AuthContext = createContext(null);

/**
 * Provider untuk state autentikasi global aplikasi BUBU.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Periksa sesi saat pertama kali aplikasi dimuat / refresh
  useEffect(() => {
    try {
      initializeStorage();
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('[AuthContext] Gagal memeriksa sesi pengguna:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login pengguna menggunakan email dan password.
   * Memperbarui currentUser jika berhasil.
   */
  const login = useCallback((email, password) => {
    const result = authService.login(email, password);
    if (result && result.user) {
      setCurrentUser(result.user);
    }
    return result;
  }, []);

  /**
   * Logout pengguna, membersihkan sesi di localStorage dan state global.
   */
  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  /**
   * Registrasi akun pengguna baru (role default: 'user').
   */
  const register = useCallback(({ name, email, password, phone = '' }) => {
    return authService.register({ name, email, password, phone });
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    login,
    logout,
    register,
    role: currentUser?.role || null,
    getRoleDashboardPath: authService.getRoleDashboardPath,
    hasRole: useCallback(
      (...roles) => {
        return Boolean(
          currentUser?.role &&
          authService.ACTIVE_ROLES.includes(currentUser.role) &&
          roles.includes(currentUser.role)
        );
      },
      [currentUser?.role]
    ),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook kustom untuk mengakses AuthContext.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}

export default AuthContext;
