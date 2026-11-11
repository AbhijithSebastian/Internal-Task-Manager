import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-colors duration-fast",
    "focus-visible:ring-primary-ring focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-inverse hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "border-default border bg-surface text-primary hover:border-hover hover:bg-hover active:bg-active",
        outline:
          "border border-primary bg-transparent text-primary hover:bg-primary-soft active:bg-primary-soft-hover",
        ghost: "bg-transparent text-secondary hover:bg-hover hover:text-primary active:bg-active",
        soft: "bg-primary-soft text-primary hover:bg-primary-soft-hover active:bg-primary-soft",
        danger: "bg-danger text-inverse hover:opacity-90 active:opacity-80",
      },
      size: {
        sm: "h-control-sm px-5 text-xs",
        md: "h-control-md px-5 text-sm",
        lg: "h-control-lg px-5 text-base",
      },
      shape: {
        default: "rounded-button",
        pill: "rounded-pill",
      },
      iconOnly: {
        true: "px-0",
        false: "",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      { iconOnly: true, size: "sm", class: "w-control-icon-sm" },
      { iconOnly: true, size: "md", class: "w-control-icon-md" },
      { iconOnly: true, size: "lg", class: "w-control-icon-lg" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "default",
      iconOnly: false,
      fullWidth: false,
    },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "fullWidth" | "iconOnly"> {
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      shape = "default",
      loading,
      disabled,
      fullWidth,
      iconOnly,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size, shape, iconOnly, fullWidth }), className)}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : leftIcon}
        {!iconOnly && children}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
