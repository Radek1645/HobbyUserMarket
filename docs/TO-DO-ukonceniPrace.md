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

- [ ] Publish gate: create + edit (fingerprint, fotky)
- [ ] Admin vlastní inzerát — změna ceny (066, draft → AI → publish)
- [ ] God Mode úprava cizího inzerátu (staff bypass)
- [ ] Produkční smoke *(až po push + deploy)*

---

## 2. Nasazení infrastruktury

- [ ] Migrace **062–066** — potvrdit uživatelem
- [ ] Edge Functions — `npm run sync:moderation` + deploy `moderate-listing`
- [ ] Vercel build po pushi *(až po pushi)*

---

## 3. Dokumentace

- [x] **Metodika** — §5–7 publish/fingerprint, §6.12 migrace 062–066, §11.4 Poznámky
- [x] **PRD** — v3.47
- [x] **moderace-inzeratu.md** — issueApproval + service-role publish
- [x] **SECURITY_AND_UX_AUDIT_20260727.md** — stav oprav (nasazení neověřeno)
- [x] **Stav_projektu/2026-07-28.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-28.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [ ] `git status` — bez `.env`
- [ ] Commit (kód + docs)
- [ ] Push — **ne** (uživatel: ne vše otestováno)

---

## 6. Push do gitu *(poslední krok — tentokrát přeskočeno)*

```powershell
git push -u origin HEAD
```

- [ ] Push — odloženo na po manuálních testech
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## Definition of Done — session

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ☐ |
| Migrace + EF nasazené | ☐ |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit | ☐ |
| Push | ❌ odloženo |
