/**
 * Prefill výzvy k doplnění — ve formuláři „Doplňte značku: “, při publish „Značka: Nike“.
 * Klíče v DOPLNIT_PUBLISH_LABELS = výstup foldDoplnitFieldKey (ASCII, lowercase).
 */

export const DOPLNIT_PROMPT_VERB = "Doplňte";

/** Max. délka názvu údaje ve výzvě (ochrana před větou s dvojtečkou). */
export const DOPLNIT_FIELD_MAX_LENGTH = 40;

/**
 * Výzvy, které nesmí jít do popisu — mají vlastní pole formuláře.
 * Klíče = výstup foldDoplnitFieldKey (ASCII, lowercase).
 */
export const DOPLNIT_FORM_FIELD_KEYS: ReadonlySet<string> = new Set([
  "cena",
  "cenu",
  "cena v kc",
  "cenu v kc",
  "prodejni cenu",
  "lokalitu",
  "lokalita",
  "lokaci",
  "lokace",
  "misto",
  "misto predani",
  "misto vyzvednuti",
  "adresu",
  "adresa",
  "mesto",
  "obec",
  "stav",
  "stav zarizeni",
  "stav zbozi",
  "stav kusu",
  "stav veci",
  "stav produktu",
  "stav predmetu",
  "celkovy stav",
  "aktualni stav",
]);

export const DOPLNIT_PUBLISH_LABELS: Record<string, string> = {
  znacku: "Značka",
  znacka: "Značka",
  znacky: "Značka",
  velikost: "Velikost",
  "typ/model": "Typ/model",
  "typ / model": "Typ/model",
  "typ model": "Typ/model",
  typ: "Typ",
  model: "Model",
  "rok vyroby": "Rok výroby",
  rok: "Rok výroby",
  "najezd km": "Nájezd",
  najezd: "Nájezd",
  km: "Nájezd",
  material: "Materiál",
  motorizaci: "Motorizace",
  motorizace: "Motorizace",
  barvu: "Barva",
  barva: "Barva",
  rozmery: "Rozměry",
  rozmer: "Rozměry",
  puvod: "Původ",
  puvodu: "Původ",
};
