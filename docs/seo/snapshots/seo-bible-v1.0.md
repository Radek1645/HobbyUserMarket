# SEO Bible — inzeráty zaPikolou.cz

> **Verze:** 1.0  
> **Datum:** 2026-07-20  
> **Účel:** Jediný kanonický zdroj pravidel pro SEO inzerátů (AI hydratace, meta tagy, strukturovaná data, alt texty).  
> **Verzování:** viz [`README.md`](./README.md) · historie [`CHANGELOG.md`](./CHANGELOG.md) · snapshot [`snapshots/seo-bible-v1.0.md`](./snapshots/seo-bible-v1.0.md)  
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

1. Začíná **nejobecnějším** pojmenováním věci (Baterie, Zimní pneu, Kočárek…), pak značka/model a specifikace.
2. Cílová délka **max 60 znaků** (formulář může přijmout až 80 před AI — AI zkrátí).
3. **Zákaz vaty** na konci: `- málo používaný`, `super stav`, `cca 5,5 mm`, „jako nové“. Stav a opotřebení patří do popisu / Parametrů.
4. **Bez lokality** v H1 — lokalita jde do meta title a do textu.
5. Synonyma v H1: lidový + technický výraz, pokud se liší (např. `Baterie (akumulátor) Li-ion 48V… na elektrokolo`).

### 3.2 META_TITLE (kód)

Formát ideál: `{H1} – {Lokalita} | zaPikolou.cz`

Max **60 znaků**. Při přetečení zkracuj **v tomto pořadí**:

1. vynech `| zaPikolou.cz`,
2. vynech lokalitu (`– {Lokalita}`),
3. teprve pak zkrať H1 zprava (specifikace).

Obecný název věci a značka/model v H1 se záměrně neřežou jako první — proto AI musí držet H1 krátký a bez vaty.

Implementace: `src/lib/seo/build-listing-meta-title.ts`.

### 3.3 META_DESCRIPTION

- Délka **150–160 znaků**.
- Struktura: hlavní klíčové slovo + cena (pokud je) + lokalita + výzva k akci na platformě.
- Příklad: *Hledáte spolehlivou baterii na elektrokolo Samsung? Ve Slavkově u Brna za 4 000 Kč. Podívejte se na detaily a kontaktujte prodejce.*
- Fallback bez AI: první odstavec popisu před `---`, oříznutý na 160 znaků (`listing-meta-description.ts`).

### 3.4 TEXT_INZERÁTU (`cleanedDescription`)

1. **Synonyma** — do prvních 1–2 vět 2–3 lidové/synonymní výrazy (bez hashtagů a stuffing).
2. **Variabilita** — nestřídat stejnou šablonu vět napříč inzeráty (pořadí info, aktiv/pasiv, typy úvodů).
3. **Lokální SEO** — u menší obce přirozeně zmínit spádové město (*Osobní předání ve Slavkově, po dohodě možné dovézt do Brna.*). Vyžaduje `locationText` ve vstupu AI.
4. **Kontext vyhledávání** — účel a související slova (pneu → auto, disky; router → Wi‑Fi, síť).
5. **Parametry** — technika na konci v odrážkách po `---` / `Parametry` (stávající struktura).
6. **CTA** — jen kanály platformy (*napište prodejci zprávu přes platformu*). **Nikdy** telefon/e-mail v CTA, pokud nejsou u inzerátu explicitně dostupné jako kontaktní pole.
7. Cena: číslo z formuláře; u dohodou zmínit dohodu **v textu**, ne v číselném poli.

### 3.5 ALT hlavní fotky (`imageAlt`)

- Věcný popis: klíčové slovo + podstatný atribut + lokalita.
- Příklad: `Černá Li-ion baterie 48V Samsung na elektrokolo, Slavkov u Brna`.
- Max ~125 znaků. Karty na HP mohou mít `alt=""` (dekorativní vedle viditelného title).

### 3.6 Čistá cena

- V DB / formuláři: **čisté číslo** + `price_type` (`fixed` / `negotiable` / …). Žádné „cca“ / „dohodou“ v amount.
- UI smí zobrazit `cca … (dohodou)` — to je presentation layer.
- **JSON-LD `Offer.price`:** jen u pevné ceny (`fixed`) a `free_pickup` (0). U `negotiable` cenu do schématu **neposílat** (orientační částka zůstane v textu / UI).

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

**H1:** `Baterie (akumulátor) Li-ion 48V 17Ah Samsung na elektrokolo`  
**META_TITLE (kód):** `Baterie (akumulátor) Li-ion 48V 17Ah Samsung na elektrokolo – Slavkov u Brna` (brand truncate dle délky)  
**Špatný H1:** `Akumulátor Li-ion 48V, 17Ah Samsung - málo používaný`
