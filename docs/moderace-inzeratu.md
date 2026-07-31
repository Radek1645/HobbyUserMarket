# Moderace inzerátů — nastavení a úprava pravidel

Dokumentace k AI guardrailu podle PRD §5.4. Platí pro **založení** i **úpravu** inzerátu — oba flow sdílejí stejnou vrstvu.

> **Stav:** AI moderace je **zapnutá** (`MODERATION_ENABLED = true`). Vyžaduje deploy Edge Function `moderate-listing` a secrety `GEMINI_API_KEY` (+ `SIGHTENGINE_API_USER` / `SIGHTENGINE_API_SECRET`) v Supabase.

---

## Architektura (stručně)

```
Formulář (create / edit)
    → nové fotky jednou do privátního moderation-image-staging
    → runListingModeration()          … jednotný vstup v prohlížeči
        → [vypnuto] strip kontaktů, uložení (bez tokenu → draft, nepublikuje)
        → [zapnuto] Edge Function moderate-listing
            → hard-hit text pre-filter (bez Gemini)
            → Sightengine NSFW gate na fotky (bez Gemini)
            → Gemini / GPT
            → APPROVED / NEEDS_QUESTIONS → modal s náhledem (bez tokenu)
            → REJECTED → popup ModerationRejectedDialog
            → technická chyba (503) / chyba sítě → červený alert ve formuláři (retry)
    → uživatel potvrdí finální text
    → moderate-listing(issueApproval: true)
        → kontrola přesného textu + stejných immutable Storage objektů
        → approvalToken (content fingerprint + SHA-256 fotek)
    → Server Action createListing / updateListing
        → uložení jako draft + kopie staging originálů do post-images
        → service-role publish_approved_post(token, image bindings) → active
```

**Proč `issueApproval` až po modalu:** první volání jen připraví náhled (bez tokenu). Token se vydá z druhé kontroly **přesného** odesílaného textu, SHA-256 plných Storage objektů, jejich pořadí a `mainImageIndex` — jinak by šlo po schválení vyměnit obsah nebo hlavní fotku.

- **Pre-Gemini brána:** hard-hit text + Sightengine nudity — viz [`cursor-prompt-nsfw-gate.md`](./cursor-prompt-nsfw-gate.md). Evidence `moderation_hard_reject_evidence` (**054**). Hard stop: `account_blacklist` (**055**), UI `/mod/blacklist`, stop stránka `/ucet-pozastaven`. Není to `/mod/karantena`.
- AI se **nevolá přes Next.js API** (riziko timeoutu na Vercel) — jen přes Supabase Edge Function z klienta.
- **Publikaci na `active` nelze obejít** — migrace `063` omezuje `publish_approved_post` na `service_role` a vyžaduje shodu fingerprintu i hashů fotek; `066` omezuje staff bypass na God Mode cizího inzerátu (viz níže).
- Seznam zakázaného obsahu je v **konfiguračních souborech**; AI prompt se z něj **generuje automaticky** (pro Gemini zkrácená varianta bez explicitních `criteria`).

### Technické chyby (P8/U1, P9, P11)

Pokud AI dočasně nefunguje (kvóta, výpadek poskytovatele, chybné klíče, timeout), **nesmí se to tvářit jako zamítnutí obsahu**.

- Edge Function vrací **HTTP 503** (nebo 429 u rate limitu) a JSON `{ error: "TECHNICAL_ERROR", message, errorCode }` (bez `status`).
- Gemini/OpenAI volání mají **timeout 25 s** (`fetch-with-timeout.ts`) — jinak by hung fetch neumožnil OpenAI fallback.
- Klient zobrazí inline chybu ve formuláři a při technické chybě **automaticky zkusí až 3×** (backoff 500 ms / 1,5 s; ne při rate limitu ani vypršení sezení).
- `REJECTED` je vyhrazené jen pro obsahové důvody (zakázaný obsah, shoda text/foto, špatná kategorie, prompt injection…).

---

## Složky a soubory

