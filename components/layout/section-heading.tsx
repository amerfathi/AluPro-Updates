import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl space-y-3", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">{title}</h2>
      {description ? <p className="text-base text-[var(--text-secondary)]">{description}</p> : null}
    </div>
  );
}


