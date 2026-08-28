# Bezpečnostní audit zaPikolou.cz

**Datum:** 28. 8. 2026
**Rozsah auditu:** kód (`src/`, migrace 000–077, Edge Functions, `next.config.ts`, `vercel.json`) + dump oprávnění/policies z produkční DB + produkční logy
**Oprava P0:** migrace `078_posts_column_select_grants.sql` — nasazena a ověřena na produkci 28. 8. 2026 (SQL Editor + hledání „teploměr“ na webu)
**Stav dokumentu:** PRD v3.85; P0 zavřený pro `anon`; fáze 2 (`authenticated` + `location` / `original_*`) otevřená

---

## Shrnutí

Audit našel **jednu kritickou zranitelnost** (P0), opravenou migrací 078 a ověřenou na produkci, a **pět středních** nálezů (M1–M5), které zůstávají otevřené.

Kritický nález nebyl viditelný z kódu. Migrace vypadala správně a code review ji označilo za dobrou praxi. Odhalil ho až dotaz na oprávnění nasazené databáze. **To je hlavní poučení celého auditu:** u oprávnění a RLS se kód nesmí brát jako zdroj pravdy.

Zbytek codebase je na projekt vzniklý „vibe codingem" nadprůměrně obezřetný — viz sekci [Co je udělané dobře](#co-je-udělané-dobře). Nic z nalezeného neumožňovalo převzetí cizího účtu ani dump databáze.

---

## P0 — Únik osobních údajů přes PostgREST

**Závažnost:** kritická
**Stav:** OPRAVENO na produkci migrací `078_posts_column_select_grants.sql` (28. 8. 2026). Ověření: `anon` + `contact_phone`/`location`/`original_description` → `42501`; `anon` + `slug,title` → OK; `get_nearby_posts` vrací jen `active`; `search_posts('teplomer')` žije; na webu hledání „teploměr“ ukáže inzerát s oblastí, ne GPS.

### Co bylo špatně

Role `anon` — tedy kdokoli s veřejným Supabase klíčem, který je záměrně součástí klientského bundlu — mohla přes PostgREST přečíst **všechny sloupce** veřejně viditelných inzerátů:

| Sloupec | Co obsahoval | Proč to vadí |
|---|---|---|
| `contact_phone` | telefonní číslo zadavatele | obcházelo opt-in flag `show_contact_phone`, denní limit 20 v `reveal_listing_contact` i audit log `contact_reveals` |
| `location` | přesný PostGIS bod s metrovou přesností | UI schválně zobrazuje jen přibližnou oblast (`formatPublicAreaLocation`); u člověka prodávajícího z domova jde o jeho adresu |
| `original_title`, `original_description` | text před `stripContactInfo()` | kontakty odstraněné z publikovaného popisu tam zůstaly |

Stačil jediný GET požadavek. Žádný exploit, žádné přihlášení.

```
GET /rest/v1/posts?select=slug,title,contact_phone&contact_phone=not.is.null
```

RLS (`posts_select_public`) omezila **řádky** na veřejně viditelné inzeráty — což je přesně množina, o kterou by útočník stál. Sloupce neomezila nic.

### Příčina

Migrace `006_table_grants.sql` udělila oprávnění na úrovni celé tabulky:

```sql
GRANT SELECT ON public.posts TO anon, authenticated;
```

Migrace `025_contact_privacy_hardening.sql` se to později pokusila zúžit:

```sql
REVOKE SELECT (contact_phone) ON public.posts FROM anon, authenticated;
```

**Tenhle příkaz je no-op.** PostgreSQL neodebere sloupcové privilegium, které plyne z grantu na celou tabulku — příkaz projde s warningem a nezmění nic. Aby zúžení fungovalo, musí se nejdřív odebrat table-level grant a nahradit explicitním výčtem sloupců.

Kód se přitom četl správně. Komentář v migraci mluvil o „column-level pojistce", protože „RLS filtruje řádky, ne sloupce" — což je pravda. Jen ten příkaz nedělal, co se od něj čekalo.

### Jak se to našlo

```sql
select grantee, privilege_type
from information_schema.column_privileges
where table_schema='public' and table_name='posts' and column_name='contact_phone';
```

