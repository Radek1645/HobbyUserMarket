# Ukázka procesu moderace a hydratace — prodej auta

Konkrétní walkthrough: uživatel zakládá inzerát na **Škodu Rapid Spaceback** (fotka s SPZ `1TL 9939`), vyplní minimum textu a klikne **Publikovat**.

> **Důležité:** Moderace (bezpečnost) a hydratace (úprava textu) nejsou dva samostatné AI requesty v rámci jednoho kroku — probíhají v **jednom volání** Edge Function `moderate-listing`. Celý publish flow ale volá Edge Function **dvakrát**: (1) náhled bez tokenu, (2) finální kontrola s `issueApproval: true`.

---

## Vstupní data z formuláře (scénář)

| Pole | Hodnota |
|------|---------|
| Název | `Prodam auto` |
| Popis | `Prodám použité auto` |
| Kategorie | Zboží → Auta a moto (`zbozi` / `auta-moto`) |
| Stav | Použité |
| Typ ceny | Pevná cena |
| Cena | 95 000 Kč |
| Lokalita | Brno — do AI promptu **jde** (`locationText`) pro SEO / spádové město |
| Fotky | 1× hlavní fotka (bílá Škoda Rapid Spaceback) |
| Kontakt | Chráněné pole (telefon/e-mail) — do AI promptu **ne** |

---

## Časová osa — co kam a kdy

```mermaid
sequenceDiagram
    participant U as Uživatel (prohlížeč)
    participant CF as CreateListingForm
    participant PM as prepareModerationImages()
    participant SR as Sharp Server Action
    participant RL as runListingModeration()
    participant CL as invokeModerateListing()
    participant EF as Edge Function moderate-listing
    participant AI as Gemini 2.5 Flash
    participant SA as Server Action createListing

    U->>CF: Klik „Publikovat“
    CF->>PM: upload originálu jednou do privátního stagingu
    PM->>SR: imageReferences[]
    SR->>SR: SHA-256 originálu + WebP 1024/512 px
    SR-->>PM: varianty uloženy pod hashem
    PM-->>CF: imageReferences[], mainImageIndex: 0
    CF->>RL: title, description, kategorie, cena, lokalita, fotky…
    RL->>CL: 1. volání (bez issueApproval)
    CL->>EF: POST supabase.functions.invoke()
    EF->>EF: auth, rate limit, validace
    EF->>EF: hard-hit text + Sightengine NSFW
    EF->>EF: buildModerationSystemPrompt()
    EF->>EF: resolveCategoryAiPrompt(zbozi/auta-moto)
    EF->>EF: buildModerationUserPrompt() (+ locationText)
    EF->>AI: systemInstruction + userPrompt + fotky
    AI-->>EF: JSON (status, cleanedTitle, cleanedDescription, questions, meta, alt)
    EF->>EF: parse + filtr ceny + required questions + safety checks
    Note over EF: Token se NEvydává (issueApproval vypnuto)
    EF-->>CL: výsledek bez approvalToken
    CL-->>CF: ok / rejected / needs_questions
    CF->>U: ModerationApprovedDialog → ModerationPreviewDialog
    U->>CF: „Doplnit, upravit a publikovat“ (+ odpovědi na dotazník)
    CF->>CF: appendQuestionAnswersToDescription()
    CF->>CL: 2. volání (issueApproval: true, finální text + fotky)
    CL->>EF: znovu hard-hit / Sightengine / AI na přesný obsah
    EF->>EF: issueModerationApproval() → approvalToken
    EF-->>CL: výsledek + token
    CF->>SA: createListing(approvalToken, title, description…)
    SA->>SA: stripContactInfo(), prohibited-scan, publish_approved_post()
```

| Krok | Kde | Co se posílá |
|------|-----|--------------|
| 1 | `prepareModerationImages()` + Sharp Server Action | Nové originály jednou do privátního immutable stagingu; Sharp uloží 1024/512px varianty pod SHA-256 do service-role-only bucketu |
| 2 | `invokeModerateListing()` — 1. volání | JSON body → Edge Function (text + metadata vč. `locationText` + `imageReferences`, **ne** aiPrompt z klienta). Bez `issueApproval`. |
| 3 | Edge Function | Stáhne originály, spočítá SHA-256 a podle něj načte Gemini 1024 px / Sightengine 512 px varianty → pre-brána → AI |
| 4 | Gemini API | `systemInstruction` + `contents[0].parts` = text + inline_data obrázky |
| 5 | Edge Function | Parsuje JSON, filtruje otázky o ceně, doplní povinné otázky kategorie, safety checks. **Bez tokenu.** |
| 6 | Modal | Uživatel vidí `cleanedTitle` / `cleanedDescription` / SEO / dotazník |
| 7 | `invokeModerateListing({ issueApproval: true })` | Finální text + stejné Storage reference — znovu plná kontrola → `approvalToken` |
| 8 | `createListing` | Finální text + `approvalToken`; staging originály se zkopírují do finálního Storage a re-hashují → DB, stav `active` |

