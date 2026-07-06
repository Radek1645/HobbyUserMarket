# Moderace inzerátů — nastavení a úprava pravidel

Dokumentace k AI guardrailu podle PRD §5.4. Platí pro **založení** i **úpravu** inzerátu — oba flow sdílejí stejnou vrstvu.

> **Stav:** AI moderace je **zapnutá** (`MODERATION_ENABLED = true`). Vyžaduje deploy Edge Function `moderate-listing` a secret `GEMINI_API_KEY` v Supabase.

---

## Architektura (stručně)

```
Formulář (create / edit)
    → runListingModeration()          … jednotný vstup v prohlížeči
        → [vypnuto] strip kontaktů, uložení
        → [zapnuto] Edge Function moderate-listing (Gemini / GPT)
            → APPROVED → Server Action createListing / updateListing
            → REJECTED → popup ModerationRejectedDialog
            → chyba sítě  → červený alert ve formuláři
```

- AI se **nevolá přes Next.js API** (riziko timeoutu na Vercel) — jen přes Supabase Edge Function z klienta.
- Seznam zakázaného obsahu je v **konfiguračních souborech**; AI prompt se z něj **generuje automaticky**.

---

## Složky a soubory

| Cesta | Účel |
|-------|------|
| `src/config/moderation/prohibited-topics.ts` | **Hlavní soubor** — seznam zakázaných kategorií |
| `src/config/moderation/messages.ts` | Texty popupu, cesta k podmínkám inzerce |
| `src/config/moderation/build-prompt.ts` | Sestavení system promptu pro AI ze seznamu |
| `src/config/moderation/index.ts` | Přepínač `MODERATION_ENABLED`, rate limit |
| `src/lib/moderation/` | Logika klienta (volání, strip kontaktů, příprava fotek) |
| `src/components/moderation/ModerationRejectedDialog.tsx` | Popup při zamítnutí |
| `src/app/podminky-inzerce/page.tsx` | Stub stránky Podmínky inzerce (odkaz z patičky) |
| `supabase/functions/moderate-listing/` | Edge Function (zatím stub) |
| `supabase/functions/_shared/moderation/` | Kopie pravidel pro deploy (sync skriptem) |

---

## Jak upravovat zakázaný obsah

### Kde editovat

Otevři **`src/config/moderation/prohibited-topics.ts`**.

Nejde o jednoduchý „slovníček zakázaných slov“ — každá položka je **kategorie** s popisem pro AI. To je spolehlivější než jen klíčová slova ( obchází formulace typu „prodám bílé“ místo „kokain“ ).

### Struktura jedné položky

```typescript
{
  id: "illegal_drugs",           // stabilní ID — po nasazení neměnit
  label: "Drogy a omamné látky", // krátký název (popup, seznam v UI)
  criteria: "Prodej, nákup…",    // co AI má zamítnout — piš konkrétně
  keywords: ["marihuana", "weed"], // volitelné — budoucí rychlý filtr
}
```

| Pole | Popis |
|------|--------|
| `id` | Identifikátor pro logy a odpověď AI (`rejectedTopicId`). **Nepřejmenovávej** po spuštění produkce. |
| `label` | Lidsky čitelný název — zobrazí se v popupu v seznamu „Na platformě není dovoleno…“. |
| `criteria` | Hlavní pravidlo pro AI. Čím konkrétnější, tím lépe moderace funguje. |
| `keywords` | Volitelné klíčové výrazy pro **budoucí** lokální pre-check před voláním AI. Dnes ještě neblokují uložení samy o sobě. |

### Přidání nové kategorie

1. Otevři `prohibited-topics.ts`.
2. Do pole `PROHIBITED_TOPICS` přidej nový objekt (viz vzor výše).
3. Ulož soubor — **prompt pro AI se přegeneruje sám** (`build-prompt.ts`).
4. Popup automaticky zobrazí nový `label` v seznamu zakázaného.
5. Před deployem Edge Function spusť sync (viz níže).

**Příklad — nelegální pyrotechnika:**

```typescript
{
  id: "illegal_fireworks",
  label: "Nelegální pyrotechnika",
  criteria:
    "Prodej zábavní pyrotechniky bez povolení, profesionální pyrotechniky bez licence, výkonných petard mimo legální prodej.",
  keywords: ["petarda", "raketa", "pyrotechnika"],
},
```

