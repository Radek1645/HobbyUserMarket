# Category SEO Bible — kategorie a filtry zaPikolou.cz

> **Verze:** 1.0
> **Datum:** 2026-08-01
> **Účel:** Kanonický zdroj pravidel pro SEO **kategorií a filtrovaných výpisů** — landing page vrstva, ne detail inzerátu.
> **Vztah k [`SEO_BIBLE.md`](./SEO_BIBLE.md):** SEO_BIBLE.md řeší AI hydrataci jednoho inzerátu (H1, meta, alt). Tento dokument řeší vrstvu nad tím — hierarchické URL typu `/{lokalita}/{kategorie}/{filtr}/` (bez prefixu `/kategorie/`, viz §1), které jsou dlouhodobou hlavní pákou organické návštěvnosti. Při rozporu v tom, kam patří která odpovědnost, platí: **inzerát = SEO_BIBLE.md, výpis = tento dokument.**

---

## 0. Proč tenhle dokument existuje

Detail inzerátu z principu cílí na moc specifickou frázi (značka + model + lokalita), rychle expiruje (inzerát zmizí po prodeji) a nemá šanci porazit zavedené agregátory na obecné dotazy. Skutečnou konkurenci vůči Bazoši/Sbazaru vedou **kategorní/filtrové stránky**, které:

- jsou trvalé (nezanikají prodejem konkrétní věci),
- akumulují autoritu v čase (backlinky, interní prolinkování, historie),
- odpovídají na dotazy typu **Obecný** a **Kombinovaný** z pyramidy hledanosti (`dětské kolo 20`, `dětské kolo Author 20`), kde má detail inzerátu nulovou šanci.

Detail inzerátu (SEO_BIBLE.md) zůstává „vytěžovačem" dlouhého chvostu — funkční, ale doplňkový. Tento dokument definuje hlavní růstovou páku.

---

## 1. Struktura URL

**Rozhodnuto: hierarchická struktura.**

`/{lokalita}/{kategorie}/{filtr}/` — např. `/brno/detska-kola/author/`

Důvody:
1. **Entitní strom pro Google** — hierarchie URL čitelně mapuje ČR → Brno → Dětská kola → Author, na rozdíl od ploché struktury (`/detska-kola-author-20-brno/`), kterou bot musí dekódovat bez jistoty.
2. **Přelévání autority** — backlink na `/brno/detska-kola/author/` posiluje i nadřazené `/brno/detska-kola/` a `/detska-kola/`, takže investice do linkbuildingu jedné stránky se rozlévá dál po stromu.
3. **Čistota routování** — plochá struktura se u inzertního webu s desítkami kategorií a filtrů rychle stává nekontrolovatelnou.

Varianty URL:
- Kategorie: `/{kategorie}/`
- Kategorie + lokalita: `/{lokalita}/{kategorie}/`
- Kategorie + filtr: `/{kategorie}/{filtr}/`
- Lokalita + kategorie + filtr: `/{lokalita}/{kategorie}/{filtr}/`

**Prefix `/kategorie/...`, který se objevoval dřív v briefu, je zamítnut natrvalo.** Kategorie a lokalita jdou přímo z kořene (`/brno/detska-kola/...`), bez zastřešujícího segmentu — kratší URL, čistší hierarchie pro breadcrumb i pro přelévání autority.

*(TODO: promítnout do routingu — konkrétní Next.js struktura je implementační detail, ne SEO rozhodnutí)*

---

## 2. Co se indexuje, co ne

Kombinace filtrů rostou kombinatoricky — velká část z nich bude mít **nulový objem výpisu** (0 aktivních inzerátů) nebo nulovou hledanost. Indexovat všechno = thin/duplicitní content, který škodí zbytku webu.

### Pravidlo prahu

**Rozhodnuto: práh 3 aktivní inzeráty.**

| Počet aktivních inzerátů | Akce |
|---|---|
| `>= 3` | `index, follow`, vlastní `<title>`/meta |
| `1–2` | `noindex, follow` — crawler projde odkazované inzeráty, ale výpis samotný v indexu chudě nepůsobí |
| `0` | **`noindex, follow`** jako výchozí. `301` na rodičovskou kategorii se **nepoužívá** pro sezónní kategorie (pneu, kola, lyže…) — po sezóně se počet vrátí nad práh a redirect by se musel rušit, což vytváří redirect loop riziko a matoucí historii pro Google. `301` je vyhrazený jen pro kategorie, které zanikají natrvalo (přejmenování, sloučení). `410` jen pokud kategorie mizí natrvalo a nemá nástupce. **Nikdy ne trvalé `200 OK` s prázdným výpisem** — zbytečně pálí crawl budget |
| Extrémně úzká kombinace filtrů (3+ najednou, analogie „Brno Líšeň" z briefu) | `noindex, follow` bez ohledu na počet inzerátů — dostupné uživateli, mimo index |

### Hystereze index/noindex (ochrana proti flapování)

Počet inzerátů v kategorii kolísá týden od týdne (prodá se, přibude nový). Pokud by stránka mezi `index`/`noindex` skákala při každém přechodu přes práh, Google bot ztrácí ke stránce důvěru a přestává ji pravidelně crawlovat.

**Pravidlo:** asymetrický práh.
- Do indexu **pustit** při `>= 3` inzerátech okamžitě.
- Z indexu **stáhnout** až když počet zůstane pod prahem (nebo na `0`) **déle než 14 dní** — ne při první výkyvu.

**Implementace: sloupec v DB, ne přepočet za běhu.** `generateMetadata` čte hotový `index_status` sloupec u kategorie — nepočítá hysterezi znovu při každém requestu. Sloupec se aktualizuje buď (a) při každé změně počtu inzerátů v kategorii (trigger/hook, který zapíše `below_threshold_since` timestamp a přepne `index_status` až po 14 dnech), nebo (b) jednou denně dávkovým jobem, který projede kategorie a status přepočítá. Varianta (a) je přesnější, (b) jednodušší na údržbu — volba je implementační detail, princip „nepočítat v `generateMetadata`" je závazný.

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

## 7. Implementační checklist (pro PR)

- [ ] Hierarchická URL struktura (§1) promítnuta do routingu
- [ ] Práh 3 inzerátů pro index/noindex implementován (§2)
- [ ] Hystereze 14 dní před přepnutím na `noindex` implementována (§2)
- [ ] Self-referencing canonical na stránkovaných výpisech (`?page=N`), ne zpět na `page=1`
- [ ] META_TITLE pro strany 2+ obsahuje „(strana N)"
- [ ] Úvodní text kategorie skryt na stránkách 2+
- [ ] Šablona/AI-generovaný text kategorie schválen, žádná duplicita mezi příbuznými kategoriemi
- [ ] `BreadcrumbList` JSON-LD na kategorii i detailu
- [ ] Interní prolinkování: homepage → kategorie → related kategorie → inzerát a zpět
- [ ] GSC sledování nastaveno per kategorie (ne jen agregátně)

---

## 8. Zbývající otevřené otázky

1. Priorita — které kategorie/lokality dostanou ruční copy a linkbuilding jako první? (viz §5 — návrh je „kombinovaný"/„lokalizovaný" tier, ne nejobecnější kategorie)
2. Přesný routing v Next.js pro tříúrovňovou hierarchii lokalita/kategorie/filtr — implementační detail mimo scope tohoto dokumentu.
3. Varianta (a) vs. (b) pro update `index_status` sloupce (§2) — trigger na změnu vs. denní job.
