# TO-DO Fable — Audit projektu HobbyUserMarket

> **Autor:** Fable (AI audit)
> **Datum auditu:** 2026-07-06 · **Poslední revize:** 2026-07-16 (security hardening M3–M9, L1, llms.txt)
> **Rozsah auditu:** Server Actions, API routes, Supabase schéma + RLS, Edge Functions (moderace), `src/lib`, auth/onboarding flow, browse/UX komponenty.
> **Zdroj požadavků:** [`PRD_v3.md`](./PRD_v3.md) (v3.18)
> **Metodika značení:** severity **Critical / High / Medium / Low**; ID `C#` (security), `P#` (proces), `U#` (UX). Stav: ✅ hotovo · 🔄 rozpracováno · ⏳ čeká.

Tento dokument je backlog nálezů a návrhů. Slouží jako TO-DO seznam k postupné implementaci. U každého nálezu je soubor, popis slabiny a konkrétní návrh řešení. Na konci je souhrn priorit.

---

## 0. Executive summary

| Oblast | Kritické | Vysoké | Střední | Nízké |
|--------|:--------:|:------:|:-------:|:-----:|
| **Security** | ~~2~~ ✅ 0 otevřených | ~~3~~ ✅ 0 otevřených (H2 CAPTCHA → Low) | ~~10~~ **1** otevřená (M10 reziduum) | ~~7~~ ~5 (+ rezidua H2/M9) |
| **Proces** | — | — | ~~12~~ 13 otevřených | — |
| **UX** | — | — | ~28 | — |

> **Stav fáze 1 (PII):** C1, C2, M1 a M2 **hotové** migracemi [`025_contact_privacy_hardening.sql`](../supabase/025_contact_privacy_hardening.sql) + [`026_contact_reveal_rate_limit.sql`](../supabase/026_contact_reveal_rate_limit.sql) + úpravou `contact.ts`, `inzerat/[slug]/page.tsx`, `moje-inzeraty/page.tsx`, `get-listing-for-edit.ts`, `config/app.ts`. **Fáze 1 dokončena.**
>
> **Stav fáze 2 (integrita publikace):** H1, P1 a P14 **hotové** migrací [`027_moderation_publish_gate.sql`](../supabase/027_moderation_publish_gate.sql). **Fáze 2 dokončena** (M10 částečně). Manuální testy create/edit 2026-07-07/08 OK.
>
> **Stav fáze 3–4 (anti-spam + DB integrita, 2026-07-16):** H2 rate limit + honeypot ✅ (CAPTCHA ⏳ Low); M3/M4 ✅ migrace [`047_security_column_guards.sql`](../supabase/047_security_column_guards.sql); M5 ✅; M6–M8 ✅; M9 magic bytes ✅ (AV ⏳); L1 ponecháno 8 znaků (UX); L8 favicon ✅; llms.txt markdown escape ✅.

### ✅ Fáze 3–4 dokončeny — další: M10 reziduum / CAPTCHA / ops

**Top věci k řešení:**

0. **Nasadit migraci 047** + redeploy Edge `moderate-listing` + **smoke test** (níže).
1. **M10** — reziduální prompt injection (ohraničení + guard už běží).
2. **H2 reziduum** — Turnstile/hCaptcha u `/api/inquiry` (volitelné).
3. **Site Notice** — otestovat Vercel env; zvýraznit lištu `maintenance`.
4. **P8 / U1** — Technické selhání AI ≠ obsahové zamítnutí.
5. **P20–P22** — GDPR texty marketingu / OAuth VOP (souhlasy v DB z 044).

### Smoke test — migrace 047 + `moderate-listing` (2026-07-16)

Po nasazení [`047_security_column_guards.sql`](../supabase/047_security_column_guards.sql) a redeployi Edge Function. Stav: ⏳.

**Minimum před ok:** A1–A6 + B1–B5. C2/C3 volitelně (Postman / přímé volání EF).

#### A) Happy path (nic se nerozbilo)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| A1 | Registrace / login — heslo **8** znaků | Projde; kratší ne | ☐ |
| A2 | Nový inzerát s fotkou → AI → publikace | `active` na HP | ☐ |
| A3 | Editace názvu/popisu → re-moderace → uložení | OK | ☐ |
| A4 | Prodloužení v Moje inzeráty (+30 dní) | `expires_at` se posune, inzerát viditelný | ☐ |
| A5 | Pauza / obnovení | Jako dřív | ☐ |
| A6 | Poptávka s PDF/JPG (Práce); falešná přípona (`.pdf` + text) | Platná příloha OK; falešná → chyba | ☐ |

#### B) Security regress (triggery 047)

V SQL Editoru jako **běžný authenticated** uživatel (ne `service_role`), na vlastním profilu/inzerátu:

| # | Co zkusit | Očekávání | ✓ |
|---|-----------|-----------|---|
| B1 | `UPDATE profiles SET company_ico_verified = true WHERE id = auth.uid();` | chyba `42501` / only admin | ☐ |
| B2 | `UPDATE posts SET payment_status = 'paid' WHERE id = <vlastní>;` | zamítnuto | ☐ |
| B3 | `UPDATE posts SET renew_count = renew_count + 10 WHERE id = <vlastní>;` | zamítnuto (jen +1) | ☐ |
| B4 | `UPDATE posts SET expires_at = now() + interval '5 years' WHERE id = <vlastní>;` (bez změny duration) | zamítnuto | ☐ |
| B5 | Prodloužení přes UI (ne SQL) | projde (`renew_count` +1 + `expires_at`) | ☐ |

#### C) Moderace / upload (volitelné)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| C1 | Normální JPEG při create | OK | ☐ |
| C2 | Přímé volání EF s obří base64 / ne-obrázkem | HTTP 400, ne AI call | ☐ |
| C3 | Výpadek `rate_limits` / chybějící service role | HTTP 503, ne „schváleno“ | ☐ |