**Proč dvě volání:** první jen připraví náhled. Token se váže na přesný odesílaný obsah — kdyby vznikl už po 1. kontrole, šlo by po schválení vyměnit text/fotky.

---

## Volané funkce a soubory

### Klient (prohlížeč)

| Funkce / komponenta | Soubor |
|---------------------|--------|
| `CreateListingForm` — orchestrace | `src/components/listing/CreateListingForm.tsx` |
| `prepareModerationImages()` | `src/lib/moderation/prepare-moderation-images.ts` |
| `runListingModeration()` | `src/lib/moderation/run-listing-moderation.ts` |
| `invokeModerateListing()` | `src/lib/moderation/moderate-listing-client.ts` |
| `requestFinalApproval()` | `CreateListingForm.tsx` — 2. volání s `issueApproval: true` |
| `appendQuestionAnswersToDescription()` | `src/lib/moderation/append-question-answers.ts` |
| `ModerationApprovedDialog` | `src/components/moderation/ModerationApprovedDialog.tsx` |
| `ModerationPreviewDialog` | `src/components/moderation/ModerationPreviewDialog.tsx` |
| `createListing` (Server Action) | `src/app/actions/posts.ts` |

### Edge Function (Supabase)

| Funkce | Soubor |
|--------|--------|
| HTTP handler | `supabase/functions/moderate-listing/index.ts` |
| Hard-hit text | `_shared/moderation/prohibited-scan.ts` + `hard-hit-terms.ts` |
| Sightengine NSFW | `_shared/moderation/sightengine.ts` |
| `buildModerationSystemPrompt()` | `_shared/moderation/build-prompt.ts` |
| `buildModerationUserPrompt()` | `_shared/moderation/build-user-prompt.ts` |
| `resolveCategoryAiPrompt()` | `_shared/moderation/category-prompts.ts` |
| `callGeminiModeration()` | `_shared/moderation/gemini.ts` |
| `parseModerationResponse()` | `_shared/moderation/parse-response.ts` |
| `filterRedundantPriceQuestions()` | `_shared/moderation/parse-response.ts` |
| `ensureRequiredCategoryQuestions()` | `_shared/moderation/required-category-questions.ts` |
| `applyPostModerationSafetyChecks()` | `_shared/moderation/prompt-injection-guard.ts` |
| `issueModerationApproval()` | `_shared/moderation/issue-approval.ts` (jen při `issueApproval: true`) |
| `logModerationCheck()` | `_shared/moderation/log-moderation-check.ts` |
| `assertAiModerationRateLimit()` | `_shared/moderation/rate-limit.ts` |

### Konfigurace (zdroj pravdy)

| Co | Soubor |
|----|--------|
| Zakázaný obsah | `src/config/moderation/prohibited-topics.ts` |
| System prompt (reference) | `src/config/moderation/build-prompt.ts` |
| aiPrompt kategorií | `src/config/categories.ts` |
| Limity délky | `src/config/app.ts` → sync do `constants.ts` |
| Feature flag | `src/config/moderation/index.ts` (`MODERATION_ENABLED`) |

---

## Payload z klienta do Edge Function

Co `invokeModerateListing()` pošle v `body` (zkráceno).

> **Pozor — tři různé „JSON“:**
> 1. **Klient → Edge** (tato sekce) — formulářová data + fotky.
> 2. **Edge → Gemini** (sekce níže „Request na Gemini API“) — `systemInstruction` + user text + obrázky + `responseSchema`.
> 3. **Gemini → Edge** (sekce „Co AI typicky vrátí“) — výsledek moderace/hydratace.
>
> „1. volání (náhled)“ = bod 1, **ne** request do Google API.

### 1. volání (náhled) — klient → Edge

