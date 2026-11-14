import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Percent,
  CheckCircle2,
  TrendingDown,
  Trash2,
  AlertCircle,
  Upload,
  X,
  FileCheck,
  Clock,
  AlertTriangle,
  Wallet,
  Sparkles,
  CalendarDays,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getLoansByUser,
  createLoan,
  deleteLoan,
  getPaymentsByLoan,
  createPayment,
  attachProofToPayment,
  getFinancialProfileByUser,
  saveFinancialProfile,
} from '../../services/storage.js';
import { compressImage } from '../../utils/imageCompressor.js';
import {
  formatRupiah,
  checkUrgentDue,
  calculateLoanEstimatedInterest,
} from '../../utils/loanCalculations.js';
import RepaymentPlanner from '../../components/RepaymentPlanner.jsx';
import EditBalanceModal from '../../components/EditBalanceModal.jsx';

// ─── HELPERS KALKULASI CICILAN ────────────────────────────────────────────────

/**
 * Hitung cicilan per bulan & total bayar.
 * @param {object} p
 * @param {number} p.principal       - Pinjaman pokok (Rp)
 * @param {number} p.ratePerMonth    - Bunga per bulan (desimal, misal 0.02)
 * @param {number} p.tenor           - Tenor (bulan)
 * @param {string} p.interestType    - 'efektif' | 'flat'
 * @param {number} p.adminFee        - Biaya admin total (Rp)
 * @param {number} p.latePenaltyPct  - Denda telat (% dari cicilan)
 * @returns {{ monthlyPayment, totalPayment, totalInterestAndFee, monthlyInterest, monthlyPrincipal }}
 */
function calcLoan({ principal, ratePerMonth, tenor, interestType, adminFee = 0 }) {
  if (!principal || !tenor || tenor <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterestAndFee: 0, valid: false };
  }

  let monthlyPayment = 0;

  if (interestType === 'flat') {
    // Flat: bunga dihitung dari pokok awal, dibagi rata tiap bulan
    const monthlyInterest = principal * ratePerMonth;
    const monthlyPrincipal = principal / tenor;
    monthlyPayment = monthlyPrincipal + monthlyInterest;
  } else {
    // Efektif / Anuitas (PMT formula)
    if (ratePerMonth === 0) {
      monthlyPayment = principal / tenor;
    } else {
      const r = ratePerMonth;
      monthlyPayment = (principal * r * Math.pow(1 + r, tenor)) / (Math.pow(1 + r, tenor) - 1);
    }
  }

  monthlyPayment = Math.ceil(monthlyPayment);
  const totalPayment = monthlyPayment * tenor + adminFee;
  const totalInterestAndFee = totalPayment - principal;

  return { monthlyPayment, totalPayment, totalInterestAndFee, valid: true };
}

/** Format tanggal DD-MM-YYYY */
function formatTanggal(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/** Tambah bulan ke tanggal string, kembalikan DD-MM-YYYY */
function addMonthsFormatted(isoDate, monthsToAdd) {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + monthsToAdd);
  return formatTanggal(d);
}

// Nama bulan Indonesia
const BULAN_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

/** Kembalikan "DD Bulan YYYY" dari tanggal */
function formatTanggalPanjang(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── KONSTANTA FORM ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  platform: '',
  ojkStatus: '',           // 'ojk' | 'ilegal' | 'tidak_tahu'
  tenor: '',
  interestRate: '',        // % per bulan
  interestType: '',        // 'efektif' | 'flat'
  adminFee: '',
  latePenalty: '',         // % dari cicilan
  dueDateDay: '',          // 1–31 (hari jatuh tempo tiap bulan)
  currentBalance: '',      // pokok pinjaman
};

const OJK_LABEL = {
  ojk: 'Berizin OJK',
  ilegal: 'Ilegal',
  tidak_tahu: 'Tidak Tahu',
};

// ─── KOMPONEN UTAMA ───────────────────────────────────────────────────────────

