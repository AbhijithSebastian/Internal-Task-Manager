import { cn } from "@/lib/utils";

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function Toggle({ enabled, onToggle, size = "md", className }: ToggleProps) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumb = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const thumbOn = size === "sm" ? "translate-x-[18px]" : "translate-x-[22px]";
  const thumbOff = size === "sm" ? "translate-x-[3px]" : "translate-x-[3px]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors",
        track,
        enabled ? "bg-primary" : "bg-subtle",
        className
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white transition-transform",
          thumb,
          enabled ? thumbOn : thumbOff
        )}
      />
    </button>
  );
}
