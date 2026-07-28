# Security, AI, UX a SEO audit — 2026-07-27

> Projekt: **zaPikolou.cz / HobbyUserMarket**  
> Auditovaná větev: `main`  
> Zdroje: aktuální kód a SQL migrace, `docs/TO-DO_Fable.md`, `docs/PRD_v3.md` v3.46, `docs/Metodika.md`, `docs/seo/SEO_BIBLE.md` v1.8  
> Omezení: jde o statický audit repozitáře. Nebyl proveden penetrační test produkce ani kontrola skutečně nasazených Supabase politik, Vercel konfigurace, DNS a secrets.

## 1. Executive Summary

### Celkový stav

Aplikace má proti minulému auditu výrazně lepší bezpečnostní základ:

- původní kritické úniky kontaktů přes RLS a `posts.contact_phone` jsou opravené,
- publikace používá DB gate, jednorázový approval token a serverovou validaci,
- Server Actions kontrolují vlastníka nebo staff roli,
- vstupy formulářů jsou validovány na serveru,
- moderace při výpadku AI, Sightengine nebo rate-limit DB selhává bezpečně,
- popis inzerátu se renderuje jako text, nikoli jako HTML.

Aktuální stav ale nelze označit za bezpečný pro ostrý provoz bez dalších oprav. Audit našel **0 kritických, 4 vysoké, 6 středních a 7 nízkých** bezpečnostních/hardening nálezů.

### Top 3 nálezy

