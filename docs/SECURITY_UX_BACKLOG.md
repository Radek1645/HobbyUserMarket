# Security & UX backlog — zaPikolou.cz

> **Jediný živý backlog** (od 2026-08-06, naposledy 2026-08-31).  
> Originály auditů jsou v [`archive/audits/`](./archive/audits/). Sem patří stav a pořadí práce, ne plný zápis auditu.  
> **Operativní smoke / produktové TO-DO:** [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md)

---

## 0. Must-have před ostrým provozem

Blokátory spuštění (ne „nice to have“). Stav k 2026-08-28.

### Hotovo — bezpečnostní základ

| Oblast | Stav |
|--------|------|
| PII kontakty (C1/C2, reveal rate limit) | ✅ migrace 025–026 |
| **P0 column SELECT** (`contact_phone`, `location`, `original_*`) | ✅ **SEC-H05** — 078 (anon) + 079 (authenticated); produkce 28. 8. 2026 |
| Publish gate + approval token + fingerprint textu/fotek | ✅ 027, 062–066; smoke create/edit |
| AI rate limit jen service_role + atomické RPC | ✅ 062 |
| Next.js / prod deps bez High/Critical | ✅ 15.5.22; `npm audit --omit=dev` = 0 |
| Staging fotek + Sharp renditions (SEC-H02 hardening) | ✅ 067–068; I5 produkční smoke OK |
| Auth open redirect | ✅ H3 |
| Keyword scan + fail-closed AI / rate limit | ✅ |
| Hard stop auto-ban (3× hard gate / 24 h) | ✅ produkční smoke H1/H3/H5 2026-08-06 |

### Otevřené blokátory

| # | Úkol | Proč | Stav | Odkaz |
|---|------|------|------|-------|
| ~~GO-1~~ | Produkční smoke **hard stop** H1–H3, H5 | H2 NSFW + H4 mail volitelně | ✅ 2026-08-06 | [`TO-DO`](./TO-DO-dalsi-den.md) §1 |
| ~~GO-2~~ | RLS smoke **B1–B5** na produkční DB | REST `authenticated`, ne SQL editor | ✅ 2026-08-30 (B1–B4); B5 UI 2026-08-06 | §3 + TO-DO §3 |
| **GO-3** | Negativní smoke fotek **I6** | Cizí path / výměna / pořadí nesmí projít publish gate | ⏳ otevřené | TO-DO §E |
| ~~GO-4~~ | Ops checklist: Vercel `main` zelený, Edge `CRON_SECRET` + `SITE_URL` | Crony 200, maily s `zapikolou.cz` | ✅ 2026-08-30 | TO-DO §0 |
| **GO-5** | **P33** — revize GDPR textů právníkem (Resend DPA ✅) | Právní riziko při ostrém provozu s PII | ⏳ otevřené | §4 P33 |
| ~~**GO-6**~~ | Inquiry abuse: `Content-Type` + `Origin` (CAPTCHA = SEC-M09 ✅) | Cross-site spam poptávek (SEC-M02) | ✅ v kódu 2026-08-29 | §2 SEC-M02 |
| ~~GO-7~~ | FAQ + DSA/VOP odkazy smoke (**F1**) | — | ✅ 2026-08-06 | [`TO-DO`](./TO-DO-dalsi-den.md) §4 |

### Není blokátor soft launch

- Category SEO kód (CSEO4), Půjčovna, monetizace v0.6, P2B e-maily (až před 1. IČO), AV příloh, God Mode timeline, LCP preload, UX polish (dva AI modaly, loading.tsx).
- ~~**SEC-M07 + SEC-M08**~~ — ✅ produkce 29. 8. 2026: Vercel green, smoke, inzerát jde založit.

---

## 1. Executive summary

