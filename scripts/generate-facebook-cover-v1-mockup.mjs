import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** FB Page cover 2× (820×312). */
const WIDTH = 1640;
const HEIGHT = 624;

/**
 * Vertikální safe band — FB mobil ořezává shora/zdola.
 * Logo + slogan držíme dál od hran než claude/gemini drafty.
 */
const SAFE_TOP = 100;
const SAFE_BOTTOM = 88;

const EMERALD = "#059669";
const EMERALD_DARK = "#047857";
const EMERALD_DEEP = "#065f46";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function prepareProductTiles() {
  const routerPath = join(root, "public", "images", "guide", "demo-router.png");
  const labelPath = join(
    root,
    "public",
    "images",
    "guide",
    "demo-router-stittek.png",
  );

  const main = await sharp(routerPath)
    .resize(240, 160, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const label = await sharp(labelPath)
    .resize(120, 80, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const feed = await sharp(routerPath)
    .resize(220, 120, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  return {
    mainHref: `data:image/png;base64,${main.toString("base64")}`,
    labelHref: `data:image/png;base64,${label.toString("base64")}`,
    feedHref: `data:image/png;base64,${feed.toString("base64")}`,
  };
}

/** Draft telefon — obsah z /jak-vytvorit-inzerat, kompaktní kvůli safe zóně. */
function draftPhoneSvg({ mainHref, labelHref, x, y, w, h }) {
  const btnY = h - 46;
  return `
  <g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" rx="28" fill="#111827"/>
    <rect x="7" y="7" width="${w - 14}" height="${h - 14}" rx="22" fill="#fafafa"/>
    <rect x="${(w - 64) / 2}" y="12" width="64" height="7" rx="3.5" fill="#111827"/>

    <text x="16" y="38" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="#9ca3af">9:41</text>
    <text x="${w / 2}" y="38" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="700" fill="${EMERALD}">zaPikolou</text>
    <text x="${w / 2}" y="58" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#111827">Nový inzerát</text>

    <rect x="14" y="68" width="${w - 28}" height="22" rx="11" fill="#ecfdf5" stroke="#a7f3d0"/>
    <text x="${w / 2}" y="83" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="#065f46">Zboží · Elektronika</text>

    <text x="16" y="108" font-family="Segoe UI, Arial, sans-serif" font-size="9" font-weight="700" fill="#111827">Název</text>
    <rect x="14" y="112" width="${w - 28}" height="26" rx="7" fill="#ffffff" stroke="#d4d4d4"/>
    <text x="22" y="129" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#111827">${escapeXml("Prodám Wi‑Fi router")}</text>

    <text x="16" y="156" font-family="Segoe UI, Arial, sans-serif" font-size="9" font-weight="700" fill="#111827">Popis</text>
    <rect x="14" y="160" width="${w - 28}" height="26" rx="7" fill="#ffffff" stroke="#d4d4d4"/>
    <text x="22" y="177" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#111827">Starý router, funguje</text>

    <image href="${mainHref}" x="14" y="196" width="108" height="72" preserveAspectRatio="xMidYMid slice"/>
    <rect x="14" y="196" width="108" height="72" rx="7" fill="none" stroke="#e5e7eb"/>
    <rect x="18" y="200" width="34" height="12" rx="3" fill="rgba(17,24,39,0.75)"/>
    <text x="22" y="209" font-family="Segoe UI, Arial, sans-serif" font-size="8" fill="#ffffff">Hlavní</text>

    <image href="${labelHref}" x="${w - 122}" y="196" width="108" height="72" preserveAspectRatio="xMidYMid slice"/>
    <rect x="${w - 122}" y="196" width="108" height="72" rx="7" fill="none" stroke="#e5e7eb"/>
    <rect x="${w - 118}" y="200" width="36" height="12" rx="3" fill="${EMERALD_DARK}"/>
    <text x="${w - 113}" y="209" font-family="Segoe UI, Arial, sans-serif" font-size="8" fill="#ffffff">Štítek</text>

    <rect x="14" y="278" width="${w - 28}" height="24" rx="7" fill="#ffffff" stroke="#e5e7eb"/>
    <text x="22" y="294" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="#6b7280">Cena</text>
    <text x="${w - 22}" y="294" text-anchor="end" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#111827">890 Kč</text>

    <rect x="14" y="${btnY}" width="${w - 28}" height="30" rx="9" fill="${EMERALD}"/>
    <text x="${w / 2}" y="${btnY + 20}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Publikovat</text>
  </g>`;
}

function aiPhoneSvg({ feedHref, x, y, w, h }) {
  const btnY = h - 46;
  return `
  <g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" rx="28" fill="#111827"/>
    <rect x="7" y="7" width="${w - 14}" height="${h - 14}" rx="22" fill="#f3f4f6"/>
    <rect x="${(w - 64) / 2}" y="12" width="64" height="7" rx="3.5" fill="#111827"/>

    <text x="16" y="38" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="#9ca3af">9:41</text>
    <text x="${w / 2}" y="38" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="700" fill="${EMERALD}">zaPikolou</text>

    <rect x="12" y="48" width="${w - 24}" height="${h - 62}" rx="12" fill="#ffffff" stroke="#e5e7eb"/>

    <text x="22" y="70" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="${EMERALD_DARK}">✦ AI vám vylepšila inzerát!</text>
    <text x="22" y="86" font-family="Segoe UI, Arial, sans-serif" font-size="8" fill="#6b7280">Zkontrolujte prosím text.</text>

    <image href="${feedHref}" x="22" y="96" width="${w - 44}" height="88" preserveAspectRatio="xMidYMid slice"/>
    <rect x="22" y="96" width="${w - 44}" height="88" rx="7" fill="none" stroke="#e5e7eb"/>

    <text x="22" y="204" font-family="Segoe UI, Arial, sans-serif" font-size="9" font-weight="700" fill="#111827">Název</text>
    <rect x="22" y="208" width="${w - 44}" height="26" rx="7" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="30" y="225" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="600" fill="#111827">${escapeXml("Wi‑Fi 6 router NL-AX3000")}</text>

    <text x="22" y="252" font-family="Segoe UI, Arial, sans-serif" font-size="9" font-weight="700" fill="#111827">Popis</text>
    <rect x="22" y="256" width="${w - 44}" height="48" rx="7" fill="#f9fafb" stroke="#e5e7eb"/>
    <text x="30" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="#374151">• Model: NL-AX3000</text>
    <text x="30" y="286" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="#374151">${escapeXml("• Wi‑Fi 6, dual-band")}</text>
    <text x="30" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="#374151">${escapeXml("• 4× Gigabit LAN")}</text>

    <rect x="22" y="${btnY}" width="${w - 44}" height="30" rx="9" fill="${EMERALD}"/>
    <text x="${w / 2}" y="${btnY + 20}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#ffffff">Publikovat inzerát</text>
  </g>`;
}

function coverSvg(tiles) {
  const cx = WIDTH / 2;
  const phoneW = 248;
  const phoneH = 340;
  const gap = 92;
  const leftX = cx - gap / 2 - phoneW;
  const rightX = cx + gap / 2;
  const brandY = SAFE_TOP + 4;
  const phoneY = SAFE_TOP + 28;
  const arrowCy = phoneY + phoneH / 2;
  const pillY = HEIGHT - SAFE_BOTTOM - 36;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="50%" stop-color="#f4f4f5"/>
      <stop offset="100%" stop-color="#d1fae5"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <g opacity="0.12" fill="${EMERALD_DEEP}">
    <rect x="48" y="100" width="110" height="110" rx="8" transform="rotate(45 103 155)"/>
    <rect x="30" y="300" width="80" height="80" rx="6" transform="rotate(45 70 340)"/>
    <rect x="90" y="450" width="60" height="60" rx="6" transform="rotate(45 120 480)"/>
    <rect x="${WIDTH - 158}" y="100" width="110" height="110" rx="8" transform="rotate(45 ${WIDTH - 103} 155)"/>
    <rect x="${WIDTH - 110}" y="300" width="80" height="80" rx="6" transform="rotate(45 ${WIDTH - 70} 340)"/>
    <rect x="${WIDTH - 150}" y="450" width="60" height="60" rx="6" transform="rotate(45 ${WIDTH - 120} 480)"/>
  </g>

  <text x="${cx}" y="${brandY}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="${EMERALD_DARK}">
    <tspan font-weight="300">za</tspan><tspan font-weight="800">Pikolou</tspan><tspan font-size="15" font-weight="600" dy="-4">.cz</tspan>
  </text>

  ${draftPhoneSvg({ ...tiles, x: leftX, y: phoneY, w: phoneW, h: phoneH })}
  ${aiPhoneSvg({ ...tiles, x: rightX, y: phoneY, w: phoneW, h: phoneH })}

  <circle cx="${cx}" cy="${arrowCy}" r="24" fill="${EMERALD}"/>
  <path d="M${cx - 10} ${arrowCy} H${cx + 4} M${cx} ${arrowCy - 7} L${cx + 12} ${arrowCy} L${cx} ${arrowCy + 7}" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

  <rect x="${cx - 290}" y="${pillY}" width="580" height="36" rx="18" fill="${EMERALD_DEEP}"/>
  <text x="${cx}" y="${pillY + 24}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">
    Fotka + pár slov → inzerát za 2 minuty
  </text>
</svg>`;
}

const tiles = await prepareProductTiles();
const svg = coverSvg(tiles);
const outHi = join(root, "public", "facebook-cover-v1-mockup-1640x624.png");
const buf = await sharp(Buffer.from(svg)).resize(WIDTH, HEIGHT).png().toBuffer();
writeFileSync(outHi, buf);

const outClassic = join(root, "public", "facebook-cover-v1-mockup-820x312.png");
writeFileSync(outClassic, await sharp(buf).resize(820, 312).png().toBuffer());

const brandY = SAFE_TOP + 4;
const phoneY = SAFE_TOP + 28;
const phoneH = 340;
const pillY = HEIGHT - SAFE_BOTTOM - 36;
console.log("wrote", outHi);
console.log(
  `layout: brand~${brandY}px, phones ${phoneY}-${phoneY + phoneH}, pill ${pillY}-${pillY + 36}, margins top/bottom ${SAFE_TOP}/${SAFE_BOTTOM}`,
);
console.log("wrote", outClassic);
