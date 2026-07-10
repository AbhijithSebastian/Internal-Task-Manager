import { useState } from "react";
import { ZoomIn, ZoomOut, Download } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({ src, alt = "", className = "" }: ImagePreviewProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className={`relative flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`max-w-full max-h-full object-contain transition-all duration-200 ${zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={() => setZoomed(!zoomed)}
      />
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setZoomed(!zoomed)}
          className="p-1.5 rounded bg-surface/80 text-tertiary hover:text-primary"
          title={zoomed ? "Zoom out" : "Zoom in"}
        >
          {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        </button>
        <a href={src} download className="p-1.5 rounded bg-surface/80 text-tertiary hover:text-primary" title="Download">
          <Download className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