| Oblast | Otevřené High | Otevřené Medium | Low / backlog |
|--------|:-------------:|:---------------:|:-------------:|
| Security | 0 (SEC-H01–H05 ✅) | 4 (M01, M03, M04, M06) | L01–L13 + rezidua |
| Proces (Fable) | — | P5, P13, P16, P18, P28 ops, P29, P30 UI, P32, P33 právník | P25, P34, P36, P40 |
| UX | — | loading/error boundaries, silent errors, 2 AI modaly | a11y drobnosti |

**Nasazení 062–066 + Edge:** 2026-07-28 ✅ · **I5 Sharp/renditions:** 2026-08-05/06 ✅ · **Hard stop H1/H3/H5 produkce:** 2026-08-06 ✅ · **P0 column grants 078+079:** 2026-08-28 ✅ ověřeno · **SEC-M07/M08/M09:** ✅ ověřeno/uzavřeno produkce 2026-08-29 · **SEC-M02/GO-6:** ✅ v kódu 2026-08-29 · **SEC-M10:** ✅ změna hesla smoke produkce 2026-08-30 · **GO-2 B1–B5:** ✅ · **I6:** ⏳

**Další bezpečnostní práce:** SEC-M03 hlavičky → SEC-M01/M04/M06 → L\*.

---

## 2. Security — nálezy podle priority

ID `SEC-*` jsou kanonická. Sloupec **Zdroj** odkazuje na archivovaný audit (`2026-07-27` / `2026-08-28 M1` = původní číslo v tom auditu).

### Vysoké (SEC-H*) — uzavřeno

| ID | Nález | Zdroj | Stav |
|----|-------|-------|------|
| SEC-H01 | Token ≠ text | 2026-07-27 | ✅ 063–066 |
| SEC-H02 | Token ≠ fotky | 2026-07-27 | ✅ 063; staging 067–068 |
| SEC-H03 | Bypass `rate_limits` | 2026-07-27 | ✅ 062 |
| SEC-H04 | Vulnerable deps | 2026-07-27 | ✅ Next 15.5.22 |
| **SEC-H05** | Table `GRANT SELECT` na `posts` přebíjel column `REVOKE` — `anon` (pak i `authenticated`) četli `contact_phone`, přesné `location`, `original_*` | 2026-08-28 P0 | ✅ **078 + 079** na produkci 28. 8. 2026. Detail / edit vlastního inzerátu OK. Hint `GRANT SELECT ON posts` **nepoužívat**. |

Incident SEC-H05 (logy 21.–28. 8., retence 7 dní PRO): `%2Ccontact_phone` zvenku **0**; `original_description` jen vlastní appka. Zneužití v dostupném okně nenalezeno; starší období nejde ověřit. Není právní posouzení. Důkazy a SQL: [`archive/audits/SECURITY_AUDIT_20260828.md`](./archive/audits/SECURITY_AUDIT_20260828.md).

### Střední — otevřené (priorita shora dolů)

