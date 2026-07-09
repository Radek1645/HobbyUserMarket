# Právní dokumentace — draft (Legal Design)

> **Stav:** Draft k revizi právníkem · **Legislativní kontext:** DSA, GDPR, AI Act (2026)  
> **Projekt:** HobbyUserMarket (specifikace [`PRD_v3.md`](../PRD_v3.md) §11.3)

Modulární sada právních textů pro web. Každý dokument obsahuje srozumitelné shrnutí (TL;DR) a plné znění pro publikaci na samostatné URL.

## Přehled dokumentů

| Dokument | Soubor | Navrhovaná URL | Povinnost |
|----------|--------|----------------|-----------|
| Všeobecné obchodní podmínky (VOP) | [`vop.md`](./vop.md) | `/vop` | Povinné |
| Zásady ochrany osobních údajů | [`ochrana-osobnich-udaju.md`](./ochrana-osobnich-udaju.md) | `/gdpr` | Povinné |
| Zásady používání souborů cookie | [`cookies.md`](./cookies.md) | `/cookies` | Povinné |
| DSA kontaktní centrum | [`dsa-kontaktni-centrum.md`](./dsa-kontaktni-centrum.md) | `/dsa` | Povinné |
| Pravidla inzerce (kodex chování) | [`podminky-inzerce.md`](./podminky-inzerce.md) | `/podminky-inzerce` | Doporučené |

## Doplňovat před publikací

- Identifikace provozovatele (název, sídlo, IČO, DIČ)
- Kontaktní e-mail a datová schránka (DSA, GDPR)
- Verze dokumentu a datum účinnosti
- PDF export do `public/docs/` (např. `vop-v1.0.pdf`, `gdpr-v1.0.pdf`)

## Poznámky

- Evropská platforma ODR byla k 20. 3. 2025 zrušena — v textech není odkazována.
- Marketingový souhlas je samostatný dokument na `/marketingovy-souhlas` (mimo tuto sadu).
- **Zablokování inzerátu** (`blocked`, migrace `036`): [Pravidla inzerce](./podminky-inzerce.md) §4, [VOP](./vop.md) §4.2, [DSA centrum](./dsa-kontaktni-centrum.md) §3.
