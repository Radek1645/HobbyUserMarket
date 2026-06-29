# Modul: Práce a brigády — rychlý přehled (v0.4)

> **Kanónická specifikace:** tento soubor (plné zadání)  
> **Migrace DB:** [`supabase/007_jobs.sql`](../supabase/007_jobs.sql)  
> **Vzor patternu:** [Události v0.2](./future_events.md) — poptávkový formulář bez DB persistence

---

## Koncept

Nabídka práce = `post` s `category_type = 'prace'`. Reakce uchazeče = **sdílený poptávkový formulář** (`ListingInquiryForm`) s volitelnými přílohami CV. Žádné ukládání souborů do DB ani Storage.

| | Události (v0.2) | Práce (v0.4) |
|---|---|---|
| CTA | Mám zájem o účast | Odpovědět na nabídku / úkol |
| Formulář | jméno, kontakt, zpráva | + přílohy (1–3, max 5 MB) |
| Transport | Resend e-mail | Resend + attachments |
| Persistence | nula | nula |

---

## DB — sémantické ohnutí (žádné nové sloupce)

| Sloupec | Hodnota pro `prace` | UI |
|---------|---------------------|-----|
| `condition_label` | `one_time` / `long_term` / `substitute` | Typ úvazku (stejné ENUM jako služby) |
| `price_type` | `fixed` / `negotiable` / `offer` | Odměna |
| `price_amount` | číslo | Mzda v Kč |
| `listing_duration_days` | 1–365 | Platnost inzerátu |
| `event_date` | **NULL** | Nepoužívá se |

---

## UI — založení inzerátu

- Krok 1: kategorie + podsekce + **Typ úvazku**
- Krok 2: popis, odměna, platnost (jako zboží/služby — **ne** datetime picker)
- Placeholder popisu: požadavky, nástup, rozsah hodin

## UI — detail + poptávka

- V hlavičce: typ úvazku (jako u nemovitostí)
- Tlačítko: **Odpovědět na nabídku / úkol**
- `AttachmentDropzone` jen pro `prace` (whitelist `.pdf`, `.docx`, `.jpg`, `.png`)

---

## AI guardrail (`categories.ts` → `aiPrompt`)

Extrahovat: výši odměny → `price_amount`, termín nástupu, požadavky (věk, praxe). Chybějící data → 1–3 otázky. Strip kontaktů z textu.

---

## Definition of Done

1. Taxonomie `prace` v `categories.ts` + migrace `007_jobs.sql`
2. Formulář založení s větví `isJob`
3. Poptávkový formulář na detailu všech kategorií (podmíněné CTA)
4. Přílohy CV jen u `prace`, server whitelist, Resend attachments
5. CV se neukládají do DB/Storage
6. JSON-LD `JobPosting` na detailu práce *(další krok)*

---

## Mimo rozsah

- Tabulka uchazečů / ATS
- Storage pro CV
- Strukturované `start_date` (zůstává v popisu + AI)
- Chat, notifikace uchazeči

---

## Soubory modulu

```
supabase/007_jobs.sql
src/config/categories.ts
src/types/post.ts
src/lib/posts/validation.ts
src/components/listing/CreateListingForm.tsx
src/components/listing/ListingInquiryForm.tsx
src/components/listing/AttachmentDropzone.tsx
src/lib/inquiry/
src/app/api/inquiry/route.ts
src/app/inzerat/[slug]/page.tsx
```
