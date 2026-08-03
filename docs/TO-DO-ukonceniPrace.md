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

- [x] Flat kategorie / mřížka / search unaccent (uživatel + nasazení `071`)
- [ ] Vercel produkční build po pushi *(uživatel)*

---

## 2. Nasazení infrastruktury

- [x] SQL `069` / `070` / `071` — nasazeno (uživatel 2026-08-03/04)
- [x] Edge Functions — `sync:moderation` + deploy `moderate-listing`
- [ ] Vercel build po pushi *(až po pushi)*
- [x] Env — beze změny

---

## 3. Dokumentace

- [x] **Metodika** — §2.4 mřížka; §2.5 unaccent
- [x] **PRD** — v3.57
- [x] **supabase-prikazy.md** — `posts` flat typy, `deletion_reason`, `search_vector`
- [x] **TO-DO-dalsi-den.md** — § J uzavřeno
- [x] **Stav_projektu/2026-08-04.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-08-04.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [x] `git status` — bez `.env`
- [x] Commit — `6c5044d` (+ snapshot `6839a61`)
- [x] Push

---

## 6. Push do gitu *(poslední krok)*

```powershell
git push -u origin HEAD
```

- [x] Push — `main` → `origin/main` (`6839a61`)
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## Definition of Done — session

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ✅ |
| Migrace + EF nasazené | ✅ 069–071 + Edge |
| Dokumentace srovnaná s kódem | ✅ |
| DB schéma v `supabase-prikazy.md` aktuální | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit na `main` | ✅ `6c5044d` |
| Push na `origin` | ✅ `6839a61` |
