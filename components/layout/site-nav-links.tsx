"use client";

import Link from "next/link";

import { useLocale } from "@/components/layout/locale-provider";

const links = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "portfolio", href: "/portfolio" },
  { key: "technicalLibrary", href: "/technical-library" },
  { key: "quote", href: "/quote-request" },
  { key: "contact", href: "/contact" },
];

export function SiteNavLinks() {
  const { t } = useLocale();

  return (
    <nav className="hidden items-center gap-5 lg:flex">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
          {t(`nav.${link.key}`)}
        </Link>
      ))}
    </nav>
  );
}


