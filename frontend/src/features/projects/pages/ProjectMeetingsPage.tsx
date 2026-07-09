import { useParams, useNavigate } from "react-router-dom";
import { useProjectMeetings } from "@/features/projects/hooks/useProject";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { openDrawer } from "@/hooks/useDrawer";
import { Plus, CalendarDays } from "lucide-react";
import { formatDateTime } from "@/utils/formatters";

export default function ProjectMeetingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useProjectMeetings(projectId);
  const meetingsData = meetings || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Meetings</h2>
          <p className="text-sm text-tertiary">{meetingsData.length} meeting{meetingsData.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => navigate(`/work/meetings/new?project_id=${projectId}`)}>
          <Plus className="h-3.5 w-3.5" /> Log Meeting
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-16 w-full rounded-lg" />)}
        </div>
      ) : meetingsData.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="No meetings logged"
          description="Log your first meeting to track discussions, decisions, and action items."
          action={<Button size="sm" onClick={() => navigate(`/work/meetings/new?project_id=${projectId}`)}><Plus className="h-3.5 w-3.5" /> Log Meeting</Button>}
        />
      ) : (
        <div className="space-y-1.5">
          {meetingsData.map((m) => (
            <Card key={m.id} variant="interactive" onClick={() => openDrawer("meeting", m.id)} className="p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 mr-3">
                  <p className="text-sm font-medium text-primary truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-tertiary">{formatDateTime(m.meeting_date)}</p>
                    {m.summary && <span className="text-xs text-tertiary">&middot;</span>}
                    {m.summary && <p className="text-xs text-tertiary truncate">{m.summary}</p>}
                  </div>
                </div>
                {m.organizer && <Avatar name={m.organizer.name} size="sm" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
