# Category SEO Bible — kategorie a filtry zaPikolou.cz

> **Verze:** 1.1  
> **Datum:** 2026-08-06  
> **Účel:** Kanonický zdroj pravidel pro SEO **kategorií a filtrovaných výpisů** — landing page vrstva, ne detail inzerátu.  
> **Vztah k [`SEO_BIBLE.md`](./SEO_BIBLE.md):** SEO_BIBLE.md řeší AI hydrataci jednoho inzerátu (H1, meta, alt). Tento dokument řeší vrstvu nad tím — hierarchické URL (bez prefixu `/kategorie/`, viz §1), které jsou dlouhodobou hlavní pákou organické návštěvnosti. Při rozporu: **inzerát = SEO_BIBLE.md, výpis = tento dokument.**  
> **Vlna 1 (produkt):** [`CATEGORY_SEO_WAVE1.md`](./CATEGORY_SEO_WAVE1.md) — jen celostátní `/{slug}/` (zboží); lokalita až po objemu.

### Changelog v1.1 (2026-08-06)

- **Vlna 1 = 1A** — produkčně jen `/{kategorie}/`; lokalitní matice neindexovat / nelinkovat ze sitemapy, dokud `(kategorie, lokalita)` ≥ 5 + hystereze.
- **`/{slug}/` = jen zboží**; Události později `/udalosti/{slug}/` (stejně prefixy pro ostatní non-goods).
- **Slug 1:1 s `categories.ts`** — žádná paralelní SEO taxonomie.
- **Hystereze obousměrná** — do indexu až po 3 dnech nad prahem; z indexu po 14 dnech pod prahem (`above_threshold_since` / `below_threshold_since`).
- **`listing_count` povinný** ve SEO tabulce (denní job).

---

## 0. Proč tenhle dokument existuje

Detail inzerátu z principu cílí na moc specifickou frázi (značka + model + lokalita), rychle expiruje (inzerát zmizí po prodeji) a nemá šanci porazit zavedené agregátory na obecné dotazy. Skutečnou konkurenci vůči Bazoši/Sbazaru vedou **kategorní/filtrové stránky**, které:

- jsou trvalé (nezanikají prodejem konkrétní věci),
- akumulují autoritu v čase (backlinky, interní prolinkování, historie),
- odpovídají na dotazy typu **Obecný** a **Kombinovaný** z pyramidy hledanosti (`dětské kolo 20`, `dětské kolo Author 20`), kde má detail inzerátu nulovou šanci.

Detail inzerátu (SEO_BIBLE.md) zůstává „vytěžovačem" dlouhého chvostu — funkční, ale doplňkový. Tento dokument definuje hlavní růstovou páku.

---

## 1. Struktura URL

**Rozhodnuto: hierarchická struktura** (cílový strom). Cílové varianty:

- Kategorie: `/{kategorie}/`
- Kategorie + lokalita: `/{lokalita}/{kategorie}/`
- Kategorie + filtr: `/{kategorie}/{filtr}/`
- Lokalita + kategorie + filtr: `/{lokalita}/{kategorie}/{filtr}/`

Příklad cílového stromu: `/brno/kola-kolobezky/author/` — backlink posiluje i `/brno/kola-kolobezky/` a `/kola-kolobezky/`.

**Prefix `/kategorie/...` je zamítnut natrvalo.** Kategorie a lokalita jdou z kořene, bez zastřešujícího segmentu.

### Vlna 1 vs. cílový strom

| Fáze | Co je v produkci (index + sitemap + interní SEO linky) |
|------|--------------------------------------------------------|
| **Vlna 1** | Jen `/{slug}/` u **unikátních goods subcategory** slugů z configu. Práh ≥ 3 + hystereze §2. |
| **Vlna 2** | `/{lokalita}/{kategorie}/` až když buňka má ≥ **5** aktivních + hystereze. Do té doby template smí existovat, ale `noindex` a mimo sitemap. |
| Později | Brand/filtr segment; non-goods s vlastním prefixem. |

### Namespace podle typu inzerátu

- **`/{slug}/` je vyhrazené pro zboží** (goods subcategory). Nikdy neznamená „cokoliv se stejným slugem“.
- **Události** (až na řadě): `/udalosti/{slug}/` — např. `/udalosti/sport/`. Tím se vyhne kolizi goods `category_type` / event subcategory `sport`.
- Stejný princip později pro služby / práci / nemovitosti (`/sluzby/…` atd.), ne bare single-segment.

### Slug = config

`SEO_URL_SLUG === subcategory.slug` (nebo později explicitně goods `category_type`). Žádná jemnější SEO taxonomie mimo [`src/config/categories.ts`](../../src/config/categories.ts). Kolizní slugy (`ostatni`, `pece-zahrada`, ambiguous `sport`) **nedostanou** bare `/{slug}/` — viz [`CATEGORY_SEO_WAVE1.md`](./CATEGORY_SEO_WAVE1.md).

