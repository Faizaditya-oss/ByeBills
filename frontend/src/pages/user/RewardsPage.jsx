import React, { useState, useMemo } from 'react';
import {
  Gift,
  Sparkles,
  Award,
  PackageCheck,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getAllShopItems,
  getUserTotalPoints,
  getPointsByUser,
  redeemShopItem,
  getUserItems,
  useItem,
  getUserBadges,
  getAllBadges,
} from '../../services/storage.js';

export default function RewardsPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'inventory' | 'history' | 'badges'
  const [categoryFilter, setCategoryFilter] = useState('semua');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Poin total
  const totalPoints = useMemo(() => {
    if (!userId) return 0;
    return getUserTotalPoints(userId);
  }, [userId, refreshKey]);

  // Riwayat mutasi poin
  const pointHistory = useMemo(() => {
    if (!userId) return [];
    return getPointsByUser(userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userId, refreshKey]);

  // Katalog item toko
  const shopItems = useMemo(() => {
    return getAllShopItems();
  }, [refreshKey]);

  // Filter katalog item
  const filteredShopItems = useMemo(() => {
    if (categoryFilter === 'semua') return shopItems;
    return shopItems.filter((i) => i.category === categoryFilter);
  }, [shopItems, categoryFilter]);

  // Item / Voucher yang dimiliki user
  const userItems = useMemo(() => {
    if (!userId) return [];
    const items = getUserItems(userId);
    return items.sort((a, b) => new Date(b.redeemedAt || b.createdAt) - new Date(a.redeemedAt || a.createdAt));
  }, [userId, refreshKey]);

  // Lencana user vs semua lencana
  const allBadges = useMemo(() => getAllBadges(), []);
  const myBadges = useMemo(() => {
    if (!userId) return [];
    return getUserBadges(userId);
  }, [userId, refreshKey]);

  // Handler tukar reward
  const handleRedeem = (item) => {
    if (!userId) return;
    if (totalPoints < item.pointsCost) {
      setFeedback({
        type: 'error',
        message: `Poin tidak mencukupi! Anda memiliki ${totalPoints} poin, dibutuhkan ${item.pointsCost} poin.`,
      });
      return;
    }

    if (!window.confirm(`Tukarkan ${item.pointsCost} poin untuk mendapatkan "${item.name}"?`)) {
      return;
    }

    const res = redeemShopItem(userId, item.id);
    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setFeedback({
        type: 'success',
        message: `Berhasil menukarkan "${item.name}"! Item sekarang tersedia di tab "Voucher & Item Saya".`,
      });
      setRefreshKey((prev) => prev + 1);
    }
  };

  // Handler gunakan item
  const handleUseItem = (item) => {
    if (!window.confirm(`Gunakan voucher "${item.name || 'Reward'}" sekarang?`)) {
      return;
    }

    const res = useItem(item.id);
    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setFeedback({
        type: 'success',
        message: 'Voucher berhasil digunakan!',
      });
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-2 backdrop-blur-sm">
            <Gift className="w-3.5 h-3.5" />
            Toko Reward & Pencapaian
          </div>
          <h1 className="text-2xl font-bold">Klaim Hadiah & Pantau Poin</h1>
          <p className="text-amber-100 text-sm mt-1 max-w-xl">
            Tukarkan poin yang Anda dapatkan dari mencatat pembayaran tepat waktu, mengunggah bukti aktivitas, dan menyelesaikan modul edukasi.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-xl border border-white/20 text-center min-w-[160px]">
          <span className="text-xs text-amber-100 block font-medium">Saldo Poin Anda</span>
          <span className="text-3xl font-black text-white flex items-center justify-center gap-1 mt-0.5">
            <Sparkles className="w-6 h-6 text-amber-200" />
            {totalPoints}
          </span>
          <span className="text-[11px] text-amber-100/80 block mt-1">Poin Aktif</span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fade-in ${
            feedback.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Navigasi Tab */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Gift className="w-4 h-4" /> Katalog Hadiah ({shopItems.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'inventory'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Voucher Saya ({userItems.length})
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'badges'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" /> Koleksi Lencana ({myBadges.length}/{allBadges.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Riwayat Mutasi Poin ({pointHistory.length})
        </button>
      </div>

      {/* Tab 1: Katalog Hadiah */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filter Kategori */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['semua', 'voucher', 'konsultasi', 'edukasi', 'merchandise'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  categoryFilter === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredShopItems.map((item) => {
              const canAfford = totalPoints >= item.pointsCost;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 uppercase tracking-wide">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        Stok: {item.stock !== null ? item.stock : 'Tersedia'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base">{item.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 font-black text-amber-600 text-lg">
                      <Sparkles className="w-4 h-4" />
                      <span>{item.pointsCost}</span>
                      <span className="text-xs font-normal text-slate-400">poin</span>
                    </div>

                    <button
                      onClick={() => handleRedeem(item)}
                      disabled={!canAfford || (item.stock !== null && item.stock <= 0)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        canAfford && (item.stock === null || item.stock > 0)
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      {canAfford ? 'Tukar Poin' : 'Poin Kurang'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Item / Voucher Saya */}
      {activeTab === 'inventory' && (
        <div>
          {userItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Belum ada item atau voucher yang ditukarkan.</p>
              <p className="text-xs text-slate-400">
                Kumpulkan poin Anda dan tukarkan di Katalog Hadiah.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userItems.map((item) => {
                const isUsed = item.status === 'digunakan';
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Kode: #{item.id}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isUsed
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isUsed ? 'Sudah Digunakan' : 'Siap Digunakan'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-base">{item.name || 'Reward Voucher'}</h4>
                    <p className="text-xs text-slate-500">{item.description}</p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Ditukar: {new Date(item.redeemedAt || item.createdAt).toLocaleDateString('id-ID')}</span>
                      {!isUsed && (
                        <button
                          onClick={() => handleUseItem(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                        >
                          Gunakan Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Koleksi Lencana */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge) => {
            const hasEarned = myBadges.some((mb) => mb.badgeId === badge.id || mb.id === badge.id);
            return (
              <div
                key={badge.id}
                className={`p-5 rounded-xl border transition flex items-start gap-4 ${
                  hasEarned
                    ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    hasEarned
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 text-sm">{badge.name}</h4>
                    {hasEarned && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Kriteria: {badge.criteria || 'Pencapaian sistem'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Riwayat Mutasi Poin */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {pointHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Belum ada catatan mutasi poin.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pointHistory.map((pt) => {
                const isEarned = pt.type === 'earned' || pt.amount > 0;
                return (
                  <div key={pt.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isEarned ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isEarned ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-slate-800">
                          {pt.description || (isEarned ? 'Poin Masuk' : 'Penukaran Reward')}
                        </h5>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(pt.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`text-sm font-black ${
                        isEarned ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isEarned ? `+${Math.abs(pt.amount)}` : `-${Math.abs(pt.amount)}`} poin
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}