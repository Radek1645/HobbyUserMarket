# TO-DO — další seance (smoke produkce)

> **Odloženo:** 2026-07-26 → spustit v **příští seanci**  
> **Po:** hard stop (**055–057**), FAQ/audit/poznámky (**058–061**), Edge `moderate-listing`  
> **PRD:** v3.45 · snapshot [`Stav_projektu/2026-07-26.md`](../Stav_projektu/2026-07-26.md)  
> **Poznámka:** H4/H6/H7 už ověřeno na localhost; na produkci znovu jen pokud chceš jistotu.

Zaškrtávej `[x]` přímo v tomto souboru.

---

## 0. Před testy

- [ ] Vercel build `main` zelený
- [ ] Otevřít produkci `https://zapikolou.cz` (ne localhost)
- [ ] Edge secrets: `CRON_SECRET` (= Vercel) + `SITE_URL=https://zapikolou.cz`

---

## 1. Hard stop / blacklist (priorita)

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

## 2. Zbytek (053 / 052) — pokud zbude čas

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| T1 | Badge **Podnikatel** | Štítek u firmy | ☐ |
| T2 | Milník **5+** | `Aktivní inzerent · 5+` | ☐ |
| T4 | `/uzivatel/[nickname]` | Grid aktivních | ☐ |
| V1 | View count | Anonymní view navýší (dedup 24 h) | ☐ |
| V2 | Majitel nepočítá | Vlastní detail `view_count` nestoupá | ☐ |

---

## 3. Smoke 047 — zbývající

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| A6 | Poptávka Práce: PDF/JPG OK; falešné `.pdf` | Platná OK; falešná → chyba | ☐ |
| B1–B4 | SQL RLS (ico / payment / renew / expires) | `42501` | ☐ |
| B5 | UI prodloužení | `renew_count` +1 | ☐ |
| D1 | `/llms.txt` s `[` / `]` v titulku | Markdown OK | ☐ |

Detail: [`TO-DO_Fable.md`](./TO-DO_Fable.md) §0 Smoke A–D.

---

## 4. FAQ / audit / poznámky (2026-07-26)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| F1 | `/faq` | Accordion, ≥5 otázek; odkazy VOP/Podmínky fungují; v patičce u **Co je zaPikolou?** | ☐ |
| F2 | Poznámky God Mode | Staff na detailu → **Poznámky** → uložit / edit do 24 h | ☐ |
| F3 | Audit po pauza | Po změně stavu řádek v `audit_events` (`event_type` + actor) | ☐ |
| F4 | CTA „přes web“ | Nový AI inzerát má CTA …zprávu přes web (ne platformu) | ☐ |

---

## Po dokončení

- [ ] Zaškrtnout hotové řádky i ve snapshotu
- [ ] Selhání zapsat níže (URL / nickname / konzole)

## Poznámky / selhání

_Sem zapiš URL inzerátu / nickname / chybu z konzole._
