"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, FolderOpen, ShieldCheck, User, Wrench } from "lucide-react";

import { useLocale } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/portal", key: "portal.title", icon: FolderOpen },
  { href: "/portal/projects", key: "portal.projects", icon: FolderOpen },
  { href: "/portal/documents", key: "portal.documents", icon: FileText },
  { href: "/portal/schedule", key: "portal.schedule", icon: Calendar },
  { href: "/portal/warranty", key: "portal.warranty", icon: ShieldCheck },
  { href: "/portal/maintenance", key: "portal.maintenance", icon: Wrench },
  { href: "/portal/profile", key: "portal.profile", icon: User },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <aside className="sticky top-24 hidden h-fit w-72 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-4 lg:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active ? "bg-[var(--brand-primary-muted)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


