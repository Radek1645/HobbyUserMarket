import { isJunkProbePath } from "@/config/junk-probe-paths";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (isJunkProbePath(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
