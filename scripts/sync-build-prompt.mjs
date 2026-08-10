import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  join(root, "src/config/moderation/build-prompt.ts"),
  "utf8",
);

let edge = src
  .replace(
    /^import \{ formatTaxonomyCatalogForPrompt \} from "@\/config\/categories";\r?\n/m,
    "",
  )
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

const edgeHeader = `import { PROHIBITED_TOPICS } from "./prohibited-topics.ts";
import { buildDescriptionLengthPromptRules } from "./description-length-prompt.ts";
import {
  VALID_CATEGORY_TYPES,
  VALID_SUBCATEGORY_SLUGS,
} from "./category-prompts.ts";

export type BuildModerationSystemPromptOptions = {
  /**
   * Zkrácená pravidla bez explicitních \`criteria\` — Google Gemini jinak
   * často zablokuje celý vstup (promptFeedback PROHIBITED_CONTENT), i u
   * nevinných fotek (hrnek, kolo…). OpenAI fallback používá plný prompt.
   */
  geminiSafe?: boolean;
};

function formatTaxonomyCatalogForPrompt(): string {
  return VALID_CATEGORY_TYPES.map((type) => {
    const slugs = VALID_SUBCATEGORY_SLUGS[type]?.join(", ") ?? "";
    return \`\${type}: \${slugs}\`;
  }).join("\\n");
}
`;

// Drop rewritten imports + options type — replace with Deno-compatible header.
edge = edge.replace(
  /^import \{ PROHIBITED_TOPICS \} from "\.\/prohibited-topics\.ts";\r?\nimport \{ buildDescriptionLengthPromptRules \} from "\.\/description-length-prompt\.ts";\r?\n\r?\nexport type BuildModerationSystemPromptOptions = \{[\s\S]*?\};\r?\n\r?\n/,
  edgeHeader + "\n",
);

if (edge.includes("@/")) {
  throw new Error(
    "sync-build-prompt: Edge build-prompt still contains @/ imports — update the sync script.",
  );
}

writeFileSync(
  join(root, "supabase/functions/_shared/moderation/build-prompt.ts"),
  edge,
  "utf8",
);
console.log("Synced Edge build-prompt.ts");
