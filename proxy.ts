import { NextResponse, type NextRequest } from "next/server";

import { canAccessAdmin, canAccessPortal } from "@/lib/permissions/roles";
import { defaultLocale, isLocale, localeCookieName } from "@/lib/i18n/config";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const adminPath = "/admin";
const portalPath = "/portal";
const loginPath = "/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, response } = createMiddlewareClient(request);

  if (!request.cookies.get(localeCookieName)) {
    response.cookies.set(localeCookieName, defaultLocale, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  } else {
    const localeValue = request.cookies.get(localeCookieName)?.value;

    if (localeValue && !isLocale(localeValue)) {
      response.cookies.set(localeCookieName, defaultLocale, {
        path: "/",
        sameSite: "lax",
        httpOnly: false,
      });
    }
  }

  const isProtectedPortal = pathname === portalPath || pathname.startsWith(`${portalPath}/`);
  const isProtectedAdmin = pathname === adminPath || pathname.startsWith(`${adminPath}/`);

  if (!isProtectedPortal && !isProtectedAdmin) {
    return response;
  }

  if (!supabase) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = loginPath;
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = loginPath;
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const role = profile?.role;

  if (isProtectedPortal && !canAccessPortal(role)) {
    if (canAccessAdmin(role)) {
      return NextResponse.redirect(new URL(adminPath, request.url));
    }

    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (isProtectedAdmin && !canAccessAdmin(role)) {
    return NextResponse.redirect(new URL(portalPath, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

