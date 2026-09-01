# FB promo — funnel A → C (integrace)

Operační + technická dokumentace. Feature flag C: `NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED` (v kódu default **vypnuto**, dokud env není `"true"`).

**Aktuální stav** (flag na produkci, smoke A–E, Pixel, mobil): [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L — tady ho nekopírovat.

Kreativní brief (copy, cílovka, Ads Manager): [`navod-na-fb-reklamu.md`](./navod-na-fb-reklamu.md).

**Před první reálnou platbou za Meta Ads:** [`pravni/povinnosti-urady-fb-reklama.md`](./pravni/povinnosti-urady-fb-reklama.md).

**Rozsah flagu:** C **není unikátní FB URL** — zapne guest flow na stejné `/inzerat/novy` (header, FAB, přímý odkaz). Host uvidí AI formulář bez loginu **na celém webu**, nejen z reklamy. FB jen přivede traffic.

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

### Pixel v appce (před Ads)

- [x] Pixel ID `1774699993535627` v kódu (`NEXT_PUBLIC_META_PIXEL_ID` umí přepsat / vypnout)
- [x] Cookie lišta v2 (analytics / marketing) — Pixel až po marketingovém souhlasu
- [x] Přímý Pixel v appce — **v GTM ho nepřidávat**

Zda smí jet kampaň (Lead v Ads Manageru, landing, smoke): [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.

### Zapnutí C — až po migraci + secrets

**Blokující:**

- [x] Spustit migraci `supabase/073_anonymous_rate_limits.sql` (2026-08-09 — uživatel)
  - tabulka `anonymous_rate_limits` + RPC `consume_anonymous_rate_limit_pair`
  - sloupce `posts.publish_request_id`, `posts.publish_started_at`
- [x] Migrace `074` `suggest_from_photos` (2026-08-08)
- [x] `ANONYMOUS_RATE_LIMIT_SALT` na **Vercel i Edge** — guest AI na produkci 2026-09-01 prošel (`suggest-listing-from-photos` + `moderate-listing`; bez saltu je fail-closed)
- [x] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` — widget na registraci 2026-09-01; účet vznikl
- [x] `npm run sync:moderation` + deploy `moderate-listing` + `suggest-listing-from-photos`
- [x] `NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED=true` na produkci — ověřeno 2026-09-01 (RSC `guestMode`; výpis env přes Vercel CLI neprošel)

### Smoke test C

Kanonický tracker (odškrtávání A–E, T, mobil): [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L. Tady checklist nekopírovat.

### Vlna 2 (kupující)

Až inventář v hlavních kategoriích — teprve potom reklama na prohlížení.

---

## Související docs

- Stav smoke / Pixel: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L
- Kreativní brief + Ads Manager: [`navod-na-fb-reklamu.md`](./navod-na-fb-reklamu.md)
- Moderace / guest pojistky: [`moderace-inzeratu.md`](./moderace-inzeratu.md) § Guest draft
- Cookie policy: [`pravni/cookies.md`](./pravni/cookies.md)