| Cesta | Účel |
|-------|------|
| `src/config/moderation/prohibited-topics.ts` | **Hlavní soubor** — seznam zakázaných kategorií |
| `src/config/moderation/hard-hit-terms.ts` | Hard-hit fráze (CSAM) — reject před Gemini |
| `src/config/moderation/messages.ts` | Texty popupu, cesta k podmínkám inzerce |
| `src/config/moderation/build-prompt.ts` | Sestavení system promptu pro AI ze seznamu |
| `src/config/moderation/index.ts` | Přepínač `MODERATION_ENABLED`, rate limit |
| `src/lib/moderation/` | Logika klienta (volání, strip kontaktů, příprava fotek) |
| `src/components/moderation/ModerationRejectedDialog.tsx` | Popup při zamítnutí |
| `src/app/podminky-inzerce/page.tsx` | Stub stránky Podmínky inzerce (odkaz z patičky) |
| `supabase/functions/moderate-listing/` | Edge Function (Gemini / OpenAI fallback) |
| `supabase/functions/_shared/moderation/response-schema.ts` | Provider schema pro striktní JSON výstup AI |
| `supabase/functions/_shared/moderation/gemini.ts` | Volání Gemini (`responseMimeType` + `responseSchema`) |
| `supabase/functions/_shared/moderation/openai.ts` | OpenAI fallback (`response_format: json_schema`) |
| `supabase/functions/_shared/moderation/issue-approval.ts` | Vydání approval tokenu po AI schválení |
| `supabase/functions/_shared/moderation/` | Kopie pravidel pro deploy (sync skriptem) |
| `src/lib/moderation/prohibited-scan.ts` | Server-side keyword scan před uložením |
| `src/config/moderation/category-fit.ts` | Enum `match` / `better_existing` / `missing_taxonomy` (telemetrie) |
| migrace `058` | Sloupce AI návrhu kategorie v `moderation_checks` (bez auto-create) |

### Strukturovaný JSON výstup (Gemini / OpenAI)

Komunikace s AI providery je **JSON na vstupu i výstupu**. Tvar odpovědi nevynucujeme jen textem v promptu — provider dostane **native structured output**:

| Vrstva | Kde | Co dělá |
|--------|-----|---------|
| **Request HTTP** | `gemini.ts` / `openai.ts` | `Content-Type: application/json`, tělo `JSON.stringify(...)` |
| **Gemini — formát odpovědi** | `generationConfig` v `gemini.ts` | `responseMimeType: "application/json"` + `responseSchema: GEMINI_MODERATION_RESPONSE_SCHEMA` |
| **OpenAI — formát odpovědi** | `response_format` v `openai.ts` | `type: "json_schema"`, `strict: true`, schema `OPENAI_MODERATION_RESPONSE_SCHEMA` |
| **Definice polí** | `response-schema.ts` | `status`, `reason`, `cleanedTitle`, `cleanedDescription`, `metaDescription`, `imageAlt`, `questions[]`, `categorySuggestion`, … |
| **Sémantika (co kam napsat)** | System prompt `build-prompt.ts` | Pravidla hydratace, REJECTED, SEO; věta „Výstup musí odpovídat provider JSON schema“ |
| **Pojistka po odpovědi** | `parse-response.ts` | Parse, strip kontaktů, filtr cenových otázek, clamp SEO |

**Proč:** bez `responseSchema` / `json_schema` by model mohl vracet markdown kolem JSON nebo vynechat pole. Schema = tvrdý tvar; prompt = obsah; parser = normalizace.

Schéma je součástí Edge Function (deploy s `moderate-listing`) — **není** v Next.js ani v DB.

### AI návrh kategorie (telemetrie)

Po AI volání se do `moderation_checks` uloží `category_fit` + návrh existujícího páru nebo `category_taxonomy_hint`. **Klient to nedostane**; platforma **nezakládá** kategorie. Agregace: Metodika A2. Nasazení: migrace `058` + `npx supabase functions deploy moderate-listing`.

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
| Nový inzerát | Ano — před publikací |
| Editace — změna názvu, popisu, kategorie | Ano |
| Editace — změna fotek (přidání, smazání, pořadí, hlavní náhled) | Ano — **všechny** aktuální fotky |
| Editace — publish-sensitive pole (cena, výměna, lokalita/souřadnice, stav, datum akce, délka inzerce, kontaktní volby, telefon, CV u práce) | Ano — stejný fingerprint jako u approval tokenu |

