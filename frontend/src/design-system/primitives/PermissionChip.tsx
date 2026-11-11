import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionChipProps {
  label: string;
  enabled: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function PermissionChip({
  label,
  enabled,
  onClick,
  size = "md",
  className,
}: PermissionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-pill font-medium transition-colors duration-fast",
        "focus-visible:ring-primary-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        enabled
          ? "bg-primary-soft text-primary hover:bg-primary-soft-hover"
          : "bg-subtle text-secondary hover:bg-hover hover:text-primary",
        className,
      )}
    >
      {enabled && <Check className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />}
      {label}
    </button>
  );
}
