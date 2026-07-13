/** v0.6 — placené balíčky inzerce (IČO, bankovní převod). Vypnuto do registrace živnosti. */
export const MONETIZATION_ENABLED =
  process.env.NEXT_PUBLIC_MONETIZATION_ENABLED === "true";

export const LISTING_QUOTA_EXCEEDED_MESSAGE = MONETIZATION_ENABLED
  ? "Dosáhli jste limitu publikovaných inzerátů. Smazání nebo archivace starého inzerátu kredit nevrátí — další publikaci získáte dokoupením balíčku v nastavení profilu."
  : "Dosáhli jste limitu publikovaných inzerátů. Smazání nebo archivace starého inzerátu kredit nevrátí.";