Routing sketch: WAVE1 § CSEO3. Implementace = checklist §7 / CSEO4.

---

## 2. Co se indexuje, co ne

Kombinace filtrů rostou kombinatoricky — velká část z nich bude mít **nulový objem výpisu** (0 aktivních inzerátů) nebo nulovou hledanost. Indexovat všechno = thin/duplicitní content, který škodí zbytku webu.

### Pravidlo prahu

| Kontext | Práh aktivních inzerátů |
|---------|-------------------------|
| Celostátní `/{kategorie}/` | **≥ 3** |
| Lokalita `/{lokalita}/{kategorie}/` (Vlna 2) | **≥ 5** (vyšší laťka — nižší objem per buňku) |

| Počet vs. práh (po hysterezi níže) | Akce |
|---|---|
| Stabilně nad prahem | `index, follow`, vlastní `<title>`/meta |
| Pod prahem, ale &gt; 0 | `noindex, follow` — crawler projde inzeráty, výpis mimo index |
| `0` | **`noindex, follow`**. U sezónních kategorií **ne `301`** na rodiče — po sezóně se počet vrátí; redirect by zabil URL. `301` jen při trvalém zániku/sloučení; `410` jen bez nástupce. **Nikdy ne trvalé `200 OK` s prázdným výpisem** |
| Extrémně úzká kombinace filtrů (3+ najednou) | `noindex, follow` bez ohledu na počet |

### Hystereze index/noindex (ochrana proti flapování)

Počet inzerátů kolísá. Okamžité cukání `index`/`noindex` kazí důvěru Google bota **a** při nízkém objemu by jednodenní spike nad práh zaindexoval thin page.

**Pravidlo: obousměrná hystereze (různá okna).**

| Směr | Podmínka count | Stabilita |
|------|----------------|-----------|
| `noindex` → `index` | ≥ práh | kontinuálně **≥ 3 dny** (`above_threshold_since`) |
| `index` → `noindex` | &lt; práh (vč. 0) | kontinuálně **≥ 14 dní** (`below_threshold_since`) |

**Implementace: DB sloupce, ne přepočet v `generateMetadata`.** Denní job (preferovaná varianta b):

1. Spočítá aktivní posty per slug → zapíše povinný **`listing_count`**.
2. Aktualizuje `above_threshold_since` / `below_threshold_since` (null na opačné straně prahu).
3. Teprve po uplynutí okna přepne `index_status`.

Trigger při změně countu (varianta a) je přípustný, pokud dodrží stejná okna. Princip „nepočítat hysterezi za request“ je závazný.

### Canonical

- Filtrované URL s malou hodnotou pro vyhledávač (např. řazení `?sort=price_asc`) → `canonical` na čistou kategorii bez parametru.
- Stránkování (`?page=2` a dál) → **vlastní** `canonical` na sebe sama (`.../detska-kola/?page=2`), **nikdy** canonical zpět na `page=1`. Google jinak druhou a další stranu ignoruje a neindexuje inzeráty, které jsou na ní zapadlé. (Google od zrušení `rel=prev/next` doporučuje právě self-referencing canonical na paginovaných stránkách.)
- META_TITLE od strany 2 výš: `{Kategorie} (strana N) | zaPikolou.cz`.
- Úvodní text kategorie (§3) se zobrazuje **jen na 1. straně** — na dalších stranách se skrývá, aby nevznikala duplicita napříč stránkováním.

---

## 3. Obsah kategorie stránky

Na rozdíl od inzerátu (§3.4 SEO_BIBLE.md), kategorie potřebuje **statický text**, ne AI hydrataci per-request — jinak hrozí, že se obsah mění s každým novým inzerátem a znejišťuje index.

