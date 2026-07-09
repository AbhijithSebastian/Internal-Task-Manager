import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useProject } from "@/features/projects/hooks/useProject";
import { FigmaPreview } from "@/components/previews/FigmaPreview";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Palette, Upload, Link, Figma, FileImage, FileText, FileArchive, Download, Trash2, ExternalLink, Unlink, Wrench, X, AlertCircle } from "lucide-react";
import { formatFileSize } from "@/utils/formatters";

const DESIGN_INTEGRATIONS = [
  { id: "figma", name: "Figma", icon: Figma, color: "text-[#a259ff]", urlKey: "figma_url", validate: (u: string) => /figma\.com\/(file|proto|design)\//.test(u) },
  { id: "penpot", name: "Penpot", icon: Palette, color: "text-[#17a97c]", urlKey: "penpot_url", validate: (u: string) => /penpot\.app\//.test(u) },
  { id: "framer", name: "Framer", icon: Palette, color: "text-[#0055ff]", urlKey: "framer_url", validate: (u: string) => /framer\.com\//.test(u) },
  { id: "canva", name: "Canva", icon: Palette, color: "text-[#00c4cc]", urlKey: "canva_url", validate: (u: string) => /canva\.com\//.test(u) },
  { id: "adobe-xd", name: "Adobe XD", icon: FileImage, color: "text-[#ff61f6]", urlKey: "adobe_xd_url", validate: (u: string) => /xd\.adobe\.com\//.test(u) },
  { id: "sketch-cloud", name: "Sketch Cloud", icon: FileImage, color: "text-[#f7b731]", urlKey: "sketch_cloud_url", validate: (u: string) => /sketch\.com\//.test(u) },
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
  const [connectError, setConnectError] = useState<string | null>(null);

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["design-assets", projectId],
    queryFn: () => api.get("/attachments", { params: { model_type: "project", model_id: projectId, collection_name: "design" } }).then((r) => r.data?.items || r.data?.data || r.data || []),
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/attachments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["design-assets", projectId] }),
  });

  const assets = (assetsData || []) as Array<{ id: number; name: string; file_name: string; mime_type: string; size: number; url: string; created_at: string }>;

  if (!projectId) return null;

  const connectMutation = useMutation({
    mutationFn: ({ id, url, urlKey }: { id: string; url: string; urlKey: string }) =>
      api.put(`/projects/${id}`, { [urlKey]: url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", projectId] });
      setConnectingInt(null);
      setConnectUrl("");
      setConnectError(null);
    },
    onError: () => {
      setConnectError("Failed to save. Please try again.");
    },
  });

  const getConnectedUrl = (integrationId: string): string | undefined => {
    const int = DESIGN_INTEGRATIONS.find((i) => i.id === integrationId);
    if (!int || !project) return undefined;
    return (project as unknown as Record<string, string | undefined>)[int.urlKey];
  };

  const handleBeginConnect = (integrationId: string) => {
    const existing = getConnectedUrl(integrationId);
    setConnectingInt(integrationId);
    setConnectUrl(existing || "");
    setConnectError(null);
  };

  const handleCancelConnect = () => {
    setConnectingInt(null);
    setConnectUrl("");
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
      setConnectError(`Invalid ${integration.name} URL. Expected format: https://${integration.id === "figma" ? "figma.com/file/..." : integration.id === "canva" ? "canva.com/..." : `...`}`);
      return;
    }

    setConnectError(null);
    connectMutation.mutate({ id: projectId, url: url.trim(), urlKey: integration.urlKey });
  };

  const handleDisconnect = (integrationId: string) => {
    const integration = DESIGN_INTEGRATIONS.find((i) => i.id === integrationId);
    if (!integration || !projectId) return;
    connectMutation.mutate({ id: projectId, url: "", urlKey: integration.urlKey });
  };

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model_type", "project");
        formData.append("model_id", String(projectId));
        formData.append("collection_name", "design");
        await api.post("/attachments/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      queryClient.invalidateQueries({ queryKey: ["design-assets", projectId] });
    } catch {
      // handled silently
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleAddLink = () => {
    if (!addLinkUrl.trim()) return;
    fetch(addLinkUrl.trim(), { mode: "no-cors" }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["design-assets", projectId] });
    setAddLinkOpen(false);
    setAddLinkUrl("");
  };

  const isImage = (mime?: string) => mime?.startsWith("image/");
  const isPdf = (mime?: string) => mime?.includes("pdf");
  const isZip = (mime?: string) => mime?.includes("zip") || mime?.includes("rar");
  const isPsd = (name?: string) => name?.endsWith(".psd");
  const isAi = (name?: string) => name?.endsWith(".ai");
  const isEps = (name?: string) => name?.endsWith(".eps");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Design</h2>
          <p className="text-sm text-tertiary">{assets.length} asset{assets.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Design Integrations */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-tertiary" />
          <h3 className="text-sm font-semibold text-primary">Design Integrations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DESIGN_INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            const connectedUrl = getConnectedUrl(integration.id);
            const isConnected = !!connectedUrl;
            const isConnecting = connectingInt === integration.id;
            return (
              <div key={integration.id}>
                {isConnecting ? (
                  <div className="p-3 rounded-lg border border-primary bg-primary-soft space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={connectUrl}
                        onChange={(e) => { setConnectUrl(e.target.value); setConnectError(null); }}
                        placeholder={`${integration.name} URL...`}
                        className="flex-1 h-8 px-2 rounded text-xs bg-surface border border-default text-primary focus:outline-none focus:ring-1 focus:ring-primary-ring"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleConnect(integration.id, connectUrl)} loading={connectMutation.isPending}>
                        {connectedUrl ? "Update" : "Save"}
                      </Button>
                      <button onClick={handleCancelConnect} className="p-1 text-tertiary hover:text-primary"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    {connectError && (
                      <div className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertCircle className="h-3 w-3" />
                        {connectError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-default bg-surface hover:bg-hover transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center">
                      <Icon className={`h-5 w-5 ${integration.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-primary">{integration.name}</p>
                        {isConnected ? (
                          <Badge variant="success" size="sm" dot>Connected</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Not connected</Badge>
                        )}
                      </div>
                      {isConnected && connectedUrl && (
                        <a href={connectedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-link hover:underline flex items-center gap-1 mt-0.5 truncate">
                          <ExternalLink className="h-3 w-3 shrink-0" /> Open
                        </a>
                      )}
                    </div>
                    <div>
                      {isConnected ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleBeginConnect(integration.id)} className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover" title="Edit URL">
                            <Wrench className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => window.open(connectedUrl, "_blank")} className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover" title="Open">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDisconnect(integration.id)} className="p-1.5 rounded text-tertiary hover:text-danger hover:bg-hover" title="Disconnect">
                            <Unlink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => handleBeginConnect(integration.id)}>Connect</Button>
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
          <div className="flex items-center gap-2 mb-3">
            <Figma className="h-4 w-4 text-[#a259ff]" />
            <h3 className="text-sm font-semibold text-primary">Figma Preview</h3>
            <Badge variant="success" size="sm" dot>Connected</Badge>
          </div>
          <FigmaPreview url={project.figma_url} />
        </Card>
      )}

      {/* Canva Preview (if connected) */}
      {project?.canva_url && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-[#00c4cc]" />
            <h3 className="text-sm font-semibold text-primary">Canva Preview</h3>
            <Badge variant="success" size="sm" dot>Connected</Badge>
          </div>
          <div className="flex items-start gap-4 p-3 rounded-lg bg-subtle border border-default">
            <div className="w-10 h-10 rounded-lg bg-[#00c4cc]/10 flex items-center justify-center shrink-0">
              <Palette className="h-5 w-5 text-[#00c4cc]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">Canva Design</p>
              <p className="text-xs text-tertiary mt-0.5">Open in Canva to view and edit this design.</p>
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
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-[#0055ff]" />
            <h3 className="text-sm font-semibold text-primary">Framer Preview</h3>
            <Badge variant="success" size="sm" dot>Connected</Badge>
          </div>
          <div className="flex items-start gap-4 p-3 rounded-lg bg-subtle border border-default">
            <div className="w-10 h-10 rounded-lg bg-[#0055ff]/10 flex items-center justify-center shrink-0">
              <Palette className="h-5 w-5 text-[#0055ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">Framer Project</p>
              <p className="text-xs text-tertiary mt-0.5">Open in Framer to view the live project.</p>
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
        <div className="flex items-center justify-between mb-3">
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
              accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.psd,.eps,.zip"
              onChange={(e) => { handleUpload(e.target.files); if (e.target) e.target.value = ""; }}
            />
          </div>
        </div>

        {addLinkOpen && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-primary bg-primary-soft">
            <input
              value={addLinkUrl}
              onChange={(e) => setAddLinkUrl(e.target.value)}
              placeholder="Paste a design link (Figma, Canva, etc.)..."
              className="flex-1 h-9 px-3 rounded text-sm bg-surface border border-default text-primary focus:outline-none focus:ring-1 focus:ring-primary-ring"
              autoFocus
            />
            <Button size="sm" onClick={handleAddLink}>Add Link</Button>
            <button onClick={() => setAddLinkOpen(false)} className="p-1 text-tertiary hover:text-primary"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Upload dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-fast mb-4 ${
            dragOver ? "border-primary bg-primary-soft" : "border-default hover:border-hover bg-subtle/30"
          }`}
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm text-secondary">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-tertiary mb-2" />
              <p className="text-sm text-secondary">Drop design files here or click to upload</p>
              <p className="text-xs text-tertiary mt-1">PNG, JPG, SVG, PDF, AI, PSD, EPS, ZIP</p>
            </>
          )}
        </div>

        {assetsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-14 w-full rounded-lg" />)}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            icon={<Palette className="h-10 w-10" />}
            title="No design assets"
            description="Upload PNG, JPG, SVG, PDF, AI, PSD, EPS, or ZIP files."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {assets.map((file) => {
              const fileIcon = isPsd(file.name || file.file_name)
                ? <FileImage className="h-5 w-5 text-[#001e36]" />
                : isAi(file.name || file.file_name)
                ? <FileImage className="h-5 w-5 text-[#ff9a00]" />
                : isEps(file.name || file.file_name)
                ? <FileText className="h-5 w-5 text-[#ff6600]" />
                : isPdf(file.mime_type)
                ? <FileText className="h-5 w-5 text-danger" />
                : isZip(file.mime_type)
                ? <FileArchive className="h-5 w-5 text-warning" />
                : <FileImage className="h-5 w-5 text-tertiary" />;

              return (
                <div key={file.id} className="group relative rounded-lg border border-default bg-surface hover:bg-hover transition-colors overflow-hidden">
                  {isImage(file.mime_type) ? (
                    <div className="aspect-video bg-subtle overflow-hidden">
                      <img src={file.url} alt={file.name || file.file_name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-subtle flex items-center justify-center">
                      {fileIcon}
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-primary truncate">{file.name || file.file_name}</p>
                    <p className="text-xs text-tertiary">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => window.open(file.url, "_blank")} className="p-1 rounded bg-surface/90 text-tertiary hover:text-primary" title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(file.id)} className="p-1 rounded bg-surface/90 text-tertiary hover:text-danger" title="Delete">
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
