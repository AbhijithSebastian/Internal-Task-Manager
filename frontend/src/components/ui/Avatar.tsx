import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: AvatarSize;
  status?: "online" | "away" | "busy" | "offline";
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
};

const statusSizeStyles: Record<AvatarSize, string> = {
  sm: "h-1.5 w-1.5 right-0 bottom-0",
  md: "h-2 w-2 right-0 bottom-0",
  lg: "h-2.5 w-2.5 right-0 bottom-0",
  xl: "h-3 w-3 right-0.5 bottom-0.5",
};

const statusColorStyles: Record<string, string> = {
  online: "bg-semantic-success",
  away: "bg-semantic-warning",
  busy: "bg-semantic-danger",
  offline: "bg-tertiary",
};

const initials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = "md", status, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative inline-flex shrink-0", className)}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className={cn("rounded-full object-cover", sizeStyles[size])}
          />
        ) : (
          <div
            className={cn(
              "rounded-full bg-primary-soft text-primary font-semibold flex items-center justify-center",
              sizeStyles[size]
            )}
          >
            {initials(name)}
          </div>
        )}
        {status && (
          <span
            className={cn(
              "absolute rounded-full border-2 border-surface",
              statusSizeStyles[size],
              statusColorStyles[status]
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
