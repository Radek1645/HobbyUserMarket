# Přehled Supabase příkazů

Rychlá reference pro práci s databází, Edge Functions a secrety projektu HobbyUserMarket.

> **Související:** [`moderace-inzeratu.md`](./moderace-inzeratu.md) · [`git-prikazy.md`](./git-prikazy.md) · migrace v `supabase/` · kanonické schéma `supabase_schema.sql`

---

## Obecný flow: co dělat kdy

### Nová migrace SQL (produkce)

Migrace v tomto projektu jsou **číslované soubory** `supabase/NNN_popis.sql`. Na produkci je nejčastěji spouštíš v **SQL Editoru** v Supabase Dashboardu.

```
1. Napiš / zkopíruj migraci do supabase/036_*.sql
2. Commit do gitu
3. Supabase Dashboard → SQL Editor → vlož celý obsah souboru → Run
4. Ověř v Table Editoru nebo jedním testem v aplikaci
```

| Krok | Co dělá |
|------|---------|
| SQL Editor | Aplikuje změny schématu, triggerů, RPC na produkční DB |
| Ověření v app | Např. publikace inzerátu, poptávka, `/moje-inzeraty` |

**Pořadí:** migrace spouštěj **v číselném pořadí** (028 před 029…). Nové migrace přidej do hlavičky [`PRD_v3.md`](./PRD_v3.md).

### Změna AI moderace (Edge Function)

AI moderace **neběží na Vercelu** — běží jako Edge Function `moderate-listing` na Supabase. Git push ji **automaticky nenasadí**.

Po každé změně pravidel nebo promptů spusť **oba příkazy za sebou** (v kořeni repa). První připraví soubory lokálně, druhý je nahraje do cloudu — **samotný sync produkci neaktualizuje**.

```powershell
cd c:\Users\HP\Documents\Cursor\0_Projects\HobbyUserMarket

npm run sync:moderation
npx supabase functions deploy moderate-listing
```

| # | Příkaz | Co dělá |
|---|--------|---------|
| 1 | `npm run sync:moderation` | Zkopíruje pravidla z `src/config/` do `supabase/functions/_shared/` (včetně promptů z `categories.ts`) |
| 2 | `npx supabase functions deploy moderate-listing` | Nahraje novou verzi Edge Function na produkci — **bez tohoto kroku platí stará moderace** |

**Kdy:** po změně `prohibited-topics.ts`, `bound-user-content.ts`, `categories.ts` (AI prompty), `build-prompt.ts` nebo souborů v `supabase/functions/moderate-listing/`.

**Před prvním deployem:** jednorázově `npx supabase login` a `npx supabase link --project-ref <PROJECT_REF>` (viz níže).

---

## Instalace a přihlášení CLI

CLI potřebuješ hlavně pro **deploy Edge Functions** a volitelně pro správu secretů.

```powershell
# Jednorázová instalace (globálně)
npm install -g supabase

# Přihlášení do Supabase účtu
npx supabase login

# Propojení lokálního repa s cloud projektem (jednorázově)
npx supabase link --project-ref <PROJECT_REF>
```

`<PROJECT_REF>` najdeš v Dashboardu: **Project Settings → General → Reference ID**.

> Tento repozitář **nepoužívá** lokální `supabase start` / Docker pro běžný vývoj — DB a Auth běží v cloudu.

---

## Reference příkazů

### Migrace a SQL

| Příkaz / akce | Vysvětlení | Příklad / poznámka |
|---------------|------------|-------------------|
| **SQL Editor** (Dashboard) | Spustí migraci na produkci — hlavní způsob v tomto projektu | Vlož celý `supabase/036_post_status_blocked.sql` |
| `npx supabase db push` | Aplikuje lokální migrace přes CLI | Jen pokud máš `supabase/migrations/` a `config.toml` — u nás spíš SQL Editor |
| `npx supabase db diff` | Vygeneruje SQL rozdíl oproti cloudu | Ladění schématu |
| Table Editor | Ruční prohlížení / editace řádků | `posts`, `profiles`, `moderation_checks`… |
| Database → Roles | Kontrola RLS a grantů | Po změně policies |

**Ruční SQL (moderace / ops):**

```sql
-- Zablokovat inzerát moderátorem (alternativa k God Mode UI)
UPDATE posts
SET status = 'blocked', status_reason_code = 'moderation', updated_at = now()
WHERE id = 123 AND status = 'active';

-- Ověřit enum stavů
SELECT unnest(enum_range(NULL::post_status));
```

**Nahlášení (`reports`) — migrace `040`, `041`:**

