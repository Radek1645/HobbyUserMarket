import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const emerald = "#059669";

/**
 * Geometric bold zP — readable at 16px, no system fonts.
 * ViewBox 100×100; white glyphs on emerald badge.
 */
function faviconSvg({ rounded = true } = {}) {
  const rx = rounded ? 20 : 0;
  // Bold z (left, slightly smaller) + dominant P (right), optically centered.
  const zPath =
    "M14 28 H44 V40 H32 L44 58 V72 H14 V60 H26 L14 40 Z";
  const pPath =
    "M46 18 H72 C86 18 94 28 94 42 C94 56 86 66 72 66 H60 V82 H46 Z M60 34 V50 H70 C76 50 80 46 80 42 C80 38 76 34 70 34 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${rx}" ry="${rx}" fill="${emerald}"/>
  <path d="${zPath}" fill="#ffffff"/>
  <path d="${pPath}" fill="#ffffff"/>
</svg>`;
}

function pngToIco(pngBuf, size = 48) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuf]);
}

async function renderPng(size, { rounded = true } = {}) {
  // Render from viewBox SVG, then resize so output matches exact pixel size.
  return sharp(Buffer.from(faviconSvg({ rounded })))
    .resize(size, size)
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function writePng(path, size, options) {
  const buf = await renderPng(size, options);
  writeFileSync(path, buf);
  console.log("wrote", path, buf.length, "bytes");
  return buf;
}

const publicDir = join(root, "public");

await writePng(join(publicDir, "icon.png"), 512, { rounded: true });
await writePng(join(publicDir, "apple-icon.png"), 180, { rounded: false });
// Google OAuth consent screen — square 120×120, opaque (no transparent corners).
await writePng(join(publicDir, "google-auth-logo-120.png"), 120, {
  rounded: false,
});
await writePng(join(publicDir, "favicon-96.png"), 96, { rounded: true });
// Conventional fallback path some crawlers/browsers request (not just /favicon.ico).
await writePng(join(publicDir, "favicon.png"), 48, { rounded: true });

const png48 = await writePng(join(publicDir, "favicon-48.png"), 48, {
  rounded: true,
});
writeFileSync(join(publicDir, "favicon.ico"), pngToIco(png48, 48));
console.log("wrote public/favicon.ico");
