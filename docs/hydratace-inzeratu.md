# Hydratace inzerátu — nastavení a úprava AI textu

Dokumentace k AI **hydrataci** (úprava a strukturování popisu) podle PRD §5.4. Hydratace běží ve **stejném volání** Edge Function `moderate-listing` jako bezpečnostní moderace — tento dokument popisuje jen část týkající se textu, dotazníku a uložení výsledku.

> **Stav:** Hydratace je **zapnutá** spolu s moderací (`MODERATION_ENABLED = true`). Vyžaduje deploy Edge Function `moderate-listing` a secret `GEMINI_API_KEY` v Supabase.  
> **Související:** Bezpečnostní filtr, zakázaný obsah a popup zamítnutí → [`moderace-inzeratu.md`](./moderace-inzeratu.md).

---

## Co je hydratace (a co není)

| Hydratace **je** | Hydratace **není** |
|------------------|-------------------|
| Přepsání hrubého nástřelu do srozumitelného textu | Chat s uživatelem po publikaci |
| Struktura **Úvod** + `---` + **Parametry** | Samostatné sloupce v DB pro každý parametr |
| Doplňující otázky (`NEEDS_QUESTIONS`), když chybí kritická data | Povinné vyplnění všech polí ve formuláři před odesláním |
| Využití kategorie, formuláře, fotek a **katalogu u identifikovaného modelu** | Překlad do jiných jazyků |

**Moderace** rozhoduje, zda obsah smí na web (REJECTED). **Hydratace** se spouští jen pokud obsah **není** REJECTED — vrací `APPROVED` nebo `NEEDS_QUESTIONS` s `cleanedTitle` / `cleanedDescription`.

---

## Architektura (stručně)

```
Formulář (název, popis, kategorie, cena, lokalita, fotky…)
    → prepareModerationImages()     … přesné bajty souborů → base64 (SEC-H02)
    → runListingModeration()        … 1. volání (bez issueApproval)
        → Edge Function moderate-listing
            → hard-hit + Sightengine (před Gemini)
            → system prompt (struktura textu + pravidla hydratace + SEO)
            → user prompt (metadata formuláře vč. locationText + category aiPrompt)
            → multimodální AI (text + všechny fotky)
            → parse + filtry formuláře (cena/datum/lokalita) + required questions + safety checks
        → REJECTED          → ModerationRejectedDialog (viz moderace-inzeratu.md)
        → APPROVED / NEEDS_QUESTIONS  (bez approvalToken)
            → ModerationApprovedDialog („Inzerát je v pořádku“)
            → ModerationPreviewDialog („AI náhled a doplnění“)
                → Doplnit, upravit a publikovat
                    → appendQuestionAnswersToDescription()
                → Ignorovat AI a publikovat původní
                → Zrušit
            → 2. volání: moderate-listing(issueApproval: true)
                → znovu kontrola přesného odesílaného textu + fotek
                → approvalToken (fingerprint + SHA-256 fotek)
            → createListing / updateListing → publish_approved_post
```

- Hydratace probíhá **v prohlížeči** přes Supabase SDK — ne přes Next.js API (riziko timeoutu na Vercel).
- První AI volání = bezpečnostní filtr + cross-validace + hydratace + dotazník (náhled). Token vzniká až ve **druhém** volání po potvrzení modalu.

---

## Složky a soubory

| Cesta | Účel |
|-------|------|
| `src/config/categories.ts` | **`aiPrompt`** per kategorie / podkategorie — hlavní páka pro chování hydratace |
| `src/config/moderation/build-prompt.ts` | System prompt — struktura `cleanedDescription`, pravidla NEEDS_QUESTIONS |
| `src/config/moderation/description-length-prompt.ts` | Limity délky vložené do system promptu |
| `src/config/moderation/messages.ts` | Texty modalu „AI náhled a doplnění“ (`MODERATION_PREVIEW_UI`) |
| `src/config/app.ts` | `LISTING_DESCRIPTION_MAX_LENGTH` (2000), `MODERATION_DESCRIPTION_QA_RESERVE` (400) |
| `supabase/functions/_shared/moderation/build-user-prompt.ts` | Sestavení user promptu (formulář + kategorie) |
| `supabase/functions/_shared/moderation/category-prompts.ts` | **Auto-generovaný** z `categories.ts` (sync skriptem) |
| `supabase/functions/_shared/moderation/parse-response.ts` | Parsování JSON, strip kontaktů, filtr otázek o ceně |
| `supabase/functions/_shared/moderation/required-category-questions.ts` | Doplnění povinných otázek dle kategorie po AI |
| `src/lib/moderation/parse-listing-description.ts` | Parsování uloženého popisu na úvod + Parametry |
| `src/lib/moderation/append-question-answers.ts` | Sloučení odpovědí z dotazníku do popisu |
| `src/lib/moderation/format-question-answers.ts` | `paramLabel`, zkrácení otázek, formát km/Kč/m² |
| `src/components/moderation/ModerationPreviewDialog.tsx` | UI náhledu, dotazník, počítadlo znaků, kvalita inzerátu |
| `src/config/listing-quality.ts` | Rubric a copy skóre kvality |
| `src/lib/moderation/listing-quality-score.ts` | Deterministický výpočet skóre + tip |
| `src/components/listing/ListingDescription.tsx` | Zobrazení úvod + Parametry na detailu inzerátu |
| `src/components/listing/CreateListingForm.tsx` | Orchestrace celého flow při Publikovat / Uložit |

