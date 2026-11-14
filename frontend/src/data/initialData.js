/**
 * initialData.js
 * Data awal untuk demonstrasi aplikasi BUBU.
 * Data ini akan dimuat ke localStorage hanya jika localStorage masih kosong.
 *
 * ⚠️  PERINGATAN KEAMANAN — HANYA UNTUK DEMO / PROTOTIPE:
 * ─────────────────────────────────────────────────────────
 * hashPassword() dan checkPassword() menggunakan Base64 (btoa/atob),
 * yang merupakan ENCODING, BUKAN HASHING.
 *
 * Base64 dapat dibalik (reversibel) secara trivial:
 *   atob('ZGVtbzEyMw==') === 'demo123'  // ← siapa pun bisa melakukan ini
 *
 * Ini TIDAK memberikan perlindungan keamanan nyata. Fungsi ini ada
 * semata-mata agar password tidak tersimpan sebagai plaintext murni
 * di localStorage selama pengembangan.
 *
 * Untuk produksi: gunakan bcrypt / argon2 di sisi server dengan HTTPS.
 * ─────────────────────────────────────────────────────────
 */

/**
 * "Hash" password untuk demo — BUKAN enkripsi, hanya encoding Base64.
 * @param {string} plain - Password asli
 * @returns {string} String bertanda 'demo:' + Base64(password)
 */
export function hashPassword(plain) {
  return 'demo:' + btoa(plain);
}

/**
 * Verifikasi password untuk demo — cocokkan dengan encoding Base64.
 * @param {string} plain - Password yang diinput user
 * @param {string} hashed - Nilai passwordHash dari store
 * @returns {boolean}
 */
export function checkPassword(plain, hashed) {
  return hashed === 'demo:' + btoa(plain);
}

// ─── USERS ──────────────────────────────────────────────────────────────────
// Role: 'user' | 'konselor' | 'admin'
export const initialUsers = [
  {
    id: 'user-001',
    name: 'Andi Pratama',
    email: 'andi@demo.com',
    passwordHash: hashPassword('demo123'),
    role: 'user',
    phone: '08111000001',
    avatarUrl: null,
    equippedAccessories: ['acc_glasses_smart'],
    unlockedAccessories: ['acc_glasses_smart'],
    bio: 'Karyawan swasta yang sedang berupaya melunasi pinjaman.',
    specialization: null,
    joinedAt: '2026-10-01T08:00:00.000Z',
    points: 150,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'user-002',
    name: 'Budi Santoso',
    email: 'budi@demo.com',
    passwordHash: hashPassword('demo123'),
    role: 'user',
    phone: '08111000002',
    avatarUrl: null,
    bio: 'Freelancer desainer grafis.',
    specialization: null,
    joinedAt: '2026-10-05T09:00:00.000Z',
    points: 80,
    isActive: true,
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z',
  },
  {
    id: 'konselor-001',
    name: 'Siti Rahayu, S.Psi',
    email: 'siti@demo.com',
    passwordHash: hashPassword('konselor123'),
    role: 'konselor',
    phone: '08222000001',
    avatarUrl: null,
    bio: 'Konselor keuangan dan pendamping psikologis korban penagihan pinjaman dengan pengalaman 5 tahun.',
    specialization: 'Pinjaman & Negosiasi Kredit',
    joinedAt: '2026-09-01T07:00:00.000Z',
    points: 0,
    isActive: true,
    createdAt: '2026-09-01T07:00:00.000Z',
    updatedAt: '2026-09-01T07:00:00.000Z',
  },
  {
    id: 'admin-001',
    name: 'Admin ByeBills',
    email: 'admin@demo.com',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    phone: '08333000001',
    avatarUrl: null,
    bio: 'Administrator sistem ByeBills.',
    specialization: null,
    joinedAt: '2026-08-01T07:00:00.000Z',
    points: 0,
    isActive: true,
    createdAt: '2026-08-01T07:00:00.000Z',
    updatedAt: '2026-08-01T07:00:00.000Z',
  },
];

