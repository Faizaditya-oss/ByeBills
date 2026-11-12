import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  PlusCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  Building2,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getCasesByUser,
  createCase,
  getCaseNotes,
  addCaseNote,
  getUserById,
} from '../../services/storage.js';

export default function CasesPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('semua');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    category: 'pinjol_ilegal',
    priority: 'sedang',
    description: '',
  });

  // Ambil daftar aduan milik user
  const cases = useMemo(() => {
    if (!userId) return [];
    return getCasesByUser(userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userId, refreshKey]);

  // Filter aduan
  const filteredCases = useMemo(() => {
    if (activeFilter === 'semua') return cases;
    return cases.filter((c) => c.status === activeFilter);
  }, [cases, activeFilter]);

  // Kasus aktif yang dipilih untuk melihat detail/tanggapan CS
  const activeCase = useMemo(() => {
    if (!selectedCaseId) return cases[0] || null;
    return cases.find((c) => c.id === selectedCaseId) || cases[0] || null;
  }, [cases, selectedCaseId]);

  // Tanggapan/catatan untuk kasus aktif
  const caseNotes = useMemo(() => {
    if (!activeCase) return [];
    return getCaseNotes(activeCase.id, false).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [activeCase, refreshKey]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCase = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setStatusMsg('Judul dan deskripsi aduan wajib diisi.');
      return;
    }

    const res = createCase({
      userId,
      title: formData.title.trim(),
      platform: formData.platform.trim() || 'Pinjol Lainnya',
      category: formData.category,
      priority: formData.priority,
      description: formData.description.trim(),
      status: 'baru',
    });

    if (res && res.id) {
      setFormData({
        title: '',
        platform: '',
        category: 'pinjol_ilegal',
        priority: 'sedang',
        description: '',
      });
      setIsFormOpen(false);
      setSelectedCaseId(res.id);
      setRefreshKey((k) => k + 1);
      setStatusMsg('Pengaduan berhasil dikirim ke Admin CS ByeBills.');
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!activeCase || !replyText.trim()) return;

    addCaseNote({
      caseId: activeCase.id,
      authorId: userId,
      content: replyText.trim(),
      isInternal: false,
    });

    setReplyText('');
    setRefreshKey((k) => k + 1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'baru':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'diproses':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'selesai':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ditutup':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Aduan & Bantuan Customer Service
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Laporkan intimidasi pinjol, suku bunga mencekik, atau konsultasikan solusi pelunasan dengan tim Admin CS ByeBills.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition self-start cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isFormOpen ? 'Tutup Formulir' : 'Buat Pengaduan Baru'}</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Form Buat Pengaduan */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-600" />
              Formulir Laporan Permasalahan Pinjol
            </h2>
            <span className="text-[11px] text-slate-400">Pemberitahuan resmi ke Admin CS</span>
          </div>

          <form onSubmit={handleCreateCase} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Judul Aduan</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Contoh: Teror Debt Collector & Bunga Berlipat"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nama Aplikasi / Platform</label>
                <input
                  type="text"
                  name="platform"
                  value={formData.platform}
                  onChange={handleFormChange}
                  placeholder="Contoh: CepetCair, PinjamanKilat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Kategori Permasalahan</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="pinjol_ilegal">Pinjol Ilegal (Tanpa Izin OJK)</option>
                  <option value="bunga_tinggi">Bunga Tidak Wajar / Biaya Tersembunyi</option>
                  <option value="intimidasi">Ancaman & Intimidasi Debt Collector</option>
                  <option value="pinjaman_ganda">Gali Lubang Tutup Lubang (Multiplatform)</option>
                  <option value="lainnya">Masalah Keuangan Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tingkat Urgensi</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="rendah">Rendah (Pertanyaan umum)</option>
                  <option value="sedang">Sedang (Perlu panduan negosiasi)</option>
                  <option value="tinggi">Tinggi (Mulai ada penagihan kasar)</option>
                  <option value="darurat">Darurat (Teror kontak darurat / pemerasan)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Kronologi & Deskripsi Masalah</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={4}
                placeholder="Ceritakan awal mula meminjam, nominal pokok, total tagihan yang ditagihkan, dan kendala yang dihadapi saat ini..."
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
              />
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
                Kirim Aduan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Konten Utama 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Aduan */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            {/* Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['semua', 'baru', 'diproses', 'selesai'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition cursor-pointer shrink-0 ${
                    activeFilter === st
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* List */}
            {filteredCases.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <FolderKanban className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Belum ada pengaduan dengan filter ini.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredCases.map((c) => {
                  const isSelected = activeCase?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer text-left space-y-1.5 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300 shadow-xs ring-1 ring-blue-400/30'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{c.title}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-600">{c.platform}</span>
                        <span className="capitalize">{c.priority}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail & Tanggapan Admin CS */}
        <div className="lg:col-span-2 space-y-4">
          {!activeCase ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Pilih Aduan untuk Melihat Detail</p>
              <p className="text-xs">Klik salah satu pengaduan di sebelah kiri atau buat pengaduan baru.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              {/* Header Aduan Terpilih */}
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${getStatusBadge(
                        activeCase.status
                      )}`}
                    >
                      Status: {activeCase.status}
                    </span>
                    <span className="text-xs text-slate-400">ID: {activeCase.id}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Dilaporkan: {formatDate(activeCase.createdAt)}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900">{activeCase.title}</h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span>Platform: <strong className="text-slate-800">{activeCase.platform}</strong></span>
                  <span>&bull;</span>
                  <span>Kategori: <strong className="text-slate-800 capitalize">{activeCase.category?.replace(/_/g, ' ')}</strong></span>
                  <span>&bull;</span>
                  <span>Urgensi: <strong className="text-slate-800 capitalize">{activeCase.priority}</strong></span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mt-2">
                  {activeCase.description}
                </div>
              </div>

              {/* Riwayat Diskusi & Tanggapan Admin CS */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Percakapan & Arahan Solusi Admin CS ({caseNotes.length})
                </h3>

                {caseNotes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-600 space-y-1 text-center">
                    <p className="font-semibold text-blue-900">Aduan Anda Sedang Mengantre Ditinjau</p>
                    <p className="text-[11px] text-slate-500">
                      Tim Admin CS ByeBills akan segera memberikan tanggapan dan panduan langkah pelunasan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {caseNotes.map((note) => {
                      const isUser = note.authorId === userId;
                      const author = getUserById(note.authorId);
                      return (
                        <div
                          key={note.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                            isUser
                              ? 'bg-blue-50/50 border-blue-200 ml-2 sm:ml-6'
                              : 'bg-emerald-50/50 border-emerald-200 mr-2 sm:mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {isUser ? 'Anda (Pelapor)' : `Admin CS (${author?.name || 'Customer Service'})`}
                            </span>
                            <span className="text-slate-400">{formatDate(note.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{note.content}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Kirim Balasan / Informasi Tambahan */}
              <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Ketik balasan atau informasi tambahan untuk Admin CS..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
