# Product Requirement Document (PRD) – Projekt: Local Hobby Market

> **Verze dokumentu:** v3.10  
> **Rozsah:** v0.1 (MVP) · v0.1.1 (Volitelná platnost) · v0.2 (Události) · v0.3 (Nemovitosti)  
> **Migrace DB:** [`003_prd_v3_7.sql`](../supabase/003_prd_v3_7.sql) · [`004_recurring_events.sql`](../supabase/004_recurring_events.sql) · [`005_damaged_goods.sql`](../supabase/005_damaged_goods.sql) · [`006_real_estate.sql`](../supabase/006_real_estate.sql)  
> **Předchozí verze:** [`PRD_v2.md`](./PRD_v2.md) · [`PRD_v2_doplneni.md`](./PRD_v2_doplneni.md)  
> **Datum:** 2026-06-29

---

## 1. Produktová vize a cíle

* **Vize:** Lokální peer-to-peer ekosystém pro rychlou inzerci zboží, služeb, nemovitostí a lokálních událostí v bezprostředním okolí uživatele. Místo, kde soused prodá přebytky medu, nabídne sekání trávy, daruje starou skříň za odvoz, prodá kolo po dítěti, pronajme byt — nebo zveřejní opékání špekáčků na zahradě.
* **Cílová skupina:** Věk 15–35 let (mobilní, digitálně gramotní, preferující rychlá lokální řešení).
* **Filozofie vývoje:** Hardcore MVP stavěné metodou AI Vibecodingu (Cursor).
* **Provozní rozpočet:** Do 1 000 Kč / měsíc. Finance jsou alokovány výhradně do stability infrastruktury, doručení e-mailů a provozu nezbytných API.

### 1.1 Definition of Done (v0.1)

MVP je hotové, když platí všechny body:

1. **Rychlost založení:** Přihlášený uživatel zveřejní inzerát (s AI flow) do **2 minut** od otevření formuláře.
2. **Lokální relevance:** Návštěvník s povolenou polohou vidí **6–9 inzerátů** v okruhu **15 km**, seřazených podle vzdálenosti.
3. **Ochrana kontaktů:** V HTML zdroji detailu inzerátu **není** telefon ani e-mail před kliknutím na „Zobrazit kontakt“ (ověřitelné v DevTools).
4. **SEO:** Detail inzerátu má server-renderovaný HTML, dynamický Title tag, JSON-LD a je v `sitemap.xml`.
5. **Moderování:** 3 nahlášení od 3 různých uživatelů skryje inzerát; moderátor ho vidí na `/mod/karantena`.

### 1.2 Definition of Done (v0.1.1 — Volitelná platnost inzerátu)

Modul je hotový, když platí všechny body:

1. **Platnost inzerátu:** Default **30 dní**; uživatel může přepsat (select nebo číselné pole, **ne slider**). Hodnota se ukládá do `listing_duration_days`.
2. **Persistence:** `expires_at` počítá **DB trigger** z `listing_duration_days` (frontend `expires_at` neposílá).
3. **Expirovaný inzerát:** Po `expires_at` není veřejně viditelný, ale **zůstává v DB** ve stavu `archived`; majitel ho vidí v klientské sekci a může obnovit.
4. **Guardrail data v popisu:** Pokud AI/frontend detekuje datum v popisu běžného inzerátu později než `now + listing_duration_days`, zobrazí varování (§9.4).
5. **Konfigurovatelné limity:** Min/max v `src/config/app.ts` (DB CHECK synchronizovaný s max hodnotou).

### 1.3 Definition of Done (v0.2 — Události)

Modul událostí je hotový, když platí všechny body:

1. **Taxonomie:** V `categories.ts` existuje `category_type = 'udalost'` se 6 podsekcemi; AI guardrail používá dedikovaný `aiPrompt`.
2. **Založení události:** Přihlášený uživatel zveřejní událost (s AI flow) do **2 minut**; povinné pole **`event_date`** (datum a čas konání); kapacita v popisu (validováno AI dotazníkem).
3. **Účast bez registrace:** Na detailu události je tlačítko **„Mám zájem o účast“**; odeslání poptávky doručí pořadateli e-mail se jménem a kontaktem účastníka.
4. **Bez nových tabulek:** Událost je řádek v `posts` s `category_type = 'udalost'`; v DB neexistuje tabulka účastníků.
5. **SEO:** Detail události má JSON-LD `Schema.org/Event` a je v `sitemap.xml`.

### 1.4 Definition of Done (v0.3 — Nemovitosti)

Modul nemovitostí je hotový, když platí všechny body:

1. **Taxonomie:** V `categories.ts` existuje `category_type = 'nemovitost'` se 6 podkategoriemi; AI guardrail používá dedikovaný `aiPrompt`.
2. **Typ transakce:** Pole `condition_label` rozlišuje **Prodej** (`sale`) a **Pronájem** (`rent`); UI label pole je „Typ transakce“.
3. **Platnost:** Stejná logika jako u `zbozi`/`sluzby` — `listing_duration_days` + trigger `expires_at` (default 30 dní).
4. **Cenové modely:** Pevná cena, Dohodou, Nabídni (bez „Za odvoz“ / „Výměnou“).
5. **Detail inzerátu:** V hlavičce se zobrazí Prodej/Pronájem vedle kategorie a podkategorie.

---

## 2. Mimo rozsah MVP (Out of Scope) — v0.1

V této verzi se **neimplementuje:**

