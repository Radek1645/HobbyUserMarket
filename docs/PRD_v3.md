# Product Requirement Document (PRD) – Projekt: Local Hobby Market (v0.1)

> **Verze dokumentu:** v3.1  
> **Předchozí verze:** [`PRD_v2.md`](./PRD_v2.md) · [`PRD_v2_doplneni.md`](./PRD_v2_doplneni.md)  
> **Datum:** 2026-06-26

---

## 1. Produktová vize a cíle

* **Vize:** Lokální peer-to-peer ekosystém pro rychlou inzerci zboží a služeb v bezprostředním okolí uživatele. Místo, kde soused prodá přebytky medu, nabídne sekání trávy, daruje starou skříň za odvoz nebo prodá kolo po dítěti.
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
* **Taxonomie a kategorie:** Systém nevyužívá databázové tabulky pro kategorie (prevence zbytečných JOINů a DB administrace). Jediným zdrojem pravdy je statický soubor `src/config/categories.ts`. V DB jsou inzeráty kategorizovány pouze pomocí textových polí `category_type` (`zbozi` / `sluzby`) a `subcategory_slug`.
* **Konfigurace aplikace:** Globální parametry (radius vyhledávání, limity rate limitingu) v `src/config/app.ts`. Výchozí radius: **15 km**.

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
  - category_type (VARCHAR(10), NOT NULL, CHECK IN ('zbozi', 'sluzby'))
  - subcategory_slug (VARCHAR(50), NOT NULL)
  - price_type (VARCHAR(20), NOT NULL, CHECK IN ('fixed', 'free_pickup', 'negotiable', 'exchange', 'offer'))
  - price_amount (INTEGER, nullable — povinné pouze pokud price_type = 'fixed')
  - condition_label (VARCHAR(20), NOT NULL, CHECK IN (
      'new', 'like_new', 'used',           -- zboží
      'one_time', 'long_term', 'substitute' -- služby
    ))
  - location_text, location (GEOGRAPHY POINT)
  - status (ENUM: draft | active | archived | hidden | deleted)
  - expires_at, renew_count, payment_status (VARCHAR(20), výchozí: 'free')
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
| Služby | Jednorázově | `one_time` |
| Služby | Dlouhodobě | `long_term` |
| Služby | Záskok | `substitute` |

### 4.1 Stavový model inzerátu (`posts.status`)

| Stav | Viditelnost na webu | Sitemap | Kdy nastane |
|------|---------------------|---------|-------------|
| `draft` | Ne | Ne | Rozpracovaný koncept (volitelné pro MVP) |
| `active` | Ano | Ano | Po úspěšné publikaci |
| `archived` | Ne | Ne | Po uplynutí `expires_at` (30 dní) |
| `hidden` | Ne | Ne | 3× nahlášení od různých uživatelů nebo akce moderátora/admina |
| `deleted` | Ne | Ne | Soft delete uživatelem nebo moderátorem |

**Pravidla:**

- Vyhledávání, HP i PostGIS dotazy vracejí pouze `status = 'active'` a `expires_at > now()`.
- Obnovení inzerátu: `archived` → `active`, reset `expires_at` na +30 dní, inkrement `renew_count`.
- Sitemap zahrnuje výhradně `active` inzeráty.
- Po editaci: `updated_at` se aktualizuje; **slug se nemění** (stabilita URL).

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
  * Filtry: Fulltextové výrazy (kategorie/služby), lokalita (obec z našeptávače Mapy.cz), profil uživatele, typ ceny, stav/typ nabídky.
  * Řazení: Kategorie, cena, datum přidání, vzdálenost (pokud je poloha aktivní).
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
* **Komunitní moderování inzerátů:**
  * Tlačítko „Nahlásit inzerát“ (Důvody: Podvod / Nelegální obsah / Nevhodné chování). Při **3 nahlášeních od 3 různých přihlášených uživatelů** se inzerát automaticky skryje (`hidden`) do karantény.
* **Automatizované On-Page SEO & Rich Snippets:**
  * **Dynamická Metadata (Next.js Metadata API):** Formát: `[Název inzerátu] | [Lokalita] | Local Hobby Market`. Příklad: *„Prodám dětské kolo Velo | Brno-Líšeň | Local Hobby Market“*.
  * **Strukturovaná data (Schema.org):** JSON-LD podle typu kategorie:
    * Pro zboží: `Schema.org/IndividualProduct` (název, cena, měna CZK, stav).
    * Pro služby: `Schema.org/Service` (lokalita, popis) — preferováno před `LocalBusiness` u jednotlivců.
  * **SEO přívětivé URL (Slugs):** Tvar `/inzerat/[id]-[url-slug]`, např. `/inzerat/854-prodam-detske-kolo-velo-brno-lisen`. Slug se generuje z `title` při první publikaci a **nemění se** při editaci.

### 5.4 Tvorba inzerátu & Synchronní AI Guardrail

* **Formulář (3 kroky):**
  1. **Kategorie a stav (Řízeno přes TS Config):** Výběr `category_type` (`zbozi` / `sluzby`) a `subcategory_slug` z `src/config/categories.ts`. Povinný štítek stavu (Zboží: Nové / Jako nové / Použité; Služby: Jednorázově / Dlouhodobě / Záskok).
  2. **Obsah a Cena:**
     * **Název inzerátu:** Povinné pole (max **80 znaků**). Používá se pro SEO Title tag, Open Graph a generování URL slugu.
     * **Textový popis:** Max 1 000 znaků.
     * **Poloha inzerátu (Validace a GPS):** Povinné pole s našeptávačem Mapy.cz. Tlačítko „Použít aktuální polohu“ pro GPS z prohlížeče. Do `posts` se ukládá `location_text` (UI) i PostGIS point `location` (prostorové dotazy).
     * **Logika typu ceny (Dropdown):** Pevná (vynutí číselné pole v Kč) / Za odvoz (0 Kč) / Dohodou, Výměnou, Nabídni (skryje částku, zobrazí textový štítek).
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
  1. Nebyl přihlášen déle než **90 dní** (`last_sign_in_at` v Supabase Auth).
  2. Nemá **žádný aktivní inzerát** (`status = 'active'`).
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

* **Automatická expirace inzerátů:** Platnost **30 dní**. Po uplynutí → `archived`. Uživatel obnoví jedním kliknutím v klientské sekci (`archived` → `active`, `expires_at` +30 dní, `renew_count++`).
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
  * `posts.expires_at` (výchozí +30 dní), `posts.renew_count`, `posts.payment_status` (výchozí `free`).
  * `profiles` připraveno pro budoucí limit aktivních inzerátů na neplatícího uživatele.
  * Integrace platební brány (např. Stripe) až po validaci MVP.
* **Cookie consent (EU):**
  * Consent banner před aktivací GA4 (GTM consent mode).
  * Stránky: Zásady ochrany osobních údajů, Podmínky použití.
  * Bez souhlasu: pouze technicky nezbytné cookies.
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
