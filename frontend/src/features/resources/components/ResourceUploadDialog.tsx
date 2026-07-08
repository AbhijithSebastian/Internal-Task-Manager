import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Upload, File, X, Link as LinkIcon } from "lucide-react";
import { RESOURCE_TYPES } from "@/types/resources";
import { useCreateResource, useUploadResource } from "../hooks/useResources";
import { Badge } from "@/components/ui/Badge";

interface ResourceUploadDialogProps {
  projectId: string | number;
  open: boolean;
  onClose: () => void;
}

type Mode = "link" | "upload";

export function ResourceUploadDialog({ projectId, open, onClose }: ResourceUploadDialogProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<string>("document");
  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createResource = useCreateResource(projectId);
  const uploadResource = useUploadResource(projectId);

  if (!open) return null;

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (mode === "link") {
      createResource.mutate(
        { name: name.trim(), description, resource_type: resourceType, category: category || undefined, url, tags: tags.length > 0 ? tags : undefined },
        { onSuccess: () => { reset(); onClose(); } }
      );
    } else if (file) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name.trim());
      if (description) fd.append("description", description);
      fd.append("resource_type", resourceType);
      if (category) fd.append("category", category);
      tags.forEach((t) => fd.append("tags", t));
      uploadResource.mutate(fd, { onSuccess: () => { reset(); onClose(); } });
    }
  };

  const reset = () => {
    setName(""); setDescription(""); setResourceType("document");
    setCategory(""); setUrl(""); setTags([]); setTagInput(""); setFile(null);
  };

  const isLoading = createResource.isPending || uploadResource.isPending;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg rounded-lg bg-surface p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Add Resource</h3>
          <button onClick={onClose} className="p-1 rounded-md text-secondary hover:bg-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-1 mb-4 bg-subtle rounded-lg p-1">
          <button
            onClick={() => setMode("upload")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "upload" ? "bg-surface text-primary shadow-sm" : "text-tertiary hover:text-secondary"
            }`}
          >
            <Upload className="h-4 w-4" /> Upload File
          </button>
          <button
            onClick={() => setMode("link")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "link" ? "bg-surface text-primary shadow-sm" : "text-tertiary hover:text-secondary"
            }`}
          >
            <LinkIcon className="h-4 w-4" /> Add Link
          </button>
        </div>
        <div className="space-y-4">
          {mode === "upload" && (
            <div
              className="border-2 border-dashed border-default rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <File className="h-5 w-5 text-primary" />
                  <span className="text-sm text-primary">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="p-0.5 rounded text-tertiary hover:text-semantic-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-secondary">Drop a file or click to browse</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
              />
            </div>
          )}
          {mode === "link" && (
            <Input label="URL" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          )}
          <Input label="Name" placeholder="Resource name" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-default bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              options={RESOURCE_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            />
            <Input label="Category" placeholder="e.g. Design, API, Docs" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Tags</label>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {tags.map((t) => (
                <Badge key={t} variant="default" size="sm">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 hover:text-semantic-danger">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tag..."
                className="flex-1 h-9 px-3 rounded-md border border-default bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
              <Button variant="secondary" size="sm" onClick={handleAddTag}>Add</Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name.trim() || (mode === "upload" && !file) || (mode === "link" && !url.trim())}>
            {isLoading ? "Saving..." : mode === "upload" ? "Upload" : "Create"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
