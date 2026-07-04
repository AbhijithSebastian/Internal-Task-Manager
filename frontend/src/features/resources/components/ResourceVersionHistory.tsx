import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useResourceVersions, useUploadVersion } from "../hooks/useResources";
import { resourceService } from "../services/resources";
import { formatRelative, formatFileSize } from "@/utils/formatters";
import { Upload, Download, File } from "lucide-react";

interface ResourceVersionHistoryProps {
  resourceId: number;
}

export function ResourceVersionHistory({ resourceId }: ResourceVersionHistoryProps) {
  const { data, isLoading } = useResourceVersions(resourceId);
  const uploadVersion = useUploadVersion(resourceId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <Skeleton variant="rect" className="h-24 w-full" />;

  const versions = data?.versions ?? [];
  const currentVersion = data?.current_version ?? 1;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    uploadVersion.mutate(fd);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-tertiary">{versions.length} version{versions.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Upload New Version
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>
      {versions.length === 0 ? (
        <p className="text-sm text-tertiary">No versions yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-subtle">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-tertiary" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-primary">v{v.version}</span>
                    {v.version === currentVersion && <Badge variant="success" size="sm">Current</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-tertiary">
                    {v.file_size && <span>{formatFileSize(v.file_size)}</span>}
                    {v.uploader && <span>{v.uploader.name}</span>}
                    <span>{formatRelative(v.created_at)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = resourceService.getFileUrl(resourceId);
                  a.download = `v${v.version}`;
                  a.click();
                }}
                className="p-1.5 rounded text-secondary hover:bg-hover hover:text-primary"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
