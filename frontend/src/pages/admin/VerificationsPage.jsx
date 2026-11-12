import React, { useState, useMemo } from 'react';
import {
  Receipt,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Eye,
  AlertCircle,
  X,
  Search,
  Filter,
  User,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getPendingActivityProofs,
  getAllActivityProofs,
  approveActivityProof,
  rejectActivityProof,
  getPendingPayments,
  getAllPayments,
  verifyPayment,
  rejectPayment,
  getUserById,
  getLoansByUser,
} from '../../services/storage.js';

export default function VerificationsPage() {
  const { currentUser } = useAuth();
  const adminId = currentUser?.id;

  const [activeTab, setActiveTab] = useState('proofs');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [proofFilter, setProofFilter] = useState('pending');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [previewImage, setPreviewImage] = useState(null);

  // --- ACTIVITY PROOFS ---
  const allProofs = useMemo(() => {
    const proofs = getAllActivityProofs();
    return proofs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [refreshKey]);

  const filteredProofs = useMemo(() => {
    return allProofs.filter((p) => {
      const matchStatus = proofFilter === 'semua' || p.status === proofFilter;
      const user = getUserById(p.userId);
      const matchSearch =
        !searchTerm ||
        user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.missionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [allProofs, searchTerm, proofFilter]);

  const pendingProofsCount = allProofs.filter((p) => p.status === 'pending').length;

  // --- PAYMENTS ---
  const allPayments = useMemo(() => {
    return getAllPayments().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [refreshKey]);

  const pendingPayments = useMemo(() => {
    return allPayments.filter((p) => p.status === 'menunggu_verifikasi');
  }, [allPayments]);

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  // --- Handler Proof ---
  const handleApproveProof = (proof) => {
    if (!window.confirm(`Setujui bukti aktivitas dari pengguna ini dan berikan poin?`)) return;
    const res = approveActivityProof(proof.id, adminId);
    if (res.error) {
      showNotif('error', res.error);
    } else {
      showNotif('success', `Bukti disetujui! +${res.pointsAwarded} poin diberikan ke pengguna.`);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleRejectProof = (proof) => {
    const reason = window.prompt('Alasan penolakan bukti aktivitas:');
    if (reason === null) return;
    const res = rejectActivityProof(proof.id, adminId, reason || 'Tidak memenuhi syarat');
    if (res.error) {
      showNotif('error', res.error);
    } else {
      showNotif('success', 'Bukti berhasil ditolak.');
      setRefreshKey((prev) => prev + 1);
    }
  };

  // --- Handler Payment ---
  const handleVerifyPayment = (payment) => {
    if (!window.confirm(`Verifikasi pembayaran ini sebagai valid?`)) return;
    const res = verifyPayment(payment.id, adminId, 50, true);
    if (res.error) {
      showNotif('error', res.error);
    } else {
      showNotif('success', `Pembayaran diverifikasi! +50 poin diberikan ke pengguna.`);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleRejectPayment = (payment) => {
    const reason = window.prompt('Alasan penolakan pembayaran:');
    if (reason === null) return;
    const res = rejectPayment(payment.id, adminId, reason || 'Tidak valid');
    if (res.error) {
      showNotif('error', res.error);
    } else {
      showNotif('success', 'Pembayaran berhasil ditolak.');
      setRefreshKey((prev) => prev + 1);
    }
  };

  const STATUS_COLORS_PROOF = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
              <Receipt className="w-3.5 h-3.5" />
              Pusat Verifikasi Admin
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Verifikasi & Approval Bukti</h1>
            <p className="text-sm text-slate-500 mt-1">
              Setujui atau tolak bukti aktivitas pengguna dan verifikasi pembayaran cicilan.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-amber-600 block font-bold uppercase">Bukti Pending</span>
              <span className="text-2xl font-black text-amber-700">{pendingProofsCount}</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[11px] text-indigo-600 block font-bold uppercase">Pembayaran</span>
              <span className="text-2xl font-black text-indigo-700">{pendingPayments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifikasi */}
      {notification.message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm ${
            notification.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification({ type: '', message: '' })}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Preview Gambar Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Tutup
            </button>
            <img
              src={previewImage}
              alt="Preview Bukti"
              className="rounded-xl max-h-[80vh] object-contain w-full"
            />
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('proofs')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'proofs'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Bukti Aktivitas Misi
          {pendingProofsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
              {pendingProofsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" /> Verifikasi Pembayaran
          {pendingPayments.length > 0 && (
            <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded-full">
              {pendingPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Bukti Aktivitas */}
      {activeTab === 'proofs' && (
        <div className="space-y-5">
          {/* Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama pengguna atau tipe misi..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'semua'].map((f) => (
                <button
                  key={f}
                  onClick={() => setProofFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    proofFilter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredProofs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Tidak ada bukti aktivitas ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProofs.map((proof) => {
                const submitter = getUserById(proof.userId);
                const reviewer = proof.reviewedBy ? getUserById(proof.reviewedBy) : null;

                return (
                  <div
                    key={proof.id}
                    className={`bg-white rounded-xl border p-5 shadow-sm space-y-4 ${
                      proof.status === 'pending' ? 'border-amber-300' : 'border-slate-200'
                    }`}
                  >
                    {/* Meta */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                              STATUS_COLORS_PROOF[proof.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {proof.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 capitalize">
                            {proof.missionType?.replace(/_/g, ' ') || 'Misi Umum'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{submitter?.name || proof.userId}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {new Date(proof.createdAt).toLocaleDateString('id-ID')}
                        </div>
                        {proof.status === 'approved' && (
                          <div className="text-emerald-600 font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5" /> +{proof.pointsAwarded} pts
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deskripsi */}
                    {proof.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 leading-relaxed">
                        {proof.description}
                      </p>
                    )}

                    {/* Gambar */}
                    {proof.imageData && (
                      <div
                        className="relative rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition"
                        style={{ maxHeight: 200 }}
                        onClick={() => setPreviewImage(proof.imageData)}
                      >
                        <img
                          src={proof.imageData}
                          alt="Bukti Aktivitas"
                          className="w-full object-cover"
                          style={{ maxHeight: 200 }}
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Preview
                        </div>
                      </div>
                    )}

                    {/* Alasan penolakan */}
                    {proof.status === 'rejected' && proof.rejectionReason && (
                      <div className="text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-2.5">
                        <span className="font-bold">Alasan Penolakan:</span> {proof.rejectionReason}
                      </div>
                    )}

                    {/* Reviewed by */}
                    {reviewer && proof.reviewedAt && (
                      <div className="text-xs text-slate-400">
                        Ditinjau oleh: {reviewer.name} pada{' '}
                        {new Date(proof.reviewedAt).toLocaleDateString('id-ID')}
                      </div>
                    )}

                    {/* Aksi */}
                    {proof.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleApproveProof(proof)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          onClick={() => handleRejectProof(proof)}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Verifikasi Pembayaran */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {allPayments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Tidak ada data pembayaran.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {allPayments.map((pay) => {
                const payer = getUserById(pay.userId);
                const isPending = pay.status === 'menunggu_verifikasi';
                const hasProof = pay.proofFileName && pay.proofFileName.startsWith('data:image');

                return (
                  <div
                    key={pay.id}
                    className={`bg-white rounded-xl border p-5 shadow-sm space-y-4 ${
                      isPending ? 'border-indigo-300' : 'border-slate-200'
                    }`}
                  >
                    {/* Meta atas */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                              pay.status === 'terverifikasi'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : pay.status === 'ditolak'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {pay.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 capitalize">
                            {pay.paymentMethod?.replace(/_/g, ' ') || 'Transfer Bank'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{payer?.name || pay.userId}</span>
                          {payer?.email && (
                            <span className="text-slate-400">— {payer.email}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-slate-800">
                          Rp {pay.amount?.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(pay.createdAt).toLocaleDateString('id-ID')}
                        </div>
                        {pay.status === 'terverifikasi' && pay.pointsAwarded > 0 && (
                          <div className="text-emerald-600 font-semibold flex items-center justify-end gap-0.5 mt-0.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            +{pay.pointsAwarded} pts
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Catatan pembayaran */}
                    {pay.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 leading-relaxed">
                        {pay.notes}
                      </p>
                    )}

                    {/* Gambar Bukti Pembayaran */}
                    {hasProof ? (
                      <div
                        className="relative rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition"
                        style={{ maxHeight: 200 }}
                        onClick={() => setPreviewImage(pay.proofFileName)}
                      >
                        <img
                          src={pay.proofFileName}
                          alt="Bukti Pembayaran"
                          className="w-full object-cover"
                          style={{ maxHeight: 200 }}
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Lihat Bukti
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-slate-300" />
                        Tidak ada bukti gambar yang diunggah
                      </div>
                    )}

                    {/* Alasan penolakan */}
                    {pay.status === 'ditolak' && pay.rejectionReason && (
                      <div className="text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-2.5">
                        <span className="font-bold">Alasan Penolakan:</span> {pay.rejectionReason}
                      </div>
                    )}

                    {/* Aksi */}
                    {isPending && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleVerifyPayment(pay)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verifikasi
                        </button>
                        <button
                          onClick={() => handleRejectPayment(pay)}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    )}

                    {!isPending && (
                      <div className="text-xs text-slate-400 pt-1 border-t border-slate-100">
                        Sudah diproses
                      </div>
                    )}
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