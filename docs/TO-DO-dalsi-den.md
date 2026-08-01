# TO-DO — další seance (smoke produkce)

> **Odloženo:** 2026-07-26 → spustit v **příští seanci**  
> **Po:** hard stop (**055–057**), FAQ/audit/poznámky (**058–061**), Edge `moderate-listing`  
> **PRD:** v3.45 · snapshot [`Stav_projektu/2026-07-26.md`](../Stav_projektu/2026-07-26.md)  
> **Poznámka:** H4/H6/H7 už ověřeno na localhost; na produkci znovu jen pokud chceš jistotu.  
> **Aktualizace 2026-07-28:** priorita **„formulář má vždy pravdu“** (§ A).  
> **Aktualizace 2026-07-30:** § B dětské zboží; § C počet poptávek; § D Půjčovna; § E downscale fotek pro AI.  
> **Aktualizace 2026-07-31:** § F přejmenování „Kola a sport“ → „Sport“; § G smazání zboží — prodáno na zaPikolou?.  
> **Aktualizace 2026-08-01:** § H Category SEO — plán hierarchických výpisů (narůstá; zatím neimplementováno); § I lokalita na kartách bez ulice.  
> **§ A hotovo (2026-08-01):** F1–F3 + TZ `Europe/Prague`; modal vs. formulář záměrně neřešen ([Metodika](./Metodika.md) §6.8.1).  
> **§ B hotovo (2026-08-01):** D1–D3 — dětské zboží otázka Věk / výška.  
> **§ C hotovo (2026-08-01):** Q1–Q4 — počet poptávek na `/moje-inzeraty` + God Mode.  
> **§ F hotovo (2026-08-01):** label „Sport“, slug `kola-sport` beze změny.

Zaškrtávej `[x]` přímo v tomto souboru.

---

## A. Priorita příští seance — formulář má vždy pravdu

> **Vyřešeno (2026-08-01).** Prompt + Edge rewrite (`eventDate` / cena / lokalita); formátování času `Europe/Prague`. Smoke F3 OK.
**Nález (2026-07-28):** U události se ve formuláři změnil **čas konání**. V textu inzerátu zůstal starý čas → AI inzerát **zamítla** (neshoda text ↔ formulář). Stejný typ problému už byl u **ceny** (formulář vs. text).

**Pravidlo k implementaci:**
- Hodnoty z formuláře (`eventDate`, cena/`priceType`/`priceAmount`, lokalita, stav, kategorie…) jsou **autoritativní**.
- AI **nesmí REJECTED** jen proto, že volný text popisuje jinou cenu/čas než formulář.
- Při hydrataci má AI (nebo server) do `cleanedDescription` / Parametrů **přepsat** údaj z formuláře; starý údaj v textu ignorovat nebo nahradit.
- Dotazník / NEEDS_QUESTIONS se na tyto formulářová pole **neptá**, pokud jsou vyplněná.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| F1 | Prompt + server: datum/čas akce z formuláře má přednost před textem | Změna `eventDate` ve formuláři → publikace OK i při starém čase v popisu; výstupní text bere čas z formuláře | ☑ kód |
| F2 | Stejná logika pro cenu (a případně lokalitu) — sjednotit s existující `applyFormPrice…` | Neshoda text ↔ formulář ≠ REJECTED | ☑ kód |
| F3 | Manuální smoke: událost — upravit čas ve formuláři, nechat starý čas v popisu, publikovat | Schváleno / publikováno; v popisu nový čas | ☑ (+ TZ Europe/Prague) |

Související kód (orientačně): `build-user-prompt.ts`, `build-prompt.ts`, `parse-response.ts` (`applyFormPriceToCleanedDescription`), Edge `moderate-listing`.

---

## B. Priorita — dětské zboží: věk / výška dítěte

> **Vyřešeno (2026-08-01).** Prompt + `required-category-questions`; smoke D3 OK.
**Požadavek (2026-07-30):** Pokud AI/server rozpozná **dětské zboží** (např. kolo, oblečení, boty, kočárek, hračka…) a v textu ani na fotkách **není věk ani výška dítěte** (ani ekvivalent typu velikost 98 / věkové pásmo), má se na to **dopťat** (NEEDS_QUESTIONS). Hlavně kategorie **zboží** a **móda**.

