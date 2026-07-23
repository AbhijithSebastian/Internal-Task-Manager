import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

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
          <label htmlFor={inputId} className="block text-sm font-medium text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            className={cn(
              "w-full min-h-[80px] px-3 py-2 rounded-lg bg-surface border text-sm text-primary placeholder:text-tertiary transition-all duration-fast resize-y",
              "focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary focus:ring-offset-1",
              error
                ? "border-semantic-danger focus:ring-semantic-danger/30 focus:border-semantic-danger"
                : "border-default hover:border-hover",
              "disabled:bg-bg-inset disabled:text-tertiary disabled:cursor-not-allowed",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {error && (
            <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-semantic-danger" />
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
Textarea.displayName = "Textarea";
