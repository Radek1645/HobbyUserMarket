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

- [ ] Prošel jsem **happy path** změněné oblasti v prohlížeči (přihlášený uživatel, reálná data)
- [ ] Ověřil jsem **regresi** u souvisejících flow (ne jen novou funkci)
- [ ] U změn DB/RLS: ověřeno chování jako `authenticated`, ne jen v SQL editoru jako admin
- [ ] U AI moderace: test s fotkou + textem; u editace i scénář „jen cena“ vs. „změna popisu“
- [ ] V konzoli / terminálu **žádné nové chyby**, které session zavedla

**Typické scénáře k rychlé kontrole** *(podle toho, co se měnilo)*:

| Oblast | Minimální test |
|--------|----------------|
| Nový / edit inzerát | Create → AI modal → publikace; edit popisu → re-moderace |
| Stav inzerátu | Pozastavit → Zveřejnit; koncept → Upravit → publikovat |
| Kontakty | Detail bez PII v HTML; „Zobrazit kontakt“ po přihlášení |
| Poptávka | Odeslání formuláře, doručení e-mailu |
| Migrace | Aplikace nepadá; kritický SQL dotaz / RPC funguje |

---

## 2. Nasazení infrastruktury *(pokud session měnila backend)*

### Supabase — migrace SQL

- [ ] Nový soubor `supabase/NNN_*.sql` je v repu a **spuštěný** v Supabase SQL Editoru (prod)
- [ ] V hlavičce [`PRD_v3.md`](./PRD_v3.md) je odkaz na novou migraci
- [ ] Po migraci ověřen jeden reprezentativní use-case v aplikaci

### Edge Functions *(pokud)*

Po změně `categories.ts`, `prohibited-topics.ts`, promptů nebo `moderate-listing`:

```powershell
npm run sync:moderation
npx supabase functions deploy moderate-listing
```

- [ ] EF redeploy proběhl bez chyby
- [ ] Jedno volání moderace v UI projde (APPROVED / NEEDS_QUESTIONS / očekávaný REJECTED)

### Secrets / env *(pokud)*

- [ ] Nové proměnné zdokumentované v `moderace-inzeratu.md` nebo `.env.example`
- [ ] Vercel / Supabase secrets nastavené (bez commitu `.env`)

---

## 3. Dokumentace — co kam patří

**Závazné mapování** (viz PRD §1.0):

| Změnil jsi… | Aktualizuj |
|-------------|------------|
| Uživatelský / moderátorský flow | [`Metodika.md`](./Metodika.md) |
| Specifikace, DoD, datový model, migrace | [`PRD_v3.md`](./PRD_v3.md) (+ řádek v §7 Historie verzí) |
| AI moderace, deploy EF, rate limity | [`moderace-inzeratu.md`](./moderace-inzeratu.md) |
| Pravidla hydratace popisu, limity znaků | [`hydratace-inzeratu.md`](./hydratace-inzeratu.md) |
| Modul Události / Práce (cheat sheet) | [`future_events.md`](./future_events.md) / [`future_jobs.md`](./future_jobs.md) |
| Nález z auditu, nový backlog | [`TO-DO_Fable.md`](./TO-DO_Fable.md) |
| Cursor pravidla pro AI | [`.cursor/rules/`](../.cursor/rules/) *(pokud)* |

### Checklist dokumentace

- [ ] **Metodika** — popis odpovídá tomu, co uživatel v UI skutečně vidí
- [ ] **PRD** — verze dokumentu + datum; nové migrace v hlavičce; stav modulů (*Implementováno* / *Plánováno*)
- [ ] **moderace / hydratace** — srovnané s kódem a nasazenou migrací
- [ ] **TO-DO_Fable** — uzavřené položky označené ✅, datum revize
- [ ] Žádný rozpor: při nejasnosti platí **PRD** > cheat sheety > Metodika jako UX popis

---

## 4. Snapshot session — `Stav_projektu/`

Po větší iteraci (ne po každém malém commitu):

- [ ] Nový nebo aktualizovaný soubor `Stav_projektu/YYYY-MM-DD.md` obsahuje:
  - časovou značku a verzi PRD
  - co je **nasazeno** (migrace, EF)
  - co je **commitnuto** (hash / popis)
  - výsledky manuálních testů (tabulka ✅/❌)
  - známé záměrné chování a **co nechat na další session**
- [ ] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md) doplněn

---

## 5. Git — příprava a commity

### Úklid

- [ ] `git status` — žádné náhodné soubory (`supabase/.temp/`, `.env`, build artefakty)
- [ ] Citlivé údaje **nejsou** ve staging area
- [ ] `.gitignore` doplněn, pokud nový typ dočasných souborů

### Commit kódu *(pokud ještě není)*

Logicky odděl kód a dokumentaci (jeden nebo dva commity):

```powershell
git add <soubory s kódem, migracemi, EF>
git commit -m "feat: stručný popis proč" -m "Volitelný detail změn."
```

### Commit dokumentace

```powershell
git add docs/ Stav_projektu/
git commit -m "docs: stručný popis synchronizace" -m "PRD, Metodika, Stav_projektu, …"
```

- [ ] `git log -1` — message dává smysl za měsíc
- [ ] Všechny zamýšlené změny jsou commitnuté (`git status` čistý)

**Poznámka:** Commit vytvářej jen na výslovnou žádost nebo jako součást tohoto ukončení — ne průběžně po každém souboru.

---

## 6. Push do gitu *(poslední krok)*

```powershell
git push origin main
```

- [ ] Push proběhl bez chyby
- [ ] `git status` — *Your branch is up to date with 'origin/main'*
- [ ] (Volitelně) Vercel / CI build po pushi zelený

---

## Definition of Done — session uzavřena

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ☐ |
| Migrace + EF nasazené (je-li třeba) | ☐ |
| Dokumentace srovnaná s kódem | ☐ |
| `Stav_projektu` aktualizován | ☐ |
| Commit(y) na `main` | ☐ |
| **Push na `origin`** | ☐ |

---

## Rychlé odkazy

| Dokument | Role |
|----------|------|
| [`PRD_v3.md`](./PRD_v3.md) | Kanon — co a proč |
| [`Metodika.md`](./Metodika.md) | Jak to prožije uživatel |
| [`moderace-inzeratu.md`](./moderace-inzeratu.md) | AI + deploy |
| [`hydratace-inzeratu.md`](./hydratace-inzeratu.md) | Pravidla popisu |
| [`TO-DO_Fable.md`](./TO-DO_Fable.md) | Backlog nálezů |
| [`Stav_projektu/`](../Stav_projektu/) | Deníček iterací |