**Pravidla:**
- 1 nepovinná otázka — stačí věk **nebo** výška (např. „Pro jaký věk / výšku dítěte je věc vhodná?“; `paramLabel`: „Věk / výška“).
- U dětských bot může zůstat stávající přesnější otázka na délku stélky; věk/výška se neptá zbytečně dvakrát, pokud už je stélka/velikost jasná.
- **Nezamítat** — jen doplňující otázka.
- Neptat se u nejasného „dětského stylu“ pro dospělé; detekce musí být zjevná (dětské / pro dítě / dětská velikost…).

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| D1 | Prompt + `required-category-questions` (zboží / móda) | Dětské kolo/oblečení bez věku/výšky → NEEDS_QUESTIONS s 1 otázkou | ☑ kód |
| D2 | Když je věk/výška/velikost už v textu | Otázku nepřidávat | ☑ kód |
| D3 | Manuální smoke: dětské kolo bez věku; dětské kolo „pro 6–9 let“ | První se zeptá; druhé APPROVED bez otázky na věk | ☑ |

Související: `required-category-questions.ts`, `categories.ts` (`moda-obleceni`, sport/kola), `build-prompt.ts`.

---

## C. Priorita — počet poptávek u „Moje inzeráty“

> **Vyřešeno (2026-08-01).** Počet doručených poptávek na `/moje-inzeraty` + God Mode; smoke Q3 OK.
**Požadavek (2026-07-30):** Po přihlášení na `/moje-inzeraty` ukazovat u každého inzerátu nejen **zobrazení** (`view_count`), ale i počet **zaslaných poptávek přes web**, ať majitel ví, že má kouknout do mailu.

**Stav dat (už existuje):**
- Tabulka `inquiry_events` (033) — metadata poptávky (`post_id`, IP, `delivered`, čas); **bez obsahu zprávy**.
- Po úspěšném odeslání Resendem se nastaví `delivered = true`.
- Majitel už má RLS SELECT na `delivered = true` u svých inzerátů (`inquiry_events_select_post_owner`).
- Nová tabulka není nutná — stačí agregovat `count(*)` per `post_id` kde `delivered = true`.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| Q1 | Na `/moje-inzeraty` načíst počet doručených poptávek per inzerát | Vedle zobrazení např. `· 3 poptávky` (čeština skloňování) | ☑ kód |
| Q2 | Copy / UX | Nápověda, že detaily jsou v e-mailu (poptávky se v appce nearchivují) | ☑ kód |
| Q3 | Manuální smoke | Odeslat poptávku → u majitele se počet +1; nedoručený pokus (`delivered=false`) se nepočítá | ☑ |
| Q4 | God Mode `/mod/inzeraty` + `/mod/karantena` | Stejný počet doručených poptávek ve sloupci Poptávky | ☑ kód |

Související: `src/app/moje-inzeraty/page.tsx`, `src/lib/mod/get-mod-listings.ts`, `supabase/033_inquiry_events.sql`, `/api/inquiry`.

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

## E. Priorita — staging a menší AI varianty fotek

**Implementace (2026-07-31):** Originály po klientské Storage kompresi (max. 1920 px / 1 MB) se nahrají **jednou** do privátního bucketu `moderation-image-staging`. Autentizovaná Next.js Server Action stáhne originál a přes Sharp uloží hash-addressed WebP varianty do service-role-only bucketu `moderation-image-renditions`:

- Gemini / hydratace: **všechny fotky 1024 px**, kvalita 80 — technické štítky často nejsou na hlavní fotce;
- Sightengine: všechny fotky 512 px, kvalita 80.

Edge nezávisle stáhne originál, spočítá SHA-256 pro SEC-H02 a varianty načte podle tohoto hashe. Klientské hashe ani klientský downscale nejsou autoritativní a uživatel nemá přístup k rendition bucketu. Staging objekty uživatel nesmí UPDATE ani DELETE. Při publikaci Server Action zkopíruje stejné bajty do `post-images`; publish gate znovu ověří hashe, pořadí i hlavní fotku. Originály i dočasné varianty čistí denní cron po 24 hodinách.

**Nasazení (2026-07-31):** migrace `067` + `068` spuštěny; Next.js/Vercel z pushi; Edge `moderate-listing` po sync. Supabase Image Transformations nejsou potřeba; resize = Sharp na Vercelu.

### Manuální ověření (I5) — co vidět v Network

DevTools → **Network** → filtr `Fetch/XHR`. Scénář: **Upravit inzerát** (bez změny fotek stačí) → **Publikovat / Uložit**.

