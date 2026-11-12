import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Topbar({ onToggleMobile }) {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeClasses = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'user':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'admin':
        return 'Admin';
      case 'user':
      default:
        return 'User';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Kiri: Hamburger Mobile + Identitas Konteks */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Buka navigasi menu"
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            Sistem Aktif &bull; Portal
          </span>
          <span className="text-xs font-semibold text-slate-700 sm:font-bold">
            {getRoleDisplayName(role)} ByeBills
          </span>
        </div>
      </div>

      {/* Kanan: Badge Role, Info Pengguna, dan Tombol Logout */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Badge Role */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClasses(
            role
          )}`}
        >
          <Shield className="w-3 h-3" />
          {getRoleDisplayName(role)}
        </span>

        {/* Info Pengguna */}
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 md:pl-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser?.name || 'Pengguna'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {currentUser?.email || ''}
            </p>
          </div>
        </div>

        {/* Tombol Logout Topbar */}
        <button
          type="button"
          onClick={handleLogout}
          title="Keluar dari akun"
          aria-label="Keluar"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
