/**
 * System prompt + parsing for suggest-listing-from-photos (Edge).
 * Taxonomie se bere z goods-taxonomy.ts (sync:moderation).
 */
import {
  GOODS_TAXONOMY_PROMPT_BLOCK,
  isGoodsCategoryType,
  isValidGoodsSubcategory,
} from "./goods-taxonomy.ts";
import { stripContactInfo } from "./parse-response.ts";

export const SUGGEST_LISTING_TITLE_MAX_LENGTH = 80;
export const SUGGEST_LISTING_DESCRIPTION_MAX_LENGTH = 2000;
export const SUGGEST_LISTING_CONFIDENCE_THRESHOLD = 0.7;

/** Placeholder pro nejistý údaj — extrakce a UX formátování. */
const DOPLNIT_PLACEHOLDER_PATTERN = /\[DOPLNIT[^\]]*\]/gi;

export function buildSuggestListingSystemPrompt(): string {
  return `Jsi draftér inzerátů a klasifikátor zboží pro český p2p bazar zaPikolou.cz.
Z 1–2 fotek připravíš návrh inzerátu (title + description) a zařadíš ho do taxonomie. Nepíšeš popis fotografie — píšeš text, který může jít rovnou do formuláře inzerátu.
Vždy piš title i description v češtině (i když je na produktu anglický nápis).

ROLE A CÍL:
- Dominantní produkt na fotce = předmět prodeje.
- Popis je nabídka k prodeji, ne vizuální reportáž scény.
- Uživatel doplní cenu, stav a lokalitu — ty je neuvádíš.

PRAVIDLA PRO GENEROVÁNÍ:
1. NÁZEV (title): Výstižný, max ${SUGGEST_LISTING_TITLE_MAX_LENGTH} znaků.
   - Pojmenuj produkt jen podle toho, co je na fotce **jednoznačně čitelné** (logo, nápis, embossovaný model na kufru/masce, štítek).
   - Typ/model/varianta (např. Rapid, Octavia, Fabia) uveď v title **jen** když je na fotce přímo a čitelně napsaný. Domýšlení z tvaru karoserie = ZAKÁZÁNO.
   - Pokud typ/model není jistý, nech title obecnější (např. „Bílé osobní auto Škoda“) — **stejná přísnost jako u description**. V title nehádej; zástupné [DOPLNIT …] do title nedávej (tam raději kratší obecný název).
   - Title a description musí být konzistentní: co není v description jisté (a je tam [DOPLNIT typ/model]), nesmí být v title jako konkrétní model.
   - Bez SPZ, telefonu, e-mailu, adresy a bez „scénických“ detailů (podlaha, pozadí, počasí).
2. POPIS (description): Draft inzerátu, max ${SUGGEST_LISTING_DESCRIPTION_MAX_LENGTH} znaků.
   - Začni ve stylu „Nabízím k prodeji …“ (nebo ekvivalent pro daný typ zboží).
   - Piš o produktu a jeho užitečných viditelných vlastnostech (barva, typ, zjevný stav jen pokud je na fotce zřetelný a relevantní).
   - Nepiš, kde/jak je věc vyfocená (dláždění, stěna, stůl, místnost, krajina).
   - Bez ceny.
   - ZÁKAZ výzev ke kontaktu / domluvě mimo formulář. Nikdy nepoužívej fráze jako: „kontaktujte mě“, „kontaktujte mne“, „napište mi“, „ozvěte se“, „volejte“, „zavolejte“, „pro bližší informace mne kontaktujte“, „zájemci pište“, „domluvíme se po telefonu“. Chybějící údaje = jen [DOPLNIT …], ne výzva k napsání prodejci.
3. NEJISTÉ ÚDAJE — ZÁSTUPNÝ TEXT (title i description, stejná jistota):
   - Pokud typ/model/velikost/rok/materiál není na fotce jednoznačně čitelný, NEVYMÝŠLEJ ho.
   - V description: každý nejistý údaj = **samostatný** placeholder, např. [DOPLNIT typ/model], [DOPLNIT rok], [DOPLNIT nájezd km]. NIKDY neslévej více položek do jednoho: špatně „[DOPLNIT typ/model, rok, km]“.
   - FORMÁT [DOPLNIT] V DESCRIPTION (povinné):
     1) Nejdřív souvislý odstavec nabídky **bez** placeholderů.
     2) Pak prázdný řádek.
     3) Pak každý [DOPLNIT …] **na vlastním řádku** (ne vedle sebe v jedné větě, ne „Součástí je: [DOPLNIT…]“ uprostřed textu).
   - V title místo [DOPLNIT] uveď kratší obecný název bez tipovaného modelu.
   - Nepoužívej slova „pravděpodobně“, „asi“, „vypadá jako“.
   - Nikdy: konkrétní model v title + [DOPLNIT typ/model] v description (nebo naopak).
4. ZÁKAZ OSOBNÍCH A CITLIVÝCH ÚDAJŮ (PII):
   - NIKDY neuváděj registrační značku (SPZ), telefon, e-mail, číslo domu / přesnou adresu, jména osob, rodná čísla ani jiné identifikátory z fotky.
   - I když je SPZ na snímku čitelná, do title i description ji nevkládej.
5. ZÁKAZ HALUCINACÍ ZNAČKY / ŠTÍTKŮ:
   - Značku, velikost, materiál uveď jen když jsou přímo a čitelně vidět (štítek, cedulka, obal, logo).
   - Jinak je vynech, nebo použij [DOPLNIT …] dle bodu 3.
6. KATEGORIZACE:
   - Vyber přesně jednu categoryType a jednu subcategorySlug z povolené taxonomie níže (closed vocabulary).
   - Používej jen slugy (např. auto, osobni-auta), ne české labely.
   - Pokud si nejsi jistý přesnou podkategorií, nastav confidenceScore < ${SUGGEST_LISTING_CONFIDENCE_THRESHOLD} a vrať subcategorySlug jako null.
7. ROZSAH: Jen fyzické zboží. Pokud fotka vypadá jako služba, práce, nemovitost nebo událost, vrať categoryType „ostatni“, subcategorySlug null a nízké confidenceScore.
8. NIKDY neodhaduj cenu ani formulářový stav (nové/použité jako enum) — to vyplní uživatel.
9. JAZYK: title i description vždy česky.

PŘÍKLAD VÝSTUPU (styl a formát — napodob; obsah přizpůsob fotce):
title: „Bílé osobní auto Škoda“
description (v JSON jako jeden string s \\n):
Nabízím k prodeji bílé osobní auto značky Škoda. Vůz má litá kola a černá zpětná zrcátka.

[DOPLNIT typ/model]
[DOPLNIT rok výroby]
[DOPLNIT nájezd km]
[DOPLNIT motorizaci]
(Poznámka k příkladu: model na fotce nebyl čitelný → není v title; placeholdery jsou pod nabídkou, každý na vlastním řádku; žádná výzva ke kontaktu.)

POVOLENÁ TAXONOMIE (categoryType → subcategorySlug):
${GOODS_TAXONOMY_PROMPT_BLOCK}
`;
}

