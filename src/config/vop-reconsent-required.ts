/**
 * Které znění VOP musí uživatel znovu odsouhlasit (pruh + dialog).
 *
 * Default: nic. Dialog se nespustí, i když se CURRENT_VOP_VERSION liší od účtu.
 * 1.12-fo sem nepatří: oprava identity provozovatele, ne práv uživatelů.
 * Až bude zásadní změna, přidej sem aktuální verzi a krátký souhrn.
 */

export type VopReconsentRequirement = {
  /** Jedna až dvě věty do pruhu: co se ve VOP změnilo. */
  summary: string;
};

export const VOP_RECONSENT_REQUIRED: Readonly<
  Record<string, VopReconsentRequirement>
> = {
  // "2.1-osvc": {
  //   summary:
  //     "Placené kredity, lhůty uchování údajů a pravidla odstoupení od smlouvy.",
  // },
};

export function isVopReconsentRequired(version: string): boolean {
  return Object.prototype.hasOwnProperty.call(VOP_RECONSENT_REQUIRED, version);
}

export function getVopReconsentSummary(version: string): string {
  return VOP_RECONSENT_REQUIRED[version]?.summary ?? "";
}

/** true = účet má starší VOP a aktuální verze je v tabulce výše. */
export function needsVopReconsent(
  acceptedVersion: string | null | undefined,
  currentVersion: string,
): boolean {
  if (!acceptedVersion || acceptedVersion === currentVersion) {
    return false;
  }
  return isVopReconsentRequired(currentVersion);
}
