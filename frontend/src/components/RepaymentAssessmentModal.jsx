import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Trophy,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  RotateCcw,
} from 'lucide-react';
import { saveFinancialProfile } from '../services/storage.js';

// 5 Pertanyaan Psikologis & Finansial untuk Menentukan Metode Pelunasan
export const REPAYMENT_QUESTIONS = [
  {
    id: 1,
    title: 'Motivasi Utama Anda',
    question: 'Saat melunasi cicilan, apa yang paling membuat Anda bersemangat?',
    options: [
      {
        label: 'Melihat satu platform pinjol langsung lunas secepatnya agar jumlah tagihan berkurang.',
        type: 'snowball',
        explanation: 'Fokus kepuasan psikologis dan momentum pelunasan dini.',
      },
      {
        label: 'Mengetahui total bunga berkurang drastis sehingga uang keluar lebih hemat.',
        type: 'avalanche',
        explanation: 'Fokus optimasi finansial dan memangkas kerugian bunga.',
      },
    ],
  },
  {
    id: 2,
    title: 'Tingkat Tekanan Mental',
    question: 'Bagaimana perasaan Anda saat ini menghadapi banyak penagihan?',
    options: [
      {
        label: 'Sangat terbebani & panik oleh banyaknya notifikasi chat/telepon dari berbagai pinjol.',
        type: 'snowball',
        explanation: 'Mengurangi jumlah aplikasi aktif secepat mungkin sangat membantu mental Anda.',
      },
      {
        label: 'Cukup tenang secara emosional, namun jengkel melihat bunga terus membengkak tinggi.',
        type: 'avalanche',
        explanation: 'Stabilitas mental Anda cocok untuk disiplin mengejar bunga paling berbahaya.',
      },
    ],
  },
  {
    id: 3,
    title: 'Tipe Beban Pinjol',
    question: 'Bagaimana komposisi bunga dan pinjaman yang Anda miliki saat ini?',
    options: [
      {
        label: 'Ada beberapa pinjaman kecil (< Rp 1-2 Juta) yang bisa langsung dibereskan cepat.',
        type: 'snowball',
        explanation: 'Memudahkan Anda mencoret daftar utang satu per satu.',
      },
      {
        label: 'Ada 1 atau lebih pinjol dengan bunga mencekik (harian/ilegal) yang terus berlipat.',
        type: 'avalanche',
        explanation: 'Bunga berbunga wajib diputus secepatnya agar tidak meledak.',
      },
    ],
  },
  {
    id: 4,
    title: 'Disiplin dan Kesabaran Finansial',
    question: 'Dalam menjalankan target jangka panjang tanpa hasil instan:',
    options: [
      {
        label: 'Saya mudah bosan/menyerah jika dalam 1-2 bulan tidak ada hasil konkret yang selesai.',
        type: 'snowball',
        explanation: 'Quick win (kemenangan cepat) adalah kunci konsistensi Anda.',
      },
      {
        label: 'Saya mampu sabar dan disiplin selama hitungan matematisnya terbukti paling menguntungkan.',
        type: 'avalanche',
        explanation: 'Analisis rasional mendukung Anda mengeksekusi strategi jangka panjang.',
      },
    ],
  },
  {
    id: 5,
    title: 'Keputusan Alokasi Dana Ekstra',
    question: 'Jika bulan ini Anda memiliki sisa uang ekstra Rp 500.000:',
    options: [
      {
        label: 'Saya prioritaskan melunasi tagihan yang sisa saldonya paling tipis agar segera tuntas.',
        type: 'snowball',
        explanation: 'Mengeliminasi satu akun pinjol dari daftar beban hidup.',
      },
      {
        label: 'Saya setorkan ke pinjol yang bunganya paling tinggi meski sisa pokoknya masih besar.',
        type: 'avalanche',
        explanation: 'Menahan laju pertumbuhan bunga yang merugikan.',
      },
    ],
  },
];

