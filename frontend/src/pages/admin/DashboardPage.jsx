import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  CreditCard,
  Receipt,
  BookOpen,
  Gift,
  Award,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getAdminStats,
  getAllUsers,
  getAllCases,
  getAllPayments,
  getAllShopItems,
  getAllBadges,
  getAll,
  STORAGE_KEYS,
  getUserById,
} from '../../services/storage.js';
import { getAllEducationModules } from '../../data/modules/index.js';

export default function DashboardPage() {
  const { currentUser } = useAuth();

  // ─── AMBIL DATA DARI STORAGE (READ-ONLY) ──────────────────────────────────
  const adminStats = useMemo(() => getAdminStats(), []);
  const users = useMemo(() => getAllUsers(), []);
  const cases = useMemo(() => getAllCases(), []);
  const payments = useMemo(() => getAllPayments(), []);
  const loans = useMemo(() => getAll(STORAGE_KEYS.LOANS) || [], []);
  const shopItems = useMemo(() => getAllShopItems(), []);
  const badges = useMemo(() => getAllBadges(), []);
  const educationModules = useMemo(() => getAllEducationModules(), []);
  const notifications = useMemo(() => {
    const allNotifs = getAll(STORAGE_KEYS.NOTIFICATIONS) || [];
    return [...allNotifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, []);

  // ─── BREAKDOWN PENGGUNA ───────────────────────────────────────────────────
  const userSummary = useMemo(() => {
    const regularUsers = users.filter((u) => u.role === 'user');
    const counselors = users.filter((u) => u.role === 'konselor');
    const admins = users.filter((u) => u.role === 'admin');
    return {
      total: users.length,
      usersCount: regularUsers.length,
      counselorsCount: counselors.length,
      adminsCount: admins.length,
    };
  }, [users]);

  // ─── BREAKDOWN KASUS ──────────────────────────────────────────────────────
  const caseSummary = useMemo(() => {
    const baru = cases.filter((c) => c.status === 'baru').length;
    const diproses = cases.filter((c) => c.status === 'diproses').length;
    const selesai = cases.filter((c) => c.status === 'selesai').length;
    const ditutup = cases.filter((c) => c.status === 'ditutup').length;
    const unassigned = cases.filter((c) => !c.konselorId);
    return {
      total: cases.length,
      baru,
      diproses,
      selesai,
      ditutup,
      active: baru + diproses,
      resolved: selesai + ditutup,
      unassigned,
    };
  }, [cases]);

  // ─── BREAKDOWN PINJAMAN ───────────────────────────────────────────────────
  const loanSummary = useMemo(() => {
    const totalCount = loans.length;
    const legalCount = loans.filter((l) => l.isOjkRegistered).length;
    const illegalCount = loans.filter((l) => !l.isOjkRegistered).length;
    const activeLoans = loans.filter((l) => l.status === 'aktif');
    const totalActiveDebt = activeLoans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);
    const lunasCount = loans.filter((l) => l.status === 'lunas').length;
    const macetCount = loans.filter((l) => l.status === 'macet').length;

    return {
      totalCount,
      legalCount,
      illegalCount,
      activeCount: activeLoans.length,
      totalActiveDebt,
      lunasCount,
      macetCount,
    };
  }, [loans]);

  // ─── BREAKDOWN PEMBAYARAN ─────────────────────────────────────────────────
  const paymentSummary = useMemo(() => {
    const pending = payments.filter((p) => p.status === 'menunggu_verifikasi');
    const verified = payments.filter((p) => p.status === 'terverifikasi');
    const rejected = payments.filter((p) => p.status === 'ditolak');
    const totalVerifiedAmount = verified.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalCount: payments.length,
      pendingCount: pending.length,
      verifiedCount: verified.length,
      rejectedCount: rejected.length,
      totalVerifiedAmount,
      pendingPayments: pending,
    };
  }, [payments]);

  // ─── FORMAT HELPERS ───────────────────────────────────────────────────────
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

  // Lookup nama pengguna secara aman
  const getUserDisplayName = (userId) => {
    if (!userId) return 'Pengguna';
    const u = getUserById(userId);
    return u?.name || `Pengguna (${userId})`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ─── 1. BANNER SAPAAN ADMIN ───────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pusat Kendali & Tata Kelola Sistem BUBU</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Halo, {currentUser?.name || 'Administrator'}! 👑
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pantau seluruh aktivitas penanganan kasus, alokasi konselor, verifikasi pembayaran, serta kesehatan operasional platform penanganan pinjol BUBU.
            </p>
          </div>

          {/* Kartu Status Operasional */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-4 self-start md:self-auto shrink-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-medium">
                Status Sistem
              </span>
              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Operasional Aktif
              </span>
              <span className="text-[11px] text-slate-300 block">
                {userSummary.total} pengguna terdaftar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. EMPAT KARTU STATISTIK UTAMA (KPI) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengguna */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pengguna</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {userSummary.total} Akun
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{userSummary.usersCount} user &bull; {userSummary.counselorsCount} konselor &bull; {userSummary.adminsCount} admin</span>
          </div>
        </div>

        {/* Total Kasus */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Kasus</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {caseSummary.total} Kasus
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
            <span>{caseSummary.active} aktif &bull; {caseSummary.resolved} selesai/tutup</span>
          </div>
        </div>

        {/* Kasus Belum Ditugaskan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Butuh Penugasan</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              caseSummary.unassigned.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {caseSummary.unassigned.length} Kasus
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {caseSummary.unassigned.length > 0 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Belum ditangani Admin CS
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Semua kasus telah dialokasikan
              </span>
            )}
          </div>
        </div>

        {/* Pembayaran Menunggu Verifikasi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Verifikasi Pembayaran</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              paymentSummary.pendingCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {paymentSummary.pendingCount} Menunggu
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {paymentSummary.pendingCount > 0 ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Perlu ditinjau admin
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Semua pembayaran tertangani
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. GRID UTAMA DASHBOARD ADMIN (2 KOLOM) ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (LEBAR: 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3A. PENGAWASAN STATUS KASUS & KASUS BELUM DITUGASKAN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Distribusi & Penugasan Kasus</h2>
                  <p className="text-xs text-slate-400">Status penanganan kasus pengguna dan alokasi konselor pendamping</p>
                </div>
              </div>
              <Link
                to="/admin/cases"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Kelola Kasus <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visual Bar Distribusi Kasus */}
            {caseSummary.total > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Rasio Status Kasus</span>
                  <span>{caseSummary.total} Kasus Terdata</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                  {caseSummary.baru > 0 && (
                    <div
                      style={{ width: `${(caseSummary.baru / caseSummary.total) * 100}%` }}
                      className="bg-amber-500 h-full"
                      title={`Baru: ${caseSummary.baru}`}
                    />
                  )}
                  {caseSummary.diproses > 0 && (
                    <div
                      style={{ width: `${(caseSummary.diproses / caseSummary.total) * 100}%` }}
                      className="bg-blue-500 h-full"
                      title={`Diproses: ${caseSummary.diproses}`}
                    />
                  )}
                  {caseSummary.selesai > 0 && (
                    <div
                      style={{ width: `${(caseSummary.selesai / caseSummary.total) * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Selesai: ${caseSummary.selesai}`}
                    />
                  )}
                  {caseSummary.ditutup > 0 && (
                    <div
                      style={{ width: `${(caseSummary.ditutup / caseSummary.total) * 100}%` }}
                      className="bg-slate-400 h-full"
                      title={`Ditutup: ${caseSummary.ditutup}`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Grid 4 Status Kasus */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                <span className="text-[11px] font-semibold text-amber-800 block">Kasus Baru</span>
                <span className="text-xl font-extrabold text-amber-900">{caseSummary.baru}</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Menunggu respon</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
                <span className="text-[11px] font-semibold text-blue-800 block">Sedang Diproses</span>
                <span className="text-xl font-extrabold text-blue-900">{caseSummary.diproses}</span>
                <span className="text-[10px] text-blue-700 block mt-0.5">Dalam pendampingan</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                <span className="text-[11px] font-semibold text-emerald-800 block">Selesai</span>
                <span className="text-xl font-extrabold text-emerald-900">{caseSummary.selesai}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Solusi tercapai</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-700 block">Ditutup</span>
                <span className="text-xl font-extrabold text-slate-800">{caseSummary.ditutup}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Arsip tuntas</span>
              </div>
            </div>

            {/* Sub-bagian: Kasus yang Membutuhkan Alokasi Konselor */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              Kasus Belum Ditangani Admin ({caseSummary.unassigned.length})
                </h3>
              </div>

              {caseSummary.unassigned.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-800">
                    Bagus! Seluruh kasus pengguna saat ini sudah sedang ditangani oleh Admin CS.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {caseSummary.unassigned.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                            {c.priority}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{c.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Pelapor: <strong className="text-slate-700">{getUserDisplayName(c.userId)}</strong> &bull; Platform: <strong className="text-slate-700">{c.platform || '-'}</strong> &bull; Masuk: {formatDate(c.createdAt)}
                        </p>
                      </div>

                      <Link
                        to="/admin/cases"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold self-start sm:self-auto transition shrink-0"
                      >
                        Tangani Aduan &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3B. VERIFIKASI PEMBAYARAN & KEUANGAN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Verifikasi Pembayaran Cicilan</h2>
                  <p className="text-xs text-slate-400">Tinjau bukti transfer dan persetujuan penambahan poin reward nasabah</p>
                </div>
              </div>
              <Link
                to="/admin/payments"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Semua Pembayaran <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Statistik Pembayaran */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] text-slate-500 block">Menunggu Verifikasi</span>
                <span className="text-lg font-extrabold text-amber-600 block">
                  {paymentSummary.pendingCount} Transaksi
                </span>
                <span className="text-[10px] text-slate-400 block">Perlu verifikasi manual</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] text-slate-500 block">Terverifikasi</span>
                <span className="text-lg font-extrabold text-emerald-600 block">
                  {paymentSummary.verifiedCount} Transaksi
                </span>
                <span className="text-[10px] text-slate-400 block">{formatRupiah(paymentSummary.totalVerifiedAmount)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] text-slate-500 block">Ditolak</span>
                <span className="text-lg font-extrabold text-rose-600 block">
                  {paymentSummary.rejectedCount} Transaksi
                </span>
                <span className="text-[10px] text-slate-400 block">Bukti tidak valid / duplikat</span>
              </div>
            </div>

            {/* Antrean Menunggu Verifikasi */}
            {paymentSummary.pendingPayments.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600">Tidak Ada Pembayaran Menunggu Verifikasi</p>
                <p className="text-[11px] text-slate-400">Semua pengajuan pembayaran dari pengguna telah selesai ditinjau.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-1">
                {paymentSummary.pendingPayments.slice(0, 3).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">
                        {formatRupiah(p.amount)} &bull; {getUserDisplayName(p.userId)}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>Tanggal: {formatDate(p.paymentDate)}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{p.paymentMethod?.replace('_', ' ')}</span>
                        {p.proofFile && <span>&bull; Bukti: {p.proofFile}</span>}
                      </div>
                    </div>

                    <Link
                      to="/admin/payments"
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition shrink-0"
                    >
                      Tinjau
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3C. PENGAWASAN PORTOFOLIO PINJAMAN NASABAH */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Portofolio Pinjaman Pengguna</h2>
                  <p className="text-xs text-slate-400">Ringkasan beban pinjaman yang dilaporkan dan status legalitas platform</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600">
                Total {loanSummary.totalCount} Pinjaman
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Total Sisa Tagihan Aktif</span>
                <span className="text-lg font-extrabold text-slate-900 block">
                  {formatRupiah(loanSummary.totalActiveDebt)}
                </span>
                <span className="text-[10px] text-slate-500 block">{loanSummary.activeCount} pinjaman berjalan</span>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Terdaftar OJK (Legal)</span>
                </div>
                <span className="text-lg font-extrabold text-emerald-900 block">
                  {loanSummary.legalCount} Platform
                </span>
                <span className="text-[10px] text-emerald-700 block">Sesuai regulasi AFPI/OJK</span>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Pinjol Ilegal</span>
                </div>
                <span className="text-lg font-extrabold text-rose-900 block">
                  {loanSummary.illegalCount} Platform
                </span>
                <span className="text-[10px] text-rose-700 block">Prioritas advokasi & pelaporan</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Lunas: <strong>{loanSummary.lunasCount}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Aktif: <strong>{loanSummary.activeCount}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Macet / Menunggak: <strong>{loanSummary.macetCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (LEBAR: 1/3) */}
        <div className="space-y-6">
          {/* 3D. SHORTCUT MENU ADMIN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Aksi Cepat Pengelolaan</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/admin/users"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition text-center group"
              >
                <Users className="w-5 h-5 mx-auto text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 block">
                  Pengguna
                </span>
              </Link>
              <Link
                to="/admin/cases"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition text-center group"
              >
                <FolderKanban className="w-5 h-5 mx-auto text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 block">
                  Kasus
                </span>
              </Link>
              <Link
                to="/admin/payments"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition text-center group"
              >
                <Receipt className="w-5 h-5 mx-auto text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 block">
                  Pembayaran
                </span>
              </Link>
              <Link
                to="/admin/education"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition text-center group"
              >
                <BookOpen className="w-5 h-5 mx-auto text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 block">
                  Modul Edukasi
                </span>
              </Link>
              <Link
                to="/admin/rewards"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition text-center group"
              >
                <Gift className="w-5 h-5 mx-auto text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 block">
                  Toko Reward
                </span>
              </Link>
              <Link
                to="/admin/badges"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition text-center group"
              >
                <Award className="w-5 h-5 mx-auto text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 block">
                  Lencana
                </span>
              </Link>
            </div>
          </div>

          {/* 3E. RINGKASAN KONTEN & GAMIFIKASI */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Konten Edukasi & Reward</h3>

            <div className="space-y-3">
              {/* Modul Edukasi */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Modul Edukasi</span>
                    <span className="text-[11px] text-slate-400">Kurikulum literasi finansial</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    {educationModules.length} Modul
                  </span>
                  <Link to="/admin/education" className="text-[10px] text-indigo-600 font-semibold hover:underline">
                    Kelola &rarr;
                  </Link>
                </div>
              </div>

              {/* Toko Reward */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Toko Reward</span>
                    <span className="text-[11px] text-slate-400">Voucher & merchandise</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    {shopItems.filter((i) => i.isActive).length} Aktif
                  </span>
                  <span className="text-[10px] text-slate-400 block">dari {shopItems.length} item</span>
                </div>
              </div>

              {/* Lencana */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Lencana Gamifikasi</span>
                    <span className="text-[11px] text-slate-400">Pencapaian nasabah</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    {badges.length} Lencana
                  </span>
                  <Link to="/admin/badges" className="text-[10px] text-indigo-600 font-semibold hover:underline">
                    Daftar &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 3F. AKTIVITAS & NOTIFIKASI SISTEM TERBARU */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Aktivitas & Notifikasi Sistem</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                {notifications.length} tercatat
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-600">Belum ada aktivitas baru</p>
                <p>Notifikasi sistem dan pengumuman akan tampil di sini.</p>
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
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
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
