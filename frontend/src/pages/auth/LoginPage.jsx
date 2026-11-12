import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, isAuthenticated, currentUser, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika sudah terautentikasi, alihkan ke halaman yang dituju atau dashboard role
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const from = location.state?.from?.pathname;
      const target = from || getRoleDashboardPath(currentUser.role);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate, location, getRoleDashboardPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validasi form
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email tidak valid.');
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = login(trimmedEmail, password);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Login berhasil, tentukan rute tujuan
      const from = location.state?.from?.pathname;
      const target = from || getRoleDashboardPath(result.user.role);
      navigate(target, { replace: true });
    } catch (err) {
      console.error('[LoginPage] Gagal login:', err);
      setError('Terjadi kesalahan saat masuk. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  // Helper untuk akun demo agar mempermudah pengujian
  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Tombol Kembali ke Beranda */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Card Formulir Login */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-1">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Masuk ke BUBU</h1>
            <p className="text-sm text-slate-500">
              Akses akun pendampingan finansial dan pemulihan pinjol Anda
            </p>
          </div>

          {/* Alert Pesan Sukses (misal dari Registrasi) */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Alert Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Input Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium text-sm rounded-xl transition shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Link ke Register */}
          <div className="pt-2 text-center text-xs text-slate-500">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Daftar Sekarang
            </Link>
          </div>
        </div>

          {/* Panel Demo Akun untuk Kemudahan Pengujian */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 text-slate-600">
            <p className="font-semibold text-slate-700">Akun Demo (Klik untuk mengisi cepat):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('andi@demo.com', 'demo123')}
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition text-center text-xs cursor-pointer"
              >
                <div className="font-medium text-slate-800">User Demo</div>
                <div className="text-[10px] text-slate-400">andi@demo.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@demo.com', 'admin123')}
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition text-center text-xs cursor-pointer"
              >
                <div className="font-medium text-slate-800">Admin Demo</div>
                <div className="text-[10px] text-slate-400">admin@demo.com</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-0.5">
              Password: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-600">demo123</code> | <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-600">admin123</code>
            </p>
          </div>
      </div>
    </div>
  );
}
