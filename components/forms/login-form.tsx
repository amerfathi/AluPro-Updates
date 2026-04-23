"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/layout/locale-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        throw new Error(isAr ? "إعداد Supabase غير مكتمل. أضف متغيرات البيئة أولًا." : "Supabase is not configured. Add environment variables first.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const nextPath = searchParams.get("next");
      let defaultPath = "/portal";

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (profile?.role === "admin" || profile?.role === "staff") {
          defaultPath = "/admin";
        } else if (profile?.role === "client") {
          defaultPath = "/portal";
        }
      }

      const targetPath = nextPath || defaultPath;
      router.push(targetPath);
      router.refresh();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{isAr ? "تسجيل دخول آمن" : "Secure Sign In"}</CardTitle>
        <CardDescription>{isAr ? "استخدم بيانات حساب Ultra Frame الخاصة بك." : "Use your Ultra Frame account credentials."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div>
            <Label htmlFor="password">{isAr ? "كلمة المرور" : "Password"}</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          ) : null}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? (isAr ? "جاري تسجيل الدخول..." : "Signing in...") : isAr ? "تسجيل الدخول" : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
