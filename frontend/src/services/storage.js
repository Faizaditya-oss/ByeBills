/**
 * storage.js
 * Engine CRUD terpusat untuk localStorage.
 *
 * Prinsip:
 * - Satu key localStorage per entitas (BUBU_users, BUBU_cases, dst).
 * - Semua operasi melalui fungsi-fungsi di file ini — tidak ada akses localStorage langsung
 *   dari komponen.
 * - Mendukung inisialisasi data awal dan reset demo.
 */

import { ALL_INITIAL_DATA, hashPassword } from '../data/initialData.js';

// ─── KONSTANTA KEY ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  USERS: 'BUBU_users',
  CASES: 'BUBU_cases',
  LOANS: 'BUBU_loans',
  PAYMENTS: 'BUBU_payments',
  COUNSELING_SESSIONS: 'BUBU_counselingSessions',
  POINTS: 'BUBU_points',
  NOTIFICATIONS: 'BUBU_notifications',
  CASE_NOTES: 'BUBU_caseNotes',
  REPAYMENT_PLANS: 'BUBU_repaymentPlans',
  FINANCIAL_PROFILES: 'BUBU_financialProfiles',
  DOCUMENTS: 'BUBU_documents',
  QUIZ_RESULTS: 'BUBU_quizResults',
  EDUCATION_PROGRESS: 'BUBU_educationProgress',
  STREAKS: 'BUBU_streaks',
  SHOP_ITEMS: 'BUBU_shopItems',
  USER_ITEMS: 'BUBU_userItems',
  BADGES: 'BUBU_badges',
  USER_BADGES: 'BUBU_userBadges',
  ACTIVITY_PROOFS: 'BUBU_activityProofs',
  INITIALIZED: 'BUBU_initialized',   // Flag: apakah data awal sudah dimuat
};

const ENTITY_KEY_MAP = {
  users: STORAGE_KEYS.USERS,
  cases: STORAGE_KEYS.CASES,
  loans: STORAGE_KEYS.LOANS,
  payments: STORAGE_KEYS.PAYMENTS,
  counselingSessions: STORAGE_KEYS.COUNSELING_SESSIONS,
  points: STORAGE_KEYS.POINTS,
  notifications: STORAGE_KEYS.NOTIFICATIONS,
  caseNotes: STORAGE_KEYS.CASE_NOTES,
  repaymentPlans: STORAGE_KEYS.REPAYMENT_PLANS,
  financialProfiles: STORAGE_KEYS.FINANCIAL_PROFILES,
  documents: STORAGE_KEYS.DOCUMENTS,
  quizResults: STORAGE_KEYS.QUIZ_RESULTS,
  educationProgress: STORAGE_KEYS.EDUCATION_PROGRESS,
  streaks: STORAGE_KEYS.STREAKS,
  shopItems: STORAGE_KEYS.SHOP_ITEMS,
  userItems: STORAGE_KEYS.USER_ITEMS,
  badges: STORAGE_KEYS.BADGES,
  userBadges: STORAGE_KEYS.USER_BADGES,
  activityProofs: STORAGE_KEYS.ACTIVITY_PROOFS,
};

// ─── HELPERS INTERNAL ─────────────────────────────────────────────────────────

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    console.error(`[BUBU Storage] Gagal membaca key: ${key}`);
    return [];
  }
}

/**
 * Tulis data ke localStorage.
 * @returns {boolean} true jika berhasil, false jika gagal (misal: storage penuh)
 */
function writeStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`[BUBU Storage] Gagal menulis key: ${key}`, e);
    return false;
  }
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── INISIALISASI & RESET ─────────────────────────────────────────────────────

/**
 * Muat data awal ke localStorage jika belum pernah diinisialisasi.
 * Aman dipanggil berkali-kali (idempoten).
 *
 * @returns {{ alreadyInitialized: boolean, success: boolean, failedKeys: string[] }}
 */
export function initializeStorage() {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true') {
    // Jalankan migrasi ringan jika ada key baru di skema v2
    migrateLocalStorage();
    return { alreadyInitialized: true, success: true, failedKeys: [] };
  }

  const failedKeys = [];

  for (const [entity, data] of Object.entries(ALL_INITIAL_DATA)) {
    const key = ENTITY_KEY_MAP[entity] || `BUBU_${entity}`;
    const ok = writeStore(key, data);
    if (!ok) {
      failedKeys.push(key);
    }
  }

  // Hanya tandai berhasil jika SEMUA penulisan berhasil
  if (failedKeys.length === 0) {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.info('[BUBU Storage] Data awal berhasil dimuat.');
    return { alreadyInitialized: false, success: true, failedKeys: [] };
  } else {
    console.error('[BUBU Storage] Inisialisasi gagal untuk key:', failedKeys);
    return { alreadyInitialized: false, success: false, failedKeys };
  }
}

/**
 * Migrasi skema data localStorage untuk mendukung atribut dan entitas baru (v2.0).
 * Aman dipanggil berkali-kali tanpa merusak data yang sudah ada.
 */
export function migrateLocalStorage() {
  let migrated = false;

  // 1. Pastikan seluruh key entitas v2 ada di localStorage
  for (const [entity, data] of Object.entries(ALL_INITIAL_DATA)) {
    const key = ENTITY_KEY_MAP[entity] || `BUBU_${entity}`;
    if (localStorage.getItem(key) === null) {
      writeStore(key, data);
      migrated = true;
    }
  }

  // 2. Normalisasi atribut Case jika belum punya category
  const cases = readStore(STORAGE_KEYS.CASES);
  let casesUpdated = false;
  cases.forEach((c) => {
    if (!c.category) {
      c.category = 'lainnya';
      casesUpdated = true;
    }
  });
  if (casesUpdated) writeStore(STORAGE_KEYS.CASES, cases);

  // 3. Normalisasi CounselingSession jika belum punya pointsAwarded
  const sessions = readStore(STORAGE_KEYS.COUNSELING_SESSIONS);
  let sessionsUpdated = false;
  sessions.forEach((s) => {
    if (s.pointsAwarded === undefined) {
      s.pointsAwarded = 0;
      sessionsUpdated = true;
    }
  });
  if (sessionsUpdated) writeStore(STORAGE_KEYS.COUNSELING_SESSIONS, sessions);

  if (migrated || casesUpdated || sessionsUpdated) {
    console.info('[BUBU Storage] Migrasi localStorage v2.0 selesai.');
  }
}

/**
 * Reset semua data ke kondisi awal demonstrasi.
 * Gunakan dengan konfirmasi pengguna.
 *
 * @returns {{ success: boolean, failedKeys: string[] }}
 */
