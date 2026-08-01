# Kuchařka — ukončení práce na projektu

> **Účel:** Obecný checklist před odchodem ze session. Platí po každé větší iteraci (feature, oprava, migrace, změna AI).  
> **Pravidlo:** Kód bez dokumentace není hotový. Poslední krok je obvykle **push do gitu** — výjimka: uživatel výslovně řekne bez push.

Postupuj **shora dolů**. Zaškrtni `[x]` po dokončení. Kroky označené *(pokud)* dělej jen když session se jich týkala.

---

## Přehled pořadí

```
1. Ověřit funkčnost  →  2. Nasadit infrastrukturu  →  3. Aktualizovat dokumentaci
        →  4. Zapsat stav session  →  5. Commit  →  6. Push *(pokud)*
```

---

## 1. Ověření funkčnosti

- [x] Smoke § A / B / C / F + safety tipy (uživatel v session)
- [ ] Vercel produkční build po pushi *(uživatel)*

---

## 2. Nasazení infrastruktury

- [x] Nové SQL migrace — žádné v této session
- [x] Edge Functions — `sync:moderation` + deploy `moderate-listing` (A, B, TZ) v průběhu session
- [ ] Vercel build po pushi *(až po pushi)*
- [x] Env — beze změny

---

## 3. Dokumentace

- [x] **Metodika** — §6.7 dětské; §6.8.1 modal; §8 poptávky + safety; §11.2 God Mode poptávky
- [x] **PRD** — v3.55
- [x] **hydratace-inzeratu.md** — formulář má pravdu / dětské (dříve v session)
- [x] **TO-DO-dalsi-den.md** — A/B/C/F uzavřeno
- [x] **Stav_projektu/2026-08-01.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-08-01.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [x] `git status` — bez `.env`
- [x] Commit — `c630f11`
- [ ] Push

---

## 6. Push do gitu *(poslední krok)*

```powershell
git push -u origin HEAD
```

- [ ] Push — `main` → `origin/main`
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## Definition of Done — session

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ✅ smoke |
| Migrace + EF nasazené | ✅ EF / N/A SQL |
| Dokumentace srovnaná s kódem | ✅ |
| DB schéma v `supabase-prikazy.md` aktuální *(pokud změna DB)* | N/A |
| `Stav_projektu` aktualizován | ✅ |
| Commit na `main` | ✅ `c630f11` |
| Push na `origin` | ⬜ |
