---
name: ukonceni-prace
description: Uzavírá vývojovou session — ověření, dokumentace (Metodika, PRD), snapshot Stav_projektu, git commit a push. Použij na konci dne, po větší iteraci, nebo když uživatel řekne „ukončení práce“, „konec session“, „zapiš stav“, „commit a push“.
---

# Ukončení práce na projektu

Obecný postup podle [`docs/TO-DO-ukonceniPrace.md`](../../docs/TO-DO-ukonceniPrace.md).

```
1. Ověřit funkčnost  →  2. Infrastruktura  →  3. Dokumentace
        →  4. Stav_projektu  →  5. Commit  →  6. Push
```

## 1. Ověření *(agent dle změn v session)*

- Happy path změněné oblasti v prohlížeči
- Regrese u souvisejících flow
- Žádné nové chyby v konzoli / terminálu ze session

## 2. Infrastruktura — vždy se zeptat uživatele

Použij **AskQuestion** (nebo výslovnou otázku v chatu):

1. **Supabase migrace** — spustil uživatel všechny nové SQL soubory z `supabase/` této session? (např. přes SQL editor / `supabase db push`)
2. **Edge Functions** — pokud session měnila AI moderaci: proběhl `npm run sync:moderation` + deploy `moderate-listing`?
3. **Env / Resend / Vercel** — nastaveno v `.env.local` **i** na Vercel? (bez commitu secrets)
   - `INQUIRY_FROM_EMAIL` musí být `@ověřená-doména`, ne `onboarding@resend.dev` pro produkci
4. **GTM / DNS** — jen pokud session se týkala analytiky nebo domény

Necommituj bez odpovědi; neověřené migrace zapiš do `Stav_projektu` jako **TODO**.

## 3. Dokumentace — co kam

| Změna | Dokument |
|-------|----------|
| UX flow, co uživatel vidí | [`docs/Metodika.md`](../../docs/Metodika.md) |
| Produktové rozhodnutí, DB, API | [`docs/PRD_v3.md`](../../docs/PRD_v3.md) — nový řádek historie + bump verze |
| Doména, GSC, GTM | [`docs/branding-a-domeny.md`](../../docs/branding-a-domeny.md) |
| AI moderace (deploy) | [`docs/moderace-inzeratu.md`](../../docs/moderace-inzeratu.md) |
| **Nová / změněná DB tabulka, sloupec, enum, bucket** | [`docs/supabase-prikazy.md`](../../docs/supabase-prikazy.md) — sekce **Schéma databáze** (lidský popis + atributy). Zároveň stručně PRD §4, pokud jde o produktový model. |
| Bezpečnostní nález nebo oprava | [`docs/SECURITY_AND_UX_AUDIT_20260727.md`](../../docs/SECURITY_AND_UX_AUDIT_20260727.md) |

**Pravidlo:** Kód bez dokumentace není hotový. Migrace SQL bez aktualizace § Schéma = nedokončená session.

U bezpečnostního auditu vždy explicitně rozliš:

- **opraveno v kódu** — změna existuje pouze v repozitáři,
- **nasazeno** — migrace, Edge Function a aplikace jsou v cílovém prostředí,
- **ověřeno** — proběhl popsaný manuální nebo automatický bezpečnostní test.

Pokud uživatel nepotvrdil infrastrukturu z kroku 2, audit nesmí tvrdit
„nasazeno“ ani „ověřeno“; uveď konkrétní zbývající deploy/test kroky.

## 4. Snapshot — `Stav_projektu/`

1. Soubor `Stav_projektu/YYYY-MM-DD.md` (druhá session tentýž den → `YYYY-MM-DD-vecer.md`)
2. Řádek v [`Stav_projektu/README.md`](../../Stav_projektu/README.md)
3. Obsah: co hotové, migrace, manuální testy, commity, backlog, **Na další session**

## 5. Git commit

```powershell
git status
git diff
```

- Bez `.env`, `.env.local`, credentials
- Commit message ve stylu repo (`feat:`, `fix:`, `docs:`)
- Velká session: kód + docs v jednom nebo dvou commitech — dle rozsahu

## 6. Push *(poslední krok)*

```powershell
git push -u origin HEAD
```

Po pushi připomeň: Vercel build, případně manuální test na produkci.

## Definition of Done

| Kritérium | |
|-----------|---|
| Změna ověřená v UI / API | ☐ |
| Migrace + EF nasazené (je-li třeba) | ☐ |
| Dokumentace srovnaná s kódem | ☐ |
| DB schéma v `supabase-prikazy.md` aktuální *(pokud změna DB)* | ☐ |
| `Stav_projektu` aktualizován | ☐ |
| Commit na `main` | ☐ |
| Push na `origin` | ☐ |

## Rychlé odkazy

- [`docs/PRD_v3.md`](../../docs/PRD_v3.md) — kanon
- [`docs/Metodika.md`](../../docs/Metodika.md) — uživatelské flow
- [`docs/supabase-prikazy.md`](../../docs/supabase-prikazy.md) — CLI + **Schéma databáze**
- [`docs/TO-DO-ukonceniPrace.md`](../../docs/TO-DO-ukonceniPrace.md) — plný checklist