// ─── CASES ───────────────────────────────────────────────────────────────────
// Status: 'baru' | 'diproses' | 'selesai' | 'ditutup'
// category: 'pinjol_ilegal' | 'bunga_tinggi' | 'pinjaman_ganda' | 'intimidasi' | 'lainnya'
export const initialCases = [
  {
    id: 'case-001',
    userId: 'user-001',
    konselorId: 'konselor-001',
    title: 'Pinjaman Tanpa Izin Resmi — Bunga Tidak Wajar',
    description:
      'Saya meminjam Rp 2.000.000 dari aplikasi "CepetCair" yang belakangan saya ketahui tidak terdaftar OJK. Bunga 30% per minggu, sudah berlipat jadi Rp 11 juta dalam 2 bulan.',
    platform: 'CepetCair',
    category: 'pinjol_ilegal',
    status: 'diproses',
    priority: 'tinggi',
    // Closure fields — diisi oleh closeCase()
    closedAt: null,
    closedBy: null,
    closureReason: null,
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-20T14:00:00.000Z',
  },
  {
    id: 'case-002',
    userId: 'user-002',
    konselorId: null,
    title: 'Pinjaman Ganda — Gali Lubang Tutup Lubang',
    description:
      'Saya punya pinjaman di 4 aplikasi berbeda totalnya Rp 7.500.000 tapi sudah membayar lebih dari Rp 15 juta dan saldo masih tinggi.',
    platform: 'Multiplatform',
    category: 'pinjaman_ganda',
    status: 'baru',
    priority: 'sedang',
    closedAt: null,
    closedBy: null,
    closureReason: null,
    createdAt: '2026-11-01T08:30:00.000Z',
    updatedAt: '2026-11-01T08:30:00.000Z',
  },
];

// ─── LOANS ───────────────────────────────────────────────────────────────────
// Status: 'aktif' | 'lunas' | 'macet'
// interestPeriod: 'harian' | 'mingguan' | 'bulanan'
export const initialLoans = [
  {
    id: 'loan-001',
    caseId: 'case-001',
    userId: 'user-001',
    platform: 'CepetCair',
    principalAmount: 2000000,     // Pokok pinjaman awal
    currentBalance: 11000000,     // Saldo yang masih harus dibayar
    interestRate: 30,             // Persentase bunga
    interestPeriod: 'mingguan',   // ← BARU: satuan periode bunga
    loanStartDate: '2026-08-01',  // ← BARU: tanggal mulai pinjaman
    dueDate: '2026-11-30',
    status: 'aktif',
    isOjkRegistered: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',  // ← BARU
  },
  {
    id: 'loan-002',
    caseId: 'case-002',
    userId: 'user-002',
    platform: 'DanaKilat',
    principalAmount: 2000000,
    currentBalance: 3800000,
    interestRate: 15,
    interestPeriod: 'bulanan',    // ← BARU
    loanStartDate: '2026-09-01',  // ← BARU
    dueDate: '2026-12-15',
    status: 'aktif',
    isOjkRegistered: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',  // ← BARU
  },
  {
    id: 'loan-003',
    caseId: 'case-002',
    userId: 'user-002',
    platform: 'TunaiGo',
    principalAmount: 1500000,
    currentBalance: 2800000,
    interestRate: 20,
    interestPeriod: 'bulanan',    // ← BARU
    loanStartDate: '2026-09-10',  // ← BARU
    dueDate: '2026-12-20',
    status: 'aktif',
    isOjkRegistered: false,
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',  // ← BARU
  },
];

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
// Status: 'menunggu_verifikasi' | 'terverifikasi' | 'ditolak'
// CATATAN: Poin hanya diberikan SETELAH status = 'terverifikasi'
// paymentMethod: 'transfer_bank' | 'tunai' | 'e_wallet' | 'lainnya'
export const initialPayments = [
  {
    id: 'pay-001',
    loanId: 'loan-001',
    userId: 'user-001',
    amount: 500000,
    paymentDate: '2026-10-15',
    paymentMethod: 'transfer_bank',          // ← BARU
    // FIX: pay-001 sudah terverifikasi — mustahil tanpa proofFileName
    proofFileName: 'bukti-cicilan-1-andi.jpg',
    proofUploadedAt: '2026-10-15T08:30:00.000Z',
    status: 'terverifikasi',
    verifiedBy: 'admin-001',
    verifiedAt: '2026-10-16T10:00:00.000Z',
    pointsAwarded: 50,
    rejectionReason: null,                   // ← BARU
    notes: 'Pembayaran cicilan pertama',
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-16T10:00:00.000Z',
  },
  {
    id: 'pay-002',
    loanId: 'loan-001',
    userId: 'user-001',
    amount: 500000,
    paymentDate: '2026-11-01',
    paymentMethod: 'transfer_bank',          // ← BARU
    proofFileName: 'bukti-pay-002.jpg',
    proofUploadedAt: '2026-11-01T09:30:00.000Z',
    status: 'menunggu_verifikasi',
    verifiedBy: null,
    verifiedAt: null,
    pointsAwarded: 0,
    rejectionReason: null,                   // ← BARU
    notes: 'Cicilan kedua',
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-01T09:30:00.000Z',
  },
];

