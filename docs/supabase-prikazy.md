# Přehled Supabase příkazů

Rychlá reference pro práci s databází, Edge Functions a secrety projektu HobbyUserMarket.

> **Související:** [`moderace-inzeratu.md`](./moderace-inzeratu.md) · [`git-prikazy.md`](./git-prikazy.md) · migrace v `supabase/` · lidský přehled tabulek níže (§ Schéma databáze) · SQL snapshot `supabase_schema.sql` (nemusí být 100 % aktuální — pravda = migrace)

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

**`posts` column SELECT (078 + 079):** `anon` / `authenticated` nemají `GRANT SELECT` na celou tabulku, jen na výčet sloupců. **Nový sloupec na `posts` musí stejná migrace přidat do `GRANT SELECT (…)`** — jinak appka spadne na `42501`. `contact_phone`, `location` a `original_*` do grantu nepatří (RPC). `get_nearby_posts` / `search_posts` jsou SECURITY DEFINER: viditelnost drží `is_post_publicly_visible` v těle, ne RLS.

Trvalá pravidla pro agenty: [`.cursor/rules/postgres-grants-rls.mdc`](../.cursor/rules/postgres-grants-rls.mdc).

### Před releasem grantů / RLS

Spouštět v Supabase SQL Editoru **před releasem** a po každé migraci, která sahá na granty, RLS nebo SECURITY DEFINER funkce. Migrace může projít a nic neudělat — pravda je výstup těchto dotazů, ne soubor v `supabase/`.

```sql
-- 1. Má každá veřejná tabulka zapnutou RLS?
select relname, relrowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- 2. Reálné policies (porovnat s migracemi)
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname in ('public','storage') order by 1,2,3;

-- 3. Co reálně smí anon a authenticated (table-level)
select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type)
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated')
group by 1,2 order by 1,2;

-- 4. Sloupcová oprávnění u citlivých sloupců posts
-- Očekávej po 078+079:
--   contact_phone, location, original_*   anon=false  auth=false
--   title, slug, location_text            obě true
select c.column_name,
       bool_or(p.grantee = 'anon')          as anon_cte,
       bool_or(p.grantee = 'authenticated') as auth_cte
from information_schema.columns c
left join information_schema.column_privileges p
  on  p.table_schema = c.table_schema and p.table_name = c.table_name
  and p.column_name  = c.column_name  and p.privilege_type = 'SELECT'
  and p.grantee in ('anon','authenticated')
where c.table_schema = 'public' and c.table_name = 'posts'
  and c.column_name in ('contact_phone','location','original_title',
                        'original_description','title','slug','location_text')
group by c.column_name order by c.column_name;

-- 5. Přežil nějaký starý overload s grantem pro authenticated?
select p.proname, pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as definer, array_to_string(p.proacl, ', ') as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('publish_approved_post','issue_moderation_approval',
                    'reveal_listing_contact','get_nearby_posts',
                    'search_posts','get_recent_posts')
order by 1,2;

-- 6. Runtime test jako anon (musí skončit chybou 42501)
set local role anon;
select contact_phone from public.posts limit 1;
reset role;
```

`posts` **nesmí** mít table-level `GRANT SELECT` pro `anon` / `authenticated` (řádek v dotazu 3). Hint `GRANT SELECT ON posts` to znovu zavede a shodí 078/079.

### Změna AI moderace / prefillu (Edge Functions)

AI moderace a photo-first prefill **neběží na Vercelu** — běží jako Edge Functions na Supabase. Git push je **automaticky nenasadí**.

Po každé změně pravidel nebo promptů spusť **sync a potom deploy všech dotčených funkcí** (v kořeni repa). Samotný sync produkci neaktualizuje.

```powershell
cd c:\Users\HP\Documents\Cursor\0_Projects\HobbyUserMarket

npm run sync:moderation
npx supabase functions deploy moderate-listing
npx supabase functions deploy suggest-listing-from-photos
npx supabase functions deploy compare-suggest-from-photos
```