| ID | Nález | Návrh | Zdroj | Launch |
|----|-------|-------|-------|--------|
| ~~**SEC-M07**~~ | IP z `x-forwarded-for` **zleva** — klient ji volí | Jeden helper: `x-vercel-forwarded-for` → `x-real-ip` → XFF **zprava**. `cf-connecting-ip` pryč. | 2026-08-28 M1 | ✅ **ověřeno produkce 2026-08-29** (unit 6/6 dřív; smoke + založení inzerátu). |
| ~~**SEC-M08**~~ | Nekonečný guest mint + `p_captcha_verified: true` + žádný globální strop AI | Mint 10/h/IP (jen nové cookie); upload Turnstile po soft 10; globální 40/h a 300/den (`guest_ai_spend`) | 2026-08-28 M2 | ✅ **ověřeno produkce 2026-08-29** — Edge + Next; smoke, inzerát jde založit. |
| ~~**SEC-M09**~~ | Slabé: `resendSignupVerificationEmail`, `/api/inquiry`, login/signup. | Turnstile u resend + inquiry; login/signup záměrně bez CAPTCHA | 2026-08-28 M3 | ✅ **uzavřeno 2026-08-29** (`6ebca43`): poptávka + resend na produkci. Login/signup záměrně bez CAPTCHA — hodnota účtu nízká, tření na konverzní cestě vysoké. Revidovat při nárůstu 400 na `/auth/v1/token` nebo signupů. |
| ~~**SEC-M10**~~ | `updatePassword()` bez stávajícího hesla; po změně chybí `signOut({ scope: "global" })`. | Rozlišit obnova vs. změna v účtu | 2026-08-28 M5 | ✅ **produkce 2026-08-30:** `/profil/nastaveni` chtělo stávající heslo. Obnova jen s čerstvým JWT AMR `recovery`. |
| **SEC-M01** | Edge `req.json()` bez limitu body/schema | Content-Length, schema před mapováním | 2026-07-27 | P1 po GO |
| ~~**SEC-M02**~~ | Inquiry bez Content-Type / Origin | JSON + Origin allowlist; CAPTCHA = M09 | 2026-07-27 | ✅ **GO-6 v kódu 2026-08-29** — `application/json` (415) + produkční Origin/Referer whitelist (403). Cross-site z prohlížeče; curl neřeší (rate limit + Turnstile). |
| **SEC-M03** | Chybí CSP / frame-ancestors / Referrer-Policy / Permissions-Policy (`next.config.ts`, middleware). Vercel dodá HSTS. SameSite=Lax snižuje clickjacking. | CSP report-only → enforce | 2026-07-27 + 2026-08-28 M4 | P1 |
| **SEC-M04** | Log 800 znaků raw AI odpovědi | Jen kód/model/délka/hash | 2026-07-27 | P1 |
| ~~SEC-M05~~ | Re-moderace polí | ✅ 063 | 2026-07-27 | — |
| **SEC-M06** | Restore → rovnou `active` | Draft/hidden + povinný důvod / review | 2026-07-27 | P1 |

### Nízké — otevřené

| ID | Nález | Zdroj | Poznámka |
|----|-------|-------|----------|
| SEC-L01 / L2 | Gemini klíč v query | 2026-07-27 | Header auth |
| **SEC-L02** | View-hash fallback = `SUPABASE_SERVICE_ROLE_KEY` | 2026-07-27 + 2026-08-28 L5 | Vyžadovat `LISTING_VIEW_HASH_SECRET` |
| SEC-L03 | JSON-LD bez společného serializeru | 2026-07-27 | Homepage/FAQ |
| SEC-L04 | Orphan Storage | 2026-07-27 | Reconciliation job |
| SEC-L05 / M9-R | Přílohy bez AV | 2026-07-27 | Po soft launch / nebo zakázat PDF |
| SEC-L06 | Staré SQL 001/002 | 2026-07-27 | Neprohánět jako „fresh deploy“ |
| SEC-L07 | Anonymní `/nahlasit` bez limitu | 2026-07-27 | IP/e-mail + CAPTCHA (po M07/M09) |
| **SEC-L08** | `loadAccountBlacklist()` exportovaná SA bez `requireStaff()` | 2026-08-28 L1 | Drží RLS + granty |
| **SEC-L09** | Breadcrumb JSON-LD `dangerouslySetInnerHTML` bez escape `<` | 2026-08-28 L2 | Zdroj `category_seo_pages` (service role) |
| **SEC-L10** | `LegalMarkdown` propustí `javascript:` v `href` | 2026-08-28 L3 | Zdroj je repo markdown |
| **SEC-L11** | `.gitignore` jen `.env*.local` | 2026-08-28 L4 | Doplnit `.env`, `.env.production` |
| **SEC-L12** | Bucket `post-images` veřejný; skrytý inzerát dokud neprobehne cleanup | 2026-08-28 L6 | UUID cesty; přijmout nebo signed URL |
| **SEC-L13** | `COALESCE(auth.role(), '') NOT IN ('anon','authenticated')` — NULL role = privileged (fail-open) | 2026-08-31, 081 | Úklidová vlna: `COALESCE(…, 'anon')`. PostgREST JWT role nastavuje vždy (B1–B4 = 42501). DEFINER trigger nesmí použít `current_user` (je vždy owner). Migrace/SQL editor po změně musí `set_config('request.jwt.claim.role','service_role')`. Výskyt: 027, 031, 036, 047, 048, 049, 063, 066, 081. |
| ~~H2-R~~ | CAPTCHA u inquiry | 2026-07-27 | ✅ v **SEC-M09** — produkce 29. 8. |
| L1 | Min. heslo 8 | 2026-07-27 | Záměr; strength meter ✅ |

