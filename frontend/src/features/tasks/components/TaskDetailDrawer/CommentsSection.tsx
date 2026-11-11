import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import { useAuth } from "@/store/auth";
import { Avatar, Button, Skeleton } from "@/design-system";
import { formatRelative } from "@/utils/formatters";
import { MessageSquare, Send, Reply, Edit3, Trash2, Save } from "lucide-react";
import type { Comment } from "@/types";

interface Props {
  taskId: number;
  projectId: number;
}

export function CommentsSection({ taskId, projectId }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: queryKeys.comments.list(taskId),
    queryFn: () =>
      api
        .get("/comments", { params: { task_id: taskId } })
        .then((r) => r.data?.data || r.data || []),
    enabled: Boolean(taskId),
  });

  const addMutation = useMutation({
    mutationFn: (text: string) =>
      api
        .post("/comments", { task_id: taskId, project_id: projectId, body: text })
        .then((r) => r.data),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ parentId, text }: { parentId: number; text: string }) =>
      api
        .post("/comments", {
          task_id: taskId,
          project_id: projectId,
          body: text,
          parent_id: parentId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      setReplyBody("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(taskId) });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      api.put(`/comments/${id}`, { body: text }).then((r) => r.data),
    onSuccess: () => {
      setEditingId(null);
      setEditBody("");
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(taskId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/comments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(taskId) }),
  });

  const isOwn = (c: Comment) => c.author?.id === user?.id;

  function renderComment(c: Comment, depth = 0) {
    const isEditing = editingId === c.id;
    const isReplying = replyingTo === c.id;

    return (
      <div key={c.id} className={`${depth > 0 ? "ml-8 border-l-2 border-subtle pl-4" : ""}`}>
        <div className="flex items-start gap-2.5 py-2">
          <Avatar name={c.author?.name || "Unknown"} size="sm" className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-sm font-medium text-primary">
                {c.author?.name || "Unknown"}
              </span>
              <span className="text-xs text-tertiary">{formatRelative(c.created_at)}</span>
              {isOwn(c) && (
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditBody(c.body);
                    }}
                    className="p-0.5 text-tertiary transition-colors hover:text-primary"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this comment?")) deleteMutation.mutate(c.id);
                    }}
                    className="p-0.5 text-tertiary transition-colors hover:text-semantic-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-1.5">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={2}
                  className="border-default focus:ring-primary-ring w-full resize-none rounded-md border bg-surface px-2.5 py-1.5 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2"
                  autoFocus
                />
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => editMutation.mutate({ id: c.id, text: editBody })}
                    loading={editMutation.isPending}
                  >
                    <Save className="h-3 w-3" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setEditBody("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group">
                <p className="whitespace-pre-wrap text-sm text-secondary">{c.body}</p>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(isReplying ? null : c.id)}
                    className="flex items-center gap-1 text-xs text-tertiary transition-colors hover:text-primary"
                  >
                    <Reply className="h-3 w-3" /> Reply
                  </button>
                </div>
              </div>
            )}
            {isReplying && (
              <div className="mt-2 space-y-1.5">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="border-default focus:ring-primary-ring w-full resize-none rounded-md border bg-surface px-2.5 py-1.5 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2"
                  autoFocus
                />
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() =>
                      replyBody.trim() &&
                      replyMutation.mutate({ parentId: c.id, text: replyBody.trim() })
                    }
                    loading={replyMutation.isPending}
                    disabled={!replyBody.trim()}
                  >
                    <Send className="h-3 w-3" /> Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyBody("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {c.replies?.map((r) => renderComment(r, depth + 1))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
          <MessageSquare className="h-4 w-4" /> Comments
        </h3>
        <Skeleton variant="rect" className="h-20 w-full" />
        <Skeleton variant="rect" className="h-16 w-full" />
        <Skeleton variant="rect" className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <MessageSquare className="h-4 w-4" /> Comments ({(comments as Comment[])?.length ?? 0})
      </h3>
      <div className="flex items-start gap-2.5">
        <Avatar name={user?.name || "You"} size="sm" className="mt-1" />
        <div className="flex-1 space-y-1.5">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="border-default focus:ring-primary-ring w-full resize-none rounded-md border bg-surface px-2.5 py-1.5 text-sm text-primary transition-colors placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) {
                e.preventDefault();
                addMutation.mutate(body.trim());
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-tertiary">Ctrl+Enter to send</span>
            <Button
              size="sm"
              onClick={() => body.trim() && addMutation.mutate(body.trim())}
              loading={addMutation.isPending}
              disabled={!body.trim()}
            >
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-subtle">
        {!comments || (comments as Comment[]).length === 0 ? (
          <p className="py-6 text-center text-sm text-tertiary">No comments yet</p>
        ) : (
          (comments as Comment[]).map((c) => renderComment(c))
        )}
      </div>
    </div>
  );
}
