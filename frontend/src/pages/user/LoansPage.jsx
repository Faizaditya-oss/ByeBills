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
  ArrowRight,
  Sparkles,
  Info,
  CalendarDays,
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
  calculateLoanEstimatedInterest,
  checkUrgentDue,
} from '../../utils/loanCalculations.js';
import RepaymentPlanner from '../../components/RepaymentPlanner.jsx';
import EditBalanceModal from '../../components/EditBalanceModal.jsx';

export default function LoansPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [activeTab, setActiveTab] = useState('daftar'); // 'daftar' | 'simulasi'
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isUrgentModalDismissed, setIsUrgentModalDismissed] = useState(false);

  const [formData, setFormData] = useState({
    platform: '',
    originalAmount: '',
    currentBalance: '',
    interestRate: '',
    interestPeriod: 'bulanan',
    loanStartDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    isOjkRegistered: false,
    userBalance: '',
    dailyExpense: '',
    monthlyExpense: '',
  });

  // State untuk Modal Hapus / Selesaikan Pinjaman
  const [selectedLoanToDelete, setSelectedLoanToDelete] = useState(null);
  const [loanPayments, setLoanPayments] = useState([]);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const [settlementProofPreview, setSettlementProofPreview] = useState(null);
  const [settlementProofDataUrl, setSettlementProofDataUrl] = useState('');
  const [isCompressingProof, setIsCompressingProof] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const userProfile = useMemo(() => {
    if (!userId) return null;
    return getFinancialProfileByUser(userId);
  }, [userId, refreshKey]);

  const loans = useMemo(() => {
    if (!userId) return [];
    return getLoansByUser(userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userId, refreshKey]);

  // Tagihan yang deadline-nya mepet (H-7 / <= 7 hari atau sudah lewat)
  const urgentLoans = useMemo(() => {
    return loans
      .filter((l) => l.status === 'aktif' && l.dueDate)
      .map((l) => {
        const urgentInfo = checkUrgentDue(l.dueDate);
        const interestInfo = calculateLoanEstimatedInterest(l);
        return {
          ...l,
          ...urgentInfo,
          ...interestInfo,
        };
      })
      .filter((l) => l.isUrgent)
      .sort((a, b) => (a.diffDays ?? 999) - (b.diffDays ?? 999));
  }, [loans]);

  // Statistik Ringkasan (Pokok & Estimasi Total Beserta Bunga)
  const stats = useMemo(() => {
    let totalDebt = 0;
    let totalEstimatedInterest = 0;
    let legalCount = 0;
    let illegalCount = 0;

    loans.forEach((l) => {
      if (l.status === 'aktif') {
        totalDebt += l.currentBalance || 0;
        const interestData = calculateLoanEstimatedInterest(l);
        totalEstimatedInterest += interestData.totalInterest || 0;
        if (l.isOjkRegistered) legalCount++;
        else illegalCount++;
      }
    });

    return {
      totalDebt,
      totalEstimatedInterest,
      totalObligation: totalDebt + totalEstimatedInterest,
      legalCount,
      illegalCount,
      totalCount: loans.filter((l) => l.status === 'aktif').length,
    };
  }, [loans]);

  const handleToggleForm = () => {
    if (!isFormOpen && userProfile) {
      setFormData((prev) => ({
        ...prev,
        userBalance: prev.userBalance || (userProfile.userBalance != null ? String(userProfile.userBalance) : ''),
        dailyExpense: prev.dailyExpense || (userProfile.dailyExpense != null ? String(userProfile.dailyExpense) : ''),
        monthlyExpense: prev.monthlyExpense || (userProfile.monthlyExpense != null ? String(userProfile.monthlyExpense) : ''),
      }));
    }
    setIsFormOpen((prev) => !prev);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === 'dailyExpense') {
      const num = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        dailyExpense: value,
        monthlyExpense: !isNaN(num) && num >= 0 ? String(Math.round(num * 30)) : prev.monthlyExpense,
      }));
      return;
    }

    if (name === 'monthlyExpense') {
      const num = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        monthlyExpense: value,
        dailyExpense: !isNaN(num) && num >= 0 ? String(Math.round(num / 30)) : prev.dailyExpense,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Estimasi Live Bunga & Total untuk Form Tambah Pinjaman
  const liveEstimated = useMemo(() => {
    return calculateLoanEstimatedInterest({
      currentBalance: formData.currentBalance,
      originalAmount: formData.originalAmount,
      interestRate: formData.interestRate,
      interestPeriod: formData.interestPeriod,
      loanStartDate: formData.loanStartDate,
      dueDate: formData.dueDate,
    });
  }, [
    formData.currentBalance,
    formData.originalAmount,
    formData.interestRate,
    formData.interestPeriod,
    formData.loanStartDate,
    formData.dueDate,
  ]);

  const handleCreateLoan = (e) => {
    e.preventDefault();
    if (!formData.platform.trim() || !formData.currentBalance) {
      setStatusMsg('Nama platform dan sisa tagihan wajib diisi.');
      return;
    }

    const res = createLoan({
      userId,
      platform: formData.platform.trim(),
      originalAmount: Number(formData.originalAmount) || Number(formData.currentBalance),
      currentBalance: Number(formData.currentBalance),
      interestRate: Number(formData.interestRate) || 0,
      interestPeriod: formData.interestPeriod || 'bulanan',
      loanStartDate: formData.loanStartDate || new Date().toISOString().slice(0, 10),
      dueDate: formData.dueDate || new Date().toISOString().slice(0, 10),
      isOjkRegistered: Boolean(formData.isOjkRegistered),
      status: 'aktif',
      userBalanceAtEntry: Number(formData.userBalance) || 0,
      dailyExpense: Number(formData.dailyExpense) || 0,
      monthlyExpense: Number(formData.monthlyExpense) || 0,
    });

    if (res && res.id) {
      if (userId && (formData.userBalance || formData.dailyExpense || formData.monthlyExpense)) {
        saveFinancialProfile(userId, {
          userBalance: Number(formData.userBalance) || 0,
          dailyExpense: Number(formData.dailyExpense) || 0,
          monthlyExpense: Number(formData.monthlyExpense) || 0,
        });
      }

      setFormData({
        platform: '',
        originalAmount: '',
        currentBalance: '',
        interestRate: '',
        interestPeriod: 'bulanan',
        loanStartDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        isOjkRegistered: false,
        userBalance: '',
        dailyExpense: '',
        monthlyExpense: '',
      });
      setIsFormOpen(false);
      setRefreshKey((k) => k + 1);
      setStatusMsg('Data pinjaman baru & profil kondisi keuangan berhasil dicatat.');
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  const handleOpenDeleteModal = (loan) => {
    setSelectedLoanToDelete(loan);
    const payments = getPaymentsByLoan(loan.id) || [];
    setLoanPayments(payments);
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
      const { dataUrl } = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7,
        maxKb: 300,
      });
      setSettlementProofPreview(dataUrl);
      setSettlementProofDataUrl(dataUrl);
    } catch (err) {
      console.error('Gagal mengompresi gambar bukti:', err);
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
        setStatusMsg(`Pinjaman ${selectedLoanToDelete.platform} berhasil diselesaikan dan riwayat telah dihapus.`);
        handleCloseDeleteModal();
        setRefreshKey((k) => k + 1);
        setTimeout(() => setStatusMsg(''), 4000);
      } else {
        setDeleteError('Gagal menghapus pinjaman dari penyimpanan.');
        setIsSubmittingDelete(false);
      }
    } else {
      if (!settlementProofDataUrl) {
        setDeleteError('Wajib melampirkan foto / bukti transfer pelunasan sebelum menghapus.');
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
        setStatusMsg(`Bukti pelunasan berhasil disimpan dan pinjaman ${selectedLoanToDelete.platform} telah dihapus.`);
        handleCloseDeleteModal();
        setRefreshKey((k) => k + 1);
        setTimeout(() => setStatusMsg(''), 4000);
      } else {
        setDeleteError('Gagal menghapus pinjaman dari penyimpanan.');
        setIsSubmittingDelete(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Data Pinjaman Saya
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau sisa tagihan, hitung estimasi bunga, dan rencanakan step pelunasan total hutang.
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
              onClick={handleToggleForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition self-start cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isFormOpen ? 'Tutup Formulir' : 'Catat Pinjaman Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── BANNER PERINGATAN DEADLINE MEPET (JIKA ADA) ───────────────── */}
      {urgentLoans.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                Peringatan: {urgentLoans.length} Tagihan Mendekati atau Melewati Jatuh Tempo!
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Segera atur pelunasan untuk menghindari bunga harian dan denda berjalan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUrgentModalDismissed(false)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shrink-0 cursor-pointer shadow-xs"
          >
            Buka Notifikasi Peringatan
          </button>
        </div>
      )}

      {/* ─── STATUS MSG ──────────────────────────────────────────────────── */}
      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ─── KPI CARDS (DENGAN TOTAL BESERTA BUNGA) ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Sisa Pokok
          </span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(stats.totalDebt)}
          </div>
          <span className="text-xs text-slate-400 block">{stats.totalCount} pinjaman aktif</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-blue-700">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Beserta Bunga</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-900 tracking-tight">
            {formatRupiah(stats.totalObligation)}
          </div>
          <span className="text-xs text-blue-700 block">
            +{formatRupiah(stats.totalEstimatedInterest)} estimasi bunga
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Legal (Izin OJK)</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 tracking-tight">
            {stats.legalCount} Pinjaman
          </div>
          <span className="text-xs text-emerald-700 block">Batas bunga regulasi resmi</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pinjaman Tanpa Izin</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-900 tracking-tight">
            {stats.illegalCount} Pinjaman
          </div>
          <span className="text-xs text-rose-700 block">Prioritaskan negosiasi pokok</span>
        </div>
      </div>

      {/* ─── TABS ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('daftar')}
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 flex-1 sm:flex-initial ${
            activeTab === 'daftar'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Daftar Pinjaman
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('simulasi'); setIsFormOpen(false); }}
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 flex-1 sm:flex-initial ${
            activeTab === 'simulasi'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Rekomendasi Step Pelunasan
          {loans.some((l) => l.status === 'aktif') && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold">
              {loans.filter((l) => l.status === 'aktif').length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB: DAFTAR PINJAMAN ────────────────────────────────────────── */}
      {activeTab === 'daftar' && (
        <>
          {/* Form Tambah Pinjaman */}
          {isFormOpen && (
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Tambah Data Pinjaman &amp; Kondisi Finansial</h2>
                    <p className="text-[11px] text-slate-500">
                      Lengkapi data pinjaman serta saldo dan pengeluaran harian/bulanan Anda untuk kalkulasi rekomendasi pelunasan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLoan} className="space-y-6">
                {/* ── Bagian A: Informasi Pinjaman Pokok & Platform ── */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    1. Data Platform &amp; Tagihan Pinjaman
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Nama Aplikasi / Platform *</label>
                      <input
                        type="text"
                        name="platform"
                        value={formData.platform}
                        onChange={handleFormChange}
                        placeholder="Contoh: AdaKami, KreditPintar, CepetCair"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Pinjaman Pokok Awal (Rp)</label>
                      <input
                        type="number"
                        name="originalAmount"
                        value={formData.originalAmount}
                        onChange={handleFormChange}
                        placeholder="Contoh: 2000000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Sisa Tagihan Pokok Saat Ini (Rp) *</label>
                      <input
                        type="number"
                        name="currentBalance"
                        value={formData.currentBalance}
                        onChange={handleFormChange}
                        placeholder="Contoh: 2000000"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tanggal Mulai Menghutang *</label>
                      <input
                        type="date"
                        name="loanStartDate"
                        value={formData.loanStartDate}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tanggal Jatuh Tempo *</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Bunga (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleFormChange}
                        placeholder="Contoh: 0.4"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Periode Bunga</label>
                      <select
                        name="interestPeriod"
                        value={formData.interestPeriod}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                      >
                        <option value="harian">Harian</option>
                        <option value="mingguan">Mingguan</option>
                        <option value="bulanan">Bulanan</option>
                        <option value="tahunan">Tahunan</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        name="isOjkRegistered"
                        checked={formData.isOjkRegistered}
                        onChange={handleFormChange}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Platform Terdaftar Resmi OJK (Fintech Legal)</span>
                    </label>
                  </div>
                </div>

                {/* ── Bagian B: Saldo & Pengeluaran Rata-rata Harian / Bulanan ── */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    2. Kondisi Finansial Pengguna (Untuk Rekomendasi Step Pelunasan)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Total Saldo / Tabungan Anda Saat Ini (Rp)
                      </label>
                      <input
                        type="number"
                        name="userBalance"
                        value={formData.userBalance}
                        onChange={handleFormChange}
                        placeholder="Contoh: 5000000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Saldo dana tunai / rekening yang bisa dialokasikan
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Pengeluaran Rata-rata Harian (Rp)
                      </label>
                      <input
                        type="number"
                        name="dailyExpense"
                        value={formData.dailyExpense}
                        onChange={handleFormChange}
                        placeholder="Contoh: 50000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Otomatis mengisi bulanan: {formData.dailyExpense ? formatRupiah(Number(formData.dailyExpense) * 30) : '-'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Pengeluaran Rata-rata Bulanan (Rp)
                      </label>
                      <input
                        type="number"
                        name="monthlyExpense"
                        value={formData.monthlyExpense}
                        onChange={handleFormChange}
                        placeholder="Contoh: 1500000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Kebutuhan hidup pokok per bulan (makan, sewa, transport)
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Bagian C: Live Kalkulator Total Beserta Bunga ── */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-sky-50/80 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Estimasi Kalkulasi Total Hutang (Sudah Dihitung Beserta Bunga)
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      Durasi: {liveEstimated.durationDays} hari
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-slate-500 block">Pokok Tagihan</span>
                      <span className="text-xs font-bold text-slate-800">
                        {formatRupiah(formData.currentBalance || formData.originalAmount || 0)}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-slate-500 block">Estimasi Bunga</span>
                      <span className="text-xs font-bold text-rose-600">
                        +{formatRupiah(liveEstimated.totalInterest)}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200 col-span-2 sm:col-span-2">
                      <span className="text-[10px] text-blue-700 font-semibold block">Total Hutang Beserta Bunga</span>
                      <span className="text-base font-extrabold text-blue-900">
                        {formatRupiah(liveEstimated.totalObligation)}
                      </span>
                    </div>
                  </div>

                  {formData.userBalance && (
                    <div className="pt-2 border-t border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                      <span className="text-slate-600">
                        Saldo Tersedia Anda: <strong>{formatRupiah(formData.userBalance)}</strong>
                      </span>
                      {Number(formData.userBalance) >= liveEstimated.totalObligation ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ Saldo Anda cukup untuk pelunasan langsung penuh (Sisa saldo: {formatRupiah(Number(formData.userBalance) - liveEstimated.totalObligation)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          ⚠️ Saldo belum mencukupi untuk pelunasan sekaligus (Defisit: {formatRupiah(liveEstimated.totalObligation - Number(formData.userBalance))}) — disarankan step cicilan
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Simpan Pinjaman &amp; Analisis Finansial
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grid Pinjaman */}
          {loans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Data Pinjaman</p>
              <p className="text-xs max-w-sm mx-auto">
                Catat pinjaman Anda untuk mendapatkan rekapitulasi beban utang dan bantuan restrukturisasi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => {
                const interestInfo = calculateLoanEstimatedInterest(loan);
                const urgentInfo = checkUrgentDue(loan.dueDate);

                return (
                  <div
                    key={loan.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition space-y-3 relative ${
                      urgentInfo.isUrgent
                        ? 'border-amber-300 ring-1 ring-amber-200 hover:border-amber-400'
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

                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{loan.platform}</h3>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-1 border ${
                            loan.isOjkRegistered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {loan.isOjkRegistered ? 'Terdaftar Resmi' : 'Tidak Terdaftar'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                        {loan.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Sisa Pokok:</span>
                        <span className="text-sm font-bold text-slate-800">
                          {formatRupiah(loan.currentBalance)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Estimasi Bunga:</span>
                        <span className="text-xs font-semibold text-rose-600">
                          +{formatRupiah(interestInfo.totalInterest)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-blue-900">Total + Bunga:</span>
                        <span className="text-base font-extrabold text-blue-900">
                          {formatRupiah(interestInfo.totalObligation)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3 text-slate-400" />
                          {loan.interestRate}% ({loan.interestPeriod})
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          Mulai: {loan.loanStartDate || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Tempo: {loan.dueDate}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({interestInfo.durationDays} hari)
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(loan)}
                        className="w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Selesaikan &amp; Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA ke simulasi jika ada pinjaman aktif */}
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
                  <p className="text-sm font-bold text-slate-800">Rencanakan Pelunasan Optimal</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Masukkan kemampuan bayar bulanan → dapatkan jadwal dan strategi bebas utang terbaik.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 whitespace-nowrap shrink-0 self-end sm:self-auto">
                Mulai Simulasi →
              </span>
            </div>
          )}
        </>
      )}

      {/* ─── TAB: SIMULASI PELUNASAN ─────────────────────────────────────── */}
      {activeTab === 'simulasi' && (
        <RepaymentPlanner loans={loans} userId={userId} />
      )}

      {/* ─── MODAL KONFIRMASI PELUNASAN & HAPUS PINJAMAN ──────────────────── */}
      {selectedLoanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold">Selesaikan &amp; Hapus Pinjaman</h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Ringkas Pinjaman */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedLoanToDelete.platform}</h3>
                  <span className="text-[11px] text-slate-500 block">
                    Pokok: {formatRupiah(selectedLoanToDelete.originalAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Sisa Tagihan</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatRupiah(selectedLoanToDelete.currentBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cek Status Bukti Pelunasan */}
            {loanPayments.some((p) => Boolean(p.proofFileName)) ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Bukti Pembayaran / Pelunasan Terdeteksi!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Pinjaman ini sudah memiliki bukti transfer / pembayaran yang tersimpan di sistem.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Apakah Anda yakin ingin menyelesaikan dan menghapus riwayat pinjaman di <strong>{selectedLoanToDelete.platform}</strong> dari daftar aktif?
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Bukti Pelunasan Belum Ditemukan</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Untuk memverifikasi bahwa hutang telah selesai, silakan lampirkan bukti pembayaran/transfer pelunasan terlebih dahulu sebelum menghapus pinjaman.
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tanggal Pelunasan</label>
                    <input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Unggah Bukti Transfer / Pelunasan</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition">
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
                        <img
                          src={settlementProofPreview}
                          alt="Preview Bukti"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-emerald-700 truncate flex items-center gap-1">
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

            {/* Error Alert */}
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Tombol Aksi */}
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
                    : 'Simpan Bukti & Hapus Pinjaman'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL POP-UP PERINGATAN DEADLINE MEPET ───────────────────── */}
      {urgentLoans.length > 0 && !isUrgentModalDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
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
                    Deadline Tagihan Pinjaman Sudah Mepet!
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

            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem ByeBills membaca ada <strong>{urgentLoans.length} pinjaman</strong> yang mendekati atau telah melewati batas jatuh tempo. Segera lakukan pelunasan untuk menghentikan akumulasi bunga harian dan denda penagihan.
            </p>

            {/* List Pinjaman Mepet */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {urgentLoans.map((uLoan) => (
                <div
                  key={uLoan.id}
                  className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{uLoan.platform}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          uLoan.isOjkRegistered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {uLoan.isOjkRegistered ? 'OJK' : 'Ilegal'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      Tempo: {uLoan.dueDate} (
                      <strong className={uLoan.isOverdue ? 'text-rose-600' : 'text-amber-700'}>
                        {uLoan.isOverdue
                          ? `Terlewat ${Math.abs(uLoan.diffDays)} hari!`
                          : uLoan.isToday
                          ? 'Jatuh tempo HARI INI!'
                          : `${uLoan.diffDays} hari lagi`}
                      </strong>
                      )
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Pokok: {formatRupiah(uLoan.currentBalance)} · Bunga: +{formatRupiah(uLoan.totalInterest)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Total Pelunasan</span>
                    <span className="text-xs font-extrabold text-rose-700 block">
                      {formatRupiah(uLoan.totalObligation)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUrgentModalDismissed(true);
                        handleOpenDeleteModal(uLoan);
                      }}
                      className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition cursor-pointer"
                    >
                      Lunasi Sekarang
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsUrgentModalDismissed(true);
                  setActiveTab('simulasi');
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Lihat Step Rekomendasi Pelunasan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUrgentModalDismissed(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Tutup &amp; Ingatkan Nanti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Jumlah Saldo */}
      <EditBalanceModal
        isOpen={isEditBalanceModalOpen}
        onClose={() => setIsEditBalanceModalOpen(false)}
        userId={userId}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
