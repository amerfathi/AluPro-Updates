import React from "react";

import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const color = {
    default: "bg-[var(--surface-soft)] text-[var(--text-secondary)]",
    success: "bg-[color-mix(in_oklab,var(--success)_22%,black)] text-[var(--success)]",
    warning: "bg-[color-mix(in_oklab,var(--warning)_22%,black)] text-[var(--warning)]",
    danger: "bg-[color-mix(in_oklab,var(--danger)_22%,black)] text-[var(--danger)]",
  }[variant];

  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", color, className)}>{children}</span>;
}


