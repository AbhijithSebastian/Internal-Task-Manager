import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "interactive" | "highlight";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-surface border border-default shadow-card",
  interactive:
    "bg-surface border border-default shadow-card hover:shadow-elevated hover:border-hover hover:-translate-y-px cursor-pointer transition-all duration-fast",
  highlight:
    "bg-surface border border-primary/20 shadow-card",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg p-5", variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
