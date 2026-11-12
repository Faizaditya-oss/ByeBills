import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Sparkles,
  CreditCard,
  FolderKanban,
  Receipt,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  updateUser,
  getCasesByUser,
  getLoansByUser,
  getPaymentsByUser,
  getUserTotalPoints,
} from '../../services/storage.js';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const userId = currentUser?.id;

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Statistik akun user
  const userCases = userId ? getCasesByUser(userId) : [];
  const userLoans = userId ? getLoansByUser(userId) : [];
  const userPayments = userId ? getPaymentsByUser(userId) : [];
  const userPoints = userId ? getUserTotalPoints(userId) : 0;

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!userId) return;

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Nama lengkap tidak boleh kosong.' });
      return;
    }

    setIsSaving(true);
    try {
      const updated = updateUser(userId, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      if (updated) {
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      } else {
        setMessage({ type: 'error', text: 'Gagal memperbarui profil di penyimpanan.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-black shrink-0 border-4 border-emerald-50 shadow-inner">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{currentUser?.name}</h1>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 self-center md:self-auto">
              {currentUser?.role || 'user'}
            </span>
          </div>
          <p className="text-sm text-slate-500">{currentUser?.email}</p>
          <div className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1 pt-1">
            <Calendar className="w-3.5 h-3.5" />
            Bergabung sejak:{' '}
            {currentUser?.createdAt
              ? new Date(currentUser.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })
              : 'November 2026'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={logout}
            className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold transition flex items-center gap-2 justify-center"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sesi
          </button>
        </div>
      </div>

      {/* Ringkasan Statistik Singkat */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Total Poin</span>
            <span className="text-lg font-bold text-slate-800">{userPoints}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Pinjaman</span>
            <span className="text-lg font-bold text-slate-800">{userLoans.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Pembayaran</span>
            <span className="text-lg font-bold text-slate-800">{userPayments.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Aduan CS</span>
            <span className="text-lg font-bold text-slate-800">{userCases.length}</span>
          </div>
        </div>
      </div>

      {/* Form Ubah Profil */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Informasi Pribadi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui data diri Anda untuk keperluan pencatatan dan verifikasi data.
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
              message.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Email Akun (Permanen)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Alamat email digunakan sebagai ID login unik.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="Masukkan nama lengkap"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Nomor WhatsApp / Telepon
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}