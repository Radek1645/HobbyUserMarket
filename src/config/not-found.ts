import { KONTAKT_PATH } from "@/config/footer";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { createListingCtaLabel } from "@/config/ui-primitives";

/**
 * Copy stránky 404.
 * Vtip drží značku: „před pikolou“ vs. produkt zaPikolou (redirect
 * `predpikolou.cz`). Smysl: odkaz je špatně, nebo inzerát zmizel.
 */
export const NOT_FOUND_UI = {
  metaTitle: `Stránka nenalezena | ${SITE_DISPLAY_NAME}`,
  metaDescription: `Tato stránka na ${SITE_DISPLAY_NAME} neexistuje. Inzerát se mohl prodat nebo vypršet — vraťte se na úvod, nebo si vytvořte vlastní.`,
  eyebrow: "404",
  title: "Jste ještě před pikolou",
  lead: "Tady nic nevisí. Odkaz zahnul vedle, nebo inzerát už zmizel — někdo ho koupil, vypršel, nebo ho stáhli.",
  cardBadge: "Ztraceno",
  cardTitle: "Inzerát č. 404",
  cardPrice: "není k mání",
  cardLocation: "Naposledy viděn před pikolou",
  homeCta: "Jít za pikolou",
  homeHref: "/",
  homeAriaLabel: "Zpět na úvodní stránku",
  createCta: createListingCtaLabel,
  createHref: "/inzerat/novy",
  contactHint: "Mělo by tu něco být?",
  contactLinkLabel: "Napište nám",
  contactHref: KONTAKT_PATH,
} as const;
