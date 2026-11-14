/**
 * auth.js
 * Simulasi autentikasi berbasis localStorage untuk demo BUBU.
 *
 * ⚠️  PERINGATAN KEAMANAN (PENTING — BACA SEBELUM MENGGUNAKAN):
 * ─────────────────────────────────────────────────────────────
 * Sistem autentikasi ini adalah SIMULASI LOKAL untuk keperluan demo/prototipe.
 * Ia TIDAK aman untuk lingkungan produksi karena:
 *
 *  1. Password di-"hash" menggunakan Base64 (btoa), yang BUKAN enkripsi.
 *     Base64 adalah encoding, bukan hashing. Siapa pun yang melihat nilai
 *     'demo:' + btoa(password) di localStorage dapat langsung mendekodenya.
 *
 *  2. Session disimpan di localStorage sebagai JSON teks biasa — tidak ada
 *     tanda tangan kriptografis (seperti JWT dengan secret key) yang mencegah
 *     session dipalsukan atau dimanipulasi.
 *
 *  3. Tidak ada mekanisme kadaluwarsa session, CSRF protection, atau
 *     HttpOnly cookie.
 *
 * Untuk produksi: gunakan autentikasi berbasis server (OAuth, JWT + HTTPS,
 * atau session cookie HttpOnly) dengan password yang di-hash menggunakan
 * bcrypt/argon2 di sisi server.
 * ─────────────────────────────────────────────────────────────
 *
 * Session disimpan di localStorage (bukan cookie/JWT).
 * Password dicocokkan dengan checkPassword() — BUKAN plaintext.
 */

import { getUserByEmail, getById, createUser, updateUserPassword, STORAGE_KEYS } from './storage.js';
import { checkPassword, hashPassword } from '../data/initialData.js';

const RESET_TOKENS_KEY = 'BUBU_reset_tokens';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 60 menit

const SESSION_KEY = 'BUBU_session';

/**
 * Daftar role yang sah dan aktif dalam sistem BUBU.
 * Role selain ini (seperti 'konselor') tidak diizinkan login atau mengakses aplikasi.
 */
export const ACTIVE_ROLES = ['user', 'admin'];

// ─── LOGIN, LOGOUT & REGISTER ─────────────────────────────────────────────────

/**
 * Daftarkan pengguna baru dengan role 'user'.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.phone]
 * @returns {{ user: object } | { error: string }}
 */
export function register({ name, email, password, phone = '' }) {
  return createUser({ name, email, password, role: 'user', phone });
}

/**
 * Dapatkan path dashboard default berdasarkan role pengguna.
 *
 * @param {'user' | 'admin' | string} role
 * @returns {string}
 */
export function getRoleDashboardPath(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'user':
      return '/dashboard';
    default:
      return '/login';
  }
}

/**
 * Login pengguna.
 *
 * ⚠️ Ini adalah simulasi lokal. Lihat peringatan keamanan di atas.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object } | { error: string }}
 */
export function login(email, password) {
  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' };
  }

  const user = getUserByEmail(email);
  if (!user) return { error: 'Email tidak ditemukan.' };
  if (!user.isActive) return { error: 'Akun ini tidak aktif.' };

  // Blokir akses jika role akun bukan user atau admin aktif
  if (user.role === 'konselor' || !ACTIVE_ROLES.includes(user.role)) {
    return {
      error: 'Role konselor sudah tidak aktif dalam sistem BUBU. Akses ditolak.',
    };
  }

  if (!checkPassword(password, user.passwordHash)) {
    return { error: 'Password salah.' };
  }

  const { passwordHash: _, ...safeUser } = user;

  // Simpan session (tanpa passwordHash)
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      userId: safeUser.id,
      role: safeUser.role,
      name: safeUser.name,
      email: safeUser.email,
      loginAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[BUBU Auth] Gagal menyimpan session:', e);
    return { error: 'Gagal menyimpan sesi login. Coba bersihkan localStorage.' };
  }

  return { user: safeUser };
}

/**
 * Logout — hapus session.
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Ambil session aktif. Null jika belum login atau jika role sesi tidak aktif.
 * Jika ditemukan sesi login lama dengan role konselor, otomatis dibersihkan.
 *
 * @returns {{ userId, role, name, email, loginAt } | null}
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Keamanan: Jika sesi lama ber-role konselor atau tidak valid, bersihkan secara aman
    if (parsed && (parsed.role === 'konselor' || !ACTIVE_ROLES.includes(parsed.role))) {
      console.warn('[BUBU Auth] Sesi konselor terdeteksi, membersihkan sesi secara aman.');
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    // Session corrupt — hapus dan kembalikan null
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Cek apakah pengguna sedang login dengan role yang aktif.
 */
