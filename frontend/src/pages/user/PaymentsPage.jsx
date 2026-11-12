import React, { useState, useMemo } from 'react';
import {
  Receipt,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getPaymentsByUser,
  getLoansByUser,
  createPayment,
  attachProofToPayment,
} from '../../services/storage.js';
import { compressImage } from '../../utils/imageCompressor.js';

export default function PaymentsPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofDataUrl, setProofDataUrl] = useState('');

  const [formData, setFormData] = useState({
    loanId: '',
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'transfer_bank',
    notes: '',
  });

  const payments = useMemo(() => {
    if (!userId) return [];
    return getPaymentsByUser(userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userId, refreshKey]);

  const loans = useMemo(() => {
    if (!userId) return [];
    return getLoansByUser(userId).filter((l) => l.status === 'aktif');
  }, [userId, refreshKey]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const verified = payments.filter((p) => p.status === 'terverifikasi');
    const pending = payments.filter((p) => p.status === 'menunggu_verifikasi');
    const totalVerifiedAmount = verified.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      totalVerifiedAmount,
      verifiedCount: verified.length,
      pendingCount: pending.length,
      totalCount: payments.length,
    };
  }, [payments]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsCompressing(true);

    try {
      const { dataUrl, fileSizeKb } = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7,
        maxKb: 300,
      });

      setProofPreview(dataUrl);
      setProofDataUrl(dataUrl);
    } catch (err) {
      console.error('Gagal mengompresi gambar:', err);
      setErrorMsg(err.message || 'Gagal memproses gambar bukti pembayaran.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCreatePayment = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.loanId || !formData.amount) {
      setErrorMsg('Pilih pinjaman dan masukkan nominal pembayaran.');
      return;
    }

    const res = createPayment({
      loanId: formData.loanId,
      userId,
      amount: Number(formData.amount),
      paymentDate: formData.paymentDate,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes.trim() || 'Pembayaran Cicilan Pinjaman',
    });

    if (res && res.id) {
      if (proofDataUrl) {
        attachProofToPayment(res.id, proofDataUrl);
      }

      setFormData({
        loanId: '',
        amount: '',
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'transfer_bank',
        notes: '',
      });
      setProofPreview(null);
      setProofDataUrl('');
      setIsFormOpen(false);
      setRefreshKey((k) => k + 1);
      setStatusMsg('Pembayaran berhasil dicatat dan sedang menunggu verifikasi Admin.');
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Pembayaran Cicilan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Unggah bukti transfer pembayaran pinjaman online untuk verifikasi Admin dan dapatkan poin reward.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition self-start cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isFormOpen ? 'Tutup Formulir' : 'Konfirmasi Bayar'}</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Terbayarkan
          </span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(stats.totalVerifiedAmount)}
          </div>
          <span className="text-xs text-emerald-600 font-medium block">
            {stats.verifiedCount} pembayaran terverifikasi
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-700">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Menunggu Verifikasi</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 tracking-tight">
            {stats.pendingCount} Transaksi
          </div>
          <span className="text-xs text-amber-700 block">Sedang ditinjau oleh Admin CS</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Riwayat Bayar
          </span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalCount} Catatan
          </div>
          <span className="text-xs text-slate-400 block">Seluruh riwayat pembayaran</span>
        </div>
      </div>

      {/* Form Konfirmasi Pembayaran */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-blue-600" />
            Konfirmasi Pembayaran Cicilan Baru
          </h2>

          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Pilih Pinjaman</label>
                {loans.length === 0 ? (
                  <p className="text-xs text-amber-600">
                    Tidak ada pinjaman aktif. Silakan tambahkan pinjaman terlebih dahulu di menu Pinjaman.
                  </p>
                ) : (
                  <select
                    name="loanId"
                    value={formData.loanId}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="">-- Pilih Platform Pinjaman --</option>
                    {loans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.platform} (Sisa: {formatRupiah(l.currentBalance)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Jumlah Pembayaran (Rp)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="Contoh: 500000"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tanggal Transfer</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Metode Pembayaran</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="transfer_bank">Transfer Bank / Virtual Account</option>
                  <option value="e_wallet">E-Wallet (GoPay, OVO, Dana)</option>
                  <option value="minimarket">Gerai Minimarket</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Catatan Pembayaran</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Contoh: Pembayaran cicilan ke-2 melalui BCA Virtual Account"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Unggah Bukti Bayar dengan Kompresi Otomatis */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Bukti Struk Transfer (Maks 300 KB, Terkompresi Otomatis)</span>
                {isCompressing && <span className="text-blue-600 font-normal">Mengompresi gambar...</span>}
              </label>

              <div className="flex items-center gap-4">
                <label className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Pilih File Gambar</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {proofPreview && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Gambar siap diunggah
                  </span>
                )}
              </div>

              {proofPreview && (
                <div className="mt-2 w-32 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                  <img src={proofPreview} alt="Bukti Transfer" className="w-full h-full object-cover" />
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
                disabled={isCompressing || loans.length === 0}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Kirim Konfirmasi Bayar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Riwayat Pembayaran */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Riwayat Pembayaran Cicilan</h2>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Belum Ada Riwayat Pembayaran</p>
            <p className="text-xs">Catat pembayaran cicilan Anda untuk mendapatkan verifikasi dan poin reward.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{formatRupiah(p.amount)}</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        p.status === 'terverifikasi'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'menunggu_verifikasi'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {p.status === 'terverifikasi'
                        ? 'Terverifikasi'
                        : p.status === 'menunggu_verifikasi'
                        ? 'Menunggu Verifikasi'
                        : 'Ditolak'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{p.notes}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Tanggal: {formatDate(p.paymentDate)}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{p.paymentMethod?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {p.status === 'terverifikasi' ? `+${p.pointsAwarded || 50} Poin` : ''}
                  </span>
                  {p.proofFile && (
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                      Lampiran Bukti Ada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
