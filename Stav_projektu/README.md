# Stav projektu — HobbyUserMarket

Tato složka slouží k průběžnému ukládání snapshotů stavu vývoje.

## Jak to funguje

- Každý snapshot = jeden soubor `YYYY-MM-DD.md`
- Uvnitř je **časová značka** (kdy byl stav zapsán)
- Nový snapshot přidej po větší iteraci (ne po každém commitu)

## Soubory

| Datum | Soubor |
|-------|--------|
| 2026-08-22 (večer) | [2026-08-22-vecer.md](./2026-08-22-vecer.md) — galerie české chyby, souhrn limitu 6 fotek, PRD v3.75 |
| 2026-08-22 | [2026-08-22.md](./2026-08-22.md) — prefill Vyfotit/galerie, OOM-safe snapshot, copy Předvyplnit, PRD v3.74 |
| 2026-08-20 | [2026-08-20.md](./2026-08-20.md) — HP copy, DNS/Cloudflare, GDPR 1.5-fo, FB ads brief, mapa odložena, PRD v3.72 |
| 2026-08-15 | [2026-08-15.md](./2026-08-15.md) — FO bez úmyslu placené inzerce, VOP 1.11-fo, HP pilulka zdarma, PRD v3.69 |
| 2026-08-10 (večer) | [2026-08-10-vecer.md](./2026-08-10-vecer.md) — právní sync VOP 1.10 / GDPR 1.4, kontakt info@, site v0.2, PRD v3.67 |
| 2026-08-10 | [2026-08-10.md](./2026-08-10.md) — Prefill lab, 076 guest log, DOPLNIT formát, category links, móda face rules, PRD v3.66; SQL/Edge ✅ |
| 2026-08-09 | [2026-08-09.md](./2026-08-09.md) — FB guest funnel C + AI prefill, OAuth resume, krokovník, smoke § L, PRD v3.64; SQL/Edge ✅ |
| 2026-08-06 (večer) | [2026-08-06-vecer.md](./2026-08-06-vecer.md) — Category SEO Vlna 1 (`072`, `/{slug}/`, cron), PRD v3.60; SQL ✅ |
| 2026-08-06 | [2026-08-06.md](./2026-08-06.md) — UX po rejectu 2. moderace, source keyword scan, dual-model preview/final, vulgarismy, QA moderace, PRD v3.59; Edge deploy ✅ |
| 2026-08-04 | [2026-08-04.md](./2026-08-04.md) — flat kategorie 070, mřížka+bundle, unaccent 071, deletion_reason 069, lokalita, PRD v3.57; infra ✅ |
| 2026-08-01 | [2026-08-01.md](./2026-08-01.md) — formulář má pravdu, dětské Věk/výška, poptávky UI, Sport label, PRD v3.55; Edge deploy ✅ |
| 2026-07-31 | [2026-07-31.md](./2026-07-31.md) — staging + Sharp AI varianty (067/068), auth /auth/dokoncit, PRD v3.52; Edge deploy TODO |
| 2026-07-30 | [2026-07-30.md](./2026-07-30.md) — fix sync limitů fotek AI (1 MB/6 MB), Gemini model notes, PRD v3.49, push |
| 2026-07-28 (večer) | [2026-07-28-vecer.md](./2026-07-28-vecer.md) — smoke SEC-H01/H02 ✅, default covers, sport výbava, eventDate ISO, PRD v3.48, push |
| 2026-07-28 | [2026-07-28.md](./2026-07-28.md) — publish gate fingerprint 062–066, Next 15.5.22, SEO v1.9, PRD v3.47 |
| 2026-07-27 | [2026-07-27.md](./2026-07-27.md) — kvalita UX, parser Parametrů, moderace FP, SEO title v1.8, PRD v3.46 |
| 2026-07-26 | [2026-07-26.md](./2026-07-26.md) — FAQ `/faq`, audit 059/060, poznámky 061, categorySuggestion 058, PRD v3.45 |
| 2026-07-22 | [2026-07-22.md](./2026-07-22.md) — fix hide/restore 057, SoR `info@`, Sightengine JSONB 056, PRD v3.43 |
| 2026-07-21 (noc) | [2026-07-21-noc.md](./2026-07-21-noc.md) — hard stop blacklist 055, SoR e-maily, unban+obnova inzerátů, PRD v3.41 |
| 2026-07-21 (večer) | [2026-07-21-vecer.md](./2026-07-21-vecer.md) — NSFW/hard-hit brána (Sightengine), migrace 054, PRD v3.40 |
| 2026-07-21 | [2026-07-21.md](./2026-07-21.md) — odznaky Podnikatel/milníky, `/uzivatel`, migrace 052–053, PRD v3.39 |
| 2026-07-20 | [2026-07-20.md](./2026-07-20.md) — SEO bible v1.2, migrace 051, AI meta/alt, PRD v3.34 |
| 2026-07-19 (večer) | [2026-07-19-vecer.md](./2026-07-19-vecer.md) — fáze 5–7 (AI robustnost, GDPR, UX), Resend `eu-west-1`, PRD v3.33 |
| 2026-07-19 | [2026-07-19.md](./2026-07-19.md) — `/gdpr`, IP cron 050, EU regiony, P37–P39, HP vykání, PRD v3.32 |
| 2026-07-17 | [2026-07-17.md](./2026-07-17.md) — HP copy, tagline bazar, průvodce scénáře, P35 virtual_pageview, PRD v3.30 |
| 2026-07-16 (večer) | [2026-07-16-vecer.md](./2026-07-16-vecer.md) — lifetime 365d (049), expiry mail (048), intent badges, právní, PRD v3.29; infra ✅ |
| 2026-07-16 | [2026-07-16.md](./2026-07-16.md) — security 047 (M3–M9), magic bytes, llms.txt dynamicky, favicon; 047 později nasazeno (viz večer) |
| 2026-07-14 (večer) | [2026-07-14-vecer.md](./2026-07-14-vecer.md) — formulář UX, práce/CV (046), AI modal, lokace, Resend zapikolou.cz, PRD v3.28 |
| 2026-07-14 | [2026-07-14.md](./2026-07-14.md) — GTM-WGLNJRNK, cookie lišta, Consent Mode, Search Console DNS, PRD v3.27 |
| 2026-07-13 | [2026-07-13.md](./2026-07-13.md) — branding zaPikolou, AI disclosure (043), registrační souhlasy (044), právní FO/OSVČ, info stránky, PRD v3.26 |
| 2026-07-11 | [2026-07-11.md](./2026-07-11.md) — P26/P27 nahlášení + God Mode karanténa/inzeráty, migrace 040–042, PRD v3.24 |
| 2026-07-11 | [2026-07-11-plan.md](./2026-07-11-plan.md) — plán session (archiv) |
| 2026-07-10 | [2026-07-10.md](./2026-07-10.md) — stav `blocked` (036), právní drafty, inquiry_events, archive cron, PRD v3.21 |
| 2026-07-09 | [2026-07-09.md](./2026-07-09.md) — SEO (JSON-LD, sitemap, robots, llms.txt), datum Vytvořeno na HP a detailu, PRD v3.20 |
| 2026-07-08 | [2026-07-08.md](./2026-07-08.md) — Site Notice lišta (3 varianty, env override), PRD v3.19, Metodika §13 |
| 2026-07-07 | [2026-07-07.md](./2026-07-07.md) — migrace 025–032, testy editace ✅, UX redirectů, AI hydratace, strip ceny vs. telefon |
| 2026-07-03 | [2026-07-03.md](./2026-07-03.md) — AI moderace, strukturovaný popis, limit 2000 znaků |
| 2026-06-29 (večer) | [2026-06-29-vecer.md](./2026-06-29-vecer.md) — fotky, komprese, galerie |
| 2026-06-29 | [2026-06-29.md](./2026-06-29.md) — auth, homepage, slug URL |
| 2026-06-27 | [2026-06-27.md](./2026-06-27.md) |

## Odkazy

- Kanónický dokument: [`docs/PRD_v3.md`](../docs/PRD_v3.md)
- Repo: https://github.com/Radek1645/HobbyUserMarket
