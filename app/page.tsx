import { HomeSections } from "@/components/sections/home-sections";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/utils/metadata";

export const metadata = buildMetadata({
  title: "Ultra Frame",
  description: "World-class aluminum, steel, and glass execution with transparent project tracking.",
});

export default function HomePage() {
  return (
    <PageShell>
      <HomeSections />
    </PageShell>
  );
}


