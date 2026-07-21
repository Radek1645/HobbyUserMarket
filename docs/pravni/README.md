# Právní dokumentace — draft (Legal Design)

> **Stav:** Draft 1.4 (VOP) / 1.2 (Pravidla) / 1.0 (Balíčky) k revizi právníkem · **Legislativní kontext:** DSA, GDPR, AI Act (2026)  
> **Projekt:** HobbyUserMarket (specifikace [`PRD_v3.md`](../PRD_v3.md) §11.3)

Modulární sada právních textů pro web. Každý dokument obsahuje srozumitelné shrnutí (TL;DR) a plné znění pro publikaci na samostatné URL.

## Přehled dokumentů

| Dokument | Soubor (FO / bez IČO) | Soubor (OSVČ / s IČO) | URL | Povinnost |
|----------|------------------------|------------------------|-----|-----------|
| Všeobecné obchodní podmínky (VOP) | [`vop-fo.md`](./vop-fo.md) | [`vop-osvc.md`](./vop-osvc.md) | `/vop` | Povinné |
| Zásady ochrany osobních údajů | [`ochrana-osobnich-udaju-fo.md`](./ochrana-osobnich-udaju-fo.md) | [`ochrana-osobnich-udaju-osvc.md`](./ochrana-osobnich-udaju-osvc.md) | `/gdpr` | Povinné |
| Zásady používání souborů cookie | [`cookies.md`](./cookies.md) | — | `/cookies` | Povinné |
| DSA kontaktní centrum | [`dsa-kontaktni-centrum.md`](./dsa-kontaktni-centrum.md) | — | `/dsa` | Povinné |
| Pravidla inzerce (kodex chování) | [`podminky-inzerce.md`](./podminky-inzerce.md) | — | `/podminky-inzerce` | Doporučené |
| Balíčky inzerce / limity | [`balicky-inzerce-fo.md`](./balicky-inzerce-fo.md) | [`balicky-inzerce-osvc.md`](./balicky-inzerce-osvc.md) | `/balicky-inzerce` | Povinné |

## Revize právníkem (`REVIZE_PRAVNI/`)

Pracovní kopie **s interními poznámkami** pro advokáta — na web se ne publikují. Po schválení textu:

1. Upravte soubor v [`REVIZE_PRAVNI/`](./REVIZE_PRAVNI/).
2. Spusťte `node scripts/sync-legal-docs-for-web.mjs` — zkopíruje do `docs/pravni/` bez poznámek pro revizi.

Webové soubory v tomto adresáři jsou **čisté verze**. Aplikace navíc volá `stripLegalReviewNotes()` při renderu (`readLegalDocument`).

## Přepnutí monetizace (v0.6)

Výběr FO vs. OSVČ varianty právních textů a platebního UI řídí env proměnná:

```env
# výchozí (nebo vynechat) — fyzická osoba, bez placených balíčků
NEXT_PUBLIC_MONETIZATION_ENABLED=false

# po registraci IČO a před spuštěním plateb
NEXT_PUBLIC_MONETIZATION_ENABLED=true
```

**Checklist při zapnutí:**

1. Doplnit identifikaci v `*-osvc.md` (název, sídlo, IČO, e-mail).
2. Nastavit `NEXT_PUBLIC_MONETIZATION_ENABLED=true` + redeploy.
3. V DB: `UPDATE listing_packages SET is_purchasable = true WHERE slug = 'standard_20'`.
4. Spustit platební modul (Fio API) dle PRD §12.

## Doplňovat před publikací

- Identifikace provozovatele — FO: jméno + e-mail v `*-fo.md`; OSVČ: název, sídlo, IČO v `*-osvc.md`
- Kontaktní e-mail a datová schránka (DSA, GDPR)
- Verze dokumentu a datum účinnosti
- PDF export do `public/docs/` (např. `vop-v1.0.pdf`, `gdpr-v1.0.pdf`)
- Finální název platformy (find-and-replace „HobbyUserMarket“)

## Verzování VOP (povinné)

Pokud uživatel při registraci odsouhlasí VOP, musíme umět **kdykoli doložit přesné znění**, se kterým souhlasil.

- V DB se ukládá `profiles.vop_accepted_at` a `profiles.vop_version` (migrace **044**).
- `vop_version` musí odpovídat **verzovanému artefaktu**, který je dlouhodobě dostupný:
  - PDF v `public/docs/` se verzí v názvu (např. `vop-v1.5-fo.pdf`, `vop-v1.5-osvc.pdf`)
  - a/nebo HTML snapshot verze (nesmí se zpětně měnit)
- Jakmile je verze jednou v produkci a někdo ji odsouhlasí, **nesmí se přepsat** „na místě“ bez navýšení verze (jen nový soubor + nová verze).

## Data v EU / EHP — checklist (P33)

> **Stav 2026-07-13:** V kódu ani PRD není garantováno, že všechna data zůstávají v EU. Hlavní DB může být v EU (volba regionu Supabase), ale AI moderace posílá text a fotky ke Google/OpenAI.

- [x] Ověřit **Supabase region** — `eu-west-1` (West EU, Ireland); zapsáno v GDPR §5.1 (2026-07-19)
- [x] Ověřit **Vercel** Function region — `dub1` (Dublin); zapsáno v GDPR §5.1 (2026-07-19)
- [x] **Gemini / OpenAI** — popsány v GDPR §5.1 jako přenos mimo EHP + DPA/SCC (2026-07-19)
- [x] **Sightengine** — popsán v GDPR §5.1 (předfiltrace fotek; routing může být mimo EHP; DPA u poskytovatele) (2026-07-21)
- [x] **Tabulka zpracovatelů** v FO i OSVC §5.1 (2026-07-19)
- [x] Ověřit **Resend** sending region — Ireland `eu-west-1`, doména `zapikolou.cz` Verified (2026-07-19); zapsáno v GDPR §5.1
- [x] **Resend DPA** — staženo 2026-07-20 do [`resend-dpa-signed.pdf`](./resend-dpa-signed.pdf) (DocuSign `CC958417-…`, Updated 12/31/2025). Předpodepsaná Resendem; závazná od registrace účtu — bez countersign. Zahrnuje SCC / GDPR.
- [ ] **Sightengine DPA** — podepsat / vrátit na support@sightengine.com (EU zákazník)
- [ ] Revize právníkem před publikací finálního GDPR textu (vč. Sightengine + CSAM hard stop ve VOP/Pravidlech)

