import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  size = "md",
}: SearchInputProps) {
  const height = size === "sm" ? "h-8" : "h-9";
  const icon = size === "sm" ? "left-2.5 h-3.5 w-3.5" : "left-3 h-4 w-4";
  const paddingLeft = size === "sm" ? "pl-8" : "pl-9";

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-tertiary", icon)}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "border-default w-full rounded-control border bg-surface pr-8 text-primary placeholder:text-tertiary",
          "transition-colors duration-fast hover:border-hover",
          "focus:ring-primary-ring focus:border-focus focus:outline-none focus:ring-2",
          height,
          paddingLeft,
          size === "sm" ? "text-xs" : "text-sm",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary transition-colors hover:text-secondary"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