Logika: `src/lib/moderation/needs-moderation.ts` + `ListingImageUpload.hasImageChanges()`.  
**Proč i cena/lokalita:** token a DB trigger vážou všechna publish-sensitive pole — změna bez re-moderace by obešla gate (SEC-H01).

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
   - Závazný je hlavně **categoryType**. `REJECTED` jen při zjevně špatném typu (zboží vs práce, práce vs služby…).
   - Jiná podkategorie ve stejném typu → ne `REJECTED`, jen `categorySuggestion.fit=better_existing`.
   - Brigáda / hledám pomocníka (okna, úklid, zahrada) = `prace`, ne `sluzby`.

2. **Podkategorie s vlastním `aiPrompt`** v `src/config/categories.ts` — AI dostane konkrétnější očekávání. Příklad `zbozi/potraviny-domaci`:
   - Očekává jedlé výrobky (med, zavařeniny, pečivo…).
   - Zjevně nejedlý produkt (elektronika, router, WiFi extender, nábytek…) → `REJECTED`.
   - `prace/pece-zahrada`: úklid / mytí oken / zahrada jako brigáda patří sem; nepřehazovat do služeb.

3. **Kde upravovat chování:**
   - Obecné pravidlo → `build-prompt.ts`
   - Pravidla pro konkrétní podkategorii → `aiPrompt` u příslušné položky v `categories.ts`
   - Po změně: `npm run sync:moderation` → u změny `build-prompt.ts` ještě `node scripts/sync-build-prompt.mjs` → `supabase functions deploy moderate-listing`
   - SEO / hydratace textu: kanon [`seo/SEO_BIBLE.md`](./seo/SEO_BIBLE.md)

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
| Brigáda na mytí oken 250 Kč/h | `prace` / `pece-zahrada` | `APPROVED` / `NEEDS_QUESTIONS` — ne `REJECTED` (není služba) |

---

## Fotografie a AI kontrola

| Co | Kolik fotek | Účel |
|----|-------------|------|
| **Bezpečnostní filtr** | Všechny nahrané (max. 6) | Zbraně, drogy, porno… — zamítnutí jedné = zamítnutí celého inzerátu |
| **Cross-validace text ↔ foto** | Hlavní fotka (`mainImageIndex`) | Nabízená věc musí být na náhledu; doplňky na fotce OK, pokud popis výslovně vylučuje („židličky nejsou součástí“ → ne REJECTED) |
| **AI hydratace / dotazník** | **Všechny** fotografie | Vizuální kontext a doplňující otázky; hlavní fotka jen pro cross-validaci |

Klient nové soubory jednou nahraje do privátního immutable bucketu `moderation-image-staging`. Autentizovaná Next.js Server Action přes Sharp vytvoří WebP varianty všech fotek (Gemini 1024 px, Sightengine 512 px, kvalita 80) a uloží je pod SHA-256 originálu do privátního `moderation-image-renditions`. Do Edge klient posílá jen `imageReferences` + `mainImageIndex`; Edge sama stáhne plné objekty, spočítá SHA-256 pro SEC-H02 a podle něj načte důvěryhodné varianty. Při publikaci Server Action zkopíruje stejné bajty do `post-images` a publish gate je znovu zahashuje. Hvězdička u miniatury = **náhled na homepage**, ne „jediná kontrolovaná fotka“.

Řešení vyžaduje migrace `067_moderation_image_staging.sql` a `068_moderation_image_renditions.sql`; Supabase Storage Image Transformations nepoužívá. Uživatel nemá UPDATE ani DELETE ve stagingu a k rendition bucketu nemá žádnou policy. Úspěšné originály uklidí Server Action přes service role, opuštěné originály a varianty denní cron po 24 hodinách.

> **Oprava 2026-07-30:** `sync:moderation` dříve nevyhodnotil výrazy `LISTING_IMAGE_*` a zapsal fallback **500 KB / 2 MB**. Editace už publikovaného inzerátu pak padala na „Fotky pro AI kontrolu jsou příliš velké“, i když fotky byly ≤ 1 MB. Sync teď správně injektuje konstanty → **1 MB / 6 MB**; po opravě nutný re-deploy `moderate-listing`.

