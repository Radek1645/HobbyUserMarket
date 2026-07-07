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
| Využití kategorie, formuláře a hlavní fotky jako kontextu | Překlad do jiných jazyků |

**Moderace** rozhoduje, zda obsah smí na web (REJECTED). **Hydratace** se spouští jen pokud obsah **není** REJECTED — vrací `APPROVED` nebo `NEEDS_QUESTIONS` s `cleanedTitle` / `cleanedDescription`.

---

## Architektura (stručně)

```
Formulář (název, popis, kategorie, cena, fotky…)
    → prepareModerationImages()     … resize na 512 px, base64
    → runListingModeration()
        → Edge Function moderate-listing
            → system prompt (struktura textu + pravidla hydratace)
            → user prompt (metadata formuláře + category aiPrompt)
            → multimodální AI (text + všechny fotky)
            → parseModerationResponse() + filterRedundantPriceQuestions()
        → REJECTED          → ModerationRejectedDialog (viz moderace-inzeratu.md)
        → APPROVED / NEEDS_QUESTIONS
            → ModerationApprovedDialog („Inzerát je v pořádku“)
            → ModerationPreviewDialog („AI náhled a doplnění“)
                → Doplnit, upravit a publikovat
                    → appendQuestionAnswersToDescription()
                    → createListing / updateListing (+ original_title/description)
                → Ignorovat AI a publikovat původní
                → Zrušit
```

- Hydratace probíhá **v prohlížeči** přes Supabase SDK — ne přes Next.js API (riziko timeoutu na Vercel).
- Jedno volání AI = bezpečnostní filtr fotek + cross-validace text↔foto + hydratace textu + případný dotazník.

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
| `src/lib/moderation/parse-listing-description.ts` | Parsování uloženého popisu na úvod + Parametry |
| `src/lib/moderation/append-question-answers.ts` | Sloučení odpovědí z dotazníku do popisu |
| `src/lib/moderation/format-question-answers.ts` | `paramLabel`, zkrácení otázek, formát km/Kč/m² |
| `src/components/moderation/ModerationPreviewDialog.tsx` | UI náhledu, dotazník, počítadlo znaků |
| `src/components/listing/ListingDescription.tsx` | Zobrazení úvod + Parametry na detailu inzerátu |
| `src/components/listing/CreateListingForm.tsx` | Orchestrace celého flow při Publikovat / Uložit |

---

## Výstupní formát — strukturovaný popis

AI musí vrátit `cleanedDescription` v **pevné struktuře** (system prompt v `build-prompt.ts`):

```
[ÚVOD — 1–3 věty: co prodáváte, hlavní výhoda, cena z formuláře, předání]

---

Parametry
• Popisek: hodnota
• Další parametr: hodnota
```

### Pravidla struktury

| Část | Pravidlo |
|------|----------|
| **Úvod** | 1–3 věty, věcně, bez prázdných klišé („Hledáte…?“). **Cena z formuláře** patří sem (např. „Cena 2 000 Kč.“), ne do Parametrů. |
| **Oddělovač** | Prázdný řádek, `---`, prázdný řádek — konstanta `MODERATION_QA_SECTION_SEPARATOR` v kódu |
| **Parametry** | Nadpis `Parametry` (případně legacy `Technické údaje`), odrážky `• Popisek: hodnota` |
| **Zdroje faktů** | Text uživatele, hlavní fotka, metadata formuláře — vše zapracovat do úvodu nebo Parametrů, pokud je známo |

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
| Název | `title` | `cleanedTitle` — může mírně upravit (SEO, srozumitelnost) |
| Popis | `description` | Surový text k přepsání / doplnění |
| Kategorie | `categoryType`, `subcategorySlug` | Výběr `aiPrompt` z `category-prompts.ts` |
| Stav / typ | `conditionLabel`, `conditionLabelText`, `conditionFieldLabel` | Např. „Použité“, „Prodej“, „Jednorázová akce“ — **neptat se znovu** |
| Cena | `priceType`, `priceTypeLabel`, `priceAmount` | Pevná/orientační cena → do úvodu; na cenu se **neptat** |
| Událost | `eventDate` | Datum konání z formuláře — AI se na ně **neptá** |
| Fotky | `imagesBase64[]`, `mainImageIndex` | Všechny pro bezpečnost; hlavní pro cross-validaci a vizuální kontext hydratace |