export default function LoansPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [activeTab, setActiveTab] = useState('daftar');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isUrgentModalDismissed, setIsUrgentModalDismissed] = useState(false);

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Modal hapus / pelunasan
  const [selectedLoanToDelete, setSelectedLoanToDelete] = useState(null);
  const [loanPayments, setLoanPayments] = useState([]);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const [settlementProofPreview, setSettlementProofPreview] = useState(null);
  const [settlementProofDataUrl, setSettlementProofDataUrl] = useState('');
  const [isCompressingProof, setIsCompressingProof] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const userProfile = useMemo(() => {
    if (!userId) return null;
    return getFinancialProfileByUser(userId);
  }, [userId, refreshKey]);

  const loans = useMemo(() => {
    if (!userId) return [];
    return getLoansByUser(userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userId, refreshKey]);

  const urgentLoans = useMemo(() => {
    return loans
      .filter((l) => l.status === 'aktif' && l.dueDate)
      .map((l) => ({ ...l, ...checkUrgentDue(l.dueDate) }))
      .filter((l) => l.isUrgent)
      .sort((a, b) => (a.diffDays ?? 999) - (b.diffDays ?? 999));
  }, [loans]);

  const stats = useMemo(() => {
    let totalDebt = 0;
    let totalObligation = 0;
    let totalEstimatedInterest = 0;
    let legalCount = 0;
    let illegalCount = 0;
    let unknownCount = 0;

    loans.forEach((l) => {
      if (l.status === 'aktif') {
        const principal = Number(l.currentBalance || l.originalAmount || 0);
        totalDebt += principal;

        if (l.tenor && Number(l.tenor) > 0) {
          const calc = calcLoan({
            principal,
            ratePerMonth: (Number(l.interestRate) || 0) / 100,
            tenor: Number(l.tenor),
            interestType: l.interestType || 'efektif',
            adminFee: Number(l.adminFee) || 0,
          });
          totalObligation += calc.totalPayment;
          totalEstimatedInterest += calc.totalInterestAndFee;
        } else {
          const est = calculateLoanEstimatedInterest(l);
          totalObligation += est.totalObligation;
          totalEstimatedInterest += est.totalInterest;
        }

        const ojk = l.ojkStatus || (l.isOjkRegistered ? 'ojk' : 'ilegal');
        if (ojk === 'ojk') legalCount++;
        else if (ojk === 'ilegal') illegalCount++;
        else unknownCount++;
      }
    });

    return {
      totalDebt,
      totalObligation,
      totalEstimatedInterest,
      legalCount,
      illegalCount,
      unknownCount,
      totalCount: loans.filter((l) => l.status === 'aktif').length,
    };
  }, [loans]);

  // ── Kalkulasi Live Form ───────────────────────────────────────────────────

  const liveCalc = useMemo(() => {
    const principal = Number(form.currentBalance) || 0;
    const ratePerMonth = (Number(form.interestRate) || 0) / 100;
    const tenor = Number(form.tenor) || 0;
    const adminFee = Number(form.adminFee) || 0;
    const interestType = form.interestType || 'efektif';

    if (!principal || !tenor || !form.interestRate) return null;

    return calcLoan({ principal, ratePerMonth, tenor, interestType, adminFee });
  }, [form.currentBalance, form.interestRate, form.tenor, form.interestType, form.adminFee]);

  // Sisa uang bulanan setelah cicilan dikurangi
  const userBalance = Number(userProfile?.userBalance) || 0;
  const monthlyExpense = Number(userProfile?.monthlyExpense) || 0;
  const afterInstallment = userBalance > 0 && liveCalc?.valid
    ? userBalance - (liveCalc.monthlyPayment + monthlyExpense)
    : null;

  // ── Form handlers ─────────────────────────────────────────────────────────

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Hapus error field yang baru diisi
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validasi semua field wajib
  const validateForm = () => {
    const required = {
      platform: 'Nama pinjaman',
      ojkStatus: 'Status penyedia',
      tenor: 'Tenor (bulan)',
      interestRate: 'Bunga per bulan',
      interestType: 'Jenis bunga',
      adminFee: 'Biaya admin',
      latePenalty: 'Denda telat',
      dueDateDay: 'Tanggal jatuh tempo',
      currentBalance: 'Jumlah pinjaman pokok',
    };

    const errors = {};
    Object.entries(required).forEach(([key, label]) => {
      const val = form[key];
      if (!val || String(val).trim() === '') {
        errors[key] = `${label} wajib diisi.`;
      }
    });

    // Range validasi
    if (form.dueDateDay && (Number(form.dueDateDay) < 1 || Number(form.dueDateDay) > 31)) {
      errors.dueDateDay = 'Tanggal jatuh tempo harus antara 1–31.';
    }
    if (form.tenor && Number(form.tenor) <= 0) {
      errors.tenor = 'Tenor harus lebih dari 0.';
    }
    if (form.interestRate && Number(form.interestRate) < 0) {
      errors.interestRate = 'Bunga tidak boleh negatif.';
    }
    if (form.currentBalance && Number(form.currentBalance) <= 0) {
      errors.currentBalance = 'Jumlah pinjaman harus lebih dari 0.';
    }

    return errors;
  };

  const handleCreateLoan = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Buat dueDate dari hari ini + tenor (pakai tanggal jatuh tempo per bulan)
    const now = new Date();
    const startIso = now.toISOString().slice(0, 10);
    // Jatuh tempo: N bulan dari sekarang, pada tanggal dueDateDay
    const dueD = new Date(now);
    dueD.setMonth(dueD.getMonth() + Number(form.tenor));
    dueD.setDate(Math.min(Number(form.dueDateDay), 28)); // cap 28 untuk keamanan
    const dueIso = dueD.toISOString().slice(0, 10);

    const isOjkRegistered = form.ojkStatus === 'ojk';

    const res = createLoan({
      userId,
      platform: form.platform.trim(),
      originalAmount: Number(form.currentBalance),
      currentBalance: Number(form.currentBalance),
      interestRate: Number(form.interestRate),
      interestPeriod: 'bulanan',
      interestType: form.interestType,
      adminFee: Number(form.adminFee) || 0,
      latePenalty: Number(form.latePenalty) || 0,
      dueDateDay: Number(form.dueDateDay),
      tenor: Number(form.tenor),
      loanStartDate: startIso,
      dueDate: dueIso,
      isOjkRegistered,
      ojkStatus: form.ojkStatus,
      status: 'aktif',
    });

    if (res && res.id) {
      setForm(EMPTY_FORM);
      setFormErrors({});
      setIsFormOpen(false);
      setRefreshKey((k) => k + 1);
      setStatusMsg('Pinjaman berhasil dicatat.');
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  // ── Modal Hapus ───────────────────────────────────────────────────────────

  const handleOpenDeleteModal = (loan) => {
    setSelectedLoanToDelete(loan);
    setLoanPayments(getPaymentsByLoan(loan.id) || []);
    setSettlementAmount(loan.currentBalance || loan.originalAmount || '');
    setSettlementDate(new Date().toISOString().slice(0, 10));
    setSettlementProofPreview(null);
    setSettlementProofDataUrl('');
    setDeleteError('');
  };

  const handleCloseDeleteModal = () => {
    setSelectedLoanToDelete(null);
    setLoanPayments([]);
    setSettlementProofPreview(null);
    setSettlementProofDataUrl('');
    setDeleteError('');
    setIsSubmittingDelete(false);
  };

  const handleProofFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDeleteError('');
    setIsCompressingProof(true);
    try {
      const { dataUrl } = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7, maxKb: 300 });
      setSettlementProofPreview(dataUrl);
      setSettlementProofDataUrl(dataUrl);
    } catch (err) {
      setDeleteError(err.message || 'Gagal memproses gambar bukti pelunasan.');
    } finally {
      setIsCompressingProof(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedLoanToDelete) return;
    setDeleteError('');
    setIsSubmittingDelete(true);

    const hasProof = loanPayments.some((p) => Boolean(p.proofFileName));

    if (hasProof) {
      const ok = deleteLoan(selectedLoanToDelete.id);
      if (ok) {
        setStatusMsg(`Pinjaman ${selectedLoanToDelete.platform} berhasil diselesaikan.`);
        handleCloseDeleteModal();
        setRefreshKey((k) => k + 1);
        setTimeout(() => setStatusMsg(''), 4000);
      } else {
        setDeleteError('Gagal menghapus pinjaman.');
        setIsSubmittingDelete(false);
      }
    } else {
      if (!settlementProofDataUrl) {
        setDeleteError('Wajib melampirkan bukti pelunasan sebelum menghapus.');
        setIsSubmittingDelete(false);
        return;
      }
      if (!settlementAmount || Number(settlementAmount) <= 0) {
        setDeleteError('Nominal pelunasan harus berupa angka positif.');
        setIsSubmittingDelete(false);
        return;
      }
      const payRes = createPayment({
        loanId: selectedLoanToDelete.id,
        userId,
        amount: Number(settlementAmount),
        paymentDate: settlementDate,
        paymentMethod: 'transfer_bank',
        notes: `Pelunasan akhir pinjaman ${selectedLoanToDelete.platform}`,
      });
      if (payRes && payRes.id) {
        attachProofToPayment(payRes.id, settlementProofDataUrl);
      }
      const ok = deleteLoan(selectedLoanToDelete.id);
      if (ok) {
        setStatusMsg(`Bukti pelunasan tersimpan dan pinjaman ${selectedLoanToDelete.platform} dihapus.`);
        handleCloseDeleteModal();
        setRefreshKey((k) => k + 1);
        setTimeout(() => setStatusMsg(''), 4000);
      } else {
        setDeleteError('Gagal menghapus pinjaman.');
        setIsSubmittingDelete(false);
      }
    }
  };

  // ── Render Helper ─────────────────────────────────────────────────────────

  const FieldError = ({ name }) =>
    formErrors[name] ? (
      <span className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {formErrors[name]}
      </span>
    ) : null;

  const inputCls = (name) =>
    `w-full px-3 py-2.5 rounded-xl border text-xs focus:ring-2 focus:outline-none transition ${
      formErrors[name]
        ? 'border-rose-400 bg-rose-50 focus:ring-rose-400/30 focus:border-rose-500'
        : 'border-slate-200 bg-slate-50 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
    }`;

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">

      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Data Pinjaman Saya</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau sisa tagihan, hitung estimasi cicilan, dan rencanakan step pelunasan total utang.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEditBalanceModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Edit Jumlah Saldo</span>
          </button>
          {activeTab === 'daftar' && (
            <button
              type="button"
              onClick={() => { setIsFormOpen((p) => !p); setFormErrors({}); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isFormOpen ? 'Tutup Formulir' : 'Tambah Pinjaman'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── BANNER DEADLINE MEPET ──────────────────────────────────────────── */}
      {urgentLoans.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Peringatan: {urgentLoans.length} Tagihan Mendekati atau Melewati Jatuh Tempo!
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Segera atur pelunasan untuk menghindari denda berjalan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUrgentModalDismissed(false)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
          >
            Buka Notifikasi
          </button>
        </div>
      )}

      {/* ─── STATUS MSG ────────────────────────────────────────────────────── */}
      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ─── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saldo Pengguna */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Total Saldo Pengguna
            </span>
            <button
              type="button"
              onClick={() => setIsEditBalanceModalOpen(true)}
              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              Edit Saldo
            </button>
          </div>
          <div className="text-xl font-black text-emerald-900 tracking-tight">
            {formatRupiah(userBalance)}
          </div>
          <div className="text-[11px] text-emerald-700/90 font-medium">
            {userBalance > 0
              ? 'Saldo tabungan aktif tersimpan'
              : 'Belum diisi — klik Edit Saldo untuk mengisi'}
          </div>
        </div>

        {/* Card 2: Total Pokok Pinjaman + Keterangan Total Pokok + Bunga */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              Total Pokok Pinjaman
            </span>
            <span className="text-[10px] text-blue-700 font-bold bg-blue-100/70 px-2 py-0.5 rounded-full">
              {stats.totalCount} Aktif
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatRupiah(stats.totalDebt)}
          </div>
          <div className="pt-1.5 border-t border-blue-100 text-[11px]">
            <span className="text-slate-500 font-medium block">Total Pokok Pinjaman + Bunga:</span>
            <span className="text-xs font-black text-blue-900 block mt-0.5">
              {formatRupiah(stats.totalObligation)}
            </span>
          </div>
        </div>

        {/* Card 3: Berizin OJK */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Berizin OJK</span>
          </div>
          <div className="text-xl font-black text-emerald-900">{stats.legalCount} Pinjaman</div>
          <span className="text-[11px] text-slate-500 block">Sesuai batas bunga regulasi</span>
        </div>

        {/* Card 4: Ilegal & Belum Jelas */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ilegal / Belum Jelas</span>
          </div>
          <div className="text-xl font-black text-rose-900">{stats.illegalCount + stats.unknownCount} Pinjaman</div>
          <span className="text-[11px] text-rose-700 block">
            {stats.illegalCount} ilegal · {stats.unknownCount} belum jelas
          </span>
        </div>
      </div>

      {/* ─── TABS ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('daftar')}
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 flex-1 sm:flex-initial ${
            activeTab === 'daftar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Daftar Pinjaman
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('simulasi'); setIsFormOpen(false); }}
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 flex-1 sm:flex-initial ${
            activeTab === 'simulasi' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Rencana Pelunasan
          {loans.some((l) => l.status === 'aktif') && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold">
              {loans.filter((l) => l.status === 'aktif').length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB: DAFTAR PINJAMAN ───────────────────────────────────────────── */}
      {activeTab === 'daftar' && (
        <>
          {/* ── FORM TAMBAH PINJAMAN ─────────────────────────────────────── */}
          {isFormOpen && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
              {/* Header Form */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center gap-2.5">
                  <img src="/assets/navbar.svg" alt="ByeBills" className="h-7 w-auto brightness-0 invert" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Tambah Pinjaman</h2>
                    <p className="text-[11px] text-blue-100">Lengkapi semua data untuk kalkulasi cicilan otomatis</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setFormErrors({}); }}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLoan} className="p-6 space-y-6" noValidate>

                {/* ── Grid Input Utama ──────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Nama Pinjaman */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Nama Pinjaman <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="platform"
                      value={form.platform}
                      onChange={handleFormChange}
                      placeholder="cth: AdaKami, KreditPintar, GoPaylater"
                      className={inputCls('platform')}
                    />
                    <FieldError name="platform" />
                  </div>

                  {/* Status Penyedia */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Status Penyedia <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="ojkStatus"
                      value={form.ojkStatus}
                      onChange={handleFormChange}
                      className={inputCls('ojkStatus')}
                    >
                      <option value="">— Pilih status —</option>
                      <option value="ojk">Berizin OJK</option>
                      <option value="ilegal">Ilegal</option>
                      <option value="tidak_tahu">Tidak Tahu</option>
                    </select>
                    <FieldError name="ojkStatus" />
                  </div>

                  {/* Jumlah Pinjaman Pokok */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Jumlah Pinjaman Pokok (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="currentBalance"
                      value={form.currentBalance}
                      onChange={handleFormChange}
                      placeholder="cth: 2000000"
                      min="1"
                      className={inputCls('currentBalance')}
                    />
                    {form.currentBalance && Number(form.currentBalance) > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        = {formatRupiah(form.currentBalance)}
                      </span>
                    )}
                    <FieldError name="currentBalance" />
                  </div>

                  {/* Tenor */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Tenor (bulan) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="tenor"
                      value={form.tenor}
                      onChange={handleFormChange}
                      placeholder="cth: 12"
                      min="1"
                      max="360"
                      className={inputCls('tenor')}
                    />
                    <FieldError name="tenor" />
                  </div>

                  {/* Bunga per Bulan */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Bunga per Bulan (%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="interestRate"
                      value={form.interestRate}
                      onChange={handleFormChange}
                      placeholder="cth: 2.5"
                      min="0"
                      step="0.01"
                      className={inputCls('interestRate')}
                    />
                    <FieldError name="interestRate" />
                  </div>

                  {/* Jenis Bunga */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Jenis Bunga <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="interestType"
                      value={form.interestType}
                      onChange={handleFormChange}
                      className={inputCls('interestType')}
                    >
                      <option value="">— Pilih jenis bunga —</option>
                      <option value="efektif">Efektif (Anuitas)</option>
                      <option value="flat">Flat</option>
                    </select>
                    {form.interestType && (
                      <span className="text-[10px] text-slate-500">
                        {form.interestType === 'efektif'
                          ? 'Cicilan tetap, bunga dihitung dari sisa pokok tiap bulan.'
                          : 'Bunga dihitung dari pokok awal, dibagi rata tiap bulan.'}
                      </span>
                    )}
                    <FieldError name="interestType" />
                  </div>

                  {/* Biaya Admin */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Biaya Admin Total (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="adminFee"
                      value={form.adminFee}
                      onChange={handleFormChange}
                      placeholder="cth: 150000 (isi 0 jika tidak ada)"
                      min="0"
                      className={inputCls('adminFee')}
                    />
                    <FieldError name="adminFee" />
                  </div>

                  {/* Denda Telat */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Denda Telat (% dari cicilan) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="latePenalty"
                      value={form.latePenalty}
                      onChange={handleFormChange}
                      placeholder="cth: 5 (isi 0 jika tidak ada)"
                      min="0"
                      step="0.1"
                      className={inputCls('latePenalty')}
                    />
                    {form.latePenalty && liveCalc?.valid && (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        = {formatRupiah(liveCalc.monthlyPayment * (Number(form.latePenalty) / 100))} / bulan jika telat
                      </span>
                    )}
                    <FieldError name="latePenalty" />
                  </div>

                  {/* Tanggal Jatuh Tempo */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Tanggal Jatuh Tempo Tiap Bulan (1–31) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="dueDateDay"
                        value={form.dueDateDay}
                        onChange={handleFormChange}
                        placeholder="cth: 15"
                        min="1"
                        max="31"
                        className={`${inputCls('dueDateDay')} max-w-[120px]`}
                      />
                      {form.dueDateDay && !formErrors.dueDateDay && (
                        <span className="text-[11px] text-slate-500">
                          → Jatuh tempo tiap tanggal <strong>{form.dueDateDay}</strong> setiap bulan
                        </span>
                      )}
                    </div>
                    <FieldError name="dueDateDay" />
                  </div>
                </div>

                {/* ── Peringatan field belum diisi (summary) ─────────────── */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Ada {Object.keys(formErrors).length} field yang belum diisi atau tidak valid:</p>
                      <ul className="mt-1 space-y-0.5 list-disc list-inside text-rose-700">
                        {Object.values(formErrors).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* ── Kalkulasi Live ─────────────────────────────────────── */}
                {liveCalc && liveCalc.valid && (
                  <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 overflow-hidden">
                    <div className="px-5 py-3 bg-blue-600 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white">Kesimpulan Kalkulasi Pinjaman</span>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Baris 1: Cicilan & Total */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3.5 border border-blue-100 space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Cicilan per Bulan</span>
                          <p className="text-lg font-extrabold text-blue-700">{formatRupiah(liveCalc.monthlyPayment)}</p>
                          <span className="text-[10px] text-slate-400">selama {form.tenor} bulan</span>
                        </div>
                        <div className="bg-white rounded-xl p-3.5 border border-blue-100 space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Bunga & Biaya</span>
                          <p className="text-lg font-extrabold text-rose-600">+{formatRupiah(liveCalc.totalInterestAndFee)}</p>
                          <span className="text-[10px] text-slate-400">
                            termasuk admin {formatRupiah(Number(form.adminFee) || 0)}
                          </span>
                        </div>
                        <div className="bg-blue-600 rounded-xl p-3.5 space-y-0.5">
                          <span className="text-[10px] text-blue-100 font-medium">Total yang Harus Dibayar</span>
                          <p className="text-lg font-extrabold text-white">{formatRupiah(liveCalc.totalPayment)}</p>
                          <span className="text-[10px] text-blue-200">pokok + bunga + biaya</span>
                        </div>
                      </div>

                      {/* Baris 2: Sisa uang bulanan */}
                      {userBalance > 0 && (
                        <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                          afterInstallment !== null && afterInstallment >= 0
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-rose-50 border-rose-200'
                        }`}>
                          <Wallet className={`w-4 h-4 shrink-0 mt-0.5 ${afterInstallment >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                          <div>
                            <p className={`text-xs font-bold ${afterInstallment >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                              {afterInstallment !== null
                                ? `Jika disimpan, sisa uang bulananmu jadi ${formatRupiah(Math.max(afterInstallment, 0))}`
                                : 'Masukkan saldo untuk melihat dampak ke keuangan bulanan'}
                            </p>
                            <p className={`text-[11px] mt-0.5 ${afterInstallment >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {afterInstallment !== null
                                ? afterInstallment >= 0
                                  ? `✓ Status: Aman — saldo bulananmu masih positif setelah cicilan & kebutuhan pokok.`
                                  : `⚠ Status: Perlu Perhatian — cicilan + kebutuhan pokok melebihi saldo bulananmu sebesar ${formatRupiah(Math.abs(afterInstallment))}.`
                                : ''}
                            </p>
                            {monthlyExpense > 0 && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                Kalkulasi: Saldo {formatRupiah(userBalance)} − Cicilan {formatRupiah(liveCalc.monthlyPayment)} − Kebutuhan pokok {formatRupiah(monthlyExpense)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Baris 3: Jadwal Tenggat per Step Bulan */}
                      {form.tenor && form.dueDateDay && Number(form.tenor) > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                            Tenggat Jatuh Tempo per Step Bulan
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                            {Array.from({ length: Math.min(Number(form.tenor), 24) }, (_, i) => {
                              const stepNum = i + 1;
                              const now = new Date();
                              const stepDate = new Date(now);
                              stepDate.setMonth(now.getMonth() + stepNum);
                              stepDate.setDate(Math.min(Number(form.dueDateDay), 28));
                              return (
                                <div
                                  key={stepNum}
                                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] ${
                                    stepNum === Number(form.tenor)
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className={`font-bold shrink-0 ${stepNum === Number(form.tenor) ? 'text-blue-100' : 'text-slate-400'}`}>
                                    Bln {stepNum}
                                  </span>
                                  <span className="font-semibold truncate">
                                    {formatTanggal(stepDate)}
                                  </span>
                                </div>
                              );
                            })}
                            {Number(form.tenor) > 24 && (
                              <div className="col-span-2 sm:col-span-3 text-center text-[10px] text-slate-400 py-1">
                                ... dan {Number(form.tenor) - 24} bulan berikutnya
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Info jika saldo belum diset */}
                {!userBalance && liveCalc?.valid && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Belum ada saldo tersimpan.{' '}
                      <button
                        type="button"
                        onClick={() => setIsEditBalanceModalOpen(true)}
                        className="text-emerald-600 font-semibold hover:underline"
                      >
                        Klik di sini
                      </button>{' '}
                      untuk mengisi saldo agar dampak ke keuangan bulanan bisa dihitung.
                    </span>
                  </div>
                )}

                {/* ── Tombol Aksi ───────────────────────────────────────── */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsFormOpen(false); setForm(EMPTY_FORM); setFormErrors({}); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Simpan Pinjaman
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Grid Pinjaman ──────────────────────────────────────────── */}
          {loans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Data Pinjaman</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Catat pinjaman Anda untuk mendapatkan rekapitulasi beban utang dan bantuan restrukturisasi.
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Tambah Pinjaman Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => {
                const urgentInfo = checkUrgentDue(loan.dueDate);

                // Hitung ulang cicilan dari data tersimpan
                const principal = loan.originalAmount || loan.currentBalance || 0;
                const ratePerMonth = (Number(loan.interestRate) || 0) / 100;
                const tenor = loan.tenor || 0;
                const adminFee = loan.adminFee || 0;
                const interestType = loan.interestType || 'efektif';
                const calc = tenor > 0
                  ? calcLoan({ principal, ratePerMonth, tenor, interestType, adminFee })
                  : null;

                // Status OJK badge
                const ojkStatus = loan.ojkStatus || (loan.isOjkRegistered ? 'ojk' : 'ilegal');
                const ojkBadgeStyle = {
                  ojk: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  ilegal: 'bg-rose-50 text-rose-700 border-rose-200',
                  tidak_tahu: 'bg-slate-50 text-slate-600 border-slate-200',
                }[ojkStatus] || 'bg-slate-50 text-slate-600 border-slate-200';

                return (
                  <div
                    key={loan.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition space-y-3 relative ${
                      urgentInfo.isUrgent
                        ? 'border-amber-300 ring-1 ring-amber-200'
                        : 'border-slate-200/80 hover:border-blue-300'
                    }`}
                  >
                    {urgentInfo.isUrgent && (
                      <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold flex items-center gap-1 shadow-xs">
                        <Clock className="w-3 h-3" />
                        {urgentInfo.isOverdue
                          ? `Terlewat ${Math.abs(urgentInfo.diffDays)} hari!`
                          : urgentInfo.isToday
                          ? 'Hari Ini!'
                          : `${urgentInfo.diffDays} hari lagi`}
                      </div>
                    )}

                    {/* Nama & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{loan.platform}</h3>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-1 border ${ojkBadgeStyle}`}>
                          {OJK_LABEL[ojkStatus] || ojkStatus}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                        {loan.status}
                      </span>
                    </div>

                    {/* Angka-angka */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Pokok:</span>
                        <span className="text-sm font-bold text-slate-800">{formatRupiah(loan.currentBalance)}</span>
                      </div>
                      {calc?.valid && (
                        <>
                          <div className="flex items-baseline justify-between">
                            <span className="text-[11px] text-slate-400 font-medium">Cicilan/bulan:</span>
                            <span className="text-xs font-semibold text-blue-700">{formatRupiah(calc.monthlyPayment)}</span>
                          </div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-700">Total Bayar:</span>
                            <span className="text-sm font-extrabold text-blue-900">{formatRupiah(calc.totalPayment)}</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-[11px] text-slate-400">Bunga & Biaya:</span>
                            <span className="text-xs font-semibold text-rose-600">+{formatRupiah(calc.totalInterestAndFee)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Detail */}
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3 text-slate-400" />
                          {loan.interestRate}%/bln · {loan.interestType === 'flat' ? 'Flat' : 'Efektif'}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          Tenor: {loan.tenor ? `${loan.tenor} bln` : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Tempo tgl {loan.dueDateDay || '-'} tiap bulan
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Lunas: {formatTanggal(loan.dueDate)}
                        </span>
                      </div>
                      {loan.latePenalty > 0 && (
                        <div className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Denda telat: {loan.latePenalty}% dari cicilan
                        </div>
                      )}
                    </div>

                    {/* Tombol Hapus */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(loan)}
                        className="w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Selesaikan & Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA ke Simulasi */}
          {loans.some((l) => l.status === 'aktif') && (
            <div
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-blue-400 transition"
              onClick={() => setActiveTab('simulasi')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTab('simulasi')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Buat Rencana Pelunasan</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih prioritas Snowball/Avalanche dan atur target bulan pelunasan Anda.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 whitespace-nowrap shrink-0 self-end sm:self-auto">
                Buka Rencana Pelunasan →
              </span>
            </div>
          )}
        </>
      )}

      {/* ─── TAB: RENCANA PELUNASAN ─────────────────────────────────────────── */}
      {activeTab === 'simulasi' && (
        <RepaymentPlanner loans={loans} userId={userId} />
      )}

      {/* ─── MODAL KONFIRMASI HAPUS PINJAMAN ────────────────────────────────── */}
      {selectedLoanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold">Selesaikan & Hapus Pinjaman</h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedLoanToDelete.platform}</h3>
                  <span className="text-[11px] text-slate-500">
                    Pokok: {formatRupiah(selectedLoanToDelete.originalAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Sisa Tagihan</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatRupiah(selectedLoanToDelete.currentBalance)}
                  </span>
                </div>
              </div>
            </div>

            {loanPayments.some((p) => Boolean(p.proofFileName)) ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Bukti Pembayaran Terdeteksi!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Pinjaman ini sudah memiliki bukti transfer yang tersimpan.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Yakin ingin menghapus pinjaman <strong>{selectedLoanToDelete.platform}</strong>?
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Bukti Pelunasan Belum Ditemukan</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Lampirkan bukti pembayaran/transfer sebelum menghapus pinjaman.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nominal Pelunasan (Rp)</label>
                    <input
                      type="number"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      placeholder="Nominal pelunasan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tanggal Pelunasan</label>
                    <input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Unggah Bukti Transfer / Pelunasan</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center transition">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        onChange={handleProofFileChange}
                        className="hidden"
                        id="settlement-proof-upload"
                        disabled={isCompressingProof}
                      />
                      <label htmlFor="settlement-proof-upload" className="cursor-pointer block">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs font-medium text-blue-600 hover:underline">
                          {isCompressingProof ? 'Mengompresi gambar...' : 'Klik untuk memilih file bukti transfer'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          JPG, PNG, atau WebP (otomatis dikompresi &lt; 300KB)
                        </span>
                      </label>
                    </div>
                    {settlementProofPreview && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                        <img src={settlementProofPreview} alt="Preview Bukti" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" /> Bukti siap dilampirkan
                          </span>
                          <span className="text-[10px] text-slate-400">Tersimpan dalam format terkompresi</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete || isCompressingProof}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isSubmittingDelete
                    ? 'Memproses...'
                    : loanPayments.some((p) => Boolean(p.proofFileName))
                    ? 'Hapus Pinjaman'
                    : 'Simpan Bukti & Hapus'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL PERINGATAN DEADLINE MEPET ────────────────────────────────── */}
      {urgentLoans.length > 0 && !isUrgentModalDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Perhatian Segera
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-1">
                    Deadline Tagihan Sudah Mepet!
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUrgentModalDismissed(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ada <strong>{urgentLoans.length} pinjaman</strong> yang mendekati atau melewati jatuh tempo. Segera lakukan pelunasan.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {urgentLoans.map((uLoan) => (
                <div key={uLoan.id} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{uLoan.platform}</span>
                      <span className={`text-[9px] px-1.5 rounded font-semibold ${
                        uLoan.ojkStatus === 'ojk'
                          ? 'bg-emerald-100 text-emerald-800'
                          : uLoan.ojkStatus === 'ilegal'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {OJK_LABEL[uLoan.ojkStatus || (uLoan.isOjkRegistered ? 'ojk' : 'ilegal')]}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      Tempo: {formatTanggal(uLoan.dueDate)} (
                      <strong className={uLoan.isOverdue ? 'text-rose-600' : 'text-amber-700'}>
                        {uLoan.isOverdue
                          ? `Terlewat ${Math.abs(uLoan.diffDays)} hari!`
                          : uLoan.isToday
                          ? 'Jatuh tempo HARI INI!'
                          : `${uLoan.diffDays} hari lagi`}
                      </strong>
                      )
                    </p>
                    <p className="text-[10px] text-slate-500">Pokok: {formatRupiah(uLoan.currentBalance)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsUrgentModalDismissed(true); handleOpenDeleteModal(uLoan); }}
                    className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition cursor-pointer shrink-0"
                  >
                    Lunasi
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsUrgentModalDismissed(true); setActiveTab('simulasi'); }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                Lihat Rencana Pelunasan
              </button>
              <button
                type="button"
                onClick={() => setIsUrgentModalDismissed(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Tutup & Ingatkan Nanti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Saldo */}
      <EditBalanceModal
        isOpen={isEditBalanceModalOpen}
        onClose={() => setIsEditBalanceModalOpen(false)}
        userId={userId}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
