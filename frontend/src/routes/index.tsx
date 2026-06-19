import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import { AppShell } from "@/layouts/AppShell";

import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import TaskListPage from "@/features/tasks/pages/TaskListPage";
import TaskFormPage from "@/features/tasks/pages/TaskFormPage";
import ProjectListPage from "@/features/projects/pages/ProjectListPage";
import ProjectWorkspacePage from "@/features/projects/pages/ProjectWorkspacePage";
import ProjectFormPage from "@/features/projects/pages/ProjectFormPage";
import MeetingListPage from "@/features/meetings/pages/MeetingListPage";
import MeetingFormPage from "@/features/meetings/pages/MeetingFormPage";
import UsersListPage from "@/features/users/pages/UsersListPage";
import InviteUserPage from "@/features/users/pages/InviteUserPage";
import AnnouncementListPage from "@/features/announcements/pages/AnnouncementListPage";
import AnnouncementFormPage from "@/features/announcements/pages/AnnouncementFormPage";
import NotificationListPage from "@/features/notifications/pages/NotificationListPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import RoleListPage from "@/features/roles/pages/RoleListPage";
import AdminSettingsPage from "@/features/admin/pages/AdminSettingsPage";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app">
        <div className="space-y-4 w-80">
          <Skeleton variant="rect" className="h-8 w-48 mx-auto" />
          <Skeleton variant="rect" className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function PublicLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app">
        <Skeleton variant="circle" className="h-12 w-12" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth — public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected routes wrapped in AppShell */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Tasks */}
        <Route path="/work/tasks" element={<TaskListPage />} />
        <Route path="/work/tasks/new" element={<TaskFormPage />} />
        <Route path="/work/tasks/:id/edit" element={<TaskFormPage />} />

        {/* Projects */}
        <Route path="/work/projects" element={<ProjectListPage />} />
        <Route path="/work/projects/new" element={<ProjectFormPage />} />
        <Route path="/work/projects/:id" element={<ProjectWorkspacePage />} />
        <Route path="/work/projects/:id/edit" element={<ProjectFormPage />} />

        {/* Meetings */}
        <Route path="/work/meetings" element={<MeetingListPage />} />
        <Route path="/work/meetings/new" element={<MeetingFormPage />} />
        <Route path="/work/meetings/:id/edit" element={<MeetingFormPage />} />

        {/* Users */}
        <Route path="/work/users" element={<UsersListPage />} />
        <Route path="/work/users/invite" element={<InviteUserPage />} />
        <Route path="/work/users/:userId/edit" element={<InviteUserPage />} />

        {/* Announcements */}
        <Route path="/work/announcements" element={<AnnouncementListPage />} />
        <Route path="/work/announcements/new" element={<AnnouncementFormPage />} />
        <Route path="/work/announcements/:id/edit" element={<AnnouncementFormPage />} />

        {/* Notifications */}
        <Route path="/work/notifications" element={<NotificationListPage />} />

        {/* Reports */}
        <Route path="/work/reports" element={<ReportsPage />} />

        {/* Administration */}
        <Route path="/work/admin/roles" element={<RoleListPage />} />
        <Route path="/work/admin/permissions" element={<Navigate to="/work/admin/roles" replace />} />
        <Route path="/work/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
