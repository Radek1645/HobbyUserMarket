# Category SEO — Vlna 1 (produktový řez + draft modelu)

> **Datum:** 2026-08-06  
> **Status:** CSEO1–CSEO3 odsouhlaseno; **CSEO4 kód hotový** — zbývá apply migrace `072` + deploy/cron  
> **Kanon pravidel:** [`CATEGORY_SEO.md`](./CATEGORY_SEO.md) v1.1

## CSEO1 — co jde do produkce

- **Jen 1A:** `/{slug}/` (celostátní). Žádná lokalitní matice v indexu ani v sitemapě.
- **`/{slug}/` = jen zboží** (unikátní goods subcategory slug z configu). Non-goods později s prefixem (`/udalosti/…`, případně `/sluzby/…` atd.).
- **Zlaté pravidlo:** `SEO_URL_SLUG === subcategory.slug` z [`categories.ts`](../../src/config/categories.ts) / [`categories-goods.ts`](../../src/config/categories-goods.ts). Žádná paralelní taxonomie.
- Taxonomie po § J / `070` už má potřebnou granularitu — **žádný remap** pro SEO.

### Priorita ručního copy (Vlna 1)

1. `kola-kolobezky`
2. `kocarky-sedacky-nabytek`
3. `osobni-auta`
4. `zimni-sport`
5. `detske-obleceni-obuv`
6. `nabytek-doplnky`
7. `mobily`
8. `zahrada-naradi`
9. `hracky-miminka` — seed `075` (2026-08-09)

### Audit slugů (2026-08-06)

**Kolize (Vlna 1 nepouští jako `/{slug}/`):**

| Slug | Typy |
|------|------|
| `ostatni` | auto, detsky, dum, elektro, moda, sport, hobby, ostatni, sluzby, udalost, nemovitost, prace |
| `pece-zahrada` | sluzby, prace |
| `sport` | udalost subcategory vs. goods `category_type` — **nezapínat** bare `/sport/` |

**Unikátní goods subcategory slugy** (kandidáti landingu, mimo prioritu 8 výše):  
`osobni-auta`, `motorky`, `dily-prislusenstvi`, `detske-obleceni-obuv`, `kocarky-sedacky-nabytek`, `hracky-miminka`, `nabytek-doplnky`, `zahrada-naradi`, `potraviny-domaci`, `mobily`, `pc`, `tv-foto-audio`, `spotrebice`, `damske-panske`, `boty-doplnky`, `kola-kolobezky`, `zimni-sport`, `knihy-hry-hudba`, `sberatelstvi-umeni`.

## CSEO2 — datový model (draft)

Taxonomie zůstává v TS. DB drží jen SEO stav a copy:

```text
category_seo_pages
  slug                    text PK  -- == goods subcategory slug
  kind                    text     -- 'subcategory' (type až po explicitním rozhodnutí)
  description             text
  meta_title              text
  meta_description        text
  index_status            text     -- 'index' | 'noindex'
  listing_count           int NOT NULL DEFAULT 0
  above_threshold_since   timestamptz null
  below_threshold_since   timestamptz null
  updated_at              timestamptz
```

- **`listing_count` povinný** — denní job vždy zapíše `COUNT` active posts pro slug (zdroj pravdy při běhu jobu = tabulka `posts`; sloupec = auditovatelný snapshot).
- Hystereze: viz CATEGORY_SEO.md §2 (3 dny nahoru / 14 dní dolů).
- Vlna 2: `category_seo_locality_pages` — **nevzniká teď**.

## CSEO3 — routing sketch

1. Segment v reserved setu (`inzerat`, `moje-inzeraty`, `mod`, `auth`, `login`, `faq`, `vop`, `uzivatel`, … + budoucí `udalosti`) → existující app route.
2. Jeden segment ∈ unikátní goods subcategory set → goods landing 1A; `generateMetadata` čte `index_status`.
3. Dva segmenty `/{lokalita}/{kategorie}/` — template smí existovat později, ale default **`noindex`** + mimo sitemap, dokud count ≥ **5** + hystereze.
4. Jinak 404.

Disambiguace: lokalita = uzavřený allowlist městských slugů; kategorie = goods config set; průnik reserved/config/lokality = chyba konfigurace při buildu, ne tipování za běhu.

## CSEO4 — stav implementace (2026-08-06)

| Část | Stav |
|------|------|
| Migrace `supabase/072_category_seo_pages.sql` | Kód hotový — **apply na Supabase** |
| Route `src/app/[slug]/page.tsx` | Goods-only unikátní slugy; 404 jinak / bez DB řádku |
| Config `src/config/category-seo.ts` | Práh 3, hystereze 3/14, Wave1 seed slugy |
| Cron `/api/cron/category-seo-index` + `vercel.json` 05:00 UTC | Sync count + index_status |
| Sitemap | Jen `index_status = index` |
| Lokalita / brand filtr | Ne |

**Smoke po apply `072` + deploy:**

1. Otevřít `/kola-kolobezky` — H1, 3 karty, breadcrumb.
2. View-source / DevTools: `robots` zatím `noindex` (dokud cron nepočká 3 dny nad prahem).
3. `curl -H "Authorization: Bearer $CRON_SECRET" https://zapikolou.cz/api/cron/category-seo-index` → `listing_count: 3` u `kola-kolobezky`, `above_threshold_since` nastaveno.
4. Pro rychlý test indexace (volitelně): SQL `UPDATE category_seo_pages SET above_threshold_since = now() - interval '3 days' WHERE slug = 'kola-kolobezky';` a znovu cron → `index_status = index` + objeví se v `/sitemap.xml`.
5. `/neexistujici-slug` a `/sport` (event) → 404.