| # | Příkaz | Co dělá |
|---|--------|---------|
| 1 | `npm run sync:moderation` | Zkopíruje pravidla z `src/config/` do `supabase/functions/_shared/` (včetně promptů z `categories.ts` a taxonomie zboží) |
| 2 | `npx supabase functions deploy moderate-listing` | Publish gate: NSFW (Sightengine) → Gemini kontrola textu/fotek → approval token. **Bez deploye platí stará moderace.** |
| 3 | `npx supabase functions deploy suggest-listing-from-photos` | Photo-first prefill na `/inzerat/novy`: z 1–2 fotek předvyplní název, popis a kategorii (Sightengine → Gemini). **Bez deploye platí starý prefill.** |
| 4 | `npx supabase functions deploy compare-suggest-from-photos` | Staff lab `/mod/prefill-lab`: stejný suggest prompt/schema, dvě po sobě jdoucí volání modelu (bez DB logu, bez Sightengine). |

**Kdy deployovat kterou funkci:**

| Změna | Deploy |
|-------|--------|
| `prohibited-topics.ts`, `build-prompt.ts`, AI prompty v `categories*.ts`, `moderate-listing/` | `moderate-listing` |
| Prefill prompt / `suggest-listing.ts`, rate limity prefillu, `suggest-listing-from-photos/` | `suggest-listing-from-photos` (+ `compare-suggest-from-photos` pokud měníš sdílenou inference) |
| Prefill compare lab (`compare-suggest-from-photos/`, `/mod/prefill-lab`) | `compare-suggest-from-photos` |
| Sdílené `_shared/moderation/` (Sightengine, log, taxonomie, `run-suggest-listing.ts`…) | **obě** suggest funkce (+ lab) |

**Před prvním deployem:** jednorázově `npx supabase login` a `npx supabase link --project-ref <PROJECT_REF>` (viz níže).

**Fotky pro AI od 067/068:** spusť v SQL Editoru `supabase/067_moderation_image_staging.sql` a následně `supabase/068_moderation_image_renditions.sql`. Po `npm run sync:moderation` nasaď **nejdřív Next.js/Vercel** (vytváří nové varianty) a až potom Edge Function (začne je vyžadovat). Resize zajišťuje Sharp ve Vercel Server Action; placené Supabase Storage Image Transformations nejsou potřeba. Rendition bucket nesmí mít policy pro `authenticated`.

---

## Schéma databáze — co máme za tabulky

Lidský přehled tabulek v `public` (produkční Postgres na Supabase).  
**Jak udržovat:** při nové migraci (`CREATE TABLE` / `ADD COLUMN`) aktualizuj **tuto sekci** — viz skill ukončení práce a checklist níže.  
Kanon produktového modelu zůstává v [`PRD_v3.md`](./PRD_v3.md) §4; tady je provozní „co kde hledat v Table Editoru“.

Účty samy o sobě žijí v **`auth.users`** (Supabase Auth). V `public` na ně odkazuje `profiles.id` a další FK.

### Rychlý přehled

