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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getLoansByUser, createLoan } from '../../services/storage.js';
import RepaymentPlanner from '../../components/RepaymentPlanner.jsx';

export default function LoansPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [activeTab, setActiveTab] = useState('daftar'); // 'daftar' | 'simulasi'
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [formData, setFormData] = useState({
    platform: '',
    originalAmount: '',
    currentBalance: '',
    interestRate: '',
    interestPeriod: 'bulanan',
    dueDate: '',
    isOjkRegistered: false,
  });

  const loans = useMemo(() => {
    if (!userId) return [];
    return getLoansByUser(userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userId, refreshKey]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalDebt = loans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);
    const legalCount = loans.filter((l) => l.isOjkRegistered).length;
    const illegalCount = loans.filter((l) => !l.isOjkRegistered).length;
    return { totalDebt, legalCount, illegalCount, totalCount: loans.length };
  }, [loans]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

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
      interestPeriod: formData.interestPeriod,
      dueDate: formData.dueDate || new Date().toISOString().slice(0, 10),
      isOjkRegistered: Boolean(formData.isOjkRegistered),
      status: 'aktif',
    });

    if (res && res.id) {
      setFormData({
        platform: '',
        originalAmount: '',
        currentBalance: '',
        interestRate: '',
        interestPeriod: 'bulanan',
        dueDate: '',
        isOjkRegistered: false,
      });
      setIsFormOpen(false);
      setRefreshKey((k) => k + 1);
      setStatusMsg('Data pinjaman baru berhasil dicatat.');
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <div className="space-y-6 pb-8">
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Data Pinjaman Saya
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau sisa tagihan, legalitas platform, dan rencanakan pelunasan optimal.
          </p>
        </div>
        {activeTab === 'daftar' && (
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition self-start cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isFormOpen ? 'Tutup Formulir' : 'Catat Pinjaman Baru'}</span>
          </button>
        )}
      </div>

      {/* ─── STATUS MSG ──────────────────────────────────────────────────── */}
      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ─── KPI CARDS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Sisa Tagihan
          </span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(stats.totalDebt)}
          </div>
          <span className="text-xs text-slate-400 block">{stats.totalCount} pinjaman tercatat</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Legal (Izin OJK)</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 tracking-tight">
            {stats.legalCount} Pinjaman
          </div>
          <span className="text-xs text-emerald-700 block">Sesuai batasan bunga AFPI</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pinjol Ilegal</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-900 tracking-tight">
            {stats.illegalCount} Pinjaman
          </div>
          <span className="text-xs text-rose-700 block">Prioritaskan negosiasi pokok</span>
        </div>
      </div>

      {/* ─── TABS ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('daftar')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
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
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'simulasi'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Simulasi Pelunasan
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
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Tambah Data Pinjaman Baru
              </h2>

              <form onSubmit={handleCreateLoan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nama Aplikasi / Platform</label>
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
                    <label className="text-xs font-semibold text-slate-700">Sisa Tagihan Saat Ini (Rp)</label>
                    <input
                      type="number"
                      name="currentBalance"
                      value={formData.currentBalance}
                      onChange={handleFormChange}
                      placeholder="Contoh: 2500000"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Bunga (%)</label>
                      <input
                        type="number"
                        step="0.1"
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Tanggal Jatuh Tempo</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
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
                    Simpan Pinjaman
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
                Catat pinjaman online Anda untuk mendapatkan rekapitulasi beban utang dan bantuan restrukturisasi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition space-y-3"
                >
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
                        {loan.isOjkRegistered ? 'Terdaftar OJK' : 'Pinjol Ilegal'}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                      {loan.status}
                    </span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-medium">Sisa Tagihan</span>
                    <span className="text-xl font-extrabold text-slate-900 block">
                      {formatRupiah(loan.currentBalance)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Pinjaman Pokok: {formatRupiah(loan.originalAmount)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-slate-400" />
                      {loan.interestRate}% ({loan.interestPeriod})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Tempo: {loan.dueDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA ke simulasi jika ada pinjaman aktif */}
          {loans.some((l) => l.status === 'aktif') && (
            <div
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-blue-400 transition"
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
              <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">
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
    </div>
  );
}
