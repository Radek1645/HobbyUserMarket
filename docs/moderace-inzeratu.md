# Moderace inzerátů — nastavení a úprava pravidel

Dokumentace k AI guardrailu podle PRD §5.4. Platí pro **založení** i **úpravu** inzerátu — oba flow sdílejí stejnou vrstvu.

> **Stav:** AI moderace je **zapnutá** (`MODERATION_ENABLED = true`). Vyžaduje deploy Edge Function `moderate-listing` a secret `GEMINI_API_KEY` v Supabase.

---

## Architektura (stručně)

```
Formulář (create / edit)
    → runListingModeration()          … jednotný vstup v prohlížeči
        → [vypnuto] strip kontaktů, uložení (bez tokenu → draft, nepublikuje)
        → [zapnuto] Edge Function moderate-listing (Gemini / GPT)
            → APPROVED / NEEDS_QUESTIONS → approvalToken v odpovědi
            → REJECTED → popup ModerationRejectedDialog
            → technická chyba (503) / chyba sítě → červený alert ve formuláři (retry)
    → Server Action createListing / updateListing
        → uložení jako draft + fotky
        → publish_approved_post(approvalToken) → active
```

- AI se **nevolá přes Next.js API** (riziko timeoutu na Vercel) — jen přes Supabase Edge Function z klienta.
- **Publikaci na `active` nelze obejít** bez approval tokenu z Edge Function (migrace `027`, viz níže).
- Seznam zakázaného obsahu je v **konfiguračních souborech**; AI prompt se z něj **generuje automaticky** (pro Gemini zkrácená varianta bez explicitních `criteria`).

### Technické chyby (P8/U1)

Pokud AI dočasně nefunguje (kvóta, výpadek poskytovatele, chybné klíče), **nesmí se to tvářit jako zamítnutí obsahu**.

- Edge Function vrací **HTTP 503** a JSON `{ error: "TECHNICAL_ERROR", message, errorCode }` (bez `status`).
- Klient to zobrazí jako běžnou chybu ve formuláři a uživatel má možnost **zkusit to znovu**.
- `REJECTED` je vyhrazené jen pro obsahové důvody (zakázaný obsah, shoda text/foto, špatná kategorie, prompt injection…).

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
| `supabase/functions/moderate-listing/` | Edge Function (Gemini / OpenAI fallback) |
| `supabase/functions/_shared/moderation/issue-approval.ts` | Vydání approval tokenu po AI schválení |
| `supabase/functions/_shared/moderation/` | Kopie pravidel pro deploy (sync skriptem) |
| `src/lib/moderation/prohibited-scan.ts` | Server-side keyword scan před uložením |

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
| `keywords` | Volitelné klíčové výrazy pro **server-side pre-check** (`prohibited-scan.ts`) před uložením. Doplňují AI, nenahrazují ji. |

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

## Kontrola shody obsahu s kategorií

Moderace rozlišuje **dvě úrovně** — nesmí se zaměňovat:

| Úroveň | Co kontroluje | Kde | Výsledek při chybě |
|--------|----------------|-----|---------------------|
| **Strukturální** | Zda `categoryType` + `subcategorySlug` existují v taxonomii | `assertValidCategoryPair()` v Edge Function + `isValidSubcategory()` ve formuláři | HTTP 400 / „Vyberte podkategorii“ |
| **Sémantická (AI)** | Zda název, popis a fotografie **odpovídají zvolené kategorii** | System prompt + `aiPrompt` z `categories.ts` | `REJECTED` — uživatel má zvolit jinou podkategorii |

**Před úpravou 2026-07-13** běžela jen strukturální kontrola. AI dostala kategorii hlavně pro hydrataci a doplňující otázky — evidentně špatné zařazení (např. WiFi extender v `Potraviny a domácí výrobky`) mohlo projít.

### Pravidla (od 2026-07-13)

1. **Obecné pravidlo** v `src/config/moderation/build-prompt.ts` (sync do `_shared/moderation/build-prompt.ts`):
   - Zvolená kategorie a podkategorie jsou závazné.
   - Zjevná neshoda textu nebo fotek → `REJECTED` s důvodem typu: *„Inzerát je zařazený do špatné kategorie. Vyberte prosím vhodnější podkategorii.“*

2. **Podkategorie s vlastním `aiPrompt`** v `src/config/categories.ts` — AI dostane konkrétnější očekávání. Příklad `zbozi/potraviny-domaci`:
   - Očekává jedlé výrobky (med, zavařeniny, pečivo…).
   - Zjevně nejedlý produkt (elektronika, router, WiFi extender, nábytek…) → `REJECTED`.

3. **Kde upravovat chování:**
   - Obecné pravidlo → `build-prompt.ts`
   - Pravidla pro konkrétní podkategorii → `aiPrompt` u příslušné položky v `categories.ts`
   - Po změně: `npm run sync:moderation` → `supabase functions deploy moderate-listing`

### Limity

- Kontrola je **AI-based**, ne deterministický keyword filtr — u hraničních případů může model chybovat (projít i zamítnout).
- `rejectedTopicId` u špatné kategorie **není** z `prohibited-topics.ts` — jde o běžné zamítnutí s vlastním `reason` v JSON odpovědi.
- Server-side `prohibited-scan.ts` kategorii neřeší.

### Příklad (regrese)

