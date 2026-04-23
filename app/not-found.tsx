import { PageShell } from "@/components/layout/page-shell";

export default function NotFound() {
  return (
    <PageShell className="py-20">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-[var(--text-secondary)]">The page you requested is unavailable.</p>
    </PageShell>
  );
}


