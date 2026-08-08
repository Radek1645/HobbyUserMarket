/**
 * Feature flag + limity AI photo-first prefillu (zboží).
 * Edge Function: suggest-listing-from-photos — oddělená od moderate-listing.
 */

export const SUGGEST_FROM_PHOTOS_ENABLED = true;

export const SUGGEST_FROM_PHOTOS_FUNCTION_NAME =
  "suggest-listing-from-photos" as const;

/** Max AI prefillů / hodinu / přihlášený uživatel (DB action suggest_from_photos). */
export const SUGGEST_FROM_PHOTOS_RATE_LIMIT_PER_HOUR = 20;

export const SUGGEST_FROM_PHOTOS_MIN_IMAGES = 1;
export const SUGGEST_FROM_PHOTOS_MAX_IMAGES = 2;

/** Pod touto jistotou Edge nulluje subcategorySlug. */
export const SUGGEST_FROM_PHOTOS_CONFIDENCE_THRESHOLD = 0.7;

export const SUGGEST_FROM_PHOTOS_UI = {
  pageHint:
    "Vyfoťte nebo vyberte fotky — AI vyplní název, popis i kategorii. Platnost 30 dní.",
  aiCardTitle: "Vyfoťte věc a my vyplníme zbytek",
  aiCardSubtitle:
    "Hlavní fotka a detail stačí. Cenu, stav a lokalitu doplníte sami.",
  dropzoneIdle: "Vyfoťte nebo vyberte 1–2 fotky",
  dropzoneHint:
    "Max. 2 fotky (hlavní + detail). AI z nich vytvoří název, popis a kategorii.",
  ctaLabel: "Vytvořit inzerát s AI",
  statusChecking: "Kontrola fotek…",
  statusAnalyzing: "Analýza obsahu…",
  statusPrefilling: "Předvyplňování…",
  /** Sekundární banner — reality / služby / práce / události (ne AI zboží). */
  manualTitle:
    "Chcete inzerovat nemovitost, službu, práci nebo událost? Nebo inzerát chcete zadat ručně.",
  manualBody:
    "Tyto kategorie potřebují specifické údaje, které AI z fotky nepozná.",
  manualCtaLabel: "Vyplnit ručně bez AI →",
  needPhotos: "Vyfoťte nebo vyberte alespoň jednu fotku.",
  tooManyPhotos:
    "Můžete nahrát nejvýše 2 fotky (hlavní + detail). Použili jsme první dvě — ostatní jsme vynechali.",
  rateLimitMessage:
    "Dosáhli jste hodinového limitu AI předvyplnění. Zkuste to později, nebo vyplňte inzerát ručně.",
  technicalError:
    "AI předvyplnění teď selhalo. Zkuste to znovu, nebo vyplňte inzerát ručně.",
  nsfwReject:
    "Fotografie porušuje podmínky webu. Nahrajte jiné snímky, nebo pokračujte ručně.",
  missingFieldsHint:
    "AI vyplnila název, popis a kategorii. Doplňte cenu, stav a lokalitu.",
} as const;
