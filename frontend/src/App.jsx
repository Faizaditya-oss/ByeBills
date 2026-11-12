import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Landing Page
import LandingPage from './pages/LandingPage.jsx';

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

// Floating Mascot Widget
import FloatingMascot from './components/FloatingMascot.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
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

      {/* Maskot Melayang & Q&A Finansial di Seluruh Halaman */}
      <FloatingMascot />
    </div>
  );
}