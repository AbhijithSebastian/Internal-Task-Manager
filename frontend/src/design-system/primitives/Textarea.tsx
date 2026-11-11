import { forwardRef, type TextareaHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              "min-h-20 w-full rounded-control border bg-surface px-3 py-2 text-sm text-primary",
              "resize-y transition-colors duration-fast placeholder:text-tertiary",
              "focus:ring-primary-ring focus:border-focus focus:outline-none focus:ring-2",
              error
                ? "focus:ring-danger/30 border-danger focus:border-danger"
                : "border-default hover:border-hover",
              "disabled:cursor-not-allowed disabled:bg-inset disabled:text-disabled",
              className,
            )}
            {...props}
          />
          {error && (
            <AlertCircle
              className="absolute right-3 top-3 h-4 w-4 text-danger"
              aria-hidden="true"
            />
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-tertiary">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
