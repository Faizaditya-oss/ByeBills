import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Flame,
  CreditCard,
  Receipt,
  FolderKanban,
  BookOpen,
  MessageSquareHeart,
  Gift,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getUserStats,
  getUserTotalPoints,
  getStreakByUser,
  getCasesByUser,
  getLoansByUser,
  getPaymentsByUser,
  getProgressByUser,
  getNotificationsByUser,
} from '../../services/storage.js';
import { getAllEducationModules } from '../../data/modules/index.js';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  // ─── AMBIL DATA ASLI DARI STORAGE ──────────────────────────────────────────
  const stats = useMemo(() => (userId ? getUserStats(userId) : null), [userId]);
  const userPoints = useMemo(() => (userId ? getUserTotalPoints(userId) : 0), [userId]);
  const streak = useMemo(() => (userId ? getStreakByUser(userId) : null), [userId]);
  const cases = useMemo(() => (userId ? getCasesByUser(userId) : []), [userId]);
  const loans = useMemo(() => (userId ? getLoansByUser(userId) : []), [userId]);
  const payments = useMemo(() => (userId ? getPaymentsByUser(userId) : []), [userId]);
  const progressList = useMemo(() => (userId ? getProgressByUser(userId) : []), [userId]);
  const notifications = useMemo(() => (userId ? getNotificationsByUser(userId) : []), [userId]);
  const allModules = useMemo(() => getAllEducationModules(), []);

  // ─── PERHITUNGAN RINGKASAN DATA ────────────────────────────────────────────
  // 1. Kasus berdasarkan status
  const caseSummary = useMemo(() => {
    const baru = cases.filter((c) => c.status === 'baru').length;
    const diproses = cases.filter((c) => c.status === 'diproses').length;
    const selesai = cases.filter((c) => c.status === 'selesai' || c.status === 'ditutup').length;
    return { baru, diproses, selesai, total: cases.length };
  }, [cases]);

  // 2. Pembayaran berdasarkan status
  const paymentSummary = useMemo(() => {
    const terverifikasi = payments.filter((p) => p.status === 'terverifikasi');
    const menunggu = payments.filter((p) => p.status === 'menunggu_verifikasi');
    const ditolak = payments.filter((p) => p.status === 'ditolak');
    const totalVerifiedAmount = terverifikasi.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      terverifikasiCount: terverifikasi.length,
      menungguCount: menunggu.length,
      ditolakCount: ditolak.length,
      totalVerifiedAmount,
      totalCount: payments.length,
    };
  }, [payments]);

  // 3. Edukasi
  const educationSummary = useMemo(() => {
    const totalModules = allModules.length || 1;
    const completedCount = progressList.filter((p) => p.status === 'selesai').length;
    const inProgressCount = progressList.filter((p) => p.status === 'sedang_berjalan').length;
    const percent = Math.round((completedCount / totalModules) * 100);
    return {
      totalModules,
      completedCount,
      inProgressCount,
      percent,
    };
  }, [allModules, progressList]);

  // Format Helper
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ─── 1. BANNER SAPAAN & POIN / STREAK ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ruang Pemulihan Finansial Gen Z</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Halo, {currentUser?.name || 'Sobat BUBU'}! 👋
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pantau penyelesaian pinjol, verifikasi pembayaran, dan kumpulkan poin reward untuk melangkah menuju bebas utang.
            </p>
          </div>

          {/* Kartu Mini Poin & Streak */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            {/* Total Poin */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-medium">
                  Total Poin
                </span>
                <span className="text-xl font-bold text-white tracking-tight">
                  {userPoints.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Streak Harian */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-medium">
                  Streak Harian
                </span>
                <span className="text-xl font-bold text-white tracking-tight">
                  {streak?.currentStreak || 0} Hari
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. EMPAT KARTU STATISTIK RINGKASAN ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sisa Tagihan Pinjaman */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sisa Tagihan</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatRupiah(stats?.totalDebt || 0)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{stats?.activeLoans || 0} pinjaman aktif berjalan</span>
          </div>
        </div>

        {/* Total Pembayaran Terverifikasi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Terbayarkan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatRupiah(stats?.totalPaid || 0)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{paymentSummary.terverifikasiCount} pembayaran terverifikasi</span>
          </div>
        </div>

        {/* Kasus Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Kasus Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {stats?.openCases || 0} Kasus
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Total {caseSummary.total} kasus dilaporkan</span>
          </div>
        </div>

        {/* Literasi Keuangan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Edukasi Selesai</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {educationSummary.completedCount} / {educationSummary.totalModules} Modul
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{educationSummary.percent}% kurikulum dipelajari</span>
          </div>
        </div>
      </div>

      {/* ─── 3. GRID UTAMA DASHBOARD (KONTEN 2 KOLOM) ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (LEBAR: 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3A. RINGKASAN KASUS SAYA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Kasus Pinjaman Saya</h2>
                  <p className="text-xs text-slate-400">Status penanganan dan pendampingan Admin CS</p>
                </div>
              </div>
              <Link
                to="/cases"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {cases.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700">Belum Ada Kasus Pinjaman</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Jika Anda mengalami bunga tidak wajar atau teror pinjol, segera buat laporan pendampingan.
                  </p>
                </div>
                <Link
                  to="/cases"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
                >
                  Laporkan Kasus
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            c.status === 'diproses'
                              ? 'bg-blue-100 text-blue-700'
                              : c.status === 'baru'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{c.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                      <span>Platform: <strong className="text-slate-700">{c.platform || '-'}</strong></span>
                      <span>&bull;</span>
                      <span>Prioritas: <strong className="capitalize text-slate-700">{c.priority}</strong></span>
                      <span>&bull;</span>
                      <span>Kategori: <strong className="text-slate-700">{c.category?.replace('_', ' ')}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3B. RINGKASAN PINJAMAN AKTIF & TOTAL SISA TAGIHAN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Pinjaman Terdata</h2>
                  <p className="text-xs text-slate-400">Daftar beban pinjaman dan status legalitas platform</p>
                </div>
              </div>
              <Link
                to="/loans"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loans.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Tidak Ada Pinjaman Tercatat</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Seluruh data pinjaman Anda bersih atau belum pernah ditambahkan ke sistem.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{loan.platform}</h3>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-0.5 ${
                            loan.isOjkRegistered
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {loan.isOjkRegistered ? 'Terdaftar OJK' : 'Pinjol Ilegal'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium capitalize">
                        {loan.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 block">Sisa Saldo Pinjaman</span>
                      <span className="text-base font-extrabold text-slate-900 block">
                        {formatRupiah(loan.currentBalance)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Bunga: {loan.interestRate}% ({loan.interestPeriod})</span>
                      <span>Jatuh Tempo: {loan.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3C. RINGKASAN PEMBAYARAN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Riwayat Pembayaran</h2>
                  <p className="text-xs text-slate-400">Verifikasi cicilan dan poin reward yang diperoleh</p>
                </div>
              </div>
              <Link
                to="/payments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Konfirmasi Bayar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {payments.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Receipt className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Belum Ada Riwayat Pembayaran</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Unggah bukti pembayaran cicilan Anda untuk mendapatkan verifikasi dan poin reward.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.slice(0, 3).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">
                        {p.notes || 'Pembayaran Cicilan Pinjaman'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(p.paymentDate)}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{p.paymentMethod?.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-xs font-bold text-slate-900">{formatRupiah(p.amount)}</p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'terverifikasi'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'menunggu_verifikasi'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.status === 'terverifikasi'
                          ? `+${p.pointsAwarded || 50} Poin`
                          : p.status === 'menunggu_verifikasi'
                          ? 'Menunggu'
                          : 'Ditolak'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN (LEBAR: 1/3) */}
        <div className="space-y-6">
          {/* 3D. SHORTCUT MENU UTAMA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/cases"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition text-center group"
              >
                <FolderKanban className="w-5 h-5 mx-auto text-slate-600 group-hover:text-blue-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 block">
                  Kasus Saya
                </span>
              </Link>
              <Link
                to="/loans"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition text-center group"
              >
                <CreditCard className="w-5 h-5 mx-auto text-slate-600 group-hover:text-blue-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 block">
                  Cek Pinjaman
                </span>
              </Link>
              <Link
                to="/payments"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition text-center group"
              >
                <Receipt className="w-5 h-5 mx-auto text-slate-600 group-hover:text-blue-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 block">
                  Bayar Cicilan
                </span>
              </Link>
              <Link
                to="/proofs"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition text-center group"
              >
                <Sparkles className="w-5 h-5 mx-auto text-slate-600 group-hover:text-amber-500 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-700 block">
                  Klaim Poin
                </span>
              </Link>
              <Link
                to="/education"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition text-center group"
              >
                <BookOpen className="w-5 h-5 mx-auto text-slate-600 group-hover:text-blue-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 block">
                  Modul Edukasi
                </span>
              </Link>
              <Link
                to="/rewards"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition text-center group"
              >
                <Gift className="w-5 h-5 mx-auto text-slate-600 group-hover:text-blue-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 block">
                  Toko Reward
                </span>
              </Link>
            </div>
          </div>

          {/* 3E. PROGRESS EDUKASI KEUANGAN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Progres Edukasi</h3>
              </div>
              <span className="text-xs font-bold text-indigo-600">
                {educationSummary.percent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(educationSummary.percent, 3)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{educationSummary.completedCount} selesai</span>
                <span>Total {educationSummary.totalModules} modul</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tuntaskan modul dan kuis literasi keuangan untuk meningkatkan skor finansial dan membuka kupon reward.
            </p>

            <Link
              to="/education"
              className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold text-center block transition"
            >
              Lanjutkan Belajar &rarr;
            </Link>
          </div>

          {/* 3F. NOTIFIKASI & AKTIVITAS TERBARU */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Aktivitas & Notifikasi</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                {notifications.filter((n) => !n.isRead).length} baru
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-600">Belum ada aktivitas baru</p>
                <p>Notifikasi sistem dan kabar konseling akan muncul di sini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