#### D) Feed

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| D1 | `/llms.txt` — titulek se `[` / `]` | Escapováno / nerozbije markdown | ☐ |

---

## 1. Bezpečnost (Security)

### 🔴 Critical

#### C1 — Kterýkoli přihlášený uživatel přečte e-maily/telefony všech profilů (RLS) — ✅ VYŘEŠENO

- **Soubor:** `supabase_schema.sql` (řádky 592–595), navazuje `src/app/actions/contact.ts` (39–43)
- **Popis:** Politika `profiles_select_public` má `USING (true)` pro roli `authenticated`. Kdokoli po registraci může přes Supabase REST enumerovat `profiles` podle `id` (které je veřejně v `posts.user_id`) a sesbírat všechny e-maily i telefony. Zcela obchází flow „Zobrazit kontakt“ a nezaloguje `contact_reveals`.
- **✅ Řešení (nasazeno):** Migrace `025` zrušila `profiles_select_public` (zůstalo jen `profiles_select_own` + nové `profiles_select_admin`). Odhalení kontaktu jde přes `SECURITY DEFINER` RPC `reveal_listing_contact` (ověří přihlášení + viditelnost inzerátu + opt-in vlajky + rate limit, loguje `contact_reveals`); `contact.ts` upraveno. Veřejná ne-PII data zadavatele nadále přes `get_advertiser_display`.

#### C2 — `posts.contact_phone` je čitelný i pro anonymní uživatele — ✅ VYŘEŠENO

- **Soubor:** `supabase_schema.sql` (620–623, 887), `src/app/inzerat/[slug]/page.tsx` (42–45, `select("*")`)
- **Popis:** RLS řídí přístup na úrovni řádku, ne sloupce. Při `show_contact_phone = true` je `contact_phone` v řádku a lze ho stáhnout anonymně: `GET /rest/v1/posts?select=contact_phone&id=eq.<id>` — bez přihlášení a bez kliknutí. **Porušuje DoD §1.1 bod 3** (kontakt nesmí být v HTML/API před kliknutím).
- **✅ Řešení (nasazeno):** Zvolena varianta column-level `REVOKE SELECT (contact_phone) ON posts FROM anon, authenticated` (migrace `025`). Telefon se odhaluje jen přes `reveal_listing_contact`; vlastníkovi pro editaci přes `get_owned_post_contact_phone`. `select("*")` nahrazeno explicitními sloupci v `inzerat/[slug]/page.tsx`, `moje-inzeraty/page.tsx` a `get-listing-for-edit.ts`.

### 🟠 High

#### H1 — AI moderace vynucena jen na klientovi (server přijme nemoderovaný obsah) — ✅ VYŘEŠENO

- **Soubor:** `supabase/027_moderation_publish_gate.sql`, `supabase_schema.sql` (sekce 10), `supabase/functions/_shared/moderation/issue-approval.ts`, `moderate-listing/index.ts`, `src/app/actions/posts.ts`, `CreateListingForm.tsx`, `moderate-listing-client.ts`, `prohibited-scan.ts`
- **Popis:** Moderace běžela jen v prohlížeči. Útočník mohl zavolat Server Action přímo (nebo `posts.insert` přes RLS) a publikovat libovolný obsah jako `active`. **Porušovalo DoD §1.1 bod 5.**
- **✅ Řešení (migrace 027, „approval token + DB gating stavu“):**
  1. **DB gating:** `posts_insert_own` povolí jen `status='draft'`. Trigger `enforce_post_publish_gate` pro role `anon`/`authenticated`: (a) editace obsahu (název/popis/kategorie) shodí inzerát do `draft` = nutná re-moderace, (b) do viditelného stavu (`active`/`hidden`/`archived`) se lze dostat jen z jiného viditelného stavu (pauza/obnovit/prodloužit fungují beze změn). Z `draft`/`blocked` ven vede **jen** `publish_approved_post`. Trigger `trg_post_images_revert` shodí do `draft` i inzerát, kterému někdo přidal/smazal fotky mimo schválený tok. Moderátor/admin a service_role mají výjimku (God Mode). Migrace **036**: 3× nahlášení → `blocked` (ne `hidden`); sloupec `status_reason_code`.
  2. **Approval token:** Edge Function po průchodu bezpečnostním filtrem (status ≠ REJECTED) vloží přes `issue_moderation_approval` (jen service_role) záznam do `moderation_approvals` (TTL 30 min, jednorázový, váže user_id + počet fotek) a vrátí `approvalToken` klientovi.
  3. **Publikace:** `createListing` vkládá `draft`, nahraje fotky a zavolá `publish_approved_post(post_id, token, target)` — RPC ověří vlastníka, platnost/nespotřebovanost tokenu a že počet fotek nepřekračuje moderovaný počet; pak teprve přepne na `active` (u editace pauznutého inzerátu zpět na `hidden`). Bez tokenu zůstane inzerát neviditelný `draft`. Fail closed.
  4. **Keyword scan:** server-side `findProhibitedKeyword` (klíčová slova z `prohibited-topics.ts`, bez diakritiky) zamítne zjevně zakázaný text v create i update — mitigace rezidua „text se dá po schválení přepsat v témže submitu“.
- **Reziduální riziko (vědomé):** obsah fotek není kryptograficky vázán na moderovanou verzi (moderuje se 512px náhled, ukládá plná fotka) — vázán je počet fotek + identita uživatele + 30min okno. Plné svázání vyžaduje moderaci až po uploadu do Storage (kandidát na budoucí hardening, viz M10/P30).

#### H2 — Poptávkové API bez rate limitu a anti-spam ochrany — ✅ ČÁSTEČNĚ (CAPTCHA ⏳)

- **Soubor:** `src/app/api/inquiry/route.ts`, `src/lib/inquiry/rate-limit.ts`, `src/config/app.ts`
- **Popis:** `POST /api/inquiry` bylo neautentizované, bez IP rate limitu, bez CAPTCHA, bez logu do `inquiry_events`.
- **✅ Hotovo:** IP limit 20/d, per-post 3/d, honeypot, log `inquiry_events`, generické chyby (M5).
- **⏳ Reziduum (Low):** Turnstile/hCaptcha — až při spam tlaku.

