/**
 * Stub pro budoucí napojení na ARES / Bisnode.
 * Po integraci vrátí ověřený název firmy a nastaví company_ico_verified.
 */

export type CompanyRegistryResult = {
  ico: string;
  name: string;
  verified: boolean;
  source: "ares" | "bisnode";
};

export async function lookupCompanyByIco(
  ico: string,
): Promise<CompanyRegistryResult | null> {
  void ico;
  // TODO: napojit ARES REST API nebo Bisnode
  return null;
}

export function getCompanyRegistryHint(): string {
  return "Našeptávání a ověření IČO proti registru firem připravujeme.";
}
