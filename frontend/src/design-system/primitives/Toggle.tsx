import { cn } from "@/lib/utils";

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function Toggle({
  enabled,
  onToggle,
  size = "md",
  className,
  label,
  disabled,
}: ToggleProps) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumb = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const thumbOn = size === "sm" ? "translate-x-[18px]" : "translate-x-[22px]";
  const thumbOff = "translate-x-[3px]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-fast",
        "focus-visible:ring-primary-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        track,
        enabled ? "bg-primary" : "bg-grey-200",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow-sm transition-transform duration-fast",
          thumb,
          enabled ? thumbOn : thumbOff,
        )}
      />
    </button>
  );
}