Detail důkazů 2026-07-27: [`archive/audits/SECURITY_AND_UX_AUDIT_20260727.md`](./archive/audits/SECURITY_AND_UX_AUDIT_20260727.md) §3.  
Detail P0 / M1–M5 / L1–L6 a kontrolní SQL: [`archive/audits/SECURITY_AUDIT_20260828.md`](./archive/audits/SECURITY_AUDIT_20260828.md).

### Trvalá pravidla (granty / RLS) — z 28. 8. 2026

1. Oprávnění ověřovat **dotazem na nasazenou DB**, ne jen z migrace.
2. Column `REVOKE` po table `GRANT SELECT` je **no-op**.
3. Nový sloupec na `posts` musí stejná migrace přidat do `GRANT SELECT (…)` — jinak `42501`.
4. `get_nearby_posts` / `search_posts` jsou DEFINER: viditelnost drží `is_post_publicly_visible` v těle.
5. Sloupcové granty jsou per-role. Citlivé pole = SECURITY DEFINER RPC, ne REST SELECT.

---

## 3. Smoke checklist (produkce)

Přeneseno z Fable §0 + TO-DO-dalsi-den. Minimum před „GO“: **A6 + B1–B5 + hard stop GO-1 + I6**.

### A) Happy path (047+)

| # | Scénář | ✓ |
|---|--------|---|
| A1–A5 | Reg/login, create, edit, prolong, pause | ✅ 2026-07-19 |
| A6 | Poptávka PDF/JPG OK; falešná přípona → chyba | ☐ |

### B) RLS regress (047)

Jako běžný `authenticated` (ne service_role):

| # | Test | Očekávání | ✓ |
|---|------|-----------|---|
| B1 | `PATCH profiles` `company_ico_verified: true` (REST, JWT test účtu) | `42501` | ✅ 2026-08-30 HTTP **403**, `code: 42501`, „company_ico_verified can only be set by admin“ |
| B2 | `PATCH posts` `payment_status: paid` (vlastní `id=126`) | zamítnuto | ✅ 2026-08-30 HTTP **403**, `code: 42501`, „permission denied for table posts“ |
| B3 | `PATCH posts` `renew_count: 99` (`id=126`, předtím `renew_count=0`) | zamítnuto | ✅ 2026-08-30 HTTP **403**, `code: 42501` |
| B4 | `PATCH posts` `expires_at: 2027-01-01T00:00:00Z` (`id=126`) | zamítnuto | ✅ 2026-08-30 HTTP **403**, `code: 42501` |
| B5 | Prodloužení přes UI | `renew_count` +1 | ✅ 2026-08-06 (router id 47; `renew_count: 1`) |

### C) Moderace (volitelné) · D) Feed

| # | Scénář | ✓ |
|---|--------|---|
| C1–C3 | JPEG OK; obří/ne-obrázek 400; rate_limits down → 503 | ☐ |
| D1 | `/llms.txt` s `[`/`]` v titulku | ☐ |

### Hard stop · fotky · P0 sloupce

Viz [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) §1 — **H1/H3/H5 produkce ✅ 2026-08-06**; H2 NSFW ☐; I5 ✅, I6 ☐.

P0 (28. 8. 2026): `anon`/`authenticated` + `location` → `42501`; search „teploměr“ OK; `/upravit` vlastního inzerátu po deploy 079 → špendlík na mapě ✅.

