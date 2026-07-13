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

- [x] Prošel jsem **happy path** změněné oblasti v prohlížeči (přihlášený uživatel, reálná data)
- [x] Ověřil jsem **regresi** u souvisejících flow (ne jen novou funkci)
- [ ] U změn DB/RLS: ověřeno chování jako `authenticated`, ne jen v SQL editoru jako admin *(tato session — N/A)*
- [ ] U AI moderace: test s fotkou + textem *(tato session — N/A)*
- [x] V konzoli / terminálu **žádné nové chyby**, které session zavedla (hydration od Tag Assistant — ošetřeno `suppressHydrationWarning`)

**Typické scénáře k rychlé kontrole** *(podle toho, co se měnilo)*:

| Oblast | Minimální test |
|--------|----------------|
| GTM / cookie lišta | Lišta → Pouze nezbytné / Přijmout analytiku; GTM Preview consent stavy |
| Search Console | DNS ověření; sitemap submitted |

---

## 2. Nasazení infrastruktury *(pokud session měnila backend)*

*(tato session — bez nových migrací SQL)*

- [x] GTM container nasazen v produkci (`GTM-WGLNJRNK`)
- [x] GA4 tag v GTM containeru (mimo repo)
- [x] Env bez commitu secrets (GTM ID v kódu jako veřejný default)

---

## 3. Dokumentace — co kam patří

### Checklist dokumentace

- [x] **Metodika** — §14 Cookie lišta / GTM; §8.5 Search Console; patička, `/cookies`
- [x] **PRD** — v3.27, historie verzí, stav cookie consent + GTM
- [x] **branding-a-domeny.md** — fáze 7 Search Console + GTM ✅
- [x] **Stav_projektu/2026-07-14.md** — snapshot session

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-14.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [x] `git status` — bez `.env`, bez artefaktů
- [x] Commit kódu (consent fix, sitemap `/cookies`, layout)
- [x] Commit dokumentace (Metodika, PRD, Stav_projektu, branding checklist)

---

## 6. Push do gitu *(poslední krok — uživatel)*

```powershell
git push origin main
```

- [ ] Push proběhl bez chyby *(uživatel)*
- [ ] Vercel build po pushi zelený *(uživatel)*

---

## Definition of Done — session uzavřena

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ✅ |
| Migrace + EF nasazené (je-li třeba) | N/A |
| Dokumentace srovnaná s kódem | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit(y) na `main` | ✅ |
| **Push na `origin`** | ☐ uživatel |

---

## Rychlé odkazy

| Dokument | Role |
|----------|------|
| [`PRD_v3.md`](./PRD_v3.md) | Kanon — co a proč |
| [`Metodika.md`](./Metodika.md) | Jak to prožije uživatel |
| [`branding-a-domeny.md`](./branding-a-domeny.md) | Doména, GSC, GTM checklist |
| [`Stav_projektu/`](../Stav_projektu/) | Deníček iterací |