| Kdy (pořadí) | Co hledat | Úspěch | Selhání |
|--------------|-----------|--------|---------|
| 1. Hned po kliku (před AI modalem) | POST na stejný origin webu — **Server Action** Sharp (`prepareModerationImageRenditions`; v Next často jako POST na `/inzerat/.../upravit` nebo RSC action, status **200**) | Bez chybové hlášky „Fotky se nepodařilo připravit…“ | 500 / text o chybějícím service role |
| 2. Hned potom | `moderate-listing` (Supabase Functions URL, `functions/v1/moderate-listing`) — **1. volání** (náhled, bez `issueApproval`) | **200**, JSON se `status` `APPROVED` / `NEEDS_QUESTIONS` | **503** + `IMAGE_RENDITION_MISSING` / `IMAGE_RENDITION_INVALID` |
| 3. Po potvrzení v AI modalu | Stejný `moderate-listing` — **2. volání** (`issueApproval: true`) | **200** + `approvalToken` | Stejné chyby jako výše, nebo obsahové `REJECTED` |
| 4. Po tokenu | Server Action create/update listing | Redirect / inzerát `active` | Zůstane koncept / mismatch |

**Nejjistější krátký důkaz (mimo „inzerát se uložil“):**

1. Network: úspěšná Sharp Server Action (**200**) + úspěšné obě `moderate-listing` (**200**).
2. Supabase Storage → bucket `moderation-image-renditions` → `{userId}/{sha256}/` obsahuje **`gemini.webp`** a **`sightengine.webp`**.
3. Při editaci **bez nové fotky** staging bucket může zůstat prázdný (originály jdou z `post-images`) — to je OK.
4. Při **nové fotce** krátce vznikne objekt ve `moderation-image-staging`; po úspěšné publikaci zmizí (nebo ho uklidí cron do 24 h).

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| I1 | Privátní immutable staging + přímý upload z klienta | Originál se z prohlížeče přenese jen jednou; bez base64 JSON | ☑ kód |
| I2 | Sharp Server Action + Edge: hash-addressed varianty 1024/512 px | Edge odvodí cestu varianty z vlastního hashe originálu; SEC-H02 zůstává nad plnými bajty | ☑ kód |
| I3 | Publish: staging → finální Storage + autoritativní re-hash | Jiný obsah, pořadí nebo hlavní fotka → publish selže | ☑ kód |
| I4 | Retence stagingu | Úspěšně použité objekty ihned smazat; opuštěné po 24 h cronem | ☑ kód |
| I5 | Manuální smoke (edit OK; create s fotkami) | Network Sharp + `moderate-listing` 200; WebP v `moderation-image-renditions` | ☐ |
| I6 | Negativní security smoke | Cizí path / výměna objektu / změna pořadí nebo hlavní fotky neprojde | ☐ |

Související: `067_moderation_image_staging.sql`, `068_moderation_image_renditions.sql`, `moderation-images.ts`, `prepare-moderation-images.ts`, `load-storage-images.ts`, `listing-images.ts`, `moderate-listing`, `publish_approved_post`.

---

## F. Priorita — přejmenovat „Kola a sport“ → „Sport“

> **Vyřešeno (2026-08-01).** UI label **Sport**; slug `kola-sport` ponechán (bez migrace DB / SEO). Sync AI není nutný — katalog promptů používá slugy, ne labely.

**Požadavek (2026-07-31):** Label podkategorie `kola-sport` dnes zní **„Kola a sport“** a evokuje hlavně kola, ne celou sportovní doménu. Přepsat na **„Sport“**.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| S1 | UI label v `categories.ts` (+ tipy / placeholdery, pokud zmiňují „Kola a sport“) | Všude viditelné jméno **Sport** | ☑ |
| S2 | Rozhodnout slug: nechat `kola-sport`, nebo migrace na `sport` | Bez rozbití existujících inzerátů / filtrů / SEO | ☑ nechat `kola-sport` |
| S3 | Sync AI promptů (`npm run sync:moderation`) + Metodika / FAQ, pokud label citují | Konzistence UI ↔ AI ↔ docs | ☑ N/A (slugy; FAQ label necituje) |

Související: `src/config/categories.ts` (`slug: "kola-sport"`), případně `listing-form-tips.ts`, `create-listing-guide.ts`.

---

## G. Priorita — při smazání zboží: „Prodáno na zaPikolou?“

**Požadavek (2026-07-31):** Teď je jen nativní `confirm` („Opravdu smazat…“). U kategorie **zboží** nahradit vlastním pop-upem s volbou důvodu smazání — hlavně jestli věc **prodal na platformě** (užitečné pro metriky / úspěšnost). U služeb, práce, událostí, nemovitostí to dává malý smysl → nechat jednoduché potvrzení.

