# Zadání pro Cursor: NSFW brána (Sightengine) + hard-hit text pre-filter před Gemini

## Kontext

Moderace inzerátů (`supabase/functions/moderate-listing/index.ts`) dnes posílá text i fotky přímo do Gemini (`_shared/moderation/gemini.ts`), s OpenAI fallbackem. Riziko: pokud přes náš API klíč systematicky protéká NSFW/CSAM obsah, hrozí omezení Gemini API i Google účtu — odpovědnost nese držitel klíče, ne inzerent.

Cíl: **odříznout očividně závadný obsah dřív, než se zavolá Gemini/OpenAI**, ne spoléhat na to, že to model sám odmítne.

Toto **NENÍ** CSAM detekce (hash matching = samostatný budoucí úkol po akreditaci). Tohle je:
- nudity/porn gate na fotky (Sightengine),
- hard-hit klíčová slova na text.

CSAM riziko se tím jen snižuje (méně hrubě závadného obsahu dorazí k Gemini) — **není vyřešené**.

Podklad: [`riziko-gemini-api-zakazany-obsah.md`](./riziko-gemini-api-zakazany-obsah.md).

### Architektonická realita (povinné respektovat)

`moderate-listing` běží **před** `createListing` / uložením fotek:
- v requestu jsou `imagesBase64`,
- **ještě není `post_id`**,
- fotky ještě **nejsou** ve veřejném storage bucketu.

Proto **nejde** při hard rejectu nastavit `is_quarantined` na listing ani „přesunout fotky z veřejného bucketu“. Evidence musí jít do **samostatné** tabulky + privátního bucketu ze snapshotu base64.

Existující `/mod/karantena` = inzeráty ve stavu `blocked` (reporty / moderátor). **Neslučovat** s evidence queue z tohoto úkolu.

V projektu **zatím není** `profiles.status = SUSPENDED`. Auto-suspend účtu = **fáze 2** (migrace + auth gate), ne tiše předpokládat existující mechanismus.

---

## Fáze 1 (tento úkol) — brána + evidence + counter

### 1. Sightengine modul

Soubor: `supabase/functions/_shared/moderation/sightengine.ts`

- Exportuj `checkImageNudity(imageBase64: string): Promise<{ rejected: boolean; reason?: string; raw?: unknown }>`.
- Vstup je **base64** (jak přichází z `moderate-listing`), ne URL z bucketu.
- Volej Sightengine REST API, model `nudity-2.1` (případně aktuální název dle jejich docs při implementaci).
- Výchozí prahy (laditelné konstanty v `src/config/moderation/` + sync do Edge):
  - `nudity.raw > 0.6` → `rejected: true, reason: "nudity_raw"`
  - `nudity.partial > 0.8` → `rejected: true, reason: "nudity_partial"`
  - jinak `rejected: false`
- Env: `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET` — dokumentuj v `.env.example`, nastav jako Supabase Edge secrets. Do kódu nepiš placeholdery/secrets.
- Timeout max **5 s**. Při chybě/timeoutu/nedostupnosti:
  - **nepokračuj do Gemini** (fail closed),
  - **netrestej** uživatele jako hard reject (nepočítá se do auto-ban counteru),
  - vrať klientovi stávající kontrakt technické chyby: HTTP 503 + `{ error: "TECHNICAL_ERROR", errorCode: "SIGHTENGINE_UNAVAILABLE", message: … }` (stejný vzor jako ostatní technické chyby v `moderate-listing`),
  - zaloguj `sightengine_unavailable` do audit/evidence (bez nutnosti ukládat fotky, pokud upload evidence selže — aspoň user_id + timestamp).

### 2. Hard-hit text pre-filter

Zdroj pravdy: `src/config/moderation/prohibited-topics.ts` (nebo sousední export v `src/config/moderation/`), pak **`npm run sync:moderation`** — nic negeneruj ručně jen do `_shared/`.

- Přidej samostatný seznam **hard-hit** termínů (CSAM a další těžce zakázané fráze, CZ + EN, běžné obcházení/leetspeak — prakticky nutný set, ne vyčerpávající encyklopedie).
- V `prohibited-scan.ts` (zdroj + sync do Edge) přidej  
  `checkHardHitText(text: string): { rejected: boolean; matchedCategory?: string }`  
  — **odděleně** od stávajícího `findProhibitedKeyword`.
- Normalizace: lowercase, strip diakritiky, odstranění mezer/interpunkce používané k obcházení. Bez embedding/ML.

**Vztah ke stávajícímu scanu:**
- `checkHardHitText` = **před** Gemini, fail closed, bez volání AI, evidence + counter.
- `findProhibitedKeyword` = nechat stávající chování (dnes i jako pojistka kolem AI flow). Neslučovat do jedné funkce — jiný důsledek.

### 3. Pipeline v `moderate-listing/index.ts`

Vlož pre-check **po** auth / rate limitu / image limits / základní validaci textu a kategorie, **před** `callGeminiModeration` / `callOpenAiModeration`:

```
1. checkHardHitText(title + description + Q&A odpovědi)
   → rejected:
     - Gemini/OpenAI SE NEVOLÁ
     - ulož evidence (bod 4)
     - increment hard-reject counter (bod 5)
     - return status: "REJECTED", errorCode: "HARD_HIT_TEXT", reason: srozumitelná CZ hláška

2. checkImageNudity() pro každou fotku (base64)
   → rejected:
     - Gemini/OpenAI SE NEVOLÁ
     - ulož evidence včetně snapshotu fotky do privátního bucketu (bod 4)
     - increment hard-reject counter
     - return status: "REJECTED", errorCode: "NSFW_IMAGE", reason: srozumitelná CZ hláška

3. oba OK → stávající Gemini/OpenAI flow beze změny
```

