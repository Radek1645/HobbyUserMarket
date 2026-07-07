type OpenAiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export function resolveOpenAiModerationModel(): string {
  return Deno.env.get("OPENAI_MODERATION_MODEL") ?? "gpt-4o-mini";
}

export async function callOpenAiModeration(params: {
  systemPrompt: string;
  userPrompt: string;
  imagesBase64: string[];
}): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const model = resolveOpenAiModerationModel();

  const userContent: OpenAiContentPart[] = [{ type: "text", text: params.userPrompt }];
  for (const data of params.imagesBase64) {
    if (data) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${data}` },
      });
    }
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("OpenAI error:", response.status, detail);
    throw new Error(`OPENAI_HTTP_${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("OPENAI_EMPTY_RESPONSE");
  }

  return text;
}