### Úprava existující kategorie

- **`label`** — klidně uprav (jen UI).
- **`criteria`** — upravuj kdykoli; AI dostane nové znění po redeployi Edge Function.
- **`keywords`** — doplňuj podle zkušeností z reálných inzerátů.
- **`id`** — neměň, pokud už běží produkce (staré logy a odpovědi AI).

### Odebrání kategorie

Smaž objekt z `PROHIBITED_TOPICS`. Z popupu zmizí z `label` seznamu; AI prompt se zkrátí.

---

## Klíčová slova vs. popis (`criteria`)

| Přístup | Kdy použít |
|---------|------------|
| **`criteria` (doporučeno)** | Vždy — AI chápe kontext, eufemismy, obcházení |
| **`keywords` (doplňek)** | Rychlé nápady pro pozdější automatický pre-check; ne náhrada za `criteria` |

Čistý seznam zakázaných slov bez `criteria` v tomto projektu **nepoužíváme** — u dlouhého seznamu by byl křehký a snadno obejitelný.

---

## Texty pro uživatele (popup, odkazy)

Soubor **`src/config/moderation/messages.ts`**. Tón a vykání: **PRD §1.6 Tone of Voice** (srozumitelně, upřímně, styl AirBank). Stejné texty musí být synchronní v `supabase/functions/moderate-listing/index.ts` (chyby rate limitu a výpadku AI).

| Konstanta | Co mění |
|-----------|---------|
| `LISTING_TERMS_PATH` | URL podmínek (`/podminky-inzerce`) — patička i popup |
| `MODERATION_REJECTION_UI` | Titulek popupu, tlačítka, nadpis seznamu |
| `MODERATION_DEFAULT_REJECTION_REASON` | Výchozí věta, když AI nepošle důvod |

Plný text pravidel doplníš později na stránku `src/app/podminky-inzerce/page.tsx`.

---

## Kdy se moderace spouští

| Akce | Moderace |
|------|----------|
| Nový inzerát | Před publikací (až po zapnutí AI) |
| Editace — změna názvu, popisu, kategorie | Ano |
| Editace — změna fotek (přidání, smazání, pořadí, hlavní náhled) | Ano — **všechny** aktuální fotky |
| Editace — jen cena, lokalita, stav, platnost | Ne (přeskočí se) |

Logika: `src/lib/moderation/needs-moderation.ts` + `ListingImageUpload.hasImageChanges()`.

---

## Fotografie a AI kontrola

| Co | Kolik fotek | Účel |
|----|-------------|------|
| **Bezpečnostní filtr** | Všechny nahrané (max. 6) | Zbraně, drogy, porno… — zamítnutí jedné = zamítnutí celého inzerátu |
| **Cross-validace text ↔ foto** | Hlavní fotka (`mainImageIndex`) | Konzistence názvu/popisu s náhledem |
| **AI hydratace / dotazník** | Hlavní fotka | Doplňující otázky podle kategorie |

Klient připraví snímky v `src/lib/moderation/prepare-moderation-images.ts` (resize na `MODERATION_IMAGE_MAX_DIMENSION`, default 512 px) a pošle je v jednom payloadu `imagesBase64` + `mainImageIndex`. Hvězdička u miniatury = **náhled na homepage**, ne „jediná kontrolovaná fotka“.

---

## Zapnutí AI moderace

**Pořadí je důležité** — nejdřív sync (vygeneruje `_shared`), pak deploy (přibalí čerstvý kód). Deploy před syncem = staré nebo prázdné prompty v cloudu.

1. Nastav secret v Supabase: `GEMINI_API_KEY` (příp. `OPENAI_API_KEY`). Model: **`gemini-2.5-flash`** (default v kódu; override secretem `GEMINI_MODEL`).
2. **Synchronizuj a deploy** (v tomto pořadí):

```bash
npm run sync:moderation
supabase functions deploy moderate-listing
```

3. Nasazení DB pojistky strip kontaktů (jednorázově, pokud ještě není):

```bash
# Supabase SQL Editor — celý soubor:
# supabase/020_strip_contacts_in_posts.sql
```

4. V `src/config/moderation/index.ts`: `MODERATION_ENABLED = true` (už zapnuto v repu).

