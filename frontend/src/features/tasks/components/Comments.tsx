import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/utils/formatters";
import { MessageSquare, Send } from "lucide-react";
import type { Comment } from "@/types";

interface CommentsProps {
  taskId: number;
  comments?: Comment[];
  loading?: boolean;
}

export function Comments({ taskId, comments, loading }: CommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const addComment = useMutation({
    mutationFn: (text: string) =>
      api.post(`/tasks/${taskId}/comments`, { body: text }).then((r) => r.data),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-subtle skeleton-pulse" />
          <div className="flex-1 h-9 bg-subtle skeleton-pulse rounded-md" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-subtle skeleton-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-subtle skeleton-pulse rounded" />
              <div className="h-12 bg-subtle skeleton-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments?.length || 0})
      </h3>
      <div className="flex items-start gap-3">
        <Avatar name={user?.name || "You"} size="sm" />
        <div className="flex-1 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-none"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) {
                e.preventDefault();
                addComment.mutate(body.trim());
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-tertiary">Ctrl+Enter to send</span>
            <Button
              size="sm"
              onClick={() => body.trim() && addComment.mutate(body.trim())}
              loading={addComment.isPending}
              disabled={!body.trim()}
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
      {comments && comments.length > 0 ? (
        <div className="space-y-4 mt-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar name={comment.author?.name || "Unknown"} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary">
                    {comment.author?.name || "Unknown"}
                  </span>
                  <span className="text-xs text-tertiary">
                    {formatRelative(comment.created_at)}
                  </span>
                </div>
                <div className="text-sm text-secondary bg-subtle rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {comment.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-tertiary">
          No comments yet. Be the first to comment.
        </div>
      )}
    </div>
  );
}