Vrátilo `anon | SELECT` a `authenticated | SELECT`. Potvrzeno runtime testem:

```sql
set local role anon;
select id, slug, contact_phone, st_astext(location::geometry), original_description
from public.posts where contact_phone is not null limit 3;
reset role;
```

Vrátilo reálná telefonní čísla a souřadnice s metrovou přesností.

### Oprava

Migrace `078_posts_column_select_grants.sql`:

1. `REVOKE SELECT ON public.posts FROM anon, authenticated`
2. `GRANT SELECT (<explicitní výčet>)` zvlášť pro každou roli
3. `contact_phone` nedostala **ani jedna** role — čtení jde výhradně přes `get_owned_post_contact_phone()` (vlastník) a `reveal_listing_contact()` (návštěvník, s limitem a auditem)
4. `INSERT/UPDATE/DELETE` zůstávají table-level, takže zápis `contact_phone` při zakládání inzerátu funguje dál

Allowlist byl sestaven z reálných dotazů aplikace: `POST_DETAIL_COLUMNS`, `MY_LISTING_COLUMNS`, `EDIT_COLUMNS`, dotazy v `/mod`, category-SEO, sitemap, llms.txt a server actions.

**Vedlejší efekt:** `get_nearby_posts` a `search_posts` byly `SECURITY INVOKER` a čtou `location` / `search_vector`. Po odebrání těch sloupců by homepage a hledání spadly na `42501`. Migrace je převádí na `SECURITY DEFINER`.

To je bezpečné, protože **obě mají filtr viditelnosti explicitně v těle** — `is_post_publicly_visible(p.status, p.expires_at)`, u `get_nearby_posts` jak v počítacím loopu, tak v `RETURN QUERY`. Ověřeno před nasazením; bez toho by DEFINER obešel RLS a homepage by začala servírovat drafty a blokované inzeráty.

`get_recent_posts` zůstává `INVOKER` — čte jen `location_text`, který v allowlistu je.

### Zbývá dořešit (fáze 2)

**Stav:** kód + migrace `079_posts_edit_private_rpc.sql` v repu (28. 8. 2026). Na produkci platí až po Run 079 v SQL Editoru **a** deploy Next.js (pořadí: nejdřív appka, hned 079 — opačně rozbije `/upravit` na živém kódu, který ještě selectuje `location`).

Přihlášený uživatel si přes REST **do nasazení 079** stále přečte `location` a `original_*` u cizího veřejného inzerátu.

Řešení v 079: RPC `get_post_edit_private_fields` (`user_id = auth.uid() OR is_moderator_or_admin()`), pak výhození těch sloupců z `authenticated` allowlistu.

---

## Rozsah incidentu

**Období:** 21.–28. 8. 2026 (7 dní — maximum retence logů na tarifu PRO)

Prohledány produkční Edge logy, které obsahují celé URL včetně `?select=`.

| Hledaný vzor | Nálezů | Vyhodnocení |
|---|---|---|
| `%2Ccontact_phone` | **0** | o telefonní čísla si nikdo nepožádal |
| `original_description` | 33 | všech 33 vlastní aplikace |
| `select=*` | 132 | všechny `HEAD /rest/v1/listing_views` — počítadlo v `assertListingViewRateLimit`; **nula na `/rest/v1/posts`** |
| `select=%2A` | 0 | — |

Rozbor těch 33 nálezů:

- **User-agent `node` u všech 33** — tedy Next.js server na Vercelu. Žádný prohlížeč, `curl` ani skript.
- **Každý dotaz `slug=eq.<jeden konkrétní slug>`.** Nula dotazů bez filtru, nula s `limit` nebo `offset` — žádný hromadný sběr.
- 12 různých inzerátů, 4 přihlášené účty.
- 20× staff cesta (bez `user_id` filtru — God Mode), 13× vlastník. **U všech 13 vlastnických dotazů `user_id` filtr odpovídá přihlášenému účtu.** Nula nesrovnalostí.
- Seznam sloupců se v čase mění spolu s deploy historií: do 23. 8. 19:39 bez `external_url`, od 23. 8. 22:06 s ním (migrace 077). Cizí scraper by se v rytmu nasazení nevyvíjel.

