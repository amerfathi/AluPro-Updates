import { DashboardMain } from "@/components/layout/dashboard-main";
import { PageShell } from "@/components/layout/page-shell";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-10">
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-4">
        <h1 className="text-xl font-semibold">{isAr ? "بوابة Ultra-Track" : "Ultra-Track Portal"}</h1>
        <SignOutButton />
      </div>
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <PortalSidebar />
        <DashboardMain>{children}</DashboardMain>
      </div>
    </PageShell>
  );
}
