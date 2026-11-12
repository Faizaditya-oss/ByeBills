import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getProgressByUser,
  completeModule,
  submitQuiz,
  getLatestQuizResult,
  getUserTotalPoints,
} from '../../services/storage.js';

// Kurikulum Modul Edukasi Finansial BUBU
const EDUCATION_MODULES = [
  {
    id: 'modul-001',
    title: 'Mengenal Ciri-Ciri Pinjol Ilegal vs Legal OJK',
    category: 'Legalitas & Regulasi',
    readTime: '5 menit',
    points: 15,
    summary: 'Pahami cara membedakan platform berizin resmi OJK dengan jeratan pinjol ilegal predatory.',
    content: `
### 1. Ciri Utama Pinjol Legal Berizin OJK:
- Terdaftar resmi di situs resmi OJK (ojk.go.id).
- Bunga, denda, dan biaya transparan maksimal sesuai regulasi Asosiasi Fintech Pendanaan Bersama Indonesia (AFPI).
- Hanya meminta akses izin smartphone terbatas: **CAMILAN** (Camera, Microphone, Location). Tidak boleh menyedot kontak atau galeri!
- Memiliki layanan pengaduan konsumen yang jelas dan alamat kantor fisik yang valid.

### 2. Tanda Bahaya Pinjol Ilegal:
- Penawaran agresif via SMS/WhatsApp nomor acak tanpa pernah mendaftar.
- Bunga harian sangat tinggi mencekik dan tenor pinjaman sangat singkat (misal 7 hari padahal dijanjikan 30 hari).
- Meminta akses seluruh kontak telepon, galeri foto, dan data sensitif.
- Menggunakan ancaman, intimidasi, dan penyebaran data pribadi saat penagihan.

### 3. Langkah Pencegahan:
Selalu cek legalitas entitas pinjol sebelum mengajukan pinjaman dengan menghubungi Kontak OJK 157 atau WhatsApp resmi 081-157-157-157.
    `,
  },
  {
    id: 'modul-002',
    title: 'Prinsip Debt-to-Income Ratio & Anggaran Sehat',
    category: 'Manajemen Keuangan',
    readTime: '6 menit',
    points: 15,
    summary: 'Ketahui batas aman beban utang bulanan agar arus kas keuangan tidak defisit.',
    content: `
### 1. Apa itu Rasio DTI (Debt-to-Income)?
Debt-to-Income Ratio adalah persentase total cicilan bulanan dibandingkan dengan penghasilan bersih bulanan Anda.

### 2. Aturan Batas Maksimal 30%:
- Idealnya, total seluruh cicilan utang bulanan tidak boleh melebihi **30% dari gaji bersih**.
- Jika penghasilan Anda Rp4.000.000, maka batas maksimal cicilan gabungan adalah Rp1.200.000.
- Rasio di atas 40% menandakan tanda bahaya (Financial Distress) yang rentan memicu gali lubang tutup lubang.

### 3. Alokasi 50/30/20:
- **50% Kebutuhan Pokok**: Makanan, tempat tinggal, transportasi, tagihan listrik & air.
- **30% Keinginan & Cicilan Terkendali**: Hiburan, lifestyle, cicilan produktif.
- **20% Tabungan & Dana Darurat**: Tabungan masa depan dan bantalan darurat.
    `,
  },
  {
    id: 'modul-003',
    title: 'Strategi Pelunasan: Metode Snowball vs Avalanche',
    category: 'Strategi Pelunasan',
    readTime: '7 menit',
    points: 20,
    summary: 'Dua metode ilmiah terbukti ampuh melunasi banyak utang tanpa panik.',
    content: `
### 1. Metode Snowball (Fokus Kemenangan Mental):
- Urutkan seluruh utang dari saldo nominal terkecil ke terbesar, tanpa melihat suku bunganya.
- Bayar cicilan minimum di semua pinjaman, lalu alokasikan dana ekstra sebesar mungkin untuk melunasi utang terkecil lebih dahulu.
- Setelah utang terkecil lunas, alihkan dana tersebut ke utang terkecil berikutnya. Kemenangan cepat ini memberi dorongan psikologis yang kuat.

### 2. Metode Avalanche (Fokus Hemat Bunga Finansial):
- Urutkan utang dari suku bunga persentase tertinggi ke suku bunga terendah.
- Lunasi secepat mungkin pinjaman dengan bunga paling mencekik terlebih dahulu.
- Secara matematis, metode ini menghemat biaya total bunga paling banyak.

### 3. Rekomendasi BUBU:
Pilihlah metode yang paling konsisten bisa Anda jalankan. Disiplin pencatatan harian adalah kunci keberhasilan.
    `,
  },
  {
    id: 'modul-004',
    title: 'Menghadapi Teror Penagihan & Melapor Satgas',
    category: 'Advokasi & Hak',
    readTime: '5 menit',
    points: 20,
    summary: 'Pedoman menghadapi intimidasi oknum debt collector secara hukum yang aman dan sah.',
    content: `
### 1. Hak Anda sebagai Konsumen:
- Penagihan tidak boleh menggunakan kekerasan fisik, ancaman verbal, atau mempermalukan nasabah.
- Penagihan dilarang dilakukan di luar jam 08.00 - 20.00 waktu setempat.
- Penagih dilarang menghubungi pihak di luar kontak darurat resmi yang disetujui.

### 2. Langkah Pengamanan Saat Diteror:
- Jangan panik dan jangan membalas dengan emosi.
- Rekam bukti pesan singkat, rekaman suara, atau tangkapan layar intimidasi.
- Buat Aduan resmi di sistem BUBU agar tercatat di kronologi bantuan.
- Laporkan ke Satgas Pemberantasan Aktivitas Keuangan Ilegal (Satgas PASTI OJK) melalui email waspadainvestasi@ojk.go.id atau portal kontak157.ojk.go.id.
    `,
  },
];

