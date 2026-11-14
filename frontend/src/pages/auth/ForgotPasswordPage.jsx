import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { getUserByEmail } from '../../services/storage.js';
import { generateResetToken } from '../../services/auth.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Token untuk demo — di produksi ini dikirim via email
  const [demoToken, setDemoToken] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Email wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email tidak valid.');
      return;
    }

    setIsSubmitting(true);

    // Simulasi delay "kirim email"
    setTimeout(() => {
      const user = getUserByEmail(trimmedEmail);

      if (!user || !user.isActive) {
        // Respons samar untuk keamanan (tidak memberi tahu apakah email terdaftar)
        setSubmitted(true);
        setIsSubmitting(false);
        return;
      }

      const result = generateResetToken(trimmedEmail);
      if (result.token) {
        // Tampilkan token hanya dalam mode demo karena tidak ada email server
        setDemoToken(result.token);
      }

      setSubmitted(true);
      setIsSubmitting(false);
    }, 800);
  };

  if (submitted) {
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
            <div className="flex justify-center mb-1">
              <img src="/assets/navbar.svg" alt="ByeBills" className="h-9 w-auto" />
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-slate-800">Permintaan Dikirim</h1>
              <p className="text-sm text-slate-500">
                Jika email <span className="font-medium text-slate-700">{email}</span> terdaftar,
                tautan reset password telah dikirim. Periksa kotak masuk Anda.
              </p>
            </div>

            {/* Panel Demo Token — hanya tampil di mode demo */}
            {demoToken && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Demo Mode — Token Reset Password
                </p>
                <p className="text-[11px] text-amber-600">
                  Di aplikasi produksi, token ini dikirim via email. Gunakan token berikut untuk mereset password:
                </p>
                <code className="block w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-mono text-amber-800 break-all select-all">
                  {demoToken}
                </code>
                <Link
                  to={`/reset-password?token=${demoToken}&email=${encodeURIComponent(email.trim().toLowerCase())}`}
                  className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Klik di sini untuk reset sekarang →
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition text-center"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <img src="/assets/navbar.svg" alt="ByeBills" className="h-9 w-auto" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Lupa Password?</h1>
            <p className="text-sm text-slate-500">
              Masukkan email akun Anda dan kami akan mengirimkan tautan untuk mereset password.
            </p>
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
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-700">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="forgot-email"
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
                'Kirim Tautan Reset'
              )}
            </button>
          </form>

          <div className="pt-1 text-center text-xs text-slate-500">
            Sudah ingat password?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Masuk Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
