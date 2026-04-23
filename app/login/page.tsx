import { LoginForm } from "@/components/forms/login-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function LoginPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-14">
      <SectionHeading
        title={isAr ? "تسجيل الدخول" : "Login"}
        description={isAr ? "ادخل إلى بوابة العميل أو مساحة العمل الداخلية." : "Access client portal or internal workspace."}
        className="mx-auto mb-6 text-center"
      />
      <LoginForm />
    </PageShell>
  );
}
