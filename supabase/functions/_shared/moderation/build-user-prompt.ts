import {
  LISTING_DESCRIPTION_MAX_LENGTH,
  MODERATION_DESCRIPTION_QA_RESERVE,
} from "./constants.ts";
import {
  LISTING_PROMPT_TAGS,
  wrapListingUserField,
} from "./bound-user-content.ts";

export type ModerationRequestBody = {
  intent?: string;
  title: string;
  description: string;
  categoryType?: string;
  subcategorySlug?: string;
  conditionLabel?: string;
  conditionLabelText?: string;
  conditionFieldLabel?: string;
  eventDate?: string;
  /** Lokalita z formuláře — lokální SEO / spádové město. */
  locationText?: string;
  priceType?: string;
  priceTypeLabel?: string;
  priceAmount?: number;
  mainImageIndex?: number;
  imagesBase64?: string[];
};

function formatCzkAmount(amount: number): string {
  return amount.toLocaleString("cs-CZ");
}

function formatPriceFromForm(body: ModerationRequestBody): string | null {
  const priceType = body.priceType?.trim();
  if (!priceType) return null;

  const categoryType = body.categoryType?.trim();
  const isService = categoryType === "sluzby";
  const isJob = categoryType === "prace";
  const label = body.priceTypeLabel?.trim() || priceType;
  const amount =
    typeof body.priceAmount === "number" && !Number.isNaN(body.priceAmount)
      ? body.priceAmount
      : null;

  if (priceType === "fixed" && amount != null) {
    if (isService) {
      return `Typ ceny z formuláře: ${label}, ${formatCzkAmount(amount)} Kč/h. Do cleanedDescription vlož „${formatCzkAmount(amount)} Kč/h“ (nebo přirozeně zapracovanou hodinovou sazbu). Nepoužívej formulaci „Cena ${formatCzkAmount(amount)} Kč“ bez /h — jde o sazbu za hodinu, ne prodejní cenu věci. Nikdy nepoužívej zástupný text [SKRYTO – použij chráněné pole] — ten je výhradně pro e-mail a telefon. Na cenu se znovu neptej.`;
    }
    if (isJob) {
      return `Typ ceny z formuláře: ${label}, ${formatCzkAmount(amount)} Kč/h. Do cleanedDescription vlož „${formatCzkAmount(amount)} Kč/h“ nebo „odměna ${formatCzkAmount(amount)} Kč/h“. Nepoužívej formulaci bez /h — jde o hodinovou mzdu. Nikdy nepoužívej zástupný text [SKRYTO – použij chráněné pole] — ten je výhradně pro e-mail a telefon. Na cenu se znovu neptej.`;
    }
    return `Typ ceny z formuláře: ${label}, ${formatCzkAmount(amount)} Kč. Do cleanedDescription vlož přímo „Cena ${formatCzkAmount(amount)} Kč.“ (nebo přirozeně zapracovanou do věty). Do metaDescription „za ${formatCzkAmount(amount)} Kč“. Nikdy nepoužívej zástupný text [SKRYTO – použij chráněné pole] — ten je výhradně pro e-mail a telefon. Na cenu se znovu neptej.`;
  }

  if (priceType === "negotiable" && amount != null) {
    if (isService) {
      return `Typ ceny z formuláře: ${label}, orientačně ${formatCzkAmount(amount)} Kč za celou zakázku. Uveď např. „od ${formatCzkAmount(amount)} Kč“ nebo „cena za zakázku od ${formatCzkAmount(amount)} Kč“. Nepoužívej formulaci jako prodejní cenu jedné věci. Nikdy nepoužívej zástupný text [SKRYTO – použij chráněné pole]. Na cenu se znovu neptej.`;
    }
    if (isJob) {
      return `Typ ceny z formuláře: ${label}, fixní odměna ${formatCzkAmount(amount)} Kč za úkol/brigádu (ne za hodinu). Uveď např. „odměna ${formatCzkAmount(amount)} Kč“. Nikdy nepoužívej zástupný text [SKRYTO – použij chráněné pole]. Na cenu se znovu neptej.`;
    }
    return `Typ ceny z formuláře: ${label}, ${formatCzkAmount(amount)} Kč (dohodou). V cleanedDescription uveď „Cena ${formatCzkAmount(amount)} Kč, dohodou.“ Do metaDescription dej jen „za ${formatCzkAmount(amount)} Kč“ — bez „cca“, „orientační“, „dohodou“. Do cleanedTitle nedávej „cca“ ani „dohodou“. Nikdy nepoužívej zástupný text [SKRYTO – použij chráněné pole]. Na cenu se znovu neptej.`;
  }

  if (priceType === "negotiable" || priceType === "fixed") {
    return `Typ ceny z formuláře: ${label}. Částka není vyplněna — cenu v cleanedDescription neuváděj a nepoužívej zástupný text za cenu.`;
  }

  if (
    priceType === "free_pickup" ||
    priceType === "offer" ||
    priceType === "exchange"
  ) {
    if (isService && priceType === "offer") {
      return `Typ ceny z formuláře: ${label}. Cenu v cleanedDescription neuveduj — domluví se individuálně.`;
    }
    return `Typ ceny z formuláře: ${label}. Na prodejní cenu se neptej — u tohoto typu není relevantní.`;
  }

  return `Typ ceny z formuláře: ${label}.`;
}

