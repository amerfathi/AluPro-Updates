"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, FileText, FolderCog, Settings, SquareStack, Users, Wrench } from "lucide-react";

import { useLocale } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/admin", key: "admin.title", icon: BarChart3 },
  { href: "/admin/leads", key: "admin.leads", icon: Users },
  { href: "/admin/quotes", key: "admin.quotes", icon: FileText },
  { href: "/admin/projects", key: "admin.projects", icon: Briefcase },
  { href: "/admin/clients", key: "admin.clients", icon: Users },
  { href: "/admin/portfolio", key: "admin.portfolio", icon: SquareStack },
  { href: "/admin/technical-library", key: "admin.technicalLibrary", icon: FolderCog },
  { href: "/admin/maintenance", key: "admin.maintenance", icon: Wrench },
  { href: "/admin/estimator", key: "admin.estimator", icon: BarChart3 },
  { href: "/admin/settings", key: "admin.settings", icon: Settings },
];

export function AdminSidebar() {
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