export function resetToInitialData() {
  // Hapus semua key termasuk INITIALIZED dan session agar bersih
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('BUBU_session');
  const result = initializeStorage();
  if (result.success) {
    console.info('[BUBU Storage] Data direset ke kondisi awal.');
  } else {
    console.error('[BUBU Storage] Reset gagal untuk key:', result.failedKeys);
  }
  return result;
}

// ─── GENERIC CRUD ─────────────────────────────────────────────────────────────

/**
 * Ambil semua item dari satu koleksi.
 * @param {string} key - Salah satu nilai dari STORAGE_KEYS
 */
export function getAll(key) {
  return readStore(key);
}

/**
 * Ambil satu item berdasarkan id.
 */
export function getById(key, id) {
  return readStore(key).find((item) => item.id === id) || null;
}

/**
 * Tambah item baru. ID di-generate otomatis jika tidak disediakan.
 * @returns Item yang baru ditambahkan, atau null jika gagal menulis
 */
export function addItem(key, item) {
  const store = readStore(key);
  const newItem = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item,
    id: item.id || generateId(key.replace('BUBU_', '')),
  };
  store.push(newItem);
  const ok = writeStore(key, store);
  return ok ? newItem : null;
}

/**
 * Update sebagian field item berdasarkan id.
 * @returns Item yang sudah diupdate, atau null jika tidak ditemukan / gagal menulis
 */