---

## Výstupní formát — strukturovaný popis

AI musí vrátit `cleanedDescription` v **pevné struktuře** (system prompt v `build-prompt.ts`):

```
[ÚVOD — až 6 vět: co prodáváte, hlavní výhoda, cena z formuláře, předání]

---

Parametry
• Popisek: hodnota
• Další parametr: hodnota
```

### Pravidla struktury

| Část | Pravidlo |
|------|----------|
| **Úvod** | Až 6 vět, věcně, bez prázdných klišé („Hledáte…?“). **Cena z formuláře** patří sem (např. „Cena 2 000 Kč.“), ne do Parametrů. |
| **Oddělovač** | Prázdný řádek, `---`, prázdný řádek — konstanta `MODERATION_QA_SECTION_SEPARATOR` v kódu |
| **Parametry** | Nadpis `Parametry` (případně legacy `Technické údaje`), odrážky `• Popisek: hodnota` |
| **Zdroje faktů** | Text, fotky, formulář — a u identifikovaného výrobku (**všechny** kategorie zboží) i katalogové vlastnosti s jistotou |

### Synonyma a hledané výrazy (SEO)

Kanonická pravidla: [`seo/SEO_BIBLE.md`](./seo/SEO_BIBLE.md) (v1.9).

Google ignoruje hashtagy (`#baterka`). AI:

- upraví **`cleanedTitle` (H1)** — obecný název první, max ~45 znaků, bez vaty; krátký use-case jen pokud se vejde;
- vyplní **`metaDescription`** (produkt + lokalita + cena + benefit; **bez CTA**; cena jen `za X Kč`) a **`imageAlt`** (bez lokality);
- do **úvodu** popisu zakomponuje 2–3 synonyma + případně spádové město jako **dojezdovou vzdálenost** (bez slibu dovozu; vstup `locationText`).

| Smí | Nesmí |
|-----|--------|
| Střídat názvy téže věci v běžných větách | Hashtagy, seznamy klíčových slov, keyword stuffing |
| Čeština + běžné anglicismy, pokud dávají smysl | Vymýšlet příslušenství v balení / kusové vady jen kvůli klíčovým slovům |
| Katalogové parametry u známého modelu (GPS, WR…) | Hádání nejistých variant (barva, kapacita) |

Pravidla jsou v system promptu (`src/config/moderation/build-prompt.ts`); do Edge: `node scripts/sync-build-prompt.mjs`, pak `npx supabase functions deploy moderate-listing`.

### Příklad po hydrataci (auto, APPROVED)

```
Prodávám Škodu Octavii 1.6 TDI v dobrém technickém stavu. Cena 89 000 Kč, osobní předání v Brně.

---

Parametry
• Rok výroby: 2016
• Nájezd: 187 000 km
• Motorizace: 1.6 TDI, 81 kW
• STK platná do: 2027
• Výbava: tempomat, parkovací senzory, tažné
```

Na detailu inzerátu komponenta `ListingDescription` úvod zobrazí jako odstavec a Parametry jako seznam `Popisek: hodnota`.

---

## Vstupy do hydratace

Edge Function dostane z klienta payload (viz `moderate-listing-client.ts`):

