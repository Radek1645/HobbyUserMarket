# Právní dokumentace — draft (Legal Design)

> **Stav:** Draft 1.4 (VOP) / 1.2 (Pravidla) / 1.0 (Balíčky) k revizi právníkem · **Legislativní kontext:** DSA, GDPR, AI Act (2026)  
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
| Balíčky inzerce a ceník | [`balicky-inzerce.md`](./balicky-inzerce.md) | `/balicky-inzerce` | Povinné (ceník) |

## Doplňovat před publikací

- Identifikace provozovatele (název, sídlo, IČO, DIČ)
- Kontaktní e-mail a datová schránka (DSA, GDPR)
- Verze dokumentu a datum účinnosti
- PDF export do `public/docs/` (např. `vop-v1.0.pdf`, `gdpr-v1.0.pdf`)
- Finální název platformy (find-and-replace „HobbyUserMarket“)

## Revize draft 1.1 (2026-07-10) — sladění s PRD

| Bod | Stav | Kde |
|-----|------|-----|
| Věk 15+, nezletilí, GDPR souhlas 15 let | ✅ draft | [VOP §6](./vop.md), [GDPR §6.2](./ochrana-osobnich-udaju.md) |
| SMS ověření (Out of Scope v0.1) | ✅ odstraněno z GDPR | [GDPR](./ochrana-osobnich-udaju.md) |
| Retence 90 dní + e-mail 7 dní předem | ✅ doplněno | [GDPR §6.1](./ochrana-osobnich-udaju.md) |
| VOP: všechny kategorie (ne jen zboží) | ✅ | [VOP §1](./vop.md) |
| Nemovitosti — nejsme realitní zprostředkovatel | ✅ draft | [VOP §1.4](./vop.md) |
| GA4/GTM místo Facebook Pixel | ✅ | [GDPR §4](./ochrana-osobnich-udaju.md), [cookies](./cookies.md) |
| Pojistka proti zneužití hlášení (brigading) | ✅ | [VOP §4.5](./vop.md), [Pravidla §4](./podminky-inzerce.md), [DSA §3](./dsa-kontaktni-centrum.md) |
| Pracovní inzeráty | ✅ draft | [Pravidla §2.1](./podminky-inzerce.md) |
| AI disclaimer (kontrola před publikací) | ✅ draft | [Pravidla §3](./podminky-inzerce.md) |

## Revize draft 1.3 (2026-07-11) — moderace a podnikatelé

| Bod | Stav draftu | Implementace v kódu |
|-----|-------------|-------------------|
| [VOP §4](./vop.md) — AI moderace, God Mode, DSA | ✅ draft 1.3 | AI ✅ · God Mode inzerátů ⚠️ · SoR e-mail ❌ |
| [VOP §3](./vop.md) — licence, vodoznak (volitelně), recyklace fotek | ✅ draft | vodoznak volitelný (není v plánu) · detekce recyklace ❌ |
| [VOP §7](./vop.md) — Podnikatel, IČO, štítek | ✅ draft | profil firma ✅ · badge ❌ · IČO volitelné ⚠️ |
| [Pravidla §2.2](./podminky-inzerce.md) — seznam zakázaného obsahu | ✅ draft 1.2 | `prohibited-topics.ts` ✅ · web `/podminky-inzerce` stub ❌ |
| Checkbox věku 15+ | ✅ | `RegistrationConsentFields` ✅ |

## Revize draft 1.4 (2026-07-11) — balíčky inzerce

| Bod | Stav draftu | Implementace v kódu |
|-----|-------------|-------------------|
| [Balíčky inzerce](./balicky-inzerce.md) — ceník mimo VOP | ✅ draft 1.0 | DB `038` ✅ · web `/balicky-inzerce` stub ❌ |
| [VOP §2.3](./vop.md) — odkaz na dynamický ceník | ✅ draft 1.4 | `/balicky-inzerce` ✅ |
| [VOP §4.7, §8.1–8.2](./vop.md) — stížnosti, související docs | ✅ draft 1.4 | `/vop` ✅ · `/podminky-inzerce` ✅ |

## K potvrzení právníkem

- [ ] Formulace věku 15–18 let a souhlas zákonného zástupce (NOZ)
- [ ] Vyloučení zákona č. 39/2020 Sb. (realitní zprostředkování)
- [ ] Rozsah povinností u inzerce práce
- [ ] Společné správcovství GA4 — zda se vztahuje na naši implementaci
- [x] Checkbox věku v registračním formuláři — hotovo v kódu

## Poznámky

- Evropská platforma ODR byla k 20. 3. 2025 zrušena — v textech není odkazována.
- Marketingový souhlas je samostatný dokument na `/marketingovy-souhlas` (mimo tuto sadu).
- **Zablokování inzerátu** (`blocked`, migrace `036`): [Pravidla inzerce](./podminky-inzerce.md) §4, [VOP](./vop.md) §4.5, [DSA centrum](./dsa-kontaktni-centrum.md) §3.
- **SMS verifikace:** plánována v PRD, v MVP Out of Scope — do GDPR se vrátí až po nasazení.