// ─── COUNSELING SESSIONS ─────────────────────────────────────────────────────
// Status: 'dijadwalkan' | 'berlangsung' | 'selesai' | 'dibatalkan'
// sessionType: 'online' | 'offline' | 'telepon'
export const initialCounselingSessions = [
  {
    id: 'session-001',
    caseId: 'case-001',
    userId: 'user-001',
    konselorId: 'konselor-001',
    sessionType: 'online',
    scheduledAt: '2026-10-25T13:00:00.000Z',
    duration: 60,                            // menit
    endedAt: '2026-10-25T14:05:00.000Z',    // session selesai +65 menit
    meetingLink: 'https://meet.google.com/bubu-demo-siti',
    location: null,
    status: 'selesai',
    canceledBy: null,
    cancelReason: null,
    notes: 'Diskusi strategi negosiasi dengan kreditur. User disarankan ajukan restrukturisasi.',
    pointsAwarded: 0,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-25T14:05:00.000Z',
  },
  {
    id: 'session-002',
    caseId: 'case-001',
    userId: 'user-001',
    konselorId: 'konselor-001',
    sessionType: 'online',
    scheduledAt: '2026-11-15T14:00:00.000Z',
    duration: 60,
    endedAt: null,
    meetingLink: 'https://meet.google.com/bubu-demo-siti',
    location: null,
    status: 'dijadwalkan',
    canceledBy: null,
    cancelReason: null,
    notes: null,
    pointsAwarded: 0,
    createdAt: '2026-10-30T08:00:00.000Z',
    updatedAt: '2026-10-30T08:00:00.000Z',
  },
];