function formatEventDateForPrompt(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function buildModerationUserPrompt(
  body: ModerationRequestBody,
  categoryAiPrompt?: string,
): string {
  const imageCount = body.imagesBase64?.length ?? 0;
  const mainIndex =
    typeof body.mainImageIndex === "number" ? body.mainImageIndex : 0;

  const conditionFieldLabel = body.conditionFieldLabel?.trim() || "Stav";

  const needsQuestionsMax =
    LISTING_DESCRIPTION_MAX_LENGTH - MODERATION_DESCRIPTION_QA_RESERVE;

  const sections = [
    "Úkol: moderuj inzerát (text + fotografie) a vrať JSON dle system promptu.",
    "Formát cleanedDescription: nejdřív úvod (až 6 vět), pak „---“, nadpis „Parametry“ a odrážky • Popisek: hodnota.",
    `Tvrdý limit délky: publikovaný popis max ${LISTING_DESCRIPTION_MAX_LENGTH} znaků. U NEEDS_QUESTIONS drž cleanedDescription do ${needsQuestionsMax} znaků (rezerva na odpovědi z dotazníku).`,
    body.intent ? `Akce: ${body.intent}` : null,
    body.categoryType
      ? `Kategorie: ${body.categoryType}${body.subcategorySlug ? ` / ${body.subcategorySlug}` : ""}`
      : null,
    categoryAiPrompt
      ? `Kontext kategorie pro hydrataci a doplňující otázky:\n${categoryAiPrompt}`
      : null,
    body.conditionLabelText
      ? `${conditionFieldLabel} z formuláře:\n${wrapListingUserField(LISTING_PROMPT_TAGS.condition, body.conditionLabelText)}`
      : body.conditionLabel
        ? `${conditionFieldLabel} z formuláře (kód): ${body.conditionLabel}`
        : null,
    body.eventDate
      ? `Datum a čas konání z formuláře:\n${wrapListingUserField(LISTING_PROMPT_TAGS.eventDate, formatEventDateForPrompt(body.eventDate))}`
      : null,
    formatPriceFromForm(body),
    body.locationText?.trim()
      ? `Lokalita z formuláře:\n${wrapListingUserField(LISTING_PROMPT_TAGS.location, body.locationText.trim())}`
      : null,
    `mainImageIndex (hlavní fotka — jen cross-validace textu s náhledem): ${mainIndex}`,
    imageCount > 0
      ? `Přiloženo ${imageCount} fotografií v pořadí indexů 0–${imageCount - 1}. Pro hydrataci a dotazník posuzuj všechny fotografie; fakta z jakékoli fotky zapracuj do textu.`
      : "Bez fotografií — posuzuj pouze text.",
    `Název inzerátu:\n${wrapListingUserField(LISTING_PROMPT_TAGS.title, body.title)}`,
    `Popis inzerátu:\n${wrapListingUserField(LISTING_PROMPT_TAGS.description, body.description)}`,
  ];

  return sections.filter(Boolean).join("\n\n");
}
