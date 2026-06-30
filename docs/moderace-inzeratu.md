# Moderace inzerátů — nastavení a úprava pravidel

Dokumentace k AI guardrailu podle PRD §5.4. Platí pro **založení** i **úpravu** inzerátu — oba flow sdílejí stejnou vrstvu.

> **Stav:** AI moderace je **připravená, ale vypnutá** (`MODERATION_ENABLED = false`). Inzeráty se ukládají bez volání AI. Po zapnutí a deployi Edge Function se aktivuje plný flow včetně popupu při zamítnutí.

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

Soubor **`src/config/moderation/messages.ts`**:

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

## Zapnutí AI moderace (až budeš ready)

1. Doplň volání Gemini/OpenAI do `supabase/functions/moderate-listing/index.ts` (prompt: `buildModerationSystemPrompt()` ze `_shared`).
2. Nastav secret v Supabase: `GEMINI_API_KEY` (příp. `OPENAI_API_KEY`).
3. Synchronizuj pravidla a deploy:

```bash
npm run sync:moderation
supabase functions deploy moderate-listing
```

4. V `src/config/moderation/index.ts` nastav:

```typescript
export const MODERATION_ENABLED = true;
```

5. Ověř create i edit — při `REJECTED` se má zobrazit popup s odkazem na Podmínky inzerce.

---

## Sync pravidel do Edge Function

Next.js a Supabase Edge Function nesdílí stejný import. Po úpravě `prohibited-topics.ts` spusť:

```bash
npm run sync:moderation
```

Zkopíruje `src/config/moderation/prohibited-topics.ts` → `supabase/functions/_shared/moderation/prohibited-topics.ts`.

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
- Terminál (sync, build): `docs/terminal-prikazy.md`
