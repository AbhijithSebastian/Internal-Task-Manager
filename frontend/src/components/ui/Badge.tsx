import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary-soft text-primary",
  success: "bg-semantic-success-soft text-semantic-success",
  warning: "bg-semantic-warning-soft text-semantic-warning",
  danger: "bg-semantic-danger-soft text-semantic-danger",
  info: "bg-semantic-info-soft text-semantic-info",
  neutral: "bg-subtle text-secondary",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "sm", dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "default" && "bg-primary",
            variant === "success" && "bg-semantic-success",
            variant === "warning" && "bg-semantic-warning",
            variant === "danger" && "bg-semantic-danger",
            variant === "info" && "bg-semantic-info",
            variant === "neutral" && "bg-tertiary",
          )} />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";
