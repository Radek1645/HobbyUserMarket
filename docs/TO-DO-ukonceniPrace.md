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

- [x] FAQ `/faq` + patička + LegalLinkedText
- [x] Moderátorské poznámky (God Mode)
- [x] Audit events (po 060)
- [ ] Produkční smoke H1–H3 / F1–F4 *(příští session — `TO-DO-dalsi-den.md`)*

---

## 2. Nasazení infrastruktury

- [x] Migrace **058–061** — uživatel potvrdil
- [x] Edge Functions — sync + deploy `moderate-listing`
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## 3. Dokumentace

- [x] **Metodika** — §2.1.1 FAQ, §11.4 audit/poznámky
- [x] **PRD** — v3.45
- [x] **Stav_projektu/2026-07-26.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-26.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [x] `git status` — bez `.env`
- [x] Commit `7453cb1` (+ `4d7dd07` docs hash)
- [x] Push na `origin`

---

## 6. Push do gitu *(poslední krok)*

```powershell
git push -u origin HEAD
```

- [x] Push proběhl bez chyby
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## Definition of Done — session uzavřena

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ✅ |
| Migrace + EF nasazené | ✅ |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit + push | ✅ |
