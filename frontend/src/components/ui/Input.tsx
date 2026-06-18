import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-9 px-3 rounded-md bg-surface border text-sm text-primary placeholder:text-tertiary transition-colors duration-fast",
              "focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary",
              error
                ? "border-semantic-danger focus:ring-semantic-danger/30 focus:border-semantic-danger"
                : "border-default hover:border-hover",
              "disabled:bg-subtle disabled:text-tertiary disabled:cursor-not-allowed",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-semantic-danger" />
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-semantic-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
