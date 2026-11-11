import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: AvatarSize;
  status?: "online" | "away" | "busy" | "offline";
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
};

const statusSizeStyles: Record<AvatarSize, string> = {
  xs: "h-1 w-1 right-0 bottom-0",
  sm: "h-1.5 w-1.5 right-0 bottom-0",
  md: "h-2 w-2 right-0 bottom-0",
  lg: "h-2.5 w-2.5 right-0 bottom-0",
  xl: "h-3 w-3 right-0.5 bottom-0.5",
};

const statusColorStyles: Record<string, string> = {
  online: "bg-success",
  away: "bg-warning",
  busy: "bg-danger",
  offline: "bg-grey-400",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = "md", status, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative inline-flex shrink-0", className)} {...props}>
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-full",
            "bg-primary-soft font-medium text-primary",
            sizeStyles[size],
          )}
        >
          {src ? (
            <img src={src} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{initials(name)}</span>
          )}
        </div>
        {status && (
          <span
            title={status}
            className={cn(
              "border-surface absolute rounded-full border-2",
              statusSizeStyles[size],
              statusColorStyles[status],
            )}
          />
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";
