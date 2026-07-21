# TO-DO — další den (smoke produkce)

> **Datum plánu:** 2026-07-21 → testovat **2026-07-21 / ráno**  
> **Po:** deploy `main` (`3aff570` + `1e821de`), migrace **052** + **053**, Edge `moderate-listing`  
> **PRD:** v3.39 · snapshot [`Stav_projektu/2026-07-21.md`](../Stav_projektu/2026-07-21.md)

Zaškrtávej `[x]` přímo v tomto souboru.

---

## 0. Před testy

- [ ] Vercel build `main` zelený
- [ ] Otevřít produkci `https://zapikolou.cz` (ne localhost)

---

## 1. Odznaky zadavatele + `/uzivatel` (053)

| # | Scénář | Jak | Očekávání | ✓ |
|---|--------|-----|-----------|---|
| T1 | Badge **Podnikatel** | Detail inzerátu od účtu s `is_company` | U jména firmy štítek Podnikatel; hover: VOP text | ☐ |
| T2 | Milník **5+** | Účet s ≥5 lifetime publikacemi (ne drafty) | Štítek `Aktivní inzerent · 5+` (nebo vyšší práh) | ☐ |
| T3 | Bez milníku | Účet s 0–4 publikacemi, ne firma | Žádný milník ani Podnikatel | ☐ |
| T4 | Klik na zadavatele | Klik na jméno / firmu v parametrech | `/uzivatel/[nickname]`, grid aktivních inzerátů | ☐ |
| T5 | Paginace | Zadavatel s >9 aktivními | 9 karet; Další → `?stranka=2` | ☐ |
| T6 | Majitel — hint | Přihlášený majitel na vlastním detailu | Stejné odznaky + text o důvěryhodnosti | ☐ |
| T7 | Prázdný profil | Nickname bez aktivních (nebo po archivaci) | Hlavička OK, hláška „žádné veřejné inzeráty“ | ☐ |

---

## 2. Zobrazení inzerátu (052)

| # | Scénář | Jak | Očekávání | ✓ |
|---|--------|-----|-----------|---|
| V1 | View count majitel | Vlastní detail → anonymní okno → znovu jako majitel | Počet zobrazení se zvýší (dedup 24 h) | ☐ |
| V2 | Majitel nepočítá | Majitel opakovaně otevře vlastní detail | `view_count` se **nezvyšuje** | ☐ |

---

## 3. Smoke 047 — zbývající (přenos)

| # | Scénář | Očekávání | ✓ |
|---|--------|-----------|---|
| A6 | Poptávka Práce: platné PDF/JPG; falešná přípona `.pdf` + text | Platná OK; falešná → chyba | ☐ |
| B1 | SQL: `company_ico_verified = true` jako user | Zamítnuto (`42501`) | ☐ |
| B2 | SQL: `payment_status = 'paid'` na vlastním postu | Zamítnuto | ☐ |
| B3 | SQL: `renew_count + 10` | Zamítnuto | ☐ |
| B4 | SQL: `expires_at` + 5 let bez duration | Zamítnuto | ☐ |
| B5 | UI prodloužení v Moje inzeráty | Projde (`renew_count` +1) | ☐ |
| D1 | `/llms.txt` s `[` / `]` v titulku | Markdown nerozbije | ☐ |

Detail tabulek: [`TO-DO_Fable.md`](./TO-DO_Fable.md) §0 Smoke A–D.

---

## Po dokončení

- [ ] Zaškrtnout hotové řádky i v [`Stav_projektu/2026-07-21.md`](../Stav_projektu/2026-07-21.md)
- [ ] A6/B/D propsat do `TO-DO_Fable.md` (datum u ✓)
- [ ] Krátká poznámka do nového `Stav_projektu` při ukončení dne

## Poznámky / selhání

_Sem zapiš URL inzerátu / nickname / chybu z konzole._
