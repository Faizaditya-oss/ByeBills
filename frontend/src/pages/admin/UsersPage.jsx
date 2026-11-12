import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAllUsers, updateUser, getUserTotalPoints } from '../../services/storage.js';

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [message, setMessage] = useState('');

  // Ambil data seluruh user
  const users = useMemo(() => {
    return getAllUsers().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [refreshKey]);

  // Filter user
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm));
      const matchRole = roleFilter === 'semua' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && u.isActive) ||
        (statusFilter === 'nonaktif' && !u.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Statistik user
  const totalUserRole = users.filter((u) => u.role === 'user').length;
  const totalAdminRole = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.isActive).length;

  // Toggle status aktif user
  const handleToggleStatus = (u) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak dapat menonaktifkan akun Admin Anda sendiri.');
      return;
    }

    const newStatus = !u.isActive;
    const confirmMsg = newStatus
      ? `Aktifkan kembali akun "${u.name}"?`
      : `Nonaktifkan akun "${u.name}"? Pengguna tidak akan dapat login.`;

    if (!window.confirm(confirmMsg)) return;

    const res = updateUser(u.id, { isActive: newStatus });
    if (res) {
      setMessage(`Status pengguna "${u.name}" berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`);
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Manajemen Pengguna
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Pengguna Sistem</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data akun pengguna dan hak akses aplikasi BUBU.
          </p>
        </div>

        {/* Ringkasan Angka */}
        <div className="flex gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
            <span className="text-[11px] text-slate-500 block uppercase font-bold">Total User</span>
            <span className="text-xl font-bold text-slate-800">{totalUserRole}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
            <span className="text-[11px] text-slate-500 block uppercase font-bold">Admin</span>
            <span className="text-xl font-bold text-indigo-600">{totalAdminRole}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
            <span className="text-[11px] text-slate-500 block uppercase font-bold">Aktif</span>
            <span className="text-xl font-bold text-emerald-600">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Pesan Feedback */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage('')}
            className="text-xs font-semibold text-emerald-600 hover:underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, atau telepon..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Role:
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
          >
            <option value="semua">Semua Role</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500 ml-2">Status:</div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Tabel User */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="p-4">Pengguna</th>
                <th className="p-4">Kontak</th>
                <th className="p-4">Role</th>
                <th className="p-4">Saldo Poin</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Tidak ditemukan data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const points = getUserTotalPoints(u.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(u.createdAt).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'konselor'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-600 text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{points} pts</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3" /> Aktif
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" /> Nonaktif
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.id === currentUser?.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            u.id === currentUser?.id
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : u.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}