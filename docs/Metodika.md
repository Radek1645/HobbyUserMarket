# Metodika — Local Hobby Market

> **Účel:** Srozumitelný přehled všech procesů a postupů, které v projektu mohou nastat. Dokument je určen pro vývojáře, moderátory, produktové vlastníky i kohokoliv, kdo potřebuje rychle pochopit, *co se na webu děje a proč*.  
> **Technická specifikace:** [`PRD_v3.md`](./PRD_v3.md) · **Moderace (implementace):** [`moderace-inzeratu.md`](./moderace-inzeratu.md)  
> **Datum:** 2026-07-11

---

## Obsah

1. [Jak číst tento dokument](#1-jak-číst-tento-dokument)
2. [Návštěvník bez přihlášení](#2-návštěvník-bez-přihlášení)
3. [Registrace, přihlášení a profil](#3-registrace-přihlášení-a-profil)
4. [Přihlášený uživatel — co může dělat](#4-přihlášený-uživatel--co-může-dělat)
5. [Založení inzerátu](#5-založení-inzerátu)
6. [AI moderace a hydratace](#6-ai-moderace-a-hydratace)
7. [Editace inzerátu](#7-editace-inzerátu)
8. [Detail inzerátu a interakce](#8-detail-inzerátu-a-interakce)
9. [Platnost, expirace a obnovení](#9-platnost-expirace-a-obnovení)
10. [Nahlášení obsahu](#10-nahlášení-obsahu)
11. [Moderátoři a administrátoři (God Mode)](#11-moderátoři-a-administrátoři-god-mode)
12. [Speciální typy inzerátů](#12-speciální-typy-inzerátů)
13. [Globální informační lišta (Site Notice)](#13-globální-informační-lišta-site-notice)
14. [Související dokumenty](#14-související-dokumenty)

---

## 1. Jak číst tento dokument

| Pojem | Význam |
|-------|--------|
| **Klient / uživatel** | Návštěvník nebo přihlášený člověk používající web |
| **Inzerát** | Řádek v databázi (`posts`) — zboží, služba, událost nebo nemovitost |
| **Hydratace** | AI doplnění a úprava textu inzerátu (ne technický termín pro uživatele) |
| **God Mode** | Moderátorské nástroje přímo na produkčním webu |

Každá nová uživatelská nebo provozní činnost v projektu **musí být zapsána do této metodiky** (viz také [`PRD_v3.md`](./PRD_v3.md)).

---

## 2. Návštěvník bez přihlášení

### 2.1 Zobrazení homepage (HP)

1. Návštěvník otevře úvodní stránku `/`.
2. V hero sekci vidí hlavní sdělení: rychlá lokální inzerce s pomocí AI.
3. Pod hero sekcí se zobrazí **přehled inzerátů** — karty s náhledovou fotkou, názvem, cenou, lokalitou a datem **Vytvořeno** (v patičce karty vpravo).

### 2.2 Jak se inzeráty na HP vybírají a řadí

**Krok 1 — poloha návštěvníka**

- Web nejdřív požádá o polohu přes prohlížeč (GPS).
- Pokud uživatel polohu **povolí**, souřadnice se uloží do prohlížeče (`localStorage`) pro další návštěvy.
- Pokud polohu **odmítne**, inzeráty se dočasně nenačtou. Zobrazí se vyhledávací pole s **adresním našeptávačem** (Mapy.cz). Uživatel musí vybrat obec nebo městskou část z nabídky — teprve pak se načtou inzeráty v okolí.

**Krok 2 — lokální výpis**

- Systém hledá aktivní, neexpirované inzeráty v okolí.
- Okruh se postupně zvětšuje: **15 → 30 → 50 → 60 km**, dokud nenajde alespoň **6** inzerátů.
- Výsledky se řadí primárně podle **vzdálenosti** (nejbližší první).
- U **událostí** má přednost **datum konání** — nejbližší akce jsou nahoře.

**Krok 3 — celostátní fallback**

- Pokud ani v okruhu 60 km není dostatek inzerátů, zobrazí se **nejnovější inzeráty z celé republiky** a uživatel uvidí upozornění, že v okolí zatím nic není.

**Krok 4 — bez polohy**

- Bez uložené polohy se zobrazí **nejnovější inzeráty celostátně** (bez výpočtu vzdálenosti).

### 2.3 Filtrování podle kategorie

- Na HP jsou záložky kategorií: **Vše**, **Zboží**, **Služby**, **Události**, **Nemovitosti** (podle implementace v `home-themes.ts`).
- Výběr kategorie omezí výpis na daný typ inzerátu — lokální logika (okruh, fallback) zůstává stejná.
- URL může obsahovat parametr `?kategorie=…` pro sdílení konkrétního pohledu.

### 2.4 Vyhledávání na HP

- Uživatel může zadat hledaný výraz (min. **3 znaky**).
- Vyhledávání probíhá v názvu a popisu aktivních inzerátů.
- Lze kombinovat s kategorií a dalšími filtry (cena, stav, vzdálenost — pokud je poloha k dispozici).

### 2.5 Co návštěvník bez přihlášení vidí a co ne

| Může | Nemůže |
|------|--------|
| Prohlížet HP a detaily inzerátů | Zobrazit telefon nebo e-mail inzerenta |
| Číst komentáře pod inzerátem | Přidat komentář |
| Odeslat anonymní poptávku e-mailem | Založit nebo upravit inzerát |
| Nahlásit inzerát přes formulář `/nahlasit` | Nahlásit inline z detailu (vyžaduje přihlášení) |

### 2.6 Navigace a patička

Na všech stránkách je společná hlavička (logo, přihlášení, tlačítko „Založit inzerát“) a patička s odkazy na:

- O projektu, FAQ, VOP, GDPR, Podmínky inzerce
- Nahlásit inzerát (`/nahlasit`)
- Nastavení cookies

---

## 3. Registrace, přihlášení a profil

### 3.1 Způsoby přihlášení

1. **Google** — jedním kliknutím (preferovaná cesta).
2. **E-mail a heslo** — po registraci musí uživatel potvrdit e-mail odkazem; bez potvrzení není účet plně aktivní.

**Povinné souhlasy při registraci (e-mail i Google):**

- Prohlašuji, že mi je **alespoň 15 let** (včetně souhlasu zákonného zástupce 15–18 let, je-li vyžadován).
- Souhlas s **VOP** (bez něj účet nezaložíme).
- Volitelný souhlas s **marketingem**.

U Google OAuth se souhlasy vyplní na **onboardingu** (`/onboarding`), pokud účet nemá e-mailovou identitu.

### 3.2 První přihlášení — onboarding

1. Po prvním přihlášení systém zkontroluje, zda má uživatel **přezdívku** (`nickname`).
2. Pokud ne, přesměruje na `/onboarding`.
3. Uživatel zadá unikátní přezdívku — tu uvidí sousedé u jeho inzerátů a komentářů.
4. Teprve po dokončení onboarding může založit inzerát nebo vstoupit do klientské sekce.

### 3.3 Editace profilu

Přihlášený uživatel může upravit:

- avatar (max. 2 MB, komprese v prohlížeči),
- jméno, příjmení, přezdívku,
- volitelné telefonní číslo,
- heslo,
- smazat účet (GDPR) — sekce **`/profil/nastaveni`**: checkbox „nevratné“ + přepsání e-mailu pro potvrzení → odhlášení a redirect na `/login?message=account_deleted`. Komentáře pod cizími inzeráty zůstanou jako „[smazaný účet]“.

**E-mail nelze změnit** — je zobrazen jen ke čtení. Pro jinou adresu je nutné založit nový účet (po smazání lze stejnou adresu znovu registrovat).

### 3.4 Limity inzerátů (balíčky)

Každý nový účet dostane **20 lifetime publikací** zdarma (balíček `free`). Uživatel to vidí v **`/profil/nastaveni`**:

- štítek plánu **Free**,
- počítadlo **X / Y** (kolik publikací už spotřeboval / celkový limit),
- dlaždice budoucích balíčků (zatím vedou na kontakt provozovatele).

**Lifetime model:** každá **první publikace** inzerátu spotřebuje 1 kredit navždy. Smazání nebo expirace kredit **nevrátí**. Obnovení starého inzerátu kredit znovu nebere.

Zvýšení limitu pro konkrétního uživatele — viz [§11.6](#116-zvýšení-limitu-inzerátů-supabase).

### 3.5 Odhlášení

Uživatel se odhlásí z menu v hlavičce. Při další návštěvě zůstává uložená poloha v prohlížeči, ale přístup k chráněným akcím vyžaduje nové přihlášení.

---

## 4. Přihlášený uživatel — co může dělat

Po přihlášení a dokončení onboardingu má uživatel k dispozici:

| Činnost | Kde | Poznámka |
|---------|-----|----------|
| Zobrazit své inzeráty | `/moje-inzeraty` | Včetně expirovaných, pozastavených a zablokovaných |
| Založit nový inzerát | `/inzerat/novy` | 3krokový formulář + AI flow |
| Upravit vlastní inzerát | `/inzerat/[slug]/upravit` | Podle typu změny s/bez AI |
| Obnovit expirovaný inzerát | `/moje-inzeraty` | Prodloužení platnosti |
| Smazat inzerát | `/moje-inzeraty` | S povinným exit polem (důvod) |
| Zobrazit kontakt inzerenta | Detail cizího inzerátu | Max. 20× denně |
| Napsat prodejci / pořadateli | Detail inzerátu | Anonymní e-mail |
| Přidat komentář | Detail inzerátu | Max. 10 za hodinu |
| Nahlásit inzerát nebo komentář | Detail | Inline tlačítko |
| Prohlížet HP a cizí inzeráty | `/` | Stejně jako nepřihlášený |

---

## 5. Založení inzerátu

Cesta: **Přihlášení → `/inzerat/novy` → 3 kroky → AI kontrola → publikace**.

### Krok 1 — Kategorie a stav

Uživatel vybere:

- **Typ:** Zboží / Služby / Událost / Nemovitost
- **Podkategorii** (např. Elektronika, Opékání, Byty…)
- **Stav nebo typ nabídky** podle kategorie:
  - Zboží: Nové, Jako nové, Použité, Poškozené / na díly
  - Služby: Jednorázově, Dlouhodobě, Záskok
  - Události: Jednorázová / Pravidelná akce
  - Nemovitosti: Prodej / Pronájem

### Krok 2 — Obsah, cena a lokalita

| Pole | Pravidla |
|------|----------|
| Název | Povinný, max. 80 znaků; slouží i pro SEO a URL |
| Popis | Min. 10, max. 2000 znaků; hrubý text stačí — AI ho může upravit |
| Lokalita | Povinná; našeptávač Mapy.cz nebo „Použít aktuální polohu“ |
| Cena | Pevná / Za odvoz / Dohodou / Výměnou / Nabídni |
| Platnost | U zboží, služeb a nemovitostí: 1–365 dní (výchozí 30); u událostí se nevybírá — platí datum akce |
| Datum akce | U událostí povinné; musí být v budoucnosti (při novém založení) |
| Kontaktní preference | Volitelné zobrazení e-mailu / telefonu po kliknutí na „Zobrazit kontakt“ |

### Krok 3 — Fotografie

- Max. **6 fotek** (JPEG, PNG, WebP).
- Každá se před nahráním zkomprimuje na max. **1 MB**.
- Uživatel označí **hlavní fotku** (hvězdička) — ta je náhled na HP a referenční snímek pro cross-validaci text ↔ foto. AI hydratace vychází ze **všech** nahraných fotek.
- **Všechny** fotky procházejí bezpečnostní kontrolou, nejen hlavní.

### Publikace

Po kliknutí na **„Publikovat inzerát“**:

1. Zobrazí se celoobrazovkové načítání (AI běží).
2. Proběhne [AI moderace a hydratace](#6-ai-moderace-a-hydratace) (viz detailní popis níže).
3. Po schválení Server Action uloží inzerát nejprve jako **`draft`**, nahraje fotky a přes RPC **`publish_approved_post`** (s approval tokenem z AI) přepne na **`active`**.
4. URL má tvar `/inzerat/[slug]` — slug se generuje při první publikaci a **nemění se** při editaci.

Pokud publikace selže (chybí/neplatný token), inzerát zůstane ve stavu **Koncept** (`draft`) — majitel ho najde v `/moje-inzeraty` a může doupravit.

---

## 6. AI moderace a hydratace

Toto je klíčový proces při založení i úpravě inzerátu. Uživatel ho vnímá jako „AI náhled a doplnění“.

### 6.1 Proč to existuje

1. **Bezpečnost** — zabránit nelegálnímu obsahu (drogy, zbraně, porno…).
2. **Kvalita** — srozumitelný text, doplněné parametry podle kategorie.
3. **Ochrana kontaktů** — telefony a e-maily nepatří do veřejného popisu.

### 6.2 Kdy se spouští

| Akce | Spouští AI? |
|------|-------------|
| Nový inzerát — publikace | Ano |
| Změna názvu, popisu, kategorie nebo fotek | Ano |
| Změna jen ceny, lokality, stavu nebo platnosti | Ne — uloží se přímo |

### 6.3 Průběh krok za krokem

```
Formulář → klik „Publikovat“ / „Uložit“
    → Edge Function moderate-listing (AI: Gemini / GPT)
        → REJECTED     → popup „Inzerát nesplňuje pravidla“, nic se neuloží
        → NEEDS_QUESTIONS → modal s náhledem textu + doplňující otázky
        → APPROVED     → modal s náhledem upraveného textu (+ approvalToken)
    → uživatel volí v modalu
        → Doplnit, upravit a publikovat
        → Ignorovat AI a publikovat původní
        → Zrušit (návrat do formuláře)
    → Server Action createListing / updateListing
        → insert/update jako draft
        → upload fotek
        → publish_approved_post(token) → active (nebo hidden u pauznutého)
```

**Důležité:** AI se volá přímo z prohlížeče do Supabase (ne přes Next.js), aby nedocházelo k timeoutům. Klíče k AI jsou jen na serveru Edge Function. **Publikaci na `active` nelze obejít** — vyžaduje platný approval token z Edge Function (migrace `027`).

### 6.4 Co AI kontroluje na fotkách

| Kontrola | Rozsah |
|----------|--------|
| Bezpečnostní filtr | **Všechny** nahrané fotky (max. 6) |
| Shoda text ↔ foto | Hlavní fotka vs. název a popis |
| Doplňující otázky (hydratace) | **Všechny** fotografie + kategorie (hlavní fotka jen pro cross-validaci) |

Pokud **jedna** fotka porušuje pravidla, celý inzerát je zamítnut — výběr „čisté“ hlavní fotky neobejde kontrolu ostatních.

### 6.5 Co je hydratace textu

**Hydratace** = AI vezme hrubý nástřel od uživatele a připraví strukturovaný inzerát:

1. **Úvod** — až 6 vět (o čem inzerát je, cena, předání).
2. Oddělovač `---`
3. Sekce **Parametry** — odrážky ve tvaru `• Popisek: hodnota`

Příklad po hydrataci:

```
Prodám dětské kolo Velo v dobrém stavu. Cena 800 Kč, osobní předání v Brně-Líšni.
---
Parametry
• Značka: Velo
• Velikost kol: 20"
• Stav: použité, bez rezervy
```

Hydratace vychází z:

- textu, který uživatel napsal,
- kategorie a podkategorie (každá má vlastní AI pokyny v `categories.ts`),
- metadat z formuláře (cena, stav, datum akce — na tato pole se AI znovu neptá, pokud už jsou vyplněná),
- **všech** nahraných fotografií (vizuální kontext; hlavní fotka navíc pro shodu text ↔ náhled).

### 6.6 Stav NEEDS_QUESTIONS — doplňující dotazník

Když AI zjistí, že v inzerátu chybí **kritické informace** pro danou kategorii, nezamítne ho hned — vrátí stav `NEEDS_QUESTIONS` a položí **1–5 otázek**.

**Příklady podle kategorie:**

| Kategorie | Co AI typicky doplní / na co se zeptá |
|-----------|--------------------------------------|
| Zboží (auto, elektronika) | Rok, nájezd, kapacita, záruka… |
| Služby | Dojezd, materiál, rozsah práce |
| Události | Kapacita, přesná lokalita (datum už je ve formuláři) |
| Nemovitosti | Dispozice, výměra, vybavení |

**Průběh pro uživatele:**

1. V modalu vidí náhled AI textu (zatím bez chybějících parametrů).
2. Pod ním vyplní pole z dotazníku („Vylepšete svý inzerát“).
3. Po potvrzení se odpovědi **automaticky doplní** do sekce Parametry (s jednotkami — rozměry v **cm**, objem v **ml**, pokud uživatel jednotku nevyplní).
4. Odpovědi se **neukládají zvlášť** v databázi — jsou součástí finálního popisu.

**Jednotky v Parametrech:** AI se ptá s jednotkou v otázce (např. „Jaké jsou rozměry v cm?“) a `paramLabel` sladí s očekávaným parametrem (`Rozměry`, `Objem`). Klient při slučování odpovědí doplňuje `cm` / `ml`, pokud chybí.

**Limity délky:**

- Finální popis max. **2000 znaků**.
- Při dotazníku AI drží náhled do **1600 znaků** (rezerva 400 na odpovědi).

### 6.7 Modal po úspěšné kontrole — volby uživatele

| Tlačítko | Co se stane |
|----------|-------------|
| **Doplnit, upravit a publikovat** (doporučeno) | Uloží se AI verze (včetně odpovědí z dotazníku). Původní text se uloží do `original_title` / `original_description` pro metriky využití AI. |
| **Ignorovat AI a publikovat původní** | Uloží se text, který uživatel napsal do formuláře. Bezpečnostní filtr a odstranění kontaktů z popisu **platí vždy**. |
| **Zrušit** | Návrat do formuláře, inzerát se neuloží. |

### 6.8 Zamítnutí (REJECTED)

1. AI nebo bezpečnostní filtr detekuje zakázaný obsah.
2. Zobrazí se popup s důvodem a přehledem zakázaných kategorií.
3. Inzerát se **neuloží**.
4. Uživatel upraví text nebo fotky a zkusí znovu.

### 6.9 Ochrana kontaktů — tři vrstvy

I když uživatel napíše telefon nebo e-mail do popisu:

| Vrstva | Kde | Účel |
|--------|-----|------|
| 1 | AI (Edge Function) | Odstraní kontakty z navrženého textu |
| 2 | Server při ukládání | `stripContactInfo()` před zápisem do DB |
| 3 | PostgreSQL trigger | Pojistka proti obejití (API, Postman…) |

Kontakty patří do chráněných polí profilu / inzerátu a zobrazí se až po kliknutí na „Zobrazit kontakt“.

### 6.10 Limity a chyby

| Situace | Chování |
|---------|---------|
| Více než 20 AI kontrol za hodinu | Hláška o limitu, zkusit později |
| AI nedostupná / timeout (30 s) | Červená hláška ve formuláři, ne popup |
| Google zablokuje vstup (`PROHIBITED_CONTENT`) | Obsahové zamítnutí s hláškou o bezpečnostním filtru; u nevinných fotek mitigováno zkráceným Gemini promptem (`geminiSafe`) |
| Popis obsahuje datum po expiraci inzerátu | Varování ve formuláři (u zboží/služeb) |
| Chybí approval token při uložení | Inzerát zůstane `draft` (Koncept v UI) |

---

## 7. Editace inzerátu

Cesta: **`/moje-inzeraty` → Upravit → `/inzerat/[slug]/upravit`**.

### 7.1 Co uživatel může měnit

Stejný 3krokový formulář jako při založení, předvyplněný aktuálními daty.

### 7.2 Kdy znovu proběhne AI

- Změna **názvu, popisu, kategorie nebo fotek** → plná AI kontrola (včetně modalu); DB trigger dočasně degraduje inzerát na `draft`, po uložení s tokenem se obnoví na `active` (nebo `hidden`, pokud byl pauznutý).
- Změna **jen ceny, stavu, lokality nebo platnosti** → uložení bez AI.
- Inzerát ve stavu **Zablokováno** (`blocked`) → úprava obsahu/fotek je jediná cesta ven; po uložení s AI tokenem → `active`. Bez tlačítka „Zveřejnit“.
- Inzerát ve stavu **Koncept** (`draft`) → AI kontrola proběhne vždy (i beze změny textu), aby vznikl nový approval token.

### 7.3 Co se nemění

- **URL slug** zůstává stejný (stabilita odkazů a SEO).
- Majitel vidí inzerát ve svém seznamu i ve stavech, které nejsou veřejné (expirovaný, pozastavený, zablokovaný).

### 7.4 Zablokovaný inzerát (`blocked`)

Inzerát přejde do stavu **Zablokováno**, pokud:

1. **3 různí uživatelé** ho nahlásí (trigger `check_report_threshold`, migrace `036`), nebo
2. **moderátor/admin** ho zablokuje (God Mode / SQL — `status_reason_code = 'moderation'`).

| Co majitel vidí | Chování |
|-----------------|---------|
| Badge „Zablokováno“ | Červený štítek v `/moje-inzeraty` |
| `ListingBlockedNotice` | Vysvětlení dle `status_reason_code` + návod na obnovu |
| Akce | **Upravit**, **Smazat** — bez Zveřejnit / Prodloužit |

**Obnovení:** úprava textu nebo fotek → DB trigger nastaví `draft` → AI moderace → `publish_approved_post` → `active`.

**Rozdíl od pauzy (`hidden`):** u pauzy majitel klikne „Zveřejnit“ bez re-moderace. Zablokování vyžaduje opravu obsahu.

Právní rámec: [Pravidla inzerce](../pravni/podminky-inzerce.md) §4, [VOP](../pravni/vop.md) §4.5, [DSA centrum](../pravni/dsa-kontaktni-centrum.md) §3.

---

## 8. Detail inzerátu a interakce

Cesta: **Klik na kartu na HP → `/inzerat/[slug]`**.

### 8.1 Co detail zobrazuje

- Název, galerie (až 6 fotek), strukturovaný popis (úvod + Parametry)
- Cena, stav, lokalita, typ kategorie, datum **Vytvořeno** (`created_at`)
- U událostí: datum konání
- U nemovitostí: Prodej / Pronájem
- Komentáře od přihlášených uživatelů

### 8.2 Zobrazení kontaktu

1. Telefon a e-mail **nejsou** v HTML stránky ani v přímém SELECT na `posts`/`profiles` (column-level REVOKE + RLS).
2. Přihlášený uživatel klikne **„Zobrazit kontakt“**.
3. Server zavolá RPC **`reveal_listing_contact`** — ověří viditelnost inzerátu, opt-in vlajky, rate limit; zapíše `contact_reveals`; vrátí PII.
4. Limit: **20 zobrazení za den** na uživatele (unikátní inzeráty; opětovné otevření téhož inzerátu limit nespotřebuje).

### 8.3 Poptávkový formulář

- Nepřihlášený i přihlášený může odeslat zprávu inzerentovi e-mailem.
- E-mail prodejce zůstává skrytý — doručení přes Resend.
- U **událostí** je tlačítko **„Mám zájem o účast“** — stejný mechanismus, jiný text e-mailu.
- Metadata o odeslání se loguje (bez obsahu zprávy — GDPR).

### 8.4 Komentáře

1. Pouze **přihlášení** uživatelé mohou přidat komentář.
2. Zobrazí se přezdívka autora (uložená v okamžiku odeslání).
3. Limit: **10 komentářů za hodinu**.
4. Komentář lze nahlásit — po **3 nahlášeních od 3 různých uživatelů** se skryje.

### 8.5 SEO a strojová čitelnost

Web je připravený pro vyhledávače (Google, Seznam) a AI crawlery. Samotná technická příprava **nezaručuje** okamžitou viditelnost v organickém vyhledávání — Google musí stránky nejdřív objevit, zaindexovat a teprve pak je může zobrazovat ve výsledcích. K tomu pomáhá registrace v [Google Search Console](https://search.google.com/search-console) a odeslání sitemap.

#### Co uživatel / robot vidí na webu

| URL | Co to je |
|-----|----------|
| `/sitemap.xml` | Seznam všech stránek, které chceme indexovat |
| `/robots.txt` | Pravidla pro roboty — co smí a co nesmí procházet |
| `/llms.txt` | Stručný popis webu pro AI modely (ChatGPT, Perplexity…) |
| `/inzerat/{slug}` | Detail s JSON-LD strukturovanými daty v HTML |

#### Detail inzerátu

- **Schema.org JSON-LD** podle typu kategorie (`Product`, `Service`, `Event`, `RealEstateListing`, `JobPosting`) — helper `src/lib/seo/listing-json-ld.ts`
- Dynamické **meta tagy** v `<head>`: title, description, Open Graph, canonical URL

#### Soubory v repozitáři — co který dělá

**`src/app/sitemap.ts`** → generuje `/sitemap.xml`

- Next.js při požadavku na `/sitemap.xml` spustí tuto funkci a vrátí XML se seznamem URL.
- Obsahuje **statické stránky**: `/`, `/vop`, `/podminky-inzerce`, `/marketingovy-souhlas`.
- Obsahuje **aktivní inzeráty** — načte je přes `get-sitemap-listings.ts`.
- **`revalidate = 300`** (5 minut): cache se obnoví nejpozději za 5 minut, takže nový nebo expirovaný inzerát se v sitemap projeví bez ručního zásahu.
- Expirované nebo smazané inzeráty v sitemap **nejsou** — vyhledávač je nemá indexovat.

**`src/app/robots.ts`** → generuje `/robots.txt`

- Říká robotům (Googlebot, Bingbot…), které části webu **smí procházet**.
- **`allow: /`** — veřejný web je povolený.
- **`disallow`** — blokované cesty: `/api/`, `/auth/`, `/login`, `/onboarding`, `/moje-inzeraty`, `/inzerat/novy`, `/inzerat/*/upravit` (privátní a administrační oblasti).
- Obsahuje odkaz na sitemap: `Sitemap: https://…/sitemap.xml` (URL z `NEXT_PUBLIC_SITE_URL`).

**`src/lib/seo/get-sitemap-listings.ts`** → dotaz do databáze pro sitemap

- Načte z tabulky `posts` pouze inzeráty se `status = 'active'` a platnou expirací (`expires_at` je null nebo v budoucnosti).
- Vrátí slug a `updated_at` pro každý záznam — sitemap z toho sestaví URL `/inzerat/{slug}` a datum poslední změny.
- Používá anonymní Supabase klient (`src/lib/supabase/public.ts`) — bez přihlášení, jen veřejná data povolená RLS.

**`public/llms.txt`** → statický soubor na `/llms.txt`

- Konvence pro **LLM crawlery** (AI asistenti, kteří procházejí web).
- Lidsky čitelný přehled: co web dělá, které URL jsou veřejné, které vyžadují přihlášení, kde je sitemap.
- Není povinný pro Google; doplňuje robots.txt a sitemap pro AI nástroje.

#### Co ještě chybí pro plnou organiku

- Registrace v **Google Search Console** a ruční odeslání sitemap
- Vlastní doména (volitelně — `*.vercel.app` funguje, ale vlastní doména pomáhá důvěryhodnosti)
- Čas a obsah — nový web se v organice neobjeví hned

---

## 9. Platnost, expirace a obnovení

### 9.1 Běžné inzeráty (zboží, služby, nemovitosti)

- Uživatel zvolí platnost **1–365 dní** (výchozí 30).
- Datum expirace (`expires_at`) počítá **databáze**, ne frontend.
- Po expiraci inzerát **zmizí z webu**, ale **zůstane v databázi** ve stavu `archived`.
- Majitel ho vidí v `/moje-inzeraty` a může:
  - **Obnovit** — znovu aktivovat a prodloužit platnost,
  - **Upravit**,
  - **Smazat** (soft delete).

### 9.2 Události

- Platnost se **nevolí** — inzerát vyprší **den po datu konání** (`event_date + 1 den`).
- Na HP se události řadí podle nejbližšího termínu.

### 9.3 Smazání inzerátu majitelem

1. Uživatel zvolí smazat.
2. Systém zobrazí **exit poll** — povinný výběr důvodu (prodal zde / jinde / neprodal / jiné).
3. Inzerát přejde do stavu `deleted` — zmizí z veřejného webu i z aktivního seznamu majitele.

---

## 10. Nahlášení obsahu

### 10.1 Inline z detailu (přihlášený uživatel)

- Tlačítko „Nahlásit“ u inzerátu nebo komentáře.
- Výběr důvodu (podvod, nelegální obsah, spam…).
- Po **3 nahlášeních od 3 různých uživatelů** se inzerát automaticky **zablokuje** (`blocked`) a spadne do karantény pro moderátory. Komentáře při stejném prahu přejdou na `hidden`.

### 10.2 Standalone formulář `/nahlasit`

- Dostupný z patičky — i pro nepřihlášené.
- Pole: URL inzerátu, důvod, volitelný popis, e-mail oznamovatele.
- Po odeslání: záznam v databázi, e-mail administrátorovi, potvrzení uživateli.

---

## 11. Moderátoři a administrátoři (God Mode)

Role: `user`, `moderator` a `admin` (uloženo v `profiles.role`). Samostatný admin login neexistuje — stejné přihlášení jako u běžného uživatele.

### 11.1 Nastavení role (admin / moderátor)

Role se **nastavuje v databázi**, ne v aplikaci. Postup je v [`supabase-prikazy.md` § Nastavení admina](./supabase-prikazy.md#nastavení-admina-a-moderátora).

**Shrnutí:**

1. Účet musí existovat (registrace / přihlášení v aplikaci).
2. V Supabase SQL Editoru najdi UUID: `SELECT id, email, role FROM profiles WHERE email = '…';`
3. **První admin:** trigger `prevent_role_escalation` blokuje změnu role → dočasně `DISABLE TRIGGER trg_profiles_prevent_role_escalation`, pak `UPDATE profiles SET role = 'admin'`, pak `ENABLE TRIGGER`.
4. **Další admin/moderátor:** stejný `UPDATE` (pokud už jeden admin existuje a SQL Editor má kontext admina; jinak znovu bootstrap postup).
5. Odhlásit se a znovu přihlásit — v menu admin uvidí **„God Mode · Uživatelé“**.

**Co funguje po nastavení admina:** `/mod/uzivatele` — seznam uživatelů, smazání účtu (včetně inzerátů), přidělení partnerského balíčku (+20 inzerátů).

### 11.2 Kde moderátor pracuje

| Stránka | Účel | Stav |
|---------|------|------|
| `/mod/karantena` | Zablokované inzeráty (`blocked`) a skryté komentáře (`hidden`) — obnovit nebo smazat | zatím ne |
| `/mod/inzeraty` | Přehled všech inzerátů s filtry | zatím ne |
| `/mod/uzivatele` | Jen admin — správa uživatelů, smazání účtu, balíčky | **ano** |
| Detail cizího inzerátu | Lišta: Skrýt, Smazat, Historie, Poznámka | zatím ne |

Do doby dokončení UI lze inzeráty moderovat přes SQL Editor (viz `supabase-prikazy.md`) nebo smazáním celého účtu v `/mod/uzivatele`.

### 11.3 Typický postup moderátora

1. Přijde e-mail o nahlášení nebo otevře karanténu.
2. Prohlédne inzerát na produkčním webu (stejný vzhled jako uživatelé).
3. Rozhodne: **obnovit** (vrátit mezi aktivní) nebo **smazat / ponechat skrytý**.
4. U akce zadá **důvod** (povinný dropdown) a volitelnou poznámku.
5. Vše se zapíše do **audit logu** (`audit_events`).

### 11.4 Historie a poznámky

U inzerátu nebo profilu moderátor vidí časovou osu:

- změny stavu,
- odhalení kontaktů,
- odeslané poptávky,
- nahlášení.

Ruční poznámky (`moderator_notes`) vidí jen moderátor/admin — běžný uživatel ne.

### 11.5 Rozdíl moderator vs. admin

| Oprávnění | Moderátor | Admin |
|-----------|-----------|-------|
| Skrýt / smazat inzerát nebo komentář | Ano | Ano |
| Upravit cizí inzerát | Ano | Ano |
| Správa profilů a rolí | Ne | Ano |
| `/mod/uzivatele` | Ne | Ano |
| Přidělit balíček inzerátů (+20) | Ne | Ano (UI i SQL) |

### 11.6 Zvýšení limitu inzerátů (Supabase)

Provozovatel může uživateli navýšit počet **lifetime publikací** — typicky kamarádovi, beta testerovi nebo po ruční platbě (dokud neběží platební brána).

#### Kde to v databázi leží

| Tabulka | Účel |
|---------|------|
| `listing_packages` | Katalog balíčků (šablony: `free`, `promo_partner`, `standard_20`…) |
| `user_listing_entitlements` | Co konkrétní uživatel **dostal** — každý řádek přidá quota k limitu |
| `posts.listing_quota_consumed` | `true` = inzerát už spotřeboval 1 kredit (po první publikaci) |

**Limit uživatele** = součet `listing_quota` ze všech jeho řádků v `user_listing_entitlements`.  
**Spotřeba** = počet inzerátů s `listing_quota_consumed = true`.

Migrace: `supabase/038_listing_quota.sql` (+ `039_listing_quota_lifetime.sql`, pokud 038 běžela dříve).

#### A) God Mode (nejjednodušší)

1. Přihlásit se jako **admin**.
2. **`/mod/uzivatele`** → u uživatele **„+20 inzerátů“** → potvrdit.

Přidá balíček `promo_partner`. Opakováním přidáš dalších +20.

#### B) SQL — přidělit +20 (existující balíček)

Supabase Dashboard → **SQL Editor**:

```sql
-- 1) Najdi UUID uživatele
SELECT id, profile_no, nickname, email
FROM public.profiles
WHERE nickname ILIKE '%jan%' OR email ILIKE '%@example.com%';

-- 2) Přidělení partnerského balíčku (+20)
SELECT public.admin_grant_listing_package(
  'VLOŽ-UUID-UŽIVATELE'::uuid,
  'promo_partner',
  'Kamarád — beta tester'
);
```

Další slugy v katalogu `listing_packages`:

| slug | quota | kdy použít |
|------|-------|------------|
| `free` | 20 | automaticky při registraci — ručně jen pokud chybí |
| `promo_partner` | 20 | kamarád, partner, manuální grant |
| `standard_20` | 20 | budoucí placený balíček (50 Kč) — zatím bez platby |

Příklad pro `standard_20`:

```sql
SELECT public.admin_grant_listing_package(
  'VLOŽ-UUID-UŽIVATELE'::uuid,
  'standard_20',
  'Kamarád — sleva / test'
);
```

> Funkce `admin_grant_listing_package` vyžaduje roli **admin** v aplikaci. V SQL Editoru bez JWT může selhat — v tom případě použij God Mode (A) nebo variantu C s přímým INSERT.

#### C) SQL — jiný počet než 20

Balíčky se **sčítají**.

**Opakovat grant** (např. +60 = 3× po 20):

```sql
SELECT public.admin_grant_listing_package('UUID', 'promo_partner', 'Kamarád +20 #1');
SELECT public.admin_grant_listing_package('UUID', 'promo_partner', 'Kamarád +20 #2');
SELECT public.admin_grant_listing_package('UUID', 'promo_partner', 'Kamarád +20 #3');
```

**Vlastní quota v jednom kroku** (např. +50):

```sql
INSERT INTO public.user_listing_entitlements (
  user_id, package_id, listing_quota, granted_by, note
)
SELECT
  'VLOŽ-UUID-UŽIVATELE'::uuid,
  lp.id,
  50,
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
  'Kamarád — vlastní quota +50'
FROM public.listing_packages lp
WHERE lp.slug = 'promo_partner';
```

(Rozhodující je sloupec `listing_quota` v entitlementu, ne hodnota v katalogu.)

**Nový typ balíčku v katalogu** (pro opakované použití):

```sql
INSERT INTO public.listing_packages (
  slug, display_name, listing_quota, description, sort_order
)
VALUES (
  'friend_50', 'Kamarádský balíček 50', 50,
  'Manuálně přidělený balíček pro vybrané uživatele.', 15
)
ON CONFLICT (slug) DO NOTHING;

SELECT public.admin_grant_listing_package('UUID', 'friend_50', 'Kamarád');
```

#### Ověření

```sql
-- Stejné údaje jako v profilu (/profil/nastaveni)
SELECT * FROM public.get_user_listing_quota('VLOŽ-UUID-UŽIVATELE'::uuid);

-- Historie přidělení
SELECT e.entitlement_no, e.listing_quota, e.granted_at, e.note, lp.slug
FROM public.user_listing_entitlements e
JOIN public.listing_packages lp ON lp.id = e.package_id
WHERE e.user_id = 'VLOŽ-UUID-UŽIVATELE'::uuid
ORDER BY e.granted_at;
```

Po změně uživatel uvidí nový limit v **`/profil/nastaveni`**. Admin a moderátor limity nemají.

Detailní technická reference: [`supabase-prikazy.md` § Ruční přidělení balíčku](./supabase-prikazy.md#ruční-přidělení-balíčku-inzerátů-kamarád--beta-tester).

---

## 12. Speciální typy inzerátů

### 12.1 Události

- Povinné datum a čas konání.
- Registrace účastníků = poptávkový formulář (žádná tabulka účastníků v DB).
- Pořadatel odpovídá ze svého e-mailu.

### 12.2 Nemovitosti

- Typ transakce: Prodej nebo Pronájem.
- Cenové modely: Pevná, Dohodou, Nabídni (bez „Za odvoz“ / „Výměnou“).
- Stejná platnost jako u zboží a služeb.

### 12.3 Zboží ve stavu „Poškozené / na díly“

- Samostatná volba stavu pro inzeráty určené k opravě nebo na náhradní díly.

---

## 13. Globální informační lišta (Site Notice)

Tenká lišta **nad hlavičkou** na všech stránkách (`AppShell`). Slouží k oznámení provozní zprávy **bez odstávky webu** — web běží dál, lišta jen upozorní. Viz PRD §12.4.

### 13.1 Tři varianty

| Varianta | Kód | Barva | Typické použití |
|----------|-----|-------|-----------------|
| Informativní | `info` | modrá | „Nově AI úprava inzerátu“, „Beta verze“ |
| Marketingová | `marketing` | zelená | „Pozvěte souseda — sdílejte odkaz“ |
| Odstávková | `maintenance` | červená | „Dnes 22:00 krátká odstávka kvůli migraci DB“ |

`info` a `marketing` jde uživateli zavřít (zapamatuje se v prohlížeči). `maintenance` zavřít **nelze** (nastaveno automaticky).

### 13.2 Kde se to nastavuje

Jediný zdroj pravdy: **`src/config/site-notice.ts`** (výchozí hodnoty) + **env proměnné** `NEXT_PUBLIC_SITE_NOTICE_*` (override pro produkci bez úpravy kódu).

| Env proměnná | Hodnoty | Význam |
|--------------|---------|--------|
| `NEXT_PUBLIC_SITE_NOTICE_ENABLED` | `true` / `false` | Zapnutí lišty (při prázdném textu se nezobrazí) |
| `NEXT_PUBLIC_SITE_NOTICE_VARIANT` | `info` / `marketing` / `maintenance` | Vzhled a chování |
| `NEXT_PUBLIC_SITE_NOTICE_MESSAGE` | text (1–2 věty, §1.7) | Obsah hlášky |
| `NEXT_PUBLIC_SITE_NOTICE_LINK_HREF` | `/faq` nebo `https://…` | Volitelný odkaz „Více“ |
| `NEXT_PUBLIC_SITE_NOTICE_LINK_LABEL` | text | Volitelný popisek odkazu (výchozí: „Více informací“) |

> `NEXT_PUBLIC_*` se načítají při **buildu / startu** — po každé změně je nutný **restart dev serveru** nebo **redeploy** na Vercel. Za běhu se nemění.

### 13.3 Lokální vývoj — soubor `.env.local`

1. Do `.env.local` v kořeni projektu přidej proměnné (viz příklady níže).
2. Restartuj dev server (`npm run dev`).

**Příklad — odstávka:**

```bash
NEXT_PUBLIC_SITE_NOTICE_ENABLED=true
NEXT_PUBLIC_SITE_NOTICE_VARIANT=maintenance
NEXT_PUBLIC_SITE_NOTICE_MESSAGE=Dnes ve 22:00 proběhne krátká odstávka kvůli migraci databáze. Web poběží dál.
```

**Příklad — informativní s odkazem:**

```bash
NEXT_PUBLIC_SITE_NOTICE_ENABLED=true
NEXT_PUBLIC_SITE_NOTICE_VARIANT=info
NEXT_PUBLIC_SITE_NOTICE_MESSAGE=Novinka: inzerát teď učeše AI za vás.
NEXT_PUBLIC_SITE_NOTICE_LINK_HREF=/faq
NEXT_PUBLIC_SITE_NOTICE_LINK_LABEL=Jak to funguje
```

**Příklad — marketing:**

```bash
NEXT_PUBLIC_SITE_NOTICE_ENABLED=true
NEXT_PUBLIC_SITE_NOTICE_VARIANT=marketing
NEXT_PUBLIC_SITE_NOTICE_MESSAGE=Pozvěte souseda a sdílejte odkaz na Hobby User Market.
```

> Pozor: hodnota jde do konce řádku, bez uvozovek; znak `#` uprostřed textu se bere jako komentář.

### 13.4 Produkce (Vercel)

**Přes web (doporučeno):** Vercel → projekt → **Settings → Environment Variables** → přidej proměnné → **Redeploy**.

**Přes CLI:**

```bash
vercel env add NEXT_PUBLIC_SITE_NOTICE_ENABLED production
vercel env add NEXT_PUBLIC_SITE_NOTICE_VARIANT production
vercel env add NEXT_PUBLIC_SITE_NOTICE_MESSAGE production
vercel --prod
```

### 13.5 Vypnutí lišty

Nastav `NEXT_PUBLIC_SITE_NOTICE_ENABLED=false` (nebo vymaž `NEXT_PUBLIC_SITE_NOTICE_MESSAGE`) a redeploy. Lišta se přestane vykreslovat — nulový vizuální dopad.

### 13.6 Bez env — přímo v kódu

Alternativně uprav `DEFAULT_CONFIG` v `src/config/site-notice.ts` (`enabled`, `variant`, `message`, volitelně `link`) a commitni — Vercel se nasadí sám. Env override má vždy přednost před `DEFAULT_CONFIG`.

---

## 14. Související dokumenty

| Dokument | Obsah |
|----------|-------|
| [`PRD_v3.md`](./PRD_v3.md) | Produktová a technická specifikace |
| [`moderace-inzeratu.md`](./moderace-inzeratu.md) | Konfigurace AI pravidel, deploy, sync |
| [`supabase-prikazy.md`](./supabase-prikazy.md#nastavení-admina-a-moderátora) | SQL, migrace, bootstrap admina, **zvýšení limitu inzerátů** |
| [`future_events.md`](./future_events.md) | Rozšíření modulu událostí |
| [`future_jobs.md`](./future_jobs.md) | Plánovaný modul práce |
| [`terminal-prikazy.md`](./terminal-prikazy.md) | Příkazy pro vývoj a deploy |
| [`ui-prvky.md`](./ui-prvky.md) | Sdílené UI prvky (CTA, modály, pilulky) — kód v `src/config/ui-primitives.ts` |
| Site Notice | Konfigurace: `src/config/site-notice.ts`; komponenta: `src/components/layout/SiteNoticeBar.tsx` |

---

*Při přidání nové funkce nebo změně chování aktualizujte tento dokument ve stejném PR jako kód.*
