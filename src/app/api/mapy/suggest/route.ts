import { NextResponse } from "next/server";
import {
  MAPY_SERVICE_UNAVAILABLE_ERROR,
  MAPY_SUGGEST_MAX_QUERY_LENGTH,
  MAPY_SUGGEST_MIN_QUERY_LENGTH,
  MAPY_SUGGEST_RATE_ACTION,
} from "@/config/mapy";
import { isAbortError, MapyApiError } from "@/lib/mapy/errors";
import { assertMapyRateLimit } from "@/lib/mapy/rate-limit";
import { refererForMapyRequest, suggestPlaces } from "@/lib/mapy/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  const query =
    typeof (body as { query?: unknown })?.query === "string"
      ? (body as { query: string }).query.trim()
      : "";

  if (query.length < MAPY_SUGGEST_MIN_QUERY_LENGTH) {
    return NextResponse.json({ items: [] });
  }

  if (query.length > MAPY_SUGGEST_MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Dotaz je příliš dlouhý." }, { status: 400 });
  }

  const rateLimit = await assertMapyRateLimit(request, MAPY_SUGGEST_RATE_ACTION);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: rateLimit.status },
    );
  }

  try {
    const items = await suggestPlaces(query, {
      signal: request.signal,
      referer: refererForMapyRequest(request),
    });
    return NextResponse.json({ items });
  } catch (err) {
    if (request.signal.aborted || isAbortError(err)) {
      return new NextResponse(null, { status: 499 });
    }
    if (err instanceof MapyApiError) {
      const status = err.code === "missing_key" ? 503 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("mapy suggest:", err);
    return NextResponse.json(
      { error: MAPY_SERVICE_UNAVAILABLE_ERROR },
      { status: 503 },
    );
  }
}