#### H3 — Protocol-relative open redirect v auth Server Actions — ✅ VYŘEŠENO

- **Soubor:** `src/lib/auth/sanitize-internal-path.ts`, `src/app/actions/auth.ts`, `src/app/auth/callback/route.ts`, `src/app/login/page.tsx`, `src/app/onboarding/page.tsx`
- **Popis:** `readNextPath` propustil `//evil.com` → protocol-relative redirect po loginu.
- **✅ Řešení (2026-07-11):** `sanitizeInternalPath()` — odmítá `//`, `\`, encoded `//`; normalizace přes `URL`. Použito ve všech auth redirect tocích. Manuální test `/login?next=//example.com` prošel.

### 🟡 Medium

#### M1 — Odhalení kontaktu bez rate limitu — ✅ VYŘEŠENO

- **Soubor:** `026_contact_reveal_rate_limit.sql`, `reveal_listing_contact` v `supabase_schema.sql`, `src/config/app.ts`, `src/app/actions/contact.ts`
- **Popis:** PRD §5.3 vyžaduje **20 revealů / den / uživatel**. Bez limitu mohl přihlášený uživatel volat RPC pro každý `post_id` a hromadně sbírat kontakty.
- **✅ Řešení (migrace 026):** Před vrácením PII se v RPC počítá počet **unikátních** inzerátů odhalených v posledních 24 h; při dosažení limitu (20) `RAISE EXCEPTION 'contact_reveal_rate_limited'` (errcode `P0001`). Opětovné otevření téhož inzerátu limit nespotřebuje (`bool_or(post_id = current)`). Fail closed. Konstanta `CONTACT_REVEAL_RATE_LIMIT_PER_DAY = 20` v `app.ts`; `contact.ts` mapuje chybu na CZ hlášku (§1.6). *(Řešeno počítáním v `contact_reveals`, ne přes `rate_limits` — jednodušší a přesnější, tabulka už reveal loguje.)*

#### M2 — Kontrola viditelnosti inzerátu při reveal — ✅ VYŘEŠENO

- **Soubor:** `025_contact_privacy_hardening.sql`, `reveal_listing_contact` v `supabase_schema.sql`
- **Popis:** Původně app vrstva spoléhala jen na RLS.
- **✅ Řešení (nasazeno):** RPC volá `is_post_publicly_visible(status, expires_at)` před vrácením PII. `contact.ts` dělá pre-check přes `postAllowsDirectContact` jen pro srozumitelné chybové hlášky.

| ID | Soubor | Slabina | Stav |
|----|--------|---------|------|
| ~~**M3**~~ | migrace `047` | ~~`company_ico_verified` self-set.~~ | ✅ **2026-07-16** — trigger `prevent_ico_verified_escalation`. |
| ~~**M4**~~ | migrace `047` | ~~`payment_status` / `renew_count` / `expires_at`.~~ | ✅ **2026-07-16** — trigger `protect_post_privileged_columns`. |
| ~~**M5**~~ | `lib/inquiry/api-errors.ts` | ~~Interní detaily v chybách.~~ | ✅ Generické CZ hlášky. |
| ~~**M6**~~ | `rate-limit.ts` | ~~Fails open.~~ | ✅ **2026-07-16** — fail closed → HTTP 503. |
| ~~**M7**~~ | `assert-image-limits.ts` | ~~Neomezená velikost base64.~~ | ✅ **2026-07-16** — 500 KB/fotka, 2 MB celkem, magic bytes. |
| ~~**M8**~~ | `listing-images.ts`, `magic-bytes.ts` | ~~Důvěra v Content-Type.~~ | ✅ **2026-07-16** — magic bytes + Content-Type z detekce. |
| ~~**M9**~~ | `inquiry/validation.ts` | ~~Jen MIME/přípona.~~ | ✅ **částečně** — magic bytes. **Reziduum Low:** AV. |
| **M10** | `bound-user-content.ts`, `prompt-injection-guard.ts` | Prompt injection. | 🔄 Částečně — ohraničení + guard; reziduální vzory. |


### 🟢 Low

| ID | Soubor | Slabina | Stav |
|----|--------|---------|------|
| **L1** | `PASSWORD_MIN_LENGTH`, `auth.ts`, UI | Min. 8 znaků (produktová volba — 12 by brzdilo registraci). | ⏳ Volitelně strength meter / zxcvbn, ne hard min. 12. |
| **L2** | `gemini.ts` | API klíč v query stringu. | ⏳ Header auth. |
| **L3** | schéma | Public bucket `post-images`. | OK pro fotky; signed URL později. |
| **L4** | `listing-images.ts` | Orphan soubory při chybě uploadu. | ⏳ Cleanup. |
| **L5** | `lib/mapy/` | Veřejný Mapy.cz klíč. | ⏳ HTTP-referrer. |
| **L6** | `src/app/mod/` | God Mode UI. | ✅; audit timeline P30. |
| **L7** | `middleware.ts` | Auth jen per-page. | ⏳ Volitelný matcher. |
| ~~**L8**~~ | `public/`, `layout.tsx` | ~~Favicon.~~ | ✅ Favicon; default OG ⏳. |
| ~~**L9**~~ | `build-llms-txt.ts` | ~~Neescapovaný title v `/llms.txt`.~~ | ✅ **2026-07-16** — `escapeMarkdownLinkLabel`. |
| **H2-R** | inquiry | CAPTCHA. | ⏳ Low reziduum H2. |
| **M9-R** | inquiry přílohy | Bez AV. | ⏳ Low reziduum M9. |


### ✅ Co je udělané dobře (kalibrace severity)

