"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const signOut = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={signOut} disabled={loading}>
      <LogOut className="me-2 h-4 w-4" />
      {loading ? (isAr ? "جاري تسجيل الخروج..." : "Signing out...") : isAr ? "تسجيل الخروج" : "Sign out"}
    </Button>
  );
}
