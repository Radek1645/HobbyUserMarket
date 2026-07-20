# SEO Bible — inzeráty zaPikolou.cz

> **Verze:** 1.3  
> **Datum:** 2026-07-20  
> **Účel:** Jediný kanonický zdroj pravidel pro SEO inzerátů (AI hydratace, meta tagy, strukturovaná data, alt texty).  
> **Verzování:** viz [`README.md`](./README.md) · historie [`CHANGELOG.md`](./CHANGELOG.md) · snapshot [`snapshots/seo-bible-v1.3.md`](./snapshots/seo-bible-v1.3.md)  
> **Kódová verze:** `LISTING_SEO_BIBLE_VERSION` v `src/config/listing-seo.ts`

Při rozporu mezi ad-hoc promptem a touto biblí platí **tato bible**. Prompt v `build-prompt.ts` ji musí odrážet.

---

## 1. Cíl

Organická návštěvnost z běžných českých dotazů (lidové názvy + lokalita + use-case), ne jen technické e-shopové fráze. Hlavní páka je **H1 / `posts.title`**, ne jen synonyma v popisu.

---

## 2. Oddělené SEO bloky

AI hydratace (Edge `moderate-listing`) vrací JSON — ne markdown sekce. Mapování:

| Blok (koncept) | AI / kód | Uložení / použití |
|----------------|----------|-------------------|
| **H1** | AI → `cleanedTitle` | `posts.title` → viditelný `<h1>` |
| **META_TITLE** | **Kód** `buildListingMetaTitle` | Jen v `<title>` / OG — **neukládá se** (v1.0) |
| **META_DESCRIPTION** | AI → `metaDescription` | `posts.meta_description` → `<meta name="description">` |
| **TEXT_INZERÁTU** | AI → `cleanedDescription` | `posts.description` (úvod + `---` + Parametry) |
| **ALT** | AI → `imageAlt` | `posts.image_alt` → alt hlavní fotky / OG |

`cleanedTitle` (H1) a META_TITLE **nejsou stejný řetězec**.

---

## 3. Pravidla obsahu

### 3.1 H1 (`cleanedTitle` / `posts.title`)

1. Začíná **nejobecnějším** pojmenováním věci (Baterie, Zimní pneu, Kočárek…), pak značka/model a klíčová specifikace.
2. Cílová délka **max 45 znaků** — musí zbýt prostor v `<title>` pro lokalitu a brand.
3. **Čistý nadpis** — bez závorek se synonymy (`Baterie (akumulátor)…`), bez use-case („na elektrokolo“). Synonyma a use-case patří do **úvodu popisu**.
4. **Zákaz vaty:** `- málo používaný`, `super stav`, `cca 5,5 mm`, „jako nové“.
5. **Bez lokality** v H1 — lokalita jde do meta title a do textu.

Příklad dobrého H1: `Baterie Li-ion 48V 17Ah Samsung`  
Špatně: `Baterie (akumulátor) Li-ion 48V 17Ah Samsung na elektrokolo`

### 3.2 META_TITLE (kód)

Formát ideál: `{H1} – {Lokalita} | zaPikolou.cz`

Max **60 znaků**. Při přetečení (priorita držet lokalitu + brand):

1. **zkrať H1 zprava** (specifikace),
2. teprve pak vynech `| zaPikolou.cz`,
3. pak vynech lokalitu.

Implementace: `src/lib/seo/build-listing-meta-title.ts`.

### 3.3 META_DESCRIPTION

- Délka **povinně 150–160 znaků** (AI; krátké doplní kód CTA padem v `ensureMetaDescriptionLength`).
- Struktura: hlavní klíčové slovo + cena (pokud je) + lokalita + výzva k akci na platformě.
- **Cena v meta:** jen čisté číslo + `Kč` (např. `za 4 000 Kč`).  
  **Zákaz** ve meta: `cca`, `orientační`, `dohodou`, `odměna dohodou`. Typ ceny (dohodou) patří do těla inzerátu, ne do SERP snippetu.
- Příklad (~155 znaků): *Hledáte spolehlivou baterii na elektrokolo Samsung 48V 17Ah? Ve Slavkově u Brna za 4 000 Kč. Podívejte se na detaily inzerátu a kontaktujte prodejce.*
- Fallback bez AI: první odstavec popisu před `---`, oříznutý na 160 znaků (`listing-meta-description.ts`).
### 3.4 TEXT_INZERÁTU (`cleanedDescription`)