```json
{
  "intent": "create",
  "title": "Prodam auto",
  "description": "Prodám použité auto",
  "categoryType": "zbozi",
  "subcategorySlug": "auta-moto",
  "conditionLabel": "used",
  "conditionLabelText": "Použité",
  "conditionFieldLabel": "Stav",
  "priceType": "fixed",
  "priceTypeLabel": "Pevná cena",
  "priceAmount": 95000,
  "locationText": "Brno",
  "imageReferences": [
    {
      "bucket": "moderation-image-staging",
      "storagePath": "<user-id>/<session-id>/<image-id>.webp"
    }
  ],
  "mainImageIndex": 0
}
```

### 2. volání (po potvrzení modalu) — klient → Edge

Stejná struktura + `"issueApproval": true` a **finální** `title` / `description` (po hydrataci a odpovědích z dotazníku, nebo původní text při „Ignorovat AI“).

Klient **nikdy neposílá** `aiPrompt` — ten si Edge Function načte ze `category-prompts.ts` podle `categoryType` + `subcategorySlug`.

---

## System prompt (moderace + hydratace)

Sestaví `buildModerationSystemPrompt()` v `build-prompt.ts`.  
U **Gemini** se volá varianta `geminiSafe: true` — zakázané kategorie jen jako `[id] label` (bez `criteria`), aby Google neblokoval nevinné fotky.

### Část A — moderace (bezpečnost)

```
Jsi moderátor lokálního inzerátového serveru v Česku. Vyhodnoť název, popis a všechny přiložené fotografie inzerátu.

ZAMÍTNI (status REJECTED), pokud text nebo fotografie zjevně porušuje kategorii níže. U hraničních případů použij běžný rozum a český právní rámec běžného inzerátového portálu.
1. [illegal_drugs] Drogy a omamné látky
2. [weapons] Zbraně a munice
3. [sexual_services] Sexuální služby a pornografie
4. [human_organs] Lidské orgány a tkáně
5. [stolen_goods] Kradené věci
6. [counterfeit] Padělky a nelegální repliky
7. [hate_violence] Nenávist a násilí
8. [scam_fraud] Podvod a phishing
9. [animals_illegal] Nelegální obchod se zvířaty
10. [medical_prescription] Léky na předpis
11. [tobacco_alcohol_minors] Alkohol a tabák pro nezletilé
12. [minor_photos] Fotografie dětí a adolescentů
13. [gambling_illegal] Hazard a sázkové produkty
14. [financial_products] Finanční produkty a služby

Pravidla pro fotografie:
- Bezpečnostní filtr musí projít VŠECHNY fotografie (max. 6). Zamítnutí jedné fotky = zamítnutí celého inzerátu.
- U REJECTED kvůli fotce uveď rejectedImageIndex (0-based index fotky v pořadí).
- Hlavní fotka (mainImageIndex) slouží výhradně pro cross-validaci text ↔ foto: název a popis musí odpovídat tomu, co je na hlavní fotce (náhled na homepage). Sémantická neshoda → REJECTED (konzistence).
- Pro hydrataci a doplňující otázky (NEEDS_QUESTIONS) procházej VŠECHNY přiložené fotografie — fakta z jakékoli fotky zapracuj do úvodu nebo Parametrů.

Kontakty (e-mail, telefon) v textu nejsou důvod k zamítnutí — pouze je v cleanedDescription nahraď [SKRYTO – použij chráněné pole].
```

**U našeho příkladu:** Text „Prodám použité auto“ + fotka auta = **konzistentní** → moderace nezamítne. SPZ na fotce není důvod k REJECTED (není v zakázaných kategoriích). Hard-hit a Sightengine také projdou (běžné auto).

### Část B — hydratace (text) + SEO

Stejný system prompt pokračuje pravidly pro `cleanedDescription`, `metaDescription` a `imageAlt`:

