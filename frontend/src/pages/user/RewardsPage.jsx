import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Award,
  Clock,
  History,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getUserTotalPoints,
  getPointsByUser,
  getUserBadges,
  getAllBadges,
} from '../../services/storage.js';

export default function RewardsPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'badges'
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'earned' | 'redeemed'

  // Saldo total poin aktif
  const totalPoints = useMemo(() => {
    if (!userId) return 0;
    return getUserTotalPoints(userId);
  }, [userId]);

  // Riwayat mutasi dan penukaran poin
  const pointHistory = useMemo(() => {
    if (!userId) return [];
    const list = getPointsByUser(userId).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (historyFilter === 'earned') {
      return list.filter((p) => p.type === 'earned' || p.amount > 0);
    }
    if (historyFilter === 'redeemed') {
      return list.filter((p) => p.type === 'redeemed' || p.amount < 0);
    }
    return list;
  }, [userId, historyFilter]);

  // Koleksi lencana
  const allBadges = useMemo(() => getAllBadges(), []);
  const myBadges = useMemo(() => {
    if (!userId) return [];
    return getUserBadges(userId);
  }, [userId]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── HEADER BANNER SALDO POIN & INFO AKSESORI ─────────────────────── */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Poin &amp; Pencapaian Finansial
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Penukaran &amp; Mutasi Poin</h1>
          <p className="text-amber-100 text-sm max-w-xl leading-relaxed">
            Poin Anda kini dapat digunakan langsung untuk menukar berbagai aksesori karakter maskot BUBU di halaman Profil.
          </p>
          <div className="pt-1">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-amber-800 hover:bg-amber-50 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Gunakan Poin untuk Aksesori Karakter &rarr;</span>
            </Link>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/20 text-center min-w-[170px] shrink-0 self-stretch md:self-auto flex flex-col justify-center">
          <span className="text-xs text-amber-100 font-medium">Saldo Poin Aktif</span>
          <span className="text-3xl font-black text-white flex items-center justify-center gap-1.5 mt-1">
            <Sparkles className="w-6 h-6 text-amber-200" />
            {totalPoints}
          </span>
          <span className="text-[11px] text-amber-100/80 block mt-1">Tersedia Digunakan</span>
        </div>
      </div>

      {/* ─── NAVIGASI TAB ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Mutasi &amp; Penukaran Poin ({pointHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'badges'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Koleksi Lencana ({myBadges.length}/{allBadges.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: RIWAYAT PENUKARAN & MUTASI POIN ───────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Jenis Mutasi */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {[
              { id: 'all', label: 'Semua Transaksi' },
              { id: 'earned', label: 'Poin Masuk (+)' },
              { id: 'redeemed', label: 'Penukaran Aksesori (-)' },
            ].map((flt) => (
              <button
                key={flt.id}
                type="button"
                onClick={() => setHistoryFilter(flt.id)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  historyFilter === flt.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>

          {/* List Riwayat */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {pointHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm space-y-1">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Belum Ada Catatan Mutasi Poin</p>
                <p className="text-xs">
                  Selesaikan pembayaran cicilan tepat waktu atau modul edukasi untuk mendapatkan poin.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pointHistory.map((pt) => {
                  const isEarned = pt.type === 'earned' || pt.amount > 0;
                  return (
                    <div
                      key={pt.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isEarned
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}
                        >
                          {isEarned ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-800">
                            {pt.description ||
                              (isEarned ? 'Perolehan Poin Aktivitas' : 'Penukaran Poin Aksesori')}
                          </h5>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(pt.createdAt).toLocaleString('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                            {pt.source && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                                {pt.source}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`text-base font-black whitespace-nowrap ${
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
        </div>
      )}

      {/* ─── TAB 2: KOLEKSI LENCANA & PENCAPAIAN ───────────────────────────── */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge) => {
            const hasEarned = myBadges.some((mb) => mb.badgeId === badge.id);
            return (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition flex items-start gap-4 ${
                  hasEarned
                    ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    hasEarned
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 text-sm">{badge.name}</h4>
                    {hasEarned && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{badge.description}</p>
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">
                    Kriteria: {badge.criteria || 'Pencapaian sistem'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
