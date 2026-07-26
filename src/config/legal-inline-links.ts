import {
  GDPR_PATH,
  LISTING_PACKAGES_PATH,
  REPORT_LISTING_PATH,
  VOP_PATH,
} from "@/config/legal";
import { LISTING_TERMS_PATH } from "@/config/moderation";

/**
 * Fráze v UI textu → interní URL (právní docs + nahlášení).
 * Delší varianty (skloňování) musí být před kratšími — řazení řeší `splitLegalMentions`.
 */
export type LegalInlineLinkPhrase = {
  phrase: string;
  href: string;
};

export const LEGAL_INLINE_LINK_PHRASES: readonly LegalInlineLinkPhrase[] = [
  {
    phrase: "Zásady ochrany osobních údajů",
    href: GDPR_PATH,
  },
  {
    phrase: "Zásadách ochrany osobních údajů",
    href: GDPR_PATH,
  },
  {
    phrase: "Zásad ochrany osobních údajů",
    href: GDPR_PATH,
  },
  {
    phrase: "Všeobecné obchodní podmínky",
    href: VOP_PATH,
  },
  {
    phrase: "Podmínkách inzerce",
    href: LISTING_TERMS_PATH,
  },
  {
    phrase: "Podmínkami inzerce",
    href: LISTING_TERMS_PATH,
  },
  {
    phrase: "Podmínky inzerce",
    href: LISTING_TERMS_PATH,
  },
  {
    phrase: "Podmínek inzerce",
    href: LISTING_TERMS_PATH,
  },
  {
    phrase: "Balíčky / limity inzerce",
    href: LISTING_PACKAGES_PATH,
  },
  {
    phrase: "Balíčky inzerce",
    href: LISTING_PACKAGES_PATH,
  },
  {
    phrase: "Limity inzerce",
    href: LISTING_PACKAGES_PATH,
  },
  {
    phrase: "VOP",
    href: VOP_PATH,
  },
  {
    phrase: "Nahlásit inzerát",
    href: REPORT_LISTING_PATH,
  },
] as const;
