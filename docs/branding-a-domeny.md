# Branding a domény — zaPikolou.cz

> **Primární doména:** `zapikolou.cz`  
> **Redirect:** `predpikolou.cz` → `https://zapikolou.cz`  
> **Na webu:** `zaPikolou.cz` (CamelCase wordmark)  
> **PRD:** [`PRD_v3.md`](./PRD_v3.md) §1.8

Tento dokument má dvě části:

1. **Reference** — pojmenování, co zbývá v kódu (pro vývojáře).
2. **Checklist na konci** — konkrétní kroky, které **provedeš ty** v Subregu, Vercelu, Supabase atd.

---

## Pojmenování (rychlá reference)

| Kontext | Hodnota |
|---------|---------|
| DNS, Vercel, e-maily | `zapikolou.cz` (lowercase) |
| Logo / header | `zaPikolou.cz` |
| Footer, krátký copy | `zaPikolou` |
| Env proměnná | `NEXT_PUBLIC_SITE_URL=https://zapikolou.cz` (bez `/` na konci) |

Konfigurace v kódu: [`src/config/site.ts`](../src/config/site.ts) — logo hotové v `AppLogo.tsx`.

---

## Pro vývoj — co je hotové / co zbývá

<details>
<summary>Rozbalit technický přehled (nemusíš řešit, pokud neprogramuješ)</summary>

### Hotovo

- `src/config/site.ts`, logo, footer
- PRD v3.25, `docs/ui-prvky.md`

### Zbývá v kódu (vývoj)

- Metadata stránek (`HobbyUserMarket` → `SITE_DISPLAY_NAME`)
- E-mailové šablony
- Právní docs (`docs/pravni/*.md`)
- Favicon + default OG obrázek
- `public/llms.txt`

Interní prefixy `hum_*` v localStorage **neměnit** — uživatel je nevidí.

</details>

---

## Checklist — co musíš udělat ty

Projdi body **shora dolů v tomto pořadí**. Zaškrtni, až je máš hotové.

### Fáze 1 — DNS u Subregu

- [ ] **1.1** Otevři DNS administraci domény **`zapikolou.cz`**
- [ ] **1.2** Smaž výchozí A záznamy od Subregu (pokud tam jsou)
- [ ] **1.3** Přidej záznam:

  | Typ | Hostitel | Hodnota |
  |-----|----------|---------|
  | A | `@` (prázdné) | `76.76.21.21` |
  | CNAME | `www` | `cname.vercel-dns.com.` |

  Tečka na konci u CNAME u Subregu bývá důležitá — nech ji, pokud formulář vyžaduje.

- [ ] **1.4** Doména **`predpikolou.cz`** — **nepřidávej** A/CNAME pro web. V menu **Přesměrování webu** nastav:
  - typ: **301 Trvalé**
  - cíl: **`https://zapikolou.cz`**

  *(Alternativa: redirect ve Vercelu místo Subregu — stačí jedna z variant, ne obě.)*

---

### Fáze 2 — Vercel (domény + env)

