# Branding a domény — zaPikolou.cz

> **Primární doména:** `zapikolou.cz`  
> **Redirect:** `predpikolou.cz` → `https://zapikolou.cz`  
> **Na webu:** `zaPikolou.cz` (CamelCase wordmark)  
> **PRD:** [`PRD_v3.md`](./PRD_v3.md) §1.8  
> **Stav DNS/mailu ověřen:** 2026-08-20

---

## Pojmenování (rychlá reference)

| Kontext | Hodnota |
|---------|---------|
| DNS, Vercel, e-maily | `zapikolou.cz` (lowercase) |
| Logo / header | `zaPikolou.cz` |
| Footer, krátký copy | `zaPikolou` |
| Env proměnná | `NEXT_PUBLIC_SITE_URL=https://zapikolou.cz` (bez `/` na konci) |
| Veřejný kontakt | `info@zapikolou.cz` (`SITE_OPERATOR_CONTACT_EMAIL`) |

Konfigurace v kódu: [`src/config/site.ts`](../src/config/site.ts) — logo v `AppLogo.tsx`.

---

## Kde co běží (zdroj pravdy)

Tři různé služby — **nesměšovat**. E-mail od Subregu o expiraci **webhostingu** web neshodí.

| Vrstva | Poskytovatel | Účel |
|--------|----------------|------|
| **Registrace domén** | Subreg.CZ | vlastnictví `zapikolou.cz` a `predpikolou.cz` — **toto se musí platit** |
| **DNS + příchozí mail** `zapikolou.cz` | Cloudflare | nameservery, A/CNAME, Email Routing na `info@` |
| **Web** | Vercel | Next.js produkce (`A 76.76.21.21`, `www` → `cname.vercel-dns.com`) |
| **Odchozí transakční maily** | Resend (Amazon SES `eu-west-1`) | notifikace, poptávky, ověření účtu — `send.zapikolou.cz` |
| **Captcha** | Cloudflare Turnstile | guest / rate-limit — **není** e-mail |
| **Webhosting Subreg 18VW68** | — | **nepoužívá se**; expiroval 2026-08-13. Neprodlužovat kvůli webu ani `info@`. |

**Nameservery**

| Doména | NS |
|--------|----|
| `zapikolou.cz` | `meilani.ns.cloudflare.com`, `sam.ns.cloudflare.com` |
| `predpikolou.cz` | stále Gransy (`ns`–`ns5.gransy.com`); A záznam míří na Vercel (`76.76.21.21`) |

DNS záznamy `zapikolou.cz` se **upravují v Cloudflare**, ne v Subregu. Subreg drží jen registraci (a nameservery `predpikolou.cz`, dokud je nepřesuneme).

---

## E-mail — dva kanály

| Směr | Adresa | Kam |
|------|--------|-----|
| **Příjem** | `info@zapikolou.cz` | Cloudflare **Email Routing** → MX `route1/2/3.mx.cloudflare.net`. Cloudflare schránku nehostuje; mail **přeposílá** na cílovou schránku nastavenou v Cloudflare dashboardu. |
| **Odesílání webu** | Resend (`noreply` / FROM z env) | DKIM `resend._domainkey`, SPF na `send.zapikolou.cz` (`include:amazonses.com`) |

SPF apexu: `v=spf1 include:_spf.mx.cloudflare.net ~all`  
DMARC: `v=DMARC1; p=none;`

Webmail `mail.gransy.com` u Subregu **není** aktuální příjem `info@`.

---

## DNS `zapikolou.cz` (Cloudflare, 2026-08-20)

| Název | Typ | Hodnota |
|-------|-----|---------|
| `@` | A | `76.76.21.21` (Vercel) |
| `www` | CNAME | `cname.vercel-dns.com` |
| `@` | MX | `route1/2/3.mx.cloudflare.net` |
| `@` | TXT | `v=spf1 include:_spf.mx.cloudflare.net ~all` |
| `@` | TXT | Google Search Console verification |
| `@` | TXT | `facebook-domain-verification=m2oqxp2xbsthv8soz29qzz3x0ohsib` (Meta, ověřeno 2026-08-26) |
| `_dmarc` | TXT | `v=DMARC1; p=none;` |
| `resend._domainkey` | TXT | Resend DKIM |
| `send` | MX | `feedback-smtp.eu-west-1.amazonses.com` |
| `send` | TXT | `v=spf1 include:amazonses.com ~all` |