```
Hydratace a kvalita textu (pokud obsah NENÍ REJECTED):
- Cíl hydratace: pomoci uživateli prodat — text má být čtivý, přívětivý…
- cleanedDescription piš ve dvou částech:
  1) ÚVOD: až 6 vět — co nabízíš, hlavní výhody z textu, všech fotek a formuláře, cena v úvodu
  2) PARAMETRY: po „---“ a nadpisu „Parametry“ odrážky „• Popisek: hodnota“
- Do cleanedDescription zapracuj fakta z popisu, formuláře, fotek — a u jasně identifikovaného modelu i katalogové vlastnosti výrobku.
- metaDescription / imageAlt dle SEO bible (lokalita v meta, ne v alt).
- Kusové údaje (vady, příslušenství v balení) jen z textu/fotek.
- Pokud chybí kritická kusová data dle kontextu kategorie, vrať NEEDS_QUESTIONS s 1–5 otázkami.
- Pokud user prompt uvádí pevnou cenu z formuláře, NIKDY se na cenu neptej.

Limit délky popisu:
- cleanedDescription max 2000 znaků
- U NEEDS_QUESTIONS max 1600 znaků (rezerva 400 na odpovědi z dotazníku)

Odpověz výhradně validním JSON:
{
  "status": "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS",
  "reason": "...",
  "rejectedTopicId": "...",
  "rejectedImageIndex": 0,
  "cleanedTitle": "string",
  "cleanedDescription": "string",
  "metaDescription": "string",
  "imageAlt": "string",
  "questions": [{ "id": "string", "label": "string", "paramLabel": "string" }]
}
```

---

## User prompt (konkrétní ukázka pro náš inzerát)

Sestaví `buildModerationUserPrompt(body, categoryAiPrompt)` — sekce oddělené prázdným řádkem:

```
Úkol: moderuj inzerát (text + fotografie) a vrať JSON dle system promptu.

Formát cleanedDescription: nejdřív úvod (až 6 vět), pak „---“, nadpis „Parametry“ a odrážky • Popisek: hodnota.

Tvrdý limit délky: publikovaný popis max 2000 znaků. U NEEDS_QUESTIONS drž cleanedDescription do 1600 znaků (rezerva na odpovědi z dotazníku).

Akce: create

Kategorie: zbozi / auta-moto

Kontext kategorie pro hydrataci a doplňující otázky:
Analyzuj nabízené zboží. cleanedDescription: úvod (co prodáváš + cena v textu) a sekce Parametry s odrážkami (nájezd, rozměry, materiál, výbava, stav…). Ve formuláři dostaneš stav — u „Poškozené / na díly“ bez rozsahu vady se ptej. Doplňující otázky jen na chybějící zásadní parametry. Na cenu se neptej, pokud je ve formuláři.

Úvod + Parametry (rok, nájezd, motorizace, STK, výbava, stav). Na cenu se neptej, pokud je ve formuláři — cenu dej do úvodu. Dotazník jen na chybějící údaje.

Stav z formuláře: Použité

Typ ceny z formuláře: Pevná cena, 95 000 Kč. Do cleanedDescription vlož přímo „Cena 95 000 Kč.“ (nebo přirozeně zapracovanou do věty). Do metaDescription „za 95 000 Kč“. Nikdy nepoužívej zástupný text [SKRYTO – použij chráněné pole] — ten je výhradně pro e-mail a telefon. Na cenu se znovu neptej.

Lokalita z formuláře:
Brno

mainImageIndex (hlavní fotka — jen cross-validace textu s náhledem): 0

Přiloženo 1 fotografií v pořadí indexů 0–0. Pro hydrataci a dotazník posuzuj všechny fotografie; fakta z jakékoli fotky zapracuj do textu.

Název inzerátu:
Prodam auto

Popis inzerátu:
Prodám použité auto
```

K user promptu Gemini Edge přidá inline WebP varianty **všech fotek**, vytvořené Sharpem z příslušných Storage originálů (max. 1024 px, kvalita 80). Cestu každé varianty Edge odvodí z vlastního SHA-256 plného originálu; approval token se váže na tento hash, ne na AI variantu.

---

## Request na Gemini API (Edge → Google)

Edge (`callGeminiModeration` v `gemini.ts`) **nepřeposílá** client payload 1:1. Sestaví HTTP POST na  
`…/models/gemini-2.5-flash:generateContent` s tělem ve tvaru:

