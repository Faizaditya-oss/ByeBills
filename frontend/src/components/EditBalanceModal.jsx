import React, { useState, useEffect } from 'react';
import { X, Wallet, DollarSign, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { getFinancialProfileByUser, saveFinancialProfile } from '../services/storage.js';
import { formatRupiah } from '../utils/loanCalculations.js';

export default function EditBalanceModal({ isOpen, onClose, userId, onSaved }) {
  const [balance, setBalance] = useState('');
  const [dailyExpense, setDailyExpense] = useState('');
  const [monthlyExpense, setMonthlyExpense] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      const profile = getFinancialProfileByUser(userId);
      if (profile) {
        setBalance(profile.userBalance != null ? String(profile.userBalance) : '');
        setDailyExpense(profile.dailyExpense != null ? String(profile.dailyExpense) : '');
        setMonthlyExpense(profile.monthlyExpense != null ? String(profile.monthlyExpense) : '');
      } else {
        setBalance('');
        setDailyExpense('');
        setMonthlyExpense('');
      }
      setError('');
      setSuccess('');
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleDailyChange = (val) => {
    setDailyExpense(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setMonthlyExpense(String(Math.round(num * 30)));
    }
  };

  const handleMonthlyChange = (val) => {
    setMonthlyExpense(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setDailyExpense(String(Math.round(num / 30)));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    const numBalance = Number(balance);
    if (isNaN(numBalance) || numBalance < 0) {
      setError('Masukkan jumlah saldo yang valid (angka 0 atau lebih).');
      return;
    }

    try {
      const updated = saveFinancialProfile(userId, {
        userBalance: numBalance,
        dailyExpense: Number(dailyExpense) || 0,
        monthlyExpense: Number(monthlyExpense) || 0,
      });

      if (updated) {
        setSuccess('Jumlah saldo & profil finansial berhasil diperbarui!');
        if (onSaved) {
          onSaved(updated);
        }
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 800);
      } else {
        setError('Gagal menyimpan ke penyimpanan lokal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan saldo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Edit Jumlah Saldo &amp; Likuiditas</h2>
              <p className="text-[11px] text-emerald-100">Sesuaikan saldo tabungan untuk kalkulasi rekomendasi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Saldo Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Total Saldo / Tabungan Saat Ini (Rp)</span>
              {balance && (
                <span className="text-emerald-700 font-extrabold text-[11px]">
                  {formatRupiah(balance)}
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                Rp
              </div>
              <input
                type="number"
                min="0"
                step="10000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="Contoh: 5000000"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Dana tunai atau rekening aktif yang siap dialokasikan untuk kebutuhan dan pelunasan pinjaman.
            </p>
          </div>

          {/* Pengeluaran Bulanan & Harian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Pengeluaran Harian (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={dailyExpense}
                onChange={(e) => handleDailyChange(e.target.value)}
                placeholder="Contoh: 50000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 block">
                {dailyExpense ? formatRupiah(dailyExpense) : '-'} / hari
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Pengeluaran Pokok Bulanan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={monthlyExpense}
                onChange={(e) => handleMonthlyChange(e.target.value)}
                placeholder="Contoh: 1500000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 block">
                {monthlyExpense ? formatRupiah(monthlyExpense) : '-'} / bulan
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
