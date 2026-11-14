import React, { useState, useMemo } from 'react';
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
  ShoppingBag,
  Tag,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  updateUser,
  getCasesByUser,
  getLoansByUser,
  getPaymentsByUser,
  getUserTotalPoints,
  getUserAvatarConfig,
  equipAccessory,
  purchaseAccessory,
} from '../../services/storage.js';
import { ACCESSORY_CATALOG } from '../../data/characterAccessories.js';
import BubuCharacter from '../../components/BubuCharacter.jsx';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const userId = currentUser?.id;

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  // State Kustomisasi Karakter & Aksesori
  const [avatarRefresh, setAvatarRefresh] = useState(0);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState('all');
  const [accFeedback, setAccFeedback] = useState({ type: '', text: '' });

  const avatarConfig = useMemo(() => {
    return userId ? getUserAvatarConfig(userId) : { equippedAccessories: [], unlockedAccessories: [] };
  }, [userId, avatarRefresh]);

  const userPoints = useMemo(() => {
    return userId ? getUserTotalPoints(userId) : 0;
  }, [userId, avatarRefresh]);

  // Statistik akun user
  const userCases = userId ? getCasesByUser(userId) : [];
  const userLoans = userId ? getLoansByUser(userId) : [];
  const userPayments = userId ? getPaymentsByUser(userId) : [];

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

  const handleToggleEquip = (accId) => {
    if (!userId) return;
    const res = equipAccessory(userId, accId);
    if (res.error) {
      setAccFeedback({ type: 'error', text: res.error });
    } else {
      setAvatarRefresh((k) => k + 1);
      const isNowEquipped = res.equippedAccessories?.includes(accId);
      setAccFeedback({
        type: 'success',
        text: isNowEquipped ? 'Aksesori berhasil dipasang pada karakter!' : 'Aksesori dilepas.',
      });
      setTimeout(() => setAccFeedback({ type: '', text: '' }), 3000);
    }
  };

  const handlePurchaseAccessory = (acc) => {
    if (!userId) return;
    if (userPoints < acc.pointsCost) {
      setAccFeedback({
        type: 'error',
        text: `Poin tidak mencukupi. Dibutuhkan ${acc.pointsCost} poin, saldo Anda ${userPoints} poin.`,
      });
      return;
    }

    const res = purchaseAccessory(userId, acc.id);
    if (res.error) {
      setAccFeedback({ type: 'error', text: res.error });
    } else {
      setAvatarRefresh((k) => k + 1);
      setAccFeedback({
        type: 'success',
        text: `Berhasil membuka "${acc.name}"! Aksesori langsung dipasang ke karakter Anda.`,
      });
      setTimeout(() => setAccFeedback({ type: '', text: '' }), 4000);
    }
  };

  const handleUnequipAll = () => {
    if (!userId) return;
    const updated = updateUser(userId, { equippedAccessories: [] });
    if (updated) {
      setAvatarRefresh((k) => k + 1);
      setAccFeedback({ type: 'success', text: 'Semua aksesori telah dilepas.' });
      setTimeout(() => setAccFeedback({ type: '', text: '' }), 3000);
    }
  };

  const filteredCatalog = useMemo(() => {
    if (selectedSlotFilter === 'all') return ACCESSORY_CATALOG;
    return ACCESSORY_CATALOG.filter((item) => item.slot === selectedSlotFilter);
  }, [selectedSlotFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ─── HEADER PROFILE CARD DENGAN KARAKTER BUBU ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        {/* Karakter Avatar Maskot BUBU */}
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-b from-emerald-50 via-teal-50 to-emerald-100/60 p-2 border-2 border-emerald-200 shadow-inner flex items-center justify-center shrink-0 relative group">
          <BubuCharacter equippedAccessories={avatarConfig.equippedAccessories} size="md" />
          <div className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
            ByeBills
          </div>
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
            className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold transition flex items-center gap-2 justify-center cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sesi
          </button>
        </div>
      </div>

      {/* ─── RINGKASAN STATISTIK SINGKAT ───────────────────────────────────── */}
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

      {/* ─── FITUR KARAKTER & LEMARI AKSESORI (BERBASIS POIN) ────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Sistem Kustomisasi Avatar
            </div>
            <h2 className="text-lg font-bold text-slate-800">Karakter &amp; Lemari Aksesori ByeBills</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan poin penghargaan Anda untuk membuka aksesori dan personalisasi maskot profil Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <div className="text-left">
              <span className="text-[10px] text-amber-700 block font-medium leading-none">Saldo Poin</span>
              <span className="text-sm font-extrabold text-amber-900 leading-none">{userPoints} Poin</span>
            </div>
          </div>
        </div>

        {/* Feedback Notifikasi Aksesori */}
        {accFeedback.text && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 transition ${
              accFeedback.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {accFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{accFeedback.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Showcase Karakter Interaktif (Preview Stage) */}
          <div className="lg:col-span-4 bg-gradient-to-b from-slate-50 to-emerald-50/50 rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center text-center space-y-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Pratinjau Karakter Anda
            </span>

            <div className="w-44 h-44 rounded-full bg-white p-3 border-4 border-emerald-100 shadow-sm flex items-center justify-center relative">
              <BubuCharacter equippedAccessories={avatarConfig.equippedAccessories} size="xl" />
            </div>

            <div className="w-full space-y-2 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Aksesori Terpasang:</span>
                <span className="font-bold text-emerald-700">
                  {avatarConfig.equippedAccessories.length} item
                </span>
              </div>

              {avatarConfig.equippedAccessories.length > 0 && (
                <button
                  type="button"
                  onClick={handleUnequipAll}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-white text-slate-600 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Lepas Semua Aksesori
                </button>
              )}
            </div>
          </div>

          {/* Katalog & Lemari Aksesori */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Slot Aksesori */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: 'Semua Aksesori' },
                { id: 'hat', label: 'Topi & Mahkota' },
                { id: 'glasses', label: 'Kacamata' },
                { id: 'ears', label: 'Audio / Headphone' },
                { id: 'neck', label: 'Syal & Dasi' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSlotFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    selectedSlotFilter === tab.id
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grid Aksesori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredCatalog.map((item) => {
                const isUnlocked = avatarConfig.unlockedAccessories?.includes(item.id);
                const isEquipped = avatarConfig.equippedAccessories?.includes(item.id);
                const canAfford = userPoints >= item.pointsCost;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 transition flex flex-col justify-between space-y-3 ${
                      isEquipped
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                        : isUnlocked
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.tag}
                        </span>
                        <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {item.pointsCost} Poin
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 leading-tight">{item.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                    </div>

                    {/* Tombol Aksi Beli / Pasang / Lepas */}
                    <div className="pt-2 border-t border-slate-100">
                      {isEquipped ? (
                        <button
                          type="button"
                          onClick={() => handleToggleEquip(item.id)}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Terpasang (Klik utk Lepas)</span>
                        </button>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleToggleEquip(item.id)}
                          className="w-full py-1.5 px-3 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Gunakan Aksesori</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePurchaseAccessory(item)}
                          disabled={!canAfford}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{canAfford ? `Buka (${item.pointsCost} Poin)` : 'Poin Kurang'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FORM UBAH INFORMASI PRIBADI ────────────────────────────────────── */}
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
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