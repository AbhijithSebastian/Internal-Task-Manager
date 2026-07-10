import { Music, Video, AlertCircle } from "lucide-react";

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
  const isAudio = mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext);

  if (isVideo && fileUrl) {
    return (
      <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
        <video controls className="max-w-full max-h-full">
          <source src={fileUrl} type={mime || "video/mp4"} />
        </video>
      </div>
    );
  }

  if (isAudio && fileUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Music className="h-8 w-8 text-primary" />
        </div>
        {fileName && <p className="text-sm text-primary mb-3 truncate max-w-full">{fileName}</p>}
        <audio controls className="w-full max-w-sm">
          <source src={fileUrl} type={mime || "audio/mpeg"} />
        </audio>
      </div>
    );
  }

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

  return (
    <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
      <AlertCircle className="h-8 w-8 text-tertiary mb-2" />
      <p className="text-sm text-secondary">Unsupported media format</p>
    </div>
  );
}