| Vstup | Pole | Jak AI používá |
|-------|------|----------------|
| Název | `title` | `cleanedTitle` — H1 dle SEO bible (obecný název první, max 45) |
| Popis | `description` | Surový text k přepsání / doplnění |
| Lokalita | `locationText` | Lokální SEO / spádové město v úvodu + meta (ne v alt); na lokalitu se **neptat**, pokud je ve formuláři |
| Kategorie | `categoryType`, `subcategorySlug` | Výběr `aiPrompt` z `category-prompts.ts` |
| Stav / typ | `conditionLabel`, `conditionLabelText`, `conditionFieldLabel` | Např. „Použité“, „Prodej“, „Jednorázová akce“ — **neptat se znovu** |
| Cena | `priceType`, `priceTypeLabel`, `priceAmount` | Pevná/orientační cena → do úvodu; na cenu se **neptat**; neshoda text↔formulář ≠ REJECTED. U události `free_pickup` („Vstup zdarma“) **nepropisovat** do úvodu/Parametrů/meta, pokud to inzerent sám nenapsal |
| Událost | `eventDate` | Datum **i čas** z formuláře jsou závazné — AI se **neptá**; starý čas v popisu se přepíše, ≠ REJECTED; do Edge i Server Action jde ISO UTC (zeď `Europe/Prague`), zobrazení v TZ `Europe/Prague` (ne naivní UTC) |
| Fotky | `imagesBase64[]`, `mainImageIndex` | Všechny pro bezpečnost a hydrataci; `mainImageIndex` jen pro cross-validaci text ↔ náhled |

User prompt sestavuje `buildModerationUserPrompt()` — sekce oddělené prázdnými řádky: úkol, limity délky, kategorie, `aiPrompt`, stav, datum, cena, index hlavní fotky (cross-validace), počet fotek (hydratace ze všech), název a popis.

---

## Stavy odpovědi AI (hydratace)

| Status | Význam | `cleanedDescription` | Dotazník |
|--------|--------|----------------------|----------|
| `APPROVED` | Text je dostatečný | Finální návrh k publikaci | žádný |
| `NEEDS_QUESTIONS` | Chybí kritická kusová data pro kategorii | Úvod + Parametry z known facts **včetně katalogu u identifikovaného modelu** | 1–5 otázek |
| `REJECTED` | Zakázaný obsah / neshoda text↔foto | — | — (hydratace nenastane) |

### NEEDS_QUESTIONS — kdy a proč

AI vrátí dotazník, když podle **kontextu kategorie** chybí zásadní údaje, které uživatel nevyplnil v textu ani je nejde odvodit z fotky.

| Kategorie | Typické otázky |
|-----------|----------------|
| Zboží (auta, elektronika) | Rok, nájezd, motorizace, STK, výbava |
| Zboží (móda) | Velikost, značka; u zjevně dětského bez věku/výšky/vel. pásma → „Věk / výška“ |
| Zboží (kola/sport, ostatní) | U zjevně dětského (kolo, kočárek…) bez věku/výšky → „Věk / výška“ |
| Služby | Dojezd / lokalita, materiál v ceně |
| Události | Kapacita, výbava (datum/čas/lokalita už ve formuláři — neptat) |
| Nemovitosti | Dispozice, plocha m², kauce u pronájmu; **vždy ověřit** zadavatele (majitel vs. RK) a provizi RK — pokud není v textu jednoznačné, zeptat se (u RK zejména: provize v ceně vs. navíc) |
| Práce | Nástup, požadavky, odměna |

**Hard limit:** max **5** otázek (`MODERATION_MAX_QUESTIONS` v `src/config/moderation/index.ts`). Parser na Edge Function otázky nad limit ořízne.

Každá otázka v JSON:

```json
{
  "id": "q1",
  "label": "Jaký je nájezd vozidla?",
  "paramLabel": "Nájezd"
}
```

| Pole | Účel |
|------|------|
| `label` | Text v modalu pro uživatele (celá otázka) |
| `paramLabel` | Krátký název pro odrážku v Parametrech (max. ~4 slova) |
| `id` | Klíč pro mapování odpovědí v UI |

Pokud AI `paramLabel` nepošle, klient použije heuristiku `shortenQuestionLabel()` v `format-question-answers.ts` (regex na „Jaký je nájezd…“ → „Nájezd“).

---

## Limity délky textu

| Konstanta | Hodnota | Kde |
|-----------|---------|-----|
| `LISTING_DESCRIPTION_MAX_LENGTH` | **2000** znaků | Finální popis v DB (CHECK constraint) |
| `MODERATION_DESCRIPTION_QA_RESERVE` | **400** znaků | Rezerva pro odpovědi z dotazníku |

**Pravidlo pro AI:**

