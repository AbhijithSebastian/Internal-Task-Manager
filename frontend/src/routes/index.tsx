import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { DashboardLayout } from "@/layouts/DashboardLayout";

import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import UsersListPage from "@/features/users/pages/UsersListPage";
import UserFormPage from "@/features/users/pages/UserFormPage";
import UserDetailPage from "@/features/users/pages/UserDetailPage";
import RolesListPage from "@/features/roles/pages/RolesListPage";
import PermissionsPage from "@/features/permissions/pages/PermissionsPage";
import ProjectListPage from "@/features/projects/pages/ProjectListPage";
import ProjectDetailPage from "@/features/projects/pages/ProjectDetailPage";
import ProjectFormPage from "@/features/projects/pages/ProjectFormPage";
import TaskListPage from "@/features/tasks/pages/TaskListPage";
import TaskDetailPage from "@/features/tasks/pages/TaskDetailPage";
import TaskFormPage from "@/features/tasks/pages/TaskFormPage";
import MeetingListPage from "@/features/meetings/pages/MeetingListPage";
import MeetingFormPage from "@/features/meetings/pages/MeetingFormPage";
import MeetingDetailPage from "@/features/meetings/pages/MeetingDetailPage";
import AnnouncementListPage from "@/features/announcements/pages/AnnouncementListPage";
import AnnouncementFormPage from "@/features/announcements/pages/AnnouncementFormPage";
import AnnouncementDetailPage from "@/features/announcements/pages/AnnouncementDetailPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import NotificationPage from "@/features/notifications/pages/NotificationPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import IntegrationListPage from "@/features/integrations/pages/IntegrationListPage";
import IntegrationFormPage from "@/features/integrations/pages/IntegrationFormPage";
import IntegrationDetailPage from "@/features/integrations/pages/IntegrationDetailPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersListPage /></ProtectedRoute>} />
      <Route path="/users/new" element={<ProtectedRoute><UserFormPage /></ProtectedRoute>} />
      <Route path="/users/:id/edit" element={<ProtectedRoute><UserFormPage /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute><UserDetailPage /></ProtectedRoute>} />
      <Route path="/roles" element={<ProtectedRoute><RolesListPage /></ProtectedRoute>} />
      <Route path="/permissions" element={<ProtectedRoute><PermissionsPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectListPage /></ProtectedRoute>} />
      <Route path="/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
      <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TaskListPage /></ProtectedRoute>} />
      <Route path="/tasks/new" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
      <Route path="/tasks/:id/edit" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />
      <Route path="/meetings" element={<ProtectedRoute><MeetingListPage /></ProtectedRoute>} />
      <Route path="/meetings/new" element={<ProtectedRoute><MeetingFormPage /></ProtectedRoute>} />
      <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetailPage /></ProtectedRoute>} />
      <Route path="/meetings/:id/edit" element={<ProtectedRoute><MeetingFormPage /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><AnnouncementListPage /></ProtectedRoute>} />
      <Route path="/announcements/new" element={<ProtectedRoute><AnnouncementFormPage /></ProtectedRoute>} />
      <Route path="/announcements/:id" element={<ProtectedRoute><AnnouncementDetailPage /></ProtectedRoute>} />
      <Route path="/announcements/:id/edit" element={<ProtectedRoute><AnnouncementFormPage /></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><IntegrationListPage /></ProtectedRoute>} />
      <Route path="/integrations/new" element={<ProtectedRoute><IntegrationFormPage /></ProtectedRoute>} />
      <Route path="/integrations/:id" element={<ProtectedRoute><IntegrationDetailPage /></ProtectedRoute>} />
      <Route path="/integrations/:id/edit" element={<ProtectedRoute><IntegrationFormPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