---

## 4. Proces — otevřené (Fable ID)

| ID | Téma | Stav / návrh | Launch |
|----|------|--------------|--------|
| **P5** | Prolong hard-code +30 dní | RPC / `listing_duration_days` | Po |
| **P13** | Dva AI modaly (Approved→Preview) | Sloučit | Po |
| **P16** | Inquiry CAPTCHA + dashboard | CAPTCHA = **SEC-M09** ✅ produkce 29. 8.; dashboard majitele částečně (počty ✅) | Dashboard po |
| **P18** | Resend chyby jen console | Sentry/alert | Po |
| **P25** | PRD OTP vs heslo | Sladit docs | Docs |
| **P28** | Monitoring / backup runbook | Ops checklist v repu | Soft ops |
| **P29** | Pause/publish silent redirect | `?error=` banner | UX P1 |
| **P30** | God Mode sjednocená timeline | Data ✅; UI chybí | Po |
| **P32** | P2B e-maily 15/30 dní | Před 1. IČO | Trigger |
| **P33** | GDPR právník | DPA Resend ✅ | **GO-5** |
| **P34/b** | LCP preload + GSC | Volitelné | Po |
| **P36** | GTM ID cookie tlačítka | `gtmCtaProps` | Po |
| **P40** | Prompt version v logu | Částečně 064 (`prompt_version`…); inventář AI | Budoucí |

Hotové C*/H*/M*/P*/U* (025–061, GDPR texty, God Mode základ, FAQ kód, …): viz archiv Fable.

---

## 5. UX / SEO / PRD diskrepance (otevřené)

### UX P1 (ne GO, ale brzy)

1. `loading.tsx` / `error.tsx` (HP, detail, moje, mod)
2. Chyby pause/publish bez hlášky (P29)
3. Sloučit AI Approved + Preview (P13)
4. Po selhání approval tokenu technická chyba hned
5. Branding: zbývající `HobbyUserMarket` → `SITE_DISPLAY_NAME`

### SEO / docs

| Položka | Stav |
|---------|------|
| `/dsa` v sitemap | chybí (Metodika říká ano) |
| `robots` disallow `/mod`, `/profil` | chybí |
| BreadcrumbList na detailu | backlog |
| Default OG image | backlog |
| Category SEO Vlna 1 kód | CSEO4 — plán ✅, kód ☐ ([`seo/CATEGORY_SEO.md`](./seo/CATEGORY_SEO.md)) |

### PRD

- Monetizace v0.6 (`bank_payments`, Fio, SPAYD, `/mod/platby`) — mimo soft launch.
- Povinný dropdown důvodu u mod delete/hide — částečně volný text.

---

## 6. Action plan (sjednocený)

### P0 — před ostrým provozem (= §0 GO-*)

- [x] GO-7 FAQ smoke na produkci
- [x] GO-1 Hard stop produkční smoke (H1/H3/H5; H2 NSFW + H4 mail produkce volitelně)
- [x] SEC-H05 column SELECT 078+079 (nebyl v původním GO seznamu; hotovo 28. 8.)
- [x] GO-2 RLS B1–B5 — ✅ B1–B4 REST 2026-08-30 (`42501`); B5 UI 2026-08-06
- [ ] GO-3 I6 negativní fotky
- [x] GO-4 Ops secrets + zelený build — ✅ 2026-08-30 (`6ebca43` Ready; `CRON_SECRET` Production+Preview; crony 200; maily `https://zapikolou.cz`)
- [ ] GO-5 P33 právník
- [x] GO-6 Inquiry Content-Type + Origin (v kódu 2026-08-29; produkční smoke zbývá)

### P1 — bezpečnost / abuse (hned; nahoře = dřív)

