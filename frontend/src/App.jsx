import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';

// Auth
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MainLayout from './layouts/MainLayout.jsx';

// User Pages
import UserDashboardPage from './pages/user/DashboardPage.jsx';
import UserCasesPage from './pages/user/CasesPage.jsx';
import UserLoansPage from './pages/user/LoansPage.jsx';
import UserPaymentsPage from './pages/user/PaymentsPage.jsx';
import UserActivityProofsPage from './pages/user/ActivityProofsPage.jsx';
import UserEducationPage from './pages/user/EducationPage.jsx';
import UserRewardsPage from './pages/user/RewardsPage.jsx';
import UserProfilePage from './pages/user/ProfilePage.jsx';

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage.jsx';
import AdminUsersPage from './pages/admin/UsersPage.jsx';
import AdminCasesPage from './pages/admin/CasesPage.jsx';
import AdminVerificationsPage from './pages/admin/VerificationsPage.jsx';
import AdminEducationPage from './pages/admin/EducationPage.jsx';

function Home() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mb-2">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Bubu</h1>
        <p className="text-sm text-slate-500">
          Aplikasi Penanganan &amp; Pendampingan Pinjaman Online untuk Gen Z.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition"
          >
            Masuk ke Aplikasi
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
          <HeartPulse className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Kesehatan Finansial</h3>
            <p className="text-xs text-slate-500 mt-1">Evaluasi beban pinjaman &amp; kesehatan mental</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Rencana Pelunasan</h3>
            <p className="text-xs text-slate-500 mt-1">Simulasi dan strategi bebas utang pinjol</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<div className="py-8"><Home /></div>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rute Terlindungi User */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/cases" element={<UserCasesPage />} />
            <Route path="/loans" element={<UserLoansPage />} />
            <Route path="/payments" element={<UserPaymentsPage />} />
            <Route path="/proofs" element={<UserActivityProofsPage />} />
            <Route path="/education" element={<UserEducationPage />} />
            <Route path="/rewards" element={<UserRewardsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
          </Route>
        </Route>

        {/* Rute Terlindungi Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/cases" element={<AdminCasesPage />} />
            <Route path="/admin/payments" element={<AdminVerificationsPage />} />
            <Route path="/admin/education" element={<AdminEducationPage />} />
            <Route path="/admin/rewards" element={<AdminEducationPage />} />
            <Route path="/admin/badges" element={<AdminEducationPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}