import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** FB Page cover — 2× retina z doporučených 820×312 (safe zóna uprostřed). */
const WIDTH = 1640;
const HEIGHT = 624;

const EMERALD = "#059669";
const EMERALD_DARK = "#047857";
const EMERALD_DEEP = "#065f46";
const EMERALD_LIGHT = "#10b981";
const WHITE = "#ffffff";
const WHITE_SOFT = "rgba(255,255,255,0.88)";
const WHITE_MUTED = "rgba(255,255,255,0.72)";

/**
 * Banner se sloganem — claim ze homepage/bio, text ve středu kvůli mobilnímu ořezu.
 * Spodní levý roh nechává volný (překrytí profilovým obrázkem na desktopu).
 */
function facebookCoverSvg() {
  const cx = WIDTH / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${EMERALD_DEEP}"/>
      <stop offset="45%" stop-color="${EMERALD}"/>
      <stop offset="100%" stop-color="${EMERALD_LIGHT}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- jemné diagonální pruhy — atmosféra bez rušení textu -->
  <g opacity="0.12" fill="#ffffff">
    <polygon points="0,0 420,0 0,280"/>
    <polygon points="${WIDTH},0 ${WIDTH},200 ${WIDTH - 520},0"/>
    <polygon points="0,${HEIGHT} 380,${HEIGHT} 0,${HEIGHT - 240}"/>
    <polygon points="${WIDTH},${HEIGHT} ${WIDTH},${HEIGHT - 160} ${WIDTH - 280},${HEIGHT}"/>
  </g>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sheen)"/>

  <!-- středová safe zóna (~820×280 uvnitř) -->
  <g font-family="Segoe UI, Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="${cx}" y="198" fill="${WHITE_MUTED}" font-size="34" font-weight="600" letter-spacing="0.5">
      <tspan font-weight="300">za</tspan><tspan font-weight="800">Pikolou</tspan><tspan font-size="24" font-weight="600" dy="-6">.cz</tspan>
    </text>

    <text x="${cx}" y="300" fill="${WHITE}" font-size="58" font-weight="700" letter-spacing="-0.5">
      Fotka, pár slov, hotovo za 2 minuty.
    </text>

    <text x="${cx}" y="368" fill="${WHITE_SOFT}" font-size="28" font-weight="500">
      Online bazar s AI — inzerát pro lidi z vašeho okolí.
    </text>
  </g>

  <!-- tenká linka pod claimem -->
  <rect x="${cx - 48}" y="400" width="96" height="3" rx="1.5" fill="${WHITE}" opacity="0.45"/>
</svg>`;
}

const out = join(root, "public", "facebook-cover-1640x624.png");
const buf = await sharp(Buffer.from(facebookCoverSvg()))
  .resize(WIDTH, HEIGHT)
  .png()
  .toBuffer();

writeFileSync(out, buf);
const meta = await sharp(buf).metadata();
console.log("wrote", out, `${meta.width}x${meta.height}`, buf.length, "bytes");

/** Klasický desktop rozměr pro rychlý upload. */
const outClassic = join(root, "public", "facebook-cover-820x312.png");
const classic = await sharp(buf).resize(820, 312).png().toBuffer();
writeFileSync(outClassic, classic);
console.log(
  "wrote",
  outClassic,
  "820x312",
  classic.length,
  "bytes",
);