```json
{
  "systemInstruction": {
    "parts": [{ "text": "<system prompt z buildModerationSystemPrompt(geminiSafe: true)>" }]
  },
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "<user prompt z buildModerationUserPrompt — viz sekce výše>" },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "<JPEG base64 fotky Škody Rapid>"
          }
        }
      ]
    }
  ],
  "safetySettings": [
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
  ],
  "generationConfig": {
    "temperature": 0.2,
    "responseMimeType": "application/json",
    "responseSchema": {
      "type": "OBJECT",
      "required": [
        "status",
        "reason",
        "rejectedTopicId",
        "rejectedImageIndex",
        "cleanedTitle",
        "metaDescription",
        "imageAlt",
        "cleanedDescription",
        "questions",
        "categorySuggestion"
      ],
      "properties": {
        "status": { "type": "STRING", "enum": ["APPROVED", "REJECTED", "NEEDS_QUESTIONS"] },
        "reason": { "type": "STRING", "nullable": true },
        "rejectedTopicId": { "type": "STRING", "nullable": true },
        "rejectedImageIndex": { "type": "INTEGER", "nullable": true, "minimum": 0 },
        "cleanedTitle": { "type": "STRING", "nullable": true },
        "metaDescription": { "type": "STRING", "nullable": true },
        "imageAlt": { "type": "STRING", "nullable": true },
        "cleanedDescription": { "type": "STRING", "nullable": true },
        "questions": {
          "type": "ARRAY",
          "maxItems": 5,
          "items": {
            "type": "OBJECT",
            "required": ["id", "label", "paramLabel"],
            "properties": {
              "id": { "type": "STRING" },
              "label": { "type": "STRING" },
              "paramLabel": { "type": "STRING", "nullable": true }
            }
          }
        },
        "categorySuggestion": { "type": "OBJECT", "nullable": true }
      }
    }
  }
}
```

`responseSchema` = plná konstanta `GEMINI_MODERATION_RESPONSE_SCHEMA` z `response-schema.ts` (výše zkráceno u `categorySuggestion`).  
OpenAI fallback posílá analogicky `messages[]` + `response_format: { type: "json_schema", … }` — viz `openai.ts`.

**Mapování našeho scénáře do requestu:**

| Část Gemini body | Odkud |
|------------------|--------|
| `systemInstruction.parts[0].text` | System prompt (sekce výše) |
| `contents[0].parts[0].text` | User prompt (sekce výše) |
| `contents[0].parts[1].inline_data` | Fotka z `imagesBase64[0]` |
| `generationConfig.responseSchema` | `response-schema.ts` — vynucuje tvar odpovědi níže |

---

## Co AI typicky vrátí (ukázková odpověď)

U minimálního textu, ale srozumitelné fotky auta, očekáváme **`NEEDS_QUESTIONS`** — z fotky lze odvodit značku/model/barvu, ale chybí nájezd, rok, motorizace, STK.

> Toto je **bod 3** (Gemini → Edge): obsah `candidates[0].content.parts[].text` po `responseMimeType: application/json`. Edge ho parsuje v `parseModerationResponse()`.

```json
{
  "status": "NEEDS_QUESTIONS",
  "cleanedTitle": "Prodám Škodu Rapid Spaceback",
  "cleanedDescription": "Prodávám použitou Škodu Rapid Spaceback v bílé barvě. Auto je v dobrém vizuálním stavu, vhodné pro každodenní provoz. Cena 95 000 Kč, osobní předání v Brně.\n\n---\n\nParametry\n• Značka a model: Škoda Rapid Spaceback\n• Barva: bílá\n• Stav: použité",
  "metaDescription": "Škoda Rapid Spaceback v Brně za 95 000 Kč. Použité auto v dobrém vizuálním stavu.",
  "imageAlt": "Bílá Škoda Rapid Spaceback, boční pohled",
  "questions": [
    {
      "id": "q1",
      "label": "Jaký je nájezd vozidla v km?",
      "paramLabel": "Nájezd"
    },
    {
      "id": "q2",
      "label": "Z jakého roku je vozidlo?",
      "paramLabel": "Rok výroby"
    },
    {
      "id": "q3",
      "label": "Jaká je motorizace (objem a výkon)?",
      "paramLabel": "Motorizace"
    },
    {
      "id": "q4",
      "label": "Do kdy platí STK?",
      "paramLabel": "STK platná do"
    }
  ]
}
```

> Skutečná odpověď se může lišit — jde o ilustraci chování, ne garantovaný výstup modelu.

### Post-processing na Edge Function (1. i 2. volání)

| Funkce | Co udělá |
|--------|----------|
| `parseModerationResponse()` | Extrahuje JSON, normalizuje uvozovky, strip kontaktů v popisu |
| `filterRedundantPriceQuestions()` | Odstraní otázky typu „Jaká je cena?“ — u nás nic neodstraní (cena je ve formuláři) |
| `normalizeModerationResult()` | Doplní fallbacky pro prázdný title/description |
| `ensureRequiredCategoryQuestions()` | Doplní povinné otázky dle kategorie, pokud AI nějakou vynechala |
| `applyPostModerationSafetyChecks()` | Prompt-injection / keyword pojistka na výstupu AI |
| `issueModerationApproval()` | **Jen 2. volání** (`issueApproval: true`) — TTL 30 min, fingerprint + hashe fotek |