> **Dodatek 2026-07-27:** Nálezy 1–3 (SEC-H01–H04) mají implementovanou opravu — detaily a residua u jednotlivých nálezů v [§3](#3-detailní-bezpečnostní-nálezy).

1. **Původní nález: approval token nebyl svázán s moderovaným obsahem.** Oprava implementovaná a **nasazená** (migrace 062–066 + Edge + Next.js po pushi 2026-07-28 večer); manuální smoke ověřen.
2. **Původní nález: AI rate limit šlo obejít přes Supabase API.** Oprava oprávnění a atomické inkrementace je implementovaná v migraci 062 (nasazeno) + EF deploy.
3. **Původní nález: produkční závislosti obsahovaly známé High zranitelnosti.** Next.js 15.5.22 + overrides; `npm audit --omit=dev` → 0.

### Ověření

- `npm run build`: **prošlo** na Next.js 15.5.22.
- `npm audit --omit=dev`: **0 zranitelností** po override `postcss` a `sharp`.
- `npm run lint`: **prošlo bez chyb**; zůstává jeden starší unused-variable warning v detailu inzerátu.
- Bez automatizovaných bezpečnostních testů nelze potvrdit, že migrace v produkční DB odpovídají snapshotu.

> **Stav nasazení 2026-07-28 večer:** migrace `062`–`066` a Edge Function `moderate-listing` **nasazeny**. Manuální smoke SEC-H01/H02 **ověřen** (create, edit, cena/lokalita/datum/kontakty → AI, fotka → AI, pauza → `hidden`, zrušení bez uložení nepersistuje). Push Next.js aplikace součástí uzavření session (default covers, ISO `eventDate`, sport výbava).

---

## 2. Status oprav z minulého auditu (`docs/TO-DO_Fable.md`)

### Opraveno a ověřeno v aktuálním kódu

| ID | Stav | Důkaz |
|---|---|---|
| C1 | Opraveno | `profiles_select_public` je odstraněna; cizí PII se čte přes RPC. `supabase_schema.sql:775-787`, `supabase/025_contact_privacy_hardening.sql:11-17` |
| C2 | Opraveno | `contact_phone` je odebrán z veřejného SELECT a detail používá explicitní sloupce. `supabase_schema.sql:1133`, `src/app/inzerat/[slug]/page.tsx:80-98` |
| H1 / P1 / P14 | Opraveno v kódu | Insert jde do `draft`; migrace 063 váže service-role-only publikaci na finální DB obsah a přesné soubory fotografií. |
| H2 | Částečně opraveno | IP/per-post limit, honeypot a generické chyby existují. CAPTCHA a ochrana cross-site požadavků chybí. |
| H3 | Opraveno | Interní redirect je sanitizován ve sdíleném helperu. |
| M1–M2 | Opraveno | Reveal RPC ověřuje přihlášení, viditelnost a limit 20 unikátních inzerátů/24 h. |
| M3–M4 | Opraveno v kódu | DB triggery chrání `company_ico_verified`, `payment_status`, `renew_count`, `expires_at`. `supabase/047_security_column_guards.sql:11-126` |
| M5–M8 | Opraveno | Generické chyby, fail-closed rate limiting, velikost a magic bytes obrázků. |
| M9 | Částečně opraveno | Magic bytes příloh jsou kontrolovány; antivirová kontrola chybí. `src/lib/inquiry/validation.ts:130-187` |
| M10 | Výrazně zlepšeno | Tag boundaries, injection patterny a post-output kontrola jsou aktivní. `supabase/functions/_shared/moderation/prompt-injection-guard.ts:3-87` |
| P8–P11 | Opraveno | Technická chyba se nezaměňuje za obsahové zamítnutí, timeouty a retry existují. |
| P12 | Opraveno | Zamítnutá fotka je zvýrazněna. `src/components/listing/CreateListingForm.tsx:522-532` |
| P20–P24, P31 | Opraveno | Souhlasy, onboarding, smazání účtu a mapování auth chyb jsou implementované. |
| P35 | Opraveno v kódu | Virtuální pageview existuje; konfiguraci GTM je nutné ověřit mimo repo. |
| P41 | Opraveno | Kategorie suggestion se validuje a loguje jako telemetrie. |
| U1–U12, U14, U17–U28 | Převážně opraveno | Kontrolované UX změny jsou v aktuálních komponentách přítomné. |

### Přetrvává

| ID | Stav |
|---|---|
| H2-R / P16 | Bez CAPTCHA; endpoint poptávek nepodmiňuje JSON Content-Type ani původ požadavku. |
| M9-R | Přílohy bez AV/malware skenu. |
| L1–L5, L7 | Přetrvávají dle backlogu; L2, L4 a L5 jsou níže konkretizovány. |
| P5 | Prodloužení stále ručně přičítá 30 dní místo řízení přes `listing_duration_days`. |
| P13 | Po AI následují dva modaly. `src/components/listing/CreateListingForm.tsx:590-614` |
| P29 | Chyby pause/publish se tiše přesměrují bez zprávy. |
| P30 | Auditní data a poznámky existují, sjednocená God Mode timeline chybí. |
| P32 | P2B e-mailové lhůty 15/30 dní deklarované ve VOP nejsou implementované. |
| P34/P34b | Bez preloadu LCP obrázku a bez doloženého opakovaného měření. |
| P36 | Cookie tlačítka nemají stabilní GTM ID. |
| P40 | `moderation_checks` neukládá verzi promptu/model-policy snapshot. |
| Smoke A6, B1–B5, C, D1 | V minulém auditu zůstávají neověřené; statická přítomnost triggeru nenahrazuje test nasazené DB. |

### Regrese nebo zastaralý zápis minulého auditu — opraveno v dokumentaci

- ~~`TO-DO_Fable` „Žádný `dangerouslySetInnerHTML`“~~ → zápis sladěn: API se používá pro JSON-LD a GTM; listing JSON-LD escapuje `<` (`serializeListingJsonLd`); homepage/FAQ a další statické bloky zatím bez společného serializeru.
- ~~`TO-DO_Fable` P31 „věkový souhlas není v DB“~~ → zápis sladěn: `age_confirmed_at` od migrace **044**.
- ~~Metodika `§11.2` „Poznámka — zatím ne“~~ → zápis sladěn: Poznámky ano (§11.4.1); sjednocená Historie/timeline stále ne (§11.4 / P30).

---

## 3. Detailní bezpečnostní nálezy

### KRITICKÉ

Nebyl potvrzen žádný aktuálně zneužitelný kritický nález. Toto hodnocení předpokládá, že produkční Supabase má nasazeny migrace 025–061. Bez kontroly produkce nelze stav RLS definitivně potvrdit.

### VYSOKÉ

#### SEC-H01 — Approval token není svázán s moderovaným textem

**Důkaz**

- `moderation_approvals` obsahuje jen `user_id`, `image_count`, TTL a spotřebu: `supabase/027_moderation_publish_gate.sql:12-21`.
- Edge vydává token jen s `userId` a `imageCount`: `supabase/functions/_shared/moderation/issue-approval.ts:9-25`.
- RPC kontroluje vlastníka, token, TTL a počet fotek, ne title/description/kategorii/cenu/lokalitu: `supabase/027_moderation_publish_gate.sql:180-229`.
- Server Action zapíše aktuální `FormData` a následně použije token: `src/app/actions/posts.ts:139-200`, `250-318`.

**Dopad**

Útočník nechá AI schválit benigní text, pak před Server Action změní pole na obsah, který nezasáhne jednoduchý keyword scan, a publikuje ho se starým tokenem. Tím se obchází deklarace PRD, že publikovaný obsah prošel AI filtrem.

**Oprava**

- Vypočítat na Edge SHA-256 z kanonicky normalizovaných polí: title, description, category, subcategory, condition, price type/amount, location, event date a relevantních přepínačů.
- Uložit `content_fingerprint` do `moderation_approvals`.
- `publish_approved_post` musí dostat fingerprint publikovaného payloadu a porovnat jej atomicky před změnou stavu.
- Ještě bezpečnější je přesunout zápis draftu před moderaci a approval vázat přímo na `post_id` + verzi řádku.

**Stav 2026-07-27 večer (063) — opraveno v kódu.** Původní oprava 062 nestačila: test se změnou ceny prošel, protože věřila klientskému fingerprintu a nepokrývala všechna pole. Finální kontrola nyní znovu moderuje přesný text, Edge token váže na title, description i všechna publish-sensitive pole a service-role-only `publish_approved_post` porovnává hash s autoritativním řádkem `posts`. `listingNeedsModeration` a DB trigger pokrývají také cenu, lokalitu/souřadnice, stav, datum, délku, kontaktní volby a job CV.

**Follow-up 2026-07-28 (066):** manuální test admin účtem odhalil, že staff bypass v publish gate platil i pro vlastní inzerát. Aktualizace ceny proto zůstala `active` a následné RPC skončilo `post_not_draft`. Migrace `066_publish_gate_staff_owner.sql` omezuje staff bypass pouze na God Mode úpravu cizího inzerátu; vlastní inzeráty moderátora/admina procházejí stejným `draft` → approval → publish tokem jako u běžného uživatele.

**Follow-up 2026-07-28 večer:** create události končil `content_mismatch`, protože Edge (UTC) hashoval `datetime-local` (`2026-07-31T09:05`) jako 09:05Z, zatímco Server Action/DB ukládaly lokální CEST → 07:05Z. Klient nyní posílá do moderace ISO UTC (`toModerationEventDateIso`).

#### SEC-H02 — Moderované náhledy nejsou svázány s uloženými fotografiemi

**Důkaz**

- AI dostává klientské zmenšené base64 obrázky.
- Approval ukládá jen počet obrázků: `supabase/027_moderation_publish_gate.sql:12-18`.
- Publish kontroluje pouze `count(*) <= image_count`: `supabase/027_moderation_publish_gate.sql:212-219`.

**Dopad**

Po schválení lze nahrát jiné plné soubory při zachování počtu. Uložená fotografie může obsahovat NSFW, podvodný nebo jinak zakázaný obsah, který Sightengine ani AI neviděly.

**Oprava**

- Nejprve uložit soubory do privátního staging bucketu.
- Moderovat přesně uložené objekty.
- Do approval uložit `post_id`, `storage_path`, SHA-256 a pořadí každého souboru.
- Publikovat až po shodě hashů; následně objekty zveřejnit/přesunout.

**Stav 2026-07-27 večer (063) — opraveno v kódu bez staging bucketu.** Původní klientské hashe z 062 nebyly důvěryhodné. AI nyní dostává přesné bajty souborů určených pro Storage a Edge z nich sám počítá SHA-256. Server Action před publikací stáhne aktuální Storage objekty, ověří jejich veřejné URL a sestaví vazby `id/storage_path/url/order/main/hash`. Service-role-only RPC zamkne řádky `post_images` a atomicky porovná jejich identitu, pořadí, hlavní obrázek i Edge hashe. Přepsání nebo smazání referencovaného Storage objektu a změna identity image řádku jsou zakázané.

#### SEC-H03 — Uživatel může obejít AI rate limit

**Důkaz**

- `authenticated` může číst, vložit a měnit vlastní `rate_limits`: `supabase_schema.sql:1044-1057`, `1125`.
- Stejné granty jsou v `supabase/006_table_grants.sql:24`; pozdější migrace je neodebírají.
- Edge čte `count` a následně jej samostatným dotazem zvyšuje: `supabase/functions/_shared/moderation/rate-limit.ts:24-65`.

**Dopad**

Uživatel může přes veřejný Supabase endpoint nastavit `count=1`, odstranit/posunout okno vložením vlastních řádků nebo paralelizovat požadavky mezi SELECT a UPDATE. To obchází limit 20/h, zvyšuje AI náklady a umožňuje abuse.

**Oprava**

1. `REVOKE ALL ON public.rate_limits FROM authenticated, anon`.
2. Odstranit tři own RLS policies; tabulku obsluhovat pouze přes `service_role`.
3. Nahradit SELECT+UPDATE atomickým `SECURITY DEFINER` RPC/upsertem s row lockem.
4. Přidat DB test, že `authenticated` nedokáže `SELECT`, `INSERT`, `UPDATE` ani `DELETE`.

**Stav 2026-07-27 (dodatek) — opraveno.** Migrace `062`: policy i grant pro `authenticated`/`anon` odstraněny; `assertAiModerationRateLimit` (`_shared/moderation/rate-limit.ts`) volá nový `increment_rate_limit` (`SECURITY DEFINER`, `INSERT … ON CONFLICT DO UPDATE`) — jediný atomický krok bez race mezi čtením a zápisem. Bod 4 (automatizovaný DB test) zůstává v backlogu — bez CI/pgTAP na projektu.

#### SEC-H04 — Známé zranitelnosti produkčních závislostí

**Důkaz**

- `package.json:15-19` povoluje starou řadu Next.js.
- Lock/build používá Next.js 15.5.19.
- `npm audit --omit=dev` dne 2026-07-27 hlásí:
  - Next.js Server Actions DoS, SSRF a cache-confusion advisories pro verze `<15.5.21`,
  - transitivní PostCSS path traversal / file disclosure,
  - transitivní Sharp/libvips zranitelnosti.

**Dopad**

Možné DoS, SSRF, disclosure interních Server Function endpointů a v závislosti na dosažitelné cestě i čtení souborů či zpracování škodlivého obrázku.

**Oprava**

- Aktualizovat minimálně na opravenou Next.js 15.5.21 a verze závislostí, které přinesou opravené PostCSS/Sharp.
- Poté spustit build, smoke test auth/Server Actions/image pipeline a znovu `npm audit --omit=dev`.
- Zvážit Renovate/Dependabot a CI gate pro High/Critical produkční advisories.

**Stav 2026-07-27 večer — opraveno.** `next` je `15.5.22`; `package.json` vynucuje opravené řady `postcss` a `sharp`. Rozlišení ověřeno jako Next.js 15.5.22 / PostCSS 8.5.23 / Sharp 0.35.3. `npm audit --omit=dev` hlásí **0 zranitelností** a produkční build prošel.

### STŘEDNÍ

#### SEC-M01 — Neomezené textové/JSON vstupy Edge Function před validací

**Důkaz:** `req.json()` načte celé tělo; `imagesBase64.map(...).filter(...).slice(0, 6)` zpracuje celé pole před omezením na šest položek. Title a description nemají na Edge limit. `supabase/functions/moderate-listing/index.ts:351-369`.

**Dopad:** obejitelný rate limit lze kombinovat s velkým JSON polem nebo extrémním textem pro memory/CPU DoS a vysokou tokenovou útratu.

**Oprava:** odmítnout request podle `Content-Length`, vyžadovat `application/json`, ověřit schema před mapováním, limitovat počet položek před transformací a použít stejné délkové limity jako Server Action.

#### SEC-M02 — Poptávkové API dovoluje cross-site abuse

**Důkaz:** endpoint neověřuje `Content-Type` ani `Origin`; `request.json()` přijme JSON i s jednoduchým `text/plain` cross-origin POST. `src/app/api/inquiry/route.ts:30-49`. CAPTCHA chybí.

**Dopad:** cizí web může z prohlížeče návštěvníka odesílat poptávky, spotřebovat jeho IP limit a spamovat inzerenty. Nejde o převzetí účtu, ale o CSRF-like abuse veřejné akce.

**Oprava:** vyžadovat `Content-Type: application/json`, kontrolovat `Origin` proti povoleným hostům, nasadit Turnstile a zachovat stávající rate limit/honeypot.

#### SEC-M03 — Chybí explicitní bezpečnostní HTTP hlavičky

**Důkaz:** `next.config.ts:15-35` konfiguruje Server Actions a images, nikoli `headers()`. V repu není CSP, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` ani `X-Content-Type-Options`.

**Dopad:** slabší defense-in-depth proti clickjackingu, budoucím XSS regresím a nechtěnému předávání referrerů.

**Oprava:** přidat centrální hlavičky. CSP zavést nejdříve v report-only režimu kvůli GTM; následně nonce/hash strategie pro inline consent/JSON-LD skripty.

#### SEC-M04 — Logování části nevalidního AI výstupu

**Důkaz:** při parse chybě se loguje prvních 800 znaků AI odpovědi. `supabase/functions/_shared/moderation/parse-response.ts:131-157`.

**Dopad:** odpověď může obsahovat text inzerátu, kontakt nebo jiná uživatelská data. Tato data se mohou dostat do dlouhodobých Edge logů.

**Oprava:** logovat pouze error code, model, request/correlation ID a délku/hash odpovědi; surový obsah nelogovat.

#### SEC-M05 — Re-moderace nepokrývá všechna publikovaná pole

**Důkaz:** klient a DB sledují jen název, popis a kategorie; `src/lib/moderation/needs-moderation.ts:11-21`, `supabase/027_moderation_publish_gate.sql:72-81`.

**Dopad:** cenu, lokalitu, telefon, datum akce, `exchange_for` či stav lze po schválení změnit bez AI. Některé změny mohou vytvořit podvodný nebo policy-nevyhovující inzerát.

**Oprava:** definovat jednotný seznam publish-sensitive polí v DB; jakákoli změna musí vyžadovat nový fingerprint/token. Pokud má být část polí záměrně bez AI, zdokumentovat přesnou výjimku a přidat deterministickou validaci.

**Stav 2026-07-27 večer — opraveno v kódu migrací 063 a rozšířením `listingNeedsModeration`; viz SEC-H01.**

#### SEC-M06 — Moderátor obnovuje blokovaný obsah rovnou na `active`

**Důkaz:** restore vrací `status: active`; `src/app/actions/moderation-listings.ts:102-119`, akce na `303-305`.

**Dopad:** omylem nebo po kompromitaci staff účtu lze vrátit nahlášený obsah bez nové AI kontroly. PRD zároveň očekává auditovatelný důvod, ale restore důvod nevyžaduje.

**Oprava:** obnovovat do `draft`/`hidden` s povinným důvodem, nebo vyžadovat explicitní manuální obsahový review flag a auditní poznámku.

### NÍZKÉ

#### SEC-L01 — Gemini API klíč v URL

`supabase/functions/_shared/moderation/gemini.ts:24-27` posílá klíč v query stringu. URL se může objevit v proxy/access logu. Použít podporovanou hlavičku API.

#### SEC-L02 — Service-role klíč jako fallback hash secret

`src/app/api/listing-view/route.ts:14-18` používá `SUPABASE_SERVICE_ROLE_KEY`, pokud chybí dedikovaný secret. V produkci vyžadovat `LISTING_VIEW_HASH_SECRET`; nemíchat účely klíčů.

#### SEC-L03 — Nekonzistentní bezpečná serializace JSON-LD

Listing používá `serializeListingJsonLd()` s escapováním `<`: `src/lib/seo/listing-json-ld.ts:206-208`. Homepage a návod používají přímý `JSON.stringify`: `src/app/page.tsx:65-67`, `src/app/jak-vytvorit-inzerat/page.tsx:55-58`. Dnes jsou hodnoty převážně trusted config, ale společný serializer zabrání budoucí XSS regresi.

#### SEC-L04 — Veřejné fotografie a orphan storage rezidua

Bucket `post-images` je veřejný a upload se řídí prefixem uživatele. To odpovídá produktu, ale smazané/selhané soubory musí mít pravidelný reconciliation job; současný cleanup není garantován pro všechny přerušené uploady.

#### SEC-L05 — Přílohy bez malware skenu

Magic bytes neodhalí škodlivé PDF/DOCX. Pro veřejný MVP je riziko nižší, příloha se ale přeposílá inzerentovi. Doplnit AV sandbox/ClamAV službu nebo přílohy dočasně zakázat.

#### SEC-L06 — Historické SQL soubory obsahují staré politiky

`supabase/001_*` a `002_*` obsahují starší granty/policies. Pokud provozní postup spustí fragmenty v nesprávném pořadí, může obnovit slabé nastavení. Označit soubory jako nepoužitelné pro nový deploy nebo přejít na jeden jednoznačný migrační runner.

#### SEC-L07 — Anonymní standalone report nemá vlastní abuse limit

`submitStandaloneReport` používá service role pro anonymní INSERT a e-mail adminovi: `src/app/actions/moderation-listings.ts:409-500`. Přidat IP/e-mail limit a CAPTCHA; anonymní reporty správně nepočítat do automatického 3× blocku.

### Kontroly bez potvrzeného nálezu

- **IDOR:** update/delete inzerátů ověřuje vlastníka; staff role se znovu kontroluje na serveru.
- **SQL injection:** app používá parametrizovaný Supabase client/RPC; raw SQL skládání z uživatelských vstupů nebylo nalezeno.
- **XSS v popisu:** React renderuje text přes `whitespace-pre-wrap`; `src/components/listing/ListingDescription.tsx:25-68`.
- **Secrets na klientovi:** service-role, AI, Resend a cron secrets nebyly nalezeny v klientských modulech. `NEXT_PUBLIC_*` obsahují jen záměrně veřejnou konfiguraci.
- **PII detailu:** veřejný SELECT detailu nezahrnuje `contact_phone`; cizí e-mail se načítá přes omezené RPC.

---

## 4. Review AI Promptů

### Stav po opravách 063–064

- Finální text po AI náhledu a odpovědích se znovu moderuje. Approval token váže přesný uložený `title`, `description`, publish-sensitive pole a SHA-256 všech fotografií; DB fingerprint počítá autoritativně z `posts`. Migrace 065 kanonizuje browserové CRLF a JSON LF na stejný text.
- Token se při explicitní finální kontrole vydává pro oba bezpečné statusy `APPROVED` a `NEEDS_QUESTIONS`; otázky jsou kvalitativní a podle UI nepovinné. `REJECTED`, schema chyba, selhání auditního zápisu nebo selhání `issueModerationApproval()` token nevydají.
- Gemini používá `responseSchema`, OpenAI strict `json_schema`; ruční opravy nevalidního JSON byly odstraněny.
- Runtime navíc kontroluje úplnost response contractu, povinný důvod zamítnutí, publikační texty, neprázdné otázky a rozsah `rejectedImageIndex`.
- Prompt používá hierarchii system → trusted metadata → nedůvěryhodné tagy/fotografie a kanon SEO Bible v1.8.
- `moderation_checks` po migraci 064 ukládá `prompt_version`, provider, model, fallback, policy hash, input fingerprint a image hashes.
- Sightengine před generativním modelem kontroluje všechny fotografie na podporované NSFW/nudity signály. Zbytek obrazové policy posuzuje multimodální model.

### Zbývající omezení

1. Regex detekce prompt injection je pouze pomocná heuristika a může mít false positive i false negative. Bezpečnostní hranicí zůstává oddělení rolí, strict schema, serverové post-checky a publish gate.
2. System prompt stále spojuje moderaci, hydrataci, SEO a taxonomii. Rozdělení do samostatných modulů zlepší údržbu, samo o sobě ale nezvyšuje bezpečnost publish gate.
3. Celý katalog kategorií se posílá při každém requestu. Lze jej zúžit na relevantní kandidáty a finální pár dál validovat serverem.
4. Modelová `evidence` mapa nebyla přidána: sama je generovaný údaj, a proto není bezpečnostním důkazem. Pro spolehlivou kontrolu halucinací by bylo nutné ukládat konkrétní zdrojové hodnoty a serverem ověřitelné odkazy na vstup.
5. Finální re-moderace zvyšuje počet AI volání. Jde o záměrný bezpečnostní trade-off; sledovat latenci, cenu a podíl fallbacků přes auditní metadata.

---

## 5. Diskrepance s dokumentací (`PRD_v3.md`, `Metodika.md`, SEO Bible)

### PRD

| Priorita | Diskrepance |
|---|---|
| Opraveno v kódu | PRD §6: přímý přístup k `rate_limits` odebírá migrace 062 a limit inkrementuje atomické RPC. |
| Opraveno v kódu | PRD §1.1/5: migrace 063 a finální re-moderace vážou token na uložený text, pole i všechny fotografie. |
| Vysoká produktová | Celý v0.6 monetizační modul chybí: `bank_payments`, Fio sync cron, SPAYD QR, e-mail, `/mod/platby`. `vercel.json:1-23` obsahuje jen provozní/GDPR crony. |
| Střední | PRD §1.5/1 a §5.6 vyžaduje sjednocenou God Mode timeline. DB audit existuje, UI data nenačítá. |
| Střední | PRD požaduje povinný dropdown důvodu moderátorského smazání/skrytí. Akce přijme prázdný důvod; `parseReasonNote` je jen volný text. `moderation-listings.ts:53-58`, `167-193`. |
| Střední | Branding je stále `HobbyUserMarket` v devíti metadata/copy souborech, např. `src/app/onboarding/page.tsx:10,43`, `src/app/moje-inzeraty/page.tsx:28`. |
| Nízká | PRD plánuje `040_bank_payments.sql`, ale číslo 040 už používá `040_reports_v05.sql`; budoucí migrace musí dostat nové číslo. |
| Nízká | `supabase_schema.sql:1-2` uvádí starší PRD verzi a není jasně označen jako generovaný snapshot. |

### Metodika

- `Metodika §2.8` říká, že `/dsa` je v sitemapě; `src/app/sitemap.ts:7-63` ji neobsahuje.
- ~~`Metodika §11.2` „Historie, Poznámka — zatím ne“~~ — opraveno: Poznámky ano (§11.4.1); timeline stále ne.
- Metodiku je třeba při další produktové aktualizaci rozšířit o finální re-moderaci všech publish-sensitive polí zavedenou opravou SEC-H01.
- Metodika říká „3krokový formulář“, zatímco hlavní flow a AI modaly působí jako více kroků; UX terminologie by měla rozlišit formulářové kroky a AI review.

### SEO Bible v1.8

| Stav | Diskrepance |
|---|---|
| Implementováno | H1/meta/alt pole, title builder, meta clamp, kategoriální JSON-LD, sitemap aktivních inzerátů. |
| Implementováno | Prompt používá SEO Bible v1.8; cena, CTA a finální SEO limity zůstávají autoritativně v kódu. |
| Backlog | Chybí `BreadcrumbList` na detailu. |
| Backlog | `Place.streetAddress` používá celé `location_text`; obec a ulice nejsou oddělené. |
| Backlog | Neaktivní detail vrací 404/redirect; explicitní noindex policy není implementovaná. |
| Chyba dokumentace | `/dsa` chybí v sitemapě navzdory Metodice. |
| Zlepšení | `robots.ts:9-17` neblokuje `/mod` a `/profil`; privátní routes zbytečně spotřebují crawl budget. |
| Zlepšení | Root metadata nemají defaultní OG image. `src/app/layout.tsx:17-37`. |
| Výkon | Homepage nepreloaduje první LCP obrázek. |

---

## 6. UX/UI Doporučení

### Vysoká priorita

1. **Přidat route-level loading a error boundaries.** V `src/app` není žádný `loading.tsx` ani `error.tsx`; pomalejší DB/AI/SSR přechody působí jako zamrznutí.
2. **Neztrácet chyby správy inzerátu.** `pauseListing` a `publishListing` při chybě redirectují bez hlášky: `src/app/actions/listing-management.ts:89-94`, `112-118`.
3. **Sloučit dva AI modaly.** Approved → Preview vyžaduje klik navíc: `CreateListingForm.tsx:590-614`.
4. **Po selhání vydání approval tokenu zobrazit technickou chybu ihned.** Dnes může uživatel projít náhledem a selhat až při uložení.

### Přístupnost

- Po zamítnutí moderací přesunout focus na konkrétní problémové pole; zvýraznění fotky samo nestačí.
- Thumbnail obrázky mají všechny stejný `alt`; protože tlačítko už má `aria-label`, obrázek miniatury může mít `alt=""`, aby čtečka neopakovala stejné sdělení. `ListingImageGallery.tsx:70-85`.
- Cookie banner má současně `aria-labelledby` i `aria-label`; redundantní název dialogu může být pro některé čtečky nejasný. Ponechat jednu strategii.
- Přidat automatické a manuální testy klávesnice pro dialogy, lightbox, location combobox a God Mode panel.

### Konzistence a zpětná vazba

- Sjednotit všechny titulky/copy na `SITE_DISPLAY_NAME`; odstranit produkční výskyty `HobbyUserMarket`.
- Cookie accept/reject tlačítka doplnit o `gtmCtaProps`; `CookieConsentBanner.tsx:84-107`.
- Majitel po otevření neveřejného sdíleného URL dostane jen redirect do seznamu. Přidat cílenou zprávu „Inzerát je pozastavený/zablokovaný/archivovaný“.
- God Mode doplnit o timeline a jasně oddělit auditní události, reporty, kontakt revealy a poptávky.

### Výkon a vývojářská kvalita

- Homepage má First Load JS ~200 kB; formulář create/edit ~210 kB. Rozdělit klientské části a ponechat hero/první grid jako Server Components.
- Přidat preload/priority discovery první fotky pouze tehdy, když je skutečně LCP.
- ESLint ignorovat `.next/**`; aktuální `npm run lint` je jako CI gate nepoužitelný. `eslint.config.mjs:1-13`.
- Odstranit unused `location` na `src/app/inzerat/[slug]/page.tsx:110`.
- Build warning ukazuje Supabase browser client v middleware Edge bundlu; ověřit kompatibilní import a bundle.

---

## 7. Action Plan / Priority List

### P0 — před dalším produkčním růstem

- [x] Odebrat `authenticated` oprávnění a policies nad `rate_limits` (migrace 062).
- [x] Zavést atomické rate-limit RPC; paralelní integrační test zůstává otevřený.
- [x] Svázat approval s autoritativním fingerprintem uloženého příspěvku (migrace 063).
- [x] Svázat approval s identitou a SHA-256 všech moderovaných fotografií.
- [x] Aktualizovat Next.js na 15.5.22 a ošetřit zranitelné transitivní verze.
- [ ] Nasadit migrace 062–064, Edge Function a Next.js ve správném pořadí a provést produkční smoke test.
- [ ] Spustit produkční RLS smoke testy B1–B5 a uložit výsledky.

### P1 — bezpečnost a abuse

- [ ] Limitovat celé body a schema Edge moderation requestu před zpracováním.
- [ ] Inquiry API: JSON Content-Type, Origin check, Turnstile.
- [ ] Standalone report: rate limit + Turnstile.
- [ ] Přestat logovat část raw AI odpovědi.
- [ ] Rozšířit publish-sensitive pole nebo zdokumentovat a deterministicky validovat výjimky.
- [ ] Restore moderátora změnit na draft/hidden nebo povinný review + důvod.
- [ ] Přidat bezpečnostní HTTP hlavičky; CSP nejprve report-only.
- [ ] Zavést AV kontrolu PDF/DOCX příloh.

### P2 — AI kvalita a governance

- [x] Aktualizovat prompt z SEO Bible v1.6 na v1.8.
- [x] Zavést provider structured output a striktní runtime validaci podle statusu.
- [ ] Rozdělit safety, hydration, SEO a schema prompt.
- [x] Ukládat `prompt_version`, provider/model, fallback, policy hash, input fingerprint a image hashes (migrace 064).
- [x] Nevydat approval při `null` tokenu; `NEEDS_QUESTIONS` při finální kontrole povolit, protože otázky jsou nepovinné a text znovu prošel bezpečnostní moderací.
- [ ] Přidat adversarial test corpus pro prompt injection, obfuskaci a jailbreak.

### P2 — PRD/UX/SEO

- [ ] Implementovat God Mode timeline požadovanou v PRD v0.5.
- [ ] Opravit silent redirect chyby pause/publish.
- [ ] Sloučit Approved a Preview modal.
- [ ] Přidat `loading.tsx`/`error.tsx` pro homepage, detail, správu a mod routes.
- [ ] Sjednotit branding metadata na zaPikolou.cz.
- [ ] Přidat `/dsa` do sitemap a `/mod`, `/profil` do robots disallow.
- [ ] Přidat BreadcrumbList, default OG image a upřesnit JSON-LD Place.
- [ ] Přidat GTM ID cookie tlačítkům.
- [ ] Opravit ESLint ignore a obnovit funkční CI lint gate.

### P3 — produktové dokončení

- [ ] Rozhodnout, zda je v0.6 monetizace aktuální scope; pokud ano, implementovat `bank_payments`, SPAYD, Fio cron, `/mod/platby`, e-mail a audit.
- [ ] Implementovat P2B notifikace 15/30 dní před prvním podnikatelským účtem.
- [ ] Opravit prodloužení tak, aby respektovalo dokumentovaný model `listing_duration_days`.
- [ ] Aktualizovat `TO-DO_Fable.md`, PRD a Metodiku podle skutečného stavu.
- [ ] Zavést pravidelný dependency audit, RLS test suite, prompt regression testy a provozní runbook.

---

## Doporučená akceptační kritéria nejbližší bezpečnostní iterace

1. Běžný `authenticated` JWT nedokáže přímo číst ani měnit `rate_limits`.
2. Dvacet paralelních AI requestů nezpůsobí lost update; 21. request vždy vrátí 429.
3. Změna jediného znaku title/description nebo jiného publish-sensitive pole po AI kontrole zneplatní token.
4. Záměna, přidání, odebrání nebo změna pořadí fotografie po moderaci zneplatní token.
5. Neplatný AI JSON, chybějící token nebo chyba auditního zápisu nikdy nevede k APPROVED publikaci.
6. `npm audit --omit=dev` nemá Critical/High produkční nález.
7. `npm run lint` a `npm run build` procházejí bez chyb.
8. RLS smoke testy a adversarial prompt testy běží automaticky v CI nebo v reprodukovatelném předprodukčním checklistu.