Změny jen v [Cloudflare DNS](https://dash.cloudflare.com) u zóny `zapikolou.cz`. Po změně MX/SPF ověřit doručení testovacím mailem na `info@`.

---

## Co platit (a co ne)

1. **Subreg — registrace obou domén** — bez toho spadne jméno (i když web běží na Vercelu).
2. **Cloudflare** — DNS + Email Routing + Turnstile na Free plánu; nic dalšího kvůli `info@`.
3. **Vercel / Supabase / Resend** — provoz webu (mimo Subreg).
4. **Subreg webhosting** — nechat propadnout. Data na tom hostingu mažou po grace periodě (~30 dní od expirace). Na Vercelu ani v Cloudflare to nemá vliv.

E-mail Subregu typu „domény na tomto webhostingu přestaly fungovat“ = vypnutý **jejich** hosting, ne Vercel a ne Cloudflare mail.

---

## Nasazení — hotovo

Launch checklist z července 2026 je splněný. Níže je stav, ne úkolovník.

### DNS a web

- [x] `zapikolou.cz` — A + `www` CNAME na Vercel (nyní v Cloudflare)
- [x] `predpikolou.cz` → 301 na `https://zapikolou.cz` (A na Vercel; NS zatím Gransy)
- [x] Vercel Production: `zapikolou.cz`; `www` redirect na apex
- [x] `NEXT_PUBLIC_SITE_URL=https://zapikolou.cz`

### Auth (Supabase)

- [x] Site URL `https://zapikolou.cz`
- [x] Redirect URLs: `https://zapikolou.cz/**`, `http://localhost:3000/**`

### E-mail a SEO

- [x] Resend ověřená doména `zapikolou.cz` (EU `eu-west-1`)
- [x] Příjem `info@` přes Cloudflare Email Routing
- [x] Google Search Console — property `zapikolou.cz`, DNS TXT
- [x] Sitemap odeslaná; GTM `GTM-WGLNJRNK` + Consent Mode v2

Ověření:

```bash
nslookup -type=NS zapikolou.cz
nslookup -type=MX zapikolou.cz
curl -I https://zapikolou.cz
curl -I https://predpikolou.cz
```

---

## Pro vývoj — co zbývá v kódu

<details>
<summary>Rozbalit technický přehled</summary>

### Hotovo

- `src/config/site.ts`, logo, footer
- PRD §1.8, `docs/ui-prvky.md`

### Zbývá v kódu

- Metadata stránek (`HobbyUserMarket` → `SITE_DISPLAY_NAME`) kde ještě zbývá
- E-mailové šablony
- Default OG obrázek

Interní prefixy `hum_*` v localStorage **neměnit** — uživatel je nevidí.

</details>

---

## Otevřené body (neblokují provoz)

- [x] Identita provozovatele na `/kontakt` (IČO, sídlo, zápis) — 2026-09-03; VOP FO odkazuje, nekopíruje IČO
- [ ] IČO ve VOP OSVČ / ceníku — až `NEXT_PUBLIC_MONETIZATION_ENABLED` (draft 2.1 v `navrh-claude/`, mimo git)
- [ ] Revize právních textů u právníka
- [x] Favicon (zelené zP)
- [ ] OG obrázek pro sdílení na sociálních sítích
- [ ] Přejmenování GitHub repozitáře (volitelné)
- [ ] Volitelně přesunout NS `predpikolou.cz` do Cloudflare (dnes Gransy; web už míří na Vercel)

---

## Užitečné odkazy

- [Cloudflare dashboard](https://dash.cloudflare.com) — DNS, Email Routing, Turnstile
- [Subreg](https://subreg.cz) — jen prodloužení **registrace** domén
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
