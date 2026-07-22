# TO-DO — další den (smoke produkce)

> **Datum plánu:** 2026-07-21 večer → testovat **2026-07-22**  
> **Po:** hard stop blacklist (migrace **055**), Edge `moderate-listing`, e-maily SoR, cron retence  
> **PRD:** v3.43 · snapshot [`Stav_projektu/2026-07-22.md`](../Stav_projektu/2026-07-22.md) · migrace **056–057**

Zaškrtávej `[x]` přímo v tomto souboru.

---

## 0. Před testy

- [ ] Vercel build `main` zelený (po pushi z ukončení práce)
- [ ] Otevřít produkci `https://zapikolou.cz` (ne localhost)
- [ ] Edge secrets: `CRON_SECRET` (= Vercel) + `SITE_URL=https://zapikolou.cz`

---

## 1. Hard stop / blacklist (priorita zítra)

| # | Scénář | Jak | Očekávání | ✓ |
|---|--------|-----|-----------|---|
| H1 | Hard reject hláška | Inzerát s hard-hit textem (1×) | Dialog: porušení podmínek + kontakt `info@…`; účet dál funguje | ☐ |
| H2 | NSFW reject | Fotka nad prahem (nebo 2. hard-hit) | Reject + evidence; stále bez blacklistu | ☐ |
| H3 | Auto hard stop 3×/24h | 3. hard reject na test účtu | Redirect `/ucet-pozastaven`; řádek v `account_blacklist` (`automatic`); aktivní inzeráty `blocked` + `account_blacklist` | ☐ |
| H4 | E-mail hard stop | Po H3 (nebo ruční add) | Mail „Účet … byl pozastaven“ (Resend / schránka) | ☑ localhost |
| H5 | Gate | Přihlášený blacklisted → jiná URL | Redirect na `/ucet-pozastaven`; odhlášení funguje | ☐ |
| H6 | Unban + obnova | `/mod/blacklist` → Odebrat + důvod | Účet OK; inzeráty z hard stopu znovu `active`; mail o obnově | ☑ localhost |
| H7 | Ruční blacklist | Staff přidá cizí e-mail + důvod | `source=manual`; stejný gate + mail | ☑ localhost (hide 5 / restore 5 po 057) |

SQL rychlá kontrola:

```sql
SELECT blacklist_no, email, source, reason, removed_at
FROM public.account_blacklist
ORDER BY created_at DESC
LIMIT 10;
```

---

## 2. Zbytek ze včerejška (053 / 052) — pokud zbude čas

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| T1 | Badge **Podnikatel** | Štítek u firmy | ☐ |
| T2 | Milník **5+** | `Aktivní inzerent · 5+` | ☐ |
| T4 | `/uzivatel/[nickname]` | Grid aktivních | ☐ |
| V1 | View count | Anonymní view navýší (dedup 24 h) | ☐ |
| V2 | Majitel nepočítá | Vlastní detail `view_count` nestoupá | ☐ |

---

## 3. Smoke 047 — zbývající (přenos)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| A6 | Poptávka Práce: PDF/JPG OK; falešné `.pdf` | Platná OK; falešná → chyba | ☐ |
| B1–B4 | SQL RLS (ico / payment / renew / expires) | `42501` | ☐ |
| B5 | UI prodloužení | `renew_count` +1 | ☐ |
| D1 | `/llms.txt` s `[` / `]` v titulku | Markdown OK | ☐ |

Detail: [`TO-DO_Fable.md`](./TO-DO_Fable.md) §0 Smoke A–D.

---

## Po dokončení

- [ ] Zaškrtnout hotové řádky i ve snapshotu
- [ ] Selhání zapsat níže (URL / nickname / konzole)

## Poznámky / selhání

_Sem zapiš URL inzerátu / nickname / chybu z konzole._
