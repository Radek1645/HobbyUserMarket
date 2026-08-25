# TO-DO — další seance (smoke produkce)

> **Odloženo:** 2026-07-26 → spustit v **příští seanci**  
> **Po:** hard stop (**055–057**), FAQ/audit/poznámky (**058–061**), Edge `moderate-listing`  
> **PRD:** v3.45 · snapshot [`Stav_projektu/2026-07-26.md`](../Stav_projektu/2026-07-26.md)  
> **Poznámka:** H4/H6/H7 už ověřeno na localhost; na produkci znovu jen pokud chceš jistotu.  
> **Aktualizace 2026-07-28:** priorita **„formulář má vždy pravdu“** (§ A).  
> **Aktualizace 2026-07-30:** § B dětské zboží; § C počet poptávek; § D Půjčovna; § E downscale fotek pro AI.  
> **Aktualizace 2026-07-31:** § F přejmenování „Kola a sport“ → „Sport“; § G smazání zboží — prodáno na zaPikolou?.  
> **Aktualizace 2026-08-01:** § H Category SEO — plán hierarchických výpisů; § I lokalita na kartách bez ulice.  
**Aktualizace 2026-08-06:** § H CSEO1–3 odsouhlaseno (Vlna 1 = 1A goods-only; CATEGORY_SEO v1.1 + WAVE1); CSEO4 kód (migrace `072`, route, cron).  
> **§ A hotovo (2026-08-01):** F1–F3 + TZ `Europe/Prague`; modal vs. formulář záměrně neřešen ([Metodika](./Metodika.md) §6.8.1).  
> **§ B hotovo (2026-08-01):** D1–D3 — dětské zboží otázka Věk / výška.  
> **§ C hotovo (2026-08-01):** Q1–Q4 — počet poptávek na `/moje-inzeraty` + God Mode.  
> **§ F hotovo (2026-08-01):** label „Sport“, slug `kola-sport` beze změny.  
> **§ G hotovo (2026-08-03):** exit poll zboží + `posts.deletion_reason` (069).  
> **§ I hotovo (2026-08-03):** veřejná lokalita — obec/město (výjimka událost/nemovitost = + ulice).  
**Aktualizace 2026-08-03:** § J flat kategorie (Fáze 1 IA — bez deštníku Zboží).  
**§ J hotovo (2026-08-04):** `070` + Edge deploy; `071` unaccent. Další IA = Fáze 3–4.  
**§ E I5 hotovo (2026-08-05):** produkční smoke edit — Sharp/`upravit` 200 → 2× `moderate-listing` 200 (~15 s / ~22 s) → `upravit` 303. I6 (negativní) zůstává otevřené.
**Hard stop produkce (2026-08-06):** H1–H3, H5, H8; **H2** NSFW hard gate (`erotica`/`sexual_display`). H4 mail na produkci zůstává.
**Aktualizace 2026-08-08:** § K AI photo-first prefill (zboží) — kód; migrace `074` na Supabase hotova; Edge `suggest-listing-from-photos` nasazen.  
**Aktualizace 2026-08-08:** § L manuální smoke — FB guest funnel C + AI prefill (scénáře k odškrtávání).  
**Aktualizace 2026-08-08:** § L.B5–B8 — kvalita prefill textu (PII, konzistence title/desc, few-shot stabilita, jiná kategorie).  
**Aktualizace 2026-08-08:** § L.B9 — prefill mimo zboží (nemovitost) → nejistá kategorie / ruční podkategorie.
**Aktualizace 2026-08-09:** Prefill lab — `/mod/prefill-lab` + Edge `compare-suggest-from-photos` (staff side-by-side modelů; bez DB). Default A `gemini-3.5-flash-lite`, B `gpt-5.4-nano`.
**Aktualizace 2026-08-10:** Prefill `[DOPLNIT …]` — pod nabídkou, jeden na řádek (prompt + `formatDoplnitPlaceholders` v parse).
**Aktualizace 2026-08-09:** OAuth resume po **Zpět** z Google (cookie + sessionStorage); krokovník + AI/Publikace; C3 + D2 smoke; PRD v3.64. FB ads odloženy — produkční test na mobilu.
**Aktualizace 2026-08-23:** § M `/jak-vytvorit-inzerat` — 5 kroků + prefill, hotovo.  
**Aktualizace 2026-08-22:** krok 0 **Vyfotit** + galerie (Android); HEIC decode; copy „Napíšeme název a popis“ / CTA **Předvyplnit inzerát**; snapshot jen fotek v limitu; PRD v3.74. Edge `suggest-listing-from-photos` **nasazeno**.

