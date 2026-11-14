/**
 * RepaymentPlanner.jsx — Rencana Pelunasan ByeBills
 *
 * Fitur:
 * 1. Pilih prioritas: Snowball atau Avalanche
 *    - Jatuh tempo ≤ 5 hari selalu didahulukan
 *    - Pinjaman tidak berizin (ilegal / tidak_tahu) ditaruh paling akhir
 * 2. Slider 3–36 bulan → kalkulasi per bulan & per hari
 *    - Keterangan status: terlalu berat / ringan / pas
 *    - Estimasi lunas berdasarkan kemampuan tersedia
 */

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Trophy,
  Wallet,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Clock,
  Pencil,
  Info,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { getFinancialProfileByUser } from '../services/storage.js';
import { formatRupiah, checkUrgentDue } from '../utils/loanCalculations.js';
import EditBalanceModal from './EditBalanceModal.jsx';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Format DD-MM-YYYY */
function formatTanggal(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/**
 * Urutkan pinjaman sesuai metode, dengan aturan:
 *  - Jatuh tempo ≤ 5 hari SELALU didahulukan (urgensi)
 *  - Pinjaman tidak berizin (ilegal / tidak_tahu) ditaruh PALING AKHIR
 *  - Di tengah: snowball = saldo terkecil dulu | avalanche = bunga tertinggi dulu
 */
function sortLoans(loans, method) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return [...loans].sort((a, b) => {
    // ── Grup 1: urgensi (≤ 5 hari) ──────────────────────────────────────────
    const dueA = a.dueDate ? new Date(a.dueDate) : null;
    const dueB = b.dueDate ? new Date(b.dueDate) : null;
    const diffA = dueA ? Math.ceil((dueA - now) / 86400000) : 9999;
    const diffB = dueB ? Math.ceil((dueB - now) / 86400000) : 9999;
    const urgentA = diffA <= 5;
    const urgentB = diffB <= 5;

    if (urgentA && !urgentB) return -1;
    if (!urgentA && urgentB) return 1;
    if (urgentA && urgentB) return diffA - diffB; // yang paling mepet duluan

    // ── Grup 3: tidak berizin paling akhir ──────────────────────────────────
    const illegalA = a.ojkStatus !== 'ojk';
    const illegalB = b.ojkStatus !== 'ojk';
    if (illegalA && !illegalB) return 1;
    if (!illegalA && illegalB) return -1;

    // ── Grup 2: metode utama ─────────────────────────────────────────────────
    if (method === 'snowball') {
      return (a.currentBalance || 0) - (b.currentBalance || 0);
    }
    // avalanche: bunga tertinggi dulu
    return (Number(b.interestRate) || 0) - (Number(a.interestRate) || 0);
  });
}

/** Tenor efektif pinjaman (bulan). Default 12 jika data tenor tidak diisi. */
function getLoanTenor(loan) {
  return Number(loan.tenor) || 12;
}

/** Kalkulasi cicilan flat sederhana dari sisa pokok / tenor */
function calcMonthlyPayment(loan) {
  const principal = loan.currentBalance || loan.originalAmount || 0;
  const ratePerMonth = (Number(loan.interestRate) || 0) / 100;
  const tenor = loan.tenor || 12;
  const interestType = loan.interestType || 'efektif';

  if (!principal || !tenor) return 0;

  if (interestType === 'flat') {
    return Math.ceil(principal / tenor + principal * ratePerMonth);
  }
  // efektif / anuitas
  if (ratePerMonth === 0) return Math.ceil(principal / tenor);
  const r = ratePerMonth;
  return Math.ceil((principal * r * Math.pow(1 + r, tenor)) / (Math.pow(1 + r, tenor) - 1));
}

// Label OJK
const OJK_LABEL = { ojk: 'Berizin OJK', ilegal: 'Ilegal', tidak_tahu: 'Tidak Tahu' };

const OJK_BADGE = {
  ojk: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ilegal: 'bg-rose-50 text-rose-700 border-rose-200',
  tidak_tahu: 'bg-slate-50 text-slate-500 border-slate-200',
};

// ─── KOMPONEN UTAMA ───────────────────────────────────────────────────────────

