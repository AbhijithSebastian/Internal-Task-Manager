import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "interactive" | "highlight" | "subtle";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-surface border border-default shadow-card",
  interactive:
    "bg-surface border border-default shadow-card hover:shadow-elevated hover:border-hover hover:-translate-y-0.5 cursor-pointer transition-all duration-normal",
  highlight:
    "bg-surface border-2 border-primary shadow-elevated",
  subtle:
    "bg-bg-subtle border border-subtle shadow-none",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl overflow-hidden",
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
