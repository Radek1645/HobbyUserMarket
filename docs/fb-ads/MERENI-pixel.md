# Měření — Meta Pixel

Pixel ID: **`1774699993535627`** (dataset zapikolou.cz). Conversions API v Events Manageru je zapnutá zvlášť.

## Jak je to nasazené

V Next.js, ne v GTM. Důvod: `Lead` musí jít až po serverovém potvrzení publikace, `PageView` při SPA navigaci, a cookie lišta Pixel smí pustit jen po marketingovém souhlasu. V GTM Pixel **nepřidávejte** — dvojité konverze.

- ID: `DEFAULT_META_PIXEL_ID` v `src/config/meta-pixel.ts`
- Env `NEXT_PUBLIC_META_PIXEL_ID` přepíše default; **prázdný string Pixel vypne** (eventy jdou do `dataLayer` pro případný GTM fallback)
- Loader: `src/components/analytics/MetaPixelLoader.tsx` (consent + SPA + ViewContent + InitiateCheckout)
- `Lead` / registrace: `src/components/analytics/ConversionBeacons.tsx`
- `autoConfig` je záměrně vypnutý: v `ensureMetaPixel` jde `fbq('set', 'autoConfig', false, pixelId)` **před** `init` (Meta docs; `init` je moment, kdy fbevents.js nasazuje DOM listenery). Platí i po `revokeMetaPixel` → novém souhlasu. Jinak Pixel sám posílá kliknutí/submity (`SubscribedButtonClick`) včetně textu UI a placeholderů — i ze stránek mimo marketing. Eventy jdou jen přes `trackEvent()`. Redundantní pojistka v Events Manageru: **Automatické události** / **Automatické párování webů** / **Sledujte události automaticky bez kódu** — ověřeno Vyp 2026-09-01. **Localhost plošně ověřeno (2026-09-01):** klik na kategorii/filtr, hamburger menu, footer link, přihlášení se špatným heslem, otevření formuláře smazání účtu — `SubscribedButtonClick` se neobjevil ani jednou. Pořadí `set`→`init` **na produkci** v Test Events / Network **ještě ověřit**.

## Události

| Událost | Kdy | Poznámka |
|---|---|---|
| `PageView` | každé zobrazení stránky včetně SPA | `usePathname()`, bez duplicity na stejné cestě |
| `ViewContent` | `/prodejte-snadno` | `{ content_name: 'landing_fb' }` + UTM; jednou za tab |
| `InitiateCheckout` | otevření `/inzerat/novy` | jednou za tab |
| **`Lead`** | inzerát **úspěšně publikován** (`?published=<id>`) | `{ content_category }` + UTM; jednou na inzerát |
| `CompleteRegistration` | nový účet (`?registered=1`) | funnel login (standardní event místo `SignupComplete`) |

`Lead` se pálí až po redirectu z `createListing`, ne na klik Publikovat.

GA4 konverze stejného momentu: dataLayer event **`generate_lead`** (po analytickém souhlasu). GTM → GA4 Event tag; v GA4 označit jako conversion. Pixel `Lead` na to nemá vliv — obojí může jít naráz.

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
5. **Žádný** `SubscribedButtonClick` (ani jiné automatic-config eventy) — kliknutí na tlačítka a submity formulářů Pixel nesmí sbírat sám.

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
- [x] Kompletní funnel od nuly na **localhostu** (2026-09-01): `ViewContent`/`InitiateCheckout`/`Lead` každý přesně 1×, GA4 `generate_lead` 1× se stejnými UTM, žádný `SubscribedButtonClick`
- [ ] Ověřeno Pixel Helperem i Test Events na **produkci** po deployi

## Otevřené

**Dvojitý `ViewContent` / `InitiateCheckout` (2026-09-01, Test Events).** Funnel: landing → e-mail registrace → onboarding → `/inzerat/novy?resume=1` → Lead. `ViewContent` 2× (11 s od sebe), `InitiateCheckout` 2× (druhý po resume). Docs i kuchařka tvrdí „jednou za tab“ — nepotvrzeno, jestli stejná karta (bug) nebo dvě karty (false positive).

Kód (`MetaPixelLoader.tsx` + klíče v `src/config/meta-pixel.ts`) — ověřeno čtením, ne fix:
- Guard je `sessionStorage` `zapikolou:view_content_sent` / `zapikolou:initiate_checkout_sent`. PENDING se při každém vstupu na `/prodejte-snadno` resp. `/inzerat/novy` zapíše znovu; flush skončí, pokud SENT=`1`. Stejná karta po resume by druhý event **neměla** poslat.
- `revokeMetaPixel` ani auth redirect SENT nemaže. `sessionStorage` přežije reload i odchod na jiný origin a návrat **ve stejné kartě**.
- E-mail confirm z Gmailu/jiné karty = nová karta = prázdný `sessionStorage` = druhý `InitiateCheckout` je při „jednou za tab“ očekávaný.
- `ViewContent` 11 s od sebe: není StrictMode (ten je v ms) ani resume (resume není landing). Nejspíš druhá karta / druhý vstup na landing v novém kontextu.

Rozhodnutí: před odchodem na e-mail a po resume
`sessionStorage.getItem('zapikolou:view_content_sent')` a
`sessionStorage.getItem('zapikolou:initiate_checkout_sent')`.
SENT po resume chybí → nový kontext. SENT=`1` a event přesto přišel → bug v loaderu.

**Produkční Test Events (2026-09-01, dataset):** Pixel/FB strana funnelu + autoConfig. GA4 Realtime tam **nebyla**. Localhost mezitím `generate_lead` 1× ověřil (viz update níž). DoD produkce (Pixel Helper + Test Events po deployi `set`→`init`) zůstává odškrtnutá.

**Update 2026-09-01 (localhost, čerstvá `sessionStorage`, jedna karta, funnel od nuly):** `ViewContent` na `/prodejte-snadno?utm_...` 1×, `InitiateCheckout` na `/inzerat/novy` 1×, `Lead` po publikaci 1× (UTM kompletní), GA4 `generate_lead` 1× se stejnými UTM — žádná duplicita. **Nepokrývá to** ale přímo scénář výš (e-mail verify v nové kartě po resume) — ten měl vlastní `sessionStorage`, a tenhle test ho nereprodukoval. Dvojitý `ViewContent`/`InitiateCheckout` pro tenhle konkrétní resume-přes-novou-kartu případ zůstává neuzavřený.