| Inzerát | Kategorie | Očekávaný výsledek |
|---------|-----------|-------------------|
| TP-Link TL-WA850RE (WiFi extender) + fotka zařízení | `zbozi` / `potraviny-domaci` | `REJECTED` — špatná podkategorie |
| Med z vlastní včelny | `zbozi` / `potraviny-domaci` | `APPROVED` nebo `NEEDS_QUESTIONS` (chybí množství, alergeny…) |
| iPhone 13 | `zbozi` / `elektronika` | `APPROVED` / `NEEDS_QUESTIONS` |

---

## Fotografie a AI kontrola

| Co | Kolik fotek | Účel |
|----|-------------|------|
| **Bezpečnostní filtr** | Všechny nahrané (max. 6) | Zbraně, drogy, porno… — zamítnutí jedné = zamítnutí celého inzerátu |
| **Cross-validace text ↔ foto** | Hlavní fotka (`mainImageIndex`) | Konzistence názvu/popisu s náhledem |
| **AI hydratace / dotazník** | **Všechny** fotografie | Vizuální kontext a doplňující otázky; hlavní fotka jen pro cross-validaci |

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

5. Ověř create i edit — při `REJECTED` popup, při schválení modal „AI Náhled & Doplnění“, po publikaci stav **Aktivní** (ne Koncept).

6. Migrace bezpečnostního hardeningu (jednorázově, pokud ještě nejsou):

```bash
# Supabase SQL Editor — v pořadí:
# supabase/025_contact_privacy_hardening.sql
# supabase/026_contact_reveal_rate_limit.sql
# supabase/027_moderation_publish_gate.sql
# supabase/036_post_status_blocked.sql
```

> **Po změně `categories.ts` nebo `prohibited-topics.ts`:** znovu `npm run sync:moderation` → `supabase functions deploy moderate-listing`. Sync **po** deployi nedává smysl — cloud už běží se starým balíkem; oprava vyžaduje **nový** deploy hned po syncu.

---

## Server-side vynucení publikace (migrace `027`)

| Komponenta | Účel |
|------------|------|
| `moderation_approvals` | Tabulka approval tokenů (píše jen `service_role` z Edge Function) |
| `issue_moderation_approval` | RPC pro vydání tokenu (TTL 30 min, váže user + počet fotek) |
| `publish_approved_post` | Jediná cesta z `draft` na `active` / `hidden` pro vlastníka |
| `enforce_post_publish_gate` | Trigger — blokuje přímý přechod na viditelný stav; editace obsahu → `draft` |
| `revert_post_on_image_change` | Trigger — změna fotek → `draft` |
| `check_report_threshold` | Trigger — 3× nahlášení inzerátu → `blocked` + `status_reason_code` |
| `prohibited-scan.ts` | Rychlý keyword scan v Server Action před uložením |

**Gemini:** System prompt pro Gemini používá `geminiSafe: true` (jen ID + label kategorií), aby Google nevypnul vstup filtrem `PROHIBITED_CONTENT` u nevinných fotek. OpenAI fallback dostává plný prompt s `criteria`. Volitelně nastav `OPENAI_API_KEY` jako záložní provider.

---

## Stav `blocked` (migrace `036`)

Odděluje **dobrovolnou pauzu** (`hidden`) od **moderátorského / komunitního zablokování**.

| Stav | Kdo | Ven jak |
|------|-----|---------|
| `hidden` | Majitel (Pozastavit) | `publishListing` → `active` |
| `blocked` | 3× report nebo moderátor | Úprava obsahu/fotek → `draft` → AI → `publish_approved_post` |

**DB:**

- `posts.status_reason_code`: `reports_threshold` | `moderation` (texty v `src/config/listing-status-reasons.ts`)
- Trigger `check_report_threshold` — inzerát → `blocked`, komentář → `hidden`
- `enforce_post_publish_gate` — z `blocked` nelze přejít na `active`/`hidden`/`archived` bez re-moderace; editace obsahu vynuluje `status_reason_code`

**UI:** badge „Zablokováno“, komponenta `ListingBlockedNotice` v `/moje-inzeraty` a `/inzerat/.../upravit`.

**Ruční blokace (do God Mode):**

```sql
UPDATE posts
SET status = 'blocked', status_reason_code = 'moderation', updated_at = now()
WHERE id = <post_id> AND status = 'active';
```

**Jednotky v Parametrech:** Prompt vyžaduje rozměry v cm, objem v ml; otázky v dotazníku obsahují jednotku v textu; klient (`format-question-answers.ts`) doplňuje jednotky při slučování odpovědí.

---

## Strip kontaktů — tři vrstvy (včetně „Ignorovat AI“)

| Vrstva | Kde | Účel |
|--------|-----|------|
| 1 | Edge Function (AI) | Čistka v `cleanedDescription` |
| 2 | Server Action `createListing` / `updateListing` | `stripContactInfo()` v `buildListingPayload()` — vždy před INSERT/UPDATE |
| 3 | PostgreSQL trigger `trg_posts_strip_contacts` | Pojistka proti obejití (Postman, upravený JS, přímý Supabase SDK) |

Edge Function u kroku „Ignorovat AI“ **neúčinkuje** — kontakty usekne vrstva 2 a 3. Migrace: [`020_strip_contacts_in_posts.sql`](../supabase/020_strip_contacts_in_posts.sql). Od **032** (`strip_contacts_price_guard.sql`) regex telefonu nechytá formátovanou cenu v textu „Cena … Kč“ (chráněné fráze před strippem).

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
