import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getRoleDashboardPath } from '../services/auth.js';

/**
 * Komponen pelindung rute berdasarkan status autentikasi dan role pengguna.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Komponen anak jika digunakan sebagai wrapper elemen
 * @param {string[]} [props.allowedRoles] - Daftar role yang diperbolehkan mengakses rute
 * @param {string} [props.redirectTo='/login'] - Lokasi redirect jika pengguna belum terautentikasi
 * @param {string} [props.unauthorizedRedirect] - Lokasi redirect jika role tidak memenuhi syarat (default ke dashboard role pengguna)
 * @param {React.ReactNode} [props.fallbackLoading] - Komponen pemuatan kustom saat sesi diverifikasi
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
  unauthorizedRedirect,
  fallbackLoading = null,
}) {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return fallbackLoading || (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-500 text-sm">
        Memverifikasi sesi...
      </div>
    );
  }

  // Pengguna belum login: arahkan ke halaman login dan simpan target rute di location.state
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Pengguna sudah login, namun rolenya tidak diizinkan mengakses rute ini
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      const fallback = unauthorizedRedirect || getRoleDashboardPath(userRole);
      return <Navigate to={fallback} replace />;
    }
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