| Tabulka | K čemu je (jednou větou) |
|---------|--------------------------|
| `profiles` | Profil uživatele: přezdívka, role, firma, souhlasy |
| `posts` | Inzerát — text, kategorie, cena, lokalita, stav, SEO |
| `post_images` | Fotky inzerátu (cesta ve Storage + pořadí) |
| `comments` | **Legacy** — stará diskuse pod inzerátem (v UI ne) |
| `reports` | Nahlášení inzerátu |
| `contact_reveals` | Kdo kdy odhalil kontakt |
| `inquiry_events` | Metadata odeslané poptávky (bez těla zprávy) |
| `listing_views` | Zobrazení detailu (+ podklad pro `view_count`) |
| `rate_limits` | Počítadla limitů (AI, kontakt…) |
| `moderation_approvals` | Jednorázový token pro publikaci po AI |
| `moderation_checks` | Log AI volání — publish moderace i prefill (`intent`); Sightengine JSON ve `sightengine_responses`; guest přes `guest_visitor_id` (076) |
| `moderation_hard_reject_evidence` | Evidence hard-rejectu (NSFW / hard-hit) před Gemini |
| `audit_events` | Systémový audit (změny stavů, moderace…) |
| `moderator_note_kinds` | Číselník typů poznámek |
| `moderator_notes` | Interní poznámky staff u inzerátu/profilu |
| `account_blacklist` | Hard-stop účtu podle e-mailu |
| `account_deletion_events` | Audit smazání účtu |
| `listing_packages` | Balíčky kreditů na inzeráty |
| `user_listing_entitlements` | Přidělené kvóty uživateli |
| `gdpr_retention_warnings` | Záznam, že šel e-mail před smazáním neaktivity |
| `category_seo_pages` | SEO copy + `index_status` + `listing_count` kategoriálních landings (`072`) |
| `bank_payments` | **Plánováno** (PRD monetizace) — v DB zatím není |

**Storage buckety:** `post-images` (veřejné fotky inzerátů) · `moderation-evidence` (privátní NSFW / hard-reject snímky) · `moderation-image-staging` (privátní immutable originály před AI / publikací) · `moderation-image-renditions` (privátní Sharp WebP varianty 1024/512 px, jen service_role).

---

### `profiles` — kdo jsi na webu

Jeden řádek = jeden účet. `id` = stejné UUID jako v Auth.

| Atribut | Co v něm najdeš |
|---------|-----------------|
| `id` | UUID uživatele (= `auth.users.id`) |
| `profile_no` | Lidské číslo profilu (pořadí) |
| `nickname` | Přezdívka (unikátní) |
| `name`, `surname`, `email`, `phone`, `avatar_url` | Základní údaje |
| `is_company`, `company_name`, `company_ico`, `company_ico_verified` | Firemní profil / IČO |
| `age_confirmed_at`, `vop_accepted_at`, `vop_version`, `marketing_consent_at` | Souhlasy při registraci |
| `role` | `user` / `moderator` / `admin` |
| `created_at`, `updated_at` | Časové značky |

---

### `posts` — samotný inzerát

Hlavní tabulka. Kategorie žijí jako textové sloupce — taxonomie je v kódu (`categories.ts` / `categories-goods.ts`), ne v DB. Od `070`: flat domény `auto` · `detsky` · `dum` · `elektro` · `moda` · `sport` · `hobby` · `ostatni` + `sluzby` · `prace` · `nemovitost` · `udalost` (bez `zbozi`).

| Skupina | Atributy | Co v nich najdeš |
|---------|----------|------------------|
| Identita | `id`, `user_id`, `slug` | ID inzerátu, majitel, URL slug |
| Text | `title`, `description` | Publikovaný název a popis (max 80 / 2000) |
| AI originál | `original_title`, `original_description`, `description_ai_assisted` | Text před AI / jestli uživatel vzal AI verzi |
| SEO | `meta_description`, `image_alt`, `main_image_url`, `search_vector` | Meta, alt, náhledová URL, fulltext (**bez diakritiky** — `071` + `immutable_unaccent`) |
| Zařazení | `category_type`, `subcategory_slug`, `condition_label` | Typ, podkategorie, stav/typ nabídky |
| Cena | `price_type`, `price_amount`, `exchange_for` | Typ ceny, částka, text výměny |
| Místo | `location_text`, `location` | Text lokality + PostGIS bod |
| Kontakt | `show_contact_email`, `show_contact_phone`, `contact_phone` | Co smí odhalit „Zobrazit kontakt“ |
| Práce | `job_cv_required` | Zda inzerát práce chce CV |
| Životní cyklus | `status`, `status_reason_code`, `deletion_reason`, `expires_at`, `listing_duration_days`, `event_date`, `external_url`, `renew_count`, `expiry_warning_for_expires_at`, `listing_quota_consumed` | draft→active…, proč blocked, důvod smazání majitelem (`069`), expirace, událost, volitelný https odkaz (`077`) |
| Ostatní | `payment_status`, `view_count`, `created_at`, `updated_at` | Platba (free/paid), zobrazení |

