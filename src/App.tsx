import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import HomePage from './pages/HomePage';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MarketingPlansPage from './pages/marketing/MarketingPlansPage';
import PlanDetailsPage from './pages/marketing/PlanDetailsPage';
import DocumentsPage from './pages/marketing/DocumentsPage';
import CalendarPage from './pages/calendar/CalendarPage';
import ActivitiesPage from './pages/marketing/ActivitiesPage';
import MessagesPage from './pages/messages/MessagesPage';
import AdminPage from './pages/admin/AdminPage';
import AllCompaniesPage from './pages/admin/AllCompaniesPage';
import NotificationsPage from './pages/settings/NotificationsPage';
import ProfileSettingsPage from './pages/settings/ProfileSettingsPage';
import IdeasPage from './pages/ideas/IdeasPage';
import TemplatesPage from './pages/marketing/TemplatesPage';

// Layouts
import AppLayout from './components/layout/AppLayout';

function App() {
  const { getUser } = useAuthStore();
  
  useEffect(() => {
    // Initialize auth state on app load
    getUser();
  }, [getUser]);
  
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/plans" element={<MarketingPlansPage />} />
          <Route path="/plans/templates" element={<TemplatesPage />} />
          <Route path="/plans/:planId" element={<PlanDetailsPage />} />
          <Route path="/plans/:planId/documents" element={<DocumentsPage />} />
          <Route path="/plans/:planId/calendar" element={<CalendarPage />} />
          <Route path="/plans/:planId/activities" element={<ActivitiesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/companies" element={<AllCompaniesPage />} />
          <Route path="/settings/notifications" element={<NotificationsPage />} />
          <Route path="/settings/profile" element={<ProfileSettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;