```sql
-- Jedno nahlášení podle report_no
SELECT *
FROM public.reports
WHERE report_no = 1;

-- Všechna nahlášení inzerátu (důvod + popis)
SELECT report_no, reason, detail_text, source, reporter_user_id, reporter_email, created_at
FROM public.reports
WHERE target_type = 'post' AND target_post_id = 123   -- ID inzerátu
ORDER BY report_no DESC;

-- Počty důvodů pro inzerát
SELECT reason, count(*) AS pocet
FROM public.reports
WHERE target_type = 'post' AND target_post_id = 123
GROUP BY reason;

-- Inzeráty s alespoň jedním nahlášením
SELECT
  p.id,
  p.title,
  p.status,
  p.status_reason_code,
  count(DISTINCT r.reporter_user_id) AS unikatni_uzivatele,
  count(*) AS vsechna_nahlaseni
FROM public.posts p
JOIN public.reports r ON r.target_post_id = p.id AND r.target_type = 'post'
GROUP BY p.id, p.title, p.status, p.status_reason_code
ORDER BY count(*) DESC;
```

Viz [`Metodika.md` §10.3](./Metodika.md#103-databáze-publicreports).

### Nastavení admina a moderátora

Samostatný admin login **neexistuje** — přihlašuješ se stejně jako běžný uživatel (`/login`). Role je v `profiles.role` (`user` | `moderator` | `admin`).

**Předpoklad:** účet už existuje v aplikaci (má řádek v `profiles`).

**1. Najdi UUID účtu** (Supabase Dashboard → SQL Editor):

```sql
SELECT id, profile_no, nickname, email, role
FROM public.profiles
WHERE email = 'tvuj@email.cz';
```

**2a. První admin (bootstrap)** — trigger `prevent_role_escalation` blokuje obyčejný `UPDATE role`. Dočasně ho vypni:

```sql
ALTER TABLE public.profiles DISABLE TRIGGER trg_profiles_prevent_role_escalation;

UPDATE public.profiles
SET role = 'admin'
WHERE id = 'TVOJE-UUID-ZDE';

ALTER TABLE public.profiles ENABLE TRIGGER trg_profiles_prevent_role_escalation;
```

Pro roli **moderátor** použij `SET role = 'moderator'` (stejný postup).

**2b. Další admin/moderátor** — pokud už jeden admin existuje, stačí:

```sql
UPDATE public.profiles
SET role = 'admin'   -- nebo 'moderator'
WHERE id = 'UUID-JINEHO-UCTU';
```

(V SQL Editoru bez JWT to může stejně spadnout — v tom případě použij postup 2a.)

**3. Ověření v aplikaci**

1. Odhlásit se a znovu přihlásit (role se načítá z DB při requestu).
2. Moderátor/admin: v menu **Moderace** → `/mod/karantena`, `/mod/inzeraty`.
3. Admin navíc: **Uživatelé** → `/mod/uzivatele`.
4. SQL kontrola: `SELECT email, role FROM public.profiles WHERE id = 'UUID';`

| Role | God Mode UI | DB oprávnění |
|------|-------------|--------------|
| `admin` | Karanténa, Inzeráty, Uživatelé (smazání účtu, balíčky) | plná + změna rolí |
| `moderator` | Karanténa, Inzeráty, lišta na detailu | smazat/zablokovat/obnovit inzeráty |
| `user` | — | standardní uživatel |

Viz také [`Metodika.md` §11](./Metodika.md#11-moderátoři-a-administrátoři-god-mode).

### Ruční přidělení balíčku inzerátů (kamarád / beta tester)

Model je **lifetime** — limit = součet `listing_quota` ze všech řádků v `user_listing_entitlements`. Každá první publikace inzerátu spotřebuje 1 kredit navždy (smazání nebo archivace kredit nevrátí).

Migrace: `038_listing_quota.sql` (+ případně `039_listing_quota_lifetime.sql`, pokud 038 běžela ve staré verzi).

### A) God Mode v aplikaci (nejjednodušší)

1. Přihlásit se jako **admin**.
2. Otevřít **`/mod/uzivatele`**.
3. U vybraného uživatele kliknout **„+20 inzerátů“** → potvrdit.

Přidá se balíček `promo_partner` (+20 lifetime publikací). Akci lze opakovat — každé potvrzení přidá dalších 20.

### B) SQL — přidělit existující balíček

V SQL Editoru (musíš být přihlášený jako admin v Dashboardu, nebo volat pod service role):

```sql
-- Najdi uživatele (profile_no je číslo v tabulce profiles)
SELECT id, profile_no, nickname, email
FROM public.profiles
WHERE nickname ILIKE '%jan%' OR email ILIKE '%@example.com%';

-- Přidělení partnerského balíčku (+20)
SELECT public.admin_grant_listing_package(
  '00000000-0000-0000-0000-000000000000'::uuid,  -- id uživatele
  'promo_partner',
  'Kamarád — beta tester'
);

-- Stejný balíček placené nabídky (+20, 50 Kč v katalogu — zatím bez platby)
SELECT public.admin_grant_listing_package(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'standard_20',
  'Kamarád — sleva / test'
);
```

Dostupné slugy v katalogu `listing_packages`:

| slug | výchozí quota | poznámka |
|------|---------------|----------|
| `free` | 20 | při registraci automaticky — ručně jen pokud chybí |
| `promo_partner` | 20 | manuální / God Mode |
| `standard_20` | 20 | budoucí placený balíček |

### C) SQL — vlastní počet (např. +50 pro kamaráda)

Balíčky se **sčítají**. Pro jiný počet než 20:

**Varianta 1 — opakovat grant** (např. 60 = 3× `promo_partner`):

```sql
SELECT public.admin_grant_listing_package('UUID', 'promo_partner', 'Kamarád +20 #1');
SELECT public.admin_grant_listing_package('UUID', 'promo_partner', 'Kamarád +20 #2');
SELECT public.admin_grant_listing_package('UUID', 'promo_partner', 'Kamarád +20 #3');
```

**Varianta 2 — jednorázový vlastní kredit** (bez nového balíčku v katalogu):

```sql
INSERT INTO public.user_listing_entitlements (
  user_id,
  package_id,
  listing_quota,
  granted_by,
  note
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  lp.id,
  50,  -- kolik lifetime publikací navíc
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
  'Kamarád — vlastní quota +50'
FROM public.listing_packages lp
WHERE lp.slug = 'promo_partner';
```

(`package_id` je jen vazba na katalog; rozhodující je sloupec `listing_quota` v řádku entitlementu.)

**Varianta 3 — nový balíček v katalogu** (opakovatelné pro více lidí):

```sql
INSERT INTO public.listing_packages (
  slug, display_name, listing_quota, description, sort_order
)
VALUES (
  'friend_50',
  'Kamarádský balíček 50',
  50,
  'Manuálně přidělený balíček pro vybrané uživatele.',
  15
)
ON CONFLICT (slug) DO NOTHING;

SELECT public.admin_grant_listing_package('UUID', 'friend_50', 'Kamarád');
```

### Ověření po změně

```sql
-- Limit, spotřeba a zbývající kredity (jako v profilu)
SELECT * FROM public.get_user_listing_quota('UUID');

-- Historie přidělení
SELECT
  e.entitlement_no,
  e.listing_quota,
  e.granted_at,
  e.note,
  lp.slug,
  lp.display_name
FROM public.user_listing_entitlements e
JOIN public.listing_packages lp ON lp.id = e.package_id
WHERE e.user_id = 'UUID'
ORDER BY e.granted_at;
```

Uživatel uvidí nový limit v **`/profil/nastaveni`** (plán Free, počítadlo X/Y). Admin/moderátor limity nemá.

### Edge Functions

**Nasazení moderace (vždy oba řádky, v tomto pořadí):**

```powershell
npm run sync:moderation
npx supabase functions deploy moderate-listing
```

| Příkaz | Vysvětlení |
|--------|------------|
| `npx supabase functions list` | Vypíše nasazené funkce |
| `npx supabase functions logs moderate-listing` | Logy funkce (debug) — po neúspěšné moderaci |
| `npx supabase functions serve moderate-listing` | Lokální běh funkce — vyžaduje Docker + `supabase start` |

**Funkce v projektu:**

| Funkce | Účel |
|--------|------|
| `moderate-listing` | AI kontrola inzerátu (+ pre-Gemini NSFW/hard-hit), vydání approval tokenu |

### SQL — přehled AI / NSFW kontrol

Plné SELECTY a vysvětlení tabulek: [`Metodika.md` §6.12](./Metodika.md#612-sql--přehled-kontrol-v-supabase).

| Tabulka | Účel | Inkrementální ID |
|---------|------|------------------|
| `moderation_checks` | Log každého volání Edge Function (status, error_code, title_preview) | `log_no` |
| `moderation_hard_reject_evidence` | Hard-hit text, NSFW fotka, Sightengine výpadek, threshold 3×/24h | `evidence_no` |

```sql
-- Posledních 50 kontrol
SELECT log_no, created_at, status, error_code, title_preview, rejection_reason
FROM public.moderation_checks
ORDER BY created_at DESC
LIMIT 50;

-- Hard-hit / NSFW evidence
SELECT evidence_no, created_at, kind, matched_category, matched_term, title_snippet, storage_path
FROM public.moderation_hard_reject_evidence
ORDER BY created_at DESC
LIMIT 50;

-- Souhrn za 24 h
SELECT status, error_code, count(*) AS pocet
FROM public.moderation_checks
WHERE created_at >= now() - interval '24 hours'
GROUP BY status, error_code
ORDER BY pocet DESC;
```

### Secrets (API klíče v cloudu)

Secrets jsou **jen na serveru** Edge Functions — nikdy do gitu.

| Příkaz / akce | Vysvětlení | Příklad |
|---------------|------------|---------|
| Dashboard → Edge Functions → Secrets | Ruční nastavení v UI | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET` |
| `npx supabase secrets set KEY=hodnota` | Nastavení secretu přes CLI | `npx supabase secrets set SIGHTENGINE_API_USER=...` |
| `npx supabase secrets list` | Vypíše názvy secretů (ne hodnoty) | — |

Po změně secretu obvykle **stačí** — redeploy funkce není vždy nutný, ale při problémech deploy zopakuj.

### Auth a Storage (Dashboard)

| Oblast | Kde v Dashboardu | Typické úkoly |
|--------|------------------|---------------|
| **Auth → URL Configuration** | Redirect URLs | Přidat Vercel doménu, `localhost:3000` |
| **Auth → Users** | Seznam účtů | Smazání testovacího uživatele |
| **Storage → post-images** | Bucket fotek | Kontrola nahraných snímků |
| **API → Project URL / anon key** | `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### Projektové npm skripty

| Příkaz | Co dělá |
|--------|---------|
| `npm run sync:moderation` | Sync pravidel a promptů → `supabase/functions/_shared/` — **vždy hned potom** `npx supabase functions deploy moderate-listing` |

---

## Checklist po změně backendu

| Změnil jsi… | Udělej |
|-------------|--------|
| Nový soubor `supabase/NNN_*.sql` | SQL Editor na produkci + commit + PRD hlavička |
| `prohibited-topics.ts` / AI prompty / `categories.ts` | Viz blok výše — oba příkazy pod sebou: `npm run sync:moderation` a `npx supabase functions deploy moderate-listing` |
| `.env.local` (jen lokál) | Nic na Supabase — jen restart `npm run dev` |
| `CRON_SECRET` (Vercel) | Nastavit ve Vercelu, ne v Supabase — viz `vercel.json` |
| Service role klíč | Jen server / Edge — **nikdy** `NEXT_PUBLIC_*` |

---

## Časté chyby

| Problém | Pravděpodobná příčina | Řešení |
|---------|----------------------|--------|
| Moderace vrací stará pravidla | Chybí krok 2 — deploy | Spusť znovu oba příkazy: `npm run sync:moderation` a `npx supabase functions deploy moderate-listing` |
| `Publishing requires moderation approval` | Publish gate (027) — chybí approval token | Normální flow přes AI modal |
| `GEMINI_BLOCKED_*` | Google safety filtr | Viz `moderace-inzeratu.md` — `geminiSafe` prompt |
| Migrace selže na `ADD VALUE` enum | Hodnota už existuje | `IF NOT EXISTS` (viz 036) nebo přeskoč řádek |
| App nevidí nový sloupec | Migrace neběžela / špatný projekt | Ověř v Table Editoru sloupce tabulky `posts` |
| Po grantu stejný limit v profilu | Špatné UUID / migrace 038 neběžela | `SELECT * FROM get_user_listing_quota('UUID')` |
| `Only admins can change user roles` | Bootstrap admina bez vypnutí triggeru | Postup § Nastavení admina — `DISABLE TRIGGER` → `UPDATE` → `ENABLE TRIGGER` |

---

## Rychlé odkazy

| Dokument / soubor | Obsah |
|-------------------|--------|
| [`moderace-inzeratu.md`](./moderace-inzeratu.md) | Deploy moderace, secrets, migrace 025–027 |
| [`Metodika.md`](./Metodika.md#11-moderátoři-a-administrátoři-god-mode) | God Mode, role admin/moderátor |
| [`supabase/`](./../supabase/) | Číslované migrace |
| [`supabase/038_listing_quota.sql`](../supabase/038_listing_quota.sql) | Balíčky inzerátů, lifetime limit |
| [`supabase/039_listing_quota_lifetime.sql`](../supabase/039_listing_quota_lifetime.sql) | Oprava na lifetime model (pokud 038 běžela dřív) |
| [Supabase CLI docs](https://supabase.com/docs/guides/cli) | Oficiální dokumentace |