- Chat / messaging mezi uživateli
- Platby, topování, placené prodloužení (jen DB sloupce `payment_status`, `expires_at`)
- Mobilní nativní aplikace
- Push notifikace
- Hodnocení a recenze prodejců
- Vícejazyčnost
- Komplexní admin dashboard
- Automatické překlady
- Byznys logika limitů aktivních inzerátů na uživatele (jen připraveno v `profiles`)
- SMS verifikace telefonu
- Mapa s piny inzerátů
- A/B testování
- Pokročilá anti-fraud ML vrstva nad rámec synchronního AI guardrailu
- Logování IP adres pro moderování
- Vlastní audit tabulka `login_events` / duplicitní sloupec `profiles.last_login_at` (viz §4.2)
- **Modul Události** — plánováno v [§8](#8-modul-události-v02)
- **Volitelná platnost inzerátu (1–365 dní)** — plánováno v [§9](#9-volitelná-platnost-inzerátu-v011)

---

## 2.1 Mimo rozsah v0.2 (Out of Scope) — Události

I v rámci modulu událostí se **neimplementuje:**

- Vlastní registrační formulář a tabulka účastníků / waitlist
- Enforcement kapacity (automatické uzavření po naplnění)
- Systémové follow-up zprávy od pořadatele po registraci
- Strukturovaná pole `event_starts_at`, `event_ends_at`, `capacity_max` (až v0.3+)
- Počítadlo registrovaných účastníků v UI
- Chat mezi pořadatelem a účastníky

---

## 3. High-Level Architektura & Tech Stack

* **Frontend/Backend:** Next.js (App Router), Tailwind CSS.
* **Hosting / Deployment:** Vercel (Free / Hobby tier).
* **Database & Auth:** Supabase (PostgreSQL + PostGIS extenze pro geolokaci, Supabase Auth, Supabase Storage). Přechod na Pro Tier ($25/měsíc) při ostrém startu kvůli garanci záloh a neusínání DB.
* **Geocoding API:** Mapy.cz API (Autocomplete + Geofocus). Využití bezplatného tarifu pro vývojáře, který plně pokrývá potřeby MVP.
* **AI Vrstva:** Supabase Edge Functions + **Gemini Flash** (aktuální verze API, konfigurovatelný identifikátor v `src/config/app.ts`) s fallbackem na **OpenAI GPT-4o-mini** pro real-time synchronní multimodální moderování a hydrataci obsahu. Timeout Edge Function: **30 s**.
* **Volání AI (kritické — architektura):** Edge Function `moderate-listing` se volá **striktně napřímo z frontendového klienta** přes Supabase SDK (`supabase.functions.invoke()`). **Next.js API Routes nesmí AI volání proxyovat** — na Vercel Hobby hrozí `504 Gateway Timeout` (legacy projekty bez Fluid compute: limit **10 s**; i s Fluid compute proxy zbytečně přidává latenci a závislost). API klíče k Gemini/OpenAI zůstávají výhradně v Edge Function (server-side secrets), nikdy v prohlížeči ani v Next.js route.
* **E-mailový partner:** Resend nebo Postmark (nižší placený tarif pro garantované doručení do Inboxu).
* **Analytika:** Google Tag Manager (GTM) + Google Analytics 4 (GA4) s **cookie consent bannerem** (GTM consent mode) před aktivací měření.
* **Taxonomie a kategorie:** Systém nevyužívá databázové tabulky pro kategorie (prevence zbytečných JOINů a DB administrace). Jediným zdrojem pravdy je statický soubor `src/config/categories.ts`. V DB jsou inzeráty kategorizovány pouze pomocí textových polí `category_type` (`zbozi` / `sluzby` / `udalost` od v0.2 / `nemovitost` od v0.3) a `subcategory_slug`.
* **Konfigurace aplikace:** Globální parametry (radius vyhledávání, limity rate limitingu, **platnost inzerátu** od v0.1.1) v `src/config/app.ts`. Výchozí radius: **15 km**. Výchozí platnost inzerátu: **30 dní** (rozsah 1–365, konfigurovatelný max).

---

## 4. Datový model

Kategorie zůstávají v `src/config/categories.ts`, ne v DB.

```
profiles
  - id (UUID, FK auth.users)
  - nickname (UNIQUE, NOT NULL)
  - name, surname, phone, avatar_url
  - role (ENUM: user | moderator | admin)
  - created_at, updated_at

posts
  - id, user_id (UUID, FK auth.users ON DELETE RESTRICT)
  - title (TEXT, NOT NULL, max 80 znaků v UI)
  - description (TEXT, max 1000 znaků)
  - category_type (VARCHAR(10), NOT NULL, CHECK IN ('zbozi', 'sluzby', 'udalost', 'nemovitost'))
  - subcategory_slug (VARCHAR(50), NOT NULL)
  - price_type (VARCHAR(20), NOT NULL, CHECK IN ('fixed', 'free_pickup', 'negotiable', 'exchange', 'offer'))
  - price_amount (INTEGER, nullable — povinné pouze pokud price_type = 'fixed')
  - condition_label (VARCHAR(20), NOT NULL, CHECK IN (
      'new', 'like_new', 'used', 'damaged', -- zboží
      'one_time', 'long_term', 'substitute', -- služby / události
      'sale', 'rent' -- nemovitosti
    ))
  - location_text, location (GEOGRAPHY POINT)
  - status (ENUM: draft | active | archived | hidden | deleted)
  - expires_at, renew_count, payment_status (VARCHAR(20), výchozí: 'free')
  - listing_duration_days (INTEGER, NOT NULL, DEFAULT 30 — od v0.1.1; viz §9; u `udalost` se nevyužívá)
  - event_date (TIMESTAMPTZ, NULL — od v0.2; povinné pokud `category_type = 'udalost'`)
  - main_image_url, slug
  - created_at, updated_at

post_images
  - id, post_id, url, sort_order, is_main

comments
  - id, post_id (FK posts ON DELETE CASCADE)
  - user_id (UUID, nullable, FK auth.users ON DELETE SET NULL)
  - author_nickname (VARCHAR(50), NOT NULL) — snapshot přezdívky v okamžiku INSERTu
  - body (TEXT, NOT NULL)
  - status (ENUM: active | hidden)
  - created_at

reports
  - id, target_type (post | comment), target_id
  - reporter_user_id, reason, created_at
  - UNIQUE(reporter_user_id, target_type, target_id)  -- 1 report per user per item

contact_reveals (pro analytics + rate limit)
  - id, post_id, viewer_user_id, revealed_at

rate_limits (volitelné, pro server-side rate limiting)
  - id, user_id, action_type, count, window_start
```

**Mapování UI → DB (`price_type`):**

| UI štítek | DB hodnota |
|-----------|------------|
| Pevná | `fixed` |
| Za odvoz | `free_pickup` |
| Dohodou | `negotiable` |
| Výměnou | `exchange` |
| Nabídni | `offer` |

**Mapování UI → DB (`condition_label`):**

| Kategorie | UI štítek | DB hodnota |
|-----------|-----------|------------|
| Zboží | Nové | `new` |
| Zboží | Jako nové | `like_new` |
| Zboží | Použité | `used` |
| Zboží | Poškozené / na díly | `damaged` |
| Služby | Jednorázově | `one_time` |
| Služby | Dlouhodobě | `long_term` |
| Služby | Záskok | `substitute` |
| Události *(v0.2)* | Jednorázová akce | `one_time` |
| Události *(v0.2)* | Pravidelná akce | `long_term` |
| Nemovitosti *(v0.3)* | Prodej | `sale` |
| Nemovitosti *(v0.3)* | Pronájem | `rent` |

**Mapování UI → DB pro události *(v0.2)* — reuse existujících sloupců, bez nových tabulek:**

| Pole | Hodnota pro `udalost` | Poznámka |
|------|----------------------|----------|
| `category_type` | `'udalost'` | Vyžaduje migraci CHECK constraintu |
| `subcategory_slug` | `koncert` \| `narozeniny` \| `opekani` \| `sport` \| `workshop` \| `setkani` \| `ostatni` | Definice v `categories.ts` |
| `condition_label` | `'one_time'` nebo `'long_term'` | UI: „Jednorázová akce“ / „Pravidelná akce“ (pole **Opakování**) |
| `price_type` | `'free_pickup'` nebo `'offer'` | Vstup zdarma → `free_pickup`; jinak „Nabídni“ |
| `price_amount` | `NULL` | Cena není primární dimenze |
| `event_date` | povinné `TIMESTAMPTZ` | Jednorázová: datum akce. Pravidelná: **nejbližší termín** (frekvence v popisu) |
| Kapacita | v `description` | v0.2 bez strukturovaného pole |
| `expires_at` | `event_date + 1 den` | **Ne** z `listing_duration_days` — viz §8.4.1 |

**Mapování UI → DB pro nemovitosti *(v0.3)* — reuse existujících sloupců, bez nových tabulek:**

| Pole | Hodnota pro `nemovitost` | Poznámka |
|------|--------------------------|----------|
| `category_type` | `'nemovitost'` | Vyžaduje migraci CHECK constraintu |
| `subcategory_slug` | `byty` \| `domy` \| `pozemky` \| `chata-chalupa` \| `komercni` \| `ostatni` | Definice v `categories.ts` |
| `condition_label` | `'sale'` nebo `'rent'` | UI: pole **Typ transakce** — Prodej / Pronájem |
| `price_type` | `'fixed'` \| `'negotiable'` \| `'offer'` | Bez `free_pickup` a `exchange` |
| `price_amount` | povinné u `fixed`, volitelné u `negotiable` | Cena / nájemné v Kč |
| `event_date` | `NULL` | Nemovitosti nepoužívají datum akce |
| `expires_at` | `now() + listing_duration_days` | Stejná logika jako zboží/služby — viz §9.2 |

### 4.1 Stavový model inzerátu (`posts.status`)

| Stav | Viditelnost na webu | Sitemap | Kdy nastane |
|------|---------------------|---------|-------------|
| `draft` | Ne | Ne | Rozpracovaný koncept (volitelné pro MVP) |
| `active` | Ano | Ano | Po úspěšné publikaci |
| `archived` | Ne | Ne | Po uplynutí `expires_at` (cron nebo okamžitá neviditelnost — viz §4.1) |
| `hidden` | Ne | Ne | 3× nahlášení od různých uživatelů nebo akce moderátora/admina |
| `deleted` | Ne | Ne | Soft delete uživatelem nebo moderátorem |

**Pravidla:**

- Vyhledávání, HP i PostGIS dotazy vracejí pouze `status = 'active'` a `expires_at > now()`.
- Obnovení inzerátu: `archived` → `active`, reset `expires_at` na `now() + listing_duration_days`, inkrement `renew_count`. *(v0.1: fixně +30 dní; od v0.1.1: podle uložené volby, s možností změnit délku při obnovení.)*
- Sitemap zahrnuje výhradně `active` inzeráty s platným `expires_at`.
- Po editaci: `updated_at` se aktualizuje; **slug se nemění** (stabilita URL).

**Co se stane po expiraci (`expires_at <= now()`):**

| Vrstva | Chování |
|--------|---------|
| **Veřejný web** | Inzerát **okamžitě mizí** — HP, vyhledávání, sitemap, detail URL (404 nebo stránka „Inzerát vypršel“). Funkce `is_post_publicly_visible()` vyžaduje `expires_at > now()`. |
| **Databáze** | Řádek v `posts` **zůstává** — nic se nemazá. Fotky (`post_images`), komentáře, reporty zůstávají navázané. |
| **Stav `status`** | Denní cron (pg_cron / Edge Function) nastaví `active` → `archived` u expirovaných inzerátů. Do doby cronu může zůstat technicky `active`, ale veřejně stejně neviditelný. |
| **Majitel (klientská sekce)** | Vidí inzerát v záložce **„Expirované / Archivované“** s datem expirace a tlačítkem **„Obnovit“**. Může editovat, smazat (soft delete → `deleted`) nebo znovu publikovat. |
| **Smazání** | Soft delete (`deleted`) je samostatná akce uživatele — expirace **nesmaže** data automaticky. |

- **Události *(v0.2)*:** Expirace řízená `event_date` + DB trigger (§8.4.1), ne pole platnosti z §9. Řazení podle `event_date ASC`.

### 4.2 Sledování přihlášení (Auth vs. `profiles`)

Tabulka `profiles` **neobsahuje** čas posledního přihlášení. **Změna DB schématu pro tento účel není potřeba** — Supabase Auth to řeší nativně.

| Údaj | Kde žije | Kdy se mění |
|------|----------|-------------|
| `last_sign_in_at` | `auth.users` (Supabase Auth) | Při každém úspěšném přihlášení (automaticky) |
| `profiles.updated_at` | `public.profiles` | Při **UPDATE profilu** (jméno, nickname, avatar…) — **ne** při samotném loginu |
| `profiles.created_at` | `public.profiles` | Při vytvoření profilu (registrace / trigger) |

**Čtení pro aplikaci a GDPR cron:**

- Přes Supabase Auth API: `supabase.auth.getUser()` → pole `last_sign_in_at` v session/JWT metadata.
- V Supabase Dashboard: **Authentication → Users** → detail uživatele.

**Záměrně se neimplementuje:**

- Kopie `last_sign_in_at` do `profiles` (duplicita, riziko desynchronizace).
- Vlastní tabulka audit logu přihlášení v MVP.

---

## 5. Funkční specifikace (Rozsah MVP)

### 5.1 HomePage (HP)

* **Hero sekce:** Jasný, úderný value proposition (Kup/Prodej/Nabídni v okolí).
* **AI Marketingový Hook (USP):**
  * V Hero sekci bude dominantně komunikována hlavní konkurenční výhoda oproti Bazošu/FB/sReality: *„Zadej inzerát do 2 minut. Ty nahodíš sračky, naše AI vytvoří profi inzerát.“*
  * Tento claim bude optimalizován pro SEO jako H1/H2 podpora pro klíčová slova spojená s rychlou, bezbolestnou lokální inzercí.
* **Geolokační logika:**
  1. Web primárně požádá o polohu přes HTML5 Geolocation API.
  2. **Success:** Souřadnice návštěvníka se uloží do `localStorage`. Pomocí PostGIS se spočítá vzdálenost a v Hero sekci se zobrazí 6–9 inzerátů v okruhu **15 km** od uživatele (konfigurovatelné v `src/config/app.ts`).
  3. **Fallback (Odmítnutí polohy / nepřesná IP):** Inzeráty se skryjí. Zobrazí se dominantní vyhledávací pole s integrovaným **adresním našeptávačem přes Mapy.cz API**. Uživatel musí vybrat validní obec/městskou část z nabídky. Vybrané souřadnice (WGS84) se uloží do `localStorage` pro další návštěvy.
  4. **Persistence:** Poloha návštěvníka se ukládá do `localStorage`. Do Supabase jdou souřadnice až u inzerátu (`posts.location`).
* **Vyhledávání a filtrace:**
  * Fulltextové vyhledávání: PostgreSQL `tsvector` + GIN index na `posts.title` a `posts.description` (podmínka: minimálně 3 znaky, validace na frontendu i backendu).
  * Vyhledávání pouze v `status = 'active'` a neexpirovaných inzerátech.
  * Filtry: Fulltextové výrazy (kategorie zboží/služby/události), lokalita (obec z našeptávače Mapy.cz), profil uživatele, typ ceny, stav/typ nabídky. *(Filtr `udalost` od v0.2.)*
  * Řazení: Kategorie, cena, datum přidání, vzdálenost (pokud je poloha aktivní). *(Události od v0.2: volitelně řazení podle `event_date` — nejbližší konání první.)*
* **Header & Footer:**
  * Header: Logotyp, indikace verze (v0.1 Prerelease), stav přihlášení, dominantní CTA tlačítko „Založit inzerát“.
  * Footer: O projektu, podmínky použití, zásady ochrany osobních údajů, AI disclaimer, cookie/privacy info s odkazem na consent nastavení.

### 5.2 Autentizace a správa profilu

* **Registrace & Přihlášení:**
  * Integrace Google OAuth (přihlášení jedním kliknutím) – prioritní konverzní cesta.
  * Klasický e-mail + heslo (Supabase Auth vynutí okamžité potvrzení e-mailu přes verifikační link, bez verifikace je profil neaktivní). Žádné otravné e-maily při každém běžném přihlášení.
  * **Striktní zákaz změny e-mailu:** Pole e-mailu je v UI neměnné (statický text). Změna adresy je zablokována PostgreSQL triggerem `BEFORE UPDATE ON auth.users`. Pokud uživatel potřebuje jiný e-mail: **smazat účet a založit nový** — krátká poznámka u pole v UI.
* **Onboarding:**
  * Při prvním přihlášení povinné zadání **přezdívky (`nickname`)** — unikátní v rámci platformy (DB UNIQUE constraint).
* **Klientská sekce:**
  * Přehled a kompletní CRUD vlastních inzerátů (Založit, Editovat, Skrýt, Smazat).
  * **Filtry stavu:** Aktivní / Expirované (archivované) / Skryté / Smazané — majitel vidí i neveřejné inzeráty.
  * **Exit poll:** Při smazání inzerátu povinný dropdown s důvodem (Prodal jsem zde / Prodal jsem jinde / Neprodal jsem / Jiné).
  * Editace profilu: Avatar (max **2 MB**, komprese na klientovi), Jméno, Příjmení, Přezdívka, telefonní číslo (volitelné), změna hesla, smazání účtu (GDPR compliant).

### 5.3 Detail inzerátu (Produktová stránka)

* **Obsah prezentace:** Název inzerátu, titulní fotka + galerie (max 6 fotek), strukturovaný popis, typ ceny (včetně konkrétní částky, pokud je pevná), štítek stavu, lokalita.
* **Veřejné dotazy (Komentáře) – Ochrana proti spamu a černému trhu:**
  * **Zákaz anonymity:** Komentáře jsou veřejně čitelné, ale přidat komentář mohou **striktně pouze přihlášení a ověření uživatelé**.
  * **Databázové zabezpečení (Supabase RLS):** Tabulka `comments` má aktivní RLS. Zápis (`INSERT`) je povolen výhradně pro roli `authenticated` s `WITH CHECK (auth.uid() = user_id)` — uživatel nemůže zfalšovat ID autora. Při INSERTu se zároveň uloží `author_nickname` (snapshot z `profiles.nickname`).
  * **Vazba na identitu:** Zobrazení autora čte `author_nickname` z řádku komentáře (ne live JOIN na `profiles`). Pokud `user_id IS NULL` (účet smazán), UI zobrazí **„[smazaný účet]“** bez ohledu na obsah `author_nickname`.
  * **FK při GDPR:** `comments.user_id` má `ON DELETE SET NULL` — smazání `auth.users` **nesmí** kaskádově smazat komentáře ani zablokovat anonymizaci.
  * **Komunitní bič na komentáře:** Tlačítko „Nahlásit“. Pokud komentář nasbírá **3 nahlášení od 3 různých přihlášených uživatelů** (`reporter_user_id`), automaticky mění stav na `hidden` a padá do karantény.
  * **Rate limit:** Max **10 komentářů / hodinu / uživatel**.
* **Ochrana kontaktů před scrapery (Anti-Scraping / Bot protection):**
  * **Tlačítko „Zobrazit kontakt“:** Telefon a e-mail prodejce nejsou v HTML kódu stránky. Zobrazí se až po kliknutí **přihlášeného** uživatele. Event se loguje do `contact_reveals`.
  * **Rate limit:** Max **20 zobrazení kontaktů / den / uživatel**.
  * **Anonymní poptávkový formulář:** Možnost napsat prodejci přímo z webu. E-mail se odešle přes Resend API; adresa prodejce zůstává skrytá.
  * **Události *(v0.2)*:** U `category_type = 'udalost'` se formulář chová jako „registrace zájmu o účast“ — tlačítko **„Mám zájem o účast“**, předmět/tělo e-mailu: *„Uživatel [jméno] se chce zúčastnit vaší akce: [Název] — [kontaktní údaje].“* Pořadatel odpovídá ze svého e-mailu; systém neukládá účastníky do DB.
* **Komunitní moderování inzerátů:**
  * Tlačítko „Nahlásit inzerát“ (Důvody: Podvod / Nelegální obsah / Nevhodné chování). Při **3 nahlášeních od 3 různých přihlášených uživatelů** se inzerát automaticky skryje (`hidden`) do karantény.
* **Automatizované On-Page SEO & Rich Snippets:**
  * **Dynamická Metadata (Next.js Metadata API):** Formát: `[Název inzerátu] | [Lokalita] | Local Hobby Market`. Příklad: *„Prodám dětské kolo Velo | Brno-Líšeň | Local Hobby Market“*.
  * **Strukturovaná data (Schema.org):** JSON-LD podle typu kategorie:
    * Pro zboží: `Schema.org/IndividualProduct` (název, cena, měna CZK, stav).
    * Pro služby: `Schema.org/Service` (lokalita, popis) — preferováno před `LocalBusiness` u jednotlivců.
    * Pro události *(v0.2)*: `Schema.org/Event` (`startDate` z `event_date`, popis, lokalita).
  * **SEO přívětivé URL (Slugs):** Tvar `/inzerat/[url-slug]`, např. `/inzerat/prace-v-kavarne-j59d`. Interní `id` záznamu se v URL **neuvádí**. `[url-slug]` = slugifikovaný název inzerátu + krátký unikátní suffix (ukládá se do `posts.slug`), generuje se z `title` při první publikaci a **nemění se** při editaci. Staré URL ve tvaru `/inzerat/[id]-[url-slug]` trvale přesměrují na `/inzerat/[url-slug]`.

### 5.4 Tvorba inzerátu & Synchronní AI Guardrail

* **Formulář (3 kroky):**
  1. **Kategorie a stav (Řízeno přes TS Config):** Výběr `category_type` (`zbozi` / `sluzby` / `udalost` od v0.2) a `subcategory_slug` z `src/config/categories.ts`. Povinný štítek stavu (Zboží: Nové / Jako nové / Použité / **Poškozené / na díly** `damaged`; Služby: Jednorázově / Dlouhodobě / Záskok; Události: **Opakování** — Jednorázová akce `one_time` / Pravidelná akce `long_term`).
  2. **Obsah a Cena:**
     * **Název inzerátu:** Povinné pole (max **80 znaků**). Používá se pro SEO Title tag, Open Graph a generování URL slugu.
     * **Textový popis:** Max 1 000 znaků. *(Události v0.2: UI hint — povinně uveď datum, čas a kapacitu; validace přes AI dotazník.)*
     * **Poloha inzerátu (Validace a GPS):** Povinné pole s našeptávačem Mapy.cz. Tlačítko „Použít aktuální polohu“ pro GPS z prohlížeče. Do `posts` se ukládá `location_text` (UI) i PostGIS point `location` (prostorové dotazy).
     * **Logika typu ceny (Dropdown):** Pevná (vynutí číselné pole v Kč) / Za odvoz (0 Kč) / Dohodou, Výměnou, Nabídni (skryje částku, zobrazí textový štítek).
     * **Platnost inzerátu *(v0.1.1)*:** Default **30 dní**. UI: `<select>` s preset hodnotami (7, 14, 30, 60, 90, 180, 365) **nebo** `<input type="number">` — **žádný slider** (mobilní UX). Ukládá se `listing_duration_days`; `expires_at` nastaví DB trigger (§9.2). U `udalost` (v0.2) se pole skryje — platí §8.4.1.
     * **Varování platnosti *(v0.1.1)*:** U `zbozi`/`sluzby`, pokud popis nebo AI JSON obsahuje datum **po** vypočtené expiraci, UI zobrazí: *„Pozor: Platnost inzerátu končí dříve než vámi zmíněné datum. Opravte platnost nebo datum.“*
  3. **Média a Volba Hlavní fotky:**
     * Upload fotografií: max **6 ks**, max **5 MB** před kompresí, formáty JPEG/PNG/WebP. Automatická komprese na klientovi před odesláním do Supabase Storage.
     * Uživatel **má možnost** u miniatur označit jedno foto jako **„Hlavní fotka (Náhled a AI analýza)“** (radio button/hvězdička). Výchozí je první nahraná.

* **Multimodální AI Guardrail & Interaktivní doplňování (Text + Foto cross-validace):**
  * Po kliknutí na „Zkontrolovat inzerát“ klient zavolá **přímo** Edge Function `moderate-listing` přes `supabase.functions.invoke()` (JWT uživatele v hlavičce). Payload: `title`, surový popis, `subcategory_slug`, **hlavní fotografie** (512×512 px, base64 nebo signed URL). Edge Function volá Gemini Flash / GPT-4o-mini a vrátí striktní JSON. **Žádná Next.js API Route v tomto flow.**
  * **Rate limit:** Max **5 AI kontrol / hodinu / uživatel**. Při překročení: HTTP 429 + srozumitelná hláška v UI.
  * **Logika zpracování AI (JSON výstup):**
    1. **Bezpečnostní a podvodový filtr:** Zakázaný obsah (zbraně, drogy, porno, orgány) → status `REJECTED`, proces končí chybou. Sémantická neshoda text/foto → chyba konzistence.
    2. **Čistka kontaktů (AI):** E-maily a telefony v popisu (i na fotce) nahrazeny `[SKRYTO – použij chráněné pole]`.
    3. **Hydratace podle TS Configu:** AI přebere `aiPrompt` z `categories.ts`:
       * *Zboží (auta-moto, reality, kola-sport):* Hledá vady, barvu, model, STK, metráž, dispozice. Chybějící data → specifické otázky.
       * *Služby (řemeslo-opravy, stěhování-doprava):* Ignoruje ilustrační foto, generuje 1–3 byznys otázky (dojezd, materiál v ceně, nošení do schodů, fixní vs. hodinová cena).
       * *Události (v0.2):* Extrakce data a času konání, přesné lokality, kapacity a instrukcí k přihlášení. Chybějící datum/čas nebo kapacita → doplňující otázka v AI dotazníku.
  * **UX Flow v modálním okně „AI Náhled & Doplnění“:**
    * **Učesaný text inzerátu** v editovatelné `textarea`, fakta z fotky označená `[AI ODVOZENO Z FOTA]`.
    * **Dynamický dotazník („Sousedská AI se ptá“):** Pole z JSON odpovědi AI.
    * **Akce uživatele:**
      1. **Doplnit, upravit a publikovat (Doporučeno):** Finální verze (včetně `title`) uložena do DB jako `status = 'active'`.
      2. **Ignorovat AI (Publikovat původní patlanici):** Zahodí AI korektury a doplňky, ale **vždy platí:**
         - Bezpečnostní filtr (zbraně, drogy, porno, orgány) — neprůstřelný.
         - **Server-side strip kontaktů** v popisu (regex, nezávislé na AI) — nahrazení `[SKRYTO – použij chráněné pole]`.
      3. **Smazat / Zrušit:** Koncept zahozen, v DB nevzniká zápis.

* **Editace existujícího inzerátu:**
  * Změna **názvu, popisu, fotek nebo kategorie** → povinná znovu AI kontrola (min. bezpečnostní filtr + strip kontaktů).
  * Změna pouze **ceny nebo stavu** (štítek) → bez AI, přímé uložení.

### 5.5 Politika správy uživatelských dat (GDPR & Retence)

Z důvodu GDPR (minimalizace údajů) a ochrany infrastruktury je zaveden automatický proces čištění neaktivních účtů.

* **Pravidlo pro spuštění retence** (obě podmínky současně):
  1. Nebyl přihlášen déle než **90 dní** — zdroj: **`auth.users.last_sign_in_at`** (Supabase Auth), **ne** `profiles.updated_at` (viz §4.2).
  2. Nemá **žádný aktivní inzerát** (`status = 'active'`).
* **Implementace cronu:** Edge Function nebo pg_cron s přístupem k Auth Admin API / dotazu na `auth.users` — ne z tabulky `profiles`.
* **Proces anonymizace:**

| Entita | Chování |
|--------|---------|
| `profiles` | PII (`email`, `name`, `surname`) přepsána hashem, avatar smazán ze Storage |
| Aktivní inzeráty | Přejdou do `deleted` |
| `comments` | **Zůstanou zachované.** Před smazáním auth: `UPDATE comments SET author_nickname = '[smazaný účet]' WHERE user_id = $id`. Po smazání `auth.users`: FK `ON DELETE SET NULL` nastaví `user_id = NULL`. UI zobrazí „[smazaný účet]“. Diskuse pod inzerátem se **nesmaže**. |
| Auth účet | Smazán přes Supabase Auth (až po krocích výše) |

* **Automatická e-mailová urgence (Pre-trigger):** **7 dní před anonymizací** (83. den neaktivity) upozornění přes Resend. Přihlášení resetuje časovač.
* **Technická realizace:** Cron jednou denně (pg_cron nebo Supabase Edge Function).

### 5.6 Role-Based Access Control (RBAC) & Inline Administrace (God Mode)

Vestavěný systém rolí navázaný na produkční UI (bez komplexního admin panelu).

* **Systémové role (Postgres ENUM):**
  1. `user` – Výchozí role. Plný přístup k P2P funkcím, spravuje pouze vlastní obsah.
  2. `moderator` – Vidí admin prvky u cizího obsahu. Může smazat/skrýt jakýkoliv inzerát nebo komentář. **Nemá právo sahat na profily uživatelů.**
  3. `admin` – Plná práva moderátora + změna rolí a správa/anonymizace účtů. Identifikace přes JWT spárovaný s UUID v DB.

* **UX Flow inline moderování (God Mode):**
  * Uživatel s rolí `moderator` nebo `admin` na detailu cizího inzerátu/komentáře vidí administrační lištu: **[Skrýt (Karanténa)]** a **[Smazat natvrdo]**.
  * Moderátor vidí reálný kontext přímo na produkčním webu.

* **Minimální moderátorská fronta (`/mod/karantena`):**
  * Přístup pouze pro `moderator` a `admin`.
  * Seznam inzerátů a komentářů ve stavu `hidden`, seřazeno od nejnovějšího.
  * Akce: obnovit (`active`) / smazat natvrdo (`deleted`).
  * Žádný další admin UI.

* **Zabezpečení:**
  * UI lišty podmíněno `profile.role` v session.
  * RLS propustí `DELETE` a `UPDATE` u cizího obsahu pouze pro `moderator` a `admin`.
  * Při smazání inzerátu: DB trigger smaže fotografie ze Supabase Storage.

---

## 6. Nefunkční požadavky & Ochranné limity

* **Automatická expirace inzerátů:** Platnost řízená polem `expires_at`. *(v0.1: fixně 30 dní; od v0.1.1: volba 1–365 dní, default 30 — viz §9.)* Po uplynutí → neveřejný, následně `archived` cronem. Uživatel obnoví jedním kliknutím v klientské sekci.
* **Bezpečnost a optimalizace:**
  * Vyhledávání: min. 3 znaky.
  * Kontakty: skrytí v HTML, anonymní formulář, server-side strip v popisu.
  * V DB ani v HTML odpovědi nikdy není surový e-mail/telefon v poli `description`.
* **Rate limiting (ochrana rozpočtu 1 000 Kč/měsíc):**

| Akce | Limit | Při překročení |
|------|-------|----------------|
| AI kontrola inzerátu | 5 / hodinu / uživatel | HTTP 429 + hláška v UI |
| Zobrazení kontaktu | 20 / den / uživatel | HTTP 429 + hláška v UI |
| Nový komentář | 10 / hodinu / uživatel | HTTP 429 + hláška v UI |
| AI Edge Function (Supabase, voláno přímo z klienta) | Timeout 30 s | „Zkus znovu za chvíli“; server-side bezpečnostní pre-check v Edge Function proběhne vždy |
| Next.js API Route | **Nepoužívat pro AI** | Proxy přes Vercel = riziko 504 (Hobby legacy limit 10 s) |

* **Architektonická příprava na budoucí monetizaci (bez implementace v v0.1):**
  * `posts.expires_at`, `posts.listing_duration_days` (v0.1.1), `posts.renew_count`, `posts.payment_status` (výchozí `free`).
  * `profiles` připraveno pro budoucí limit aktivních inzerátů na neplatícího uživatele.
  * Integrace platební brány (např. Stripe) až po validaci MVP.
* **Cookie consent (EU):**
  * Consent banner před aktivací GA4 (GTM consent mode).
  * Stránky: Zásady ochrany osobních údajů, Podmínky použití.
  * Bez souhlasu: pouze technicky nezbytné cookies.

### 5.5 GTM identifikátory CTA (Click tracking)

Každé významné CTA v UI musí mít **stabilní identifikátor** pro Google Tag Manager a GA4. Jediný zdroj pravdy: [`src/config/gtm-ids.ts`](../src/config/gtm-ids.ts).

**Konvence:**

| Prvek | Hodnota |
|-------|---------|
| HTML atribut | `data-gtm-id` (povinný) |
| Formát ID | `cta_<plocha>_<akce>` — snake_case, anglicky |
| Kontext (volitelný) | `data-gtm-<klíč>` — např. `data-gtm-category`, `data-gtm-listing-id` |
| Helper v kódu | `gtmCtaProps(GTM_CTA.…, { category: "prace" })` |

**Pravidla:**

1. **Stabilita:** Po nasazení do produkce ID **neměnit** — GTM triggery a reporty na nich závisí.
2. **Nové CTA:** Přidat konstantu do `GTM_CTA` v `gtm-ids.ts` dřív, než se použije v komponentě.
3. **GTM trigger (doporučení):** Click — element matches CSS selector `[data-gtm-id^="cta_"]`; proměnná z atributu `data-gtm-id`.
4. **Consent:** Eventy se odesílají až po souhlasu (GTM consent mode); atributy v HTML jsou vždy přítomné.
5. **Mimo rozsah:** Čistě dekorativní prvky (ikona menu bez byznys akce lze označit, ale nemusí generovat konverzi).

**Přehled implementovaných ID (v0.4):**

| ID | Akce |
|----|------|
| `cta_header_create_listing` | Header — Založit |
| `cta_header_sign_in` | Header menu — Přihlásit se |
| `cta_header_sign_out` | Header menu — Odhlásit |
| `cta_home_create_listing` | HP hero — Založit inzerát |
| `cta_home_category_tab` | HP — záložka kategorie (+ `data-gtm-category`) |
| `cta_listing_card_open` | Klik na kartu inzerátu (+ `data-gtm-listing-id`) |
| `cta_inquiry_open` / `cta_inquiry_submit` | Poptávkový formulář |
| `cta_create_publish` | Publikovat inzerát (+ `data-gtm-category`) |
| `cta_login_google` | Přihlášení Google |

Kompletní seznam: export `GTM_CTA` v `gtm-ids.ts`.

* **SEO Infrastruktura (Indexace):**
  * **Dynamická Sitemap (`sitemap.xml`):** Pouze `active` inzeráty. Expirované/smazané okamžitě mizí.
  * **SSR / ISR:** Detail inzerátu musí být server-renderovaný — žádný prázdný klientský loader.
  * **Robots.txt:** Zákaz indexace `/profil/*`, `/mod/*`, admin prvků a vyhledávání s parametry. Indexují se HP, kategorie a detaily inzerátů.

---

## 7. Historie verzí dokumentu

| Verze | Datum | Změna |
|-------|-------|-------|
| v1 | — | Počáteční draft |
| v2 | — | Produktová a technická iterace |
| v3 | 2026-06-26 | Sloučení v2 + schválená doplnění: `title`, stavový model, rate limiting, out of scope, datový model, DoD, opravy |
| v3.1 | 2026-06-26 | AI volání přímo z klienta (ne přes Vercel API), CHECK constrainty u `price_type`/`condition_label`, GDPR FK u komentářů (`ON DELETE SET NULL`, `author_nickname` snapshot) |
| v3.2 | 2026-06-26 | §4.2 — upřesnění `last_sign_in_at` v Auth vs. `profiles.updated_at`; bez změny DB schématu |
| v3.3 | 2026-06-27 | §8 Future Scope — modul Události (v0.2+); odkaz na [`future_events.md`](./future_events.md) |
| v3.4 | 2026-06-27 | Plná integrace modulu Událostí: §1.2 DoD v0.2, §2.1 Out of Scope v0.2, §4 mapování, §5 delty, §8 kompletní spec |
| v3.5 | 2026-06-27 | §9 Volitelná platnost inzerátu (v0.1.1): `listing_duration_days`, lifecycle po expiraci, §4.1 rozšířeno |
| v3.6 | 2026-06-27 | Oprava kolize §8/§9: `event_date`, expirace událostí = `event_date + 1 den` |
| v3.7 | 2026-06-27 | Mobil UX: bez sliderů (select/number, default 30); trigger počítá `expires_at`; guardrail datum v popisu; migrace `003_prd_v3_7.sql` |
| v3.8 | 2026-06-27 | Události: Pravidelná akce (`long_term`), podkategorie `setkani`, pole Opakování; migrace `004_recurring_events.sql` |
| v3.9 | 2026-06-27 | Zboží: stav `damaged` — UI „Poškozené / na díly“; migrace `005_damaged_goods.sql` |
| v3.11 | 2026-06-29 | GTM: `data-gtm-id` na všech CTA, registr `src/config/gtm-ids.ts`, §5.5 PRD |
| v3.10 | 2026-06-29 | Nemovitosti: `category_type = 'nemovitost'`, typ transakce `sale`/`rent`, 6 podkategorií; migrace `006_real_estate.sql` |

---

## 8. Modul Události (v0.2)

> **Stav:** Plánováno po validaci MVP v0.1. Neimplementovat v první verzi.  
> **Shrnutí pro rychlý přehled:** [`future_events.md`](./future_events.md)

### 8.1 Koncept

**„Událost jako inzerát s poptávkovým formulářem.“**

Událost je běžný řádek v `posts` s `category_type = 'udalost'`. Registrace účastníků = existující anonymní poptávkový formulář (§5.3), ne vlastní registrační systém. Pořadatel dostane e-mail s kontaktem zájemce a odpoví ze své schránky.

**Proč minimalisticky:** nulové náklady na novou doménovou logiku (reuse AI, fotky, geolokace, moderování, e-mail), GDPR-friendly (data účastníků neleží v DB platformy), rychlá validace poptávky po lokálních eventech.

### 8.2 Taxonomie (`src/config/categories.ts`)

Přidání hlavní kategorie **`udalost`**.

| `subcategory_slug` | Název v UI |
|--------------------|------------|
| `koncert` | Koncert |
| `narozeniny` | Narozeniny |
| `opekani` | Opékání |
| `sport` | Sport |
| `workshop` | Workshop |
| `setkani` | Setkání / komunitní akce |
| `ostatni` | Ostatní |

**Opakování události (`condition_label`):**

| UI (pole „Opakování“) | DB | Příklad názvu |
|----------------------|-----|----------------|
| Jednorázová akce | `one_time` | „Narozeninová oslava na zahradě“ |
| Pravidelná akce | `long_term` | „Čtvrteční poker u Honzy“ |

U pravidelné akce: `event_date` = nejbližší termín; frekvence (např. každý čtvrtek) v popisu. Po proběhnutí pořadatel upraví datum nebo obnoví inzerát.

**AI prompt (ukázka pro `categories.ts`):**

> Uživatel nabízí událost. Rozliš jednorázovou vs. pravidelnou akci. U pravidelných extrahuj frekvenci. Vždy: datum nejbližšího konání, čas, lokalita, kapacita, instrukce k přihlášení.

### 8.3 Funkční specifikace

#### Prezentace události

- Chová se jako klasický post: název, fotka/galerie, popis, lokalita, štítek stavu, typ vstupu (zdarma / nabídni), **datum a čas konání** (`event_date`).
- V popisu zadavatel uvede kapacitu (pokud ji chce limitovat) a doplňující informace; **strukturované datum konání** jde do sloupce `event_date`.
- Fotka, geolokace, AI guardrail, komentáře, moderování — beze změny oproti ostatním kategoriím.

#### Registrace účastníků (= poptávkový formulář)

- Systém **nevyvíjí** vlastní registrační formulář ani tabulku účastníků.
- Tlačítko: **„Mám zájem o účast“** (místo „Napsat prodejci“).
- E-mail pořadateli: *„Uživatel [jméno] se chce zúčastnit vaší akce: [Název akce] — [kontaktní údaje z formuláře].“*
- Rate limit poptávkového formuláře: stejný jako u inzerátů (bez nového limitu v0.2).

#### Odpověď pořadatele

- Pořadatel odpoví **přímo ze svého e-mailu**.
- Systém neřeší follow-up zprávy ani systémové notifikace účastníkům.

#### Formulář založení (větev UI)

| Krok | Chování pro `udalost` |
|------|------------------------|
| 1 — Kategorie | Výběr `udalost` + podsekce; pole **Opakování**: Jednorázová (`one_time`) / Pravidelná (`long_term`) |
| 2 — Obsah | Povinný **datetime picker** `event_date` (u pravidelné: „nejbližší termín“); hint kapacity a frekvence v popisu; cena: „Vstup zdarma“ / „Nabídni“; **pole platnosti (§9) se nezobrazuje** |
| 3 — Média | Beze změny (max 6 fotek) |

### 8.4 Datový model a DB migrace

**Nové tabulky:** žádné. Nový sloupec `event_date` v `posts` (viz §4).

**Požadovaná migrace (v0.2):**

```sql
-- Sloupec pro datum konání události
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ NULL;

-- event_date povinné jen u událostí; u ostatních kategorií NULL
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_event_date_by_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_event_date_by_category_check
  CHECK (
    (category_type = 'udalost' AND event_date IS NOT NULL)
    OR
    (category_type <> 'udalost' AND event_date IS NULL)
  );

-- Rozšíření category_type
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_type_check
  CHECK (category_type IN ('zbozi', 'sluzby', 'udalost'));

-- Rozšíření vazby condition_label ↔ category_type
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_matches_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_condition_matches_category_check
  CHECK (
    (category_type = 'zbozi' AND condition_label IN ('new', 'like_new', 'used', 'damaged'))
    OR (category_type = 'sluzby' AND condition_label IN ('one_time', 'long_term', 'substitute'))
    OR (category_type = 'udalost' AND condition_label IN ('one_time', 'long_term'))
  );

CREATE INDEX IF NOT EXISTS posts_event_date_idx
  ON public.posts (event_date)
  WHERE category_type = 'udalost' AND status = 'active';
```

### 8.4.1 Logika expirace událostí (vazba na §9)

**Problém (bez tohoto pravidla):** Fixní default 30 dní u běžného inzerátu by u události archivoval inzerát **dřív**, než se fyzicky koná — viz opékání 15. srpna zveřejněné 1. července.

**Speciální pravidlo pro `category_type = 'udalost'`:**

| Aspekt | Chování |
|--------|---------|
| Pole platnosti (§9.4) | **Skryté** — uživatel nevolí `listing_duration_days` |
| `listing_duration_days` | U událostí se **ignoruje** (DB default 30 nemá vliv na `expires_at`) |
| `expires_at` | DB trigger: **`event_date + INTERVAL '1 day'`** |
| Frontend | Posílá `event_date`; **`expires_at` neposílá** |
| Obnovení (`renew`) | Jen pokud `event_date > now()`; trigger přepočítá `expires_at` |
| Validace | `event_date` v budoucnosti při publikaci; max horizont v `app.ts` (startovně 365 dní) |

```sql
CREATE OR REPLACE FUNCTION public.handle_post_expiration_logic()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_type = 'udalost' THEN
    IF NEW.event_date IS NULL THEN
      RAISE EXCEPTION 'U kategorie udalost je pole event_date povinne.';
    END IF;
    NEW.expires_at := NEW.event_date + INTERVAL '1 day';
  ELSE
    NEW.event_date := NULL;
    IF NEW.listing_duration_days IS NULL THEN
      NEW.listing_duration_days := 30;
    END IF;
    NEW.expires_at := now() + (NEW.listing_duration_days || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_expiration_logic ON public.posts;
CREATE TRIGGER trigger_post_expiration_logic
  BEFORE INSERT OR UPDATE OF category_type, event_date, listing_duration_days
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_expiration_logic();
```

> **Pravidlo priority:** Pro `udalost` platí vždy `expires_at = event_date + 1 den`. Logika `now() + listing_duration_days` z §9.2 se na události **nevztahuje**. Kompletní migrace: [`supabase/003_prd_v3_7.sql`](../supabase/003_prd_v3_7.sql).

### 8.5 Implementační checklist

| Oblast | Změna | Odhad |
|--------|-------|-------|
| `src/config/categories.ts` | Kategorie `udalost` + podsekce + `aiPrompt` | ~15 min |
| DB migrace | `event_date` + CHECK constrainty + trigger expirace dle §8.4.1 | ~1 h |
| Formulář založení | Větev UI pro `udalost`: datetime picker `event_date`, bez pole platnosti | ~1–2 h |
| Detail inzerátu | Podmíněné tlačítko + šablona e-mailu poptávky | ~30 min |
| JSON-LD | `Schema.org/Event` | ~1 h |
| Filtry HP / vyhledávání | Přidat `udalost` do filtrů; řazení podle `event_date` | ~45 min |

**Celkem:** cca **0,5–1 den** po dokončení MVP v0.1.

### 8.6 Rizika a mitigace

| Riziko | Mitigace v0.2 | Budoucí (v0.3+) |
|--------|---------------|-----------------|
| Expiace dříve než datum akce | **`event_date` + trigger `expires_at = event_date + 1 den`** (§8.4.1) | — |
| Kapacita bez enforcementu | Pořadatel odpoví „kapacita naplněna“ nebo skryje inzerát | `capacity_max` + stav „plná kapacita“ |
| Konec akce neznámý | Expirace den po `event_date` | `event_ends_at` pro vícedenní akce |

### 8.7 Vědomá omezení oproti původnímu záměru

| Původní požadavek | Řešení v0.2 |
|-------------------|-------------|
| Limit počtu návštěvníků | Text v popisu; pořadatel ručně stopne registrace |
| Registrační DB (jméno, tel, mail) | Stejný poptávkový formulář jako u inzerátů |
| Notifikace pořadatele | Ano — e-mail z poptávkového formuláře |
| Dodatečný mail s detaily od pořadatele | Ne — odpověď ze soukromého e-mailu |
| Počítadlo registrovaných / waitlist | Ne |

### 8.8 Roadmap v0.3+ (mimo v0.2)

- Strukturovaná pole: `event_ends_at`, `capacity_max` (`event_date` je už ve v0.2)
- Počítadlo poptávek (log odeslaných mailů, ne plná registrace)
- Automatická archivace po datu akce
- Waitlist / stav „kapacita naplněna“
- Systémový follow-up mail od pořadatele

---

## 9. Volitelná platnost inzerátu (v0.1.1)

> **Stav:** Plánováno po validaci MVP v0.1. Neimplementovat v první verzi (v0.1 používá fixních 30 dní).  
> **Rozsah:** Kategorie `zbozi` a `sluzby`. **Události (`udalost`) jsou výjimka** — expirace z `event_date`, viz §8.4.1.

### 9.1 Koncept

Default **30 dní** platnosti. Uživatel může hodnotu **přepsat** (select nebo číselné pole, rozsah 1–365). **Žádné slidery** — primární UX je mobil (80–90 % traffic).

Frontend posílá `listing_duration_days`. **`expires_at` neposílá** — počítá DB trigger (§9.2, §8.4.1). Max hodnotu lze později upravit v `app.ts` a DB CHECK.

### 9.2 Datový model

**Sloupec v `posts`:**

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `listing_duration_days` | `INTEGER NOT NULL DEFAULT 30` | Volba uživatele; u `udalost` se ignoruje |

**Výpočet expirace (zbozi / sluzby) — v DB triggeru:**

```text
expires_at = now() + listing_duration_days * interval '1 day'
```

Při **obnovení:** trigger při UPDATE `listing_duration_days` přepočítá `expires_at`.

**Výjimka — události:** §8.4.1 — `expires_at = event_date + 1 den`.

**Migrace:** [`supabase/003_prd_v3_7.sql`](../supabase/003_prd_v3_7.sql) (sloupce `listing_duration_days`, `event_date`, constrainty, trigger).

### 9.3 Konfigurace (`src/config/app.ts`)

```typescript
LISTING_DURATION_DEFAULT_DAYS = 30
LISTING_DURATION_MIN_DAYS = 1
LISTING_DURATION_MAX_DAYS = 365  // upravitelné bez změny logiky
```

```typescript
export const LISTING_DURATION_DEFAULT_DAYS = 30;
export const LISTING_DURATION_MIN_DAYS = 1;
export const LISTING_DURATION_MAX_DAYS = 365;
export const LISTING_DURATION_PRESETS = [7, 14, 30, 60, 90, 180, 365] as const;
```

Frontend validuje rozsah; DB CHECK je pojistka.

### 9.4 UI (mobil-first, bez sliderů)

| Místo | Chování |
|-------|---------|
| Formulář založení (krok 2) | **Default 30 dní.** `<select>` s presety (7, 14, 30, 60, 90, 180, 365) nebo `<input type="number" min="1" max="365">`. Žádný slider. |
| Zobrazení majiteli | „Platí do: [datum]“ (z `expires_at`, read-only) |
| Obnovení expirovaného | „Obnovit“ + možnost změnit `listing_duration_days` |
| Události (v0.2) | Pole platnosti **skryté**; povinný datetime picker `event_date` |
| Guardrail — datum v popisu | U `zbozi`/`sluzby`: pokud AI nebo heuristika najde datum **po** `now + listing_duration_days`, zobraz varování: *„Pozor: Platnost inzerátu končí dříve než vámi zmíněné datum. Opravte platnost nebo datum.“* Neblokuje publikaci (soft warning). |

### 9.5 Cron archivace

Denní job (pg_cron nebo Edge Function):

```sql
UPDATE public.posts
SET status = 'archived', updated_at = now()
WHERE status = 'active'
  AND expires_at IS NOT NULL
  AND expires_at <= now();
```

Veřejná neviditelnost platí **okamžitě** přes `is_post_publicly_visible()` — cron sjednocuje stav pro klientskou sekci a reporting.

**Poznámka k událostem:** U `udalost` je `expires_at = event_date + 1 den` (§8.4.1) — akce nemůže zmizet před konáním.

### 9.6 Implementační checklist

| Oblast | Odhad |
|--------|-------|
| DB migrace (`listing_duration_days` + CHECK) | ~20 min |
| `app.ts` konfigurace | ~10 min |
| Formulář založení + obnovení | ~1–2 h |
| Klientská sekce — záložka Expirované | ~1 h |
| Cron archivace | ~30 min |

**Celkem:** cca **0,5 dne**.

### 9.7 Out of Scope (v0.1.1)

- Placené prodloužení / topování (až monetizace)
- Různé max limity per kategorie (až v0.3+ podle dat)
- Automatické e-mailové upozornění „inzerát brzy expiruje“ (volitelné v0.3+)

---

## 10. Modul Nemovitosti (v0.3)

> **Stav:** Implementováno v taxonomii a DB constraintech. Strukturovaná pole (dispozice, m²) až v0.4+.

### 10.1 Koncept

**„Nemovitost jako běžný inzerát s typem transakce.“**

Nemovitost je řádek v `posts` s `category_type = 'nemovitost'`. Klíčové parametry (dispozice, plocha, kauce) jdou do popisu; AI guardrail extrahuje chybějící data dotazníkem. Bez nových tabulek a sloupců.

### 10.2 Taxonomie (`src/config/categories.ts`)

| `subcategory_slug` | Název v UI |
|--------------------|------------|
| `byty` | Byty |
| `domy` | Domy |
| `pozemky` | Pozemky |
| `chata-chalupa` | Rekreační objekty |
| `komercni` | Komerční objekty |
| `ostatni` | Ostatní |

**Typ transakce (`condition_label`):**

| UI (pole „Typ transakce“) | DB |
|---------------------------|-----|
| Prodej | `sale` |
| Pronájem | `rent` |

**AI prompt (ukázka pro `categories.ts`):**

> Uživatel nabízí nemovitost k prodeji nebo pronájmu. Extrahuj dispozici, plochu, patro, balkón/sklep/výtah, kauci a poplatky (u pronájmu), stav objektu a parkování. Chybějící data → 1–3 doplňující otázky.

### 10.3 DB migrace

Kompletní migrace: [`supabase/006_real_estate.sql`](../supabase/006_real_estate.sql)

- Rozšíření `posts_category_type_check` o `'nemovitost'`
- Rozšíření `posts_condition_label_check` o `'sale'`, `'rent'`
- Rozšíření `posts_condition_matches_category_check` pro párování `nemovitost` ↔ `sale`/`rent`
- Trigger `handle_post_expiration_logic`: nemovitosti spadají do `ELSE` větve (`listing_duration_days`, default 30 dní)

### 10.4 Out of Scope (v0.3)

- Strukturovaná pole `area_m2`, `rooms`, `floor` (až v0.4+)
- Energetický štítek, katastrální území
- Ověření vlastnictví / realitní licence
- Filtr „pouze pronájem“ na HP (až s vyhledáváním)
