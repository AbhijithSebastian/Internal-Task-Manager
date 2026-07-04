import { FileImage, FileText, FileArchive, Package, Video, Figma, Github, Globe, File } from "lucide-react";
import type { ResourceType } from "@/types/resources";

const icons: Record<ResourceType, typeof File> & { default: typeof File } = {
  image: FileImage,
  document: FileText,
  zip: FileArchive,
  apk: Package,
  video: Video,
  figma: Figma,
  github: Github,
  url: Globe,
  other: File,
  default: File,
};

export function ResourceTypeIcon({ type, className }: { type?: ResourceType; className?: string }) {
  const Icon = type ? icons[type] ?? icons.default : icons.default;
  return <Icon className={className || "h-5 w-5"} />;
}

const TYPE_LABELS: Record<ResourceType, string> = {
  image: "Image",
  document: "Document",
  zip: "Archive",
  apk: "APK",
  video: "Video",
  figma: "Figma",
  github: "GitHub",
  url: "Link",
  other: "Other",
};

export function resourceTypeLabel(type?: ResourceType | null): string {
  return type ? TYPE_LABELS[type] ?? "Other" : "Other";
}