- Service role klíč jen server-side (`lib/supabase/admin.ts`), žádné hardcoded klíče v repu.
- IDOR na app vrstvě ošetřen (`updateListing` kontroluje `user_id`, `getOwnedPost`).
- DB triggery `prevent_role_escalation`, `prevent_email_change`, **`prevent_ico_verified_escalation`**, **`protect_post_privileged_columns`**.
- Bootstrap admina/moderátora zdokumentován; God Mode `/mod/uzivatele` nasazeno.
- Ochrana PII kontaktů: migrace 025, RPC `reveal_listing_contact`, column-level REVOKE.
- Validace poptávky: limity, magic bytes, honeypot, rate limit, blok self-inquiry.
- Žádný `dangerouslySetInnerHTML`; plain-text popis (bez XSS).
- Edge Function: JWT, rate limit fail closed, limity velikosti fotek.
- Upload fotek ověřuje magic bytes; hesla min. 8 znaků (záměrně bez tvrdého 12).
- Reset hesla vrací generickou hlášku (bez e-mail enumerace).

---

## 2. Procesní slabiny

### Životní cyklus inzerátu

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| ~~**P1**~~ | ~~`actions/posts.ts`~~ | ~~Chybí DB stavy moderace; inzerát jde rovnou na `active`.~~ | ✅ **Vyřešeno s H1** (migrace 027) — insert jde do `draft`, na `active` jen přes `publish_approved_post` po ověření approval tokenu; schválení perzistováno v `moderation_approvals`. |
| **P2** | `actions/posts.ts` (89–109) | Částečné selhání: řádek postu se vloží první; když selže `syncListingImagesFromForm`, zůstane **orphan inzerát bez fotek**. | Transakce nebo smazání postu při chybě uploadu; nabídnout „opakovat upload“ v `moje-inzeraty`. |
| **P3** | `actions/listing-management.ts` | `deleteListing` je jen soft-delete; **žádný úklid Storage** (`post_images` + bucket objekty). Migrace **031** opravila rollback soft-delete při chybě storage cleanup a publish-gate bypass pro `deleted`. | Při delete smazat soubory + řádky, nebo scheduled janitor pro `deleted`. |
| **P4** | chybí migrace cronu + PRD §9 | Chybí denní cron `active`→`archived`. Majitel vidí expirovaný inzerát jako „Aktivní“, veřejně už skrytý. | pg_cron/Edge Function dle PRD; sladit UI stav s expirací. |
| **P5** | `actions/listing-management.ts` | `extendListingBy30Days` hard-coduje +30 dní a ručně nastavuje `expires_at`, obchází `listing_duration_days` + trigger. | Renew přes update `listing_duration_days` / dedikované RPC; nechat uživatele vybrat délku. |
| **P6** | `lib/moderation/needs-moderation.ts` | Re-moderace při editaci pokrývá jen title/description/kategorie/obrázky. Změna ceny/lokality/telefonu/data akce AI přeskočí. | Zdokumentovat jako záměr, nebo rozšířit triggery. |
| **P7** | `CreateListingForm.tsx` (134–139, 819–828) | Při editaci se lat/long resetují na `null` i když lokalita nezměněná; uživatel musí znovu potvrdit z našeptávače. | Inicializovat souřadnice z `initialValues`, když text nezměněn. *(Částečně: `parse-location.ts` + EWKB z DB při editaci — ověřit regresi.)* |

### AI moderace

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **P8** | `moderate-listing/index.ts` (229–268) | **Technické selhání vrací `REJECTED`** (AI down, kvóta, chybějící klíče, nevalidní JSON). Klient to bere jako obsahové zamítnutí. | Vrátit odlišný status/kód (`ERROR`, HTTP 503) a mapovat na inline/alert UI, ne na rejection dialog. *(Souvisí U1.)* |
| **P9** | `_shared/moderation/gemini.ts` | **Chybí fetch timeout.** UI slibuje ~15 s, zaseknuté volání může blokovat neomezeně. | `AbortSignal` timeout 20–30 s + fallback + retry. |
| ~~**P10**~~ | `rate-limit.ts` | ~~Fails open (M6).~~ | ✅ **s M6** — fail closed. |
| **P11** | `lib/moderation/moderate-listing-client.ts` | Žádný automatický retry pro tranzientní chyby; uživatel musí odeslat celý formulář znovu. | Exponenciální backoff (1–2 pokusy) jen pro `kind: "error"`. |
| **P12** | `ModerationRejectedDialog.tsx` | UI má `topicId` / `rejectedImageIndex`, ale **nikdy nezvýrazní problémovou fotku** ani téma. | Ukázat „problémová fotka #N“ a odscrollovat na obrázek. |
| **P13** | `CreateListingForm.tsx` (445–452) | Po AI dva kroky: `ModerationApprovedDialog` → `ModerationPreviewDialog` — klik navíc i bez otázek. | Přeskočit approved dialog při otevření preview, nebo sloučit. |
| ~~**P14**~~ | ~~`config/moderation/index.ts`~~ | ~~`MODERATION_ENABLED` je klientsky čitelný flag → obejitelné přes devtools.~~ | ✅ **Vyřešeno s H1** (migrace 027) — publikace vyžaduje approval token z Edge Function; vypnutí flagu na klientovi publikaci neumožní (inzerát zůstane `draft`). |

### Poptávka / kontakt

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| ~~**P15**~~ | `inquiry/rate-limit.ts` | ~~Rate limit nevynucen.~~ | ✅ **s H2** — IP + per-post; CAPTCHA ⏳. |
| **P16** | `inquiry/route.ts` | Honeypot + `inquiry_events` ✅; CAPTCHA ⏳; dashboard majitele ⏳. | Turnstile; volitelně dashboard. |
| ~~**P17**~~ | `api-errors.ts` | ~~Interní detaily v chybách.~~ | ✅ **s M5**. |
| **P18** | `lib/inquiry/send-error.ts` | Resend chyby v produkci zcela skryté, ops mají jen `console.error`. | Strukturované logování (Sentry/Datadog) + alert na 502 špičky. |
| ~~**P19**~~ | ~~`actions/contact.ts`~~ | ~~Insert `contact_reveals` v app vrstvě.~~ | ✅ **Zastaralé** — logování přesunuto do RPC `reveal_listing_contact` (migrace 025). Selhání insertu = žádné PII (fail closed). |

