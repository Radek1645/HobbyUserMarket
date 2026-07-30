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

- [x] Edit publikovaného inzerátu s fotkami (limit Edge vs. upload) — OK po deployi
- [ ] Publish gate create + edit (regresní smoke) — mimo rozsah této session
- [ ] Produkční smoke dalších flow *(volitelně)*

---

## 2. Nasazení infrastruktury

- [x] Nové SQL migrace — žádné v této session
- [x] Edge Functions — `npm run sync:moderation` + deploy `moderate-listing` (limity 1 MB / 6 MB)
- [ ] Vercel build po pushi *(až po pushi)*

---

## 3. Dokumentace

- [x] **Metodika** — odkaz na volbu Gemini modelu
- [x] **PRD** — v3.49
- [x] **moderace-inzeratu.md** — limity fotek + Volba Gemini modelu
- [x] **hydratace-inzeratu.md** — přesné bajty / issueApproval tok
- [x] **Stav_projektu/2026-07-30.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-30.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [x] `git status` — bez `.env`
- [x] Commit `cfb842c` (+ `c3a0260` hash ve snapshotu)
- [x] Push

---

## 6. Push do gitu *(poslední krok)*

```powershell
git push -u origin HEAD
```

- [x] Push — `main` → `origin/main`
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## Definition of Done — session

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ✅ |
| Migrace + EF nasazené | ✅ EF (migrace N/A) |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit | ✅ `cfb842c` |
| Push | ✅ |
