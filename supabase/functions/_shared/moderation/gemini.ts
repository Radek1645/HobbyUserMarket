type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export async function callGeminiModeration(params: {
  systemPrompt: string;
  userPrompt: string;
  imagesBase64: string[];
}): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
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

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  return text;
}
