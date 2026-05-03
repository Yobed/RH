import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Routage par rôle : un salarié n'a accès qu'au portail
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role ?? null;

    const isPortalArea =
      pathname.startsWith("/portail") || pathname.startsWith("/api/portail");

    if (role === "salarie") {
      if (!isPortalArea && !isPublic) {
        const url = request.nextUrl.clone();
        url.pathname = "/portail";
        return NextResponse.redirect(url);
      }
      if (pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/portail";
        return NextResponse.redirect(url);
      }
    } else {
      // Admin/DRH : pas d'accès au portail (réservé aux salariés)
      if (isPortalArea) {
        const url = request.nextUrl.clone();
        url.pathname = "/rh";
        return NextResponse.redirect(url);
      }
      if (pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/rh";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