export default function RepaymentPlanner({ loans = [], userId }) {
  const [method, setMethod] = useState(null); // null | 'snowball' | 'avalanche'
  const [months, setMonths] = useState(12);
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  // ── Data ──────────────────────────────────────────────────────────────────

  const financialProfile = useMemo(() => {
    if (!userId) return null;
    return getFinancialProfileByUser(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, balanceRefreshKey, isEditBalanceOpen]);

  const userBalance = Number(financialProfile?.userBalance) || 0;
  const monthlyExpense = Number(financialProfile?.monthlyExpense) || 0;

  const activeLoans = useMemo(
    () => (loans || []).filter((l) => l.status === 'aktif' && (l.currentBalance || 0) > 0),
    [loans]
  );

  // Total sisa hutang semua pinjaman aktif
  const totalRemaining = useMemo(
    () => activeLoans.reduce((s, l) => s + (l.currentBalance || 0), 0),
    [activeLoans]
  );

  // Tenor terpanjang antar pinjaman aktif, dipakai sebagai jumlah baris jadwal
  const maxLoanTenor = useMemo(
    () => activeLoans.reduce((max, l) => Math.max(max, getLoanTenor(l)), 1),
    [activeLoans]
  );

  // Urutan prioritas sesuai metode
  const sortedLoans = useMemo(
    () => (method ? sortLoans(activeLoans, method) : activeLoans),
    [activeLoans, method]
  );

  // ── Kalkulasi Slider ─────────────────────────────────────────────────────

  const perMonth = totalRemaining > 0 ? Math.ceil(totalRemaining / months) : 0;
  const perDay = perMonth > 0 ? Math.ceil(perMonth / 30) : 0;

  // Kemampuan tersedia setelah pengeluaran pokok
  const availableMonthly = userBalance > 0
    ? Math.max(userBalance - monthlyExpense, 0)
    : 0;

  // Estimasi bulan lunas dari kemampuan tersedia
  const estimatedMonths = availableMonthly > 0 && totalRemaining > 0
    ? Math.ceil(totalRemaining / availableMonthly)
    : null;

  // Status beban
  const statusInfo = useMemo(() => {
    if (!userBalance) return null;
    if (perMonth > availableMonthly) {
      const excess = perMonth - availableMonthly;
      return {
        type: 'berat',
        label: 'Terlalu Berat',
        desc: `Melebihi kemampuan tersedia sebesar ${formatRupiah(excess)}/bulan.`,
        color: 'rose',
      };
    }
    if (perMonth < availableMonthly * 0.6) {
      return {
        type: 'ringan',
        label: 'Terlalu Ringan',
        desc: `Jauh di bawah kemampuan tersedia ${formatRupiah(availableMonthly)}/bulan. Bisa dipercepat.`,
        color: 'amber',
      };
    }
    return {
      type: 'aman',
      label: 'Sesuai Kemampuan',
      desc: `Cicilan masuk akal dari kemampuan tersedia ${formatRupiah(availableMonthly)}/bulan.`,
      color: 'emerald',
    };
  }, [perMonth, availableMonthly, userBalance]);

  // ── Empty state ───────────────────────────────────────────────────────────

  if (activeLoans.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
        <TrendingDown className="w-12 h-12 text-slate-200 mx-auto" />
        <p className="text-sm font-bold text-slate-700">Belum Ada Pinjaman Aktif</p>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Catat pinjaman di tab <strong>Daftar Pinjaman</strong> terlebih dahulu agar rencana pelunasan dapat dihitung.
        </p>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Profil Saldo ─────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        userBalance > 0
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
          : 'bg-slate-50 border-slate-200 border-dashed'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            userBalance > 0 ? 'bg-emerald-100' : 'bg-slate-200'
          }`}>
            <Wallet className={`w-4 h-4 ${userBalance > 0 ? 'text-emerald-700' : 'text-slate-500'}`} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              {userBalance > 0 ? `Saldo Tersedia: ${formatRupiah(userBalance)}` : 'Saldo Belum Diatur'}
            </span>
            {userBalance > 0 ? (
              <span className="text-[11px] text-slate-500">
                Kebutuhan pokok/bulan: {formatRupiah(monthlyExpense)} ·
                Tersedia untuk cicilan: <strong className="text-emerald-700">{formatRupiah(availableMonthly)}</strong>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Masukkan saldo untuk mendapatkan analisis kemampuan cicilan.
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditBalanceOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition cursor-pointer shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Jumlah Saldo
        </button>
      </div>

      {/* ── 1. Pilih Prioritas ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
            Pilih Metode Prioritas Pelunasan
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 ml-7">
            Jatuh tempo ≤ 5 hari selalu diutamakan. Pinjaman tidak berizin ditaruh paling akhir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Snowball */}
          <button
            type="button"
            onClick={() => setMethod('snowball')}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
              method === 'snowball'
                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            {method === 'snowball' && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                method === 'snowball' ? 'bg-blue-500' : 'bg-blue-100 group-hover:bg-blue-200'
              }`}>
                <Trophy className={`w-5 h-5 ${method === 'snowball' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">Snowball</p>
                <p className="text-[10px] text-slate-500">Kemenangan cepat</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-blue-700">Sisa terkecil dulu: kemenangan cepat.</strong>{' '}
              Jatuh tempo 5 hari ke bawah didahulukan, pinjaman tidak berizin ditaruh paling akhir.
            </p>
          </button>

          {/* Avalanche */}
          <button
            type="button"
            onClick={() => setMethod('avalanche')}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
              method === 'avalanche'
                ? 'border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-200'
                : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/40'
            }`}
          >
            {method === 'avalanche' && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                method === 'avalanche' ? 'bg-rose-500' : 'bg-rose-100 group-hover:bg-rose-200'
              }`}>
                <Zap className={`w-5 h-5 ${method === 'avalanche' ? 'text-white' : 'text-rose-600'}`} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">Avalanche</p>
                <p className="text-[10px] text-slate-500">Paling hemat biaya</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-rose-700">Bunga tertinggi dulu: paling hemat.</strong>{' '}
              Jatuh tempo 5 hari ke bawah didahulukan, pinjaman tidak berizin ditaruh paling akhir.
            </p>
          </button>
        </div>

        {/* ── Urutan Prioritas Pinjaman ──────────────────────────────────── */}
        {method && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Urutan Fokus Prioritas Pelunasan ({method === 'snowball' ? 'Snowball' : 'Avalanche'})
            </p>
            <div className="space-y-2">
              {sortedLoans.map((loan, idx) => {
                const urgentInfo = checkUrgentDue(loan.dueDate);
                const isFirst = idx === 0;
                const ojkStatus = loan.ojkStatus || (loan.isOjkRegistered ? 'ojk' : 'ilegal');
                const isIllegal = ojkStatus !== 'ojk';
                const monthlyInstall = calcMonthlyPayment(loan);
                const dueDay = loan.dueDateDay
                  ? `Tgl ${loan.dueDateDay} tiap bulan`
                  : loan.dueDate
                  ? `Tempo: ${formatTanggal(loan.dueDate)}`
                  : '-';

                return (
                  <div
                    key={loan.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                      isFirst
                        ? method === 'snowball'
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-rose-600 border-rose-600 text-white'
                        : urgentInfo.isUrgent
                        ? 'bg-amber-50 border-amber-300'
                        : isIllegal
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Nomor urut */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                      isFirst ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Info pinjaman */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold truncate ${isFirst ? 'text-white' : 'text-slate-800'}`}>
                          {loan.platform}
                        </span>
                        {isFirst && (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            method === 'snowball' ? 'bg-blue-400/40 text-white' : 'bg-rose-400/40 text-white'
                          }`}>
                            Fokus Utama
                          </span>
                        )}
                        {urgentInfo.isUrgent && !isFirst && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {urgentInfo.isOverdue
                              ? `Lewat ${Math.abs(urgentInfo.diffDays)} hari`
                              : `${urgentInfo.diffDays} hari lagi`}
                          </span>
                        )}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                          isFirst ? 'bg-white/20 border-white/30 text-white' : OJK_BADGE[ojkStatus] || OJK_BADGE.tidak_tahu
                        }`}>
                          {OJK_LABEL[ojkStatus] || ojkStatus}
                        </span>
                      </div>

                      <div className={`mt-1 text-[11px] space-y-0.5 ${isFirst ? 'text-white/80' : 'text-slate-500'}`}>
                        <p>
                          Sisa hutang:{' '}
                          <strong className={isFirst ? 'text-white' : 'text-slate-800'}>
                            {formatRupiah(loan.currentBalance)}
                          </strong>
                        </p>
                        <p>
                          Bunga: <strong>{loan.interestRate}%/bln</strong>
                          {' · '}
                          Cicilan/bln: <strong>{formatRupiah(monthlyInstall)}</strong>
                          {' · '}
                          {dueDay}
                        </p>
                        {isIllegal && !isFirst && (
                          <p className="text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldAlert className="w-3 h-3" />
                            Tidak berizin — ditaruh paling akhir sesuai aturan prioritas
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Keterangan aturan */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>
                Urutan ini mempertimbangkan: <strong>urgensi jatuh tempo</strong> (≤ 5 hari didahulukan) →{' '}
                <strong>metode {method === 'snowball' ? 'snowball (saldo terkecil)' : 'avalanche (bunga tertinggi)'}</strong> →{' '}
                <strong>pinjaman tidak berizin paling akhir</strong>.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Simulasi Rencana Lunas ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
            Simulasi: Rencana Lunas dalam Berapa Bulan?
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 ml-7">
            Geser slider untuk melihat berapa yang perlu disisihkan setiap bulan & hari.
          </p>
        </div>

        {/* Total Sisa */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 text-white">
          <div>
            <span className="text-[10px] text-slate-400 block">Total Sisa yang Harus Dibayar</span>
            <span className="text-lg font-extrabold text-emerald-400">{formatRupiah(totalRemaining)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">{activeLoans.length} pinjaman aktif</span>
            {userBalance > 0 && (
              <span className="text-[11px] text-slate-300">
                Saldo tersedia: {formatRupiah(availableMonthly)}/bln
              </span>
            )}
          </div>
        </div>

        {/* Slider Box dengan Background Grey */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Target Lunas dalam:
            </label>
            <span className={`text-sm font-extrabold px-3 py-1 rounded-xl shadow-xs ${
              method === 'avalanche'
                ? 'bg-rose-100 text-rose-700'
                : method === 'snowball'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white border border-slate-200 text-slate-800'
            }`}>
              {months} bulan
            </span>
          </div>

          <div className="relative py-1">
            <input
              type="range"
              min={3}
              max={36}
              step={1}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 hover:bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-colors"
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-0.5">
            <span>3 bln</span>
            <span>12 bln</span>
            <span>24 bln</span>
            <span>36 bln</span>
          </div>
        </div>

        {/* Hasil Kalkulasi */}
        {totalRemaining > 0 && (
          <div className="space-y-3">
            {/* Box utama */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 overflow-hidden">
              <div className="px-5 py-3 bg-blue-600 flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Lunas dalam <strong>{months} bulan</strong>, berarti sisihkan:
                </span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-blue-100 space-y-0.5 text-center">
                  <span className="text-[10px] text-slate-500 font-medium block">Per Bulan</span>
                  <p className="text-xl font-extrabold text-blue-700">{formatRupiah(perMonth)}</p>
                  <span className="text-[10px] text-slate-400">selama {months} bulan</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-100 space-y-0.5 text-center">
                  <span className="text-[10px] text-slate-500 font-medium block">Per Hari</span>
                  <p className="text-xl font-extrabold text-indigo-700">{formatRupiah(perDay)}</p>
                  <span className="text-[10px] text-slate-400">≈ {months * 30} hari</span>
                </div>
              </div>
            </div>

            {/* Status kemampuan */}
            {userBalance > 0 ? (
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                statusInfo?.color === 'rose'
                  ? 'bg-rose-50 border-rose-200'
                  : statusInfo?.color === 'amber'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                {statusInfo?.color === 'rose' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : statusInfo?.color === 'amber' ? (
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className={`text-xs font-bold ${
                    statusInfo?.color === 'rose'
                      ? 'text-rose-800'
                      : statusInfo?.color === 'amber'
                      ? 'text-amber-800'
                      : 'text-emerald-800'
                  }`}>
                    {statusInfo?.label} — {statusInfo?.desc}
                  </p>
                  {estimatedMonths !== null && (
                    <p className={`text-[11px] ${
                      statusInfo?.color === 'rose'
                        ? 'text-rose-700'
                        : statusInfo?.color === 'amber'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}>
                      Dengan kemampuan tersedia{' '}
                      <strong>{formatRupiah(availableMonthly)}/bulan</strong>, estimasi lunas sekitar{' '}
                      <strong>
                        {estimatedMonths <= 36
                          ? `${estimatedMonths} bulan`
                          : `> 36 bulan (perlu review)`}
                      </strong>.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 border-dashed text-xs text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Belum ada data saldo.{' '}
                  <button
                    type="button"
                    onClick={() => setIsEditBalanceOpen(true)}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Isi saldo
                  </button>{' '}
                  untuk melihat apakah target ini terlalu berat, ringan, atau pas.
                </span>
              </div>
            )}

            {/* Jadwal tenggat per step bulan sesuai prioritas & tenor masing-masing */}
            {method && sortedLoans.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Jadwal Tenggat Jatuh Tempo per Step Bulan (Prioritas: {method === 'snowball' ? 'Snowball' : 'Avalanche'})
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Step mengikuti tenor tiap pinjaman
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 py-2 text-left font-semibold text-slate-600 border border-slate-200 rounded-tl-lg">
                          Step Bulan
                        </th>
                        {sortedLoans.map((loan, idx) => (
                          <th
                            key={loan.id}
                            className={`px-3 py-2 text-center font-semibold border border-slate-200 ${
                              idx === 0
                                ? method === 'snowball'
                                  ? 'text-blue-700 bg-blue-50'
                                  : 'text-rose-700 bg-rose-50'
                                : 'text-slate-600'
                            }`}
                          >
                            {loan.platform}
                            {idx === 0 && (
                              <span className="block text-[9px] font-bold">★ Fokus</span>
                            )}
                            <span className="block text-[9px] font-medium text-slate-400">
                              {getLoanTenor(loan)} bln
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.min(maxLoanTenor, 24) }, (_, i) => {
                        const stepNum = i + 1;
                        const now = new Date();
                        return (
                          <tr key={stepNum} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono font-bold text-slate-600 border border-slate-100 whitespace-nowrap">
                              Bln {stepNum}
                            </td>
                            {sortedLoans.map((loan, lIdx) => {
                              const loanTenor = getLoanTenor(loan);
                              const isFinalStep = stepNum === loanTenor;
                              const isSettled = stepNum > loanTenor;
                              const stepDate = new Date(now);
                              stepDate.setMonth(now.getMonth() + stepNum);
                              const day = loan.dueDateDay || stepDate.getDate();
                              stepDate.setDate(Math.min(day, 28));
                              const focusCls =
                                lIdx === 0
                                  ? method === 'snowball'
                                    ? 'text-blue-700'
                                    : 'text-rose-700'
                                  : 'text-slate-600';
                              return (
                                <td
                                  key={loan.id}
                                  className={`px-3 py-2 text-center border border-slate-100 whitespace-nowrap font-semibold ${
                                    isFinalStep
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : isSettled
                                      ? 'text-slate-300'
                                      : focusCls
                                  }`}
                                >
                                  {isFinalStep ? '✓ LUNAS' : isSettled ? '—' : formatTanggal(stepDate)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {maxLoanTenor > 24 && (
                        <tr>
                          <td
                            colSpan={sortedLoans.length + 1}
                            className="px-3 py-2 text-center text-slate-400 italic border border-slate-100"
                          >
                            ... dan {maxLoanTenor - 24} bulan berikutnya hingga bulan ke-{maxLoanTenor}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Edit Saldo */}
      <EditBalanceModal
        isOpen={isEditBalanceOpen}
        onClose={() => setIsEditBalanceOpen(false)}
        userId={userId}
        onSaved={() => {
          setBalanceRefreshKey((k) => k + 1);
          setIsEditBalanceOpen(false);
        }}
      />
    </div>
  );
}
