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
3. Spusť `supabase_schema.sql` v Supabase SQL Editoru

## Struktura

- `src/app/` — App Router stránky
- `src/lib/supabase/` — Supabase SSR klienti
- `src/middleware.ts` — session refresh
- `supabase_schema.sql` — databázové schéma
