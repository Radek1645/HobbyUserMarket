# TO-DO — další seance (smoke produkce)

> **Odloženo:** 2026-07-26 → spustit v **příští seanci**  
> **Po:** hard stop (**055–057**), FAQ/audit/poznámky (**058–061**), Edge `moderate-listing`  
> **PRD:** v3.45 · snapshot [`Stav_projektu/2026-07-26.md`](../Stav_projektu/2026-07-26.md)  
> **Poznámka:** H4/H6/H7 už ověřeno na localhost; na produkci znovu jen pokud chceš jistotu.  
> **Aktualizace 2026-07-28:** priorita **„formulář má vždy pravdu“** (§ A).  
> **Aktualizace 2026-07-30:** § B dětské zboží; § C počet poptávek; § D Půjčovna.

Zaškrtávej `[x]` přímo v tomto souboru.

---

## A. Priorita příští seance — formulář má vždy pravdu

**Nález (2026-07-28):** U události se ve formuláři změnil **čas konání**. V textu inzerátu zůstal starý čas → AI inzerát **zamítla** (neshoda text ↔ formulář). Stejný typ problému už byl u **ceny** (formulář vs. text).

**Pravidlo k implementaci:**
- Hodnoty z formuláře (`eventDate`, cena/`priceType`/`priceAmount`, lokalita, stav, kategorie…) jsou **autoritativní**.
- AI **nesmí REJECTED** jen proto, že volný text popisuje jinou cenu/čas než formulář.
- Při hydrataci má AI (nebo server) do `cleanedDescription` / Parametrů **přepsat** údaj z formuláře; starý údaj v textu ignorovat nebo nahradit.
- Dotazník / NEEDS_QUESTIONS se na tyto formulářová pole **neptá**, pokud jsou vyplněná.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| F1 | Prompt + server: datum/čas akce z formuláře má přednost před textem | Změna `eventDate` ve formuláři → publikace OK i při starém čase v popisu; výstupní text bere čas z formuláře | ☐ |
| F2 | Stejná logika pro cenu (a případně lokalitu) — sjednotit s existující `applyFormPrice…` | Neshoda text ↔ formulář ≠ REJECTED | ☐ |
| F3 | Manuální smoke: událost — upravit čas ve formuláři, nechat starý čas v popisu, publikovat | Schváleno / publikováno; v popisu nový čas | ☐ |

Související kód (orientačně): `build-user-prompt.ts`, `build-prompt.ts`, `parse-response.ts` (`applyFormPriceToCleanedDescription`), Edge `moderate-listing`.

---

## B. Priorita — dětské zboží: věk / výška dítěte

**Požadavek (2026-07-30):** Pokud AI/server rozpozná **dětské zboží** (např. kolo, oblečení, boty, kočárek, hračka…) a v textu ani na fotkách **není věk ani výška dítěte** (ani ekvivalent typu velikost 98 / věkové pásmo), má se na to **dopťat** (NEEDS_QUESTIONS). Hlavně kategorie **zboží** a **móda**.

**Pravidla:**
- 1 nepovinná otázka — stačí věk **nebo** výška (např. „Pro jaký věk / výšku dítěte je věc vhodná?“; `paramLabel`: „Věk / výška“).
- U dětských bot může zůstat stávající přesnější otázka na délku stélky; věk/výška se neptá zbytečně dvakrát, pokud už je stélka/velikost jasná.
- **Nezamítat** — jen doplňující otázka.
- Neptat se u nejasného „dětského stylu“ pro dospělé; detekce musí být zjevná (dětské / pro dítě / dětská velikost…).

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| D1 | Prompt + `required-category-questions` (zboží / móda) | Dětské kolo/oblečení bez věku/výšky → NEEDS_QUESTIONS s 1 otázkou | ☐ |
| D2 | Když je věk/výška/velikost už v textu | Otázku nepřidávat | ☐ |
| D3 | Manuální smoke: dětské kolo bez věku; dětské kolo „pro 6–9 let“ | První se zeptá; druhé APPROVED bez otázky na věk | ☐ |

Související: `required-category-questions.ts`, `categories.ts` (`moda-obleceni`, sport/kola), `build-prompt.ts`.

---

## C. Priorita — počet poptávek u „Moje inzeráty“

**Požadavek (2026-07-30):** Po přihlášení na `/moje-inzeraty` ukazovat u každého inzerátu nejen **zobrazení** (`view_count`), ale i počet **zaslaných poptávek přes web**, ať majitel ví, že má kouknout do mailu.

**Stav dat (už existuje):**
- Tabulka `inquiry_events` (033) — metadata poptávky (`post_id`, IP, `delivered`, čas); **bez obsahu zprávy**.
- Po úspěšném odeslání Resendem se nastaví `delivered = true`.
- Majitel už má RLS SELECT na `delivered = true` u svých inzerátů (`inquiry_events_select_post_owner`).
- Nová tabulka není nutná — stačí agregovat `count(*)` per `post_id` kde `delivered = true`.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| Q1 | Na `/moje-inzeraty` načíst počet doručených poptávek per inzerát | Vedle zobrazení např. `· 3 poptávky` (čeština skloňování) | ☐ |
| Q2 | Copy / UX | Nápověda, že detaily jsou v e-mailu (poptávky se v appce nearchivují) | ☐ |
| Q3 | Manuální smoke | Odeslat poptávku → u majitele se počet +1; nedoručený pokus (`delivered=false`) se nepočítá | ☐ |

