import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionChipProps {
  label: string;
  enabled: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function PermissionChip({ label, enabled, onClick, size = "md", className }: PermissionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        enabled
          ? "bg-primary-soft text-primary hover:bg-primary-soft/70"
          : "bg-subtle text-secondary hover:bg-hover hover:text-primary",
        className
      )}
    >
      {enabled && <Check className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />}
      {label}
    </button>
  );
}