// Pertanyaan Kuis Karakter Finansial
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'Saat menerima gaji bulanan atau uang saku, apa hal pertama yang biasa Anda lakukan?',
    options: [
      { text: 'Menyisihkan minimal 20% langsung ke rekening tabungan/investasi.', type: 'Bijak Terencana' },
      { text: 'Membayar cicilan tagihan wajib lalu sisanya dipakai belanja.', type: 'Disiplin Bertanggung Jawab' },
      { text: 'Membeli barang wishlist yang diinginkan terlebih dahulu.', type: 'Impulsif Eksploratif' },
      { text: 'Sering bingung uang habis untuk apa di pertengahan bulan.', type: 'Perlu Pendampingan' },
    ],
  },
  {
    id: 2,
    question: 'Bagaimana reaksi Anda saat melihat promo pinjaman dana cepat bunga rendah di medsos?',
    options: [
      { text: 'Memeriksa legalitas nomor izin di portal resmi OJK 157.', type: 'Bijak Terencana' },
      { text: 'Mengabaikannya karena tidak membutuhkan utang baru.', type: 'Disiplin Bertanggung Jawab' },
      { text: 'Tertarik mencoba untuk membeli kebutuhan lifestyle/gadget.', type: 'Impulsif Eksploratif' },
      { text: 'Tergiur karena sedang terdesak butuh uang untuk menutup cicilan lain.', type: 'Perlu Pendampingan' },
    ],
  },
  {
    id: 3,
    question: 'Jika memiliki cicilan pinjaman berjalan, langkah mana yang Anda prioritaskan?',
    options: [
      { text: 'Membuat tabel amortisasi pelunasan dan mengalokasikan dana darurat.', type: 'Bijak Terencana' },
      { text: 'Membayar tepat waktu sebelum tanggal jatuh tempo tiba.', type: 'Disiplin Bertanggung Jawab' },
      { text: 'Membayar hanya nominal minimum agar masih ada sisa dana jajan.', type: 'Impulsif Eksploratif' },
      { text: 'Kerap telat bayar karena terlupa tanggal jatuh tempo.', type: 'Perlu Pendampingan' },
    ],
  },
];