User prompt sestavuje `buildModerationUserPrompt()` — sekce oddělené prázdnými řádky: úkol, limity délky, kategorie, `aiPrompt`, stav, datum, cena, index hlavní fotky, název a popis.

---

## Stavy odpovědi AI (hydratace)

| Status | Význam | `cleanedDescription` | Dotazník |
|--------|--------|----------------------|----------|
| `APPROVED` | Text je dostatečný | Finální návrh k publikaci | žádný |
| `NEEDS_QUESTIONS` | Chybí kritická data pro kategorii | Úvod + Parametry **jen z known facts** | 1–5 otázek |
| `REJECTED` | Zakázaný obsah / neshoda text↔foto | — | — (hydratace nenastane) |

### NEEDS_QUESTIONS — kdy a proč

AI vrátí dotazník, když podle **kontextu kategorie** chybí zásadní údaje, které uživatel nevyplnil v textu ani je nejde odvodit z fotky.

| Kategorie | Typické otázky |
|-----------|----------------|
| Zboží (auta, elektronika) | Rok, nájezd, motorizace, STK, výbava |
| Zboží (móda) | Velikost, značka (max. ~2 otázky) |
| Služby | Dojezd / lokalita, materiál v ceně |
| Události | Čas, místo, kapacita (datum už ve formuláři) |
| Nemovitosti | Dispozice, plocha m², kauce u pronájmu; **vždy** (pokud chybí v textu): zadavatel (soukromá osoba / RK), provize v ceně |
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

## Filtr redundantních otázek o ceně

Pokud uživatel ve formuláři vyplnil **pevnou** nebo **orientační** cenu (`priceType` = `fixed` / `negotiable` + `priceAmount`), Edge Function po parsování AI odpovědi spustí `filterRedundantPriceQuestions()`:

1. Odstraní otázky, jejichž `label` vypadá jako dotaz na cenu (regex `isPriceRelatedQuestion`).
2. Pokud po filtru nezbyde žádná otázka → status se **přepne na `APPROVED`**.

Tím se zabrání situaci „AI se ptá na cenu“, i když ji uživatel zadal ve formuláři.

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
| Dotazník | Zobrazí se jen u `NEEDS_QUESTIONS`; všechny otázky **povinné** |
| Počítadlo znaků | Počítá finální popis včetně odpovědí |

**Tři akce:**

| Tlačítko | Co se uloží |
|----------|-------------|
| **Doplnit, upravit a publikovat** | `title` + `description` z modalu (včetně sloučených odpovědí). Do `original_title` / `original_description` jde text z formuláře před AI. |
| **Ignorovat AI a publikovat původní** | Původní název a popis z formuláře (+ server-side strip kontaktů). Bezpečnostní filtr už proběhl. |
| **Zrušit** | Návrat do formuláře, nic se neukládá |

Texty tlačítek a hintů: `MODERATION_PREVIEW_UI` v `src/config/moderation/messages.ts` (tón PRD §1.6).

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
| Plocha | `65` → `65 m²` |
| Rok / STK | `2016` beze změny |

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
        "Úvod + Parametry (rok, nájezd, motorizace, STK…). Na cenu se neptej…",
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
| Editace — jen cena, lokalita, stav, platnost | Ne — přímé uložení bez AI |

Při `MODERATION_ENABLED = false` klient vrátí okamžitě approved se `stripContactInfo()` — bez hydratace.

---

## Řešení problémů

| Projev | Kam se dívat |
|--------|--------------|
| AI se ptá na cenu, i když je ve formuláři | `filterRedundantPriceQuestions`, user prompt `formatPriceFromForm` |
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