export function updateItem(key, id, changes) {
  const store = readStore(key);
  const idx = store.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  store[idx] = {
    ...store[idx],
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  const ok = writeStore(key, store);
  return ok ? store[idx] : null;
}

/**
 * Hapus item berdasarkan id.
 * @returns true jika berhasil dihapus
 */
export function deleteItem(key, id) {
  const store = readStore(key);
  const filtered = store.filter((item) => item.id !== id);
  if (filtered.length === store.length) return false;
  const ok = writeStore(key, filtered);
  return ok;
}

/**
 * Filter item berdasarkan field tertentu.
 * @param {Object} filters - { fieldName: value, ... }
 */
export function filterItems(key, filters) {
  return readStore(key).filter((item) =>
    Object.entries(filters).every(([field, value]) => item[field] === value)
  );
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export function getAllUsers() {
  // Jangan ekspos passwordHash ke luar — hapus dari hasil
  return getAll(STORAGE_KEYS.USERS).map(({ passwordHash: _, ...user }) => user);
}

export function getUserById(id) {
  const user = getById(STORAGE_KEYS.USERS, id);
  if (!user) return null;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export function getUserByEmail(email) {
  // Versi internal: sertakan passwordHash untuk keperluan auth
  return getAll(STORAGE_KEYS.USERS).find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  ) || null;
}

export function createUser({ name, email, password, role = 'user', phone = '' }) {
  const existing = getUserByEmail(email);
  if (existing) return { error: 'Email sudah terdaftar.' };

  const newUser = addItem(STORAGE_KEYS.USERS, {
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role,
    phone,
    joinedAt: new Date().toISOString(),
    points: 0,
    isActive: true,
  });

  if (!newUser) return { error: 'Gagal menyimpan data pengguna.' };

  const { passwordHash: _, ...safeUser } = newUser;
  return { user: safeUser };
}

export function updateUserPoints(userId, delta) {
  const store = readStore(STORAGE_KEYS.USERS);
  const idx = store.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  store[idx].points = (store[idx].points || 0) + delta;
  store[idx].updatedAt = new Date().toISOString();
  const ok = writeStore(STORAGE_KEYS.USERS, store);
  return ok ? store[idx].points : null;
}

/**
 * Rekonsiliasi saldo poin User dari PointTransaction (Single Source of Truth).
 */
export function recalculateUserPoints(userId) {
  const user = getById(STORAGE_KEYS.USERS, userId);
  if (!user) return null;

  const pointsRecords = filterItems(STORAGE_KEYS.POINTS, { userId });
  const actualPoints = pointsRecords.reduce((sum, p) => sum + (p.amount || 0), 0);

  const updated = updateItem(STORAGE_KEYS.USERS, userId, { points: actualPoints });
  return updated ? actualPoints : null;
}

/**
 * Update profil pengguna (nama, phone, bio, avatarUrl, specialization).
 * Melindungi passwordHash agar tidak ditimpa tanpa sengaja.
 */
export function updateUser(id, changes) {
  const { passwordHash: _, id: __, email: ___, role: ____, points: _____, ...allowedChanges } = changes;
  const updated = updateItem(STORAGE_KEYS.USERS, id, allowedChanges);
  if (!updated) return null;
  const { passwordHash, ...safeUser } = updated;
  return safeUser;
}

// ─── CASES ───────────────────────────────────────────────────────────────────

export function getCasesByUser(userId) {
  return filterItems(STORAGE_KEYS.CASES, { userId });
}

export function getCaseById(id) {
  return getById(STORAGE_KEYS.CASES, id);
}

export function createCase(data) {
  return addItem(STORAGE_KEYS.CASES, {
    ...data,
    status: 'baru',
    updatedAt: new Date().toISOString(),
  });
}

export function updateCase(id, changes) {
  return updateItem(STORAGE_KEYS.CASES, id, changes);
}

/**
 * Tugaskan konselor untuk menangani sebuah kasus.
 * Memvalidasi konselorId adalah user dengan role 'konselor'.
 */
export function assignKonselor(caseId, konselorId) {
  const konselor = getById(STORAGE_KEYS.USERS, konselorId);
  if (!konselor || konselor.role !== 'konselor') {
    return { error: 'Pengguna yang dipilih bukan konselor yang valid.' };
  }

  const kasus = getById(STORAGE_KEYS.CASES, caseId);
  if (!kasus) return { error: 'Kasus tidak ditemukan.' };

  const updated = updateItem(STORAGE_KEYS.CASES, caseId, {
    konselorId,
    status: kasus.status === 'baru' ? 'diproses' : kasus.status,
  });

  if (!updated) return { error: 'Gagal menugaskan konselor.' };

  addItem(STORAGE_KEYS.NOTIFICATIONS, {
    userId: kasus.userId,
    title: 'Konselor Ditugaskan',
    message: `Kasus "${kasus.title}" kini didampingi oleh ${konselor.name}.`,
    type: 'info',
    isRead: false,
  });

  return { case: updated };
}

// ─── LOANS ───────────────────────────────────────────────────────────────────

export function getLoansByCase(caseId) {
  return filterItems(STORAGE_KEYS.LOANS, { caseId });
}

export function getLoansByUser(userId) {
  return filterItems(STORAGE_KEYS.LOANS, { userId });
}

export function createLoan(data) {
  return addItem(STORAGE_KEYS.LOANS, { ...data, status: 'aktif' });
}

export function updateLoan(id, changes) {
  return updateItem(STORAGE_KEYS.LOANS, id, changes);
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
//
// ALUR PEMBAYARAN:
// 1. User membuat payment → status: 'menunggu_verifikasi', pointsAwarded: 0
// 2. User mengunggah nama file bukti → proofFileName diset, bukan file aslinya
// 3. Admin/konselor memverifikasi → verifyPayment() dipanggil
// 4. Poin baru diberikan SETELAH verifyPayment() berhasil

export function getPaymentsByLoan(loanId) {
  return filterItems(STORAGE_KEYS.PAYMENTS, { loanId });
}

export function getPaymentsByUser(userId) {
  return filterItems(STORAGE_KEYS.PAYMENTS, { userId });
}

export function getPendingPayments() {
  return filterItems(STORAGE_KEYS.PAYMENTS, { status: 'menunggu_verifikasi' });
}

/**
 * Buat entri pembayaran baru.
 * Validasi: loanId, userId wajib ada; amount harus bilangan positif.
 *
 * @returns Objek payment baru, atau { error: string } jika validasi gagal
 */
export function createPayment({ loanId, userId, amount, paymentDate, paymentMethod = 'transfer_bank', notes = '' }) {
  // ── Validasi input ────────────────────────────────────────────────────────
  if (!loanId || typeof loanId !== 'string' || loanId.trim() === '') {
    return { error: 'loanId tidak valid.' };
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return { error: 'userId tidak valid.' };
  }
  if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return { error: 'Nominal pembayaran harus berupa angka positif.' };
  }
  // ─────────────────────────────────────────────────────────────────────────

  const newPayment = addItem(STORAGE_KEYS.PAYMENTS, {
    loanId,
    userId,
    amount,
    paymentDate,
    paymentMethod,
    proofFileName: null,
    proofUploadedAt: null,
    status: 'menunggu_verifikasi',
    verifiedBy: null,
    verifiedAt: null,
    pointsAwarded: 0,   // Nol sampai terverifikasi
    notes,
  });

  if (!newPayment) return { error: 'Gagal menyimpan pembayaran.' };
  return newPayment;
}

export function attachProofToPayment(paymentId, fileName) {
  // Simpan HANYA nama file, bukan konten file
  return updateItem(STORAGE_KEYS.PAYMENTS, paymentId, {
    proofFileName: fileName,
    proofUploadedAt: new Date().toISOString(),
  });
}

/**
 * Verifikasi pembayaran oleh admin/konselor.
 * Poin HANYA diberikan di sini, bukan saat upload bukti.
 *
 * Guard duplikasi:
 * - Pembayaran yang sudah berstatus bukan 'menunggu_verifikasi' ditolak.
 * - Poin hanya dicatat jika belum ada riwayat poin untuk referenceId ini.
 *
 * @param {string} paymentId
 * @param {string} verifiedByUserId - ID admin/konselor yang memverifikasi
 * @param {number} pointsToAward - Jumlah poin yang diberikan
 * @param {boolean} approved - true = terverifikasi, false = ditolak
 */
export function verifyPayment(paymentId, verifiedByUserId, pointsToAward = 50, approved = true) {
  const payment = getById(STORAGE_KEYS.PAYMENTS, paymentId);
  if (!payment) return { error: 'Pembayaran tidak ditemukan.' };

  // Guard #1: status harus masih 'menunggu_verifikasi'
  if (payment.status !== 'menunggu_verifikasi') {
    return { error: 'Pembayaran ini sudah diproses sebelumnya.' };
  }

  const newStatus = approved ? 'terverifikasi' : 'ditolak';
  const awarded = approved ? pointsToAward : 0;

  // Simpan perubahan status pembayaran terlebih dahulu
  const updatedPayment = updateItem(STORAGE_KEYS.PAYMENTS, paymentId, {
    status: newStatus,
    verifiedBy: verifiedByUserId,
    verifiedAt: new Date().toISOString(),
    pointsAwarded: awarded,
  });

  // Batalkan jika penyimpanan status gagal (storage penuh, dll.)
  if (!updatedPayment) {
    return { error: 'Gagal menyimpan status verifikasi.' };
  }

  if (approved && awarded > 0) {
    // Guard #2: cegah duplikasi poin — cek apakah riwayat poin untuk payment ini sudah ada
    const existingPointRecord = getAll(STORAGE_KEYS.POINTS).find(
      (p) => p.referenceId === paymentId && p.source === 'payment_verified'
    );

    if (!existingPointRecord) {
      // Berikan poin ke user
      updateUserPoints(payment.userId, awarded);

      // Catat ke riwayat poin
      addItem(STORAGE_KEYS.POINTS, {
        userId: payment.userId,
        amount: awarded,
        type: 'earned',
        source: 'payment_verified',
        referenceId: paymentId,
        description: `Poin dari pembayaran Rp ${payment.amount.toLocaleString('id-ID')} yang terverifikasi`,
      });

      // Trigger streak aktivitas
      recordStreakActivity(payment.userId);
    } else {
      console.warn(`[BUBU Storage] Duplikasi poin dicegah untuk paymentId: ${paymentId}`);
    }

    // Tambah notifikasi ke user
    addItem(STORAGE_KEYS.NOTIFICATIONS, {
      userId: payment.userId,
      title: 'Pembayaran Terverifikasi',
      message: `Pembayaran Rp ${payment.amount.toLocaleString('id-ID')} Anda telah diverifikasi. +${awarded} poin ditambahkan.`,
      type: 'success',
      isRead: false,
    });
  } else if (!approved) {
    addItem(STORAGE_KEYS.NOTIFICATIONS, {
      userId: payment.userId,
      title: 'Pembayaran Ditolak',
      message: `Pembayaran Rp ${payment.amount.toLocaleString('id-ID')} Anda ditolak. Silakan unggah ulang bukti yang valid.`,
      type: 'error',
      isRead: false,
    });
  }

  return { payment: updatedPayment };
}

// ─── COUNSELING SESSIONS ─────────────────────────────────────────────────────

export function getSessionsByCase(caseId) {
  return filterItems(STORAGE_KEYS.COUNSELING_SESSIONS, { caseId });
}

export function getSessionsByUser(userId) {
  return filterItems(STORAGE_KEYS.COUNSELING_SESSIONS, { userId });
}

export function getSessionsByKonselor(konselorId) {
  return filterItems(STORAGE_KEYS.COUNSELING_SESSIONS, { konselorId });
}

export function createSession(data) {
  return addItem(STORAGE_KEYS.COUNSELING_SESSIONS, {
    sessionType: 'online',
    meetingLink: null,
    location: null,
    canceledBy: null,
    cancelReason: null,
    pointsAwarded: 0,
    ...data,
    status: 'dijadwalkan',
  });
}

export function updateSession(id, changes) {
  const oldSession = getById(STORAGE_KEYS.COUNSELING_SESSIONS, id);
  const updated = updateItem(STORAGE_KEYS.COUNSELING_SESSIONS, id, changes);
  if (!updated) return null;

  // Q10: Jika status berubah menjadi 'selesai', berikan +75 poin otomatis dengan guard duplikasi
  if (changes.status === 'selesai' && oldSession && oldSession.status !== 'selesai') {
    const existingPointRecord = getAll(STORAGE_KEYS.POINTS).find(
      (p) => p.referenceId === id && p.source === 'counseling_complete'
    );
    if (!existingPointRecord && (!updated.pointsAwarded || updated.pointsAwarded === 0)) {
      const awarded = 75;
      updateItem(STORAGE_KEYS.COUNSELING_SESSIONS, id, { pointsAwarded: awarded });
      updateUserPoints(updated.userId, awarded);
      addItem(STORAGE_KEYS.POINTS, {
        userId: updated.userId,
        amount: awarded,
        type: 'earned',
        source: 'counseling_complete',
        referenceId: id,
        description: 'Poin dari penyelesaian sesi konseling pendampingan',
      });
      addItem(STORAGE_KEYS.NOTIFICATIONS, {
        userId: updated.userId,
        title: 'Sesi Konseling Selesai',
        message: `Sesi konseling Anda telah selesai. +${awarded} poin ditambahkan.`,
        type: 'success',
        isRead: false,
      });
      recordStreakActivity(updated.userId);
    }
  }

  return updated;
}

// ─── POINTS ──────────────────────────────────────────────────────────────────

export function getPointsByUser(userId) {
  return filterItems(STORAGE_KEYS.POINTS, { userId });
}

export function getUserTotalPoints(userId) {
  const user = getById(STORAGE_KEYS.USERS, userId);
  return user?.points || 0;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export function getNotificationsByUser(userId) {
  return filterItems(STORAGE_KEYS.NOTIFICATIONS, { userId }).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function markNotificationRead(notifId) {
  return updateItem(STORAGE_KEYS.NOTIFICATIONS, notifId, { isRead: true });
}

export function markAllNotificationsRead(userId) {
  const all = getAll(STORAGE_KEYS.NOTIFICATIONS);
  const updated = all.map((n) =>
    n.userId === userId ? { ...n, isRead: true } : n
  );
  writeStore(STORAGE_KEYS.NOTIFICATIONS, updated);
}

// ─── CASES — FUNGSI TAMBAHAN ─────────────────────────────────────────────────

/**
 * Ambil semua kasus (untuk admin).
 */
export function getAllCases() {
  return getAll(STORAGE_KEYS.CASES);
}

/**
 * Ambil semua kasus milik seorang konselor.
 */
export function getCasesByKonselor(konselorId) {
  return filterItems(STORAGE_KEYS.CASES, { konselorId });
}

/**
 * Tutup kasus. Mengubah status menjadi 'ditutup' dan mencatat metadata closure.
 * @param {string} caseId
 * @param {string} closedBy - userId yang menutup kasus
 * @param {string} closureReason - alasan penutupan
 * @returns {{ case: object }|{ error: string }}
 */
export function closeCase(caseId, closedBy, closureReason) {
  const kasus = getById(STORAGE_KEYS.CASES, caseId);
  if (!kasus) return { error: 'Kasus tidak ditemukan.' };
  if (kasus.status === 'ditutup') return { error: 'Kasus sudah ditutup sebelumnya.' };

  const now = new Date().toISOString();
  const updated = updateItem(STORAGE_KEYS.CASES, caseId, {
    status: 'ditutup',
    closedAt: now,
    closedBy,
    closureReason: closureReason || null,
  });
  if (!updated) return { error: 'Gagal menutup kasus.' };

  // Notifikasi ke user pemilik kasus
  addItem(STORAGE_KEYS.NOTIFICATIONS, {
    userId: kasus.userId,
    title: 'Kasus Ditutup',
    message: `Kasus "${kasus.title}" telah ditutup.`,
    type: 'info',
    isRead: false,
  });

  return { case: updated };
}

// ─── PAYMENTS — FUNGSI TAMBAHAN ───────────────────────────────────────────────

/**
 * Ambil semua pembayaran (untuk admin).
 */
export function getAllPayments() {
  return getAll(STORAGE_KEYS.PAYMENTS);
}

/**
 * Tolak pembayaran secara eksplisit dengan alasan penolakan.
 * Merupakan shorthand verifyPayment(id, by, 0, false) dengan rejectionReason.
 *
 * @param {string} paymentId
 * @param {string} rejectedByUserId
 * @param {string} rejectionReason - alasan penolakan
 * @returns {{ payment: object }|{ error: string }}
 */
export function rejectPayment(paymentId, rejectedByUserId, rejectionReason = '') {
  const payment = getById(STORAGE_KEYS.PAYMENTS, paymentId);
  if (!payment) return { error: 'Pembayaran tidak ditemukan.' };
  if (payment.status !== 'menunggu_verifikasi') {
    return { error: 'Pembayaran ini sudah diproses sebelumnya.' };
  }

  const updated = updateItem(STORAGE_KEYS.PAYMENTS, paymentId, {
    status: 'ditolak',
    verifiedBy: rejectedByUserId,
    verifiedAt: new Date().toISOString(),
    pointsAwarded: 0,
    rejectionReason: rejectionReason || null,
  });
  if (!updated) return { error: 'Gagal menyimpan penolakan pembayaran.' };

  addItem(STORAGE_KEYS.NOTIFICATIONS, {
    userId: payment.userId,
    title: 'Pembayaran Ditolak',
    message: `Pembayaran Rp ${payment.amount.toLocaleString('id-ID')} ditolak. Alasan: ${rejectionReason || '-'}. Silakan unggah ulang bukti yang valid.`,
    type: 'error',
    isRead: false,
  });

  return { payment: updated };
}

// ─── CASE NOTES ──────────────────────────────────────────────────────────────

/**
 * Tambah catatan perkembangan kasus.
 * @param {{ caseId, authorId, content, isInternal }} param
 * @returns Objek note baru atau null
 */
export function addCaseNote({ caseId, authorId, content, isInternal = false }) {
  if (!caseId || !authorId || !content) return null;
  return addItem(STORAGE_KEYS.CASE_NOTES, {
    caseId,
    authorId,
    content,
    isInternal,
  });
}

/**
 * Ambil catatan kasus.
 * @param {string} caseId
 * @param {boolean} includeInternal - jika false, sembunyikan catatan internal
 */
export function getCaseNotes(caseId, includeInternal = true) {
  const notes = filterItems(STORAGE_KEYS.CASE_NOTES, { caseId });
  if (includeInternal) return notes;
  return notes.filter((n) => !n.isInternal);
}

// ─── REPAYMENT PLANS ─────────────────────────────────────────────────────────

/**
 * Buat rencana pelunasan baru untuk sebuah pinjaman.
 * @param {{ loanId, userId, strategy, targetDate, monthlyTarget, notes }} data
 * @returns Objek plan baru atau null
 */
export function createRepaymentPlan(data) {
  if (!data.loanId || !data.userId) return null;
  return addItem(STORAGE_KEYS.REPAYMENT_PLANS, { ...data });
}

export function getRepaymentPlansByLoan(loanId) {
  return filterItems(STORAGE_KEYS.REPAYMENT_PLANS, { loanId });
}

export function getRepaymentPlansByUser(userId) {
  return filterItems(STORAGE_KEYS.REPAYMENT_PLANS, { userId });
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

/**
 * Statistik ringkasan untuk dashboard konselor.
 */
export function getKonselorStats(konselorId) {
  const cases = getCasesByKonselor(konselorId);
  const sessions = filterItems(STORAGE_KEYS.COUNSELING_SESSIONS, { konselorId });
  return {
    totalCases: cases.length,
    activeCases: cases.filter((c) => c.status === 'baru' || c.status === 'diproses').length,
    closedCases: cases.filter((c) => c.status === 'ditutup').length,
    totalSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.status === 'selesai').length,
    upcomingSessions: sessions.filter((s) => s.status === 'dijadwalkan').length,
  };
}

/**
 * Statistik ringkasan untuk dashboard admin.
 */
export function getAdminStats() {
  return {
    totalUsers: getAll(STORAGE_KEYS.USERS).filter((u) => u.role === 'user').length,
    totalCases: getAll(STORAGE_KEYS.CASES).length,
    openCases: filterItems(STORAGE_KEYS.CASES, { status: 'baru' }).length +
               filterItems(STORAGE_KEYS.CASES, { status: 'diproses' }).length,
    pendingPayments: getPendingPayments().length,
    totalLoans: getAll(STORAGE_KEYS.LOANS).length,
  };
}

/**
 * Statistik ringkasan untuk dashboard user.
 */
// ─── NOTIFICATIONS (STANDALONE) ──────────────────────────────────────────────

export function createNotification({ userId, title, message, type = 'info', category = 'system', actionUrl = null }) {
  if (!userId || !title || !message) return null;
  return addItem(STORAGE_KEYS.NOTIFICATIONS, {
    userId,
    title,
    message,
    type,
    category,
    actionUrl,
    isRead: false,
  });
}

// ─── FINANCIAL PROFILES ───────────────────────────────────────────────────────

export function getFinancialProfileByUser(userId) {
  return filterItems(STORAGE_KEYS.FINANCIAL_PROFILES, { userId })[0] || null;
}

export function saveFinancialProfile(userId, profileData) {
  const existing = getFinancialProfileByUser(userId);
  const now = new Date().toISOString();
  if (existing) {
    return updateItem(STORAGE_KEYS.FINANCIAL_PROFILES, existing.id, {
      ...profileData,
      lastUpdatedAt: now,
    });
  } else {
    return addItem(STORAGE_KEYS.FINANCIAL_PROFILES, {
      userId,
      ...profileData,
      lastUpdatedAt: now,
    });
  }
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────

export function createDocument({ caseId, uploadedBy, fileName, fileType = null, fileSize = null, description = '', category = 'lainnya' }) {
  if (!caseId || !uploadedBy || !fileName) return null;
  return addItem(STORAGE_KEYS.DOCUMENTS, {
    caseId,
    uploadedBy,
    fileName,
    fileType,
    fileSize,
    description,
    category,
    isVerified: false,
  });
}

export function getDocumentsByCase(caseId) {
  return filterItems(STORAGE_KEYS.DOCUMENTS, { caseId });
}

export function deleteDocument(id) {
  return deleteItem(STORAGE_KEYS.DOCUMENTS, id);
}

// ─── CHARACTER QUIZ RESULTS ──────────────────────────────────────────────────

export function submitQuiz({ userId, characterType, scores = {}, answers = [] }) {
  if (!userId || !characterType) return null;
  const now = new Date().toISOString();
  const quizRecord = addItem(STORAGE_KEYS.QUIZ_RESULTS, {
    userId,
    characterType,
    scores,
    answers,
    takenAt: now,
  });

  if (quizRecord) {
    // Beri poin +25 untuk penyelesaian kuis
    const awarded = 25;
    updateUserPoints(userId, awarded);
    addItem(STORAGE_KEYS.POINTS, {
      userId,
      amount: awarded,
      type: 'earned',
      source: 'quiz_complete',
      referenceId: quizRecord.id,
      description: `Poin dari penyelesaian kuis karakter finansial (${characterType})`,
    });
  }

  return quizRecord;
}

export function getQuizResultsByUser(userId) {
  return filterItems(STORAGE_KEYS.QUIZ_RESULTS, { userId }).sort(
    (a, b) => new Date(b.takenAt) - new Date(a.takenAt)
  );
}

export function getLatestQuizResult(userId) {
  const list = getQuizResultsByUser(userId);
  return list[0] || null;
}

// ─── USER EDUCATION PROGRESS ─────────────────────────────────────────────────

export function getProgressByUser(userId) {
  return filterItems(STORAGE_KEYS.EDUCATION_PROGRESS, { userId });
}

export function getProgressByModule(userId, moduleId) {
  return filterItems(STORAGE_KEYS.EDUCATION_PROGRESS, { userId, moduleId })[0] || null;
}

export function updateEducationProgress({ userId, moduleId, status = 'sedang_berjalan', progressPercent = 0 }) {
  const existing = getProgressByModule(userId, moduleId);
  if (existing) {
    return updateItem(STORAGE_KEYS.EDUCATION_PROGRESS, existing.id, {
      status,
      progressPercent,
    });
  } else {
    return addItem(STORAGE_KEYS.EDUCATION_PROGRESS, {
      userId,
      moduleId,
      status,
      progressPercent,
      completedAt: null,
      pointsAwarded: 0,
    });
  }
}

export function completeModule({ userId, moduleId, pointsReward = 15, badgeId = null }) {
  const existing = getProgressByModule(userId, moduleId);
  const now = new Date().toISOString();

  let progressRecord;
  if (existing) {
    progressRecord = updateItem(STORAGE_KEYS.EDUCATION_PROGRESS, existing.id, {
      status: 'selesai',
      progressPercent: 100,
      completedAt: now,
    });
  } else {
    progressRecord = addItem(STORAGE_KEYS.EDUCATION_PROGRESS, {
      userId,
      moduleId,
      status: 'selesai',
      progressPercent: 100,
      completedAt: now,
      pointsAwarded: 0,
    });
  }

  // Berikan poin jika belum pernah diberikan untuk modul ini
  if (progressRecord && (!progressRecord.pointsAwarded || progressRecord.pointsAwarded === 0)) {
    updateItem(STORAGE_KEYS.EDUCATION_PROGRESS, progressRecord.id, { pointsAwarded: pointsReward });
    updateUserPoints(userId, pointsReward);
    addItem(STORAGE_KEYS.POINTS, {
      userId,
      amount: pointsReward,
      type: 'earned',
      source: 'education_complete',
      referenceId: moduleId,
      description: `Poin dari penyelesaian modul edukasi (${moduleId})`,
    });
  }

  // Trigger streak aktivitas
  recordStreakActivity(userId);

  // Jika ada lencana, berikan
  if (badgeId) {
    earnBadge(userId, badgeId);
  }

  return progressRecord;
}

// ─── STREAKS ─────────────────────────────────────────────────────────────────

export function getStreakByUser(userId) {
  const existing = filterItems(STORAGE_KEYS.STREAKS, { userId })[0];
  if (existing) return existing;

  // Buat default streak record jika belum ada
  return addItem(STORAGE_KEYS.STREAKS, {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakType: 'harian',
  });
}

/**
 * Catat aktivitas yang memenuhi syarat streak (edukasi, pembayaran terverifikasi, konseling).
 * Satu hari hanya dihitung satu kali (Q4, Q9).
 */
export function recordStreakActivity(userId) {
  const streak = getStreakByUser(userId);
  if (!streak) return null;

  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // Jika sudah ada aktivitas hari ini, jangan hitung ganda
  if (streak.lastActivityDate === today) {
    return streak;
  }

  let newCurrentStreak = 1;

  if (streak.lastActivityDate) {
    const lastDate = new Date(streak.lastActivityDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Hari berurutan: streak bertambah
      newCurrentStreak = (streak.currentStreak || 0) + 1;
    } else {
      // Lebih dari 1 hari: streak reset ke 1
      newCurrentStreak = 1;
    }
  }

  const newLongestStreak = Math.max(streak.longestStreak || 0, newCurrentStreak);

  const updatedStreak = updateItem(STORAGE_KEYS.STREAKS, streak.id, {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: today,
  });

  // Beri poin streak harian (+10)
  updateUserPoints(userId, 10);
  addItem(STORAGE_KEYS.POINTS, {
    userId,
    amount: 10,
    type: 'earned',
    source: 'streak_bonus',
    referenceId: updatedStreak.id,
    description: `Bonus streak harian (${newCurrentStreak} hari beruntun)`,
  });

  // Bonus streak 7 hari (+50)
  if (newCurrentStreak > 0 && newCurrentStreak % 7 === 0) {
    updateUserPoints(userId, 50);
    addItem(STORAGE_KEYS.POINTS, {
      userId,
      amount: 50,
      type: 'earned',
      source: 'streak_bonus',
      referenceId: updatedStreak.id,
      description: `Pencapaian luar biasa! Bonus streak 7 hari (+50 poin)`,
    });
    addItem(STORAGE_KEYS.NOTIFICATIONS, {
      userId,
      title: 'Bonus Streak 7 Hari!',
      message: 'Selamat! Anda menjaga konsistensi selama 7 hari berturut-turut. +50 bonus poin ditambahkan.',
      type: 'success',
      isRead: false,
    });
  }

  return updatedStreak;
}

// ─── SHOP & USER ITEMS ───────────────────────────────────────────────────────

export function getAllShopItems() {
  return getAll(STORAGE_KEYS.SHOP_ITEMS);
}

export function getAvailableShopItems() {
  return filterItems(STORAGE_KEYS.SHOP_ITEMS, { isAvailable: true });
}

export function createShopItem(data) {
  return addItem(STORAGE_KEYS.SHOP_ITEMS, {
    ...data,
    isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
  });
}

export function updateShopItem(id, changes) {
  return updateItem(STORAGE_KEYS.SHOP_ITEMS, id, changes);
}

export function redeemShopItem(userId, shopItemId) {
  const item = getById(STORAGE_KEYS.SHOP_ITEMS, shopItemId);
  if (!item) return { error: 'Item toko tidak ditemukan.' };
  if (!item.isAvailable) return { error: 'Item saat ini tidak tersedia.' };
  if (item.stock !== null && item.stock <= 0) return { error: 'Stok item telah habis.' };

  const currentPoints = getUserTotalPoints(userId);
  if (currentPoints < item.pointsCost) {
    return { error: `Poin tidak mencukupi. Dibutuhkan ${item.pointsCost} poin, saldo Anda ${currentPoints} poin.` };
  }

  // Kurangi stok jika terbatas
  if (item.stock !== null) {
    updateItem(STORAGE_KEYS.SHOP_ITEMS, shopItemId, { stock: item.stock - 1 });
  }

  // Buat UserItem
  const now = new Date().toISOString();
  const userItem = addItem(STORAGE_KEYS.USER_ITEMS, {
    userId,
    shopItemId,
    pointSpent: item.pointsCost,
    redeemedAt: now,
    status: 'aktif',
    usedAt: null,
    expiresAt: null,
  });

  // Potong poin user dan catat ke PointTransaction (nilai negatif)
  updateUserPoints(userId, -item.pointsCost);
  addItem(STORAGE_KEYS.POINTS, {
    userId,
    amount: -item.pointsCost,
    type: 'redeemed',
    source: 'item_redeemed',
    referenceId: userItem.id,
    description: `Penukaran reward: ${item.name}`,
  });

  // Notifikasi
  addItem(STORAGE_KEYS.NOTIFICATIONS, {
    userId,
    title: 'Penukaran Berhasil',
    message: `Anda berhasil menukar ${item.pointsCost} poin untuk "${item.name}".`,
    type: 'success',
    isRead: false,
  });

  return { userItem };
}

export function getUserItems(userId) {
  return filterItems(STORAGE_KEYS.USER_ITEMS, { userId });
}

export function useItem(userItemId) {
  const item = getById(STORAGE_KEYS.USER_ITEMS, userItemId);
  if (!item) return { error: 'Item tidak ditemukan.' };
  if (item.status === 'digunakan') return { error: 'Item ini sudah pernah digunakan.' };

  const updated = updateItem(STORAGE_KEYS.USER_ITEMS, userItemId, {
    status: 'digunakan',
    usedAt: new Date().toISOString(),
  });

  return { userItem: updated };
}

// ─── BADGES & USER BADGES ────────────────────────────────────────────────────

export function getAllBadges() {
  return getAll(STORAGE_KEYS.BADGES);
}

export function createBadge(data) {
  return addItem(STORAGE_KEYS.BADGES, data);
}

export function getUserBadges(userId) {
  const userBadges = filterItems(STORAGE_KEYS.USER_BADGES, { userId });
  const allBadges = getAllBadges();
  return userBadges.map((ub) => {
    const badgeDetail = allBadges.find((b) => b.id === ub.badgeId) || {};
    return { ...badgeDetail, ...ub };
  });
}

export function earnBadge(userId, badgeId) {
  const existing = filterItems(STORAGE_KEYS.USER_BADGES, { userId, badgeId });
  if (existing.length > 0) return { alreadyEarned: true };

  const badge = getById(STORAGE_KEYS.BADGES, badgeId);
  if (!badge) return { error: 'Lencana tidak ditemukan.' };

  const now = new Date().toISOString();
  const userBadge = addItem(STORAGE_KEYS.USER_BADGES, {
    userId,
    badgeId,
    earnedAt: now,
  });

  if (badge.pointsReward && badge.pointsReward > 0) {
    updateUserPoints(userId, badge.pointsReward);
    addItem(STORAGE_KEYS.POINTS, {
      userId,
      amount: badge.pointsReward,
      type: 'earned',
      source: 'badge_earned',
      referenceId: badgeId,
      description: `Bonus lencana: ${badge.name}`,
    });
  }

  addItem(STORAGE_KEYS.NOTIFICATIONS, {
    userId,
    title: 'Lencana Diraih! 🎖️',
    message: `Selamat! Anda meraih lencana "${badge.name}". ${badge.pointsReward > 0 ? `+${badge.pointsReward} poin.` : ''}`,
    type: 'success',
    isRead: false,
  });

  return { userBadge };
}

/**
 * Statistik ringkasan untuk dashboard user.
 */
export function getUserStats(userId) {
  const loans = getLoansByUser(userId);
  const totalDebt = loans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);
  const payments = getPaymentsByUser(userId);
  const totalPaid = payments
    .filter((p) => p.status === 'terverifikasi')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    totalLoans: loans.length,
    activeLoans: loans.filter((l) => l.status === 'aktif').length,
    totalDebt,
    totalPaid,
    points: getUserTotalPoints(userId),
    openCases: getCasesByUser(userId).filter(
      (c) => c.status === 'baru' || c.status === 'diproses'
    ).length,
  };
}

// ─── ACTIVITY PROOFS (BUKTI GAMBAR AKTIVITAS & POIN) ─────────────────────────

/**
 * Unggah bukti aktivitas baru oleh user.
 * Dilengkapi validasi format, batas ukuran (maks 300KB), dan penanganan kuota localStorage.
 *
 * @param {{ userId: string, title: string, description?: string, category?: string, imagePath: string, fileSizeKb?: number, pointsReward?: number }} data
 * @returns {{ proof: object } | { error: string }}
 */
export function uploadActivityProof({
  userId,
  title,
  description = '',
  category = 'lainnya',
  imagePath,
  fileSizeKb = 0,
  pointsReward = 50,
}) {
  if (!userId || !title || !imagePath) {
    return { error: 'Data tidak lengkap. userId, title, dan gambar wajib diisi.' };
  }

  // 1. Validasi batas ukuran file (mencegah penumpukan kuota localStorage)
  const estimatedKb = fileSizeKb > 0 ? Number(fileSizeKb) : Math.round((imagePath.length * 0.75) / 1024);
  const MAX_KB = 300;
  if (estimatedKb > MAX_KB) {
    return {
      error: `Ukuran gambar (${estimatedKb} KB) melebihi batas maksimal ${MAX_KB} KB. Silakan kompres gambar terlebih dahulu.`,
    };
  }

  // 2. Validasi format gambar (jika format data URL)
  if (imagePath.startsWith('data:')) {
    const isSupported = /^data:image\/(jpeg|png|webp|jpg);base64,/i.test(imagePath);
    if (!isSupported) {
      return { error: 'Format gambar tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.' };
    }
  }

  // 3. Simpan bukti aktivitas dengan status awal 'pending'
  const currentList = readStore(STORAGE_KEYS.ACTIVITY_PROOFS);
  const id = generateId('proof');
  const now = new Date().toISOString();

  const itemToSave = {
    id,
    userId,
    title: title.trim(),
    description: description.trim(),
    category,
    imagePath,
    fileSizeKb: estimatedKb,
    pointsReward: Number(pointsReward) || 50,
    status: 'pending',
    pointsAwarded: false,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };

  const success = writeStore(STORAGE_KEYS.ACTIVITY_PROOFS, [itemToSave, ...currentList]);
  if (!success) {
    return {
      error: 'Kapasitas penyimpanan browser (localStorage) penuh. Gambar tidak dapat disimpan.',
    };
  }

  return { proof: itemToSave };
}

/**
 * Ambil semua bukti aktivitas diurutkan dari yang terbaru.
 */
export function getAllActivityProofs() {
  return readStore(STORAGE_KEYS.ACTIVITY_PROOFS).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Ambil bukti aktivitas milik seorang user.
 */
export function getActivityProofsByUser(userId) {
  return filterItems(STORAGE_KEYS.ACTIVITY_PROOFS, { userId }).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Ambil satu bukti aktivitas berdasarkan ID.
 */
export function getActivityProofById(id) {
  return getById(STORAGE_KEYS.ACTIVITY_PROOFS, id);
}

/**
 * Ambil daftar bukti aktivitas yang berstatus 'pending' (menunggu approval admin).
 */
export function getPendingActivityProofs() {
  return filterItems(STORAGE_KEYS.ACTIVITY_PROOFS, { status: 'pending' }).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Setujui bukti aktivitas oleh Admin dan berikan poin ke User secara aman.
 * Menjaga konsistensi data, mencegah duplikasi poin ganda, dan melakukan rollback jika terjadi kegagalan.
 *
 * @param {string} proofId
 * @param {string} reviewedByAdminId
 * @param {number|null} customPoints
 * @returns {{ proof: object, pointsAwarded: number } | { error: string }}
 */
export function approveActivityProof(proofId, reviewedByAdminId, customPoints = null) {
  if (!proofId || !reviewedByAdminId) {
    return { error: 'ID bukti dan ID admin peninjau wajib diisi.' };
  }

  // 1. Ambil data bukti aktivitas
  const proofs = readStore(STORAGE_KEYS.ACTIVITY_PROOFS);
  const proofIdx = proofs.findIndex((p) => p.id === proofId);
  if (proofIdx === -1) {
    return { error: 'Bukti aktivitas tidak ditemukan.' };
  }

  const proof = proofs[proofIdx];

  // 2. Validasi status: hanya status 'pending' yang boleh disetujui
  if (proof.status !== 'pending') {
    return {
      error: `Bukti aktivitas tidak dapat disetujui karena statusnya sudah '${proof.status}'.`,
    };
  }

  // 3. Pencegahan duplikasi poin ganda:
  // Cek flag pointsAwarded
  if (proof.pointsAwarded === true) {
    return { error: 'Poin untuk bukti aktivitas ini sudah pernah diberikan sebelumnya.' };
  }

  // Cek riwayat mutasi di PointTransaction (Single Source of Truth)
  const existingTx = readStore(STORAGE_KEYS.POINTS).find(
    (p) => p.referenceId === proofId && p.source === 'activity_approved'
  );
  if (existingTx) {
    return { error: 'Transaksi poin untuk bukti aktivitas ini sudah tercatat di sistem.' };
  }

  const pointsToAward = customPoints !== null && customPoints > 0
    ? Number(customPoints)
    : Number(proof.pointsReward) || 50;

  // 4. Proses pembaruan bertahap dengan mekanisme Rollback jika salah satu proses gagal:
  const now = new Date().toISOString();
  const pointTxId = generateId('pts');

  // Langkah A: Catat transaksi mutasi ke STORAGE_KEYS.POINTS
  const pointTx = {
    id: pointTxId,
    userId: proof.userId,
    amount: pointsToAward,
    type: 'earned',
    source: 'activity_approved',
    referenceId: proofId,
    description: `Poin dari bukti aktivitas yang disetujui: ${proof.title}`,
    createdAt: now,
    updatedAt: now,
  };

  const currentPoints = readStore(STORAGE_KEYS.POINTS);
  const writePointsOk = writeStore(STORAGE_KEYS.POINTS, [pointTx, ...currentPoints]);
  if (!writePointsOk) {
    return { error: 'Gagal mencatat mutasi poin ke storage. Operasi persetujuan dibatalkan.' };
  }

  // Langkah B: Perbarui status bukti aktivitas
  proofs[proofIdx] = {
    ...proof,
    status: 'approved',
    pointsAwarded: true,
    pointsReward: pointsToAward,
    reviewedBy: reviewedByAdminId,
    reviewedAt: now,
    rejectionReason: null,
    updatedAt: now,
  };

  const writeProofOk = writeStore(STORAGE_KEYS.ACTIVITY_PROOFS, proofs);
  if (!writeProofOk) {
    // Rollback Langkah A: Batalkan mutasi poin yang sudah ditulis
    const rollbackPoints = readStore(STORAGE_KEYS.POINTS).filter((p) => p.id !== pointTxId);
    writeStore(STORAGE_KEYS.POINTS, rollbackPoints);
    return { error: 'Gagal memperbarui status bukti aktivitas. Operasi persetujuan dibatalkan (rollback).' };
  }

  // Langkah C: Pemicu streak aktivitas harian (jika belum beraktivitas hari ini)
  try {
    recordStreakActivity(proof.userId);
  } catch (e) {
    console.warn('[BUBU Storage] Gagal mencatat streak aktivitas:', e);
  }

  // Langkah D: Rekonsiliasi saldo poin User (Single Source of Truth dari PointTransaction)
  recalculateUserPoints(proof.userId);

  try {
    addItem(STORAGE_KEYS.NOTIFICATIONS, {
      userId: proof.userId,
      title: 'Bukti Aktivitas Disetujui! 🌟',
      message: `Bukti "${proof.title}" Anda telah diverifikasi oleh Admin. +${pointsToAward} poin ditambahkan.`,
      type: 'success',
      isRead: false,
    });
  } catch (e) {
    console.warn('[BUBU Storage] Gagal membuat notifikasi approval:', e);
  }

  return { proof: proofs[proofIdx], pointsAwarded: pointsToAward };
}

/**
 * Tolak bukti aktivitas oleh Admin (tanpa memberikan poin).
 *
 * @param {string} proofId
 * @param {string} reviewedByAdminId
 * @param {string} rejectionReason
 * @returns {{ proof: object } | { error: string }}
 */
export function rejectActivityProof(proofId, reviewedByAdminId, rejectionReason = '') {
  if (!proofId || !reviewedByAdminId) {
    return { error: 'ID bukti dan ID admin peninjau wajib diisi.' };
  }

  const proofs = readStore(STORAGE_KEYS.ACTIVITY_PROOFS);
  const proofIdx = proofs.findIndex((p) => p.id === proofId);
  if (proofIdx === -1) {
    return { error: 'Bukti aktivitas tidak ditemukan.' };
  }

  const proof = proofs[proofIdx];
  if (proof.status !== 'pending') {
    return {
      error: `Bukti aktivitas tidak dapat ditolak karena statusnya sudah '${proof.status}'.`,
    };
  }

  const now = new Date().toISOString();
  proofs[proofIdx] = {
    ...proof,
    status: 'rejected',
    pointsAwarded: false,
    reviewedBy: reviewedByAdminId,
    reviewedAt: now,
    rejectionReason: rejectionReason ? rejectionReason.trim() : 'Bukti tidak memenuhi kriteria verifikasi.',
    updatedAt: now,
  };

  const ok = writeStore(STORAGE_KEYS.ACTIVITY_PROOFS, proofs);
  if (!ok) {
    return { error: 'Gagal memperbarui status penolakan pada storage.' };
  }

  try {
    addItem(STORAGE_KEYS.NOTIFICATIONS, {
      userId: proof.userId,
      title: 'Bukti Aktivitas Ditolak',
      message: `Bukti "${proof.title}" ditolak: ${proofs[proofIdx].rejectionReason}`,
      type: 'warning',
      isRead: false,
    });
  } catch (e) {
    console.warn('[BUBU Storage] Gagal membuat notifikasi penolakan:', e);
  }

  return { proof: proofs[proofIdx] };
}