- [x] **SEC-M07** IP helper (Vercel → XFF zprava) — ověřeno produkce 2026-08-29
- [x] **SEC-M08** guest mint + captcha flag + strop AI útraty — ověřeno produkce 2026-08-29
- [x] **SEC-M09** — Turnstile u resend + `/api/inquiry`; ✅ produkce 2026-08-29. Login/signup záměrně bez CAPTCHA — hodnota účtu nízká, tření na konverzní cestě vysoké. Revidovat při nárůstu 400 na `/auth/v1/token` nebo signupů.
- [x] **SEC-M02 / GO-6** — inquiry `Content-Type: application/json` + Origin whitelist (v kódu 2026-08-29)
- [x] **SEC-M10** — nastavení = stávající heslo (✅ smoke produkce 2026-08-30) + global sign-out; obnova jen s čerstvým AMR `recovery`
- [ ] SEC-M03 Security headers (CSP report-only)
- [ ] SEC-M01 Edge body/schema limity
- [ ] SEC-M04 Nelogovat raw AI text
- [ ] SEC-M06 Restore → draft/hidden + důvod
- [ ] SEC-L07 Report rate limit
- [ ] SEC-L11 `.gitignore` `.env`
- [ ] P29 Silent management errors

### P2 — produkt / UX / SEO

- [ ] P13 sloučit AI modaly · loading/error boundaries · branding
- [ ] Sitemap `/dsa` · robots `/mod` `/profil` · OG · BreadcrumbList
- [ ] P36 GTM cookie CTA · P34 LCP
- [ ] CSEO4 Category SEO Vlna 1
- [ ] P30 God Mode timeline
- [ ] SEC-L08–L10, L09 breadcrumbs, L12 public bucket

### P3 — později / triggery

- [ ] P32 P2B před IČO · monetizace v0.6 · AV příloh · P40 inventář AI · dependency CI gate · SEC-L01/L02/L04/L05
- [ ] **SEC-L13** `auth.role()` NULL = privileged (fail-open v write guardech) — úklidová vlna, ne teď

---

## 7. Akceptační kritéria bezpečnostní iterace

1. `authenticated` JWT nemění `rate_limits` (ověřit B-style SQL).
2. Změna publish-sensitive pole / fotky po AI → token neplatný (I6 + fingerprint smoke).
3. Neplatný AI JSON / chybějící token ≠ publikace.
4. `npm audit --omit=dev` bez Critical/High; `lint` + `build` OK.
5. Hard stop 3×/24h → `/ucet-pozastaven` (+ mail — H4 produkce ještě neověřen). **Ověřeno produkce 2026-08-06** (stop stránka + blacklist automatic).
6. `anon` i `authenticated`: `SELECT contact_phone` / `location` / `original_*` z `posts` → `42501`. Edit vlastního inzerátu přes `get_post_edit_private_fields`. **Ověřeno produkce 2026-08-28.**
7. Guest založení inzerátu po M07/M08 (trusted IP, mint cookie, upload/AI limity). **Ověřeno produkce 2026-08-29** (Vercel smoke, inzerát jde založit).
8. Turnstile u poptávky (`/api/inquiry`) + resend ověření (SEC-M09). **Ověřeno produkce 2026-08-29.** Login/signup záměrně bez CAPTCHA — revidovat při nárůstu 400 na `/auth/v1/token` nebo signupů.
9. Inquiry `Content-Type` + Origin (SEC-M02 / GO-6) — v kódu 2026-08-29. Změna hesla se stávajícím (SEC-M10) — **ověřeno produkce 2026-08-30**. Obnova jen s AMR `recovery`.
10. RLS B1–B4 jako `authenticated` REST na vlastním inzerátu → `42501`. **Ověřeno produkce 2026-08-30** (post `126`). B5 UI ✅ 2026-08-06.

---

## Archiv a changelog

