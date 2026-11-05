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
    <div className={cn("p-2 rounded-md bg-surface border border-default/50", className)}>
      <p className="text-[10px] text-tertiary">{label}</p>
      <p className={cn("text-base font-bold text-primary", color)}>{value}</p>
      {sub && <p className="text-[10px] text-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}
