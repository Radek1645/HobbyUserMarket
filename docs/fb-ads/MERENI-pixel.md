# Měření — Meta Pixel

Pixel ID: **`1774699993535627`** (dataset zapikolou.cz). Conversions API v Events Manageru je zapnutá zvlášť.

## Jak je to nasazené

V Next.js, ne v GTM. Důvod: `Lead` musí jít až po serverovém potvrzení publikace, `PageView` při SPA navigaci, a cookie lišta Pixel smí pustit jen po marketingovém souhlasu. V GTM Pixel **nepřidávejte** — dvojité konverze.

- ID: `DEFAULT_META_PIXEL_ID` v `src/config/meta-pixel.ts`
- Env `NEXT_PUBLIC_META_PIXEL_ID` přepíše default; **prázdný string Pixel vypne** (eventy jdou do `dataLayer` pro případný GTM fallback)
- Loader: `src/components/analytics/MetaPixelLoader.tsx` (consent + SPA + ViewContent + InitiateCheckout)
- `Lead` / registrace: `src/components/analytics/ConversionBeacons.tsx`

## Události

| Událost | Kdy | Poznámka |
|---|---|---|
| `PageView` | každé zobrazení stránky včetně SPA | `usePathname()`, bez duplicity na stejné cestě |
| `ViewContent` | `/prodejte-snadno` | `{ content_name: 'landing_fb' }` + UTM; jednou za tab |
| `InitiateCheckout` | otevření `/inzerat/novy` | jednou za tab |
| **`Lead`** | inzerát **úspěšně publikován** (`?published=<id>`) | `{ content_category }` + UTM; jednou na inzerát |
| `CompleteRegistration` | nový účet (`?registered=1`) | funnel login (standardní event místo `SignupComplete`) |

`Lead` se pálí až po redirectu z `createListing`, ne na klik Publikovat.

## UTM

Při prvním vstupu s `utm_*` / `fbclid` / `gclid` se uloží do `localStorage` (30 dní) a přiloží k `Lead`. CTA z landing page je táhnou v URL; guest login je připojí do `next`.

Formát odkazu v reklamě:
```
https://zapikolou.cz/prodejte-snadno?utm_source=facebook&utm_medium=cpc&utm_campaign=brno-rozjezd&utm_content=sada-a
```

## Consent / GDPR

Pixel se nenačte, dokud uživatel nedá souhlas s marketingovými cookies. Po odvolání se `fbq` unloaduje.

Pixel Helper na stránce **bez „Přijmout vše“ správně ukáže „No Pixels found“** — to není chyba nasazení. Lišta se po první volbě schová; znovu: patička → **Nastavení cookies** → **Přijmout vše**, pak obnovit stránku.

## Ověření po deployi

Příkazy do konzole (souhlas, Pixel, GA4, UTM): [MERENI-console.md](./MERENI-console.md).

1. Chrome **Meta Pixel Helper** — pixel `1774699993535627` a `PageView` (až po „Přijmout vše“; „Jen analytika“ / „Pouze nezbytné“ Pixel nespustí).
2. Events Manager → aktivita do několika minut.
3. **Test Events** — landing → `/inzerat/novy` → přihlášení → publikace. Pořadí: PageView, ViewContent, InitiateCheckout, Lead.
4. `Lead` se nesmí poslat dvakrát (dedupe v localStorage podle `postId`).

## Domain verification

Doména `zapikolou.cz` je v Metě **ověřená** (2026-08-26). TXT v Cloudflare (ne Subreg):

```
facebook-domain-verification=m2oqxp2xbsthv8soz29qzz3x0ohsib
```

Host `@`. Stávající Google/SPF TXT nemazat. Žlutý banner Cloudflare o proxy ignorovat — A záznam na Vercel zůstává DNS only.

## Definition of done

- [x] Pixel `1774699993535627` v appce (GTM ho nenačítá)
- [x] `PageView` i při SPA navigaci
- [x] `InitiateCheckout` na `/inzerat/novy`
- [x] `Lead` až po serverovém potvrzení, neposílá se dvakrát
- [x] UTM přežije Google login (localStorage + `next`)
- [x] Pixel blokovaný do souhlasu s marketingovými cookies
- [x] Doména zapikolou.cz ověřená (TXT DNS, Cloudflare + Meta Verify)
- [x] Funnel ověřen na **localhostu** (Lead 1×, UTM v `cd[]`, Jen analytika → `fbq` undefined)
- [ ] Ověřeno Pixel Helperem i Test Events na **produkci** po deployi
