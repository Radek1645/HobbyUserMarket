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
  pageHint: "Stačí fotka. Napíšeme název a popis.",
  /** Guest page hint — stejný benefit + kdy vznikne účet. */
  pageHintGuest:
    "Stačí fotka. Napíšeme název a popis. Účet založíte až při publikaci.",
  aiCardTitle: "Stačí fotka. Napíšeme název a popis.",
  aiCardSubtitle:
    "Nahrajte 1–2 fotky. Kategorii doplníme taky, cenu, stav a lokalitu přidáte vy.",
  dropzoneIdle: "Přidat fotky",
  dropzoneHint: "Maximálně 2 fotky",
  cameraCta: "Vyfotit",
  galleryCta: "Vybrat z galerie",
  ctaLabel: "Předvyplnit inzerát",
  statusChecking: "Kontrolujeme fotky…",
  statusAnalyzing: "Píšeme název a popis…",
  statusPrefilling: "Doplňujeme údaje…",
  /** Sekundární banner — reality / služby / práce / události. */
  manualTitle: "Nebo raději ručně?",
  manualBody:
    "Služby, události, práce a reality můžete vytvořit klasicky.",
  manualCtaLabel: "Vyplnit inzerát ručně",
  needPhotos: "Přidejte alespoň jednu fotku.",
  tooManyPhotos:
    "Můžete mít nejvýše 2 fotky. Ponechali jsme poslední dvě — starší jsme vynechali.",
  rateLimitMessage:
    "Dosáhli jste hodinového limitu předvyplnění. Zkuste to později, nebo vyplňte inzerát ručně.",
  technicalError:
    "Předvyplnění teď selhalo. Zkuste to znovu, nebo vyplňte inzerát ručně.",
  nsfwReject:
    "Fotografie porušuje podmínky webu. Nahrajte jiné snímky, nebo pokračujte ručně.",
  missingFieldsHint:
    "Připravili jsme návrh názvu, popisu a kategorie. Zkontrolujte ho a doplňte cenu, stav a lokalitu. Řádky „Doplňte …:“ vyplňte za dvojtečku, nebo je smažte. Přidejte klidně další fotky a upřesněte popis — čím víc informací, tím líp.",
} as const;
