import { cn } from "@/lib/utils";

interface KpiBlockProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  className?: string;
}

export function KpiBlock({ label, value, sub, color, className }: KpiBlockProps) {
  return (
    <div className={cn("border-default/50 rounded-md border bg-surface p-2", className)}>
      <p className="text-2xs text-tertiary">{label}</p>
      <p className={cn("text-base font-bold text-primary", color)}>{value}</p>
      {sub && <p className="mt-0.5 text-2xs text-tertiary">{sub}</p>}
    </div>
  );
}
