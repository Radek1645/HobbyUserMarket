# HobbyUserMarket

Lokální tržiště pro hobby uživatele — Next.js (App Router) + Supabase.

## Stack

- Next.js 15, TypeScript, Tailwind CSS
- Supabase (Auth, PostgreSQL, PostGIS)
- Lucide React (ikony)

## Spuštění

```bash
npm install
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## Konfigurace

1. Vytvoř projekt na [supabase.com](https://supabase.com)
2. Doplň klíče do `.env.local`
3. V Supabase SQL Editoru spusť **v tomto pořadí** (vždy **celý soubor**, Ctrl+A):

### Čistý start (doporučeno)

| Krok | Soubor | Co dělá |
|------|--------|---------|
| 1 | `supabase/000_reset_database.sql` | Smaže celé `public` schema + auth triggery |
| 2 | `supabase_schema.sql` | Nasadí PRD v3.1 od nuly |

### Legacy migrace (jen pokud máš staré tabulky users/listings)

| Krok | Soubor |
|------|--------|
| 1 | `supabase/000_drop_legacy.sql` |
| 2 | `supabase_schema.sql` |

> PRD: `../description_project/PRD_v3.md`

## Struktura

- `src/app/` — App Router stránky
- `src/lib/supabase/` — Supabase SSR klienti
- `src/middleware.ts` — session refresh
- `supabase/000_reset_database.sql` — **kompletní reset DB**
- `supabase/000_drop_legacy.sql` — drop pouze starého prototypu
- `supabase_schema.sql` — PRD v3.1 databázové schéma

## UI copy — odkazy na právní dokumenty

Když user-facing text **konkrétně jmenuje** právní dokument (VOP, Podmínky inzerce, Zásady ochrany osobních údajů / GDPR, Balíčky/Limity inzerce), musí to být **klikací odkaz** na příslušnou stránku — ne holý text.

- Fráze a URL: `src/config/legal-inline-links.ts`
- Render: `<LegalLinkedText text="…" />` (`src/components/legal/LegalLinkedText.tsx`)
- Nové skloňování (např. „Podmínkami inzerce“) přidej do configu
- JSON-LD, e-maily a čistý plaintext nech bez HTML — linkuj jen ve viditelném UI
- Detail právních docs: [`docs/pravni/README.md`](./docs/pravni/README.md)
