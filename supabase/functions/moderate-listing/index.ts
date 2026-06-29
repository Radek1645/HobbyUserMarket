/**
 * Edge Function: AI moderace inzerátu (PRD §5.4).
 *
 * Deploy: supabase functions deploy moderate-listing
 * Secrets: GEMINI_API_KEY, volitelně OPENAI_API_KEY
 *
 * Seznam zakázaného: src/config/moderation/prohibited-topics.ts
 * (sync: npm run sync:moderation)
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { buildModerationSystemPrompt } from "../_shared/moderation/build-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Připraveno pro Gemini — prompt se generuje ze sdíleného seznamu pravidel. */
const _moderationSystemPrompt = buildModerationSystemPrompt();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();

    if (!title || !description) {
      return new Response(
        JSON.stringify({
          status: "REJECTED",
          reason: "Chybí název nebo popis inzerátu.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // TODO: rate limit, volání AI s _moderationSystemPrompt
    void _moderationSystemPrompt;

    return new Response(
      JSON.stringify({
        status: "APPROVED",
        cleanedTitle: title,
        cleanedDescription: description,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({
        status: "REJECTED",
        reason: "Neplatný požadavek na moderaci.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
