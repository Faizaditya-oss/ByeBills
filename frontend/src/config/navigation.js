import {
  LayoutDashboard,
  FolderKanban,
  CreditCard,
  Receipt,
  BookOpen,
  Gift,
  User,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';

/**
 * Konfigurasi item navigasi per role pengguna BUBU (hanya role 'user' dan 'admin').
 */
export const ROLE_NAVIGATION = {
  user: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Aduan & Bantuan CS', path: '/cases', icon: FolderKanban },
    { label: 'Pinjaman', path: '/loans', icon: CreditCard },
    { label: 'Pembayaran', path: '/payments', icon: Receipt },
    { label: 'Bukti & Poin', path: '/proofs', icon: Sparkles },
    { label: 'Edukasi', path: '/education', icon: BookOpen },
    { label: 'Toko Reward', path: '/rewards', icon: Gift },
    { label: 'Profil', path: '/profile', icon: User },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Pengguna', path: '/admin/users', icon: Users },
    { label: 'Aduan Pengguna', path: '/admin/cases', icon: FolderKanban },
    { label: 'Verifikasi & Bukti', path: '/admin/payments', icon: Receipt },
    { label: 'Modul Edukasi', path: '/admin/education', icon: BookOpen },
    { label: 'Toko Reward', path: '/admin/rewards', icon: Gift },
    { label: 'Lencana', path: '/admin/badges', icon: Award },
  ],
};

/**
 * Mengambil daftar item navigasi sesuai role aktif ('user' atau 'admin').
 *
 * @param {'user' | 'admin' | string} role
 * @returns {Array<{ label: string, path: string, icon: React.ComponentType }>}
 */
export function getNavigationForRole(role) {
  if (role !== 'user' && role !== 'admin') {
    return [];
  }
  return ROLE_NAVIGATION[role] || [];
}