Detail: [`TO-DO_Fable.md`](../TO-DO_Fable.md) **P33**.

## Revize draft 1.1 (2026-07-10) — sladění s PRD

| Bod | Stav | Kde |
|-----|------|-----|
| Věk 15+, nezletilí, GDPR souhlas 15 let | ✅ draft | [VOP §6](./vop-fo.md), [GDPR §6.2](./ochrana-osobnich-udaju-fo.md) |
| SMS ověření (Out of Scope v0.1) | ✅ odstraněno z GDPR | [GDPR](./ochrana-osobnich-udaju-fo.md) |
| Retence 90 dní + e-mail 7 dní předem | ✅ doplněno | [GDPR §6.1](./ochrana-osobnich-udaju-fo.md) |
| VOP: všechny kategorie (ne jen zboží) | ✅ | [VOP §1](./vop-fo.md) |
| Nemovitosti — nejsme realitní zprostředkovatel | ✅ draft | [VOP §1.4](./vop-fo.md) |
| GA4/GTM místo Facebook Pixel | ✅ | [GDPR §4](./ochrana-osobnich-udaju-fo.md), [cookies](./cookies.md) |
| Pojistka proti zneužití hlášení (brigading) | ✅ | [VOP §4.5](./vop-fo.md), [Pravidla §4](./podminky-inzerce.md), [DSA §3](./dsa-kontaktni-centrum.md) |
| Jedna publikace = jedna nabídka (zákaz rotace obsahu) | ✅ soft / bez kódu | [VOP §2.3](./vop-fo.md), [Pravidla §1](./podminky-inzerce.md), [Balíčky](./balicky-inzerce-fo.md) |
| Pracovní inzeráty | ✅ draft | [Pravidla §2.1](./podminky-inzerce.md) |
| AI disclaimer (kontrola před publikací) | ✅ draft | [Pravidla §3](./podminky-inzerce.md) |

## Revize draft 1.3 (2026-07-11) — moderace a podnikatelé

| Bod | Stav draftu | Implementace v kódu |
|-----|-------------|-------------------|
| [VOP §4](./vop-fo.md) — AI moderace, God Mode, DSA | ✅ draft 1.3 | AI ✅ · God Mode inzerátů ⚠️ · SoR e-mail ❌ |
| [VOP §3](./vop-fo.md) — licence, vodoznak (volitelně), recyklace fotek | ✅ draft | vodoznak volitelný (není v plánu) · detekce recyklace ❌ |
| [VOP §7](./vop-fo.md) — Podnikatel, IČO, štítek | ✅ draft | profil firma ✅ · badge ✅ · IČO volitelné ⚠️ |
| [Pravidla §2.2](./podminky-inzerce.md) — seznam zakázaného obsahu | ✅ draft 1.2 | `prohibited-topics.ts` ✅ · web `/podminky-inzerce` stub ❌ |
| [Pravidla §2.4](./podminky-inzerce.md) + [VOP §4.5](./vop-fo.md) — CSAM hard stop | ✅ draft 2026-07-21 | hard-hit text ✅ · blacklist účtu ✅ (055, SoR e-mail) |
| Checkbox věku 15+ | ✅ | `RegistrationConsentFields` ✅ |

## Revize draft 1.4 (2026-07-11) — balíčky inzerce

| Bod | Stav draftu | Implementace v kódu |
|-----|-------------|-------------------|
| [Balíčky inzerce](./balicky-inzerce-fo.md) — ceník mimo VOP | ✅ draft 1.0 | DB `038` ✅ · web `/balicky-inzerce` stub ❌ |
| [VOP §2.3](./vop-fo.md) — odkaz na dynamický ceník | ✅ draft 1.4 | `/balicky-inzerce` ✅ |
| [VOP §4.7, §8.1–8.2](./vop-fo.md) — stížnosti, související docs | ✅ draft 1.4 | `/vop` ✅ · `/podminky-inzerce` ✅ |

## K potvrzení právníkem

- [ ] Formulace věku 15–18 let a souhlas zákonného zástupce (NOZ)
- [ ] Vyloučení zákona č. 39/2020 Sb. (realitní zprostředkování)
- [ ] Rozsah povinností u inzerce práce
- [ ] Společné správcovství GA4 — zda se vztahuje na naši implementaci
- [ ] CSAM hard stop (VOP §4.5 / Pravidla §2.4) + Sightengine v GDPR §5.1
- [x] Checkbox věku v registračním formuláři — hotovo v kódu

## Poznámky

- Evropská platforma ODR byla k 20. 3. 2025 zrušena — v textech není odkazována.
- Marketingový souhlas je samostatný dokument na `/marketingovy-souhlas` (mimo tuto sadu).
- **Zablokování inzerátu** (`blocked`, migrace `036`): [Pravidla inzerce](./podminky-inzerce.md) §4, [VOP](./vop-fo.md) §4.5, [DSA centrum](./dsa-kontaktni-centrum.md) §3.
- **SMS verifikace:** plánována v PRD, v MVP Out of Scope — do GDPR se vrátí až po nasazení.