### Auth / onboarding / GDPR

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **P20** | `auth.ts` (`signUpWithEmail`) vs `RegistrationConsentFields.tsx` | **`consent_marketing` se nikdy nečte ani neukládá** — chybí sloupec v `profiles`. | Přidat `marketing_consent_at` (+ verze), ukládat při signupu, respektovat odvolání. |
| **P21** | `auth.ts` (`signInWithGoogle`) | Google OAuth **nesbírá souhlas s VOP** (na rozdíl od e-mailové registrace). | Consent obrazovka po OAuth před prvním použitím; blokovat do přijetí VOP. |
| **P31** | ✅ `RegistrationConsentFields.tsx`, `registration-consents.ts`, `auth.ts`, `legal.ts` | ~~Chybí checkbox věku 15+~~ | **Hotovo 2026-07-11.** Povinný checkbox `consent_age`; validace e-mail signup + Google onboarding (`requiresRegistrationConsentsOnboarding`). `age_consent_at` v DB zatím ne. |
| **P22** | `marketingovy-souhlas/page.tsx` | Stránka je stub, přitom registrace už marketingový checkbox nabízí. | Dokončit právní text + mechanismus odvolání před sběrem souhlasu. |
| **P23** | ✅ `account.ts`, `delete-user.ts`, migrace `037` | ~~Chybí flow smazání účtu~~ | **Hotovo 2026-07-11.** Self-delete `/profil/nastaveni` (confirm e-mail + checkbox); admin `/mod/uzivatele` (důvod); RPC + Auth Admin delete; e-mail potvrzení. |
| **P24** | `auth/callback/route.ts` | Chyby OAuth/e-mail redirect s **raw anglickou** hláškou v `?error=`. | Mapovat na CZ přes `mapAuthError`. |
| **P25** | produkt vs kód | PRD zmiňuje OTP; implementace je heslo + verifikační link, ne OTP login. | Sladit dokumentaci nebo doplnit magic-link/OTP. |
| **P33** | `docs/pravni/ochrana-osobnich-udaju-fo.md` §5, PRD §3, infra | **Data v EU nejsou zaručena ani zdokumentována.** GDPR §5 je obecné („zpracovatelé na vyžádání“); Supabase region není v repu; AI moderace posílá text+fotky ke Gemini/OpenAI (typicky mimo EHP); Vercel/Resend neověřeny. | 1) Ověřit Supabase region (`eu-central-1`). 2) Tabulka zpracovatelů (region, účel, DPA/SCC) v GDPR §5.1. 3) Gemini: EU endpoint nebo SCC + informace uživatelům. 4) Resend/Vercel ověřit v dashboardu. 5) PRD §3 checklist. Viz [`pravni/README.md`](./pravni/README.md). *(Částečně 2026-07-19: Supabase `eu-west-1` + Vercel `dub1` zapsány v GDPR §5.1.)* |
| **P37** | GDPR §3.2 vs `inquiry_events` | Text tvrdí anonymizaci IP v **logách serveru** do 7 dnů. Kód zkracuje jen `inquiry_events.ip_address` (cron `/api/cron/anonymize-inquiry-ips`, migrace **050**). Vercel/platformové logy neřešíme. | Upravit GDPR §3.2 + tabulku „provozní logy“ na realitu (`inquiry_events`), nebo doplnit proces pro platformové logy. |
| **P38** | GDPR §2 vs `LISTING_MAX_LIFETIME_DAYS` | Text: inzeráty **2 měsíce po vypršení**. Kód: po expiraci → `archived`; soft-delete až po **365 dnech od založení** (`049`, cron `archive-expired`). | Sladit GDPR text s 365denní lifetime, nebo změnit retenci v kódu. |
| **P39** | GDPR §2 „Newslettery“ vs kód | Text uvádí zpracování e-mailu pro obchodní sdělení. Souhlas se ukládá (`marketing_consent_at`), **odesílání newsletteru není implementované**. | Upravit GDPR (např. „připravujeme“) / nedokončit marketing, dokud není send path + odvolání (souvisí P20/P22). |

### P2B / Podnikatelé (EU 2019/1150)

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **P32** | `docs/pravni/vop.md` (čl. 2.3, 4.5, 8.2), provoz | VOP Draft 1.5 deklaruje P2B lhůty pro Podnikatele (**15 dní** před zhoršením ceníku/balíčků nebo změnou VOP; **30 dní** před trvalým zrušením účtu), ale **proces je neimplementovaný** — text sám o sobě notifikace nespustí. | Implementovat e-mailové notifikace na trvalém nosiči (Resend) min. 15/30 dní před: (a) zhoršením ceníku/parametrů balíčků, (b) podstatnou změnou VOP, (c) trvalým zrušením/pozastavením účtu Podnikatele (výjimky dle čl. 4.5 VOP). Admin/cron workflow + šablony; účinnost změny až po uplynutí lhůty. **Trigger:** před prvním živnostníkem na portálu. |