- `APPROVED` → `cleanedDescription` max **2000** znaků.
- `NEEDS_QUESTIONS` → `cleanedDescription` max **1600** znaků (2000 − 400).

V modalu `ModerationPreviewDialog` počítadlo znaků ukazuje **projekovanou délku** — tedy `aiDescription` + odpovědi sloučené přes `appendQuestionAnswersToDescription()`. Při překročení 2000 je tlačítko publikace disabled.

---

## Filtr redundantních otázek (formulář má pravdu)

Edge Function po parsování AI odpovědi odfiltruje otázky k polím, která uživatel už vyplnil ve formuláři:

| Filtr | Kdy | Co odstraní |
|-------|-----|-------------|
| `filterRedundantPriceQuestions` | `fixed`/`negotiable` + `priceAmount` | otázky na cenu |
| `filterRedundantEventDateQuestions` | vyplněný `eventDate` | otázky na datum/čas konání |
| `filterRedundantLocationQuestions` | vyplněný `locationText` | otázky na lokalitu/místo/adresu |
| `applyFilledDoplnitToHydration` (klient) | vyplněné „Doplňte materiál: bronz“ v popisu | stejná otázka v hydrataci + doplní `• Materiál: bronz` do Parametrů, pokud AI hodnotu zahodila |

Vyplněné řádky „Doplňte X: hodnota“ se před 1. voláním AI přepíšou na fakta (`Materiál: bronz`); prázdné výzvy zůstanou, ať se hydratace ptá jen na ně. Klient to po odpovědi ještě jednou zkontroluje — AI často vyplněný údaj smaže a položí stejnou otázku.

Pokud po filtrech nezbyde žádná otázka → status se **přepne na `APPROVED`**.

Server zároveň v `normalizeModerationResult` přepíše `cleanedDescription`: `applyFormPriceToCleanedDescription` (včetně náhrady jiné částky v úvodu) a `applyFormEventDateToCleanedDescription` (Parametry `• Datum a čas` + věta v úvodu, pokud chybí).

Tím se zabrání REJECTED / NEEDS_QUESTIONS jen kvůli neshodě volného textu s formulářem.

**Mezera (záměrně):** po ruční úpravě popisu v `ModerationPreviewDialog` se form authority **znovu neaplikuje** — text v modalu a pole formuláře (`eventDate`, cena…) se mohou rozjet. Produktový popis + backlog řešení: [`Metodika.md`](./Metodika.md) §6.8.1.

---

## UX — od schválení po uložení

### 1. Overlay při volání AI

Po kliknutí **Publikovat** / **Uložit změny** — full-screen spinner „Probíhá AI kontrola inzerátu“ (až ~15 s, timeout Edge Function 30 s).

### 2. ModerationApprovedDialog

Krátké potvrzení „Inzerát je v pořádku“ → tlačítko **Pokračovat**. Teprve potom se otevře náhled hydratace.

### 3. ModerationPreviewDialog

| Prvek | Chování |
|-------|---------|
| Název | Editovatelný (`cleanedTitle`) |
| Popis | Editovatelná `textarea` (`cleanedDescription` z AI) |
| **Kvalita inzerátu** | Deterministické % vedle labelu popisu + max. 1 tip (fotka / odpovědi / doplnění). Soft nudge — neblokuje publikaci. Live přepočet při odpovědích a úpravě textu. |
| Dotazník | Zobrazí se jen u `NEEDS_QUESTIONS`; odpovědi **volitelné** (prázdné nezdrží publikaci, ale snižují skóre) |
| Počítadlo znaků | Počítá finální popis včetně odpovědí |

#### Kvalita inzerátu (score)

Nejde o predikci prodeje — jen **úplnost a připravenost** textu po hydrataci.

- Rubric: [`src/config/listing-quality.ts`](../src/config/listing-quality.ts)
- Výpočet: [`src/lib/moderation/listing-quality-score.ts`](../src/lib/moderation/listing-quality-score.ts)
- Signály: fotky (0 fotek → strop 25 %), struktura popisu (úvod + Parametry), zodpovězené otázky. **SEO (meta/alt) skóre neovlivňuje** — připravuje AI; tužka v náhledu je jen volitelný override.
- Tip vždy ukáže *co* chybí do 100 % (fotka → odpovědi → krátký úvod / málo Parametrů). „Inzerát je v pořádku“ jen při 100 %.
- Plné body za popis: úvod ≥ 80 znaků + aspoň 3 Parametry (ne jen dlouhý seznam odrážek bez úvodu).
- Parser Parametrů (`parseListingDescription`) je **obecný**: z kandidátů oddělení (`\n\n---\n\n`, volný `---`, jen nadpis Parametry…) vybere split s nejvíce platnými odrážkami — ne na jeden inzerát.
- Po AI odpovědi klient sjednotí popis přes `normalizeListingDescriptionStructure` (kanonické odřádkování), aby v náhledu nebylo „…web. --- Parametry“ na jednom řádku.
- Tip u nezodpovězených otázek může scrollovat na `#improve-listing`

