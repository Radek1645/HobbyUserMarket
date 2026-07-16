# Modul: Práce a brigády — rychlý přehled (v0.4)

> **Kanonická specifikace:** [`PRD_v3.md` §11](./PRD_v3.md#11-modul-práce-a-brigády-v04)  
> **Stav:** Implementováno (JSON-LD `JobPosting` — viz §11.6 PRD, ✅ 2026-07-09)  
> **Migrace DB:** [`007_jobs.sql`](../supabase/007_jobs.sql)

Tento soubor je **doplňkový cheat sheet** — při rozporu platí PRD.

---

## Koncept

Nabídka práce = `post` s `category_type = 'prace'`. Reakce uchazeče = sdílený poptávkový formulář s volitelnými přílohami CV. Žádné ukládání do DB ani Storage.

| | Události (v0.2) | Práce (v0.4) |
|---|---|---|
| CTA | Mám zájem o účast | Odpovědět na nabídku / úkol |
| Formulář | jméno, kontakt, zpráva | + přílohy (1–3, max 5 MB) |
| Transport | Resend e-mail | Resend + attachments |
| Persistence | metadata v `inquiry_events` | stejné; CV se neukládají |

## DB — sémantické ohnutí (žádné nové sloupce)

| Sloupec | Hodnota pro `prace` | UI |
|---------|---------------------|-----|
| `condition_label` | `one_time` / `long_term` / `substitute` | Typ úvazku |
| `price_type` | `fixed` / `negotiable` / `offer` | Hodinová mzda / fixní odměna / nabídněte odměnu |
| `price_amount` | číslo | Mzda v Kč |
| `listing_duration_days` | 1–365 | Platnost inzerátu |
| `event_date` | **NULL** | Nepoužívá se |

## UI — založení

- Krok 1: kategorie + podsekce + typ úvazku
- Krok 2: popis, odměna, platnost (jako zboží/služby)
- Placeholder: požadavky, nástup, rozsah hodin

## UI — detail + poptávka

- Hlavička: typ úvazku
- Tlačítko: **Odpovědět na nabídku / úkol**
- `AttachmentDropzone` jen pro `prace` (`.pdf`, `.docx`, `.jpg`, `.png`)

## Soubory modulu

```
supabase/007_jobs.sql
src/config/categories.ts
src/components/listing/CreateListingForm.tsx
src/components/listing/ListingInquiryForm.tsx
src/components/listing/AttachmentDropzone.tsx
src/lib/inquiry/
src/app/api/inquiry/route.ts
```
