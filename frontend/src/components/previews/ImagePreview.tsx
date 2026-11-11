import { useState } from "react";
import { ZoomIn, ZoomOut, Download, AlertCircle } from "lucide-react";
import { useAuthenticatedResource } from "@/hooks/useAuthenticatedResource";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({ src, alt = "", className = "" }: ImagePreviewProps) {
  const [zoomed, setZoomed] = useState(false);
  const { blobUrl, loading, error, fetchDownload } = useAuthenticatedResource(src);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-subtle ${className}`}
    >
      {loading && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="flex h-full w-full flex-col items-center justify-center p-4">
          <AlertCircle className="mb-1 h-6 w-6 text-tertiary" />
          <p className="text-center text-xs text-tertiary">Could not load image</p>
        </div>
      )}
      {blobUrl && (
        <img
          src={blobUrl}
          alt={alt}
          className={`max-h-full max-w-full object-contain transition-all duration-200 ${zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={() => setZoomed(!zoomed)}
        />
      )}
      {blobUrl && (
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity hover:opacity-100">
          <button
            onClick={() => setZoomed(!zoomed)}
            className="bg-surface/80 rounded p-1.5 text-tertiary hover:text-primary"
            title={zoomed ? "Zoom out" : "Zoom in"}
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button
            onClick={() => fetchDownload(alt || "image")}
            className="bg-surface/80 rounded p-1.5 text-tertiary hover:text-primary"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