**Návrh UX:**
- Zelené tlačítko: **Prodáno na zaPikolou**
- Druhé tlačítko: **Jiné** (neprodáno / prodáno jinde / už nechci inzerovat…)
- Volitelně později: krátký výběr u „Jiné“, teď stačí 2 cesty
- Po výběru smazat jako dnes (`status = deleted`); důvod uložit (nový sloupec / `status_reason_code` / audit)

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| X1 | Custom dialog místo `window.confirm` u zboží | 2 tlačítka: Prodáno na zaPikolou / Jiné | ☐ |
| X2 | Ostatní kategorie | Stávající jednoduché potvrzení (nebo stejný dialog bez „prodáno“) | ☐ |
| X3 | Persistovat důvod smazání | Lze spočítat „prodeje přes platformu“ | ☐ |

Související: `MyListingActions.tsx`, `deleteListing` v `listing-management.ts`.

---

## H. Priorita (plán) — Category SEO / kategoriální výpisy

**Stav (2026-08-01):** Pravidla zamčená v [`seo/CATEGORY_SEO.md`](./seo/CATEGORY_SEO.md) v1.0; index vrstev [`seo/README.md`](./seo/README.md); PRD v3.53 §5.1 = **PLÁN (zatím neimplementováno)**. `SEO_BIBLE.md` beze změny (detail inzerátu).

**Co to znamená:** kategorie přestanou být jen filtr na HP (`?kategorie=`) a stanou se indexovatelnými landing pages. Taxonomie v `categories.ts` zůstává; přibude SEO vrstva (URL + copy + `index_status`).

**Rozhodnuto (neřešit znovu):**
- URL: `/{lokalita}/{kategorie}/{filtr}/` — **bez** prefixu `/kategorie/`
- Index při ≥ 3 aktivních inzerátech; z indexu dolů až po **14 dnech** pod prahem (hystereze)
- `generateMetadata` čte hotový `index_status` z DB — nepočítá hysterezi za běhu
- Popisy kategorií: jednorázová AI + ruční top ~20; uložené v DB, ne per-request
- 0 inzerátů u sezónních = `noindex`, ne `301`

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| CSEO1 | Produktový řez: které slugy z `categories.ts` dostanou veřejnou stránku jako první (kombinovaný/lokalizovaný tier) | Seznam prioritních kategorií + lokalit | ☐ |
| CSEO2 | Návrh datového modelu: SEO pole u kategorie (`description`, meta, `index_status`, `below_threshold_since`) vs. ponechání taxonomie v `categories.ts` | Draft migrace / tabulka — bez konfliktu s PRD §3 „kategorie jen v configu“ | ☐ |
| CSEO3 | Routing sketch Next.js pro `/{lokalita?}/{kategorie}/{filtr?}` | Neambivalentní segmenty (město vs. kategorie) | ☐ |
| CSEO4 | Implementace checklistu CATEGORY_SEO §7 | Až po CSEO1–CSEO3 — URL, práh, hystereze, canonical/`page=N`, copy, breadcrumbs, interní linky | ☐ |

Související: [`seo/CATEGORY_SEO.md`](./seo/CATEGORY_SEO.md), [`seo/README.md`](./seo/README.md), PRD §5.1 (v3.53), `src/config/categories.ts`, HP `?kategorie=`.

---

## I. Priorita — lokalita na kartách: město / obec, ne ulice

**Nález (2026-08-01):** Na HP kartě se zobrazuje např. **„Sedláčkova, Brno - Líšeň“**. Ulice je moc velký detail (soukromí + zbytečný clutter). Stačí **město / obec**, případně městská část — tady **„Brno - Líšeň“**.

**Proč to tam je teď:** `ListingCard` volá `formatPublicListingLocation` — ta **záměrně nechá ulici** a jen ořízne číslo popisné. Kompaktní varianta už existuje: `formatHeaderLocation` / `formatMetaTitleLocality` (typicky poslední část po čárce = obec). Meta title už ulici nepoužívá; karta a detail ji pořád ukazují.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| L1 | Karty HP / výpisy: lokalita bez ulice | `Sedláčkova, Brno - Líšeň` → `Brno - Líšeň` (nebo ekvivalent z Mapy.cz) | ☐ |
| L2 | Rozhodnout detail inzerátu | Stejná granularita jako karta, nebo na detailu o něco víc? (návrh: stejně bez ulice) | ☐ |
| L3 | Sjednotit helpery / docs | Jedna funkce pro „veřejná lokalita“; SEO bible §3.2 už obec/město vyžaduje | ☐ |

Související: `ListingCard.tsx`, `format-public-location.ts`, detail `inzerat/[slug]/page.tsx`, případně `moje-inzeraty` (majitel může vidět plnou adresu — rozhodnout zvlášť).

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