**API kontrakt vůči klientovi (povinné):**
- Nepřidávej nové top-level statusy typu `REJECTED_HARD_TEXT` / `REJECTED_NSFW_IMAGE` — klient (`moderate-listing-client.ts`) umí `REJECTED` / `APPROVED` / `NEEDS_QUESTIONS` / `TECHNICAL_ERROR`.
- Použij `status: "REJECTED"` + `errorCode` (`HARD_HIT_TEXT` | `NSFW_IMAGE`).
- Uprav klienta jen pokud je potřeba rozlišit hlášku / neretryovat (hard reject ≠ technical retry).

### 4. Evidence (ne „karanténa listingu“)

Nová tabulka např. `moderation_hard_reject_evidence` (název dle konvence projektu), min. pole:
- `id`, `user_id`, `created_at`
- `kind` (`hard_hit_text` | `nsfw_image` | `sightengine_unavailable`)
- `matched_category` / `reason` (nullable)
- `title_snippet` / hash nebo redacted text — **neukládej zbytečně plný CSAM text do běžných logů**; pro hard-hit stačí category + normalizovaný match token, ne celý popis
- `storage_path` (nullable) — cesta k snapshotu fotky v **privátním** admin-only bucketu (např. `moderation-evidence`)
- RLS: čtení jen service_role / admin role; žádný veřejný SELECT

Při hard rejectu fotky: Edge Function (service role) uloží base64 snapshot do privátního bucketu a zapíše řádek evidence. **Nemazat** evidence automaticky.

UI review fronty = **mimo scope fáze 1** (stačí tabulka + storage).

### 5. Counter (bez auto-suspend ve fázi 1)

- Counter per `user_id`, rolling window **24 h**, společně pro `HARD_HIT_TEXT` + `NSFW_IMAGE` (ne pro `SIGHTENGINE_UNAVAILABLE`).
- Konstanta `HARD_REJECT_AUTOBAN_THRESHOLD = 3` v configu (připravená na fázi 2).
- Ve fázi 1 při dosažení thresholdu: zaloguj event `hard_reject_threshold_reached` (user_id, count, window) do evidence/logu. **Zatím ne suspenduj účet** — chybí migrace + auth gate.

---

## Fáze 2 (follow-up, mimo tento PR / nebo samostatný commit po fázi 1)

- Migrace: suspend mechanismus na profilu (např. `profiles.suspended_at` / status) + gate při auth / create listing / moderate-listing.
- Při `count >= HARD_REJECT_AUTOBAN_THRESHOLD` v 24h → suspend + event `auto_ban_triggered`.
- Jednoduché admin UI nad `moderation_hard_reject_evidence` (neplést s `/mod/karantena`).
- Ladění prahů Sightengine podle false positives (plavky, sport).

---

## Co explicitně NEDĚLAT

- Hash matching (PhotoDNA / Thorn / CSAI).
- Embedding/ML model na text.
- `is_quarantined` na `posts` ani přesun fotek z veřejného bucketu v tomto kroku.
- Slučovat s `/mod/karantena` (`blocked` inzeráty).
- Mazat evidence.
- Propustit fotky do Gemini při chybě Sightengine.
- Předpokládat existující `SUSPENDED` bez migrace.
- Ručně editovat generované `_shared` soubory bez `sync:moderation`.

---

## Akceptační kritéria — fáze 1

- [x] Text s hard-hit frází **nikdy** nezavolá Gemini/OpenAI; odpověď `REJECTED` + `errorCode: "HARD_HIT_TEXT"` + evidence řádek. *(implementováno — ověřit na produkci po deployi)*
- [x] Fotka nad prahem nudity **nikdy** nezavolá Gemini/OpenAI; odpověď `REJECTED` + `errorCode: "NSFW_IMAGE"` + evidence (+ snapshot v privátním bucketu). *(implementováno — ověřit)*
- [x] Klient zobrazí zamítnutí (ne technický retry loop) u hard rejectů. *(status REJECTED → kind rejected)*
- [x] Sightengine výpadek/timeout → `TECHNICAL_ERROR` / `SIGHTENGINE_UNAVAILABLE`, **ne** tichý průchod do Gemini, **ne** hard-reject counter.
- [x] Čistý flow (bez hard rejectu) beze změny volá Gemini/OpenAI jako dřív.
- [x] Po 3 hard rejectech v 24h je zalogovaný `hard_reject_threshold_reached` (suspend až fáze 2).
- [x] Evidence není veřejně čitelná; žádné automatické mazání.

---

## Soubory k očekávané úpravě

| Oblast | Cesty |
|--------|--------|
| Edge pipeline | `supabase/functions/moderate-listing/index.ts` |
| Sightengine | `supabase/functions/_shared/moderation/sightengine.ts` (nový) |
| Hard-hit + scan | `src/config/moderation/prohibited-topics.ts` (nebo nový config), `src/lib/moderation/prohibited-scan.ts` → sync do `_shared` |
| Konstanty | `src/config/moderation/index.ts` (+ sync constants) |
| Klient | `src/lib/moderation/moderate-listing-client.ts`, případně `messages.ts` |
| DB | nová migrace: tabulka evidence + privátní bucket policy |
| Docs | krátká zmínka v `docs/moderace-inzeratu.md` |

Deploy pořadí beze změny: `npm run sync:moderation` → nastavit secrets → `supabase functions deploy moderate-listing`.