export default function EducationPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedModule, setSelectedModule] = useState(EDUCATION_MODULES[0]);
  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'quiz'
  const [notification, setNotification] = useState('');

  // Kuis state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Data progress modul user dari storage
  const userProgress = useMemo(() => {
    if (!userId) return [];
    return getProgressByUser(userId);
  }, [userId, refreshKey]);

  // Hasil kuis terakhir
  const latestQuiz = useMemo(() => {
    if (!userId) return null;
    return getLatestQuizResult(userId);
  }, [userId, refreshKey, quizSubmitted]);

  // Total poin user saat ini
  const totalPoints = useMemo(() => {
    if (!userId) return 0;
    return getUserTotalPoints(userId);
  }, [userId, refreshKey]);

  // Cek apakah modul tertentu sudah diselesaikan
  const isModuleCompleted = (modId) => {
    const prog = userProgress.find((p) => p.moduleId === modId);
    return prog && prog.status === 'selesai';
  };

  // Handler selesaikan modul edukasi
  const handleCompleteModule = (mod) => {
    if (!userId) return;
    if (isModuleCompleted(mod.id)) {
      setNotification(`Modul "${mod.title}" sudah pernah diselesaikan sebelumnya.`);
      return;
    }

    const res = completeModule({
      userId,
      moduleId: mod.id,
      pointsReward: mod.points,
    });

    if (res) {
      setNotification(`🎉 Selamat! Anda menyelesaikan modul dan mendapatkan +${mod.points} Poin BUBU!`);
      setRefreshKey((prev) => prev + 1);
    }
  };

  // Handler kirim jawaban kuis
  const handleSubmitQuiz = (e) => {
    e.preventDefault();
    if (Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
      alert('Mohon jawab seluruh pertanyaan kuis terlebih dahulu.');
      return;
    }

    // Tentukan tipe dominan
    const counts = {};
    Object.values(quizAnswers).forEach((type) => {
      counts[type] = (counts[type] || 0) + 1;
    });

    let topType = 'Bijak Terencana';
    let maxCount = 0;
    for (const [t, c] of Object.entries(counts)) {
      if (c > maxCount) {
        maxCount = c;
        topType = t;
      }
    }

    const saved = submitQuiz({
      userId,
      characterType: topType,
      scores: counts,
      answers: Object.entries(quizAnswers).map(([qId, ans]) => ({ questionId: qId, selected: ans })),
    });

    if (saved) {
      setQuizSubmitted(true);
      setNotification(`🎉 Kuis berhasil diselesaikan! Karakter finansial Anda: "${topType}". Anda memperoleh +25 Poin!`);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const completedCount = EDUCATION_MODULES.filter((m) => isModuleCompleted(m.id)).length;
  const progressPercentage = Math.round((completedCount / EDUCATION_MODULES.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-medium mb-2 backdrop-blur-sm">
            <BookOpen className="w-3.5 h-3.5" />
            Literasi & Bebas Finansial
          </div>
          <h1 className="text-2xl font-bold">Pusat Edukasi & Kuis Finansial</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Tingkatkan pemahaman finansial Anda untuk terbebas dari jerat utang, selesaikan modul edukasi, dan kumpulkan poin reward.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center min-w-[140px]">
          <span className="text-xs text-emerald-100 block">Total Poin Anda</span>
          <span className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
            <Sparkles className="w-5 h-5" />
            {totalPoints}
          </span>
        </div>
      </div>

      {/* Notifikasi feedback */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification('')}
            className="text-xs text-emerald-600 hover:underline font-semibold ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('modules')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'modules'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Kurikulum Modul ({completedCount}/{EDUCATION_MODULES.length})
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'quiz'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Kuis Karakter Finansial
          {latestQuiz && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
              Selesai
            </span>
          )}
        </button>
      </div>

      {activeTab === 'modules' && (
        <div className="space-y-6">
          {/* Progress Bar Keseluruhan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Kemajuan Pembelajaran Anda</span>
              <span className="text-sm font-bold text-emerald-600">{progressPercentage}% Selesai</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daftar Modul (Kolom Kiri) */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Daftar Materi
              </h2>
              {EDUCATION_MODULES.map((mod) => {
                const completed = isModuleCompleted(mod.id);
                const isSelected = selectedModule?.id === mod.id;

                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModule(mod)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {mod.category}
                      </span>
                      {completed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> +{mod.points} Poin
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mt-2 line-clamp-2">
                      {mod.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {mod.readTime}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Konten Bacaan Modul (Kolom Kanan) */}
            <div className="lg:col-span-2">
              {selectedModule ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                        {selectedModule.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {selectedModule.readTime}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mt-1">
                      {selectedModule.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{selectedModule.summary}</p>
                  </div>

                  {/* Body Content */}
                  <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3">
                    {selectedModule.content}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      Reward Modul:{' '}
                      <strong className="text-emerald-700 font-bold">
                        +{selectedModule.points} Poin BUBU
                      </strong>
                    </div>

                    {isModuleCompleted(selectedModule.id) ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Modul Telah Diselesaikan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCompleteModule(selectedModule)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Tandai Selesai & Klaim +{selectedModule.points} Poin
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                  Pilih materi di sebelah kiri untuk mulai membaca.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Kuis Karakter Finansial */}
      {activeTab === 'quiz' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {latestQuiz ? (
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Hasil Kuis Karakter Finansial Anda
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {latestQuiz.characterType}
                </h3>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                  {latestQuiz.characterType === 'Bijak Terencana'
                    ? 'Luar biasa! Anda memiliki kontrol finansial yang sehat, rasio utang terkendali, dan visi perlindungan masa depan yang solid.'
                    : latestQuiz.characterType === 'Disiplin Bertanggung Jawab'
                    ? 'Sangat baik! Anda selalu memprioritaskan kewajiban pembayaran tepat waktu dan menjauhi beban utang yang berlebihan.'
                    : latestQuiz.characterType === 'Impulsif Eksploratif'
                    ? 'Waspada! Anda rentan tergiur promo pinjaman instan untuk hal konsumtif. Mulailah menetapkan pagu anggaran 50/30/20.'
                    : 'Jangan berkecil hati. Bubu dan tim Admin siap mendampingi Anda mengatur ulang arus kas dan melunasi utang berjalan.'}
                </p>
                <div className="text-xs text-slate-400 mt-3">
                  Terakhir diambil: {new Date(latestQuiz.takenAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold rounded-lg transition"
                >
                  <RotateCcw className="w-4 h-4" /> Ulangi Kuis
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Kuis Evaluasi Gaya Keuangan</h2>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> +25 Poin Reward
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Jawab 3 pertanyaan singkat di bawah ini secara jujur untuk mengetahui profil finansial Anda.
                </p>
              </div>

              <form onSubmit={handleSubmitQuiz} className="space-y-6">
                {QUIZ_QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800">
                      {idx + 1}. {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition ${
                            quizAnswers[q.id] === opt.type
                              ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-medium'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt.type}
                            checked={quizAnswers[q.id] === opt.type}
                            onChange={() =>
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [q.id]: opt.type,
                              }))
                            }
                            className="mt-1 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Kirim Jawaban & Dapatkan Poin
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}