**`status`:** `draft` · `active` · `archived` · `hidden` · `blocked` · `deleted`  
**`status_reason_code` (typicky u blocked):** `reports_threshold` · `moderation` · `lifetime_max` · `account_blacklist`  
**`deletion_reason` (u `deleted`):** např. `sold_on_zapikolou` / `other` — exit poll u zboží (`069`)

---

### `post_images` — fotky

| Atribut | Co v něm najdeš |
|---------|-----------------|
| `id`, `post_id` | Vazba na inzerát |
| `storage_path`, `url` | Cesta v bucketu `post-images` + veřejná URL |
| `sort_order`, `is_main` | Pořadí (0–5), která je hlavní (náhled) |
| `created_at` | Kdy nahráno |

---

### `comments` — legacy

Diskuse pod inzerátem se **nepoužívá**. Tabulka může zůstat; nové UI na ni nestav.

| Atribut | Poznámka |
|---------|----------|
| `id`, `post_id`, `user_id`, `author_nickname`, `body`, `status`, `created_at` | `status`: `active` / `hidden` |

---

### Engagement a limity

#### `reports` — nahlášení

| Atribut | Co v něm najdeš |
|---------|-----------------|
| `id`, `report_no` | ID + pořadové číslo |
| `target_type`, `target_post_id`, `target_comment_id` | Cíl (`post` / legacy `comment`) |
| `reporter_user_id`, `reporter_email`, `source` | Kdo hlásí; `inline` vs standalone formulář |
| `reason`, `detail_text` | Důvod + volitelný popis |
| `created_at` | Kdy |

#### `contact_reveals`

`id`, `post_id`, `viewer_user_id`, `revealed_at` — audit kliku „Zobrazit kontakt“.

#### `inquiry_events`

`id`, `inquiry_no`, `post_id`, `viewer_user_id`, `ip_address` (po čase anonymizováno), `delivered`, `created_at` — **bez textu poptávky**.

