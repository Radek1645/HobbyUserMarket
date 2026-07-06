# Metodika — Local Hobby Market

> **Účel:** Srozumitelný přehled všech procesů a postupů, které v projektu mohou nastat. Dokument je určen pro vývojáře, moderátory, produktové vlastníky i kohokoliv, kdo potřebuje rychle pochopit, *co se na webu děje a proč*.  
> **Technická specifikace:** [`PRD_v3.md`](./PRD_v3.md) · **Moderace (implementace):** [`moderace-inzeratu.md`](./moderace-inzeratu.md)  
> **Datum:** 2026-07-06

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
13. [Související dokumenty](#13-související-dokumenty)

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
3. Pod hero sekcí se zobrazí **přehled inzerátů** — karty s náhledovou fotkou, názvem, cenou a lokalitou.

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
- smazat účet (GDPR).

**E-mail nelze změnit** — je zobrazen jen ke čtení. Pro jinou adresu je nutné založit nový účet.

### 3.4 Odhlášení

Uživatel se odhlásí z menu v hlavičce. Při další návštěvě zůstává uložená poloha v prohlížeči, ale přístup k chráněným akcím vyžaduje nové přihlášení.

---

## 4. Přihlášený uživatel — co může dělat

Po přihlášení a dokončení onboardingu má uživatel k dispozici:

| Činnost | Kde | Poznámka |
|---------|-----|----------|
| Zobrazit své inzeráty | `/moje-inzeraty` | Včetně expirovaných a skrytých |
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
- Uživatel označí **hlavní fotku** (hvězdička) — ta je náhled na HP a vstup pro AI hydrataci.
- **Všechny** fotky procházejí bezpečnostní kontrolou, nejen hlavní.

### Publikace

Po kliknutí na **„Publikovat inzerát“**:

1. Zobrazí se celoobrazovkové načítání (AI běží).
2. Proběhne [AI moderace a hydratace](#6-ai-moderace-a-hydratace) (viz detailní popis níže).
3. Po schválení se inzerát uloží se stavem `active` a objeví se na webu.
4. URL má tvar `/inzerat/[slug]` — slug se generuje při první publikaci a **nemění se** při editaci.

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
        → APPROVED     → modal s náhledem upraveného textu
    → uživatel volí v modalu
        → Doplnit, upravit a publikovat
        → Ignorovat AI a publikovat původní
        → Zrušit (návrat do formuláře)
    → Server uloží inzerát (createListing / updateListing)
```

**Důležité:** AI se volá přímo z prohlížeče do Supabase (ne přes Next.js), aby nedocházelo k timeoutům. Klíče k AI jsou jen na serveru Edge Function.

### 6.4 Co AI kontroluje na fotkách

| Kontrola | Rozsah |
|----------|--------|
| Bezpečnostní filtr | **Všechny** nahrané fotky (max. 6) |
| Shoda text ↔ foto | Hlavní fotka vs. název a popis |
| Doplňující otázky (hydratace) | Primárně z hlavní fotky a kategorie |

Pokud **jedna** fotka porušuje pravidla, celý inzerát je zamítnut — výběr „čisté“ hlavní fotky neobejde kontrolu ostatních.

### 6.5 Co je hydratace textu

**Hydratace** = AI vezme hrubý nástřel od uživatele a připraví strukturovaný inzerát:

1. **Úvod** — 1–3 věty (o čem inzerát je, cena, předání).
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
- hlavní fotky (vizuální kontext).

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
3. Po potvrzení se odpovědi **automaticky doplní** do sekce Parametry.
4. Odpovědi se **neukládají zvlášť** v databázi — jsou součástí finálního popisu.

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
| Popis obsahuje datum po expiraci inzerátu | Varování ve formuláři (u zboží/služeb) |

---

## 7. Editace inzerátu

Cesta: **`/moje-inzeraty` → Upravit → `/inzerat/[slug]/upravit`**.

### 7.1 Co uživatel může měnit

Stejný 3krokový formulář jako při založení, předvyplněný aktuálními daty.

### 7.2 Kdy znovu proběhne AI

- Změna **názvu, popisu, kategorie nebo fotek** → plná AI kontrola (včetně modalu).
- Změna **jen ceny, stavu, lokality nebo platnosti** → uložení bez AI.

### 7.3 Co se nemění

- **URL slug** zůstává stejný (stabilita odkazů a SEO).
- Majitel vidí inzerát ve svém seznamu i ve stavech, které nejsou veřejné (expirovaný, skrytý).

---

## 8. Detail inzerátu a interakce

Cesta: **Klik na kartu na HP → `/inzerat/[slug]`**.

### 8.1 Co detail zobrazuje

- Název, galerie (až 6 fotek), strukturovaný popis (úvod + Parametry)
- Cena, stav, lokalita, typ kategorie
- U událostí: datum konání
- U nemovitostí: Prodej / Pronájem
- Komentáře od přihlášených uživatelů

### 8.2 Zobrazení kontaktu

1. Telefon a e-mail **nejsou** v HTML stránky (ochrana před roboty).
2. Přihlášený uživatel klikne **„Zobrazit kontakt“**.
3. Kontakt se zobrazí; událost se zapíše do `contact_reveals`.
4. Limit: **20 zobrazení za den** na uživatele.

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
- Po **3 nahlášeních od 3 různých uživatelů** se obsah automaticky skryje (`hidden`) a spadne do karantény pro moderátory.

### 10.2 Standalone formulář `/nahlasit`

- Dostupný z patičky — i pro nepřihlášené.
- Pole: URL inzerátu, důvod, volitelný popis, e-mail oznamovatele.
- Po odeslání: záznam v databázi, e-mail administrátorovi, potvrzení uživateli.

---

## 11. Moderátoři a administrátoři (God Mode)

Role: `moderator` a `admin` (uloženo v `profiles.role`).

### 11.1 Kde moderátor pracuje

| Stránka | Účel |
|---------|------|
| `/mod/karantena` | Skryté inzeráty a komentáře — obnovit nebo smazat |
| `/mod/inzeraty` | Přehled všech inzerátů s filtry |
| `/mod/uzivatele` | Jen admin — správa uživatelů a rolí |
| Detail cizího inzerátu | Lišta: Skrýt, Smazat, Historie, Poznámka |

### 11.2 Typický postup moderátora

1. Přijde e-mail o nahlášení nebo otevře karanténu.
2. Prohlédne inzerát na produkčním webu (stejný vzhled jako uživatelé).
3. Rozhodne: **obnovit** (vrátit mezi aktivní) nebo **smazat / ponechat skrytý**.
4. U akce zadá **důvod** (povinný dropdown) a volitelnou poznámku.
5. Vše se zapíše do **audit logu** (`audit_events`).

### 11.3 Historie a poznámky

U inzerátu nebo profilu moderátor vidí časovou osu:

- změny stavu,
- odhalení kontaktů,
- odeslané poptávky,
- nahlášení.

Ruční poznámky (`moderator_notes`) vidí jen moderátor/admin — běžný uživatel ne.

### 11.4 Rozdíl moderator vs. admin

| Oprávnění | Moderátor | Admin |
|-----------|-----------|-------|
| Skrýt / smazat inzerát nebo komentář | Ano | Ano |
| Upravit cizí inzerát | Ano | Ano |
| Správa profilů a rolí | Ne | Ano |
| `/mod/uzivatele` | Ne | Ano |

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

## 13. Související dokumenty

| Dokument | Obsah |
|----------|-------|
| [`PRD_v3.md`](./PRD_v3.md) | Produktová a technická specifikace |
| [`moderace-inzeratu.md`](./moderace-inzeratu.md) | Konfigurace AI pravidel, deploy, sync |
| [`future_events.md`](./future_events.md) | Rozšíření modulu událostí |
| [`future_jobs.md`](./future_jobs.md) | Plánovaný modul práce |
| [`terminal-prikazy.md`](./terminal-prikazy.md) | Příkazy pro vývoj a deploy |

---

*Při přidání nové funkce nebo změně chování aktualizujte tento dokument ve stejném PR jako kód.*
