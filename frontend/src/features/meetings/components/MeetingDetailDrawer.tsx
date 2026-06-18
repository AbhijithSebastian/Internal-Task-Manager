import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTime, formatRelative } from "@/utils/formatters";
import { CalendarDays, MapPin, FileText, Trash2 } from "lucide-react";
import type { Meeting } from "@/types";

interface MeetingDetailDrawerProps {
  meetingId: number | null;
  open: boolean;
  onClose: () => void;
}

export function MeetingDetailDrawer({ meetingId, open, onClose }: MeetingDetailDrawerProps) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => api.get(`/meetings/${meetingId}`).then((r) => r.data?.data || r.data),
    enabled: open && !!meetingId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/meetings/${meetingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      onClose();
    },
  });

  const m = meeting as Meeting | undefined;

  return (
    <>
      <Drawer open={open} onClose={onClose} title={m?.title || "Meeting"}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton variant="rect" className="h-4 w-2/3" />
            <Skeleton variant="rect" className="h-20 w-full" />
            <Skeleton variant="rect" className="h-20 w-full" />
          </div>
        ) : !m ? (
          <p className="text-sm text-secondary">Meeting not found.</p>
        ) : (
          <div className="space-y-6">
            {m.project_name && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <FileText className="h-4 w-4" />
                {m.project_name}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <CalendarDays className="h-4 w-4 text-tertiary" />
                <span>{formatDateTime(m.meeting_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <MapPin className="h-4 w-4 text-tertiary" />
                <span>{m.location || "—"}</span>
              </div>
            </div>

            {m.organizer && (
              <div className="flex items-center gap-2">
                <Avatar name={m.organizer.name} size="sm" />
                <span className="text-sm text-secondary">Organized by <strong className="text-primary">{m.organizer.name}</strong></span>
              </div>
            )}

            {m.summary && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-1">Summary</h4>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{m.summary}</p>
              </div>
            )}

            {m.decisions_taken && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-1">Decisions Taken</h4>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{m.decisions_taken}</p>
              </div>
            )}

            {m.blockers && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-1">Blockers</h4>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{m.blockers}</p>
              </div>
            )}

            {m.action_items && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-1">Action Items</h4>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{m.action_items}</p>
              </div>
            )}

            {m.notes && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-tertiary tracking-wide mb-1">Notes</h4>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{m.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-subtle space-y-1 text-xs text-tertiary">
              <p>Created {formatRelative(m.created_at)}</p>
              {m.updated_at && <p>Updated {formatRelative(m.updated_at)}</p>}
            </div>

            {hasPermission("meeting-delete") && (
              <div className="pt-4">
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Confirm Delete</Button>
                    <Button size="sm" variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(true)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