### Závěr k incidentu

> **Chyba potvrzena, zneužití v dostupném období nenalezeno, starší období nelze ověřit kvůli retenci logů.**

Zranitelnost existovala od začátku projektu. Logy sahají 7 dní zpět; za tuto hranici data neexistují a nelze je získat. Toto je faktické konstatování technického stavu, nikoli právní posouzení.

### Past při hledání v logu

Dvě záludnosti, které při opakování kontroly stojí za připomenutí:

- Hledání `contact_phone` vrátí stovky falešných nálezů, protože **`show_contact_phone` ho obsahuje jako podřetězec.** Hledej `%2Ccontact_phone` (URL-kódovaná čárka před názvem).
- Stejná past u `location` vs `location_text`. `location` samostatně nehledej — `EDIT_COLUMNS` ho čte legitimně.

---

## Otevřené nálezy

Seřazeno podle priority. Žádný z nich neumožňuje převzetí účtu ani přístup k datům; jde o provozní rizika a chybějící obranné vrstvy.

### M1 — Rate limiting stojí na hlavičce, kterou si volí klient

**Soubory:** `src/lib/inquiry/client-ip.ts`, `readRequestIp()` v `src/lib/security/turnstile.ts`, `readClientIp()` v `supabase/functions/{moderate-listing,suggest-listing-from-photos}/index.ts`

Všechny tři čtečky berou **první** prvek `x-forwarded-for` (`split(",")[0]`). Ten je klientem ovlivnitelný.

Padnou tím: guest AI limity (5/h), guest upload (30/h), poptávkový limit (20/den + 3 na inzerát/den), listing-view limit.

**Fix:** jeden sdílený helper. Web běží na Vercelu, Cloudflare je jen DNS (šedý cloud, provoz jde přímo na Vercel) → pořadí `x-vercel-forwarded-for` → `x-real-ip` → XFF čtený **zprava** jako fallback pro lokální dev. `cf-connecting-ip` je mrtvá větev, provoz přes CF proxy nejde.

### M2 — Guest visitor token lze mintovat donekonečna

**Soubor:** `src/app/actions/guest-moderation.ts`

`bootstrapGuestVisitor()` je neautentizovaná server action, která na požádání vydá nový `visitorId` a jeho HMAC podpis. Podpis dokazuje „server to vydal", ne stabilní identitu — bez cookie dostaneš nové ID i nový podpis.

Visitor-polovina rate limitu je tím pádem neúčinná. Drží jen IP-polovina, kterou podkopává M1. **Dohromady M1 ∧ M2 = žádný efektivní strop na placená AI volání** (Gemini, Sightengine, OpenAI fallback): nový visitor + zvolená IP → vždy pod soft limitem → Turnstile se vůbec nespustí.

Navíc: `assertGuestUploadRateLimit` posílá `p_captcha_verified: true` natvrdo, takže eskalace na captchu je u uploadu trvale vypnutá.

**Fix:** rate-limitovat i samotný mint (na IP, po opravě M1), vynutit cookie-reuse, opravit ten hardcoded flag. **A hlavně přidat globální hodinový/denní strop na útratu za AI napříč všemi guesty** — circuit breaker. Per-identita limity ztrátu neohraničí, protože anonymnímu návštěvníkovi trvalou identitu nepostavíš.

*Poznámka: vázat podpis na IP je slepá ulička — mobilní sítě a CGNAT rotují IP uprostřed relace, rozbilo by to legitimní uživatele v tom nejdůležitějším flow.*

### M3 — Turnstile je implementovaný, ale v Next.js se nikdy nevolá

**Soubor:** `src/lib/security/turnstile.ts`

`verifyTurnstileTokenServer()` má **nula volání** v celém `src/`. Mrtvý kód. CAPTCHA běží pouze v Edge Functions pro guest AI, a to až po překročení soft limitu.

Bez ochrany tedy jsou:

