import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("overflow-hidden rounded-xl transition-all duration-normal", {
  variants: {
    variant: {
      default: "border-border-default border bg-surface shadow-card",
      interactive:
        "border-border-default cursor-pointer border bg-surface shadow-card hover:-translate-y-0.5 hover:border-border-hover hover:shadow-elevated",
      highlight: "border-2 border-primary bg-surface shadow-elevated",
      subtle: "border border-border-subtle bg-grey-50 shadow-none",
      ghost: "bg-transparent",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    },
  },
  defaultVariants: { variant: "default", padding: "md" },
});

type CardVariant = NonNullable<VariantProps<typeof cardVariants>["variant"]>;

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants({ variant, padding }), className)} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export { cardVariants };
export type { CardVariant };
