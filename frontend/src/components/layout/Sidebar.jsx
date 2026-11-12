import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getNavigationForRole } from '../../config/navigation.js';

export default function Sidebar({ onItemClick }) {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getNavigationForRole(role);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'user':
      default:
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
    }
  };

  const getRoleLabel = (r) => {
    switch (r) {
      case 'admin':
        return 'Admin';
      case 'user':
      default:
        return 'User';
    }
  };

  return (
    <aside className="w-64 bg-[#0B1528] text-slate-300 flex flex-col h-full border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
        <Link
          to={role === 'admin' ? '/admin' : '/dashboard'}
          className="flex items-center gap-2.5 group"
          onClick={onItemClick}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-wide">BUBU</span>
            <span className="text-[10px] text-blue-400 block -mt-0.5 font-medium tracking-wider">
              FINTECH CARE
            </span>
          </div>
        </Link>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 font-mono border border-slate-700/50">
          v2.0
        </span>
      </div>

      {/* Navigasi Menu Sesuai Role */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu {getRoleLabel(role)}
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard' || item.path === '/admin' || item.path === '/konselor'}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#091122]">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Pengguna'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-medium uppercase tracking-wider ${getRoleBadgeStyle(
                    role
                  )}`}
                >
                  {getRoleLabel(role)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-900/30 hover:border-rose-500/30 transition flex items-center justify-center gap-2 font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
