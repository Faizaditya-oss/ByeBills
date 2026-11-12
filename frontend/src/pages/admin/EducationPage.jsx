import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Tag,
  Clock,
  CheckCircle2,
  BookMarked,
  Trophy,
} from 'lucide-react';
import {
  getAllShopItems,
  updateShopItem,
  getAllBadges,
} from '../../services/storage.js';

const EDUCATION_MODULES = [
  { id: 'modul-001', title: 'Mengenal Ciri-Ciri Pinjol Ilegal vs Legal OJK', category: 'Legalitas & Regulasi', readTime: '5 menit', points: 15 },
  { id: 'modul-002', title: 'Prinsip Debt-to-Income Ratio & Anggaran Sehat', category: 'Manajemen Keuangan', readTime: '6 menit', points: 15 },
  { id: 'modul-003', title: 'Strategi Pelunasan: Metode Snowball vs Avalanche', category: 'Strategi Pelunasan', readTime: '7 menit', points: 20 },
  { id: 'modul-004', title: 'Menghadapi Teror Penagihan & Melapor Satgas', category: 'Advokasi & Hak', readTime: '5 menit', points: 20 },
];

export default function AdminEducationPage() {
  const [activeSection, setActiveSection] = useState('modules'); // 'modules' | 'rewards' | 'badges'
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState('');

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

  const handleToggleShopItem = (item) => {
    const updated = updateShopItem(item.id, { isAvailable: !item.isAvailable });
    if (updated) {
      setNotification(`Item "${item.name}" ${!item.isAvailable ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          Kurikulum & Reward BUBU
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Edukasi & Reward</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau kurikulum modul, kelola katalog reward, dan daftar lencana yang tersedia.
        </p>
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

      {/* Sub-nav */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { key: 'modules', label: 'Modul Edukasi', icon: BookOpen, count: EDUCATION_MODULES.length },
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

      {/* Modul Edukasi */}
      {activeSection === 'modules' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 italic">
            Modul edukasi saat ini dikelola secara statis dalam kode aplikasi. Konten modul tersedia di halaman Edukasi pengguna.
          </p>
          {EDUCATION_MODULES.map((mod) => (
            <div
              key={mod.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{mod.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 rounded">{mod.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {mod.readTime}
                    </span>
                    <span className="font-semibold text-emerald-700">+{mod.points} Poin</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Aktif
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Katalog Reward */}
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

      {/* Koleksi Lencana */}
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