IP anonymizace: cron `/api/cron/anonymize-inquiry-ips` → RPC `anonymize_old_inquiry_ips(7)` (migrace **050**). Ověřovací SELECT-y níže v [SQL — anonymizace IP u poptávek](#sql--anonymizace-ip-u-poptávek-inquiry_events).

#### `listing_views`

`id`, `view_no`, `post_id`, `viewer_user_id`, `viewer_key`, `ip_hash`, `viewed_at` — zobrazení detailu (dedup).

#### `rate_limits`

`id`, `user_id`, `action_type` (`ai_check` / `suggest_from_photos` / …), `count`, `window_start` — hodinová okna limitů (přihlášený). Hosté a veřejné akce: `anonymous_rate_limits` (`guest_suggest_from_photos`, `guest_ai_preview`, `guest_upload`, `guest_visitor_mint`, `guest_ai_spend`, `mapy_suggest`, `mapy_rgeocode`, `resend_signup_verification`). Mapy proxy: hashed IP, 60 suggest / 20 rgeocode za hodinu. Resend ověření: denně rotující hash IP i e-mailu, 10/h/IP + 3/h/e-mail. `guest_ai_spend` (40/h) a `guest_ai_spend_day` (300/den UTC) na klíči `global:guest_ai`. IP pro limity: `x-vercel-forwarded-for` → `x-real-ip` → XFF zprava (`src/lib/security/client-ip.ts`).

---

### Moderace a publikace

#### `moderation_approvals` — token na `active`

Bez platného tokenu inzerát zůstane `draft`.

| Atribut | Co v něm najdeš |
|---------|-----------------|
| `token` | UUID tokenu (klient → Server Action) |
| `user_id`, `image_count` | Kdo + kolik fotek |
| `content_fingerprint`, `image_hashes` / `new_image_hashes` | Vazba na přesný text a fotky |
| `main_image_index` | Index hlavní fotky při schválení (−1 = bez fotek; migrace `067`) |
| `created_at`, `expires_at`, `consumed_at` | TTL ~30 min, jednorázové spotřebování |

#### Storage — AI fotky (067 / 068)

| Bucket | Účel | Kdo smí |
|--------|------|---------|
| `moderation-image-staging` | Immutable originál (≤ 1 MB) před AI a publikací | `authenticated` INSERT/SELECT jen vlastní `userId/…`; bez UPDATE/DELETE |
| `moderation-image-renditions` | Sharp WebP pod `{userId}/{sha256}/gemini.webp` a `sightengine.webp` | jen `service_role` |

Úklid: cron `/api/cron/purge-moderation-image-staging` (24 h). Publish zkopíruje staging → `post-images`.

#### `moderation_checks` — log AI

Každé volání Edge Function: publish moderace (náhled / `issueApproval`) i photo-prefill (`intent = suggest_from_photos`). Migrace **076**: actor = `user_id` **nebo** `guest_visitor_id` (check constraint).

| Skupina | Atributy |
|---------|----------|
| Identita | `log_no`, `user_id` (nullable od 076), `guest_visitor_id` (076), `created_at`, `intent` |
| Výsledek | `status` (`APPROVED` / `REJECTED` / `NEEDS_QUESTIONS`), `category_type`, `subcategory_slug`, `image_count` |
| Zamítnutí | `rejected_topic_id`, `rejection_reason`, `error_code`, `title_preview`, `rejected_image_index` |
| Návrh kategorie | `category_fit`, `suggested_category_type`, `suggested_subcategory_slug`, `category_taxonomy_hint` |
| Audit AI | `sightengine_responses`, `prompt_version`, `ai_provider`, `ai_model`, `used_fallback`, `policy_hash`, `input_fingerprint`, `image_hashes` |

#### `moderation_hard_reject_evidence` — před Gemini

| Atribut | Co v něm najdeš |
|---------|-----------------|
| `id`, `evidence_no`, `user_id`, `created_at` | Kdo / kdy |
| `kind` | `hard_hit_text` / `nsfw_image` / `sightengine_unavailable` / `hard_reject_threshold_reached` |
| `matched_category`, `matched_term`, `reason`, `title_snippet` | Proč |
| `storage_path`, `image_index`, `sightengine_responses` | Fotka v `moderation-evidence` + JSON Sightengine |

---

### God Mode a compliance

#### `audit_events`

Append-only systémový log (ne engagement).

| Atribut | Co v něm najdeš |
|---------|-----------------|
| `event_no`, `created_at` | Pořadí + čas |
| `entity_type`, `entity_id` | `post` / `profile` + ID |
| `event_type`, `actor_user_id`, `actor_role` | Co se stalo a kdo (nebo systém) |
| `payload` | JSONB detail (from/to status, reason…) |

#### `moderator_note_kinds` / `moderator_notes`

Číselník typů (`code`, `label`, …) a poznámky staff: `note_no`, `entity_type`, `entity_id`, `kind_code`, `body`, `author_user_id`, `created_at`, `updated_at`.

#### `account_blacklist`

Hard-stop podle e-mailu: `email`, `reason`, `source` (`automatic` / `manual`), `created_by`, soft unban přes `removed_at` / `removed_by` / `removed_reason`.

#### `account_deletion_events`

Audit smazání: `target_profile_no`, `target_user_id`, `actor_id`, `source` (`self` / `admin`), `reason_code`, `reason_note`.

#### `gdpr_retention_warnings`


Že už šel varovný e-mail před smazáním neaktivity: PK `(user_id, last_sign_in_at_snapshot)`, `warned_at`.

---

### Category SEO

#### `category_seo_pages` *(072, seed `075`)*

SEO stav a copy kategoriálních landings. **Taxonomie zůstává v** `categories.ts` — tady jen slug 1:1 + meta. Seed Vlny 1 = `072`; `hracky-miminka` = migrace `075`.

| Atribut | Co v něm najdeš |
|---------|-----------------|
| `slug` | PK = goods subcategory slug (např. `kola-kolobezky`) |
| `page_no` | Lidské pořadí řádku |
| `kind` | `subcategory` / `category_type` |
| `description`, `meta_title`, `meta_description` | Úvodní text + SERP (ne per-request AI) |
| `index_status` | `index` / `noindex` — čte `generateMetadata` i sitemap |
| `listing_count` | Povinný snapshot z denního cronu |
| `above_threshold_since`, `below_threshold_since` | Hystereze 3 / 14 dní |
| `updated_at` | Poslední sync |

RLS: veřejný SELECT; zápis jen service_role (cron `/api/cron/category-seo-index`).

---

### Kvóty inzerátů

#### `listing_packages`

Katalog balíčků: `slug`, `display_name`, `listing_quota`, `price_cents`, `is_active`, `is_purchasable`, `is_signup_grant`, …

#### `user_listing_entitlements`

Přidělené kredity: `user_id`, `package_id`, `listing_quota`, `granted_at`, `granted_by`, `note`, `expires_at`.

#### `bank_payments` *(plán)*

Intent bankovní platby + párování Fio — popsáno v PRD §12; migrace v repo zatím není.

---

### Co v DB záměrně není

| Nehledej | Proč |
|----------|------|
| Tabulku kategorií | Jen `categories.ts` + textové sloupce u `posts` |
| `login_events` / `last_login_at` v profiles | `auth.users.last_sign_in_at` |
| Tělo poptávky | Jen e-mail přes Resend; v DB metadata `inquiry_events` |

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
| Database → Roles | Kontrola RLS a grantů | Po změně policies — nestačí; viz **Před releasem grantů / RLS** |

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

**Nasazení AI Edge Functions (sync + deploy dotčených funkcí):**

```powershell
npm run sync:moderation
npx supabase functions deploy moderate-listing
npx supabase functions deploy suggest-listing-from-photos
npx supabase functions deploy compare-suggest-from-photos
```

| Příkaz | Vysvětlení |
|--------|------------|
| `npx supabase functions list` | Vypíše nasazené funkce |
| `npx supabase functions logs moderate-listing` | Logy publish moderace (debug) |
| `npx supabase functions logs suggest-listing-from-photos` | Logy photo-first prefillu (debug) |
| `npx supabase functions logs compare-suggest-from-photos` | Logy staff prefill labu (debug) |
| `npx supabase functions serve moderate-listing` | Lokální běh — vyžaduje Docker + `supabase start` |

**Funkce v projektu:**

| Funkce | Účel |
|--------|------|
| `moderate-listing` | Publish gate: pre-Gemini NSFW/hard-hit → Gemini kontrola → approval token při publikaci |
| `suggest-listing-from-photos` | Photo-first prefill zboží na `/inzerat/novy`: z 1–2 fotek návrh title/description/kategorie (Sightengine → Gemini). Nezasahuje do publish gate. Loguje do `moderation_checks` s `intent = suggest_from_photos` (včetně guest, migrace `076`). |
| `compare-suggest-from-photos` | Staff-only lab: stejný suggest prompt/schema, dvě sekvenční volání modelu (UI `/mod/prefill-lab`). Bez DB logu, bez Sightengine, bez rate_limit tabulek. |

### SQL — přehled AI / NSFW kontrol

Plné SELECTY a vysvětlení tabulek: [`Metodika.md` §6.12](./Metodika.md#612-sql--přehled-kontrol-v-supabase).

| Tabulka | Účel | Inkrementální ID |
|---------|------|------------------|
| `moderation_checks` | Log každého volání Edge Function (status, error_code, title_preview) | `log_no` |
| `moderation_hard_reject_evidence` | Hard-hit text, NSFW fotka, Sightengine výpadek, threshold 3×/24h | `evidence_no` |
| `account_blacklist` | Hard stop e-mail (auto/manual), soft unban | `blacklist_no` |

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

**Počet hard-hitů jednoho účtu** (hard stop = 3× `hard_hit_text` / `nsfw_image` za 24 h; Gemini reject se nepočítá). Nahraď e-mail:

```sql
-- Součet za 24 h + celkem podle kind
SELECT
  e.kind,
  count(*) FILTER (WHERE e.created_at >= now() - interval '24 hours') AS za_24h,
  count(*) AS celkem
FROM public.moderation_hard_reject_evidence e
JOIN public.profiles p ON p.id = e.user_id
WHERE p.email = 'TVUJ@EMAIL.cz'
  AND e.kind IN ('hard_hit_text', 'nsfw_image', 'hard_reject_threshold_reached')
GROUP BY e.kind
ORDER BY e.kind;

-- Detail posledních hitů
SELECT e.created_at, e.kind, e.matched_category, e.matched_term, e.title_snippet
FROM public.moderation_hard_reject_evidence e
JOIN public.profiles p ON p.id = e.user_id
WHERE p.email = 'TVUJ@EMAIL.cz'
ORDER BY e.created_at DESC
LIMIT 20;

-- Je účet na blacklistu?
SELECT blacklist_no, email, source, reason, created_at, removed_at
FROM public.account_blacklist
WHERE email = lower(trim('TVUJ@EMAIL.cz'))
ORDER BY created_at DESC;
```

### SQL — anonymizace IP u poptávek (`inquiry_events`)

GDPR §3.2: po **7 dnech** IPv4 → `x.x.x.0`, jinak `anonymized`. Cron `/api/cron/anonymize-inquiry-ips`, RPC `anonymize_old_inquiry_ips`, migrace **050**, `IP_ANONYMIZE_AFTER_DAYS`.

```sql
-- Čerstvé (< 7 dní) — plná IPv4 je v pořádku (rate-limit)
SELECT inquiry_no, ip_address, created_at,
  now() - created_at AS age
FROM public.inquiry_events
WHERE created_at >= now() - interval '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Starší než 7 dní — IPv4 má končit na .0, jinak 'anonymized'
SELECT inquiry_no, ip_address, created_at
FROM public.inquiry_events
WHERE created_at < now() - interval '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Kolik starých řádků ještě NENÍ anonymizovaných (po cronu = 0)
SELECT count(*) AS still_raw
FROM public.inquiry_events
WHERE created_at < now() - interval '7 days'
  AND ip_address IS NOT NULL
  AND trim(ip_address) <> ''
  AND ip_address <> 'anonymized'
  AND ip_address !~ '^[0-9]{1,3}(\.[0-9]{1,3}){2}\.0$';

-- Ruční spuštění (vrátí počet právě upravených řádků)
-- SELECT public.anonymize_old_inquiry_ips(7);
```

### SQL — rate limity (AI moderace / prefill)

Přihlášený: `rate_limits`. Host: `anonymous_rate_limits` (hashed subject, ne nickname).

```sql
-- Přihlášený: limity + přezdívka (odkomentuj filtr pro prefill)
SELECT a.*, p.nickname
FROM public.rate_limits a
LEFT JOIN public.profiles p ON p.id = a.user_id
WHERE 1 = 1
-- AND a.action_type = 'suggest_from_photos'
-- AND a.action_type = 'ai_check'
ORDER BY a.window_start DESC;

-- Host prefill (anonymní)
SELECT *
FROM public.anonymous_rate_limits
WHERE action_type = 'guest_suggest_from_photos'
ORDER BY window_start DESC
LIMIT 50;
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
| `npm run sync:moderation` | Sync pravidel a promptů → `supabase/functions/_shared/` — **potom** deploy `moderate-listing` a/nebo `suggest-listing-from-photos` (viz tabulka „Kdy deployovat“) |

---

## Checklist po změně backendu

| Změnil jsi… | Udělej |
|-------------|--------|
| Nový soubor `supabase/NNN_*.sql` | SQL Editor na produkci + commit + PRD hlavička + **aktualizuj § Schéma databáze** v tomto souboru |
| Granty, RLS, SECURITY DEFINER, nový sloupec na `posts` | Kontrolní dotazy [Před releasem grantů / RLS](#před-releasem-grantů--rls) na produkci |
| Nová tabulka / sloupec / enum | Stejně — lidský popis atributů v § Schéma databáze (skill ukončení práce) |
| `prohibited-topics.ts` / AI prompty / `categories.ts` | `npm run sync:moderation` + deploy `moderate-listing` (a při sdílených změnách i `suggest-listing-from-photos`) |
| Prefill (`suggest-listing.ts`, `suggest-from-photos.ts`, Edge `suggest-listing-from-photos`) | `npm run sync:moderation` + `npx supabase functions deploy suggest-listing-from-photos` |
| Prefill lab (`compare-suggest-from-photos`, `/mod/prefill-lab`) | `npx supabase functions deploy compare-suggest-from-photos` (+ sync pokud měníš `run-suggest-listing` / taxonomii) |
| `.env.local` (jen lokál) | Nic na Supabase — jen restart `npm run dev` |
| `CRON_SECRET` (Vercel) | Nastavit ve Vercelu, ne v Supabase — viz `vercel.json` |
| Service role klíč | Jen server / Edge — **nikdy** `NEXT_PUBLIC_*` |

---

## Časté chyby

| Problém | Pravděpodobná příčina | Řešení |
|---------|----------------------|--------|
| Moderace / prefill vrací stará pravidla | Chybí deploy po syncu | `npm run sync:moderation` + deploy `moderate-listing` a/nebo `suggest-listing-from-photos` |
| `Publishing requires moderation approval` | Publish gate (027) — chybí approval token | Normální flow přes AI modal |
| `GEMINI_BLOCKED_*` | Google safety filtr | Viz `moderace-inzeratu.md` — `geminiSafe` prompt |
| Migrace selže na `ADD VALUE` enum | Hodnota už existuje | `IF NOT EXISTS` (viz 036) nebo přeskoč řádek |
| App nevidí nový sloupec | Migrace neběžela / chybí column `GRANT SELECT` (078/079) | Ověř Table Editor + allowlist v poslední grant migraci (`079_…`) |
| Po grantu stejný limit v profilu | Špatné UUID / migrace 038 neběžela | `SELECT * FROM get_user_listing_quota('UUID')` |
| `Only admins can change user roles` | Bootstrap admina bez vypnutí triggeru | Postup § Nastavení admina — `DISABLE TRIGGER` → `UPDATE` → `ENABLE TRIGGER` |

---

## Rychlé odkazy

| Dokument / soubor | Obsah |
|-------------------|--------|
| **§ Schéma databáze** (tento soubor) | Lidský přehled tabulek a atributů |
| [`moderace-inzeratu.md`](./moderace-inzeratu.md) | Deploy moderace, secrets, migrace 025–027 |
| [`Metodika.md`](./Metodika.md#11-moderátoři-a-administrátoři-god-mode) | God Mode, role admin/moderátor |
| [`PRD_v3.md`](./PRD_v3.md) §4 | Kanonický datový model produktu |
| [`supabase/`](./../supabase/) | Číslované migrace |
| [`supabase/038_listing_quota.sql`](../supabase/038_listing_quota.sql) | Balíčky inzerátů, lifetime limit |
| [`supabase/039_listing_quota_lifetime.sql`](../supabase/039_listing_quota_lifetime.sql) | Oprava na lifetime model (pokud 038 běžela dřív) |
| [Supabase CLI docs](https://supabase.com/docs/guides/cli) | Oficiální dokumentace |
