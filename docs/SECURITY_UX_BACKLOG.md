# Security & UX backlog — zaPikolou.cz

> **Živý backlog** (od 2026-08-06). Nahrazuje `TO-DO_Fable.md` + `SECURITY_AND_UX_AUDIT_20260727.md`.  
> **Archiv originálů:** [`archive/audits/`](./archive/audits/)  
> **Operativní smoke / produktové TO-DO:** [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md)  
> **Zdroje:** kód + migrace, PRD, Metodika, SEO Bible; audity Fable (2026-07-06) a Security/UX (2026-07-27).

---

## 0. Must-have před ostrým provozem

Blokátory spuštění (ne „nice to have“). Stav k 2026-08-06.

### Hotovo — bezpečnostní základ

| Oblast | Stav |
|--------|------|
| PII kontakty (C1/C2, reveal rate limit) | ✅ migrace 025–026 |
| Publish gate + approval token + fingerprint textu/fotek | ✅ 027, 062–066; smoke create/edit |
| AI rate limit jen service_role + atomické RPC | ✅ 062 |
| Next.js / prod deps bez High/Critical | ✅ 15.5.22; `npm audit --omit=dev` = 0 |
| Staging fotek + Sharp renditions (SEC-H02 hardening) | ✅ 067–068; I5 produkční smoke OK |
| Auth open redirect | ✅ H3 |
| Keyword scan + fail-closed AI / rate limit | ✅ |

### Otevřené blokátory

| # | Úkol | Proč | Odkaz |
|---|------|------|-------|
| **GO-1** | Produkční smoke **hard stop** H1–H3, H5 | Účet se po abuse musí zavřít; zatím jen H4/H6/H7 na localhost | [`TO-DO-dalsi-den`](./TO-DO-dalsi-den.md) §1 |
| **GO-2** | RLS smoke **B1–B5** na produkční DB | Triggery 047 v kódu ≠ ověřené na live | níže §3 + TO-DO §3 |
| **GO-3** | Negativní smoke fotek **I6** | Cizí path / výměna / pořadí nesmí projít publish gate | TO-DO §E |
| **GO-4** | Ops checklist: Vercel `main` zelený, Edge `CRON_SECRET` + `SITE_URL=https://zapikolou.cz` | Bez toho crony a maily padají | TO-DO §0 |
| **GO-5** | **P33** — revize GDPR textů právníkem (Resend DPA už ✅) | Právní riziko při ostrém provozu s PII | §4 P33 |
| **GO-6** | Inquiry abuse hardening: `Content-Type` + `Origin` (CAPTCHA až při spam tlaku) | Cross-site spam poptávek (SEC-M02) | §2 SEC-M02 |
| **GO-7** | FAQ + DSA/VOP odkazy smoke (**F1**) | Povinné info stránky musí žít na produkci | TO-DO §4 |

### Není blokátor soft launch

- Category SEO kód (CSEO4), Půjčovna, monetizace v0.6, P2B e-maily (až před 1. IČO), CAPTCHA, AV příloh, God Mode timeline, LCP preload, UX polish (dva AI modaly, loading.tsx).

---

## 1. Executive summary

| Oblast | Otevřené High | Otevřené Medium | Low / backlog |
|--------|:-------------:|:---------------:|:-------------:|
| Security (2026-07-27+) | 0 (SEC-H01–H04 ✅) | ~4 (M01, M02, M03, M04, M06) | L01–L07 + rezidua |
| Proces (Fable) | — | P5, P13, P16, P18, P28 ops, P29, P30 UI, P32, P33 právník | P25, P34, P36, P40 |
| UX | — | loading/error boundaries, silent errors, 2 AI modaly | a11y drobnosti |

**Nasazení 062–066 + Edge:** 2026-07-28 ✅ · **I5 Sharp/renditions:** 2026-08-05/06 ✅ · **I6 / B1–B5 / hard stop produkce:** ⏳

---

## 2. Security — otevřené nálezy

### Vysoké (SEC-H*) — uzavřeno

| ID | Nález | Stav |
|----|-------|------|
| SEC-H01 | Token ≠ text | ✅ 063–066 |
| SEC-H02 | Token ≠ fotky | ✅ 063; staging 067–068 |
| SEC-H03 | Bypass `rate_limits` | ✅ 062 |
| SEC-H04 | Vulnerable deps | ✅ Next 15.5.22 |

### Střední — otevřené

| ID | Nález | Návrh | Priorita launch |
|----|-------|-------|-----------------|
| **SEC-M01** | Edge `req.json()` bez limitu body/schema | Content-Length, schema před mapováním, stejné limity jako SA | P1 po GO |
| **SEC-M02** | Inquiry bez Content-Type / Origin | JSON + Origin allowlist; Turnstile později | **GO-6** |
| **SEC-M03** | Chybí security HTTP headers | CSP report-only → enforce; frame-ancestors, Referrer-Policy… | P1 |
| **SEC-M04** | Log 800 znaků raw AI odpovědi | Jen kód/model/délka/hash | P1 |
| ~~SEC-M05~~ | Re-moderace polí | ✅ 063 | — |
| **SEC-M06** | Restore → rovnou `active` | Draft/hidden + povinný důvod / review | P1 |

