import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  Paperclip, Upload, FileText, Trash2, Download 
} from "lucide-react";
import { formatFileSize } from "@/utils/formatters";
import type { Attachment } from "@/types";

interface AttachmentsSectionProps {
  modelType: string;
  modelId: number;
  collectionName?: string;
}

export function AttachmentsSection({ 
  modelType, 
  modelId, 
  collectionName = "attachments" 
}: AttachmentsSectionProps) {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments, isLoading } = useQuery({
    queryKey: ["attachments", modelType, modelId],
    queryFn: () =>
      api
        .get("/attachments", { params: { model_type: modelType, model_id: modelId } })
        .then((r) => r.data?.data || r.data || []),
    enabled: Boolean(modelId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("model_type", modelType);
      fd.append("model_id", String(modelId));
      fd.append("collection_name", collectionName);
      return api.post("/attachments/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attachments", modelType, modelId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/attachments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attachments", modelType, modelId] }),
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadMutation.mutate(file);
    },
    [uploadMutation]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadMutation.mutate(file);
      if (e.target) e.target.value = "";
    },
    [uploadMutation]
  );

  const files = (attachments as Attachment[]) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments
        </h3>
        <Skeleton variant="rect" className="h-20 w-full" />
        <Skeleton variant="rect" className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments ({files.length})
      </h3>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary-soft/30"
            : "border-default hover:border-hover bg-surface"
        }`}
      >
        <Upload className={`h-6 w-6 mb-2 ${dragOver ? "text-primary" : "text-tertiary"}`} />
        <p className={`text-sm ${dragOver ? "text-primary font-medium" : "text-tertiary"}`}>
          {dragOver ? "Drop file here" : "Click or drag file to upload"}
        </p>
        <p className="text-xs text-tertiary mt-0.5">Images, PDFs, documents</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-tertiary text-center py-4">No files attached</p>
      ) : (
        <ul className="space-y-1">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-hover group transition-colors">
              <FileText className="h-4 w-4 text-tertiary shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate block"
                >
                  {file.name || file.file_name}
                </a>
                <p className="text-xs text-tertiary">{formatFileSize(file.size)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-tertiary hover:text-primary transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${file.name || file.file_name}"?`))
                      deleteMutation.mutate(file.id);
                  }}
                  className="p-1 text-tertiary hover:text-semantic-danger transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