Zaškrtávej `[x]` přímo v tomto souboru.

---

## M. Priorita — aktualizovat `/jak-vytvorit-inzerat`

> **2026-08-23.** Copy a mocky sedí s photo-first flow: 5 kroků (prefill → doplnit údaje → kontrola → AI náhled → publikace).

**Co se od té doby změnilo (musí sedět text):**

- Guest draft (`NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED`) — koncept před registrací, publish až po login
- AI photo-first prefill (1–2 fotky → návrh title/desc/kategorie)
- Krokovník / AI náhled / Publikace
- Odhalení kontaktu až po přihlášení; poptávka e-mailem
- Odkazy na `/vop`, `/podminky-inzerce`, `/co-je-zapikolou` kde dává smysl

| # | Úkol | ✓ |
|---|------|---|
| M1 | Projít live `/inzerat/novy` (host + přihlášený) a sepsat skutečné kroky | ☑ 2026-08-23 |
| M2 | Přepsat copy / sekce na `/jak-vytvorit-inzerat` (config + stránka) | ☑ 2026-08-23 — 5 kroků, krok 0 prefill |
| M3 | Kontrola SEO meta (title/description) a odkazů z patičky / FAQ | ☑ 2026-08-23 |

---

## L. Priorita — smoke FB funnel C + AI prefill

> **2026-08-08.** Manuální průchod před ads switch. Flag C: `NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED=true`. Prefill: `SUGGEST_FROM_PHOTOS_ENABLED`. Migrace `073` + `074`, Edge `moderate-listing` + `suggest-listing-from-photos`, Turnstile. Testuj v anonymním okně. Detail: [`fb-promo-campaign.md`](./fb-promo-campaign.md).

**Minimum před ads:** A1, A3, C3, D1, B1, **B5, B6** (kvalita textu).  
**Localhost 2026-08-09:** A1–A3, B1–B7/B9, C3, D2 hotovo; zbývá hlavně **D1** (explicitně FAB/header copy), Pixel **E3/E4**, produkční mobil.  
**Rychlý smoke po 076 / Prefill lab (2026-08-10):** T2 + T3 ✅ localhost; zbývá **T1** (Prefill lab).

**Doporučené pořadí:** B1 → **B5 → B6 → B7** → A1 → A3 → B2/B3a → C3 → D1/D2 → (A2, B8) → E3/E4.

### A. Happy path — host z FB (prefill → login → publish)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| A1 | Host `/inzerat/novy` → 1–2 fotky zboží → AI prefill → doplnit cenu/stav/lokalitu → AI náhled → Publikovat → **Google** OAuth → onboarding (VOP/věk už z registrace) → resume | Krok 0 guest UI; po prefillu title/desc/cat, **cena prázdná**; bez auth nejde publish; draft v localStorage; po OAuth `/inzerat/novy?resume=1` → aktivní inzerát `?published=<id>`; hlavní fotka = zvolená; Pixel ListingPublished 1× | ☑ 2026-08-08 + **2026-08-09** (Google Zpět → správný účet → resume OK; Opel Zafira) |
| A2 | Stejné jako A1, ale **e-mail** registrace + verify odkaz **v nové kartě** | Draft přežije (localStorage); po verify resume → publish; fotky/text beze ztráty | ☑ 2026-08-08 (Buddha 25b5; captcha + e-mail verify + onboarding Parak) |
| A3 | Host prefill → Publikovat → přihlásit **existující** hotový účet | `next` + resume; publish bez znovu VOP/věku; jeden inzerát (ne duplicita) | ☑ 2026-08-08 (potvrzeno) |

