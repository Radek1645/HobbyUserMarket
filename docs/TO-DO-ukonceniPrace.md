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

- [x] Migrace **053** Success (uživatel)
- [x] Migrace **052** Success (uživatel)
- [ ] Smoke UI odznaky + `/uzivatel` na produkci po deployi *(uživatel)*

---

## 2. Nasazení infrastruktury

- [x] Migrace **052**, **053** — uživatel potvrdil
- [x] Edge Functions — uživatel: aktualizace spuštěna
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## 3. Dokumentace

- [x] **Metodika** — §8.1 (zadavatel, odznaky, view_count)
- [x] **PRD** — v3.39
- [x] **pravni/README** — VOP §7 badge ✅
- [x] **ui-prvky** — odznaky zadavatele
- [x] **Stav_projektu/2026-07-21.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-21.md`
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
| Změna ověřená v UI / API | ⏳ produkce |
| Migrace + EF nasazené | ✅ dle uživatele |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit na `main` | ⏳ |
| Push na `origin` | ⏳ |
