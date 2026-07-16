import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const emerald = "#059669";

/** Geometric bold P — readable at 16px, no system fonts. */
function faviconSvg(size, radiusRatio = 0.2) {
  const r = Math.round(size * radiusRatio);
  const scale = size / 100;
  const pPath =
    "M28 18 H58 C72 18 82 28 82 42 C82 56 72 66 58 66 H44 V82 H28 Z M44 34 V50 H56 C62 50 66 46 66 42 C66 38 62 34 56 34 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${emerald}"/>
  <g transform="scale(${scale})">
    <path d="${pPath}" fill="#ffffff"/>
  </g>
</svg>`;
}

function pngToIco(pngBuf) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(48, 0);
  entry.writeUInt8(48, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuf]);
}

async function writePng(path, size) {
  const buf = await sharp(Buffer.from(faviconSvg(size))).png().toBuffer();
  writeFileSync(path, buf);
  console.log("wrote", path, buf.length, "bytes");
}

const publicDir = join(root, "public");
await writePng(join(publicDir, "icon.png"), 512);
await writePng(join(publicDir, "apple-icon.png"), 180);

const png48 = await sharp(Buffer.from(faviconSvg(48, 0.18))).png().toBuffer();
writeFileSync(join(publicDir, "favicon-48.png"), png48);
writeFileSync(join(publicDir, "favicon.ico"), pngToIco(png48));
console.log("wrote public/favicon.ico");
