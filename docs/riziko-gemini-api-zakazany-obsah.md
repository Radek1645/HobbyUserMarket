# Riziko Gemini API — zakázaný obsah od inzerentů

> **Datum:** 2026-07-21  
> **Stav:** otevřený problém / návrh řešení (zatím nerealizováno)  
> **Související:** [`moderace-inzeratu.md`](./moderace-inzeratu.md), PRD §5.4

---

## Společný kontext

AI moderace inzerátů běží primárně přes **Gemini API** (Edge Function `moderate-listing`). Do API se posílají **text i fotografie** inzerátu.

Platí:

1. [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
2. [Generative AI Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy)
3. [Abuse monitoring](https://ai.google.dev/gemini-api/docs/usage-policies)

Zakázané je mimo jiné sexuálně explicitní obsah (pornografie) a **CSAM** (*Child Sexual Abuse Material* — materiály zobrazující sexuální zneužívání dětí). Google loguje prompty/výstupy (u paid typicky ~55 dní) a při opakovaném porušení může **omezit Gemini API i Google účet**.

**Klíčové:** odpovědný je držitel API klíče (my), ne inzerent. Jednorázový „idiot“ typicky neodstřihne; zabije nás **opakovaný tok** zakázaného obsahu bez vlastní brány.

Dnes je Gemini **SPOF** pro sémantickou moderaci. Při banu klíče padá AI kontrola (zůstává OpenAI fallback, pokud je nastavený — ale to neřeší riziko u Gemini, jen výpadek).

---

## Problém 1 — Fotografie (hlavní riziko)

Pokud inzerent úmyslně nahraje porno, extrémní obsah nebo CSAM, vizuál teče přes **náš API klíč / Google projekt**.

| Scénář | Riziko odpojení |
|--------|-----------------|
| Jednorázový inzerent nahraje porno, Gemini/naše pravidla to odmítnou | Nízké |
| Systematický tok explicitního obsahu bez vlastní předfiltrace | Střední–vyšší |
| CSAM projde do API | Velmi vysoké |
| Sami generujeme/šíříme porno přes Gemini | Jasné porušení |

Fotky (hlavně CSAM) jsou **největší** riziko — vizuál je pro abuse monitoring silnější signál než text.

### Návrh řešení (fotky)

Viz [Vrstva 1–3](#návrh-řešení) níže: NSFW classifier před Gemini, hash matching na CSAM až při větším objemu, auto-ban po opakovaném abuse, oddělený Google projekt.

---

## Problém 2 — Textový vstup klienta

Stejný typ rizika platí i u **textu** (název, popis, odpovědi v Q&A). Google loguje **celý prompt** — explicitní nebo ilegální text tedy také teče přes náš klíč.

| | Text | Fotky |
|---|---|---|
| Platí Prohibited Use Policy? | Ano | Ano |
| CSAM | Popis / žádost o CSAM = vážné | Samotný obrázek = nejhorší |
| Porno / explicitní obsah | Může flagovat abuse monitoring | Silnější signál |
| Typický „útok“ | Prompt injection, spam, scoops, bot | Nahota / ilegální media |
| Praktické riziko banu | Nižší než u fotek, ale ne nula | Vyšší |

### Co už text částečně kryje

- Keyword scan zakázaných témat (`prohibited-scan`) — část textu chytí **před** AI
- Prompt-injection guard

### Co pořád chybí / je slabé

- Hard-hit kategorie (zejména **CSAM keywords**) nemusí být dostatečně striktní na „**Gemini vůbec nevolat** + okamžitá eskalace účtu“
- Obcházení keyword listu (synonyma, cizí jazyky, úmyslné překlepy) → text stejně dojde do Gemini
- Hromadné posílání stejného zakázaného textu (bot) = stejný abuse pattern jako u fotek

### Návrh řešení (text)

1. **Hard pre-filter před Gemini** — při hit na CSAM / těžce zakázané fráze: `REJECTED`, **Gemini nevolat**, log + eskalace / ban.
2. **Rozšířit keyword / pattern list** o synonymy a běžné obcházení (CZ + EN); držet ve `prohibited-topics` / `prohibited-scan`.
3. **Stejná produktová ochrana jako u fotek** — po N hard rejectech v okně → dočasný ban / manuální fronta; přísnější limit u nových účtů.
4. Gemini nechat na sémantiku a „měkké“ hraniční případy — ne jako první filtr na těžce ilegální text.

Text samotný spíš spustí safety block / reject než ban účtu. **CSAM text** (popis zneužívání dětí, žádost o takové materiály) je pořád vysoké riziko — nebrat na lehkou váhu.

---

## Současný stav (2026-07-21)

Co už máme:

- Gemini primárně + OpenAI fallback
- Keyword scan zakázaných témat
- Prompt-injection guard
- Limity velikosti fotek + komprese
- Rate limit AI moderace: **20 kontrol / hodinu / uživatel** (`MODERATION_RATE_LIMIT_PER_HOUR`) — ne za den
- Publish gate přes approval token (bez AI schválení nejde publikovat)

Co **nemáme**:

- NSFW / CSAM **předfiltr obrázků před voláním Gemini**
- Hard-hit text (CSAM) s politikou „Gemini nevolat + eskalace“
- Auto-ban / eskalace po opakovaných NSFW / hard-text rejectech
- Oddělený Google Cloud projekt jen pro moderaci

Dnes tedy platí: každá fotka i běžný text z formuláře může skončit v Gemini (keyword scan jen část textu odřízne).

---

## Cíl

Gemini **nepoužívat jako první filtr na porn/CSAM** (ani u fotek, ani u hard-hit textu).  
Gemini nechat na sémantiku inzerátu (kategorie, hydratace, Q&A).  
Špinavé věci odříznout **dřív**, než se zavolá Gemini.

```text
Upload (text + fotky)
  → [1a] hard text pre-filter (CSAM / těžce zakázané)
  → [1b] NSFW / CSAM brána na fotky
       ↓ reject → Gemini se NEVOLÁ (+ log / ban)
  → [2] Gemini / OpenAI (jen „čisté“ vstupy)
  → [3] post-check, manuální fronta u edge cases
```

---

## Návrh řešení

### Vrstva 1 — Brána před Gemini (priorita)

**Fotky**

1. **NSFW classifier** před `callGeminiModeration`  
   (např. Sightengine, Hive, AWS Rekognition, Google Vision SafeSearch, nebo open-source NSFW model).
2. Při vysoké pravděpodobnosti porn/nudity → **zamítnout u nás**, Gemini **nevolat**.
3. Pro CSAM (až bude objem / povinnost): hash matching (PhotoDNA / obdobné) — Gemini to spolehlivě „nevyřeší za nás“.

**Text**

1. Hard-hit scan (CSAM a další těžce zakázané) → reject **bez** volání Gemini.
2. Držet a rozšiřovat `prohibited-scan` / `prohibited-topics` (synonyma, EN, obcházení).
3. Soft/hraniční text nechat Gemini — hard ilegální text ne.

### Vrstva 2 — Produktová ochrana (levné, brzy)

- Přísnější limity u nových / neověřených účtů.
- Po N NSFW / hard-text rejectech v krátkém okně → dočasný ban nebo manuální fronta.
- Do AI posílat jen zmenšené fotky (už komprimujeme — držet).
- **Oddělený** Google projekt / API klíč jen na moderaci (při banu padne jen to).

### Vrstva 3 — Architektura bez SPOF

| Úloha | Nástroj |
|-------|---------|
| „Je to porno / nahota?“ (foto) | Levný NSFW API / model (před Gemini) |
| „Je to CSAM / těžce ilegální?“ (text) | Hard keyword / pattern pre-filter (před Gemini) |
| „Sedí kategorie, hydratace textu?“ | Gemini / OpenAI |
| Těžké / sporné případy | Ruční fronta moderátora |

OpenAI fallback už existuje — předfiltry ho doplňují, nenahrazují.

### Co nedělat

- Posílat každou fotku (ani každý hard-hit text) do Gemini „ať to posoudí“.
- Spoléhat jen na Gemini safety filters jako na compliance.
- Vypínat safety settings, aby „prošlo víc“.

---

## Doporučené pořadí implementace

1. **Teď:** NSFW pre-check fotek + hard-hit text pre-filter v pipeline `moderate-listing` (reject bez Gemini) + log; po opakovaném abuse auto-ban / fronta.
2. **Pak:** oddělený Gemini projekt/klíč; doplnit ToS / report flow (uživatel nesmí nahrávat ilegální obsah).
3. **Až poroste objem:** specializovaný CSAM/hash provider; případně Vertex AI s enterprise podmínkami, pokud to dává smysl.

### Kde v kódu

- Vstup: `supabase/functions/moderate-listing/index.ts`
- Volání modelu: `supabase/functions/_shared/moderation/gemini.ts`
- Text scan: `supabase/functions/_shared/moderation/prohibited-scan.ts` (+ zdroj `src/config/moderation/prohibited-topics.ts`)
- Příprava fotek (klient): `src/lib/moderation/prepare-moderation-images.ts`
- Rate limit: `supabase/functions/_shared/moderation/rate-limit.ts` (`AI_RATE_LIMIT_PER_HOUR = 20`)

Ideální místo pre-checků: **po** validaci auth / rate limitu / image limits, **před** `callGeminiModeration` / `callOpenAiModeration` (text hard-hit i NSFW fotek).

---

## Shrnutí

| Otázka | Odpověď |
|--------|---------|
| Můžou nás odříznout od Gemini? | Ano |
| Zabije nás jeden idiot? | Spíš ne |
| Co nás zabije? | Opakovaný tok CSAM/porna (foto i text) přes náš klíč bez předfiltru |
| Platí riziko i u textu? | Ano — nižší než u fotek, CSAM text pořád vážný |
| Musíme z Gemini pryč? | Ne — musíme přestat posílat podezřelé vstupy do Gemini |
| První krok | NSFW brána (foto) + hard-hit text pre-filter + eskalace abuse |

---

## Poznámka k limitu (záměna)

AI moderace: **20 / hodinu / uživatel**.  
20 / den platí u jiných funkcí (např. odhalení kontaktů, poptávky) — ne u AI checků.
