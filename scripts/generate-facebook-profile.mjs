import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const emerald = "#059669";

/** Stejný zP monogram jako web favicon — plný čtverec (FB ořízne do kruhu). */
function facebookProfileSvg() {
  const zPath =
    "M14 28 H44 V40 H32 L44 58 V72 H14 V60 H26 L14 40 Z";
  const pPath =
    "M46 18 H72 C86 18 94 28 94 42 C94 56 86 66 72 66 H60 V82 H46 Z M60 34 V50 H70 C76 50 80 46 80 42 C80 38 76 34 70 34 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${emerald}"/>
  <path d="${zPath}" fill="#ffffff"/>
  <path d="${pPath}" fill="#ffffff"/>
</svg>`;
}

const out = join(root, "public", "facebook-profile-170.png");
const buf = await sharp(Buffer.from(facebookProfileSvg()))
  .resize(170, 170)
  .ensureAlpha()
  .png()
  .toBuffer();

writeFileSync(out, buf);
const meta = await sharp(buf).metadata();
console.log("wrote", out, `${meta.width}x${meta.height}`, buf.length, "bytes");
