import { resolvePostAuthNextPath } from "@/lib/auth/finish-auth-redirect";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth callback (`?code=`). E-mailové odkazy míří na `/auth/dokoncit`
 * (klient čte i `#access_token`). Když sem přijde e-mailový redirect bez code,
 * pošleme na dokoncit — prohlížeč obvykle zachová hash fragment.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  let next = sanitizeInternalPath(searchParams.get("next"));

  if (!code) {
    const dokoncit = new URL("/auth/dokoncit", origin);
    if (tokenHash) dokoncit.searchParams.set("token_hash", tokenHash);
    if (otpType) dokoncit.searchParams.set("type", otpType);
    if (next && next !== "/") dokoncit.searchParams.set("next", next);
    return NextResponse.redirect(dokoncit);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(mapAuthError(error.message))}`,
    );
  }

  next = await resolvePostAuthNextPath(supabase, next);

  return NextResponse.redirect(`${origin}${next}`);
}