### B. Prefill (nová úprava + kvalita textu)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| B1 | **Přihlášený** → `/inzerat/novy` → 1–2 fotky → AI prefill → doplnit → AI → Publikovat | Prefill krok 0 (ne guest copy); title/desc/cat, cena prázdná; publish **hned** bez login redirectu | ☑ 2026-08-08 (Tlapková patrola Rocky) |
| B2 | „Vyplnit inzerát ručně“ (host i přihlášený) | Klasický výběr kategorie; **žádné** volání `suggest-listing-from-photos`; host: publish→login; přihlášený: publish hned | ☑ 2026-08-08 (přihlášený + host: resume→login→publish pod hory_99) |
| B3a | NSFW fotka u prefillu | Chyba NSFW + CTA pokračovat ručně; app nepadá | ☑ 2026-08-08 (erotica 0.99 / sexual_display 0.97 → reject UI) |
| B3b | Soft rate limit prefill (host) | Turnstile / captcha; po limitu zpráva + manuál dostupný | ☑ 2026-08-08 (Turnstile při guest AI / A2) |
| B3c | Edge / Gemini down | Technická chyba + manuál; lze dokončit bez prefillu | ☐ |
| B3d | 0 fotek / 3+ fotek | Validace min 1, max 2 | ☑ 2026-08-09 (3+ → warning + první 2; 0 → needPhotos) |
| B4 | Po prefillu změnit kategorii/text → publish | Formulář má pravdu; final AI respektuje formulář (cena/lokalita z formuláře) | ☑ 2026-08-09 (změna kategorie — fotky zůstaly) |
| B5 | **Kvalita draftu (auto bez čitelného modelu)** — 1×: fotky Škoda bez nápisu modelu na kufru | Title obecné (např. „Bílé osobní auto Škoda“), **ne** tipovaný model (Rapid…); description „Nabízím…“; **`Doplňte …:` pod nabídkou, každý na vlastním řádku** (ne slitý seznam; starý `[DOPLNIT …]` se ve formuláři převede); **žádná** výzva ke kontaktu; **žádná SPZ/tel/e-mail**; title ↔ description konzistentní | ☑ 2026-08-08 (Opel…); formát řádků 2026-08-10 (prompt + parse); UI `Doplňte` 2026-08-22 |
| B6 | **Stabilita formátu** — stejné fotky jako B5, **3–4×** po sobě (nový prefill / refresh) | Každý běh splní kritéria B5. Pokud v ≥1/5 běhů „kontaktujte…“ nebo slitý placeholder → fail (flash-lite nedeterminismus); zapsat a řešit | ☑ |
| B7 | **Jiná kategorie** — dětské oblečení **nebo** elektro (1–2 fotky) | Prefill generalizuje: category sedí; nejisté atributy jako oddělené `[DOPLNIT velikost]` / značka atd. (ne automobilový slovník rok/km); bez kontaktu / PII; title bez hádání | ☑ 2026-08-08 (odrážedlo → Sport/Kola; DOPLNIT značka/velikost/materiál) |
| B8 | **Auto s čitelným modelem** na kufru/masce (Octavia, Fabia…) | Title i description mohou obsahovat model; **ne** `[DOPLNIT typ/model]` zároveň s konkrétním modelem v title | ☐ |
| B9 | **Mimo zboží (nemovitost)** — 1–2 fotky domu / reality (ad-hoc; photo-first je primárně zboží) | Prefill **neuhádne** jistotou špatnou podkategorii: banner „AI navrhla kategorii, ale podkategorie není jistá“ (nebo ekv.); title/desc připravené; uživatel doplní kategorii ručně (např. Služby/práce/reality → nemovitost) | ☑ 2026-08-08 (dům ONYX REALITY → Ostatní + ruční podkategorie; title/desc OK) |