1. **Synonyma** — do prvních 1–2 vět 2–3 lidové/synonymní výrazy (bez hashtagů a stuffing).
2. **Variabilita** — nestřídat stejnou šablonu vět napříč inzeráty (pořadí info, aktiv/pasiv, typy úvodů).
3. **Lokální SEO** — u menší obce přirozeně propojit lokalitu se spádovým městem **bez závazku dopravy** (*Osobní předání ve Slavkově u Brna — obec je v dojezdové vzdálenosti od Brna.*). **Zákaz** slibovat dovoz/dopravu do města, pokud to inzerent výslovně nenapsal. Vyžaduje `locationText` ve vstupu AI.
4. **Kontext vyhledávání** — účel a související slova (pneu → auto, disky; router → Wi‑Fi, síť).
5. **Parametry** — technika na konci v odrážkách po `---` / `Parametry` (stávající struktura).
6. **CTA** — jen kanály platformy (*napište prodejci zprávu přes platformu*). **Nikdy** telefon/e-mail v CTA, pokud nejsou u inzerátu explicitně dostupné jako kontaktní pole.
7. **Cena v těle:** číslo z formuláře. U `fixed` → `Cena 4 000 Kč.` U `negotiable` → číslo + že je cena dohodou (např. `Cena 4 000 Kč, dohodou.`). Slovo „orientační“ je v těle volitelné; „cca“ do textu necpát.

### 3.5 ALT fotek

- **Hlavní fotka:** věcný `image_alt` (klíčové slovo + atribut + lokalita).
- **Ostatní fotky galerie / lightbox:** stejný produktový alt (příp. „— fotka N“ v lightboxu).
- **Avatar / dekorace v chrome:** `alt=""` (čtečky ignorují; SEO tool může hlásit „without alt“ — OK).
- Karty na HP: `alt=""` vedle viditelného title, nebo title.
### 3.6 Čistá cena (vrstvy)

| Vrstva | `fixed` | `negotiable` |
|--------|---------|--------------|
| DB / formulář | číslo + `fixed` | číslo + `negotiable` — bez „cca“ / „dohodou“ v amount |
| UI (karty) | `4 000 Kč` | `cca 4 000 Kč (dohodou)` — presentation layer |
| Meta description | `za 4 000 Kč` | stejně `za 4 000 Kč` (bez dohodou/cca) |
| Tělo inzerátu | `Cena 4 000 Kč.` | `Cena 4 000 Kč, dohodou.` |
| JSON-LD `Offer.price` | ano | **ne** (částka zůstane jen v textu / UI) |

---

## 4. Co AI nedělá (v1.0)

- Neskládá finální `<title>` (dělá kód).
- Nemění slug existujícího inzerátu.
- Nepřepisuje `location_text` na spádové město (lže by to v UI) — jen zmínka v popisu.
- Negeneruje telefon/e-mail do textu.

---

## 5. Operativa (mimo kód)

- Po změně textu/title: Google Search Console → URL → **Požádat o indexování**.
- Index se neaktualizuje okamžitě — synonyma v popisu bez recrawl neuvidíš ve výsledcích.

---

## 6. Implementační checklist (pro PR)

- [ ] Prompt (`build-prompt.ts` + Edge `_shared`) odpovídá této verzi bible
- [ ] `locationText` jde do user promptu
- [ ] JSON: `cleanedTitle`, `metaDescription`, `imageAlt`, `cleanedDescription`
- [ ] DB: `meta_description`, `image_alt`
- [ ] `generateMetadata` používá builder + uloženou meta description
- [ ] `buildOffer` neposílá price u negotiable
- [ ] Alt na detailu z `image_alt`
- [ ] Snapshot + CHANGELOG při změně verze bible
- [ ] `npm run sync:moderation` + deploy `moderate-listing` po změně promptu / bound tags

---

## 7. Příklady

**H1:** `Baterie Li-ion 48V 17Ah Samsung`  
**META_TITLE (kód):** `Baterie Li-ion 48V 17Ah Samsung – Slavkov u Brna | zaPikolou.cz` (při přetečení zkrátí H1)  
**Špatný H1:** `Baterie (akumulátor) Li-ion 48V 17Ah Samsung na elektrokolo` / `… - málo používaný`
