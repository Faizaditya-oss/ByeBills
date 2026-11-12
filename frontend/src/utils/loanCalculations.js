/**
 * loanCalculations.js
 * Utilitas kalkulasi bunga pinjaman, total kewajiban (pokok + bunga),
 * dan deteksi jatuh tempo mepet untuk aplikasi ByeBills.
 */

export function formatRupiah(val) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

/**
 * Konversi persentase bunga ke persentase desimal harian
 */
export function toDailyRate(rate, period = 'bulanan') {
  const r = (Number(rate) || 0) / 100;
  switch (period) {
    case 'harian':
      return r;
    case 'mingguan':
      return r / 7;
    case 'tahunan':
      return r / 365;
    case 'bulanan':
    default:
      return r / 30;
  }
}

/**
 * Konversi persentase bunga ke persentase desimal bulanan
 */
export function toMonthlyRate(rate, period = 'bulanan') {
  const r = (Number(rate) || 0) / 100;
  switch (period) {
    case 'harian':
      return r * 30;
    case 'mingguan':
      return r * 4.33;
    case 'tahunan':
      return r / 12;
    case 'bulanan':
    default:
      return r;
  }
}

/**
 * Menghitung estimasi akumulasi bunga dan total kewajiban (pokok + bunga)
 * berdasarkan tanggal mulai, tanggal jatuh tempo, dan bunga.
 */
export function calculateLoanEstimatedInterest({
  principalAmount,
  originalAmount,
  currentBalance,
  interestRate,
  interestPeriod = 'bulanan',
  loanStartDate,
  dueDate,
}) {
  const principal = Number(currentBalance ?? originalAmount ?? principalAmount ?? 0);
  const rate = Number(interestRate) || 0;

  if (principal <= 0) {
    return {
      durationDays: 0,
      totalInterest: 0,
      totalObligation: 0,
    };
  }

  // Hitung durasi hari
  let durationDays = 30; // default 30 hari jika tanggal tidak diisi
  if (loanStartDate && dueDate) {
    const start = new Date(loanStartDate);
    const end = new Date(dueDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffMs = end.getTime() - start.getTime();
      const calculatedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      durationDays = Math.max(calculatedDays, 1);
    }
  }

  const dailyRate = toDailyRate(rate, interestPeriod);
  const totalInterest = Math.round(principal * dailyRate * durationDays);
  const totalObligation = principal + totalInterest;

  return {
    durationDays,
    dailyRate,
    totalInterest,
    totalObligation,
  };
}

/**
 * Memeriksa apakah suatu tagihan sudah mendekati atau melewati jatuh tempo (mepet <= 3 hari)
 */
export function checkUrgentDue(dueDateStr) {
  if (!dueDateStr) {
    return { isUrgent: false, diffDays: null, isOverdue: false, isToday: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  if (isNaN(due.getTime())) {
    return { isUrgent: false, diffDays: null, isOverdue: false, isToday: false };
  }

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    isUrgent: diffDays <= 3,
    diffDays,
    isOverdue: diffDays < 0,
    isToday: diffDays === 0,
  };
}