### Admin, monitoring, data lifecycle

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **P26** | `src/app/mod/` | ✅ **`/mod/karantena`**, **`/mod/inzeraty`**, moderátorská lišta na detailu; layout `moderator`+`admin`. | Audit timeline (P30). |
| **P27** | kód | ✅ Inline „Nahlásit“, `/nahlasit`, patička; migrace **040–042**; e-mail adminovi (`ADMIN_NOTIFICATION_EMAIL`). | Redirect po 3× report (404); `audit_events` insert. |
| **P28** | kód | ~~Chybí sitemap/robots~~ — ✅ `sitemap.ts`, `robots.ts`, `llms.txt` (2026-07-09). Zbývá: monitoring, backup/runbook v repu. | Ops checklist; dokumentovat Supabase PITR/zálohy. |
| **P29** | `actions/listing-management.ts` | Chyby managementu **tiše redirectují** na `/moje-inzeraty` bez flash zprávy. | Vracet error stav / `?error=`. *(Částečně: `deleteListing` → `?deleteError=1` + banner v `moje-inzeraty`.)* |
| **P30** | `supabase_schema.sql` | `audit_events`, `moderator_notes`, `inquiry_events` v PRD, **nenapojeno** v kódu. | Inkrementálně: nejdřív logovat poptávky a výsledky moderace. *(Částečně: migrace **028** `moderation_checks` + `log-moderation-check.ts` v EF.)* |

---

## 3. UX slabiny

### Chyby, načítání, zpětná vazba

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **U1** | `ModerationRejectedDialog.tsx` (+ P8) | Uživatel vidí „Inzerát nesplňuje podmínky“, i **když je AI down** — zavádějící a stresující. | Samostatný panel „Technická chyba“ + retry; rejection dialog jen pro reálný obsahový zásah. |
| **U2** | `CreateListingForm.tsx` (1044–1050) | Neplatný publish blokován jen disabled tlačítkem + `title` tooltipem — snadno přehlédnutelné (hlavně lokalita). | Inline shrnutí „Chybí: lokalita, cena…“ nad tlačítkem. |
| **U3** | `ListingInquiryForm.tsx` (124) | Míchání ty/vy („Zkontroluj připojení“ vs. vykání jinde). | Sjednotit na vykání (PRD §1.6). |
| **U4** | `MyListingActions.tsx` | Pauza/smazání/prodloužení bez success/error toastu — jen redirect. | Optimistic UI nebo krátký potvrzovací banner. *(Částečně: chyba smazání v přehledu.)* |
| **U5** | `HomeListings.tsx` | Chybí „načíst další“ — max 9 karet z 36 bez indikace, že je víc. | „Zobrazit další“ / stránkování. |
| **U13** | `SiteNoticeBar.tsx` | Odstávková lišta (`maintenance`) vizuálně zapadá — slabý kontrast, snadno přehlédnutelná. | Výraznější barva/pozadí, tučnější text, větší padding; ověřit na mobilu. ⏳ **Priorita zítra (2026-07-09)** |

### Formuláře a validace

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **U6** | `CreateListingForm.tsx` | Krok 1→2 projde s prázdnou podkategorií, pokud uživatel nezmění default (edge case). | Zablokovat pokračování do výběru podkategorie. |
| **U7** | `ListingInquiryForm.tsx` | Chybí hint max délky zprávy do server-side chyby (klient kontroluje jen min). | Zobrazit `message.length/1000` jako v create formu. |
| **U8** | `ListingInquiryForm.tsx` | Bez validace e-mail vs. telefon na `senderContact` (jen délka ≥ 5). | Vzor e-mail/telefon s CZ příklady. |
| **U9** | `ListingImageUpload.tsx` | Limit vstupní velikosti (25 MB) **není v hintu** — zmíněno jen 1 MB po kompresi. | „Max 25 MB před zmenšením, výsledek do 1 MB“. |
| **U10** | `ListingImageUpload.tsx` | Dávkový upload: první chyba zruší celou dávku; bez per-file progressu. | Pokračovat s validními soubory; per-file status. |
| **U11** | `AttachmentDropzone.tsx` | Bez progressu při base64 čtení/odesílání. | Spinner na submitu (částečně existuje). |
| **U12** | `LocationInput.tsx` | Combobox bez `aria-activedescendant` / navigace šipkami. | Plný WAI-ARIA combobox pattern. |

### Moderace UX

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **U13** | `ModerationRejectedDialog.tsx` | „Rozumím, upravím inzerát“ je fajn, ale **bez navádění**, které pole opravit. | Akční copy + focus na první nevalidní pole. |
| **U14** | `ModerationPreviewDialog.tsx` | „Publikovat bez vylepšení“ může mást (uživatel myslí, že musí použít AI text). | Vysvětlit v úvodu, že obě cesty jsou v pořádku. |
| **U15** | `CreateListingForm.tsx` | Při zamítnutí chybí „zkusit znovu bez AI“ pro rate-limit/výpadek (blokováno P8). | Nouzová cesta po N selháních. |
| **U25** | `ModerationPreviewDialog.tsx`, `ModerationApprovedDialog.tsx`, `CreateListingForm.tsx` | **Chybí AI disclaimer** — nikde není upozornění typu „AI může udělat chyby, zkontrolujte si text“ (viz Claude). PRD §5.1 footer stub + `podminky-inzerce.md` §3 vyžaduje označení „Vytvořeno s pomocí AI“ (AI Act). | Do `MODERATION_PREVIEW_UI` (intro pod dialogem hydratace) + volitelně overlay „Probíhá AI kontrola“ a patička. CZ copy dle PRD §1.6, např. *„AI může udělat chybu — před publikací si text zkontrolujte.“* U publikovaného inzerátu s AI textem badge „Vytvořeno s pomocí AI“ (flag v DB?). |

### Vyhledávání / procházení / poloha

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **U16** | `HomeBrowse.tsx` (92–101) | Guest CTA říká „přihlaste se přes Google“, přitom existuje e-mail auth. | „Přihlaste se nebo zaregistrujte“. |
| **U17** | `VisitorLocationProvider.tsx` (242–245) | Auto-otevření panelu polohy při první návštěvě — na mobilu rušivé. | Jemnější banner CTA místo modalu. |
| **U18** | `HeaderLocationPanel.tsx` | Label polohy oříznutý na malých obrazovkách (`max-w-[7.5rem]`). | Tooltip/celý název. |
| **U19** | `HeaderSearch.tsx` | Submit tlačítko `sr-only` — mouse-only mobil bez klávesnicového „search“. | Viditelná ikona hledání na mobilu. |
| **U20** | `HomeListings.tsx` | Neplatné hledání (<3 znaky) ukáže prázdný list jen s podtitulkem. | Výrazný hint při nevalidním dotazu. |