> **Poznámka (2026-08-08):** B5 jednou vyšlo čistě po few-shot v promptu. B6 ověří, jestli formát drží napříč voláními; B7 jestli generalizuje mimo auto. Bez B6/B7 neoznačovat prefill za hotový. B9 = fail-soft mimo closed vocabulary zboží.

### C. Guest funnel bez prefillu (regrese FB)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| C1 | Host ručně (fotky + kategorie) → AI → Publikovat → Google → onboarding → publish | Stejný resume jako A1; aktivní inzerát | ☐ |
| C2 | Soft rate limit guest AI preview (2+/hod) | Captcha; neretryuje donekonečna; srozumitelná chyba | ☐ |
| C3 | Po loginu na `?resume=1` **refresh** uprostřed publish | Jeden inzerát (`publish_request_id`), ne dva | ☑ 2026-08-09 (2× F5; jeden Opel) |
| C4 | Selhání publish (síť / Edge) | Draft/staging obnoven nebo zachován; znovu Publikovat bez ztráty fotek | ☐ |

### D. Přihlášený při flagu C = on (nesmí do guestu)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| D1 | Hotový účet → header/FAB `/inzerat/novy` | Klasický create + prefill; **bez** „účet až při publikaci“ | ☐ |
| D2 | Přihlášený vyplnit → AI → Publikovat | Žádný OAuth/login redirect | ☑ 2026-08-09 (edit Opel / změna ceny → hydratace, bez registrace) |
| D3 | Účet bez přezdívky → `/inzerat/novy` | Onboarding → návrat na create / `?resume=1` | ☐ |
| D4 | Přihlášený bez cizího guest draftu | Žádný claim cizího stagingu | ☐ |

### E. Auth / Pixel kolem FB landingu

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| E1 | Landing A: `/login?next=/inzerat/novy&message=create_listing&tab=register` | Zelený box (profil + 20 inzerátů); po registraci → create | ☐ |
| E2 | Landing C: přímo `/inzerat/novy` | Guest + prefill (site-wide) | ☐ |
| E3 | Nová registrace z funnelu | Pixel CompleteRegistration / `registered=1` jen u **nové** registrace | ☐ |
| E4 | Publish | `ListingPublished` s `published=<postId>`; bez duplicity při refresh | ☐ |
| E5 | Logo / „Zpět“ z onboardingu | HP, bez smyčky login↔onboarding | ☐ |

### T. Rychlý smoke — Prefill lab / 076 / odkazy (2026-08-10)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| T1 | Staff `/mod/prefill-lab` → 1 fotka zboží → Spustit | A i B vrátí title/desc/cat; žádný zápis do `moderation_checks` | ☐ |
| T2 | Host `/inzerat/novy` → AI prefill 1 fotka | Popis: `[DOPLNIT …]` pod nabídkou, 1 na řádek; v DB řádek `moderation_checks` s `intent=suggest_from_photos` a `guest_visitor_id` (ne null) | ☑ 2026-08-10 localhost |
| T3 | Detail aktivního inzerátu → klik kategorie / podkategorie | Goods SEO slug → `/{slug}`; jinak `/?kategorie=…` | ☑ 2026-08-10 localhost |

---

## N. Priorita — OpenAI fallback pro photo-first Prefill

> **Kód 2026-08-25.** Po úspěšném Sightengine zkusí Prefill Gemini a při jeho technickém selhání OpenAI. Rate limit zůstává 1× na request.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| PFB1 | Resolver + sdílený inference wrapper | Gemini primary, OpenAI `gpt-5.4-nano` fallback; chybějící Gemini → OpenAI jako primary | ☑ kód |
| PFB2 | Samostatný časový rozpočet | Request deadline 28 s; Gemini max. 12 s, OpenAI max. 8 s; hydratace/lab dál 25 s | ☑ kód |
| PFB3 | Auditní logování | Vítězný provider/model + `used_fallback`; dvojí selhání `SUGGEST_BOTH_PROVIDERS_FAILED` | ☑ kód |
| PFB4 | Deploy `suggest-listing-from-photos` | Edge v16 ACTIVE; auth-boundary smoke vrací očekávané 401 bez JWT | ☑ 2026-08-25 |
| PFB5 | Smoke všech větví | Gemini OK; fallback OK; OpenAI primary; oba fail; NSFW bez LLM; timeout pod ~30 s | ☑ 2026-08-25 (Gemini, fallback 2×, NSFW; double-fail volitelně ne) |