| Soubor | Obsah |
|--------|-------|
| [`archive/audits/TO-DO_Fable_20260706.md`](./archive/audits/TO-DO_Fable_20260706.md) | Původní Fable audit + detail hotových C/H/M/P/U |
| [`archive/audits/SECURITY_AND_UX_AUDIT_20260727.md`](./archive/audits/SECURITY_AND_UX_AUDIT_20260727.md) | Audit 2026-07-27 (SEC-H01–H04, M/L, AI prompt, UX) |
| [`archive/audits/SECURITY_AUDIT_20260828.md`](./archive/audits/SECURITY_AUDIT_20260828.md) | Audit 2026-08-28 (P0 PostgREST, M1–M5, L1–L6, kontrolní SQL) |

| Datum | Změna |
|-------|-------|
| 2026-08-31 | **SEC-L13** (low, úklid): `COALESCE(auth.role(), '')` ve write guardech bere NULL jako privileged. PostgREST JWT roli nastavuje; objevilo se u 081 v SQL editoru. Oprava `COALESCE(…, 'anon')` + JWT v migracích. Ne teď. |
| 2026-08-30 | **GO-2 uzavřeno:** B1–B4 produkční REST jako `authenticated` (post `126` / `kovova-soska-buddhy-1w8o`) → HTTP 403 + `42501`. B5 UI už 6. 8. **SEC-M10** změna hesla: produkce chtěla stávající heslo. |
| 2026-08-30 | **Hydratace `Doplňte`:** vyplněné výzvy jdou do Parametrů, stejná otázka se neptá. Edge `moderate-listing` deploy + migrace `080` (půlnoc události). App po Vercel pushi. |
| 2026-08-30 | **GO-4 uzavřeno:** Vercel `6ebca43` Ready Production; `CRON_SECRET` Secret (Production+Preview, hodnota skrytá — ověřeno crony 200); `SITE_URL` z mailů `https://zapikolou.cz`. |
| 2026-08-29 | **SEC-M10 hardening:** `updatePassword` / `/auth/nastavit-heslo` vyžadují čerstvé AMR `recovery` přes `getClaims()` — běžná session už neobejde stávající heslo. Hostname whitelist: jeden zdroj `STABLE_APP_HOSTNAMES` (Turnstile re-export). |
| 2026-08-29 | **SEC-M02 / GO-6 + SEC-M10 v kódu:** inquiry JSON Content-Type + Origin whitelist; změna hesla v nastavení se stávajícím heslem + global sign-out. Produkční smoke zbývá. |
| 2026-08-29 | **SEC-M09 uzavřeno:** Turnstile u poptávky + resendu (`6ebca43`, produkce OK). Login/signup záměrně bez CAPTCHA — hodnota účtu nízká, tření na konverzní cestě vysoké. Revidovat při nárůstu 400 na `/auth/v1/token` nebo signupů. |
| 2026-08-29 | **SEC-M09 první fáze v kódu:** povinný Turnstile u resendu a poptávky; action + hostname; timeout; UI retry; resend 10/h/IP + 3/h/e-mail. |
| 2026-08-29 | **SEC-M07/M08 ověřeno na produkci:** Vercel green, smoke, inzerát jde založit. |
| 2026-08-28 | **SEC-M07/M08:** důvěryhodná IP, limit mintu visitor cookie, upload Turnstile po soft limitu, globální `guest_ai_spend` 40/h + 300/den. Bez nové SQL migrace. |
| 2026-08-28 | Audit 28. 8. sloučen sem; P0 = **SEC-H05** ✅ 078+079; otevřené M1–M5 → SEC-M07–M10 + M03; L\* → L08–L12 / L02; originál v `archive/audits/` |
| 2026-08-06 večer | Produkční smoke hard stop H1/H3/H5 ✅; UI rose panel pro hard gate vs amber Gemini; GO-1 uzavřen |
| 2026-08-06 | Sjednocení Fable + Security auditu do tohoto souboru; originály archivovány |
| 2026-07-27…28 | SEC-H01–H04 opravy + nasazení 062–066 |
| 2026-07-06…26 | Fable fáze 1–7 (PII, publish gate, anti-spam, GDPR texty, UX) |
