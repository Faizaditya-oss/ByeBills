/**
 * financialFaq.js
 * Daftar pertanyaan dan jawaban interaktif seputar pinjaman,
 * kesehatan finansial, dan tips praktis di aplikasi ByeBills.
 */

export const FINANCIAL_FAQ_CATEGORIES = [
  { id: 'all', label: 'Semua Topik' },
  { id: 'pinjol', label: 'Legalitas & Regulasi' },
  { id: 'pelunasan', label: 'Strategi Pelunasan' },
  { id: 'dc', label: 'Penagihan & DC' },
  { id: 'bubu', label: 'Fitur ByeBills & Poin' },
];

export const FINANCIAL_FAQS = [
  {
    id: 'faq-01',
    category: 'pinjol',
    question: 'Gimana cara membedakan pinjaman legal vs pinjaman ilegal?',
    answer:
      'Pinjaman legal wajib berizin resmi OJK, membatasi bunga maks. 0.3%/hari, dan HANYA boleh mengakses izin CAMILAN (Camera, Microphone, Location). Jika aplikasi meminta akses seluruh kontak telepon atau galeri foto, dapat dipastikan itu pinjaman tanpa izin resmi!',
  },
  {
    id: 'faq-02',
    category: 'pelunasan',
    question: 'Apa bedanya metode pelunasan Snowball vs Avalanche?',
    answer:
      'Metode Snowball fokus melunasi hutang dari saldo terkecil lebih dahulu agar memberi dorongan psikologis cepat. Metode Avalanche melunasi hutang berbunga paling tinggi lebih dahulu untuk menghemat total bunga. Anda bisa menyimulasikan keduanya di menu Pinjaman Saya!',
  },
  {
    id: 'faq-03',
    category: 'dc',
    question: 'Debt Collector mengintimidasi dan menyebar data, harus apa?',
    answer:
      'Tetap tenang dan jangan kirim uang ke rekening pribadi penagih. Kumpulkan bukti pesan/rekaman, catat aduan di menu Kasus ByeBills, dan laporkan ke Kontak OJK 157 atau Satgas Waspada Investasi (PASTI) karena intimidasi melanggar hukum.',
  },
  {
    id: 'faq-04',
    category: 'bubu',
    question: 'Bagaimana cara mendapatkan poin dan aksesori karakter?',
    answer:
      'Setiap kali Anda mencatat pembayaran cicilan tepat waktu, mengunggah bukti aktivitas positif, atau menyelesaikan modul edukasi, Anda mendapatkan poin reward! Poin tersebut dapat ditukar dengan topi, kacamata, dan aksesori keren di halaman Profil Anda.',
  },
  {
    id: 'faq-05',
    category: 'pelunasan',
    question: 'Bolehkah gali lubang tutup lubang untuk membayar tagihan?',
    answer:
      'Sangat tidak disarankan! Mengambil pinjaman baru untuk membayar pinjaman lama hanya memperbesar akumulasi bunga dan biaya admin. Lebih baik hubungi pihak platform untuk restrukturisasi atau minta pendampingan di ByeBills.',
  },
  {
    id: 'faq-06',
    category: 'bubu',
    question: 'Kapan pinjaman bisa dihapus dari riwayat daftar pinjaman?',
    answer:
      'Ketika Anda telah melunasi pinjaman dan mengunggah foto bukti transfer pelunasan, Anda dapat menekan tombol "Selesaikan & Hapus" di kartu pinjaman untuk merayakan keberhasilan bebas utang Anda!',
  },
  {
    id: 'faq-07',
    category: 'pinjol',
    question: 'Apakah gagal bayar pinjaman ilegal masuk ke skor SLIK OJK?',
    answer:
      'Tidak. Pinjaman ilegal tidak terdaftar di OJK sehingga tidak memiliki akses untuk melaporkan ke SLIK OJK (BI Checking). Namun, pinjaman legal yang terdaftar di OJK akan melaporkan riwayat keterlambatan pembayaran ke SLIK.',
  },
  {
    id: 'faq-08',
    category: 'pelunasan',
    question: 'Berapa persen porsi ideal cicilan dari penghasilan bulanan?',
    answer:
      'Batas aman total seluruh cicilan hutang adalah maksimal 30% dari penghasilan bersih bulanan Anda (rasio DTI). Jika cicilan melebihi 30%, segera lakukan penyesuaian gaya hidup dan prioritaskan percepatan pelunasan.',
  },
];