export function isLoggedIn() {
  return getSession() !== null;
}

/**
 * Cek role pengguna saat ini.
 * @returns {'user' | 'admin' | null}
 */
export function getCurrentRole() {
  const session = getSession();
  return session && ACTIVE_ROLES.includes(session.role) ? session.role : null;
}

/**
 * Ambil data lengkap pengguna yang sedang login dari store (bukan hanya dari session).
 * Data dari store lebih akurat karena bisa saja diupdate setelah login.
 * Jika user ternyata role konselor, sesi otomatis dibersihkan.
 *
 * @returns {object | null}
 */
export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const user = getById(STORAGE_KEYS.USERS, session.userId);
  if (!user) return null;

  if (user.role === 'konselor' || !ACTIVE_ROLES.includes(user.role)) {
    logout();
    return null;
  }

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Guard — kembalikan true jika role session sesuai dengan salah satu role yang diberikan.
 *
 * @param {...string} roles - Role yang diizinkan: 'user', 'admin'
 * @returns {boolean}
 */
export function hasRole(...roles) {
  const role = getCurrentRole();
  return Boolean(role && ACTIVE_ROLES.includes(role) && roles.includes(role));
}

// ─── FORGOT / RESET PASSWORD ─────────────────────────────────────────────────

/**
 * Generate token reset password sederhana.
 * Token disimpan di localStorage dengan TTL 60 menit.
 *
 * ⚠️  Demo only: di produksi token ini dikirim via email oleh backend.
 *
 * @param {string} email
 * @returns {{ token: string } | { error: string }}
 */
export function generateResetToken(email) {
  const user = getUserByEmail(email);
  if (!user || !user.isActive) {
    // Respons samar — jangan bocorkan apakah email terdaftar
    return { token: null };
  }

  // Buat token acak (hex 32 karakter)
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const token = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');

  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  // Ambil token-token yang sudah ada, buang yang kadaluwarsa
  let tokens = [];
  try {
    const raw = localStorage.getItem(RESET_TOKENS_KEY);
    tokens = raw ? JSON.parse(raw) : [];
  } catch {
    tokens = [];
  }

  // Hapus token lama untuk email yang sama
  tokens = tokens.filter(
    (t) => t.email !== email.toLowerCase() && new Date(t.expiresAt) > new Date()
  );

  tokens.push({ token, email: email.toLowerCase(), expiresAt, used: false });

  try {
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
  } catch (e) {
    console.error('[BUBU Auth] Gagal menyimpan reset token:', e);
    return { error: 'Gagal menyimpan token.' };
  }

  return { token };
}

/**
 * Validasi token reset password.
 *
 * @param {string} token
 * @param {string} email
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateResetToken(token, email) {
  if (!token || !email) return { valid: false, reason: 'Token atau email tidak ditemukan.' };

  let tokens = [];
  try {
    const raw = localStorage.getItem(RESET_TOKENS_KEY);
    tokens = raw ? JSON.parse(raw) : [];
  } catch {
    return { valid: false, reason: 'Gagal membaca data token.' };
  }

  const record = tokens.find(
    (t) => t.token === token && t.email === email.toLowerCase()
  );

  if (!record) return { valid: false, reason: 'Token tidak ditemukan atau tidak valid.' };
  if (record.used) return { valid: false, reason: 'Token ini sudah digunakan.' };
  if (new Date(record.expiresAt) <= new Date()) {
    return { valid: false, reason: 'Token telah kadaluwarsa. Silakan minta tautan baru.' };
  }

  return { valid: true };
}

/**
 * Reset password pengguna menggunakan token yang valid.
 *
 * @param {string} token
 * @param {string} email
 * @param {string} newPassword
 * @returns {{ success: boolean } | { error: string }}
 */
export function resetPassword(token, email, newPassword) {
  const validation = validateResetToken(token, email);
  if (!validation.valid) return { error: validation.reason };

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  const result = updateUserPassword(email, newPassword);
  if (!result) return { error: 'Gagal memperbarui password. Coba lagi.' };

  // Tandai token sebagai sudah digunakan
  try {
    const raw = localStorage.getItem(RESET_TOKENS_KEY);
    const tokens = raw ? JSON.parse(raw) : [];
    const idx = tokens.findIndex((t) => t.token === token);
    if (idx !== -1) {
      tokens[idx].used = true;
      localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
    }
  } catch (e) {
    console.error('[BUBU Auth] Gagal menandai token sebagai used:', e);
  }

  return { success: true };
}