Související: `resolve-suggest-ai-target.ts`, `run-suggest-listing.ts`, Metodika §5/§6, PRD §5.4.

---

## K. Priorita — AI photo-first prefill (zboží)

> **Kód 2026-08-08.** Flag `SUGGEST_FROM_PHOTOS_ENABLED`. Edge oddělená od `moderate-listing`. Deploy checklist; smoke detaily v § L.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| PRE1 | Migrace `074` na Supabase | enum `suggest_from_photos` | ☑ 2026-08-08 |
| PRE2 | `npm run sync:moderation` + deploy `suggest-listing-from-photos` | Edge 200 na auth request | ☑ 2026-08-08 (potvrzeno) |
| PRE3 | Smoke: 1–2 fotky zboží → prefill title/desc/cat; cena prázdná | → § L B1 / B5–B7 | ☑ → L B1 |
| PRE4 | Manuální CTA → klasický krok kategorie | → § L B2 | ☑ → L B2 |
| PRE5 | NSFW / rate limit → chyba + manuál dostupný | → § L B3a / B3b | ☐ |

Související: [`src/config/suggest-from-photos.ts`](../src/config/suggest-from-photos.ts), Metodika §5 krok 0, PRD v3.61, § L.

**Odloženo (ne teď):**
- Cache Sightengine verdiktu podle image hash (prefill + preview + final dnes volají API znovu na stejné fotky) — dává smysl costově; realizace později. Detail v plánu `ai_photo_prefill`.

**Rozpor 2 fotek (2026-08-08):** Prefill **N/A**. Final pojistka jen u zboží: **dva vzájemně vylučující se hlavní produkty** (2 auta) → REJECTED `scam_fraud`. Set/příslušenství (notebook+myš+nabíječka), nemovitost/udalost ≠ REJECT. Smoke: Zafira+Corsa = REJECT; set / hlavní+detail = ne REJECT.

---

## J. Priorita — flat kategorie (IA Fáze 1)

> **Hotovo 2026-08-03/04.** Kód + migrace `070` na Supabase + Edge `moderate-listing` deploy. Fulltext bez diakritiky: migrace `071` nasazena.

**Rozhodnutí:** 1. patro = Auto / Dětský / Dům / Elektro / Móda / Sport / Hobby / Ostatní + Služby / Práce / Nemovitosti / Události (+ Vše default). Bez Zvířat. Bundle Služby+Práce+Reality a mřížka = Fáze 2.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| CAT1 | `CategoryType` + `categories.ts` / `categories-goods.ts` | 8 zbožových domén + stávající 4 | ☑ |
| CAT2 | Migrace `070` — CHECK + remap `zbozi` → domény | Po apply žádný `category_type = zbozi` | ☑ |
| CAT3 | HP pills + covers + CTA + JSON-LD + exit poll goods | Filtr a formulář bez Zboží | ☑ |
| CAT4 | Sync Edge `category-prompts` | `VALID_CATEGORY_TYPES` bez zbozi | ☑ deploy |
| CAT5 | Mřížka + bundle Služby/Práce/Reality (HP + formulář) | Místo horizontálních pills | ☑ |
| CAT6 | Fulltext bez diakritiky (`071_search_unaccent`) | `beh` najde „běh“ | ☑ |

Související: plán IA, [`src/config/categories-goods.ts`](../src/config/categories-goods.ts), [`supabase/070_flat_goods_categories.sql`](../supabase/070_flat_goods_categories.sql), [`supabase/071_search_unaccent.sql`](../supabase/071_search_unaccent.sql).

