# FB promo — funnel A → C (integrace)

Operační + technická dokumentace. Feature flag C: `NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED` (default **vypnuto**).

> **Stav (2026-08-09):** migrace `073`/`074` + Edge nasazeny; localhost smoke § L většina happy path OK (včetně Google **Zpět** → resume a F5 bez duplicity). **FB ads zatím ne** — nejdřív produkční smoke na mobilu + Pixel E3/E4. Flag C na produkci jen vědomě (`NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED`).
>
> **Před první reálnou platbou za Meta Ads:** povinnosti vůči úřadům (IČO, IO/DPH, ČSSZ, ZP) — [`pravni/povinnosti-urady-fb-reklama.md`](./pravni/povinnosti-urady-fb-reklama.md).
>
> **Poznámka k rozsahu:** flag C **není unikátní FB URL** — zapne guest flow na stejné `/inzerat/novy` (header, FAB, přímý odkaz). Host uvidí AI formulář bez loginu **na celém webu**, nejen z reklamy. FB jen přivede traffic.

---

## Architektura C (cíl)

```
FB ad → /inzerat/novy (guest)
  → upload fotky + AI preview (issueApproval: false)
  → Publikovat → login/register (draft v localStorage)
  → /inzerat/novy?resume=1
  → claim staging → final AI (issueApproval: true) → publish_approved_post
  → detail?published=<postId> → Pixel Lead
```

Must: bez auth nejde publikovat. Guest nikdy nedostane approval token.

| Stav uživatele | Chování `/inzerat/novy` (flag C = on) |
|----------------|----------------------------------------|
| Odhlášený | Guest mode — fotky + AI, účet až při publikaci |
| Přihlášený (hotový profil) | Klasický create — bez guest UI, publish hned |
| Přihlášený (chybí přezdívka) | Onboarding → pak create / resume |

Klíčové soubory: `src/app/inzerat/novy/page.tsx`, `CreateListingForm.tsx`, `guest-moderation.ts`, Edge `moderate-listing`, migrace `073`.

---

## Opravy v kódu (2026-08-06)

| Oblast | Řešení |
|--------|--------|
| Resume přes OAuth / e-mail / onboarding | `next` zachován; draft v **localStorage** (přežije novou kartu) |
| Idempotentní publish | `publish_request_id` + `publish_started_at` (v migraci `073`) |
| Staging po sync | cleanup až po úspěšném publish |
| Turnstile / rate limit | captcha před inkrementem; guest AI bez auto-retry |
| Pixel | `registered=1` jen u nové registrace; `published=<postId>` + dedupe |
| Build | client `visitor-id` oddělen od `visitor-id-server` (`next/headers`) |
| Middleware `/login` | zachová `next` i pro přihlášené → onboarding |

---

## Deploy checklist

### Funnel A (test 5–10 tis. Kč) — může jet teď

- [x] Pixel ID `1774699993535627` v kódu (`NEXT_PUBLIC_META_PIXEL_ID` umí přepsat / vypnout)
- [x] Cookie lišta v2 (analytics / marketing) — Pixel až po marketingovém souhlasu
- [x] Přímý Pixel v appce — **v GTM ho nepřidávat**
- [ ] Ads: Conversions → **`Lead`** (publikace); funnel login → `CompleteRegistration`
- [ ] Landing: `/prodejte-snadno` (CTA → `/inzerat/novy`, UTM se zachová)

### Zapnutí C — až po migraci + secrets

**Blokující:**

- [x] Spustit migraci `supabase/073_anonymous_rate_limits.sql` (2026-08-09 — uživatel)
  - tabulka `anonymous_rate_limits` + RPC `consume_anonymous_rate_limit_pair`
  - sloupce `posts.publish_request_id`, `posts.publish_started_at`
- [x] Migrace `074` `suggest_from_photos` (2026-08-08)
- [ ] `ANONYMOUS_RATE_LIMIT_SALT` na **Vercel i Edge** (stejná hodnota; fail-closed) — ověřit při prod smoke
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (Vercel **i** Edge) — ověřit při prod smoke
- [x] `npm run sync:moderation` + deploy `moderate-listing` + `suggest-listing-from-photos`
- [ ] `NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED=true` na produkci (+ redeploy) — až po mobilním smoke

### Smoke test C (povinné před ads switch)

**Host (odhlášený) — nový účet**

- [x] Host → fotky (2+) → AI náhled → Publikovat → **Google** OAuth → onboarding (VOP/věk už z registrace, ne znovu) → aktivní inzerát *(localhost; vč. Zpět z Google)*
- [x] Host → AI → **e-mail** registrace + verify odkaz **v nové kartě** (localStorage draft) → resume → publish *(localhost)*
- [x] Soft rate limit → captcha; captcha se neretryuje *(částečně — Turnstile při soft limitu)*
- [x] Refresh během resume nevytvoří duplicitní inzerát *(localhost C3)*
- [ ] Selhání publish obnoví draft / staging paths
- [x] Hlavní fotka = zvolená *(localhost A1)*

**Přihlášený uživatel (flag C = on) — nesmí spadnout do guest flow**

- [ ] Hotový účet → header/FAB `/inzerat/novy` → **klasický** formulář (ne „účet až při publikaci“) *(D1 — explicitně na prod)*
- [x] Přihlášený → vyplnit → AI → **publikovat bez** login/OAuth redirectu *(localhost D2)*
- [ ] Přihlášený s nedokončeným onboardingem → onboarding → návrat na create / `?resume=1`
- [ ] Přihlášený hostující `/inzerat/novy` bez guest cookie/draftu z cizí relace — žádný cizí staging claim

**Regrese UI / auth (související s C)**

- [ ] Registrace: Google nahoře; VOP + věk povinné před Google i e-mailem
- [ ] Zelený box u create-listing login: profil/přihlášení + 20 inzerátů zdarma
- [ ] Logo / „Zpět na úvod“ z onboardingu vede na HP (bez smyčky)

Ad switch po smoke:

- [ ] Landing → `/inzerat/novy` (vědomě site-wide guest)
- [ ] Optimalizace na `Lead` (nová publikace, ne republish)

### Vlna 2 (kupující)

Až inventář v hlavních kategoriích — teprve potom reklama na prohlížení.

---

## Související docs

- Kreativní brief + Ads Manager: [`navod-na-fb-reklamu.md`](./navod-na-fb-reklamu.md)
- Moderace / guest pojistky: [`moderace-inzeratu.md`](./moderace-inzeratu.md) § Guest draft
- Cookie policy: [`pravni/cookies.md`](./pravni/cookies.md)
