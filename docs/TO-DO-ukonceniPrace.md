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

- [x] Ruční blacklist hide (5) + 404 detail + pryč z přehledu
- [x] Unban restore (5) + SoR maily (hard stop + unban), kontakt `info@`
- [ ] Auto hard stop H3 / gate H5 *(zbývá)*
- [ ] NSFW hard fotka / produkční smoke *(volitelné)*

---

## 2. Nasazení infrastruktury

- [x] Migrace **056** — uživatel potvrdil
- [x] Migrace **057** — uživatel potvrdil
- [x] Edge Functions — sync + deploy `moderate-listing`
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## 3. Dokumentace

- [x] **Metodika** — §6.4 hard stop + 057 + `SITE_OPERATOR_CONTACT_EMAIL`
- [x] **PRD** — v3.43
- [x] **Stav_projektu/2026-07-22.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-22.md`
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
| Commit + push | ☐ |
