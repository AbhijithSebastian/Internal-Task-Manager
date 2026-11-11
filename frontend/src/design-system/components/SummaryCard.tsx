import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: ReactNode;
  className?: string;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
}

const toneStyles = {
  neutral: "bg-grey-100 text-grey-700",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function SummaryCard({ icon, value, label, className, tone = "neutral" }: SummaryCardProps) {
  return (
    <div
      className={cn(
        "border-default flex items-center gap-5 rounded-md border bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-pill",
          toneStyles[tone],
        )}
      >
        <span className="[&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-3 text-secondary">
        <p className="text-2xl font-medium leading-none text-secondary">{value}</p>
        <p className="text-base text-secondary">{label}</p>
      </div>
    </div>
  );
}
