import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}

export function SearchInput({ value, onChange, placeholder = "Search...", className, size = "md" }: SearchInputProps) {
  const h = size === "sm" ? "h-8" : "h-9";
  const iconLeft = size === "sm" ? "left-2.5 h-3.5 w-3.5" : "left-3 h-4 w-4";
  const pl = size === "sm" ? "pl-8" : "pl-9";

  return (
    <div className={cn("relative", className)}>
      <Search className={cn("absolute top-1/2 -translate-y-1/2 text-tertiary pointer-events-none", iconLeft)} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md bg-surface border border-default text-primary placeholder:text-tertiary",
          "hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors",
          h, pl, "pr-3", size === "sm" ? "text-xs" : "text-sm"
        )}
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
