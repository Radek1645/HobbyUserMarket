type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export function resolveGeminiModerationModel(): string {
  return Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
}

export async function callGeminiModeration(params: {
  systemPrompt: string;
  userPrompt: string;
  imagesBase64: string[];
}): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const model = resolveGeminiModerationModel();
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: GeminiPart[] = [{ text: params.userPrompt }];
  for (const data of params.imagesBase64) {
    if (data) {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data,
        },
      });
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents: [{ role: "user", parts }],
      // Moderační workload: model MÁ posuzovat hraniční obsah, ne být jím
      // blokován. Vypíná jen konfigurovatelné kategorie; nevypnutelný filtr
      // Google (CSAM apod.) zůstává aktivní.
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gemini error:", response.status, detail);
    throw new Error(`GEMINI_HTTP_${response.status}`);
  }

  const payload = await response.json();

  // Text může být rozdělený do více parts (např. u „thinking“ modelů) —
  // spoj všechny textové části, ne jen parts[0].
  const candidate = payload?.candidates?.[0];
  const responseParts: unknown[] = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts
    : [];
  const text = responseParts
    .map((part) => {
      const p = part as { text?: unknown; thought?: unknown };
      // `thought: true` = interní uvažování modelu, není součást odpovědi.
      if (p?.thought === true) return "";
      return typeof p?.text === "string" ? p.text : "";
    })
    .join("");

  if (!text.trim()) {
    // Diagnostika: proč přišla prázdná odpověď (safety blok, MAX_TOKENS…).
    console.error(
      "Gemini empty response detail:",
      JSON.stringify({
        finishReason: candidate?.finishReason,
        safetyRatings: candidate?.safetyRatings,
        promptFeedback: payload?.promptFeedback,
        usageMetadata: payload?.usageMetadata,
      }),
    );

    // Vstup zablokoval nevypnutelný filtr Google (PROHIBITED_CONTENT apod.)
    // → obsahové zamítnutí, ne technická chyba.
    const blockReason = payload?.promptFeedback?.blockReason;
    if (typeof blockReason === "string" && blockReason) {
      throw new Error(`GEMINI_BLOCKED_${blockReason}`);
    }
    if (candidate?.finishReason === "SAFETY") {
      throw new Error("GEMINI_BLOCKED_SAFETY");
    }

    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  return text;
}