1. **H1** — čistý název kategorie (+lokalita, pokud je lokalizovaná verze). Žádná vata.
2. **Úvodní odstavec (~80–150 slov)** — jednou napsaný text nad výpisem: co kategorie obsahuje, synonyma, souvislé pojmy (stejná logika jako §3.4 bod 1 a 4 v SEO_BIBLE.md, ale psáno pro kategorii jako celek, ne pro konkrétní kus zboží).
3. **META_TITLE / META_DESCRIPTION** — vlastní šablona per kategorie (ne generovaná AI za běhu), s místem pro počet aktivních inzerátů, pokud to zvyšuje CTR (`Dětská kola 20" — 34 inzerátů | zaPikolou.cz`).
4. **Zákaz** kopírovat text mezi příbuznými kategoriemi (kolo 16" / 20" / 24" nesmí mít odstavec lišící se jen číslem — riziko duplicity).

### Kdo text generuje

**Rozhodnuto: hybridní přístup — jednorázová AI generace + ruční zamčení top kategorií.**

- Při vzniku nové kategorie/landing page se jednorázově (skript nebo admin akce) zavolá LLM, vygeneruje se unikátní popis (~100 slov), **uloží se do DB** k dané kategorii a dál se **nemění** automaticky.
- Top ~20 nejdůležitějších kategorií (kola, auta, pneu, kočárky) se text ručně zreviduje/upraví — tam se vyplatí lidský dohled, zbytek dlouhého chvostu kategorií jede na AI výstup.
- Text se negeneruje per-request (na rozdíl od inzerátu) — jednou zamčeno, dokud ho někdo vědomě nezmění (analogie k tomu, jak SEO_BIBLE.md §3.7 zamyká slug existujícího inzerátu).

---

## 4. Interní prolinkování

- Kategorie ↔ příbuzné kategorie (např. dětská kola 16"/20"/24" navzájem).
- Kategorie ↔ detail inzerátu (breadcrumb + odkaz zpět z inzerátu do kategorie — `BreadcrumbList` JSON-LD, viz §7 Backlog v SEO_BIBLE.md).
- Homepage → hlavní kategorie (ne jen přes vyhledávací filtr v UI, ale crawlovatelný `<a href>`).
- Lokalizované kategorie ↔ obecné kategorie (`/brno/detska-kola/` ↔ `/detska-kola/`).

Cíl: žádná indexovaná kategorie není „orphan" stránka bez interního odkazu.

---

## 5. Budování autority (dlouhodobé, mimo AI/kód)

Sledovat odděleně od implementačního checklistu — toto je marketing/BD práce, ne kód:

- Zpětné odkazy na kategorní stránky (ne jen na homepage) — např. z lokálních komunit, blogů o daném hobby segmentu.
- Google Search Console: sledovat impressions/CTR per kategorie, ne per inzerát — inzeráty mají krátký životní cyklus a zkreslují trend.
- Priorita budování autority: začít u kategorií s nejvyšší hledaností a nejnižší konkurencí (viz brief — „kombinovaný" a „lokalizovaný" tier), ne u nejobecnějších (tam je boj s Bazošem beznadějný v prvním roce).

---

## 6. Vztah k SEO_BIBLE.md — dělba práce

| | Detail inzerátu (SEO_BIBLE.md) | Kategorie (tento dokument) |
|---|---|---|
| Cíl dotazu | Long-tail, hyper-specifický | Short-tail / kombinovaný |
| Životnost obsahu | Krátká (do prodeje) | Trvalá |
| Zdroj textu | AI hydratace per inzerát | Jednorázová AI generace + ruční zamčení top kategorií |
| Hlavní páka růstu | Doplňková | **Primární** |
| Riziko | Nulová hledanost při přehnané specifičnosti | Thin/duplicitní content při nekontrolované kombinatorice filtrů; flapování index/noindex |

---

## 7. Implementační checklist (pro PR) — CSEO4

- [ ] Vlna 1 routing: goods-only `/{slug}/` + reserved paths + unikátní slug set (§1, WAVE1)
- [ ] Tabulka `category_seo_pages` + povinný `listing_count` + `above`/`below_threshold_since`
- [ ] Denní job: count → hystereze → `index_status` (celostátní práh 3; 3/14 dní)
- [ ] Self-referencing canonical na stránkovaných výpisech (`?page=N`), ne zpět na `page=1`
- [ ] META_TITLE pro strany 2+ obsahuje „(strana N)"
- [ ] Úvodní text kategorie skryt na stránkách 2+
- [ ] Šablona/AI-generovaný text kategorie schválen, žádná duplicita mezi příbuznými kategoriemi
- [ ] `BreadcrumbList` JSON-LD na kategorii i detailu
- [ ] Interní prolinkování: homepage → kategorie → related kategorie → inzerát a zpět
- [ ] GSC sledování nastaveno per kategorie (ne jen agregátně)
- [ ] (Vlna 2) lokalitní URL: práh ≥ 5, mimo sitemap dokud nesplní

---

## 8. Rozhodnuté / odložené

| # | Téma | Stav |
|---|------|------|
| 1 | Priorita Vlny 1 (8 slugů, bez lokality) | **Hotovo** — [`CATEGORY_SEO_WAVE1.md`](./CATEGORY_SEO_WAVE1.md) |
| 2 | Datový model + routing sketch | **Draft odsouhlasen** — WAVE1 CSEO2–3 |
| 3 | Update `index_status` | **Denní job (b)** preferován |
| 4 | Lokalitní matice v indexu | **Odloženo** na objem (práh ≥ 5) |
| 5 | Prefix `/udalosti/` a další non-goods | **Zamčeno jako pravidlo**; implementace až když přijdou na řadu |
| 6 | Brand filtr ve URL | Mimo Vlnu 1 |