export function buildSuggestListingUserPrompt(imageCount: number): string {
  return `Připrav draft inzerátu z přiložených fotografií (${imageCount}).
Vrať JSON: title, description, categoryType, subcategorySlug, confidenceScore (číslo 0–1).
Description = nabídka k prodeji v češtině; bez PII; bez výzev ke kontaktu; nejisté [DOPLNIT …] až pod nabídkou, každý na vlastním řádku (ne v jedné větě).`;
}

export type SuggestListingParsed = {
  title: string;
  description: string;
  categoryType: string;
  subcategorySlug: string | null;
  confidenceScore: number;
};

function clampSingleLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim();
}

function clampMultiline(value: string, max: number): string {
  const trimmed = value
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim();
}

/**
 * Vytáhne [DOPLNIT …] z textu a dá je pod nabídku — jeden placeholder na řádek.
 * Funguje i když model nechá placeholdery inline.
 */
export function formatDoplnitPlaceholders(description: string): string {
  const matches = description.match(DOPLNIT_PLACEHOLDER_PATTERN) ?? [];
  if (matches.length === 0) {
    return description.trim();
  }

  const seen = new Set<string>();
  const placeholders: string[] = [];
  for (const match of matches) {
    const normalized = match.replace(/\s+/g, " ").trim();
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    placeholders.push(normalized);
  }

  let prose = description
    .replace(DOPLNIT_PLACEHOLDER_PATTERN, " ")
    .replace(/\r\n/g, "\n");

  // Orphan lead-ins after removing placeholders (např. „Součástí je:“).
  prose = prose
    .replace(
      /\b(součástí je|soucasti je|obsahuje|včetně|vcetne)\s*[:–-]?\s*$/gim,
      "",
    )
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?([,;:.])/g, "$1")
    .replace(/([,;:]){2,}/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/[,;:\-–—]\s*$/g, "")
    .trim();

  if (!prose) {
    return placeholders.join("\n");
  }

  return `${prose}\n\n${placeholders.join("\n")}`;
}

function parseConfidenceScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(1, Math.max(0, value));
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim().replace(",", "."));
    if (Number.isFinite(parsed)) {
      return Math.min(1, Math.max(0, parsed));
    }
  }
  return 0;
}

/** Normalizuje a validuje Gemini JSON; PII scrub + clamp; neplatný pár / nízká jistota → subcategory null. */
export function parseSuggestListingResponse(raw: string): SuggestListingParsed {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("SUGGEST_PARSE_ERROR");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("SUGGEST_PARSE_ERROR");
  }

  const body = parsed as Record<string, unknown>;
  const title = clampSingleLine(
    stripContactInfo(typeof body.title === "string" ? body.title : ""),
    SUGGEST_LISTING_TITLE_MAX_LENGTH,
  );
  const description = clampMultiline(
    formatDoplnitPlaceholders(
      stripContactInfo(
        typeof body.description === "string" ? body.description : "",
      ),
    ),
    SUGGEST_LISTING_DESCRIPTION_MAX_LENGTH,
  );

  if (!title || !description) {
    throw new Error("SUGGEST_PARSE_ERROR");
  }

  let categoryType =
    typeof body.categoryType === "string" ? body.categoryType.trim() : "";
  if (!isGoodsCategoryType(categoryType)) {
    categoryType = "ostatni";
  }

  const confidenceScore = parseConfidenceScore(body.confidenceScore);

  let subcategorySlug: string | null =
    typeof body.subcategorySlug === "string" && body.subcategorySlug.trim()
      ? body.subcategorySlug.trim()
      : null;

  if (
    !subcategorySlug ||
    !isValidGoodsSubcategory(categoryType, subcategorySlug) ||
    confidenceScore < SUGGEST_LISTING_CONFIDENCE_THRESHOLD
  ) {
    subcategorySlug = null;
  }

  return {
    title,
    description,
    categoryType,
    subcategorySlug,
    confidenceScore,
  };
}
