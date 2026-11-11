import { Music, Video, AlertCircle } from "lucide-react";
import { useAuthenticatedResource } from "@/hooks/useAuthenticatedResource";

interface MediaPreviewProps {
  mimeType?: string;
  fileUrl?: string;
  fileName?: string;
  className?: string;
}

export function MediaPreview({ mimeType, fileUrl, fileName, className = "" }: MediaPreviewProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();

  const isVideo = mime.startsWith("video/") || ["mp4", "mov", "avi", "webm", "mkv"].includes(ext);

  return (
    <MediaContent
      isVideo={isVideo}
      fileUrl={fileUrl}
      mime={mime}
      fileName={fileName}
      className={className}
    />
  );
}

function MediaContent({
  isVideo,
  fileUrl,
  mime,
  fileName,
  className,
}: {
  isVideo: boolean;
  fileUrl?: string;
  mime: string;
  fileName?: string;
  className: string;
}) {
  const { blobUrl, loading, error } = useAuthenticatedResource(fileUrl || null);

  if (!fileUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg bg-subtle p-6 ${className}`}
      >
        {isVideo ? (
          <Video className="mb-2 h-12 w-12 text-tertiary" />
        ) : (
          <Music className="mb-2 h-12 w-12 text-tertiary" />
        )}
        <p className="text-sm text-secondary">{isVideo ? "Video file" : "Audio file"}</p>
        {fileName && <p className="mt-1 text-xs text-tertiary">{fileName}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-subtle ${className}`}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg bg-subtle p-6 ${className}`}
      >
        <AlertCircle className="mb-2 h-8 w-8 text-tertiary" />
        <p className="text-sm text-secondary">Could not load media</p>
        {fileName && <p className="mt-1 text-xs text-tertiary">{fileName}</p>}
      </div>
    );
  }

  if (isVideo) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-lg bg-subtle ${className}`}
      >
        <video controls className="max-h-full max-w-full">
          <source src={blobUrl} type={mime || "video/mp4"} />
        </video>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-subtle p-6 ${className}`}
    >
      <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <Music className="h-8 w-8 text-primary" />
      </div>
      {fileName && <p className="mb-3 max-w-full truncate text-sm text-primary">{fileName}</p>}
      <audio controls className="w-full max-w-sm">
        <source src={blobUrl} type={mime || "audio/mpeg"} />
      </audio>
    </div>
  );
}