---

## Zapnutí AI moderace

**Pořadí je důležité** — nejdřív sync (vygeneruje `_shared`), pak deploy (přibalí čerstvý kód). Deploy před syncem = staré nebo prázdné prompty v cloudu.

1. Nastav secret v Supabase: `GEMINI_API_KEY` (příp. `OPENAI_API_KEY`). Model: **`gemini-2.5-flash`** (default v kódu; override secretem `GEMINI_MODEL`). Historie volby modelu → sekce níže.
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

## Volba Gemini modelu (rozhodnutí 2026-07-30)

**Aktuálně:** `gemini-2.5-flash` (default v `_shared/moderation/gemini.ts`). Přepnutí bez změny kódu: Supabase secret `GEMINI_MODEL`.

### Projednáno: `gemini-3.5-flash-lite`

| | |
|--|--|
| **Motiv** | Latence — Flash 2.5 je u moderace + hydratace pomalý (Edge timeout ~30 s). |
| **Verdikt** | **Zatím ne.** Kandidát na pozdější A/B, ne slepý hot-swap defaultu. |
| **Pipeline** | Mechanicky kompatibilní (obrázky, JSON schema, system prompt, fallback OpenAI). Rozbití kódu neočekáváme. |
| **Riziko** | Kvalita — workload není jen klasifikace, ale moderace + SEO hydratace + katalogové Parametry + `NEEDS_QUESTIONS`. Lite může ztenčit Parametry, zhoršit hraniční moderaci (escort, scam cena) a zvýšit počet dotazníků. |
| **API nuance** | U 3.5 Flash-Lite Google **ignoruje** custom `temperature` / top-K / top-P (náš `0.2` → default ~1.0 → větší variabilita textů). Frequency/presence penalty u nás nepoužíváme. |

**Jak vyzkoušet později (bez deploye kódu):**

```bash
npx supabase secrets set GEMINI_MODEL=gemini-3.5-flash-lite
# návrat:
npx supabase secrets set GEMINI_MODEL=gemini-2.5-flash
```

**QA před trvalou změnou (~10–15 inzerátů):** auto, elektronika s modelem, móda, hraniční NSFW, podvodná cena, málo textu + fotky — latence vs. kvalita Parametrů / false reject-approve.

**Alternativa při slabé Lite kvalitě:** plnější Flash řady 3.x (např. `gemini-3.6-flash` / 3.5 Flash) místo Lite. Default v kódu + docs (`ai-moderation.mdc`, PRD) měnit až po ověření.

---

## Server-side vynucení publikace (migrace `027` + `062`–`066`)

| Komponenta | Účel |
|------------|------|
| `moderation_approvals` | Approval tokeny: `content_fingerprint`, `new_image_hashes` (píše jen `service_role`) |
| `issue_moderation_approval` | RPC vydání tokenu (TTL 30 min, fingerprint + hashe fotek) |
| `publish_approved_post` | Jediná cesta `draft` → `active`/`hidden` — **jen `service_role`**; porovná fingerprint z `posts` + vazby `post_images` |
| `enforce_post_publish_gate` | Trigger — blokuje přímý publish; změna publish-sensitive polí → `draft`; staff bypass jen cizí inzerát (`066`) |
| `revert_post_on_image_change` | Trigger — změna fotek → `draft` |
| `increment_rate_limit` | Atomická inkrementace AI limitu; `rate_limits` bez grantů pro klient (`062`) |
| `check_report_threshold` | Trigger — 3× nahlášení inzerátu → `blocked` + `status_reason_code` |
| `prohibited-scan.ts` | Rychlý keyword scan v Server Action před uložením |
| `content-fingerprint.ts` | SHA-256 kanonických polí (Next + Deno, sync) |

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
- Trigger `check_report_threshold` — inzerát → `blocked` (větev `comment` → `hidden` je legacy; veřejná diskuse pod inzerátem se nepoužívá)
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
