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

- [x] Čistý průchod moderací (pozastavený inzerát → úprava → schválení)
- [x] Hard-hit text → reject + evidence
- [x] Lingerie → Gemini sexual_services (Sightengine jen suggestive)
- [ ] NSFW hard fotka / 3× threshold *(volitelné, fáze 1 neblokuje)*

---

## 2. Nasazení infrastruktury

- [x] Migrace **054** — uživatel potvrdil
- [x] Secrets Sightengine — v `supabase secrets list`
- [x] Edge Functions — sync + deploy `moderate-listing` (i redeploy po hard-hit doplňcích)
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## 3. Dokumentace

- [x] **Metodika** — §6.4 pre-brána, §6.12 SQL SELECTY, `*_no`
- [x] **PRD** — v3.40
- [x] `cursor-prompt-nsfw-gate.md`, `riziko-gemini-api-zakazany-obsah.md`
- [x] `moderace-inzeratu.md`, `supabase-prikazy.md`
- [x] **Stav_projektu/2026-07-21-vecer.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-21-vecer.md`
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
| Změna ověřená v UI / API | ✅ |
| Migrace + EF nasazené | ✅ |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit na `main` | ⏳ |
| Push na `origin` | ⏳ |