#### SEO při slabém zadání

AI nesmí vymýšlet fakta. Chybí-li kritická data → `NEEDS_QUESTIONS`. Meta title skládá kód (`buildListingMetaTitle`); meta description má fallback AI → úvod popisu → `title — lokalita` (`resolveListingMetaDescription`). Slabý vstup = nižší kvalita + tipy, ne hard block publikace.

**Tři akce:**

| Tlačítko | Co se uloží |
|----------|-------------|
| **Doplnit, upravit a publikovat** | Po 2. kontrole (`issueApproval: true`): `title` + `description` z modalu (včetně sloučených odpovědí). Do `original_title` / `original_description` jde text z formuláře před AI. |
| **Ignorovat AI a publikovat původní** | Po 2. kontrole: původní název a popis z formuláře (+ server-side strip kontaktů). Bezpečnostní filtr už proběhl v 1. volání a znovu ve 2. |
| **Zrušit** | Návrat do formuláře, nic se neukládá |

Texty tlačítek a hintů: `MODERATION_PREVIEW_UI` v `src/config/moderation/messages.ts` (tón PRD §1.6).

**Proč druhé volání:** první jen připraví náhled (bez tokenu). Token se vydá až z kontroly **přesného** odesílaného textu a bajtů fotek — jinak by šlo po schválení vyměnit obsah. Detail: [`moderace-inzeratu.md`](./moderace-inzeratu.md).

---

## Sloučení odpovědí z dotazníku

Flow v `appendQuestionAnswersToDescription()`:

1. Z odpovědí se vytvoří odrážky přes `formatQuestionAnswerAsBullet()` — např. `• Nájezd: 120 000 km`.
2. `parseListingDescription()` rozdělí stávající AI text na `intro` a existující `parameters`.
3. Nové odrážky se **připojí** k existujícím Parametrům (nepřepisují úvod).
4. `joinIntroAndParameters()` složí finální řetězec s `---`.

**Formátování odpovědí** (`formatAnswerForDisplay`):

| Kontext | Příklad vstupu → výstup |
|---------|-------------------------|
| Cena | `8000` → `8 000 Kč` |
| Nájezd | `120000` → `120 000 km` |
| Hmotnost | `12.5` → `12,5 kg` |
| Plocha | `65` → `65 m²` |
| Rok / STK | `2016` beze změny |
| Poslední servis (auta-moto) | datum beze změny jednotky |

Odpovědi z dotazníku se **nepersistují do samostatné tabulky** — jsou součástí sloupce `posts.description`.

---

## Co se ukládá do databáze

| Sloupec | Kdy se vyplní |
|---------|---------------|
| `title` | Finální název (AI nebo původní) |
| `description` | Finální strukturovaný popis |
| `original_title` | Text z formuláře před AI — jen při volbě AI verze nebo při první publikaci s obsahovou změnou |
| `original_description` | Totéž pro popis |

Účel `original_*`: metriky využití AI (porovnání hrubého nástřelu vs. publikovaného textu). Migrace: [`024_posts_original_text.sql`](../supabase/024_posts_original_text.sql).

Před zápisem vždy proběhne `stripContactInfo()` v Server Action a pojistka DB triggeru (viz [`moderace-inzeratu.md`](./moderace-inzeratu.md) § Strip kontaktů).

---

## Jak upravovat chování hydratace podle kategorie

### Kde editovat

Hlavní soubor: **`src/config/categories.ts`**.

Každá kategorie může mít `aiPrompt` na úrovni celé kategorie; podkategorie mohou mít vlastní `aiPrompt`, který se **přidá** k nadřazenému.

### Struktura

```typescript
{
  type: "zbozi",
  label: "Zboží",
  aiPrompt: "Analyzuj nabízené zboží. cleanedDescription: úvod + Parametry…",
  subcategories: [
    {
      slug: "auta-moto",
      label: "Auta a moto",
      aiPrompt:
        "Úvod + Parametry (rok, nájezd, STK, poslední servis…). Na cenu se neptej…",
    },
  ],
}
```