- `signInWithEmail` — credential stuffing, jen defaultní GoTrue limity
- `signUpWithEmail`, `requestPasswordReset`
- **`resendSignupVerificationEmail`** — nejslabší místo: bere **libovolný e-mail od nepřihlášeného** a nemá vlastní rate limit. E-mail bombing na cizí adresu.
- `/api/inquiry` — honeypot a rate limit ano, CAPTCHA ne. Ve spojení s M1 spam z tvé Resend domény na e-maily zadavatelů.

**Fix:** nasadit ho, prioritně na `resendSignupVerificationEmail` a `/api/inquiry`, poté login/signup.

### M4 — Chybí bezpečnostní HTTP hlavičky

**Soubory:** `next.config.ts` (bez `headers()`), `src/middleware.ts`

Chybí CSP, `X-Frame-Options` / `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`. Vercel dodá HSTS, zbytek ne.

Přímý dopad je dnes nízký — auth cookie od `@supabase/ssr` má `SameSite=Lax`, takže v cizím iframu session většinou nejede a clickjacking na destruktivní akce nefunguje. Hodnota je preventivní: **CSP je levná záchranná síť, která odpustí jednu budoucí XSS.**

Doporučení: nasadit `Content-Security-Policy-Report-Only`, chvíli sbírat, pak zpřísnit.

### M5 — Změna hesla bez ověření stávajícího

**Soubor:** `src/app/actions/auth.ts` → `updatePassword()`

Vyžaduje jen platnou session. Kdo ji získá (ukradená cookie, nezamčený počítač, budoucí XSS), přepíše heslo a převezme účet. Chybí i `signOut({ scope: "global" })` po změně.

Recovery flow staré heslo chtít **nesmí** — je potřeba rozlišit „obnova zapomenutého hesla" od „změna hesla v nastavení účtu" a v druhém případě staré heslo vyžadovat.

### Drobné

| # | Nález | Soubor |
|---|---|---|
| L1 | `loadAccountBlacklist()` je exportovaná server action bez `requireStaff()`. Zachraňuje to jen RLS a granty. | `src/app/actions/account-blacklist.ts` (~ř. 131) |
| L2 | Breadcrumb JSON-LD jde do `dangerouslySetInnerHTML` bez escapování `<`. `serializeListingJsonLd` to dělá správně, tohle místo ne. Zdroj je `category_seo_pages` (zapisuje service role), takže dnes bez dopadu. | `src/app/[slug]/page.tsx` (~ř. 110) |
| L3 | `LegalMarkdown` nefiltruje schéma odkazu — `[text](javascript:…)` by prošlo do `href`. Zdroj je repo markdown, takže dnes bez dopadu. Filtr na `http(s):` / `/` je 5 řádků. | `src/components/legal/LegalMarkdown.tsx` |
| L4 | `.gitignore` ignoruje jen `.env*.local`. Soubor `.env` nebo `.env.production` by se do gitu dostal. | `.gitignore` |
| L5 | `SUPABASE_SERVICE_ROLE_KEY` jako fallback HMAC secret. Nezneužitelné (jen SHA-256), ale zbytečně rozšiřuje okruh míst s master klíčem. Nastavit `LISTING_VIEW_HASH_SECRET`. | `src/app/api/listing-view/route.ts` |
| L6 | Bucket `post-images` je veřejný. Fotky skrytého inzerátu zůstanou dostupné, kdo zná URL, dokud neproběhne cleanup trigger. Cesty jsou UUID. U marketplace běžné — přijmout, nebo signed URL pro non-active. | `supabase/002` |

---

## Co je udělané dobře

Tohle není zdvořilost — je to důvod, proč žádný z nálezů neznamená „ukradený účet":

