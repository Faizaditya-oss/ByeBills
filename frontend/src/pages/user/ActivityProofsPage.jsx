import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  PlusCircle,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Coins,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getActivityProofsByUser,
  uploadActivityProof,
  getUserTotalPoints,
} from '../../services/storage.js';
import { compressImage } from '../../utils/imageCompressor.js';

export default function ActivityProofsPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('semua');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'anggaran_hemat',
    description: '',
    pointsReward: 35,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [fileSizeKb, setFileSizeKb] = useState(0);

  const proofs = useMemo(() => {
    if (!userId) return [];
    return getActivityProofsByUser(userId).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [userId, refreshKey]);

  const userPoints = useMemo(() => {
    if (!userId) return 0;
    return getUserTotalPoints(userId);
  }, [userId, refreshKey]);

  const filteredProofs = useMemo(() => {
    if (activeFilter === 'semua') return proofs;
    return proofs.filter((p) => p.status === activeFilter);
  }, [proofs, activeFilter]);

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
      // Kompresi gambar di browser sebelum disimpan (maks. 300 KB)
      const { dataUrl, fileSizeKb: sizeKb } = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7,
        maxKb: 300,
      });

      setImagePreview(dataUrl);
      setImageDataUrl(dataUrl);
      setFileSizeKb(sizeKb);
    } catch (err) {
      console.error('Gagal mengompresi gambar:', err);
      setErrorMsg(err.message || 'Gagal memproses gambar bukti aktivitas.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUploadProof = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim() || !imageDataUrl) {
      setErrorMsg('Judul aktivitas dan file gambar bukti wajib diisi.');
      return;
    }

    const res = uploadActivityProof({
      userId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      imagePath: imageDataUrl,
      fileSizeKb,
      pointsReward: Number(formData.pointsReward) || 35,
    });

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    // Reset Form
    setFormData({
      title: '',
      category: 'anggaran_hemat',
      description: '',
      pointsReward: 35,
    });
    setImagePreview(null);
    setImageDataUrl('');
    setFileSizeKb(0);
    setIsFormOpen(false);
    setRefreshKey((k) => k + 1);
    setStatusMsg('Bukti aktivitas berhasil diunggah! Sedang menunggu pemeriksaan Admin CS untuk persetujuan poin.');
    setTimeout(() => setStatusMsg(''), 5000);
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
            Bukti Aktivitas & Klaim Poin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Unggah foto struk pelunasan utang, catatan budgeting hemat, atau bukti literasi finansial Anda untuk ditinjau Admin dan kumpulkan poin reward.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition self-start cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isFormOpen ? 'Tutup Formulir' : 'Unggah Bukti Baru'}</span>
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
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Poin Saya</span>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {userPoints.toLocaleString('id-ID')} Poin
          </div>
          <span className="text-xs text-slate-400 block">Dapat ditukarkan di Toko Reward</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-700">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Menunggu Persetujuan</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 tracking-tight">
            {proofs.filter((p) => p.status === 'pending').length} Bukti
          </div>
          <span className="text-xs text-amber-700 block">Poin otomatis bertambah setelah disetujui</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Bukti Disetujui</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 tracking-tight">
            {proofs.filter((p) => p.status === 'approved').length} Aktivitas
          </div>
          <span className="text-xs text-emerald-700 block">Poin telah masuk ke saldo</span>
        </div>
      </div>

      {/* Form Unggah Bukti */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Formulir Unggah Bukti Aktivitas & Misi Bebas Pinjol
          </h2>

          <form onSubmit={handleUploadProof} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Judul Aktivitas</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Contoh: Bukti Pelunasan Tagihan Pokok Pinjol"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Kategori Bukti</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="pembayaran">Pembayaran / Pelunasan Pinjaman (+50 Poin)</option>
                  <option value="anggaran_hemat">Penghematan Anggaran Mingguan (+35 Poin)</option>
                  <option value="edukasi">Aktivitas Literasi & Komunitas (+25 Poin)</option>
                  <option value="lainnya">Aktivitas Finansial Positif Lainnya (+20 Poin)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Keterangan Aktivitas</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Jelaskan secara singkat foto yang diunggah, misalnya: struk pelunasan platform A atau catatan hemat belanja..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Unggah Gambar dengan Kompresi Otomatis */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Foto Bukti Fisik / Screenshot (Otomatis Dikompresi Maks. 300 KB)</span>
                {isCompressing && <span className="text-blue-600 font-normal">Mengompresi gambar...</span>}
              </label>

              <div className="flex items-center gap-4">
                <label className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Pilih Gambar</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terkompresi ({fileSizeKb} KB)
                  </span>
                )}
              </div>

              {imagePreview && (
                <div className="mt-3 w-40 h-40 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                  <img src={imagePreview} alt="Preview Bukti" className="w-full h-full object-cover" />
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
                disabled={isCompressing || !imageDataUrl}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Unggah & Ajukan Poin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Daftar Bukti Aktivitas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800">Daftar Bukti Aktivitas Saya</h2>
          <div className="flex items-center gap-1.5 text-xs">
            {['semua', 'pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setActiveFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition cursor-pointer ${
                  activeFilter === st
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredProofs.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Belum Ada Bukti Aktivitas</p>
            <p className="text-xs max-w-sm mx-auto">
              Unggah foto bukti pelunasan utang atau penghematan anggaran Anda untuk mendapatkan poin reward dari Admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProofs.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                        p.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {p.status === 'approved'
                        ? 'Disetujui'
                        : p.status === 'pending'
                        ? 'Menunggu Review'
                        : 'Ditolak'}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDate(p.createdAt)}</span>
                  </div>

                  {/* Thumbnail */}
                  {p.imagePath && (
                    <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                      <img src={p.imagePath} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{p.title}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{p.description}</p>
                  </div>

                  {/* Catatan penolakan jika ditolak */}
                  {p.status === 'rejected' && p.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                      <strong>Alasan Ditolak:</strong> {p.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 capitalize">
                    {p.category?.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-slate-800">
                    {p.status === 'approved' ? `+${p.pointsReward} Poin` : `Estimasi +${p.pointsReward} Poin`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
