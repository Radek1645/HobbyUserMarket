/**
 * Prefill výzvy k doplnění — ve formuláři „Doplňte značku: “, při publish „Značka: Nike“.
 * Klíče v DOPLNIT_PUBLISH_LABELS = výstup foldDoplnitFieldKey (ASCII, lowercase).
 */

export const DOPLNIT_PROMPT_VERB = "Doplňte";

/** Max. délka názvu údaje ve výzvě (ochrana před větou s dvojtečkou). */
export const DOPLNIT_FIELD_MAX_LENGTH = 40;

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
};