- **RLS zapnutá na všech 22 aplikačních tabulkách.** Ověřeno na produkci, ne jen v migracích.
- **`rate_limits`, `anonymous_rate_limits`, `moderation_approvals`, `gdpr_retention_warnings`** — RLS zapnutá a nula grantů pro anon/authenticated. Deny-all, fail-closed. Oprava SEC-H03 v produkci drží.
- **PII disciplína:** e-mail zadavatele jen přes `reveal_listing_contact()` — SECURITY DEFINER, kontroluje viditelnost inzerátu, opt-in flag, denní limit 20 a zapisuje do `contact_reveals`.
- **Všech ~40 SECURITY DEFINER funkcí má `SET search_path`.** Bez výjimky. Nikde žádné dynamické SQL (`EXECUTE format`) → SQL injection nemá kudy.
- **Staré overloady `publish_approved_post` a `issue_moderation_approval` jsou explicitně `DROP FUNCTION`, ne jen přepsané.** Ověřeno na produkci: jediný `publish_approved_post`, ACL `service_role=X`. Kdyby starý podpis přežil s grantem pro `authenticated`, šlo by publikovat mimo moderaci. Tohle přehlédne většina projektů.
- **Publish gate:** obsahový fingerprint + SHA-256 všech Storage objektů, publish RPC jen pro service_role, staging bucket bez UPDATE/DELETE policy (anti-TOCTOU). `posts_insert_own` WITH CHECK `status='draft'` ověřeno v produkci.
- **Upload:** magic bytes místo klientského MIME, `sharp` s `limitInputPixels: 40M`, privátní buckety s MIME whitelistem a size limitem.
- **Cron endpointy:** `Authorization: Bearer CRON_SECRET`, fail-closed při chybějícím secretu.
- **Open redirect:** `sanitizeInternalPath()` odmítá `//`, backslash, absolutní URL i `\0`. Používá se konzistentně.
- **Prompt injection guard** kontroluje i výstup AI, nejen vstup.

---

## Trvalá pravidla, která z tohoto auditu plynou

Pravidla 3 a 4 jsou v Metodice (§2.2, §2.5, §6.10) a v `docs/supabase-prikazy.md`. Zbytek sem patří při dalším releasu grantů/RLS:

1. **Oprávnění a RLS se ověřují dotazem na nasazenou databázi, nikdy jen z migrací.** Migrace může projít a nic neudělat. Před releasem spustit kontrolní dotazy z přílohy.

2. **Column-level `REVOKE` proti table-level `GRANT` je no-op.** Zúžení přístupu ke sloupci vyžaduje odebrat grant na tabulku a nahradit ho explicitním výčtem.

3. **Nový sloupec na `posts` je pro aplikaci neviditelný, dokud nedostane `GRANT` v téže migraci.** Projeví se jako záhadný `42501` na jedné stránce. Fail-closed je záměr, ale musí se to vědět.

4. **Viditelnost inzerátů na homepage a v hledání drží od migrace 078 `WHERE` v těle funkce, ne RLS.** Kdo z `get_nearby_posts` nebo `search_posts` odstraní `is_post_publicly_visible`, obejde RLS a nic ho nezastaví. Dřív ho zastavila.

5. **Sloupcové granty jsou per-role, ne per-policy.** Co smí číst `authenticated`, smí číst každý registrovaný uživatel u každého řádku, který mu propustí RLS. Citlivé sloupce patří za SECURITY DEFINER RPC, ne za grant.

---

## Příloha — kontrolní dotazy

Spouštět v Supabase SQL Editoru před releasem a po každé migraci, která sahá na granty nebo RLS.

```sql
-- 1. Má každá veřejná tabulka zapnutou RLS?
select relname, relrowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- 2. Reálné policies (porovnat s migracemi)
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname in ('public','storage') order by 1,2,3;

-- 3. Co reálně smí anon a authenticated
select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type)
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated')
group by 1,2 order by 1,2;

-- 4. Sloupcová oprávnění u citlivých sloupců posts
-- Po 078 očekávej:
--   contact_phone          anon=false  auth=false
--   location, original_*   anon=false  auth=false  (po 079)
--   title, slug, location_text  obě true
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

Kontrola logů (Logs → Log Type `edge`, časové okno na maximum), hledat v Event message:

```
%2Ccontact_phone      -- ne samotné contact_phone, chytá show_contact_phone
original_description
select=*              -- pozor: HEAD na listing_views je legitimní počítadlo
```

---

*Audit zpracoval Claude (Anthropic) ve spolupráci s Radkem Horákem. Dokument popisuje technický stav systému; není právním posouzením povinností podle GDPR.*
