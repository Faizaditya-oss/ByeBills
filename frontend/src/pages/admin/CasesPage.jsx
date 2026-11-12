import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ChevronRight,
  FileText,
  User,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getAllCases,
  getCaseNotes,
  addCaseNote,
  updateCase,
  closeCase,
  getUserById,
} from '../../services/storage.js';

const STATUS_OPTIONS = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'baru', label: 'Baru' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'menunggu_respons', label: 'Menunggu Respons' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditutup', label: 'Ditutup' },
];

const STATUS_COLORS = {
  baru: 'bg-blue-50 text-blue-700 border-blue-200',
  diproses: 'bg-amber-50 text-amber-700 border-amber-200',
  menunggu_respons: 'bg-purple-50 text-purple-700 border-purple-200',
  selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ditutup: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function AdminCasesPage() {
  const { currentUser } = useAuth();
  const adminId = currentUser?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selectedCase, setSelectedCase] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState('');

  // Ambil semua kasus
  const allCases = useMemo(() => {
    return getAllCases().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }, [refreshKey]);

  // Filter kasus
  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      const matchSearch =
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'semua' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allCases, searchTerm, statusFilter]);

  // Kasus yang dipilih untuk detail + chat
  const activeCaseDetail = useMemo(() => {
    if (!selectedCase) return null;
    return allCases.find((c) => c.id === selectedCase.id) || null;
  }, [allCases, selectedCase]);

  // Catatan / pesan pada kasus aktif
  const caseNotes = useMemo(() => {
    if (!activeCaseDetail) return [];
    return getCaseNotes(activeCaseDetail.id, true).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [activeCaseDetail, refreshKey]);

  // User pelapor
  const reporterUser = useMemo(() => {
    if (!activeCaseDetail?.userId) return null;
    return getUserById(activeCaseDetail.userId);
  }, [activeCaseDetail]);

  // Statistik ringkasan
  const countByStatus = (status) => allCases.filter((c) => c.status === status).length;

  // Kirim balasan / catatan CS
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeCaseDetail) return;

    setIsSending(true);

    const note = addCaseNote({
      caseId: activeCaseDetail.id,
      authorId: adminId,
      content: replyText.trim(),
      isInternal,
    });

    if (note) {
      // Jika baru, ubah statusnya ke diproses otomatis
      if (activeCaseDetail.status === 'baru') {
        updateCase(activeCaseDetail.id, { status: 'diproses', updatedAt: new Date().toISOString() });
      }
      setReplyText('');
      setNotification('Balasan berhasil dikirim!');
      setRefreshKey((prev) => prev + 1);
    }

    setIsSending(false);
  };

  // Ubah status kasus
  const handleUpdateStatus = (caseId, newStatus) => {
    if (newStatus === 'ditutup') {
      const reason = window.prompt('Masukkan alasan penutupan kasus:');
      if (!reason) return;
      closeCase(caseId, adminId, reason);
    } else {
      updateCase(caseId, { status: newStatus, updatedAt: new Date().toISOString() });
    }
    setNotification(`Status kasus berhasil diubah ke "${newStatus}".`);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
              <FolderKanban className="w-3.5 h-3.5" />
              Pusat Layanan Customer Service
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Aduan & Tiket Pengguna</h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola aduan pengguna dan berikan respons bantuan CS.
            </p>
          </div>

          {/* Statistik Ringkas */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Baru', status: 'baru', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Diproses', status: 'diproses', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Selesai', status: 'selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((s) => (
              <div key={s.status} className={`px-3 py-2 rounded-xl border text-center min-w-[72px] ${s.color}`}>
                <div className="text-[11px] font-semibold uppercase">{s.label}</div>
                <div className="text-xl font-black">{countByStatus(s.status)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifikasi */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="text-xs font-semibold hover:underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Panel Utama: Daftar + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Kolom Kiri: Daftar Aduan */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter & Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kasus atau ID..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Daftar Kasus */}
          <div className="space-y-2">
            {filteredCases.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                Tidak ada aduan ditemukan.
              </div>
            ) : (
              filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition ${
                    selectedCase?.id === c.id
                      ? 'border-blue-500 shadow-md bg-blue-50/30'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        STATUS_COLORS[c.status] || 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(c.updatedAt || c.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mt-2 line-clamp-2">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 capitalize">{c.category?.replace(/_/g, ' ')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail + Chat */}
        <div className="lg:col-span-3">
          {!activeCaseDetail ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center gap-3">
              <FolderKanban className="w-12 h-12 text-slate-200" />
              <p className="text-sm">Pilih aduan di sebelah kiri untuk melihat detail dan mengirim balasan.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              {/* Info Kasus */}
              <div className="p-5 border-b border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-base">{activeCaseDetail.title}</h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      STATUS_COLORS[activeCaseDetail.status] || 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {activeCaseDetail.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{reporterUser?.name || 'User'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(activeCaseDetail.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">{activeCaseDetail.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">{activeCaseDetail.priority || 'Sedang'}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {activeCaseDetail.description}
                </p>

                {/* Kontrol Status */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-500">Ubah Status:</span>
                  {['diproses', 'menunggu_respons', 'selesai', 'ditutup']
                    .filter((s) => s !== activeCaseDetail.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(activeCaseDetail.id, s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                          s === 'ditutup'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : s === 'selesai'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                </div>
              </div>

              {/* Area Chat */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px] min-h-[160px]">
                {caseNotes.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-6">
                    Belum ada pesan. Kirim balasan pertama untuk membantu pengguna.
                  </div>
                ) : (
                  caseNotes.map((note) => {
                    const isAdmin = note.authorId === adminId || note.authorId?.startsWith('admin');
                    const author = getUserById(note.authorId);
                    return (
                      <div key={note.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm shadow-sm ${
                            isAdmin
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                          } ${note.isInternal ? 'opacity-75 border border-dashed border-blue-300' : ''}`}
                        >
                          {note.isInternal && (
                            <div className={`text-[10px] font-bold mb-1 ${isAdmin ? 'text-blue-200' : 'text-slate-500'}`}>
                              🔒 Catatan Internal
                            </div>
                          )}
                          <p className="leading-relaxed">{note.content}</p>
                          <div className={`text-[10px] mt-1 ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>
                            {author?.name || (isAdmin ? 'Admin CS' : 'User')} ·{' '}
                            {new Date(note.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Form Balasan */}
              {activeCaseDetail.status !== 'ditutup' && (
                <div className="p-4 border-t border-slate-100">
                  <form onSubmit={handleSendReply} className="space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Ketik balasan atau catatan CS..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        Catatan internal (tidak terlihat pengguna)
                      </label>
                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSending}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Kirim Balasan
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeCaseDetail.status === 'ditutup' && (
                <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-400">
                  Kasus ini telah ditutup. Tidak dapat menambahkan balasan baru.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}