**Další IA:** Fáze 3 (date čipy Událostí) · Fáze 4 (progressive disclosure podkategorií).

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
| F4 | Publish gate: stejný okamžik `eventDate` na Edge i v DB (ISO UTC, ne naive datetime-local na Vercel UTC) | Editace události 15:00 CEST projde; v popisu i Parametrech 15:00 | ☑ 2026-08-24 (`hura-do-skoly-v-kavarne-v-rokli-t2e6`) |

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

> **I5 ověřeno na produkci (2026-08-05/06).** Edit inzerátu: `upravit` (Sharp) 200 → 1. `moderate-listing` ~15 s 200 → 2. `moderate-listing` ~22 s 200 → `upravit` 303. Negativní textový smoke: závadný text v AI modalu byl zamítnut s viditelným inline upozorněním; po odstranění textu se inzerát publikoval. I6 (negativní security smoke na fotky / pořadí / cizí path) zatím ne.

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
| I5 | Manuální smoke (edit OK; create s fotkami) | Network Sharp + `moderate-listing` 200; WebP v `moderation-image-renditions` | ☑ produkce 2026-08-05/06 (edit; 2× moderate 200 + redirect 303; negativní text v modalu REJECT, po opravě publikace OK) |
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

> **Vyřešeno (2026-08-03).** Dialog u zboží (Prodáno na zaPikolou / Jiné); ostatní `confirm`; `posts.deletion_reason` (069).
**Požadavek (2026-07-31):** Teď je jen nativní `confirm` („Opravdu smazat…“). U kategorie **zboží** nahradit vlastním pop-upem s volbou důvodu smazání — hlavně jestli věc **prodal na platformě** (užitečné pro metriky / úspěšnost). U služeb, práce, událostí, nemovitostí to dává malý smysl → nechat jednoduché potvrzení.

**Návrh UX:**
- Zelené tlačítko: **Prodáno na zaPikolou**
- Druhé tlačítko: **Jiné** (neprodáno / prodáno jinde / už nechci inzerovat…)
- Volitelně později: krátký výběr u „Jiné“, teď stačí 2 cesty
- Po výběru smazat jako dnes (`status = deleted`); důvod uložit (nový sloupec / `status_reason_code` / audit)

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| X1 | Custom dialog místo `window.confirm` u zboží | 2 tlačítka: Prodáno na zaPikolou / Jiné | ☑ |
| X2 | Ostatní kategorie | Stávající jednoduché potvrzení (nebo stejný dialog bez „prodáno“) | ☑ |
| X3 | Persistovat důvod smazání | Lze spočítat „prodeje přes platformu“ | ☑ kód |

Související: `MyListingActions.tsx`, `deleteListing` v `listing-management.ts`.

---

## H. Priorita (plán) — Category SEO / kategoriální výpisy

> **CSEO1–3 odsouhlaseno (2026-08-06); CSEO4 kód 2026-08-06.** Pravidla [`seo/CATEGORY_SEO.md`](./seo/CATEGORY_SEO.md) **v1.1**; WAVE1 + smoke: [`seo/CATEGORY_SEO_WAVE1.md`](./seo/CATEGORY_SEO_WAVE1.md). Zbývá **apply `072`** na Supabase + deploy.

**Verdikt Vlny 1:** jen celostátní **1A** `/{slug}/` (goods subcategory, slug 1:1 s configem). Lokalita až po objemu (práh ≥ 5). `/{slug}/` nikdy neznamená Události — ty později `/udalosti/…`.