### Jak AI prompt skládá Edge Function

`resolveCategoryAiPrompt()` v `category-prompts.ts`:

1. Hledá `categoryType/subcategorySlug` (např. `zbozi/auta-moto`).
2. Přidá prompt celé kategorie (`zbozi`).
3. Výsledky spojí `\n\n`.

**Klient `aiPrompt` neposílá** — posílá jen `categoryType` + `subcategorySlug`. Prompt žije jen na serveru (menší payload, jeden zdroj pravdy po syncu).

### Doporučení pro psaní `aiPrompt`

| Dělej | Nedělej |
|-------|---------|
| Piš, na co se **ptát**, když data chybí | Neopakuj celý system prompt (struktura úvod/Parametry je už v `build-prompt.ts`) |
| Uveď, co už je ve formuláři (cena, datum, stav) | Nepožaduj otázky o ceně, pokud je ve formuláři |
| Omez počet otázek („max 2“, „max 3“) u úzkých podkategorií | Nepiš zakázaný obsah — to je v `prohibited-topics.ts` |

### Přidání / úprava promptu

1. Uprav `aiPrompt` v `src/config/categories.ts`.
2. Spusť sync a deploy (pořadí důležité):

```bash
npm run sync:moderation
supabase functions deploy moderate-listing
```

3. Ověř na testovacím inzerátu v dané podkategorii — create i edit.

Sync vygeneruje `supabase/functions/_shared/moderation/category-prompts.ts` — **needituj ručně**.

---

## Úprava globálních pravidel hydratace

Struktura textu (úvod, `---`, Parametry, formát odrážek) je v **system promptu**:

- `src/config/moderation/build-prompt.ts` (Next.js — reference)
- `supabase/functions/_shared/moderation/build-prompt.ts` (deploy — kopie ze sync skriptu)

Po změně `build-prompt.ts` nebo `description-length-prompt.ts` znovu `npm run sync:moderation` → deploy.

Limity znaků měň v **`src/config/app.ts`** — sync je zkopíruje do `_shared/moderation/constants.ts`.

---

## Kdy se hydratace nespustí

Stejná pravidla jako u moderace (`needs-moderation.ts`):

| Akce | Hydratace |
|------|-----------|
| Nový inzerát — Publikovat | Ano |
| Editace — název, popis, kategorie, fotky | Ano |
| Editace — publish-sensitive pole (cena, lokalita, stav, datum/platnost, kontakty, CV…) | Ano — stejný fingerprint jako approval token |

Při `MODERATION_ENABLED = false` klient vrátí okamžitě approved se `stripContactInfo()` — bez hydratace (publikace na `active` bez tokenu stejně neprojde DB gate).

---

## Řešení problémů

| Projev | Kam se dívat |
|--------|--------------|
| AI se ptá na cenu, i když je ve formuláři | `filterRedundantPriceQuestions`, user prompt `formatPriceFromForm` |
| AI se ptá na datum/čas / lokalitu z formuláře | `filterRedundantEventDateQuestions` / `filterRedundantLocationQuestions` |
| Starý čas v popisu vs. nový `eventDate` → REJECTED | system prompt (no-REJECT) + `applyFormEventDateToCleanedDescription` |
| Špatná částka v úvodu vs. formulář | `applyFormPriceToCleanedDescription` (replace „Cena … Kč“) |
| Špatná struktura Parametrů na detailu | AI výstup vs. `parseListingDescription` — oddělovač musí být `\n\n---\n\n` |
| Příliš dlouhý text po dotazníku | Zkraťte úvod v modalu; AI měla držet 1600 znaků u NEEDS_QUESTIONS |
| Hydratace ignoruje podkategorii | Sync + deploy; ověř `category-prompts.ts` pro `type/slug` |
| Staré chování po úpravě promptu | Deploy **po** syncu — viz [`moderace-inzeratu.md`](./moderace-inzeratu.md) |

---

## Související dokumentace

- Kanonická specifikace: [`PRD_v3.md`](./PRD_v3.md) §5.4
- Bezpečnostní moderace a zakázaný obsah: [`moderace-inzeratu.md`](./moderace-inzeratu.md)
- Uživatelský popis flow: [`Metodika.md`](./Metodika.md) §6
- Sync a deploy: [`terminal-prikazy.md`](./terminal-prikazy.md)
