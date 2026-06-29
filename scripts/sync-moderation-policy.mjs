import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src/config/moderation/prohibited-topics.ts");
const target = join(
  root,
  "supabase/functions/_shared/moderation/prohibited-topics.ts",
);

copyFileSync(source, target);
console.log("Synced moderation policy:", target);
