import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import { AppShell } from "@/layouts/AppShell";

import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import TaskFormPage from "@/features/tasks/pages/TaskFormPage";
import ProjectListPage from "@/features/projects/pages/ProjectListPage";
import ProjectFormPage from "@/features/projects/pages/ProjectFormPage";
import MeetingFormPage from "@/features/meetings/pages/MeetingFormPage";
import UsersListPage from "@/features/users/pages/UsersListPage";
import InviteUserPage from "@/features/users/pages/InviteUserPage";
import AnnouncementFormPage from "@/features/announcements/pages/AnnouncementFormPage";
import SubtaskListPage from "@/features/subtasks/pages/SubtaskListPage";
import AdminSettingsPage from "@/features/admin/pages/AdminSettingsPage";

const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const TaskListPage = lazy(() => import("@/features/tasks/pages/TaskListPage"));
const MeetingListPage = lazy(() => import("@/features/meetings/pages/MeetingListPage"));
const AnnouncementListPage = lazy(() => import("@/features/announcements/pages/AnnouncementListPage"));
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));
const RoleListPage = lazy(() => import("@/features/roles/pages/RoleListPage"));

// Project Workspace — lazy loaded
const ProjectWorkspaceLayout = lazy(() => import("@/features/projects/layouts/ProjectWorkspaceLayout"));
const ProjectOverviewPage = lazy(() => import("@/features/projects/pages/ProjectOverviewPage"));
const ProjectTasksPage = lazy(() => import("@/features/projects/pages/ProjectTasksPage"));
const ProjectMembersPage = lazy(() => import("@/features/projects/pages/ProjectMembersPage"));
const ProjectMeetingsPage = lazy(() => import("@/features/projects/pages/ProjectMeetingsPage"));
const ProjectActivityPage = lazy(() => import("@/features/projects/pages/ProjectActivityPage"));
const ProjectSettingsPage = lazy(() => import("@/features/projects/pages/ProjectSettingsPage"));
const ProjectEndpointsPage = lazy(() => import("@/features/projects/pages/ProjectEndpointsPage"));
const ProjectDesignPage = lazy(() => import("@/features/projects/pages/ProjectDesignPage"));
const ProjectResourcesPage = lazy(() => import("@/features/projects/pages/ProjectResourcesPage"));
const ProjectGitHubPage = lazy(() => import("@/features/projects/pages/ProjectGitHubPage"));

function SuspenseWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-8"><Skeleton variant="rect" className="h-full w-full" /></div>}>{children}</Suspense>;
}

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
        <Route path="/dashboard" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />

        {/* Tasks */}
        <Route path="/work/tasks" element={<SuspenseWrapper><TaskListPage /></SuspenseWrapper>} />
        <Route path="/work/tasks/new" element={<TaskFormPage />} />
        <Route path="/work/tasks/:id/edit" element={<TaskFormPage />} />

        {/* Subtasks */}
        <Route path="/work/subtasks" element={<SubtaskListPage />} />

        {/* Projects — list & form */}
        <Route path="/work/projects" element={<ProjectListPage />} />
        <Route path="/work/projects/new" element={<ProjectFormPage />} />

        {/* Project Workspace — nested routes */}
        <Route path="/work/projects/:projectId" element={<SuspenseWrapper><ProjectWorkspaceLayout /></SuspenseWrapper>}>
          <Route index element={<SuspenseWrapper><ProjectOverviewPage /></SuspenseWrapper>} />
          <Route path="tasks" element={<SuspenseWrapper><ProjectTasksPage /></SuspenseWrapper>} />
          <Route path="members" element={<SuspenseWrapper><ProjectMembersPage /></SuspenseWrapper>} />
          <Route path="meetings" element={<SuspenseWrapper><ProjectMeetingsPage /></SuspenseWrapper>} />
          <Route path="endpoints" element={<SuspenseWrapper><ProjectEndpointsPage /></SuspenseWrapper>} />
          <Route path="design" element={<SuspenseWrapper><ProjectDesignPage /></SuspenseWrapper>} />
          <Route path="resources" element={<SuspenseWrapper><ProjectResourcesPage /></SuspenseWrapper>} />
          <Route path="activity" element={<SuspenseWrapper><ProjectActivityPage /></SuspenseWrapper>} />
          <Route path="github" element={<SuspenseWrapper><ProjectGitHubPage /></SuspenseWrapper>} />
          <Route path="settings" element={<SuspenseWrapper><ProjectSettingsPage /></SuspenseWrapper>} />
        </Route>

        {/* Project edit — sibling of workspace, not nested */}
        <Route path="/work/projects/:projectId/edit" element={<ProjectFormPage />} />

        {/* Meetings */}
        <Route path="/work/meetings" element={<SuspenseWrapper><MeetingListPage /></SuspenseWrapper>} />
        <Route path="/work/meetings/new" element={<MeetingFormPage />} />
        <Route path="/work/meetings/:id/edit" element={<MeetingFormPage />} />

        {/* Users */}
        <Route path="/work/users" element={<UsersListPage />} />
        <Route path="/work/users/invite" element={<InviteUserPage />} />
        <Route path="/work/users/:userId/edit" element={<InviteUserPage />} />

        {/* Announcements */}
        <Route path="/work/announcements" element={<SuspenseWrapper><AnnouncementListPage /></SuspenseWrapper>} />
        <Route path="/work/announcements/new" element={<AnnouncementFormPage />} />
        <Route path="/work/announcements/:id/edit" element={<AnnouncementFormPage />} />

        {/* Reports */}
        <Route path="/work/reports" element={<SuspenseWrapper><ReportsPage /></SuspenseWrapper>} />

        {/* Administration */}
        <Route path="/work/admin/roles" element={<SuspenseWrapper><RoleListPage /></SuspenseWrapper>} />
        <Route path="/work/admin/permissions" element={<Navigate to="/work/admin/roles" replace />} />
        <Route path="/work/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
