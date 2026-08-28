import { NextResponse } from "next/server";
import {
  MAPY_RGEOCODE_RATE_ACTION,
  MAPY_SERVICE_UNAVAILABLE_ERROR,
} from "@/config/mapy";
import { isAbortError, MapyApiError } from "@/lib/mapy/errors";
import { assertMapyRateLimit } from "@/lib/mapy/rate-limit";
import { refererForMapyRequest, reverseGeocodeLocation } from "@/lib/mapy/server";

export const dynamic = "force-dynamic";

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  const payload = body as {
    latitude?: unknown;
    longitude?: unknown;
    approximate?: unknown;
  };
  const latitude = parseCoordinate(payload.latitude);
  const longitude = parseCoordinate(payload.longitude);

  if (
    latitude == null ||
    longitude == null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: "Neplatné souřadnice." }, { status: 400 });
  }

  const rateLimit = await assertMapyRateLimit(request, MAPY_RGEOCODE_RATE_ACTION);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: rateLimit.status },
    );
  }

  try {
    const selection = await reverseGeocodeLocation(latitude, longitude, {
      signal: request.signal,
      referer: refererForMapyRequest(request),
      approximate: payload.approximate === true,
    });
    return NextResponse.json(selection);
  } catch (err) {
    if (request.signal.aborted || isAbortError(err)) {
      return new NextResponse(null, { status: 499 });
    }
    if (err instanceof MapyApiError) {
      if (err.code === "empty") {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      const status = err.code === "missing_key" ? 503 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("mapy rgeocode:", err);
    return NextResponse.json(
      { error: MAPY_SERVICE_UNAVAILABLE_ERROR },
      { status: 503 },
    );
  }
}