export default function RepaymentAssessmentModal({
  isOpen,
  onClose,
  userId,
  onComplete,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const currentQ = REPAYMENT_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === REPAYMENT_QUESTIONS.length - 1;

  const handleSelectOption = (qId, type) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: type,
    }));
  };

  const handleNext = () => {
    if (!selectedAnswers[currentQ.id]) return;

    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Hitung hasil penilaian
      let snowballCount = 0;
      let avalancheCount = 0;

      Object.values(selectedAnswers).forEach((type) => {
        if (type === 'snowball') snowballCount++;
        if (type === 'avalanche') avalancheCount++;
      });

      const recommendedStrategy =
        avalancheCount >= snowballCount ? 'avalanche' : 'snowball';

      const assessmentResult = {
        strategy: recommendedStrategy,
        snowballScore: snowballCount,
        avalancheScore: avalancheCount,
        totalQuestions: REPAYMENT_QUESTIONS.length,
        answers: selectedAnswers,
        completedAt: new Date().toISOString(),
      };

      // Simpan ke profil finansial di storage
      if (userId) {
        saveFinancialProfile(userId, {
          repaymentAssessment: assessmentResult,
          preferredStrategy: recommendedStrategy,
        });
      }

      setResult(assessmentResult);
    }
  };

  const handleFinish = () => {
    if (onComplete && result) {
      onComplete(result.strategy);
    }
    onClose();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white relative">
          <div className="flex items-center gap-2 mb-1.5">
            <BrainCircuit className="w-5 h-5 text-blue-300" />
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
              Personalized Financial Assessment
            </span>
          </div>
          <h2 className="text-lg font-bold">
            {result ? 'Rekomendasi Metode Pelunasan Anda' : 'Analisis Tipe Pelunasan Optimal'}
          </h2>
          <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">
            {result
              ? 'Berdasarkan kepribadian dan kondisi psikologis finansial Anda.'
              : 'Jawab 5 pertanyaan singkat agar sistem ByeBills dapat merekomendasikan strategi Avalanche vs Snowball paling tepat.'}
          </p>

          {!result && (
            <div className="mt-4 flex items-center justify-between text-[11px] text-blue-200">
              <span>Pertanyaan {currentIndex + 1} dari {REPAYMENT_QUESTIONS.length}</span>
              <span>{Math.round(((currentIndex + 1) / REPAYMENT_QUESTIONS.length) * 100)}%</span>
            </div>
          )}
          {!result && (
            <div className="w-full bg-blue-950/40 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-blue-300 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / REPAYMENT_QUESTIONS.length) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!result ? (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
                  Topik: {currentQ.title}
                </span>
                <h3 className="text-sm font-bold text-slate-800 leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              <div className="space-y-2.5 pt-1">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.type;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt.type)}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className={`text-xs font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {opt.explanation}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Lewati untuk nanti
                </button>
                <div className="flex gap-2">
                  {currentIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => prev - 1)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Kembali
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!selectedAnswers[currentQ.id]}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <span>{isLastQuestion ? 'Lihat Rekomendasi' : 'Selanjutnya'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Tampilan Hasil Rekomendasi
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className={`p-5 rounded-2xl border-2 text-center space-y-2 ${
                result.strategy === 'avalanche'
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-blue-50 border-blue-300'
              }`}>
                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-xs ${
                  result.strategy === 'avalanche' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {result.strategy === 'avalanche' ? <Zap className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Karakter Finansial Anda
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Cocok dengan Metode {result.strategy === 'avalanche' ? 'Avalanche' : 'Snowball'}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {result.strategy === 'avalanche'
                    ? 'Anda memiliki rasionalitas finansial tinggi dan ingin menghemat pengeluaran bunga sebesar mungkin. Sistem akan memprioritaskan pinjaman berbunga tertinggi lebih dahulu.'
                    : 'Anda tipe yang termotivasi oleh momentum dan ketenangan pikiran. Menuntaskan pinjaman bersaldo terkecil lebih dahulu akan mengurangi stres dan meningkatkan rasa percaya diri Anda.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 pt-2 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1 text-rose-700">
                    <Zap className="w-3.5 h-3.5" /> Skor Avalanche: {result.avalancheScore}
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <Trophy className="w-3.5 h-3.5" /> Skor Snowball: {result.snowballScore}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pilihan metode ini telah otomatis disimpan ke profil Anda dan diterapkan langsung pada simulasi pelunasan pinjaman.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                >
                  <RotateCcw className="w-3 h-3" /> Ulangi Kuis
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Buka Rencana Pelunasan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