### Auth UX

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **U21** | `EmailAuthPanel.tsx` | Po registraci nutné opustit stránku pro kontrolu e-mailu — bez „poslat znovu“. | „Poslat znovu“ s cooldownem. |
| **U22** | `SetPasswordForm.tsx` / `nastavit-heslo/page.tsx` | Bez indikátoru síly hesla (jen min. 8). | Volitelný strength meter / kontrola běžných hesel. |
| **U23** | `OnboardingForm.tsx` | Google uživatel bez vysvětlení, že VOP bylo přijato jinde (nebylo — P21). | OAuth consent + jasnější „jednorázové nastavení“. |
| **U24** | `login/page.tsx` | `?error=` z OAuth může ukázat nepřeložené stringy. | CZ mapování chyb. |

### Mobil & přístupnost

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **U26** | moderation dialogy | Focus trap/Escape/`aria-modal` OK; chybí návrat focusu na trigger po zavření. | Vrátit focus na spouštěcí prvek. |
| **U27** | galerie na detailu | Miniatury `alt=""` (OK dekorativní); hlavní obrázek by měl mít popisný `alt` z názvu. | Předat title do `alt` na detailu. |
| **U28** | `CreateListingForm.tsx` | Kroky 1–2 bez `aria-current="step"`. | Označit aktuální krok pro čtečky. |

### Performance / Core Web Vitals

> **Stav (2026-07-14):** LCP ~1,3 s (green), CLS 0, INP ~17 ms — Core Web Vitals OK. Hlavní rezerva: **Resource load delay ~1,2 s** (prohlížeč pozdě začne načítat LCP prvek — pravděpodobně první fotka inzerátu nebo font u hero). Homepage je largely `"use client"` (`HomeBrowse`, `HomeListings`).

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **P34** | `page.tsx`, `HomeBrowse.tsx`, `HomeListings.tsx`, `ListingCard.tsx` | LCP bottleneck — prodleva před startem načtení LCP resource; `priority` na prvních 3 kartách nestačí bez dřívějšího objevení URL v `<head>`. | **1)** `<link rel="preload" as="image">` pro `initialListings[0].main_image_url` v server `page.tsx`. **2)** Hero (nadpis + gradient + kategorie?) vyčlenit do Server Component — méně JS před prvním paintem. **3)** Volitelně: grid inzerátů SSR, client jen filtry/poloha. Cíl: LCP **<1 s** na mobilu (teď ~1,3 s). |
| **P34b** | Search Console / CrUX | Po nasazení P34 ověřit v GSC → Core Web Vitals a Lighthouse mobile. | Měřit po každé větší změně homepage; baseline uložit do `Stav_projektu/`. |

### GTM / analytika (GA4)

| ID | Soubor | Slabina | Návrh |
|----|--------|---------|-------|
| **P35** | `VirtualPageviewTracker`, `virtual-pageview.ts`, GTM container | Klik na inzerát → detail se v GA4 **nezobrazil** jako page view (SPA). | ✅ **2026-07-17.** Client navigace pushuje `virtual_pageview` + `page_path` / `page_title` (jen po souhlasu). V GTM: Custom Event `virtual_pageview` → GA4 **page_view**. Ověřit Preview + DebugView. |
| **P36** | `CookieConsentBanner.tsx`, `gtm-ids.ts` | Tlačítka souhlasu / nesouhlasu s analytikou **nemají** `data-gtm-id`. | Přidat ID do `GTM_CTA` (např. `cta_cookie_accept_analytics`, `cta_cookie_reject_optional`) + `gtmCtaProps` na obě tlačítka v liště (i při znovuotevření přes „Nastavení cookies“). |

### ✅ Co je UX/procesně dobře

- Čeština-first copy napříč formuláři a moderačními hláškami.
- Moderační architektura: klient + Edge Function, Gemini→OpenAI fallback, sync promptů, server-side strip kontaktů (vč. **032** — cena v popisu ≠ telefon).
- Formulář inzerátu: dvoukrokový wizard, živé počítadlo znaků, náhled/varování expirace, validace `event_date`, overlay při AI.
- Náhled moderace: editovatelný AI text, povinné Q&A, „publikovat originál“, limity délky.
- Obrázky: klientská komprese, validace velikosti, downscale pro moderaci, úklid při explicitním odebrání.
- Poptávka: solidní server validace, kontrola příloh, blok self-inquiry, kontrola expirace, Resend s `replyTo`.
- Browse: adaptivní radius, celostátní fallback, SSR, kontextové empty states, opt-out polohy.
- Auth: CZ `mapAuthError`, onboarding gate, reset hesla.
- Přístupnost: `role="alert"`, `aria-label` u hledání, `aria-expanded` u panelu polohy, pattern dialogů.

---

## 4. Doporučené pořadí implementace

