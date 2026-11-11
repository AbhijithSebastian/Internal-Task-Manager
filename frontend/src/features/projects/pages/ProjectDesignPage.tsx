import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useProject } from "@/features/projects/hooks/useProject";
import { FigmaPreview } from "@/components/previews/FigmaPreview";
import { PreviewEngine } from "@/components/previews/PreviewEngine";
import { EnterpriseEmptyState } from "@/components/shared/EnterpriseEmptyState";
import { Badge, Button, Card, Skeleton } from "@/design-system";
import {
  Palette,
  Upload,
  Link,
  Figma,
  FileImage,
  Download,
  Trash2,
  ExternalLink,
  Unlink,
  Wrench,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";
import { formatFileSize } from "@/utils/formatters";
import { toast } from "sonner";

const DESIGN_INTEGRATIONS = [
  {
    id: "figma",
    name: "Figma",
    icon: Figma,
    color: "text-brand-figma",
    urlKey: "figma_url",
    validate: (u: string) => /figma\.com\/(file|proto|design|board|make)\//.test(u),
  },
  {
    id: "penpot",
    name: "Penpot",
    icon: Palette,
    color: "text-brand-penpot",
    urlKey: "penpot_url",
    validate: (u: string) => /penpot\.app\//.test(u),
  },
  {
    id: "framer",
    name: "Framer",
    icon: Palette,
    color: "text-brand-framer",
    urlKey: "framer_url",
    validate: (u: string) => /framer\.com\//.test(u),
  },
  {
    id: "canva",
    name: "Canva",
    icon: Palette,
    color: "text-brand-canva",
    urlKey: "canva_url",
    validate: (u: string) => /canva\.com\//.test(u),
  },
  {
    id: "adobe-xd",
    name: "Adobe XD",
    icon: FileImage,
    color: "text-brand-adobe-xd",
    urlKey: "adobe_xd_url",
    validate: (u: string) => /xd\.adobe\.com\//.test(u),
  },
  {
    id: "sketch-cloud",
    name: "Sketch Cloud",
    icon: FileImage,
    color: "text-brand-sketch",
    urlKey: "sketch_cloud_url",
    validate: (u: string) => /sketch\.com\//.test(u),
  },
] as const;

export default function ProjectDesignPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { data: project } = useProject(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [addLinkUrl, setAddLinkUrl] = useState("");

  const [connectingInt, setConnectingInt] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState("");
  const [connectToken, setConnectToken] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["design-assets", projectId],
    queryFn: () =>
      api
        .get("/attachments", {
          params: { model_type: "project", model_id: projectId, collection_name: "design" },
        })
        .then((r) => r.data?.items || r.data?.data || r.data || []),
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/attachments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["design-assets", projectId] }),
  });

  const assets = (assetsData || []) as Array<{
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    url: string;
    created_at: string;
  }>;

  const connectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) =>
      api.put(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", projectId] });
      setConnectingInt(null);
      setConnectUrl("");
      setConnectToken("");
      setConnectError(null);
      toast.success("Integration updated");
    },
    onError: () => {
      setConnectError("Failed to save. Please try again.");
    },
  });

  if (!projectId) return null;

  const getConnectedUrl = (integrationId: string): string | undefined => {
    const int = DESIGN_INTEGRATIONS.find((i) => i.id === integrationId);
    if (!int || !project) return undefined;
    return (project as unknown as Record<string, string | undefined>)[int.urlKey];
  };

  const handleBeginConnect = (integrationId: string) => {
    const existing = getConnectedUrl(integrationId);
    setConnectingInt(integrationId);
    setConnectUrl(existing || "");
    setConnectToken((project as unknown as Record<string, string>)?.figma_token || "");
    setConnectError(null);
  };

  const handleCancelConnect = () => {
    setConnectingInt(null);
    setConnectUrl("");
    setConnectToken("");
    setConnectError(null);
  };

  const handleConnect = (integrationId: string, url: string) => {
    const integration = DESIGN_INTEGRATIONS.find((i) => i.id === integrationId);
    if (!integration || !projectId) return;

    if (!url.trim()) {
      setConnectError("URL is required.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setConnectError("Invalid URL format.");
      return;
    }

    if (!integration.validate(url)) {
      setConnectError(
        `Invalid ${integration.name} URL. Expected format: https://${integration.id === "figma" ? "figma.com/file/..." : integration.id === "canva" ? "canva.com/..." : `...`}`,
      );
      return;
    }

    setConnectError(null);
    const data: Record<string, string> = { [integration.urlKey]: url.trim() };
    if (integrationId === "figma" && connectToken.trim()) {
      data.figma_token = connectToken.trim();
    }
    connectMutation.mutate({ id: projectId, data });
  };

  const handleDisconnect = (integrationId: string) => {
    const integration = DESIGN_INTEGRATIONS.find((i) => i.id === integrationId);
    if (!integration || !projectId) return;
    const data: Record<string, string> = { [integration.urlKey]: "" };
    if (integrationId === "figma") data.figma_token = "";
    connectMutation.mutate({ id: projectId, data });
  };

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    let failCount = 0;
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("model_type", "project");
          formData.append("model_id", String(projectId));
          formData.append("collection_name", "design");
          await api.post("/attachments/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["design-assets", projectId] });
      if (successCount > 0)
        toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded`);
      if (failCount > 0)
        toast.error(`${failCount} file${failCount > 1 ? "s" : ""} failed to upload`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleAddLink = async () => {
    if (!addLinkUrl.trim()) return;
    try {
      const safeName = addLinkUrl
        .trim()
        .replace(/^https?:\/\//, "")
        .substring(0, 100);
      const formData = new FormData();
      const blob = new Blob([addLinkUrl.trim()], { type: "text/plain" });
      formData.append("file", new File([blob], `${safeName}.url`, { type: "text/plain" }));
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "design");
      await api.post("/attachments/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({ queryKey: ["design-assets", projectId] });
      toast.success("Link added");
    } catch {
      toast.error("Failed to add link");
    }
    setAddLinkOpen(false);
    setAddLinkUrl("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Design</h2>
          <p className="text-sm text-tertiary">
            {assets.length} asset{assets.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Design Integrations */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-tertiary" />
          <h3 className="text-sm font-semibold text-primary">Design Integrations</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DESIGN_INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            const connectedUrl = getConnectedUrl(integration.id);
            const isConnected = !!connectedUrl;
            const isConnecting = connectingInt === integration.id;
            return (
              <div key={integration.id}>
                {isConnecting ? (
                  <div className="space-y-2 rounded-lg border border-primary bg-primary-soft p-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={connectUrl}
                        onChange={(e) => {
                          setConnectUrl(e.target.value);
                          setConnectError(null);
                        }}
                        placeholder={`${integration.name} URL...`}
                        className="border-default focus:ring-primary-ring h-8 flex-1 rounded border bg-surface px-2 text-xs text-primary focus:outline-none focus:ring-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleConnect(integration.id, connectUrl)}
                        loading={connectMutation.isPending}
                      >
                        {connectedUrl ? "Update" : "Save"}
                      </Button>
                      <button
                        onClick={handleCancelConnect}
                        className="p-1 text-tertiary hover:text-primary"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {integration.id === "figma" && (
                      <input
                        value={connectToken}
                        onChange={(e) => setConnectToken(e.target.value)}
                        placeholder="Figma API token (optional, for private files)..."
                        type="password"
                        className="border-default focus:ring-primary-ring h-8 w-full rounded border bg-surface px-2 text-xs text-primary placeholder:text-tertiary focus:outline-none focus:ring-1"
                      />
                    )}
                    {connectError && (
                      <div className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertCircle className="h-3 w-3" />
                        {connectError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-default flex items-center gap-3 rounded-lg border bg-surface p-3 transition-colors hover:bg-hover">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-subtle">
                      <Icon className={`h-5 w-5 ${integration.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-primary">{integration.name}</p>
                        {isConnected ? (
                          <Badge variant="success" size="sm" dot>
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Not connected
                          </Badge>
                        )}
                      </div>
                      {isConnected && connectedUrl && (
                        <a
                          href={connectedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 flex items-center gap-1 truncate text-xs text-link hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" /> Open
                        </a>
                      )}
                    </div>
                    <div>
                      {isConnected ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleBeginConnect(integration.id)}
                            className="rounded p-1.5 text-tertiary hover:bg-hover hover:text-primary"
                            title="Edit URL"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => window.open(connectedUrl, "_blank")}
                            className="rounded p-1.5 text-tertiary hover:bg-hover hover:text-primary"
                            title="Open"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDisconnect(integration.id)}
                            className="rounded p-1.5 text-tertiary hover:bg-hover hover:text-danger"
                            title="Disconnect"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleBeginConnect(integration.id)}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Figma Preview (if connected) */}
      {project?.figma_url && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Figma className="h-4 w-4 text-brand-figma" />
            <h3 className="text-sm font-semibold text-primary">Figma Preview</h3>
            <Badge variant="success" size="sm" dot>
              Connected
            </Badge>
          </div>
          <FigmaPreview
            url={project.figma_url}
            token={(project as unknown as Record<string, string>)?.figma_token}
          />
        </Card>
      )}

      {/* Canva Preview (if connected) */}
      {project?.canva_url && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand-canva" />
            <h3 className="text-sm font-semibold text-primary">Canva Preview</h3>
            <Badge variant="success" size="sm" dot>
              Connected
            </Badge>
          </div>
          <div className="border-default flex items-start gap-4 rounded-lg border bg-subtle p-3">
            <div className="brand-tint flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-canva">
              <Palette className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary">Canva Design</p>
              <p className="mt-0.5 text-xs text-tertiary">
                Open in Canva to view and edit this design.
              </p>
              <a href={project.canva_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="mt-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in Canva
                </Button>
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Framer Preview (if connected) */}
      {project?.framer_url && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand-framer" />
            <h3 className="text-sm font-semibold text-primary">Framer Preview</h3>
            <Badge variant="success" size="sm" dot>
              Connected
            </Badge>
          </div>
          <div className="border-default flex items-start gap-4 rounded-lg border bg-subtle p-3">
            <div className="brand-tint flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-framer">
              <Palette className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary">Framer Project</p>
              <p className="mt-0.5 text-xs text-tertiary">
                Open in Framer to view the live project.
              </p>
              <a href={project.framer_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="mt-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in Framer
                </Button>
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Design Assets */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">Design Assets</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setAddLinkOpen(!addLinkOpen)}>
              <Link className="h-3.5 w-3.5" /> Add Link
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.ai,.psd,.eps,.fig,.xd,.sketch,.zip,.rar,.7z"
              onChange={(e) => {
                handleUpload(e.target.files);
                if (e.target) e.target.value = "";
              }}
            />
          </div>
        </div>

        {addLinkOpen && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary bg-primary-soft p-3">
            <input
              value={addLinkUrl}
              onChange={(e) => setAddLinkUrl(e.target.value)}
              placeholder="Paste a design link (Figma, Canva, etc.)..."
              className="border-default focus:ring-primary-ring h-9 flex-1 rounded border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-1"
              autoFocus
            />
            <Button size="sm" onClick={handleAddLink}>
              Add Link
            </Button>
            <button
              onClick={() => setAddLinkOpen(false)}
              className="p-1 text-tertiary hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Upload dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors duration-fast ${
            dragOver
              ? "border-primary bg-primary-soft"
              : "border-default bg-subtle/30 hover:border-hover"
          }`}
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-secondary">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-6 w-6 text-tertiary" />
              <p className="text-sm text-secondary">Drop design files here or click to upload</p>
              <p className="mt-1 text-xs text-tertiary">
                PNG, JPG, GIF, WebP, SVG, PDF, AI, PSD, EPS, FIG, XD, ZIP
              </p>
            </>
          )}
        </div>

        {assetsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <EnterpriseEmptyState
            icon={<Palette className="h-10 w-10" />}
            title="No design assets"
            description="Upload PNG, JPG, SVG, PDF, AI, PSD, EPS, or ZIP files, or connect a design provider."
            primaryAction={{ label: "Upload", onClick: () => fileInputRef.current?.click() }}
            helpLink={{
              label: "Import your designs",
              href: "https://docs.example.com/design-import",
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {assets.map((file) => {
              const previewUrl = file.url?.includes("/attachments/download/")
                ? `${file.url}?inline=true`
                : file.url;
              return (
                <div
                  key={file.id}
                  className="border-default group relative overflow-hidden rounded-lg border bg-surface transition-colors hover:bg-hover"
                >
                  <div className="aspect-video overflow-hidden bg-subtle">
                    <PreviewEngine
                      mimeType={file.mime_type}
                      fileName={file.name || file.file_name}
                      fileUrl={previewUrl}
                      fileSize={file.size}
                      className="h-full"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs text-primary">{file.name || file.file_name}</p>
                    <p className="text-xs text-tertiary">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => window.open(previewUrl, "_blank")}
                      className="bg-surface/90 rounded p-1 text-tertiary hover:text-primary"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("access_token");
                          const res = await fetch(file.url, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          });
                          if (!res.ok) throw new Error("Download failed");
                          const blob = await res.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = blobUrl;
                          a.download = file.name || file.file_name || "download";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(file.url, "_blank");
                        }
                      }}
                      className="bg-surface/90 rounded p-1 text-tertiary hover:text-primary"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(file.id)}
                      className="bg-surface/90 rounded p-1 text-tertiary hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
