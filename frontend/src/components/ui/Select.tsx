import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-9 px-3 pr-8 rounded-md bg-surface border text-sm text-primary transition-colors duration-fast appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary",
              error
                ? "border-semantic-danger focus:ring-semantic-danger/30"
                : "border-default hover:border-hover",
              "disabled:bg-subtle disabled:text-tertiary disabled:cursor-not-allowed",
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary pointer-events-none" />
        </div>
        {error && (
          <p className="text-xs text-semantic-danger" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
