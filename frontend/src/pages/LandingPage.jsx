import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingDown,
  Sparkles,
  HeartPulse,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Lock,
  Award,
  BookOpen,
  Users,
  AlertTriangle,
  ChevronRight,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            {/* Logo Navbar Mobile (< 640px) */}
            <img
              src="/navbar-mobile.svg"
              alt="ByeBills"
              className="h-9 w-auto sm:hidden group-hover:opacity-90 transition-opacity"
            />
            {/* Logo Navbar Desktop (>= 640px) */}
            <img
              src="/navbar.svg"
              alt="ByeBills"
              className="h-9 w-auto hidden sm:block group-hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#fitur" className="hover:text-emerald-600 transition-colors">
              Fitur Utama
            </a>
            <a href="#solusi" className="hover:text-emerald-600 transition-colors">
              Metode Pelunasan
            </a>
            <a href="#cara-kerja" className="hover:text-emerald-600 transition-colors">
              Cara Kerja
            </a>
            <a href="#testimoni" className="hover:text-emerald-600 transition-colors">
              Kisah Nyata
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
            >
              Daftar Akun Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-emerald-50/20 to-slate-50">
        {/* Dekorasi Latar Belakang Halus */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Teks Hero */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Solusi Pendampingan Pinjaman Online #1 untuk Gen Z
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Hentikan Gali Lubang Tutup Lubang.{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                  Raih Bebas Utang
                </span>{' '}
                Sekarang.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                ByeBills adalah platform terpercaya yang mendampingi Anda menghadapi teror pinjol,
                menyusun simulasi pelunasan ilmiah (Snowball &amp; Avalanche), serta memulihkan
                kesehatan mental finansial Anda. <strong>100% aman, rahasia, dan gratis.</strong>
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5"
                >
                  Mulai Bebas Pinjol Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-base border border-slate-200 shadow-sm transition-all text-center"
                >
                  Sudah Punya Akun? Masuk
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tanpa Biaya Pendaftaran</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Data Privat &amp; Aman</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sesuai Regulasi OJK &amp; AFPI</span>
                </div>
              </div>
            </div>

            {/* Visual Card Mockup Hero */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl shadow-slate-200 border border-slate-100 space-y-5">
                {/* Header Mockup */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
                      BB
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Ringkasan Finansial Anda</div>
                      <div className="text-sm font-bold text-slate-800">Status: Menuju Pelunasan 🎯</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                    Aktif
                  </span>
                </div>

                {/* Stat Box */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Beban Utang Berjalan
                    </div>
                    <div className="text-lg font-black text-rose-600 mt-1">Rp 7.500.000</div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Turun Rp 2,5 jt
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Kesehatan Finansial
                    </div>
                    <div className="text-lg font-black text-emerald-700 mt-1">Sehat (28%)</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">DTI di bawah 30%</div>
                  </div>
                </div>

                {/* Progress Rencana Pelunasan */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Strategi Snowball: Pinjaman #1
                    </span>
                    <span className="font-black text-emerald-700">75% Lunas</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-2.5 rounded-full w-3/4 transition-all" />
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed pt-1">
                    🎉 Estimasi lunas 2 bulan lebih cepat dengan penghematan bunga ekstra!
                  </p>
                </div>

                {/* Notifikasi Penanganan Masalah */}
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-xs text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Aduan teror debt collector telah dikawal sesuai SOP perlindungan konsumen OJK.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PROBLEM & EMPATHY SECTION ───────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Jangan Hadapi Sendirian
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Apakah Anda Merasakan Tekanan Ini?
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              Jeratan pinjaman online bukan hanya masalah angka, melainkan beban pikiran yang
              menguras waktu, energi, dan masa depan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3 hover:border-rose-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Teror &amp; Intimidasi Penagihan</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pesan ancaman ke kontak darurat, dipermalukan di tempat kerja, hingga ancaman sebar
                data pribadi yang melanggar hukum.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3 hover:border-amber-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Lingkaran Gali Lubang Tutup Lubang</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Meminjam di aplikasi baru untuk menutup utang lama. Bunga terus menumpuk sampai gaji
                bulanan lenyap tak bersisa.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Kecemasan &amp; Stres Finansial</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sulit tidur dan tidak fokus beraktivitas karena takut membuka ponsel. Bingung harus
                mulai melunasi dari mana tanpa bantuan yang jelas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. FITUR UNGGULAN ──────────────────────────────────────────────── */}
      <section id="fitur" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Solusi Terpadu ByeBills
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Semua Fitur yang Anda Butuhkan untuk Merdeka dari Utang
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              Didesain khusus untuk Gen Z: tampilan modern, bebas ribet, dan memberikan dampak nyata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fitur 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Simulasi Rencana Pelunasan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gunakan strategi ilmiah <strong>Snowball</strong> untuk kemenangan psikologis cepat,
                atau <strong>Avalanche</strong> untuk hemat bunga maksimal.
              </p>
            </div>

            {/* Fitur 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Aduan &amp; Pendampingan Kasus</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dokumentasikan teror penagihan, terima panduan hukum advokasi resmi, dan laporkan
                ke Satgas PASTI OJK secara terstruktur.
              </p>
            </div>

            {/* Fitur 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Kalkulator DTI &amp; Mental</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ketahui skor Debt-to-Income dan evaluasi beban stres keuangan Anda dengan rekomendasi
                langkah konkret yang aman.
              </p>
            </div>

            {/* Fitur 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Edukasi &amp; Poin Reward</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pelajari modul literasi anti-pinjol, ikuti kuis finansial, kumpulkan poin reward, dan
                buka lencana prestasi pelunasan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. CARA KERJA (3 LANGKAH) ──────────────────────────────────────── */}
      <section id="cara-kerja" className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Proses Mudah &amp; Cepat
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              3 Langkah Mudah Menuju Kebebasan Finansial
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              Tidak ada proses rumit. Mulai dalam hitungan menit langsung dari peramban Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-800">Daftar &amp; Catat Pinjaman</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Buat akun gratis dan masukkan daftar pinjaman Anda. Seluruh data disimpan secara
                terenkripsi dan privat di perangkat Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-800">Pilih Rencana Pelunasan</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sistem menghitung strategi prioritas pembayaran terbaik agar beban bunga tidak
                membengkak dan stres berkurang.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-800">Klaim Poin &amp; Hidup Bebas</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Upload bukti pembayaran, dapatkan poin reward edukasi, dan nikmati ketenangan hidup
                tanpa teror tagihan pinjol.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONI PENGGUNA ──────────────────────────────────────────── */}
      <section id="testimoni" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Kisah Nyata
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Mereka yang Telah Mengambil Kendali Kembali
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              Pengalaman nyata generasi muda yang berhasil melepaskan diri dari jeratan utang online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                "Sebelum tahu ByeBills, saya punya utang di 4 aplikasi pinjol dan tiap hari diteror
                WhatsApp. Begitu pakai strategi Snowball dan tahu hak hukum konsumen OJK, saya bisa
                lunas satu per satu tanpa panik."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  AP
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Andi Pratama, 24</div>
                  <div className="text-[11px] text-slate-400">Karyawan Swasta — Lunas 3 Pinjol</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                "Kalkulator DTI dan rencana pelunasannya beneran ngebuka mata. Saya jadi tahu batas
                aman gaji saya untuk nyicil dan sekarang arus kas bulanan saya sudah kembali positif."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  BS
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Budi Santoso, 26</div>
                  <div className="text-[11px] text-slate-400">Freelancer Desainer</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                "Fitur aduan dan pendampingannya sangat membantu. Saya jadi berani menghadapi penagih
                ilegal yang melanggar aturan dan bisa fokus menyelesaikan pokok pinjaman."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                  ML
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Maya Lestari, 22</div>
                  <div className="text-[11px] text-slate-400">Fresh Graduate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FINAL HIGH-CONVERTING CTA BANNER ─────────────────────────────── */}
      <section className="py-20 bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-800 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-100 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Waktunya Memulai Lembaran Baru
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Masa Depanmu Terlalu Berharga untuk Dihabisi Bunga Pinjol.
          </h2>

          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan pengguna lain yang sudah mengambil langkah nyata menuju
            ketenangan pikiran dan kebebasan finansial.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-emerald-800 font-black rounded-xl text-base shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Buat Akun Gratis Sekarang
              <ArrowRight className="w-5 h-5 text-emerald-700" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-4 bg-emerald-900/60 hover:bg-emerald-900/80 text-white font-semibold rounded-xl text-base border border-emerald-500/40 transition-colors text-center"
            >
              Masuk ke Aplikasi
            </Link>
          </div>

          <p className="text-xs text-emerald-200/80 pt-2">
            Pendaftaran cepat dalam 1 menit • Tidak memerlukan kartu kredit • 100% Gratis
          </p>
        </div>
      </section>

      {/* ── 8. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-lg font-black text-white">ByeBills</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Platform pendampingan, advokasi, dan edukasi penanganan pinjaman online untuk
                generasi muda Indonesia. Menumbuhkan kesehatan finansial yang berkelanjutan dan
                bebas dari jerat utang predator.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Akses Cepat</h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link to="/login" className="hover:text-emerald-400 transition-colors">
                    Masuk ke Akun
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-emerald-400 transition-colors">
                    Daftar Akun Baru
                  </Link>
                </li>
                <li>
                  <a href="#fitur" className="hover:text-emerald-400 transition-colors">
                    Fitur &amp; Rencana Pelunasan
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Advokasi &amp; Edukasi</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Informasi dan simulasi disajikan untuk edukasi finansial konsumen. Apabila mengalami
                intimidasi pidana, segera hubungi Satgas PASTI OJK di Kontak 157.
              </p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} ByeBills. Hak Cipta Dilindungi.</p>
            <p>Dibuat untuk Masa Depan Finansial Gen Z yang Lebih Cerah.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
