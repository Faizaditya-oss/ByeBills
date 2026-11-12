import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Tag,
  Clock,
  CheckCircle2,
  BookMarked,
  Trophy,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getAllShopItems,
  updateShopItem,
  getAllBadges,
  getAllEducationModules,
  createEducationModule,
  updateEducationModule,
  deleteEducationModule,
} from '../../services/storage.js';

const EMPTY_FORM = {
  title: '',
  category: '',
  readTime: '5 menit',
  points: 15,
  summary: '',
  content: '',
};

export default function AdminEducationPage() {
  const { currentUser } = useAuth();
  const adminId = currentUser?.id;

  const [activeSection, setActiveSection] = useState('modules');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });

  // State form tambah/edit modul
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null); // null = tambah baru
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Data modul dari storage
  const educationModules = useMemo(() => getAllEducationModules(), [refreshKey]);

  // Data shop items (reward catalog)
  const shopItems = useMemo(() => getAllShopItems(), [refreshKey]);
  const filteredShopItems = useMemo(() => {
    if (!searchTerm) return shopItems;
    return shopItems.filter((i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shopItems, searchTerm]);

  // Data badges
  const badges = useMemo(() => getAllBadges(), [refreshKey]);

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  const handleToggleShopItem = (item) => {
    const updated = updateShopItem(item.id, { isAvailable: !item.isAvailable });
    if (updated) {
      showNotif('success', `Item "${item.name}" ${!item.isAvailable ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setRefreshKey((prev) => prev + 1);
    }
  };

  // Buka form tambah baru
  const handleOpenAddForm = () => {
    setEditingModule(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  // Buka form edit modul
  const handleOpenEditForm = (mod) => {
    setEditingModule(mod);
    setFormData({
      title: mod.title || '',
      category: mod.category || '',
      readTime: mod.readTime || '5 menit',
      points: mod.points || 15,
      summary: mod.summary || '',
      content: mod.content || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Submit form tambah/edit
  const handleSubmitForm = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('Judul dan konten modul wajib diisi.');
      return;
    }

    if (editingModule) {
      // Update
      const res = updateEducationModule(editingModule.id, {
        title: formData.title.trim(),
        category: formData.category.trim() || 'Umum',
        readTime: formData.readTime.trim() || '5 menit',
        points: Number(formData.points) || 15,
        summary: formData.summary.trim(),
        content: formData.content.trim(),
      });
      if (res) {
        showNotif('success', `Modul "${formData.title}" berhasil diperbarui.`);
      } else {
        setFormError('Gagal memperbarui modul.');
        return;
      }
    } else {
      // Tambah baru
      const res = createEducationModule({
        title: formData.title.trim(),
        category: formData.category.trim() || 'Umum',
        readTime: formData.readTime.trim() || '5 menit',
        points: Number(formData.points) || 15,
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        createdBy: adminId,
      });
      if (res?.error) {
        setFormError(res.error);
        return;
      }
      showNotif('success', `Modul "${formData.title}" berhasil ditambahkan dan tampil di halaman edukasi user.`);
    }

    setIsFormOpen(false);
    setEditingModule(null);
    setFormData(EMPTY_FORM);
    setRefreshKey((prev) => prev + 1);
  };

  // Toggle aktif/nonaktif modul
  const handleToggleModule = (mod) => {
    updateEducationModule(mod.id, { isActive: !mod.isActive });
    showNotif('success', `Modul "${mod.title}" ${!mod.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
    setRefreshKey((prev) => prev + 1);
  };

  // Hapus modul
  const handleDeleteModule = (mod) => {
    if (!window.confirm(`Hapus modul "${mod.title}" secara permanen?`)) return;
    deleteEducationModule(mod.id);
    showNotif('success', `Modul "${mod.title}" berhasil dihapus.`);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          Kurikulum & Reward ByeBills
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Edukasi & Reward</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tambah & kelola modul edukasi, katalog reward, dan daftar lencana yang tersedia.
        </p>
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

      {/* Sub-nav */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { key: 'modules', label: 'Modul Edukasi', icon: BookOpen, count: educationModules.length },
          { key: 'rewards', label: 'Katalog Reward', icon: Tag, count: shopItems.length },
          { key: 'badges', label: 'Koleksi Lencana', icon: Trophy, count: badges.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
              activeSection === tab.key
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-normal">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB: Modul Edukasi ── */}
      {activeSection === 'modules' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Modul yang aktif akan tampil di halaman Edukasi pengguna.
            </p>
            <button
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Tambah Modul
            </button>
          </div>

          {/* Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
              <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-800">
                    {editingModule ? 'Edit Modul Edukasi' : 'Tambah Modul Edukasi Baru'}
                  </h3>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Judul Modul <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Contoh: Mengenal Pinjol Ilegal vs Legal"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                        placeholder="Contoh: Legalitas & Regulasi"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estimasi Baca</label>
                        <input
                          type="text"
                          value={formData.readTime}
                          onChange={(e) => setFormData((p) => ({ ...p, readTime: e.target.value }))}
                          placeholder="5 menit"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Poin Reward</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={formData.points}
                          onChange={(e) => setFormData((p) => ({ ...p, points: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ringkasan Singkat</label>
                      <input
                        type="text"
                        value={formData.summary}
                        onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                        placeholder="Deskripsi singkat modul untuk tampilan daftar..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Konten Modul <span className="text-rose-500">*</span>
                        <span className="text-slate-400 font-normal ml-1">(Markdown didukung: ### Judul, **tebal**, - daftar)</span>
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                        rows={10}
                        placeholder="Tulis konten materi edukasi di sini...&#10;&#10;### Judul Bagian&#10;- Poin pertama&#10;- Poin kedua"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-mono leading-relaxed resize-y"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition"
                    >
                      {editingModule ? 'Simpan Perubahan' : 'Tambahkan Modul'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Daftar Modul */}
          {educationModules.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold">Belum ada modul edukasi.</p>
              <p className="text-xs mt-1">Klik "Tambah Modul" untuk membuat materi pertama.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {educationModules.map((mod) => (
                <div
                  key={mod.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-4 ${
                    mod.isActive === false ? 'opacity-60 border-slate-200' : 'border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{mod.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          mod.isActive === false
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {mod.isActive === false ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 rounded">{mod.category || 'Umum'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {mod.readTime}
                      </span>
                      <span className="font-semibold text-emerald-700">+{mod.points} Poin</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleModule(mod)}
                      title={mod.isActive === false ? 'Aktifkan' : 'Nonaktifkan'}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                    >
                      {mod.isActive === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenEditForm(mod)}
                      title="Edit"
                      className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod)}
                      title="Hapus"
                      className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Katalog Reward ── */}
      {activeSection === 'rewards' && (
        <div className="space-y-5">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari item reward..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nama Item</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Harga Poin</th>
                    <th className="p-4">Stok</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShopItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-600 capitalize">{item.category}</td>
                      <td className="p-4 font-bold text-amber-700">{item.pointsCost} pts</td>
                      <td className="p-4 text-xs text-slate-600">
                        {item.stock !== null ? item.stock : '∞'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            item.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {item.isAvailable ? 'Tersedia' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleShopItem(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            item.isAvailable
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.isAvailable ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Koleksi Lencana ── */}
      {activeSection === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{badge.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                <div className="text-[11px] text-slate-400 mt-2">
                  Kriteria: {badge.criteria || 'Pencapaian sistem'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}