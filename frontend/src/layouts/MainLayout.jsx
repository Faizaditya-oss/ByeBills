import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import MobileNavigation from '../components/layout/MobileNavigation.jsx';
import RepaymentAssessmentModal from '../components/RepaymentAssessmentModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getFinancialProfileByUser } from '../services/storage.js';

/**
 * Layout utama dashboard BUBU dengan navigasi role adaptif
 * dan modal penilaian rekomendasi pelunasan (Avalanche / Snowball) setelah login.
 */
export default function MainLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  // Evaluasi apakah user (khusus role 'user') sudah mengisi asesmen pelunasan
  useEffect(() => {
    if (role === 'user' && currentUser?.id) {
      const profile = getFinancialProfileByUser(currentUser.id);
      // Jika belum ada hasil asesmen pelunasan
      if (!profile || !profile.repaymentAssessment) {
        // Tampilkan modal 5 pertanyaan setelah sedikit jeda animasi
        const timer = setTimeout(() => {
          setAssessmentOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [role, currentUser?.id]);

  const handleAssessmentComplete = (recommendedStrategy) => {
    // Navigasikan user ke halaman pinjaman (tab simulasi) untuk langsung melihat hasilnya
    navigate('/loans');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Navigasi Mobile Drawer */}
      <MobileNavigation
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <Topbar onToggleMobile={() => setMobileNavOpen((prev) => !prev)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Modal 5 Pertanyaan Rekomendasi Pelunasan */}
      {role === 'user' && (
        <RepaymentAssessmentModal
          isOpen={assessmentOpen}
          onClose={() => setAssessmentOpen(false)}
          userId={currentUser?.id}
          onComplete={handleAssessmentComplete}
        />
      )}
    </div>
  );
}
