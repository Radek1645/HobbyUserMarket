# Kuchařka — ukončení práce na projektu

> **Účel:** Obecný checklist před odchodem ze session. Platí po každé větší iteraci (feature, oprava, migrace, změna AI).  
> **Pravidlo:** Kód bez dokumentace není hotový. Poslední krok je vždy **push do gitu**.

Postupuj **shora dolů**. Zaškrtni `[x]` po dokončení. Kroky označené *(pokud)* dělej jen když session se jich týkala.

---

## Přehled pořadí

```
1. Ověřit funkčnost  →  2. Nasadit infrastrukturu  →  3. Aktualizovat dokumentaci
        →  4. Zapsat stav session  →  5. Commit  →  6. Push
```

---

## 1. Ověření funkčnosti

- [x] Happy path: HP copy + průvodce (session)
- [x] P35: `virtual_pageview` v kódu (GTM Preview = uživatel po deployi)
- [x] Terminál bez nových chyb ze session

---

## 2. Nasazení infrastruktury *(frontend session)*

- [x] Migrace — N/A
- [x] Edge Functions — N/A
- [x] Env / Resend / Vercel — N/A
- [ ] GTM — Custom Event `virtual_pageview` → GA4 page_view *(uživatel v GTM adminu)*

---

## 3. Dokumentace

- [x] **Metodika** — §2.4, §2.8, §14.3
- [x] **PRD** — v3.30
- [x] **TO-DO_Fable** — P35 ✅
- [x] **Stav_projektu/2026-07-17.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-17.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [ ] `git status` — bez `.env`, bez artefaktů
- [ ] Commit kódu + docs
- [ ] Push na `origin`

---

## 6. Push do gitu *(poslední krok)*

```powershell
git push -u origin HEAD
```

- [ ] Push proběhl bez chyby
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## Definition of Done — session uzavřena

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ✅ kód |
| Migrace + EF nasazené | N/A |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit na `main` | ☐ |
| Push na `origin` | ☐ |

---

## Rychlé odkazy

- Kanón: [`docs/PRD_v3.md`](./PRD_v3.md)
- Metodika: [`docs/Metodika.md`](./Metodika.md)
- Skill: [`.cursor/skills/ukonceni-prace/SKILL.md`](../.cursor/skills/ukonceni-prace/SKILL.md)