Související: `src/app/moje-inzeraty/page.tsx`, `supabase/033_inquiry_events.sql`, `/api/inquiry`.

---

## D. Priorita — nová sekce „Půjčovna“

**Požadavek (2026-07-30):** Nová hlavní kategorie / sekce **Půjčovna** (pronájem věcí). Formulář a taxonomie se ještě doladí; základ vychází z **Zboží**, ale **bez** nevhodných podkategorií (oblečení/móda, domácí potraviny a podobné „spotřební“ věci).

**K návrhu v příští seanci:**
- Scope: co se půjčuje (nářadí, sport, elektronika, kočárky, auta…?) vs. co ne (oblečení, potraviny, spotřební zboží).
- Formulář: vycházet ze Zboží; odlišit cenu (Kč/den? kauci? dobu zapůjčení?), stav věci, lokalita předání.
- Hydratace / AI: CTA a Parametry specifické pro půjčení (ne „prodejci“).
- Navigace, filtry homepage, SEO, sitemap — nový `categoryType`.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| R1 | Produktový návrh: seznam podkategorií Půjčovny (subset / adaptace Zboží) | Odsouhlasený katalog slugů | ☐ |
| R2 | Formulář + typy ceny / kaucí | Wireframe nebo config draft | ☐ |
| R3 | Implementace taxonomie + create/edit + AI prompt | Až po R1/R2 | ☐ |

Související: `src/config/categories.ts`, listing formulář, SEO Bible / Metodika (až při implementaci).

---

## 0. Před testy

- [ ] Vercel build `main` zelený
- [ ] Otevřít produkci `https://zapikolou.cz` (ne localhost)
- [ ] Edge secrets: `CRON_SECRET` (= Vercel) + `SITE_URL=https://zapikolou.cz`

---

## 1. Hard stop / blacklist (priorita)

| # | Scénář | Jak | Očekávání | ✓ |
|---|--------|-----|-----------|---|
| H1 | Hard reject hláška | Inzerát s hard-hit textem (1×) | Dialog: porušení podmínek + kontakt `info@…`; účet dál funguje | ☐ |
| H2 | NSFW reject | Fotka nad prahem (nebo 2. hard-hit) | Reject + evidence; stále bez blacklistu | ☐ |
| H3 | Auto hard stop 3×/24h | 3. hard reject na test účtu | Redirect `/ucet-pozastaven`; řádek v `account_blacklist` (`automatic`); aktivní inzeráty `blocked` + `account_blacklist` | ☐ |
| H4 | E-mail hard stop | Po H3 (nebo ruční add) | Mail „Účet … byl pozastaven“ (Resend / schránka) | ☑ localhost |
| H5 | Gate | Přihlášený blacklisted → jiná URL | Redirect na `/ucet-pozastaven`; odhlášení funguje | ☐ |
| H6 | Unban + obnova | `/mod/blacklist` → Odebrat + důvod | Účet OK; inzeráty z hard stopu znovu `active`; mail o obnově | ☑ localhost |
| H7 | Ruční blacklist | Staff přidá cizí e-mail + důvod | `source=manual`; stejný gate + mail | ☑ localhost (hide 5 / restore 5 po 057) |

SQL rychlá kontrola:

```sql
SELECT blacklist_no, email, source, reason, removed_at
FROM public.account_blacklist
ORDER BY created_at DESC
LIMIT 10;
```

---

## 2. Zbytek (053 / 052) — pokud zbude čas

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| T1 | Badge **Podnikatel** | Štítek u firmy | ☐ |
| T2 | Milník **5+** | `Aktivní inzerent · 5+` | ☐ |
| T4 | `/uzivatel/[nickname]` | Grid aktivních | ☐ |
| V1 | View count | Anonymní view navýší (dedup 24 h) | ☐ |
| V2 | Majitel nepočítá | Vlastní detail `view_count` nestoupá | ☐ |

---

## 3. Smoke 047 — zbývající

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| A6 | Poptávka Práce: PDF/JPG OK; falešné `.pdf` | Platná OK; falešná → chyba | ☐ |
| B1–B4 | SQL RLS (ico / payment / renew / expires) | `42501` | ☐ |
| B5 | UI prodloužení | `renew_count` +1 | ☐ |
| D1 | `/llms.txt` s `[` / `]` v titulku | Markdown OK | ☐ |

Detail: [`TO-DO_Fable.md`](./TO-DO_Fable.md) §0 Smoke A–D.

---

## 4. FAQ / audit / poznámky (2026-07-26)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| F1 | `/faq` | Accordion, ≥5 otázek; odkazy VOP/Podmínky fungují; v patičce u **Co je zaPikolou?** | ☐ |
| F2 | Poznámky God Mode | Staff na detailu → **Poznámky** → uložit / edit do 24 h | ☐ |
| F3 | Audit po pauza | Po změně stavu řádek v `audit_events` (`event_type` + actor) | ☐ |
| F4 | CTA „přes web“ | Nový AI inzerát má CTA …zprávu přes web (ne platformu) | ☐ |

---

## Po dokončení

- [ ] Zaškrtnout hotové řádky i ve snapshotu
- [ ] Selhání zapsat níže (URL / nickname / konzole)

## Poznámky / selhání

_Sem zapiš URL inzerátu / nickname / chybu z konzole._