- [ ] **2.1** [vercel.com](https://vercel.com) → tvůj projekt → **Settings → Domains**
- [ ] **2.2** **Add** → `zapikolou.cz` → přiřadit k **Production**
- [ ] **2.3** **Add** → `www.zapikolou.cz` → nastavit **Redirect** na `zapikolou.cz` (apex bez www)
- [ ] **2.4** Počkej, až u domén svítí **Valid Configuration** (zelená). Červená = DNS ještě nepropadlo (5–30 min, někdy déle)
- [ ] **2.5** **Settings → Environment Variables** → u scope **Production** nastav nebo uprav:

  ```
  NEXT_PUBLIC_SITE_URL=https://zapikolou.cz
  ```

  Bez lomítka na konci. Ostatní proměnné (Supabase, Resend, Mapy…) nech beze změny.

- [ ] **2.6** **Deployments** → u posledního deploye **Redeploy** (aby se načetla nová env)

---

### Fáze 3 — Supabase (auth — bez toho nepůjde přihlášení)

- [ ] **3.1** [Supabase Dashboard](https://supabase.com/dashboard) → tvůj projekt → **Authentication → URL Configuration**
- [ ] **3.2** **Site URL** nastav na:

  ```
  https://zapikolou.cz
  ```

- [ ] **3.3** Do **Redirect URLs** přidej (staré `*.vercel.app` můžeš nechat dočasně pro preview):

  ```
  https://zapikolou.cz/**
  http://localhost:3000/**
  ```

  Wildcard `/**` povolí návrat na `/auth/callback?next=…` po Google loginu, ověření e-mailu i resetu hesla.

- [ ] **3.4** **Save**

> **Google OAuth:** V Google Cloud Console **nemusíš** měnit redirect — ten zůstává na `https://<projekt>.supabase.co/auth/v1/callback`. Mění se jen Site URL a Redirect URLs v Supabase.

---

### Fáze 4 — Ověření, že web běží

- [ ] **4.1** Otevři **`https://zapikolou.cz`** — homepage se načte
- [ ] **4.2** Otevři **`https://predpikolou.cz`** — přesměruje na `zapikolou.cz`
- [ ] **4.3** Zkontroluj **`https://zapikolou.cz/robots.txt`** a **`https://zapikolou.cz/sitemap.xml`**

Volitelně v terminálu:

```bash
curl -I https://zapikolou.cz
curl -I https://predpikolou.cz
```

---

### Fáze 5 — Ověření přihlášení (kritické)

- [ ] **5.1** **Registrace e-mailem** — dorazí ověřovací mail, odkaz vede na `zapikolou.cz` (ne `*.vercel.app`)
- [ ] **5.2** **Přihlášení Google** — po OAuth skončíš na `zapikolou.cz`, ne na chybě
- [ ] **5.3** **Zapomenuté heslo** — odkaz v e-mailu vede na `zapikolou.cz/auth/…`

Když auth spadne, nejčastěji chybí bod **2.5** (env) nebo **3.3** (Redirect URLs).

---

### Fáze 6 — E-mail z vlastní domény (může počkat pár dní)

- [ ] **6.1** U Resend / SMTP nastavit odesílatele např. `noreply@zapikolou.cz`
- [ ] **6.2** V DNS `zapikolou.cz` přidat záznamy **SPF**, **DKIM**, **DMARC** (podle návodu poskytovatele e-mailu)
- [ ] **6.3** Ve Vercelu aktualizovat env pro FROM adresu, pokud ji projekt používá

Do té doby mohou maily chodit z provizorní domény poskytovatele — web funguje i bez toho.

---

### Fáze 7 — SEO po launchu (až běží produkce)

- [x] **7.1** [Google Search Console](https://search.google.com/search-console) — property **`zapikolou.cz`**, ověření **DNS TXT**
- [x] **7.2** Odeslat sitemap: `https://zapikolou.cz/sitemap.xml`
- [x] **7.3** GTM container **`GTM-WGLNJRNK`** + Consent Mode v2 + vlastní cookie lišta (GA4 tag v GTM containeru)

---

## Rychlá tabulka — kam co patří

| Kde | Co nastavit | Hodnota |
|-----|-------------|---------|
| Subreg `zapikolou.cz` | A + CNAME | viz fáze 1 |
| Subreg `predpikolou.cz` | Web forward 301 | `https://zapikolou.cz` |
| Vercel Domains | Production doména | `zapikolou.cz` |
| Vercel Domains | www redirect | → apex |
| Vercel Env (Production) | `NEXT_PUBLIC_SITE_URL` | `https://zapikolou.cz` |
| Supabase | Site URL | `https://zapikolou.cz` |
| Supabase | Redirect URLs | `https://zapikolou.cz/**` + localhost |

---

## Otevřené body (neblokují launch)

- [ ] Právní název provozovatele (IČO, sídlo) v patičce a VOP
- [ ] Revize právních textů u právníka (název zaPikolou)
- [ ] Favicon a OG obrázek pro sdílení na sociálních sítích
- [ ] Přejmenování GitHub repozitáře (volitelné)

---

## Užitečné odkazy po nasazení

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