// ─── POINTS HISTORY ──────────────────────────────────────────────────────────
// type: 'earned' | 'redeemed'
// source: 'payment_verified' | 'case_closed' | 'counseling_complete' | 'admin_bonus'
export const initialPoints = [
  {
    id: 'point-001',
    userId: 'user-001',
    amount: 50,
    type: 'earned',
    source: 'payment_verified',
    referenceId: 'pay-001',      // FK ke Payment yang memicu
    description: 'Poin dari pembayaran cicilan pertama yang terverifikasi',
    createdAt: '2026-10-16T10:00:00.000Z',
  },
  {
    id: 'point-002',
    userId: 'user-001',
    amount: 100,
    type: 'earned',
    // FIX: source diubah dari 'case_closed' (tidak akurat) ke 'admin_bonus'
    // karena: (1) case-001 masih berstatus 'diproses', belum ditutup,
    //         (2) deskripsi menyebut "bonus mendaftar", bukan penutupan kasus.
    // Dengan ini, closeCase('case-001') di masa depan akan memberi +100 poin secara
    // benar tanpa terblokir oleh guard duplikasi 'case_closed'.
    source: 'admin_bonus',
    referenceId: null,
    description: 'Bonus poin mendaftar kasus pertama (onboarding)',
    createdAt: '2026-10-10T10:30:00.000Z',
  },
  {
    id: 'point-003',
    userId: 'user-002',
    amount: 80,
    type: 'earned',
    source: 'admin_bonus',
    referenceId: null,
    description: 'Poin awal onboarding',
    createdAt: '2026-11-01T09:00:00.000Z',
  },
];

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const initialNotifications = [
  {
    id: 'notif-001',
    userId: 'user-001',
    title: 'Pembayaran Terverifikasi',
    message: 'Pembayaran Rp 500.000 Anda telah diverifikasi. +50 poin ditambahkan.',
    type: 'success',
    isRead: true,
    createdAt: '2026-10-16T10:05:00.000Z',
  },
  {
    id: 'notif-002',
    userId: 'user-001',
    title: 'Sesi Konseling Dijadwalkan',
    message: 'Sesi konseling berikutnya: 15 November 2026 pukul 14:00.',
    type: 'info',
    isRead: false,
    createdAt: '2026-10-30T08:05:00.000Z',
  },
  {
    id: 'notif-003',
    userId: 'user-002',
    title: 'Kasus Diterima',
    message: 'Laporan kasus Anda sedang menunggu penugasan konselor.',
    type: 'info',
    isRead: false,
    createdAt: '2026-11-01T08:35:00.000Z',
  },
];

// ─── CASE NOTES ──────────────────────────────────────────────────────────────
// Catatan perkembangan kasus oleh konselor/admin
// isInternal: true  = hanya terlihat oleh konselor & admin
//             false = user juga bisa melihat
export const initialCaseNotes = [
  {
    id: 'note-001',
    caseId: 'case-001',
    authorId: 'konselor-001',
    content:
      'Setelah sesi pertama, user diminta mengumpulkan semua bukti kontrak pinjaman dan rekening koran 3 bulan terakhir untuk persiapan negosiasi dengan CepetCair.',
    isInternal: false,  // User bisa lihat
    createdAt: '2026-10-25T14:05:00.000Z',
    updatedAt: '2026-10-25T14:05:00.000Z',
  },
  {
    id: 'note-002',
    caseId: 'case-001',
    authorId: 'konselor-001',
    content:
      'Catatan internal: Klien menunjukkan tekanan finansial signifikan dan kecemasan tinggi. Pertimbangkan untuk menyarankan sesi pendampingan tambahan dan rujukan ke layanan dukungan mental jika dibutuhkan.',
    isInternal: true,  // Hanya konselor & admin
    createdAt: '2026-10-25T14:30:00.000Z',
    updatedAt: '2026-10-25T14:30:00.000Z',
  },
  {
    id: 'note-003',
    caseId: 'case-001',
    authorId: 'admin-001',
    content:
      'Dokumen kontrak dan rekening koran telah diterima dan diarsipkan oleh tim admin.',
    isInternal: false,
    createdAt: '2026-11-02T09:00:00.000Z',
    updatedAt: '2026-11-02T09:00:00.000Z',
  },
];

