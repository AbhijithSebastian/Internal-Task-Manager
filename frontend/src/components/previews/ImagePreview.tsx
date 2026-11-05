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
    <div className={`relative flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
      {loading && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center w-full h-full p-4">
          <AlertCircle className="h-6 w-6 text-tertiary mb-1" />
          <p className="text-xs text-tertiary text-center">Could not load image</p>
        </div>
      )}
      {blobUrl && (
        <img
          src={blobUrl}
          alt={alt}
          className={`max-w-full max-h-full object-contain transition-all duration-200 ${zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={() => setZoomed(!zoomed)}
        />
      )}
      {blobUrl && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setZoomed(!zoomed)}
            className="p-1.5 rounded bg-surface/80 text-tertiary hover:text-primary"
            title={zoomed ? "Zoom out" : "Zoom in"}
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button
            onClick={() => fetchDownload(alt || "image")}
            className="p-1.5 rounded bg-surface/80 text-tertiary hover:text-primary"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