**Rozhodnuto (neřešit znovu):**
- URL cíl: `/{lokalita}/{kategorie}/{filtr}/` — **bez** prefixu `/kategorie/`; **produkce teď = jen `/{kategorie}/`**
- Celostátní index: práh ≥ 3 + hystereze **3 dny nahoru / 14 dní dolů**
- Lokalita: práh ≥ 5 + stejná hystereze; do té doby `noindex` / mimo sitemap
- `generateMetadata` čte hotový `index_status` (+ povinný `listing_count` z denního jobu)
- Popisy: jednorázová AI + ruční top; v DB, ne per-request
- 0 inzerátů u sezónních = `noindex`, ne `301`
- Žádná paralelní SEO taxonomie mimo `categories.ts`

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| CSEO1 | Produktový řez Vlny 1 (1A, priorita 8 slugů, bez lokality) | WAVE1 + CATEGORY_SEO v1.1 | ☑ |
| CSEO2 | Draft datového modelu (`listing_count`, hystereze, taxonomie v configu) | WAVE1 § CSEO2 | ☑ |
| CSEO3 | Routing sketch (goods-only, `/udalosti/`, lokalita noindex) | WAVE1 § CSEO3 | ☑ |
| CSEO4 | Implementace checklistu CATEGORY_SEO §7 | Migrace `072`, `/{slug}/`, cron, sitemap (indexované) | ☑ kód; apply `072` + cron na produkci |

Související: [`seo/CATEGORY_SEO.md`](./seo/CATEGORY_SEO.md), [`seo/CATEGORY_SEO_WAVE1.md`](./seo/CATEGORY_SEO_WAVE1.md), [`seo/README.md`](./seo/README.md), PRD §5.1, `src/config/categories.ts`, HP `?kategorie=`.

---

## I. Priorita — lokalita na kartách: město / obec, ne ulice

> **Vyřešeno (2026-08-03).** Veřejně: zboží/služby/práce = obec/město; **událost + nemovitost** = ulice (bez čísla) + obec. Meta title vždy obec. Majitel na `/moje-inzeraty` plný `location_text`.
**Nález (2026-08-01):** Na HP kartě se zobrazuje např. **„Sedláčkova, Brno - Líšeň“**. Ulice je moc velký detail (soukromí + zbytečný clutter). Stačí **město / obec**, případně městská část — tady **„Brno - Líšeň“**.

**Proč to tam je teď:** `ListingCard` volá `formatPublicListingLocation` — ta **záměrně nechá ulici** a jen ořízne číslo popisné. Kompaktní varianta už existuje: `formatHeaderLocation` / `formatMetaTitleLocality` (typicky poslední část po čárce = obec). Meta title už ulici nepoužívá; karta a detail ji pořád ukazují.

| # | Úkol | Očekávání | ✓ |
|---|------|-----------|---|
| L1 | Karty HP / výpisy: lokalita bez ulice | `Sedláčkova, Brno - Líšeň` → `Brno - Líšeň` (nebo ekvivalent z Mapy.cz) | ☑ (kromě událost/nemovitost) |
| L2 | Rozhodnout detail inzerátu | Stejná granularita jako karta | ☑; výjimka: událost + nemovitost = ulice bez čísla |
| L3 | Sjednotit helpery / docs | Jedna funkce pro „veřejná lokalita“; SEO bible §3.2 | ☑ |

Související: `ListingCard.tsx`, `format-public-location.ts`, detail `inzerat/[slug]/page.tsx`; `/moje-inzeraty` ponechává plný `location_text`.

---

## 0. Před testy

- [ ] Vercel build `main` zelený
- [ ] Otevřít produkci `https://zapikolou.cz` (ne localhost)
- [ ] Edge secrets: `CRON_SECRET` (= Vercel) + `SITE_URL=https://zapikolou.cz`

---

## 1. Hard stop / blacklist (priorita)

