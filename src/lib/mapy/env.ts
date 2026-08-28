/**
 * Server-only. Nesmí se importovat z `"use client"` modulů —
 * jinak by se klíč dostal do JS bundlu prohlížeče.
 */
export function getMapyApiKey(): string | undefined {
  return process.env.MAPY_CZ_API_KEY?.trim() || undefined;
}
