import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { validateResetToken, resetPassword } from '../../services/auth.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = sedang dicek

  // Validasi token saat halaman dimuat
  useEffect(() => {
    if (!token || !emailFromUrl) {
      setTokenValid(false);
      return;
    }
    const result = validateResetToken(token, emailFromUrl);
    setTokenValid(result.valid);
    if (!result.valid) {
      setError(result.reason || 'Token tidak valid atau sudah kadaluwarsa.');
    }
  }, [token, emailFromUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password baru wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = resetPassword(token, emailFromUrl, password);
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
      setIsSubmitting(false);

      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password berhasil direset. Silakan masuk dengan password baru Anda.' },
        });
      }, 3000);
    }, 800);
  };

  // ── Tampilan Loading Validasi Token ─────────────────────────────────────────
  if (tokenValid === null) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm">Memvalidasi tautan reset...</span>
        </div>
      </div>
    );
  }

  // ── Tampilan Token Tidak Valid ───────────────────────────────────────────────
  if (tokenValid === false) {
    return (
      <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-rose-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-slate-800">Tautan Tidak Valid</h1>
              <p className="text-sm text-slate-500">
                {error || 'Tautan reset password tidak valid atau sudah kadaluwarsa (berlaku 60 menit).'}
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition text-center"
            >
              Minta Tautan Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Tampilan Sukses ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-slate-800">Password Berhasil Direset!</h1>
              <p className="text-sm text-slate-500">
                Password Anda telah berhasil diperbarui. Anda akan dialihkan ke halaman login dalam beberapa detik...
              </p>
            </div>
            <div className="flex justify-center">
              <span className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
            <Link
              to="/login"
              className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition text-center"
            >
              Masuk Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulir Reset Password ──────────────────────────────────────────────────
  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-slate-800">Buat Password Baru</h1>
            {emailFromUrl && (
              <p className="text-xs text-slate-500">
                Untuk akun: <span className="font-medium text-slate-700">{emailFromUrl}</span>
              </p>
            )}
          </div>

          {/* Alert Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Password Baru */}
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700">
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
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

            {/* Konfirmasi Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indikator kecocokan password live */}
              {confirmPassword && (
                <div className={`flex items-center gap-1.5 text-[11px] ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {password === confirmPassword ? 'Password cocok' : 'Password tidak cocok'}
                </div>
              )}
            </div>

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
                'Simpan Password Baru'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