| # | Scénář | Jak | Očekávání | ✓ |
|---|--------|-----|-----------|---|
| H1 | Hard reject hláška | Inzerát s hard-hit textem (1×) | Dialog: porušení podmínek + kontakt `info@…`; účet dál funguje | ☑ produkce 2026-08-06 (`CSAM`; rose panel po hard gate) |
| H2 | NSFW reject | Fotka nad prahem (nebo 2. hard-hit) | Reject + evidence; stále bez blacklistu | ☑ produkce 2026-08-06 (`NSFW_IMAGE`; erotica 0.99 / sexual_display 0.97 / sexual_activity 0.66; `ai_provider` null) |
| H3 | Auto hard stop 3×/24h | 3. hard reject na test účtu | Redirect `/ucet-pozastaven`; řádek v `account_blacklist` (`automatic`); aktivní inzeráty `blocked` + `account_blacklist` | ☑ produkce 2026-08-06 (`testhorakradek@…`; 3× hard_hit_text + threshold) |
| H4 | E-mail hard stop | Po H3 (nebo ruční add) | Mail „Účet … byl pozastaven“ (Resend / schránka) | ☑ produkce 2026-08-06 |
| H5 | Gate | Přihlášený blacklisted → jiná URL | Redirect na `/ucet-pozastaven`; odhlášení funguje | ☑ produkce 2026-08-06 |
| H6 | Unban + obnova | `/mod/blacklist` → Odebrat + důvod | Účet OK; inzeráty z hard stopu znovu `active`; mail o obnově | ☑ localhost |
| H7 | Ruční blacklist | Staff přidá cizí e-mail + důvod | `source=manual`; stejný gate + mail | ☑ localhost (hide 5 / restore 5 po 057) |
| H8 | **Kontrola po ~24 h** (od 2026-08-06 večer → **2026-08-07 večer**) | `testhorakradek@…` | 1) Bez unbanu: po přihlášení stále `/ucet-pozastaven` (blacklist **neexpiruje** sám — 24 h je jen okno pro počítání 3 hitů). 2) Staff unban v `/mod/blacklist` → účet OK, inzerát(y) s `account_blacklist` znovu `active`, jde **editovat** / uložit. | ☑ produkce 2026-08-06 (unban hned; inzerát active, viditelný dle polohy Kolín) |

> **Pozn. H8:** Inzerát po H3 zmizel z veřejného výpisu (`blocked` + `status_reason_code = account_blacklist`) — OK. Obnova = unban, ne uplynutí 24 h.

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
| T1 | Badge **Podnikatel** | Štítek u firmy | ☑ produkce 2026-08-06 |
| T2 | Milník **5+** | `Aktivní inzerent · 5+` | ☑ produkce 2026-08-06 |
| T4 | `/uzivatel/[nickname]` | Grid aktivních | ☑ produkce 2026-08-06 (`hory_63` / `meluzina`) |
| V1 | View count | Anonymní view navýší (dedup 24 h) | ☐ |
| V2 | Majitel nepočítá | Vlastní detail `view_count` nestoupá | ☐ |

---

## 3. Smoke 047 — zbývající

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| A6 | Poptávka Práce: PDF/JPG OK; falešné `.pdf` | Platná OK; falešná → chyba | ☐ |
| B1–B4 | SQL RLS (ico / payment / renew / expires) | `42501` | ☐ |
| B5 | UI prodloužení | `renew_count` +1 | ☑ produkce 2026-08-06 (router id 47; `renew_count: 1`, `expires_at` → 2. 10. 2026) |
| D1 | `/llms.txt` s `[` / `]` v titulku | Markdown OK | ☐ |

Detail: [`SECURITY_UX_BACKLOG.md`](./SECURITY_UX_BACKLOG.md) §3 Smoke A–D.

---

## 4. FAQ / audit / poznámky (2026-07-26)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| F1 | `/faq` | Accordion, ≥5 otázek; odkazy VOP/Podmínky fungují; v patičce u **Co je zaPikolou?** | ☑ produkce 2026-08-06 (vč. prokliků) |
| F2 | Poznámky God Mode | Staff na detailu → **Poznámky** → uložit / edit do 24 h | ☑ produkce 2026-08-06 (uložení + úprava) |
| F3 | Audit po pauza | Po změně stavu řádek v `audit_events` (`event_type` + actor) | ☐ |
| F4 | CTA „přes web“ | Nový AI inzerát má CTA …zprávu přes web (ne platformu) | ☐ |

---

## Po dokončení

- [ ] Zaškrtnout hotové řádky i ve snapshotu
- [ ] Selhání zapsat níže (URL / nickname / konzole)

## Poznámky / selhání

_Sem zapiš URL inzerátu / nickname / chybu z konzole._
