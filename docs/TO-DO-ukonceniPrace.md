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

- [x] Happy path změněné oblasti (lifetime UI, intent badges, cena práce)
- [x] Regrese souvisejících flow (obnovení / prodloužení skryté u stropu)
- [x] DB migrace 048/049 nasazeny uživatelem
- [x] AI moderace: redeploy `moderate-listing` (prompt `prace`)
- [x] Terminál bez nových chyb ze session

---

## 2. Nasazení infrastruktury *(backend session)*

- [x] Migrace **047**, **048**, **049** — spuštěny v Supabase
- [x] Edge `moderate-listing` — deploy
- [x] Vercel cron + `CRON_SECRET` — beze změny (už nastaveno); nová cesta v `vercel.json`

---

## 3. Dokumentace

- [x] **Metodika** — §9.1.1 lifetime, §9.1.2 expiry mail, §12.4 odměna práce
- [x] **PRD** — v3.29, historie, datový model
- [x] **Právní** — VOP / podmínky / balíčky (365 dní)
- [x] **ui-prvky**, branding favicon
- [x] **Stav_projektu/2026-07-16-vecer.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-16-vecer.md`
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
| Změna ověřená v UI / API | ✅ |
| Migrace + EF nasazené | ✅ |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit(y) na `main` | ☐ |
| **Push na `origin`** | ☐ |

---

## Rychlé odkazy

| Dokument | Role |
|----------|------|
| [`PRD_v3.md`](./PRD_v3.md) | Kanon — co a proč |
| [`Metodika.md`](./Metodika.md) | Jak to prožije uživatel |
| [`branding-a-domeny.md`](./branding-a-domeny.md) | Doména, GSC, GTM checklist |
| [`Stav_projektu/`](../Stav_projektu/) | Deníček iterací |
