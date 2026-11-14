import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageCircleQuestion,
  X,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import BubuCharacter from './BubuCharacter.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserAvatarConfig } from '../services/storage.js';
import {
  FINANCIAL_FAQS,
  FINANCIAL_FAQ_CATEGORIES,
} from '../data/financialFaq.js';

/**
 * FloatingMascot
 * Maskot Bubu melayang di pojok kanan bawah setiap halaman.
 * Menyajikan interaktivitas, animasi ramah, dan popover Q&A finansial cerdas saat diklik.
 */
export default function FloatingMascot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFaqId, setActiveFaqId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTooltip, setShowTooltip] = useState(true);

  const { currentUser } = useAuth();
  const popoverRef = useRef(null);

  // Ambil aksesori terkini yang dikenakan user
  const avatarConfig = useMemo(() => {
    if (currentUser?.id) {
      return getUserAvatarConfig(currentUser.id);
    }
    return { equippedAccessories: ['acc_glasses_smart'] };
  }, [currentUser?.id]);

  // Saring FAQ berdasarkan kategori yang dipilih
  const filteredFaqs = useMemo(() => {
    if (selectedCategory === 'all') return FINANCIAL_FAQS;
    return FINANCIAL_FAQS.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  // Tutup popover jika user menekan tombol Escape atau klik di luar elemen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sembunyikan bubble tooltip setelah 8 detik jika belum diklik
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    setShowTooltip(false);
  };

  const toggleFaq = (id) => {
    setActiveFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div ref={popoverRef} className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none">
      {/* ─── TOOLTIP BALON SAPAAN (MUNCUL SEBELUM DIKLIK) ───────────────────── */}
      {!isOpen && showTooltip && (
        <div className="absolute bottom-20 right-0 sm:right-1 bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-emerald-100 flex items-center gap-1.5 whitespace-nowrap animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Tanya Bubu Seputar Finansial!</span>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-emerald-100 transform rotate-45" />
        </div>
      )}

      {/* ─── DROPDOWN / POPOVER WINDOW Q&A FINANSIAL ───────────────────────── */}
      {isOpen && (
        <div className="absolute bottom-20 sm:bottom-24 right-0 w-[92vw] sm:w-[410px] max-h-[78vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Popover */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-3.5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 p-1 border border-white/30 backdrop-blur-xs flex items-center justify-center shrink-0">
                <BubuCharacter equippedAccessories={avatarConfig.equippedAccessories} size="sm" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5">
                  Tanya Bubu &bull; FAQ Finansial
                </h3>
                <p className="text-[11px] text-emerald-100 leading-tight mt-0.5">
                  Jawaban &amp; solusi praktis seputar pinjaman untukmu
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              aria-label="Tutup Q&A"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Kategori Topik */}
          <div className="px-3.5 pt-3 pb-2 border-b border-slate-100 shrink-0 bg-slate-50/70">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {FINANCIAL_FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Accordion Pertanyaan & Jawaban */}
          <div className="p-3.5 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada pertanyaan pada topik ini.
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = activeFaqId === faq.id;
                return (
                  <div key={faq.id} className="pt-2 first:pt-0">
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className={`w-full text-left p-3 rounded-xl transition flex items-start justify-between gap-2.5 cursor-pointer ${
                        isExpanded
                          ? 'bg-emerald-50/70 text-emerald-900 border border-emerald-200/80'
                          : 'bg-slate-50/80 hover:bg-slate-100 text-slate-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <HelpCircle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isExpanded ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs font-bold leading-snug">{faq.question}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 mt-0.5 ${
                          isExpanded ? 'rotate-180 text-emerald-600' : ''
                        }`}
                      />
                    </button>

                    {/* Konten Jawaban */}
                    {isExpanded && (
                      <div className="px-3.5 py-3 mt-1 text-xs text-slate-600 leading-relaxed bg-white rounded-xl border border-slate-100 shadow-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Popover */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center shrink-0">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              ByeBills siap menemani perjalanan bebas utangmu!
            </p>
          </div>
        </div>
      )}

      {/* ─── TOMBOL MASKOT MELAYANG (FLOATING AVATAR BUTTON) ───────────────── */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`group relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full p-1.5 shadow-xl transition-all duration-200 flex items-center justify-center cursor-pointer border-2 ${
          isOpen
            ? 'bg-slate-900 border-emerald-400 scale-95 ring-4 ring-emerald-400/30'
            : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 border-white hover:scale-110 active:scale-95 hover:shadow-2xl hover:shadow-emerald-500/40 ring-4 ring-emerald-500/10'
        }`}
        title="Tanya ByeBills seputar finansial"
        aria-expanded={isOpen}
      >
        <div className="w-full h-full flex items-center justify-center">
          <BubuCharacter
            equippedAccessories={avatarConfig.equippedAccessories}
            size="md"
            className="w-full h-full transform transition-transform group-hover:scale-105"
          />
        </div>

        {/* Badge Ikon Tanya Mini di Sudut */}
        <div
          className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md transition-colors ${
            isOpen ? 'bg-rose-500' : 'bg-emerald-600 group-hover:bg-emerald-700'
          }`}
        >
          {isOpen ? <X className="w-3.5 h-3.5" /> : <MessageCircleQuestion className="w-3.5 h-3.5" />}
        </div>
      </button>
    </div>
  );
}
