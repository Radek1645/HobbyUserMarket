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

- [x] RPC anonymizace IP (výsledek `3`)
- [x] Migrace 050 Success
- [x] HP vykání (Přihlaste se / vašeho okolí)
- [ ] `/gdpr` na produkci po deployi *(uživatel)*

---

## 2. Nasazení infrastruktury

- [x] Migrace **050** — uživatel potvrdil
- [x] Vercel region Dublin (`dub1`)
- [x] Cron v `vercel.json` (deploy s pushem)
- [x] Edge Functions — uživatel: infra ok

---

## 3. Dokumentace

- [x] **Metodika** — §2.1, §2.7–2.8, §9.1.3
- [x] **PRD** — v3.32
- [x] **TO-DO_Fable** — P37–P39
- [x] **Stav_projektu/2026-07-19.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-19.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [ ] `git status` — bez `.env`
- [ ] Commit
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
| Změna ověřená v UI / API | ✅ RPC |
| Migrace + EF nasazené | ✅ dle uživatele |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit na `main` | ⏳ |
| Push na `origin` | ⏳ |

---

## Rychlé odkazy

- [`docs/PRD_v3.md`](./PRD_v3.md)
- [`docs/Metodika.md`](./Metodika.md)
- Skill: `.cursor/skills/ukonceni-prace/SKILL.md`
