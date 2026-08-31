/**
 * Jednorázový skript: e-mail 15 dní před účinností nových VOP.
 *
 * Spustit až bude datum T. Teď je to stub — nerozesílá nic.
 *
 * Až bude datum:
 * 1. Doplnit T a text oznámení.
 * 2. Vybrat účty s vop_version <> CURRENT_VOP_VERSION (po bump na 2.1-osvc).
 * 3. Poslat přes sendTransactionalEmail, idempotentně (tabulka / log).
 */

function main(): void {
  console.log(
    "notify-vop-change: čeká na datum účinnosti 2.1-osvc. Nic se neodesílá.",
  );
}

main();
