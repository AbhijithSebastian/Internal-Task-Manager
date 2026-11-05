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

  return <MediaContent isVideo={isVideo} fileUrl={fileUrl} mime={mime} fileName={fileName} className={className} />;
}

function MediaContent({ isVideo, fileUrl, mime, fileName, className }: { isVideo: boolean; fileUrl?: string; mime: string; fileName?: string; className: string }) {
  const { blobUrl, loading, error } = useAuthenticatedResource(fileUrl || null);

  if (!fileUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
        {isVideo ? (
          <Video className="h-12 w-12 text-tertiary mb-2" />
        ) : (
          <Music className="h-12 w-12 text-tertiary mb-2" />
        )}
        <p className="text-sm text-secondary">{isVideo ? "Video file" : "Audio file"}</p>
        {fileName && <p className="text-xs text-tertiary mt-1">{fileName}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-subtle rounded-lg ${className}`}>
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
        <AlertCircle className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-secondary">Could not load media</p>
        {fileName && <p className="text-xs text-tertiary mt-1">{fileName}</p>}
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
        <video controls className="max-w-full max-h-full">
          <source src={blobUrl} type={mime || "video/mp4"} />
        </video>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Music className="h-8 w-8 text-primary" />
      </div>
      {fileName && <p className="text-sm text-primary mb-3 truncate max-w-full">{fileName}</p>}
      <audio controls className="w-full max-w-sm">
        <source src={blobUrl} type={mime || "audio/mpeg"} />
      </audio>
    </div>
  );
}
