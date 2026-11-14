/**
 * RepaymentPlanner.jsx
 * Rekomendasi pelunasan otomatis berbasis data pinjaman yang sudah tercatat
 * dan disesuaikan dengan hasil Asesmen Karakter Finansial (5 pertanyaan).
 *
 * Alur UX:
 *  1. User memasukkan kemampuan bayar per bulan.
 *  2. Sistem otomatis merekomendasikan mode Avalanche atau Snowball
 *     berdasarkan hasil asesmen 5 pertanyaan atau preferensi user.
 *  3. Sistem langsung menampilkan jadwal & langkah prioritas pelunasan.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Trophy,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Save,
  RotateCcw,
  ArrowRight,
  Flame,
  Star,
  BrainCircuit,
  HelpCircle,
  Wallet,
  Clock,
  Sparkles,
  ShieldAlert,
  Pencil,
} from 'lucide-react';
import { createRepaymentPlan, getFinancialProfileByUser } from '../services/storage.js';
import {
  formatRupiah,
  calculateLoanEstimatedInterest,
  checkUrgentDue,
} from '../utils/loanCalculations.js';
import RepaymentAssessmentModal from './RepaymentAssessmentModal.jsx';
import EditBalanceModal from './EditBalanceModal.jsx';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getStepDate(startDateStr, monthOffset) {
  const d = new Date(startDateStr);
  d.setMonth(d.getMonth() + monthOffset);
  return d;
}

function formatHariBulanTahun(dateInput) {
  if (!dateInput) return { long: '-', numeric: '-' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { long: String(dateInput), numeric: String(dateInput) };
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const dateFormattedLong = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return {
    long: dateFormattedLong,
    numeric: `${day}-${month}-${year}`,
  };
}

function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
}

function toMonthlyRate(rate, period) {
  const r = (rate || 0) / 100;
  switch (period) {
    case 'harian':   return r * 30;
    case 'mingguan': return r * 4.33;
    case 'tahunan':  return r / 12;
    default:         return r; // bulanan
  }
}

function simulateRepayment(loans, monthlyBudget, strategy) {
  if (!loans.length || monthlyBudget <= 0) return null;

  let debts = loans.map((l) => ({
    id: l.id,
    platform: l.platform,
    balance: l.currentBalance || 0,
    monthlyRate: toMonthlyRate(l.interestRate, l.interestPeriod),
    isOjkRegistered: l.isOjkRegistered,
    originalBalance: l.currentBalance || 0,
  }));

  debts = debts.map((d) => ({
    ...d,
    minPayment: Math.max(Math.ceil(d.balance * d.monthlyRate), 10000),
  }));

  const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);
  if (monthlyBudget < totalMinPayment) {
    return { insufficient: true, minRequired: totalMinPayment };
  }

  const sortDebts = (arr) => {
    const copy = [...arr];
    if (strategy === 'snowball') return copy.sort((a, b) => a.balance - b.balance);
    return copy.sort((a, b) => b.monthlyRate - a.monthlyRate || (!b.isOjkRegistered ? 1 : -1));
  };

  let remaining = debts.map((d) => ({ ...d }));
  const schedule = [];
  let totalInterest = 0;
  let month = 0;
  const MAX_MONTHS = 360;

  while (remaining.some((d) => d.balance > 0) && month < MAX_MONTHS) {
    month++;
    const ordered = sortDebts(remaining.filter((d) => d.balance > 0));
    let budgetLeft = monthlyBudget;
    const payments = [];

    for (const debt of ordered) {
      const interest = debt.balance * debt.monthlyRate;
      const minPay = Math.min(debt.minPayment, debt.balance + interest);
      budgetLeft -= minPay;
      payments.push({
        id: debt.id,
        platform: debt.platform,
        payment: minPay,
        interest,
        principal: minPay - interest,
        balanceAfter: Math.max(debt.balance + interest - minPay, 0),
      });
      totalInterest += interest;
    }

    if (budgetLeft > 0 && ordered.length > 0) {
      const targetId = ordered[0].id;
      const targetIdx = payments.findIndex((p) => p.id === targetId);
      if (targetIdx !== -1) {
        const extra = Math.min(budgetLeft, payments[targetIdx].balanceAfter);
        payments[targetIdx].payment += extra;
        payments[targetIdx].principal += extra;
        payments[targetIdx].balanceAfter = Math.max(payments[targetIdx].balanceAfter - extra, 0);
        budgetLeft -= extra;
      }
    }

    remaining = remaining.map((d) => {
      const p = payments.find((x) => x.id === d.id);
      return p ? { ...d, balance: p.balanceAfter } : d;
    });

    schedule.push({ month, payments, budgetLeft });
  }

  const completionOrder = debts.map((debt) => {
    const finishMonth = schedule.find((s) =>
      s.payments.find((p) => p.id === debt.id && p.balanceAfter === 0)
    );
    return { ...debt, finishMonth: finishMonth?.month || month };
  });
  completionOrder.sort((a, b) => a.finishMonth - b.finishMonth);

  return { schedule, totalInterest, totalMonths: month, completionOrder, insufficient: false };
}

// ─── SUB-KOMPONEN ──────────────────────────────────────────────────────────────

function CompletionTimeline({ order, startDate }) {
  return (
    <div className="space-y-3">
      {order.map((item, idx) => {
        const stepDate = getStepDate(startDate, item.finishMonth);
        const dateFormatted = formatHariBulanTahun(stepDate);
        return (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-800 block truncate">{item.platform}</span>
              <span className="text-[11px] text-slate-500 block">
                Lunas pada Step Bulan ke-{item.finishMonth} · <strong className="text-emerald-700 font-semibold">{dateFormatted.long}</strong> ({dateFormatted.numeric})
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 font-mono block">{formatRupiah(item.originalBalance)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── KOMPONEN UTAMA ───────────────────────────────────────────────────────────

export default function RepaymentPlanner({ loans, userId }) {
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [selectedMode, setSelectedMode]   = useState(null); // null | 'avalanche' | 'snowball'
  const [showSchedule, setShowSchedule]   = useState(false);
  const [saveStatus, setSaveStatus]       = useState('');
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  const startDate = useMemo(() => new Date().toISOString(), []);

  // Ambil profil preferensi pengguna hasil asesmen 5 pertanyaan & kondisi saldo
  const financialProfile = useMemo(() => {
    if (!userId) return null;
    return getFinancialProfileByUser(userId);
  }, [userId, isAssessmentModalOpen, profileRefreshKey]);

  const assessedStrategy = financialProfile?.repaymentAssessment?.strategy || null;

  // Set default mode dari profil asesmen jika sudah ada
  useEffect(() => {
    if (assessedStrategy && !selectedMode) {
      setSelectedMode(assessedStrategy);
    }
  }, [assessedStrategy, selectedMode]);

  const activeLoans = useMemo(
    () => (loans || []).filter((l) => l.status === 'aktif' && (l.currentBalance || 0) > 0),
    [loans]
  );

  // Rincian pinjaman beserta kalkulasi bunga dan status urgensi deadline
  const loansWithDetails = useMemo(() => {
    return activeLoans.map((l) => {
      const interestInfo = calculateLoanEstimatedInterest(l);
      const urgentInfo = checkUrgentDue(l.dueDate);
      return {
        ...l,
        interestInfo,
        urgentInfo,
      };
    });
  }, [activeLoans]);

  const totalDebt = useMemo(
    () => activeLoans.reduce((s, l) => s + (l.currentBalance || 0), 0),
    [activeLoans]
  );

  const totalEstimatedInterestAll = useMemo(
    () => loansWithDetails.reduce((s, l) => s + (l.interestInfo?.totalInterest || 0), 0),
    [loansWithDetails]
  );

  const totalObligationWithInterest = totalDebt + totalEstimatedInterestAll;

  // Profil Finansial (Saldo & Pengeluaran Pengguna)
  const userBalance = Number(financialProfile?.userBalance) || 0;
  const dailyExpense = Number(financialProfile?.dailyExpense) || 0;
  const monthlyExpense = Number(financialProfile?.monthlyExpense) || 0;

  const budget = Number(monthlyBudget);
  const budgetReady = budget > 0;

  // Hitung simulasi untuk KEDUA strategi sekaligus (untuk perbandingan)
  const avalanche = useMemo(
    () => (budgetReady ? simulateRepayment(activeLoans, budget, 'avalanche') : null),
    [activeLoans, budget, budgetReady]
  );
  const snowball = useMemo(
    () => (budgetReady ? simulateRepayment(activeLoans, budget, 'snowball') : null),
    [activeLoans, budget, budgetReady]
  );

  // Hasil yang ditampilkan sesuai mode yang dipilih
  const result = selectedMode === 'avalanche' ? avalanche : selectedMode === 'snowball' ? snowball : null;

  const handleBudgetChange = (e) => {
    setMonthlyBudget(e.target.value);
    setShowSchedule(false);
    setSaveStatus('');
  };

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    setShowSchedule(false);
  };

  function handleSavePlan() {
    if (!result || result.insufficient || !selectedMode) return;
    let saved = 0;
    activeLoans.forEach((loan) => {
      const res = createRepaymentPlan({
        loanId: loan.id,
        userId,
        strategy: selectedMode,
        monthlyTarget: budget,
        targetDate: new Date(
          new Date().setMonth(new Date().getMonth() + result.totalMonths)
        ).toISOString().slice(0, 10),
        notes: `Rencana ${selectedMode === 'avalanche' ? 'Avalanche (bunga tertinggi dulu)' : 'Snowball (utang terkecil dulu)'} — target bebas utang dalam ${result.totalMonths} bulan. Estimasi total bunga: ${formatRupiah(Math.round(result.totalInterest))}.`,
        isActive: true,
      });
      if (res) saved++;
    });
    if (saved > 0) {
      setSaveStatus(`${saved} rencana pelunasan berhasil disimpan!`);
      setTimeout(() => setSaveStatus(''), 4000);
    }
  }

  // ─── EMPTY STATE ─────────────────────────────────────────────────────────────

  if (activeLoans.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
        <TrendingDown className="w-12 h-12 text-slate-200 mx-auto" />
        <p className="text-sm font-bold text-slate-700">Belum Ada Pinjaman Aktif</p>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Catat pinjaman Anda di tab <strong>Daftar Pinjaman</strong> terlebih dahulu — isi
          Pinjaman Pokok, Sisa Tagihan, Bunga, dan Periode Bunga.
        </p>
      </div>
    );
  }

  const isInsufficient = avalanche?.insufficient;
  const minRequired = avalanche?.minRequired;

  return (
    <div className="space-y-5">

      {/* ─── KARTU STATUS ASESMEN & REKOMENDASI SISTEM ─────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-4 md:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Sistem Rekomendasi Pintar ByeBills
              </span>
              {assessedStrategy && (
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  Terasosiasi dengan Profil Anda
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {assessedStrategy
                ? `Berdasarkan 5 pertanyaan, Anda paling direkomendasikan metode ${assessedStrategy.toUpperCase()} (${financialProfile?.repaymentAssessment?.avalancheScore} vs ${financialProfile?.repaymentAssessment?.snowballScore}).`
                : 'Belum mengikuti tes 5 pertanyaan? Ikuti tes singkat agar sistem menyesuaikan strategi terbaik.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAssessmentModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{assessedStrategy ? 'Ulangi 5 Pertanyaan' : 'Mulai 5 Pertanyaan'}</span>
        </button>
      </div>

      {/* ─── LANGKAH 1: KONDISI FINANSIAL & RINGKASAN PINJAMAN DENGAN BUNGA ─────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
        
        {/* Ringkasan Profil Saldo & Pengeluaran Pengguna */}
        {userBalance > 0 || monthlyExpense > 0 || dailyExpense > 0 ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                Kondisi Finansial &amp; Likuiditas Anda
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full hidden sm:inline">
                  Data Tersinkronisasi
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditBalanceModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition cursor-pointer shadow-xs"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Jumlah Saldo</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Saldo Tabungan Tersedia</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {formatRupiah(userBalance)}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Pengeluaran Rata-rata Bulanan</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {formatRupiah(monthlyExpense)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({formatRupiah(dailyExpense)} / hari)
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Kecukupan Saldo vs Total Hutang</span>
                <span className={`text-xs font-bold block ${userBalance >= totalObligationWithInterest ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {userBalance >= totalObligationWithInterest
                    ? `✓ Cukup (Sisa: ${formatRupiah(userBalance - totalObligationWithInterest)})`
                    : `⚠️ Defisit ${formatRupiah(totalObligationWithInterest - userBalance)}`}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Sudah memperhitungkan bunga
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Saldo Tabungan Belum Diatur</span>
                <span className="text-[11px] text-emerald-700">Masukkan jumlah saldo tabungan Anda untuk membantu perhitungan kemampuan pelunasan.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditBalanceModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Edit Jumlah Saldo</span>
            </button>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              Pinjaman yang Terdeteksi Sistem (Dihitung Beserta Bunga)
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              {activeLoans.length} pinjaman aktif
            </span>
          </div>

          <div className="space-y-2.5">
            {loansWithDetails.map((loan, idx) => (
              <div
                key={loan.id}
                className={`p-3.5 rounded-xl border transition ${
                  loan.urgentInfo?.isUrgent
                    ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-100'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{loan.platform}</p>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            loan.isOjkRegistered
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {loan.isOjkRegistered ? 'OJK' : 'Ilegal'}
                        </span>
                        {loan.urgentInfo?.isUrgent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {loan.urgentInfo.isOverdue
                              ? `Lewat ${Math.abs(loan.urgentInfo.diffDays)} hari!`
                              : loan.urgentInfo.isToday
                              ? 'Hari Ini!'
                              : `${loan.urgentInfo.diffDays} hari lagi`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bunga: <strong>{loan.interestRate}%</strong> / {loan.interestPeriod} · Tempo: {loan.dueDate} (estimasi {loan.interestInfo?.durationDays} hari)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div>
                      <p className="text-[10px] text-slate-400">Sisa Pokok</p>
                      <p className="text-xs font-semibold text-slate-700">{formatRupiah(loan.currentBalance)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Estimasi Bunga</p>
                      <p className="text-xs font-semibold text-rose-600">+{formatRupiah(loan.interestInfo?.totalInterest)}</p>
                    </div>
                    <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-blue-700 font-medium">Total Tagihan</p>
                      <p className="text-xs font-extrabold text-blue-900">{formatRupiah(loan.interestInfo?.totalObligation)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total Keseluruhan (Pokok + Bunga) */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <span className="text-xs font-medium text-slate-300 block">
                  Total Seluruh Kewajiban (Pokok + Akumulasi Bunga)
                </span>
                <span className="text-[11px] text-slate-400">
                  Pokok: {formatRupiah(totalDebt)} · Total Estimasi Bunga: +{formatRupiah(totalEstimatedInterestAll)}
                </span>
              </div>
              <div className="text-right self-end sm:self-auto">
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {formatRupiah(totalObligationWithInterest)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input kemampuan bayar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 block">
            Berapa kemampuan bayar Anda per bulan?
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold select-none">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="50000"
                value={monthlyBudget}
                onChange={handleBudgetChange}
                placeholder="cth: 1.500.000"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Quick Preset Buttons jika ada saldo */}
            {userBalance > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    const half = Math.round(userBalance / 2);
                    setMonthlyBudget(String(half));
                    setShowSchedule(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition cursor-pointer shrink-0"
                >
                  Gunakan 50% Saldo ({formatRupiah(Math.round(userBalance / 2))})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMonthlyBudget(String(userBalance));
                    setShowSchedule(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 transition cursor-pointer shrink-0"
                >
                  Gunakan Semua Saldo ({formatRupiah(userBalance)})
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditBalanceModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Edit Saldo</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditBalanceModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Wallet className="w-3 h-3" />
                <span>+ Masukkan Saldo Tabungan</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Sistem ByeBills akan memprioritaskan alokasi dana ini ke pinjaman sesuai metode pilihan Anda.
          </p>
        </div>
      </div>

      {/* ─── LANGKAH 2: PILIH MODE DENGAN REKOMENDASI SISTEM ───────────────── */}
      {budgetReady && !isInsufficient && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-slate-700">
              Pilih mode pelunasan (atau ikuti rekomendasi sistem):
            </p>
            {assessedStrategy && (
              <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-indigo-600" />
                Rekomendasi Utama: {assessedStrategy.toUpperCase()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* AVALANCHE */}
            <button
              type="button"
              onClick={() => handleSelectMode('avalanche')}
              className={`relative text-left p-5 rounded-2xl border-2 transition-all group cursor-pointer ${
                selectedMode === 'avalanche'
                  ? 'border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-200'
                  : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/40'
              }`}
            >
              {assessedStrategy === 'avalanche' && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 fill-white" /> Rekomendasi Anda
                </span>
              )}
              {selectedMode === 'avalanche' && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedMode === 'avalanche' ? 'bg-rose-500' : 'bg-rose-100 group-hover:bg-rose-200'
                } transition`}>
                  <Zap className={`w-5 h-5 ${selectedMode === 'avalanche' ? 'text-white' : 'text-rose-600'}`} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Avalanche</p>
                  <p className="text-[10px] text-slate-500">Hemat bunga maksimal</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Bayar minimum ke semua, sisa dana dipusatkan ke pinjaman dengan{' '}
                <strong className="text-rose-700">bunga tertinggi</strong> lebih dulu.
              </p>
              {avalanche && !avalanche.insufficient && (
                <div className="pt-3 border-t border-rose-100 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">Bebas utang</p>
                    <p className="text-sm font-extrabold text-slate-800">{avalanche.totalMonths} bln</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Total bunga</p>
                    <p className="text-sm font-extrabold text-rose-600">{formatRupiah(Math.round(avalanche.totalInterest))}</p>
                  </div>
                </div>
              )}
            </button>

            {/* SNOWBALL */}
            <button
              type="button"
              onClick={() => handleSelectMode('snowball')}
              className={`relative text-left p-5 rounded-2xl border-2 transition-all group cursor-pointer ${
                selectedMode === 'snowball'
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              {assessedStrategy === 'snowball' && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 fill-white" /> Rekomendasi Anda
                </span>
              )}
              {selectedMode === 'snowball' && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedMode === 'snowball' ? 'bg-blue-500' : 'bg-blue-100 group-hover:bg-blue-200'
                } transition`}>
                  <Trophy className={`w-5 h-5 ${selectedMode === 'snowball' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Snowball</p>
                  <p className="text-[10px] text-slate-500">Motivasi & kepuasan cepat</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Bayar minimum ke semua, sisa dana dipusatkan ke pinjaman dengan{' '}
                <strong className="text-blue-700">saldo terkecil</strong> hingga lunas tuntas.
              </p>
              {snowball && !snowball.insufficient && (
                <div className="pt-3 border-t border-blue-100 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">Bebas utang</p>
                    <p className="text-sm font-extrabold text-slate-800">{snowball.totalMonths} bln</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Total bunga</p>
                    <p className="text-sm font-extrabold text-rose-600">{formatRupiah(Math.round(snowball.totalInterest))}</p>
                  </div>
                </div>
              )}
            </button>

          </div>
        </div>
      )}

      {/* ─── BUDGET TIDAK CUKUP ──────────────────────────────────────────────── */}
      {budgetReady && isInsufficient && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-rose-800">Anggaran Belum Mencukupi</p>
            <p className="text-xs text-rose-700 leading-relaxed">
              Minimum pembayaran bunga untuk semua pinjaman adalah{' '}
              <span className="font-bold">{formatRupiah(minRequired)}</span>/bulan.
              Naikkan anggaran bulanan Anda untuk memulai simulasi.
            </p>
          </div>
        </div>
      )}

      {/* ─── LANGKAH 3: HASIL REKOMENDASI (otomatis setelah mode aktif) ────── */}
      {result && !result.insufficient && selectedMode && (
        <div className="space-y-4">

          {/* Banner mode aktif */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${
            selectedMode === 'avalanche'
              ? 'bg-rose-600 border-rose-600'
              : 'bg-blue-600 border-blue-600'
          }`}>
            {selectedMode === 'avalanche'
              ? <Zap className="w-5 h-5 text-white shrink-0" />
              : <Trophy className="w-5 h-5 text-white shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-white">
                Rekomendasi Strategi {selectedMode === 'avalanche' ? 'Avalanche' : 'Snowball'}
              </p>
              <p className="text-[11px] text-white/70 mt-0.5">
                {selectedMode === 'avalanche'
                  ? 'Fokus pelunasan ke pinjaman berbunga tertinggi terlebih dahulu'
                  : 'Fokus pelunasan ke pinjaman bersaldo terkecil terlebih dahulu'}
              </p>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Bebas Utang Dalam
              </span>
              <p className="text-2xl font-extrabold text-slate-900">
                {result.totalMonths}{' '}
                <span className="text-sm font-semibold text-slate-500">bulan</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Tenggat Akhir: <strong className="text-emerald-700">{formatHariBulanTahun(getStepDate(startDate, result.totalMonths)).long}</strong> ({formatHariBulanTahun(getStepDate(startDate, result.totalMonths)).numeric})
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Bunga Terbayar
              </span>
              <p className="text-2xl font-extrabold text-rose-600">
                {formatRupiah(Math.round(result.totalInterest))}
              </p>
              <p className="text-[11px] text-slate-400">
                {((result.totalInterest / totalDebt) * 100).toFixed(1)}% dari total pokok
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Bayar Per Bulan
              </span>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatRupiah(budget)}
              </p>
              <p className="text-[11px] text-slate-400">alokasi dana bulanan</p>
            </div>
          </div>

          {/* Urutan Pelunasan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Urutan Pelunasan yang Direkomendasikan
            </h3>
            <CompletionTimeline order={result.completionOrder} startDate={startDate} />
          </div>

          {/* Prioritas Bulan Ini */}
          <div className={`rounded-2xl p-5 text-white space-y-4 ${
            selectedMode === 'avalanche'
              ? 'bg-gradient-to-br from-rose-700 to-rose-900'
              : 'bg-gradient-to-br from-blue-800 to-indigo-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-white/80" />
                Langkah Prioritas Bulan Ini (Step 1)
              </h3>
              <span className="text-[11px] text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto">
                Tenggat Step 1: {formatHariBulanTahun(getStepDate(startDate, 1)).long} ({formatHariBulanTahun(getStepDate(startDate, 1)).numeric})
              </span>
            </div>
            <div className="space-y-2.5">
              {result.schedule[0]?.payments
                .slice()
                .sort((a, b) => b.payment - a.payment)
                .map((p, idx) => {
                  const matchingLoan = loansWithDetails.find((l) => l.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl ${
                        idx === 0
                          ? 'bg-white/20 border border-white/30'
                          : 'bg-white/8 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-white text-slate-800' : 'bg-white/20 text-white/80'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-white truncate">{p.platform}</p>
                            {matchingLoan?.urgentInfo?.isUrgent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-900 font-extrabold flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> Mepet ({formatHariBulanTahun(matchingLoan.dueDate).numeric})
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/70">
                            Bunga: {formatRupiah(Math.round(p.interest))} · Pokok: {formatRupiah(Math.round(p.principal))}
                          </p>
                          {matchingLoan?.dueDate && (
                            <p className="text-[10px] text-white/90 font-medium mt-0.5">
                              Tenggat Pinjaman: {formatHariBulanTahun(matchingLoan.dueDate).long} ({formatHariBulanTahun(matchingLoan.dueDate).numeric})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-extrabold text-white">{formatRupiah(Math.round(p.payment))}</p>
                        {idx === 0 && (
                          <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded text-white/90">
                            PRIORITAS #1
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="text-[11px] text-white/50 text-center pt-1">
              Total dialokasikan bulan ini: {formatRupiah(budget)}
            </p>
          </div>

          {/* Jadwal Bulanan (toggle) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSchedule((v) => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="text-sm font-bold text-slate-800">
                Lihat Jadwal Bulanan Lengkap
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                {result.totalMonths} bulan
                {showSchedule
                  ? <ChevronUp className="w-4 h-4" />
                  : <ChevronDown className="w-4 h-4" />
                }
              </span>
            </button>

            {showSchedule && (
              <div className="border-t border-slate-100 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Step</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                        Tenggat Pinjaman (Hari-Bulan-Tahun)
                      </th>
                      {activeLoans.map((l) => (
                        <th key={l.id} className="px-4 py-2.5 text-right font-semibold text-slate-600 whitespace-nowrap">
                          {l.platform}
                        </th>
                      ))}
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-600 whitespace-nowrap">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.slice(0, 24).map((row) => {
                      const stepDate = getStepDate(startDate, row.month);
                      const dateFmt = formatHariBulanTahun(stepDate);
                      return (
                        <tr key={row.month} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-mono font-bold text-slate-600 whitespace-nowrap">
                            Step {row.month}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="font-semibold text-slate-700">
                              {dateFmt.long}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {dateFmt.numeric}
                            </div>
                          </td>
                          {activeLoans.map((l) => {
                            const p = row.payments.find((x) => x.id === l.id);
                            const done = p?.balanceAfter === 0;
                            return (
                              <td key={l.id} className="px-4 py-2 text-right whitespace-nowrap">
                                {p ? (
                                  <span className={done ? 'text-emerald-600 font-semibold' : 'text-slate-700'}>
                                    {done && p.payment === 0 ? '✓ Lunas' : formatRupiah(Math.round(p.payment))}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-semibold">✓ Lunas</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-2 text-right font-bold text-slate-800 whitespace-nowrap">
                            {formatRupiah(row.payments.reduce((s, p) => s + Math.round(p.payment), 0))}
                          </td>
                        </tr>
                      );
                    })}
                    {result.schedule.length > 24 && (
                      <tr>
                        <td colSpan={activeLoans.length + 3} className="px-4 py-3 text-center text-slate-400 italic text-xs">
                          ... dan {result.schedule.length - 24} bulan berikutnya hingga bulan ke-{result.totalMonths}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Simpan & Reset */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {saveStatus && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" /> {saveStatus}
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => { setMonthlyBudget(''); setShowSchedule(false); setSaveStatus(''); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ulangi
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition cursor-pointer ${
                  selectedMode === 'avalanche'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Save className="w-3.5 h-3.5" /> Simpan Rencana Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder sebelum budget diisi */}
      {!budgetReady && (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
          <ArrowRight className="w-8 h-8 text-slate-200 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            Isi kemampuan bayar bulanan di atas
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Sistem secara otomatis telah menyesuaikan mode pelunasan dengan kepribadian dan kondisi Anda.
          </p>
        </div>
      )}

      {/* Modal 5 Pertanyaan jika user ingin mengulang atau mengisi asesmen */}
      <RepaymentAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        userId={userId}
        onComplete={(newStrategy) => {
          setSelectedMode(newStrategy);
          setIsAssessmentModalOpen(false);
        }}
      />

      {/* Modal Edit Jumlah Saldo */}
      <EditBalanceModal
        isOpen={isEditBalanceModalOpen}
        onClose={() => setIsEditBalanceModalOpen(false)}
        userId={userId}
        onSaved={() => setProfileRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