| Fáze | Nálezy | Proč | Odhad |
|------|--------|------|-------|
| **1. Ochrana PII (blokátor)** | ~~C1~~ ✅, ~~C2~~ ✅, ~~M1~~ ✅, ~~M2~~ ✅ | Jádro slibu soukromí + DoD §1.1/3. **Dokončeno** (migrace 025 + 026). | hotovo |
| **2. Integrita publikace** | ~~H1~~ ✅, ~~P1~~ ✅, ~~P14~~ ✅, M10 | Server-side vynucení moderace. **Dokončeno** (migrace 027); zbývá M10 (ohraničení promptu). | hotovo (M10 ⏳) |
| ~~**3. Anti-spam & náklady**~~ | ~~H2, P15, P16, M6/P10, M7~~ | ✅ **2026-07-16** (CAPTCHA ⏳). | hotovo |
| ~~**4. Redirect & DB integrita**~~ | ~~H3, M3, M4~~ | ✅ H3 + migrace 047 (M3/M4). | hotovo |
| **5. Robustnost procesů** | P2, P3, P4, P8/U1, P9, P11 | Orphan data, chybný cron, chybné hlášení výpadku AI. | 1–2 dny |
| **6. GDPR compliance** | P20, P21, P22, P23, P24, **P33**, **P37**, **P38**, **P39** | Souhlasy + smazání účtu + data v EU + sladění GDPR textu s kódem (IP logy, retence inzerátů, newsletter). | 1–2 dny |
| **6b. P2B provoz (Podnikatelé)** | P32 | E-mailové lhůty 15/30 dní dle VOP — před prvním IČO uživatelem. | 0,5–1 dne |
| **7. UX vylepšení** | U1, U2, U3, U16, U21, P7, U5 | Rychlé výhry v důvěře a konverzi. | 1 den |
| **8. Admin/ops (post-MVP)** | P26, P27, P28, P30, L6 | God Mode, reporting, monitoring, audit log dle PRD §11. | dle PRD |
| **9. Performance (volitelné)** | P34, L8 | LCP <1 s; favicon/OG — rychlé výhry po launchi. | 0,5–1 dne |

---

## 5. Poznámka k mapování na DoD

- **DoD §1.1/3 (ochrana kontaktů):** ✅ **splněno** — C1/C2 (migrace 025) + rate limit reveal PRD §5.3 (M1, migrace 026).
- **DoD §1.1/5 (bezpečnostní filtr projde vždy):** ✅ **splněno** — H1/P1/P14 (migrace 027): publikace jen přes approval token z Edge Function, DB gating stavů. Reziduum: obsah plných fotek není hashově vázán na moderovaný náhled (viz H1).
- **DoD §1.5 (v0.5 audit/God Mode):** částečně — nahlášení + karanténa + inzeráty ✅ (P26/P27); zbývá audit UI (P30), moderátorské poznámky, FAQ accordion.

### Changelog revizí

| Datum | Změna |
|-------|-------|
| 2026-07-06 | Původní audit (Fable) |
| 2026-07-06 | Revize: C1/C2/M2 označeny hotové (025); P19 zastaralé; přidán implementační plán M1; opraven popis M3 |
| 2026-07-06 | M1 dokončeno (migrace 026: rate limit reveal 20/den, dedup, CZ hláška); fáze 1 (PII) uzavřena |
| 2026-07-06 | H1/P1/P14 dokončeno (migrace 027: approval token + DB gating, Edge vydává token, publish RPC, keyword scan); fáze 2 uzavřena; M4 přeformulováno |
| 2026-07-07 | Manuální test create (hrnek + fotka) prošel; Gemini: `geminiSafe` prompt, `safetySettings`, obsahové zamítnutí `PROHIBITED_CONTENT`; jednotky cm/ml v promptu a `format-question-answers.ts`; migrace 025–027 nasazeny v Supabase |
| 2026-07-08 | Manuální testy **editace inzerátu (1–8)** prošly; migrace **028–032** (log moderace, `profile_no`, soft-delete hardening, strip ceny vs. telefon); EF `moderate-listing` (auth JWT, JSON parser, logging, hydratace — tón, pevná cena, dotazy nemovitosti RK/provize); UX redirectů po editaci, cache `/moje-inzeraty` |
| 2026-07-09 | **P28 částečně:** JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt` implementovány; datum Vytvořeno na HP a detailu |
| 2026-07-11 | **God Mode částečně:** `/mod/uzivatele` (admin); bootstrap rolí v `supabase-prikazy.md` + Metodika §11.1; **P23 ✅** smazání účtu; **P31 ✅** checkbox věku 15+; migrace **037–039** (delete + listing quota) |
| 2026-07-11 | **VOP Draft 1.5:** P2B pasáže (lhůty, ranking, data access, mikropodnik); **P32 ⏳** provozní implementace e-mailových notifikací 15/30 dní pro Podnikatele |
| 2026-07-11 | **P26/P27 ✅** God Mode karanténa + inzeráty + lišta; nahlášení inline + `/nahlasit`; migrace **040–042**; opravy `block_failed` / `report_failed`; Metodika §10.3 |
| 2026-07-13 | **P33 ⏳** Data v EU — checklist v GDPR §5.1, `pravni/README.md`; není garantováno v kódu (AI → Gemini/OpenAI) |
| 2026-07-14 | **P34 ⏳** Performance / LCP — preload první fotky, server hero, volitelně SSR grid; **L8 ⏳** favicon + OG; baseline LCP 1,3 s (green), delay ~1,2 s |
| 2026-07-15 | **P35 ⏳** GA4 `virtual_pageview` při detailu inzerátu — dataLayer push + GTM trigger; priorita zítra |
| 2026-07-17 | **P35 ✅** `VirtualPageviewTracker` + `virtual-pageview.ts`; Metodika §14.3; v GTM zbývá Custom Event → GA4 page_view |
| 2026-07-17 | **P36 ⏳** GTM ID na tlačítka cookie lišty (Přijmout / Nezbytné) |
| 2026-07-16 | **Security hardening:** migrace **047** (M3/M4); M6 fail closed; M7 limity fotek EF; M8/M9 magic bytes; L1 zůstává 8 znaků (UX); L9 llms.txt escape; H2/P15/P10/P17 stavy; M10 částečně; **smoke test checklist** (A–D) v §0 |
| 2026-07-19 | **GDPR audit vs kód:** §6.2 věk → prohlášení (ne hard ověření); **P37** IP logy vs `inquiry_events`; **P38** retence inzerátů 2 měsíce vs 365 dní; **P39** newsletter bez send path. Migrace **050** IP anonymizace; Supabase/Vercel EU v §5.1. |

*Konec dokumentu. Před implementací ověřte každý otevřený bod proti aktuální větvi.*