### Nízké — otevřené

| ID | Nález | Poznámka |
|----|-------|----------|
| SEC-L01 / L2 | Gemini klíč v query | Header auth |
| SEC-L02 | View-hash fallback = service role | Vyžadovat `LISTING_VIEW_HASH_SECRET` |
| SEC-L03 | JSON-LD bez společného serializeru | Homepage/FAQ |
| SEC-L04 | Orphan Storage | Reconciliation job |
| SEC-L05 / M9-R | Přílohy bez AV | Po soft launch / nebo zakázat PDF |
| SEC-L06 | Staré SQL 001/002 | Neprohánět jako „fresh deploy“ |
| SEC-L07 | Anonymní `/nahlasit` bez limitu | IP/e-mail + CAPTCHA |
| H2-R | CAPTCHA u inquiry | Až spam |
| L1 | Min. heslo 8 | Záměr; strength meter ✅ |

Detail důkazů: [`archive/audits/SECURITY_AND_UX_AUDIT_20260727.md`](./archive/audits/SECURITY_AND_UX_AUDIT_20260727.md) §3.

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
| B1 | `UPDATE profiles SET company_ico_verified = true …` | `42501` | ☐ |
| B2 | `UPDATE posts SET payment_status = 'paid' …` | zamítnuto | ☐ |
| B3 | `UPDATE posts SET renew_count = renew_count + 10 …` | zamítnuto | ☐ |
| B4 | `UPDATE posts SET expires_at = …` (bez duration) | zamítnuto | ☐ |
| B5 | Prodloužení přes UI | `renew_count` +1 | ☐ |

### C) Moderace (volitelné) · D) Feed

| # | Scénář | ✓ |
|---|--------|---|
| C1–C3 | JPEG OK; obří/ne-obrázek 400; rate_limits down → 503 | ☐ |
| D1 | `/llms.txt` s `[`/`]` v titulku | ☐ |

### Hard stop · fotky

Viz [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) §1 (H1–H7) a §E (I5 ✅, I6 ☐).

---

## 4. Proces — otevřené (Fable ID)

| ID | Téma | Stav / návrh | Launch |
|----|------|--------------|--------|
| **P5** | Prolong hard-code +30 dní | RPC / `listing_duration_days` | Po |
| **P13** | Dva AI modaly (Approved→Preview) | Sloučit | Po |
| **P16** | Inquiry CAPTCHA + dashboard | Turnstile; dashboard majitele částečně (počty ✅) | CAPTCHA po |
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

- [ ] GO-1 Hard stop produkční smoke
- [ ] GO-2 RLS B1–B5
- [ ] GO-3 I6 negativní fotky
- [ ] GO-4 Ops secrets + zelený build
- [ ] GO-5 P33 právník
- [ ] GO-6 Inquiry Content-Type + Origin
- [ ] GO-7 FAQ smoke na produkci

### P1 — bezpečnost / abuse (hned po GO nebo paralelně)

- [ ] SEC-M01 Edge body/schema limity
- [ ] SEC-M03 Security headers (CSP report-only)
- [ ] SEC-M04 Nelogovat raw AI text
- [ ] SEC-M06 Restore → draft/hidden + důvod
- [ ] SEC-L07 Report rate limit
- [ ] P29 Silent management errors

### P2 — produkt / UX / SEO

- [ ] P13 sloučit AI modaly · loading/error boundaries · branding
- [ ] Sitemap `/dsa` · robots `/mod` `/profil` · OG · BreadcrumbList
- [ ] P36 GTM cookie CTA · P34 LCP
- [ ] CSEO4 Category SEO Vlna 1
- [ ] P30 God Mode timeline

### P3 — později / triggery

- [ ] P32 P2B před IČO · monetizace v0.6 · AV příloh · CAPTCHA · P40 inventář AI · dependency CI gate

---

## 7. Akceptační kritéria bezpečnostní iterace

1. `authenticated` JWT nemění `rate_limits` (ověřit B-style SQL).
2. Změna publish-sensitive pole / fotky po AI → token neplatný (I6 + fingerprint smoke).
3. Neplatný AI JSON / chybějící token ≠ publikace.
4. `npm audit --omit=dev` bez Critical/High; `lint` + `build` OK.
5. Hard stop 3×/24h → `/ucet-pozastaven` + mail.

---

## Archiv a changelog

| Soubor | Obsah |
|--------|-------|
| [`archive/audits/TO-DO_Fable_20260706.md`](./archive/audits/TO-DO_Fable_20260706.md) | Původní Fable audit + detail hotových C/H/M/P/U |
| [`archive/audits/SECURITY_AND_UX_AUDIT_20260727.md`](./archive/audits/SECURITY_AND_UX_AUDIT_20260727.md) | Audit 2026-07-27 (SEC-H/M/L, AI prompt review, UX) |

| Datum | Změna |
|-------|-------|
| 2026-08-06 | Sjednocení Fable + Security auditu do tohoto souboru; originály archivovány |
| 2026-07-27…28 | SEC-H01–H04 opravy + nasazení 062–066 |
| 2026-07-06…26 | Fable fáze 1–7 (PII, publish gate, anti-spam, GDPR texty, UX) |
