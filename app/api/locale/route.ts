import { NextResponse } from "next/server";

import { defaultLocale, isLocale, localeCookieName } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = body.locale;

  const response = NextResponse.json({ ok: true, locale: isLocale(locale ?? "") ? locale : defaultLocale });

  response.cookies.set(localeCookieName, isLocale(locale ?? "") ? locale! : defaultLocale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}