5. Ověř create i edit — při `REJECTED` popup, při schválení modal „AI Náhled & Doplnění“.

> **Po změně `categories.ts` nebo `prohibited-topics.ts`:** znovu `npm run sync:moderation` → `supabase functions deploy moderate-listing`. Sync **po** deployi nedává smysl — cloud už běží se starým balíkem; oprava vyžaduje **nový** deploy hned po syncu.

---

## Strip kontaktů — tři vrstvy (včetně „Ignorovat AI“)

| Vrstva | Kde | Účel |
|--------|-----|------|
| 1 | Edge Function (AI) | Čistka v `cleanedDescription` |
| 2 | Server Action `createListing` / `updateListing` | `stripContactInfo()` v `buildListingPayload()` — vždy před INSERT/UPDATE |
| 3 | PostgreSQL trigger `trg_posts_strip_contacts` | Pojistka proti obejití (Postman, upravený JS, přímý Supabase SDK) |

Edge Function u kroku „Ignorovat AI“ **neúčinkuje** — kontakty usekne vrstva 2 a 3. Migrace: [`020_strip_contacts_in_posts.sql`](../supabase/020_strip_contacts_in_posts.sql).

---

## Odpovědi na AI dotazník (NEEDS_QUESTIONS)

Odpovědi z modalu se **nepersistují do JSONB** — v DB není sloupec `metadata` / `ai_properties` u `posts`.

Flow:
1. AI vrátí `questions[]` v JSON odpovědi Edge Function — každá položka má `label` (otázka ve formuláři) a `paramLabel` (krátký název pro sekci Parametry, např. „Účel pozemku“).
2. Uživatel vyplní pole v modalu.
3. Při „Doplnit, upravit a publikovat“ klient zavolá `appendQuestionAnswersToDescription()` — odpovědi se doplní do sekce **Parametry** jako odrážky `• Popisek: hodnota` (stejný formát jako AI `cleanedDescription`).

Záloha bez `paramLabel` (staré inzeráty nebo chyba AI): klient odvodí popisek heuristikou v `format-question-answers.ts` (např. „Jaký je účel pozemku?“ → „Účel pozemku“).

Na detailu inzerátu se parametry zobrazují jako `Popisek: hodnota` s viditelnou dvojtečkou (`ListingDescription`).

---

## Sync pravidel do Edge Function

Next.js a Supabase Edge Function nesdílí stejný import. Po úpravě `prohibited-topics.ts` nebo `categories.ts` (aiPrompt) spusť:

```bash
npm run sync:moderation
```

- Zkopíruje `prohibited-topics.ts` → `_shared/moderation/`
- Vygeneruje `category-prompts.ts` z `categories.ts` (prompt **jen na serveru**, klient posílá pouze `categoryType` + `subcategorySlug`)

---

## UX — modální okno „AI Náhled & Doplnění“

Po úspěšné AI kontrole (APPROVED / NEEDS_QUESTIONS) se zobrazí `ModerationPreviewDialog`:

1. **Doplnit, upravit a publikovat** — editovatelný náhled AI textu + volitelné odpovědi na otázky
2. **Ignorovat AI a publikovat původní** — původní název/popis (bezpečnostní filtr už proběhl), server-side strip kontaktů
3. **Zrušit** — návrat do formuláře bez uložení

Při `REJECTED` se zobrazí `ModerationRejectedDialog` (inzerát se neuloží).

---

## Co se stane při zamítnutí

1. Uživatel klikne **Publikovat** / **Uložit změny**.
2. AI vrátí `status: "REJECTED"` + `reason` + volitelně `rejectedTopicId`.
3. Zobrazí se **popup** (`ModerationRejectedDialog`):
   - důvod zamítnutí,
   - přehled kategorií z `PROHIBITED_TOPICS`,
   - odkaz **Podmínky inzerce**,
   - tlačítko *Rozumím, upravím inzerát*.
4. Inzerát se **neuloží**.

Technická chyba (AI nedostupná, rate limit) → červený text **ve formuláři**, ne popup.

---

## Související dokumentace

- Kanonická specifikace: `docs/PRD_v3.md` §5.4
- Hydratace textu, dotazník a struktura popisu: [`hydratace-inzeratu.md`](./hydratace-inzeratu.md)
- Terminál (sync, build): `docs/terminal-prikazy.md`
