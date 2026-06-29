import { createClient } from "@/lib/supabase/server";
import { isPlaceholderNickname } from "@/lib/auth/nickname";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Chybí autorizační kód.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle<{ nickname: string }>();

    const needsOnboarding =
      !profile || isPlaceholderNickname(profile.nickname);

    if (needsOnboarding && !next.startsWith("/onboarding") && !next.startsWith("/auth/nastavit-heslo")) {
      next = "/onboarding";
    }
  }

  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
