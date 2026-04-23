import { cn } from "@/lib/utils/cn";

export function Progress({ value, className }: { value: number; className?: string }) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]", className)}>
      <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all" style={{ width: `${safe}%` }} />
    </div>
  );
}


