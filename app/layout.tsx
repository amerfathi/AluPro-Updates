import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";

import { LocaleProvider } from "@/components/layout/locale-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getCurrentLocale } from "@/lib/i18n/locale";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Ultra Frame",
    template: "%s | Ultra Frame",
  },
  description: "Premium aluminum, steel, and glass works with transparent project tracking.",
  openGraph: {
    title: "Ultra Frame",
    description: "Engineering-grade metal industries platform.",
    siteName: "Ultra Frame",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction} className={`${cairo.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased">
        <LocaleProvider locale={locale} dictionary={dictionary}>
          <div className="relative min-h-screen overflow-x-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(11,102,255,0.14),transparent_35%),radial-gradient(circle_at_85%_18%,rgba(148,163,184,0.15),transparent_40%),linear-gradient(180deg,#070b13_0%,#090f1b_52%,#0b101b_100%)]" />
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}


