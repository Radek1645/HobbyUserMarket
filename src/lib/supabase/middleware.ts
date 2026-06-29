import { isPlaceholderNickname } from "@/lib/auth/nickname";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/auth/", "/api/"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle<{ nickname: string }>();

    const needsOnboarding =
      !profile || isPlaceholderNickname(profile.nickname);

    if (needsOnboarding && !pathname.startsWith("/onboarding") && !isAuthPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      const returnPath = `${pathname}${request.nextUrl.search}`;
      if (returnPath !== "/") {
        url.searchParams.set("next", returnPath);
      }
      return NextResponse.redirect(url);
    }

    if (!needsOnboarding && pathname.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = needsOnboarding ? "/onboarding" : "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
