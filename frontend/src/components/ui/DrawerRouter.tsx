import { useEntityDrawer } from "@/hooks/useEntityDrawer";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { MeetingDetailDrawer } from "@/features/meetings/components/MeetingDetailDrawer";
import { UserDetailDrawer } from "@/features/users/components/UserDetailDrawer";
import { AnnouncementDetailDrawer } from "@/features/announcements/components/AnnouncementDetailDrawer";
import { RoleDetailDrawer } from "@/features/roles/components/RoleDetailDrawer";
import { ProjectDetailDrawer } from "@/features/projects/components/ProjectDetailDrawer";

export function DrawerRouter() {
  const { state, closeDrawer } = useEntityDrawer();

  if (!state.isOpen) return null;

  switch (state.entityType) {
    case "task":
      return <TaskDetailDrawer taskId={state.entityId} onClose={closeDrawer} />;
    case "meeting":
      return <MeetingDetailDrawer meetingId={state.entityId} open={state.isOpen} onClose={closeDrawer} />;
    case "user":
      return <UserDetailDrawer userId={state.entityId} onClose={closeDrawer} />;
    case "announcement":
      return <AnnouncementDetailDrawer announcementId={state.entityId} onClose={closeDrawer} />;
    case "role":
      return <RoleDetailDrawer roleId={state.entityId} onClose={closeDrawer} />;
    case "project":
      return <ProjectDetailDrawer projectId={state.entityId} onClose={closeDrawer} />;
    default:
      return null;
  }
}