1. volání vrátí klientovi JSON **bez** `approvalToken`.  
2. volání vrátí stejný typ výsledku + `approvalToken` (nebo `REJECTED`, pokud finální text neprojde).

---

## Co vidí uživatel po AI

1. **Overlay** — „Probíhá AI kontrola inzerátu“ (~5–15 s) — 1. volání
2. **ModerationApprovedDialog** — „Inzerát je v pořádku“ → Pokračovat
3. **ModerationPreviewDialog** — editovatelný název/popis + SEO + dotazník (4 otázky) + skóre kvality

Uživatel doplní např.:

| Otázka | Odpověď |
|--------|---------|
| Nájezd | `187000` → zobrazí se jako `187 000 km` |
| Rok výroby | `2015` |
| Motorizace | `1.2 TSI, 63 kW` |
| STK | `03/2027` |

Po kliknutí **„Doplnit, upravit a publikovat“**:

- `appendQuestionAnswersToDescription()` připojí odpovědi do sekce Parametry
- **2. volání** `moderate-listing(issueApproval: true)` na finální text + fotky → `approvalToken`
- `createListing()` uloží finální text, `original_title` / `original_description` = původní „Prodam auto“ / „Prodám použité auto“
- `publish_approved_post(approvalToken)` → stav `active`

Při publikaci se overlay znovu krátce zobrazí (finální kontrola).

### Finální popis v DB (po sloučení odpovědí)

```
Prodávám použitou Škodu Rapid Spaceback v bílé barvě. Auto je v dobrém vizuálním stavu, vhodné pro každodenní provoz. Cena 95 000 Kč, osobní předání v Brně.

---

Parametry
• Značka a model: Škoda Rapid Spaceback
• Barva: bílá
• Stav: použité
• Nájezd: 187 000 km
• Rok výroby: 2015
• Motorizace: 1.2 TSI, 63 kW
• STK platná do: 03/2027
```

---

## Kdy by moderace zamítla (pro srovnání)

| Situace | Status | Důvod |
|---------|--------|-------|
| Text „Prodám kolo“, fotka auta | `REJECTED` | Neshoda text ↔ hlavní fotka |
| Fotka se zbraní | `REJECTED` | `rejectedTopicId: "weapons"` |
| Text „Prodám kokain“ | `REJECTED` | `rejectedTopicId: "illegal_drugs"` (nebo hard-hit před Gemini) |
| Fotka s rozpoznatelným dítětem | `REJECTED` | `rejectedTopicId: "minor_photos"` |
| Finální text v modalu přepsaný na zakázaný obsah | `REJECTED` ve **2. volání** | Token nevznikne → nepublikuje se |

---

## Rozdělení odpovědností: moderace vs. hydratace

| Aspekt | Moderace | Hydratace |
|--------|----------|-----------|
| **Účel** | Smí obsah na web? | Jak má vypadat finální text? |
| **Výstup při úspěchu** | `APPROVED` nebo `NEEDS_QUESTIONS` | `cleanedTitle`, `cleanedDescription`, `questions`, SEO |
| **Výstup při neúspěchu** | `REJECTED` + `reason` | Nespouští se (hydratace je podmíněná „není REJECTED“) |
| **Kde v promptu** | System prompt — zakázané kategorie, fotky, cross-validace | System prompt — struktura textu; user prompt — `aiPrompt` kategorie + lokalita |
| **UI** | `ModerationRejectedDialog` | `ModerationPreviewDialog` |
| **Token** | Vydá se až ve 2. volání (`issueApproval`) po potvrzení modalu | Stejné volání — hydratace z 1. volání, finální text znovu zkontrolován ve 2. |

---

## Související dokumentace

- [`moderace-inzeratu.md`](./moderace-inzeratu.md) — pravidla, deploy, strip kontaktů, publish-sensitive pole
- [`hydratace-inzeratu.md`](./hydratace-inzeratu.md) — struktura popisu, dotazník, limity
- [`Metodika.md`](./Metodika.md) §6 — uživatelský popis flow
