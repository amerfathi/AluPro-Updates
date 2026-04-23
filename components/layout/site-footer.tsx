import Link from "next/link";

import { getCurrentLocale } from "@/lib/i18n/locale";
import { getSiteContactSettings } from "@/lib/services/platform-data";

export async function SiteFooter() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";
  const contact = await getSiteContactSettings();

  return (
    <footer className="mt-16 border-t border-[var(--border-soft)] bg-[var(--surface-soft)]/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{isAr ? "ألترا فريم" : "Ultra Frame"}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {isAr
              ? "تنفيذ معدني احترافي بمعايير هندسية دقيقة"
              : "Professional metal execution with engineering-grade control"}
          </p>
        </div>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <h4 className="font-semibold text-[var(--text-primary)]">{isAr ? "معلومات التواصل" : "Contact Info"}</h4>
          <p>{isAr ? contact.addressAr : contact.addressEn}</p>
          <p>{contact.phone}</p>
          <p>{contact.email}</p>
        </div>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <h4 className="font-semibold text-[var(--text-primary)]">{isAr ? "روابط سريعة" : "Quick Links"}</h4>
          <Link href="/services" className="block hover:text-[var(--text-primary)]">
            {isAr ? "الخدمات" : "Services"}
          </Link>
          <Link href="/portfolio" className="block hover:text-[var(--text-primary)]">
            {isAr ? "المشاريع" : "Portfolio"}
          </Link>
          <Link href="/quote-request" className="block hover:text-[var(--text-primary)]">
            {isAr ? "طلب عرض سعر" : "Quote Request"}
          </Link>
        </div>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <h4 className="font-semibold text-[var(--text-primary)]">{isAr ? "المنصات" : "Platforms"}</h4>
          <Link href="/portal" className="block hover:text-[var(--text-primary)]">
            {isAr ? "بوابة العميل" : "Client Portal"}
          </Link>
          <Link href="/admin" className="block hover:text-[var(--text-primary)]">
            {isAr ? "لوحة الإدارة" : "Admin Dashboard"}
          </Link>
          <Link href="/maintenance-request" className="block hover:text-[var(--text-primary)]">
            {isAr ? "طلب صيانة" : "Maintenance Request"}
          </Link>
        </div>
      </div>
      <div className="border-t border-[var(--border-soft)] py-4 text-center text-xs text-[var(--text-muted)]">
        {new Date().getFullYear()} - {isAr ? "جميع الحقوق محفوظة لشركة Ultra Frame" : "All rights reserved to Ultra Frame"}
      </div>
    </footer>
  );
}