// ─── REPAYMENT PLANS ─────────────────────────────────────────────────────────
// Rencana pelunasan per pinjaman
// strategy: 'snowball' | 'avalanche' | 'custom'
//   snowball  = lunasi pinjaman dengan saldo terkecil dulu (motivasi psikologis)
//   avalanche = lunasi pinjaman dengan bunga tertinggi dulu (efisiensi finansial)
//   custom    = rencana manual pengguna
export const initialRepaymentPlans = [
  {
    id: 'plan-001',
    loanId: 'loan-001',
    userId: 'user-001',
    createdBy: 'konselor-001',
    strategy: 'avalanche',
    targetDate: '2027-06-30',
    monthlyTarget: 1000000,
    isActive: true,
    notes:
      'Prioritaskan CepetCair (30%/minggu) karena bunga tertinggi. Target: bebas dari pinjaman ini sebelum Juli 2027.',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
];

// ─── FINANCIAL PROFILES ───────────────────────────────────────────────────────
export const initialFinancialProfiles = [];

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const initialDocuments = [];

// ─── CHARACTER QUIZ RESULTS ──────────────────────────────────────────────────
export const initialQuizResults = [];

// ─── USER EDUCATION PROGRESS ─────────────────────────────────────────────────
export const initialEducationProgress = [];

// ─── STREAKS ─────────────────────────────────────────────────────────────────
export const initialStreaks = [];

// ─── SHOP ITEMS ──────────────────────────────────────────────────────────────
export const initialShopItems = [
  {
    id: 'shop-001',
    name: 'Voucher Konsultasi Psikologis Lanjutan',
    description: 'Sesi pendampingan privat tambahan 60 menit bersama konselor spesialis trauma finansial.',
    category: 'konsultasi',
    pointsCost: 200,
    stock: 50,
    imageFileName: 'voucher-konsultasi.png',
    isAvailable: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'shop-002',
    name: 'E-Book: Jurus Ampuh Negosiasi Debt Collector',
    description: 'Panduan langkah demi langkah menghadapi penagih pinjaman ilegal sesuai koridor hukum OJK & AFPI.',
    category: 'voucher',
    pointsCost: 100,
    stock: null, // unlimited
    imageFileName: 'ebook-negosiasi.png',
    isAvailable: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'shop-003',
    name: 'Badge Eksklusif "Bebas Cemas"',
    description: 'Badge digital spesial yang ditampilkan di profil komunitas pejuang finansial ByeBills.',
    category: 'aksesoris',
    pointsCost: 50,
    stock: null,
    imageFileName: 'badge-bebas-cemas.png',
    isAvailable: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

// ─── USER ITEMS ──────────────────────────────────────────────────────────────
export const initialUserItems = [];

// ─── BADGES ──────────────────────────────────────────────────────────────────
export const initialBadges = [
  {
    id: 'badge-001',
    name: 'Langkah Pertama',
    description: 'Menyelesaikan pembayaran cicilan pertama yang terverifikasi.',
    iconFileName: 'badge-first-pay.svg',
    category: 'pembayaran',
    criteria: 'Verifikasi cicilan pertama',
    pointsReward: 20,
    isHidden: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'badge-002',
    name: 'Pelajar Cerdas',
    description: 'Menuntaskan modul edukasi literasi keuangan pertama.',
    iconFileName: 'badge-edu-starter.svg',
    category: 'edukasi',
    criteria: 'Selesaikan 1 modul edukasi',
    pointsReward: 15,
    isHidden: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'badge-003',
    name: 'Konsistensi Sejati',
    description: 'Mencapai streak aktivitas selama 7 hari berturut-turut.',
    iconFileName: 'badge-streak-7.svg',
    category: 'konsistensi',
    criteria: 'Streak 7 hari',
    pointsReward: 50,
    isHidden: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'badge-004',
    name: 'Pejuang Bebas Pinjaman',
    description: 'Berhasil menutup dan melunasi kasus pinjaman bermasalah.',
    iconFileName: 'badge-debt-free.svg',
    category: 'khusus',
    criteria: 'Kasus berhasil ditutup/lunas',
    pointsReward: 100,
    isHidden: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

// ─── USER BADGES ─────────────────────────────────────────────────────────────
export const initialUserBadges = [];

// ─── ACTIVITY PROOFS ─────────────────────────────────────────────────────────
// Bukti gambar aktivitas user untuk mendapatkan poin (pending | approved | rejected)
export const initialActivityProofs = [
  {
    id: 'proof-001',
    userId: 'user-001',
    title: 'Bukti Pembayaran Pokok & Surat Lunas',
    description: 'Struk transfer cicilan pelunasan pinjaman dan tangkapan layar status lunas dari platform.',
    category: 'pembayaran',
    imagePath: '/images/proof-sample-1.jpg',
    fileSizeKb: 120,
    pointsReward: 50,
    status: 'pending',
    pointsAwarded: false,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: '2026-11-05T09:00:00.000Z',
    updatedAt: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'proof-002',
    userId: 'user-002',
    title: 'Catatan Penghematan Anggaran Mingguan',
    description: 'Foto lembar budgeting penghematan belanja bulanan untuk pelunasan utang.',
    category: 'anggaran_hemat',
    imagePath: '/images/proof-sample-2.jpg',
    fileSizeKb: 95,
    pointsReward: 25,
    status: 'approved',
    pointsAwarded: true,
    reviewedBy: 'admin-001',
    reviewedAt: '2026-11-06T10:30:00.000Z',
    rejectionReason: null,
    createdAt: '2026-11-06T08:15:00.000Z',
    updatedAt: '2026-11-06T10:30:00.000Z',
  },
];

// ─── EDUCATION MODULES ───────────────────────────────────────────────────────
// Modul edukasi yang dapat dikelola admin (tambah/edit/hapus)
export const initialEducationModules = [
  {
    id: 'modul-001',
    title: 'Mengenal Ciri-Ciri Pinjaman Ilegal vs Legal OJK',
    category: 'Legalitas & Regulasi',
    readTime: '5 menit',
    points: 15,
    summary: 'Pahami cara membedakan platform berizin resmi OJK dengan jeratan pinjaman ilegal predatory.',
    content: `### 1. Ciri Utama Pinjaman Legal Berizin OJK:\n- Terdaftar resmi di situs resmi OJK (ojk.go.id).\n- Bunga, denda, dan biaya transparan maksimal sesuai regulasi Asosiasi Fintech Pendanaan Bersama Indonesia (AFPI).\n- Hanya meminta akses izin smartphone terbatas: **CAMILAN** (Camera, Microphone, Location). Tidak boleh menyedot kontak atau galeri!\n- Memiliki layanan pengaduan konsumen yang jelas dan alamat kantor fisik yang valid.\n\n### 2. Tanda Bahaya Pinjaman Ilegal:\n- Penawaran agresif via SMS/WhatsApp nomor acak tanpa pernah mendaftar.\n- Bunga harian sangat tinggi mencekik dan tenor pinjaman sangat singkat (misal 7 hari padahal dijanjikan 30 hari).\n- Meminta akses seluruh kontak telepon, galeri foto, dan data sensitif.\n- Menggunakan ancaman, intimidasi, dan penyebaran data pribadi saat penagihan.\n\n### 3. Langkah Pencegahan:\nSelalu cek legalitas entitas pinjaman sebelum mengajukan pinjaman dengan menghubungi Kontak OJK 157 atau WhatsApp resmi 081-157-157-157.`,
    isActive: true,
    createdBy: 'admin-001',
    createdAt: '2026-08-01T07:00:00.000Z',
    updatedAt: '2026-08-01T07:00:00.000Z',
  },
  {
    id: 'modul-002',
    title: 'Prinsip Debt-to-Income Ratio & Anggaran Sehat',
    category: 'Manajemen Keuangan',
    readTime: '6 menit',
    points: 15,
    summary: 'Ketahui batas aman beban utang bulanan agar arus kas keuangan tidak defisit.',
    content: `### 1. Apa itu Rasio DTI (Debt-to-Income)?\nDebt-to-Income Ratio adalah persentase total cicilan bulanan dibandingkan dengan penghasilan bersih bulanan Anda.\n\n### 2. Aturan Batas Maksimal 30%:\n- Idealnya, total seluruh cicilan utang bulanan tidak boleh melebihi **30% dari gaji bersih**.\n- Jika penghasilan Anda Rp4.000.000, maka batas maksimal cicilan gabungan adalah Rp1.200.000.\n- Rasio di atas 40% menandakan tanda bahaya (Financial Distress) yang rentan memicu gali lubang tutup lubang.\n\n### 3. Alokasi 50/30/20:\n- **50% Kebutuhan Pokok**: Makanan, tempat tinggal, transportasi, tagihan listrik & air.\n- **30% Keinginan & Cicilan Terkendali**: Hiburan, lifestyle, cicilan produktif.\n- **20% Tabungan & Dana Darurat**: Tabungan masa depan dan bantalan darurat.`,
    isActive: true,
    createdBy: 'admin-001',
    createdAt: '2026-08-01T07:00:00.000Z',
    updatedAt: '2026-08-01T07:00:00.000Z',
  },
  {
    id: 'modul-003',
    title: 'Strategi Pelunasan: Metode Snowball vs Avalanche',
    category: 'Strategi Pelunasan',
    readTime: '7 menit',
    points: 20,
    summary: 'Dua metode ilmiah terbukti ampuh melunasi banyak utang tanpa panik.',
    content: `### 1. Metode Snowball (Fokus Kemenangan Mental):\n- Urutkan seluruh utang dari saldo nominal terkecil ke terbesar, tanpa melihat suku bunganya.\n- Bayar cicilan minimum di semua pinjaman, lalu alokasikan dana ekstra sebesar mungkin untuk melunasi utang terkecil lebih dahulu.\n- Setelah utang terkecil lunas, alihkan dana tersebut ke utang terkecil berikutnya. Kemenangan cepat ini memberi dorongan psikologis yang kuat.\n\n### 2. Metode Avalanche (Fokus Hemat Bunga Finansial):\n- Urutkan utang dari suku bunga persentase tertinggi ke suku bunga terendah.\n- Lunasi secepat mungkin pinjaman dengan bunga paling mencekik terlebih dahulu.\n- Secara matematis, metode ini menghemat biaya total bunga paling banyak.\n\n### 3. Rekomendasi ByeBills:\nPilihlah metode yang paling konsisten bisa Anda jalankan. Disiplin pencatatan harian adalah kunci keberhasilan.`,
    isActive: true,
    createdBy: 'admin-001',
    createdAt: '2026-08-01T07:00:00.000Z',
    updatedAt: '2026-08-01T07:00:00.000Z',
  },
  {
    id: 'modul-004',
    title: 'Menghadapi Teror Penagihan & Melapor Satgas',
    category: 'Advokasi & Hak',
    readTime: '5 menit',
    points: 20,
    summary: 'Pedoman menghadapi intimidasi oknum debt collector secara hukum yang aman dan sah.',
    content: `### 1. Hak Anda sebagai Konsumen:\n- Penagihan tidak boleh menggunakan kekerasan fisik, ancaman verbal, atau mempermalukan nasabah.\n- Penagihan dilarang dilakukan di luar jam 08.00 - 20.00 waktu setempat.\n- Penagih dilarang menghubungi pihak di luar kontak darurat resmi yang disetujui.\n\n### 2. Langkah Pengamanan Saat Diteror:\n- Jangan panik dan jangan membalas dengan emosi.\n- Rekam bukti pesan singkat, rekaman suara, atau tangkapan layar intimidasi.\n- Buat Aduan resmi di sistem ByeBills agar tercatat di kronologi bantuan.\n- Laporkan ke Satgas Pemberantasan Aktivitas Keuangan Ilegal (Satgas PASTI OJK) melalui email waspadainvestasi@ojk.go.id atau portal kontak157.ojk.go.id.`,
    isActive: true,
    createdBy: 'admin-001',
    createdAt: '2026-08-01T07:00:00.000Z',
    updatedAt: '2026-08-01T07:00:00.000Z',
  },
];

// ─── EXPORT SEMUA DATA AWAL ───────────────────────────────────────────────────
export const ALL_INITIAL_DATA = {
  users: initialUsers,
  cases: initialCases,
  loans: initialLoans,
  payments: initialPayments,
  counselingSessions: initialCounselingSessions,
  points: initialPoints,
  notifications: initialNotifications,
  caseNotes: initialCaseNotes,
  repaymentPlans: initialRepaymentPlans,
  financialProfiles: initialFinancialProfiles,
  documents: initialDocuments,
  quizResults: initialQuizResults,
  educationProgress: initialEducationProgress,
  streaks: initialStreaks,
  shopItems: initialShopItems,
  userItems: initialUserItems,
  badges: initialBadges,
  userBadges: initialUserBadges,
  activityProofs: initialActivityProofs,
  educationModules: initialEducationModules,
};
