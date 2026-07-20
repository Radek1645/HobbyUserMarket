import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  join(root, "src/config/moderation/build-prompt.ts"),
  "utf8",
);

let edge = src
  .replaceAll(
    "@/config/moderation/prohibited-topics",
    "./prohibited-topics.ts",
  )
  .replaceAll(
    "@/config/moderation/description-length-prompt",
    "./description-length-prompt.ts",
  );

edge = edge.replace(
  /export type BuildModerationSystemPromptOptions = \{[\s\S]*?\};/,
  `export type BuildModerationSystemPromptOptions = {
  /**
   * Zkrácená pravidla bez explicitních \`criteria\` — Google Gemini jinak
   * často zablokuje celý vstup (promptFeedback PROHIBITED_CONTENT), i u
   * nevinných fotek (hrnek, kolo…). OpenAI fallback používá plný prompt.
   */
  geminiSafe?: boolean;
};`,
);

writeFileSync(
  join(root, "supabase/functions/_shared/moderation/build-prompt.ts"),
  edge,
  "utf8",
);
console.log("Synced Edge build-prompt.ts");
