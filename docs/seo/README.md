# SEO dokumentace — zaPikolou.cz

Dva kanonické dokumenty — **různé vrstvy**, ne náhrada jednoho druhým:

| Dokument | Vrstva | Co řeší |
|----------|--------|---------|
| [`SEO_BIBLE.md`](./SEO_BIBLE.md) | Detail inzerátu | AI hydratace, H1, meta, alt, JSON-LD, slug |
| [`CATEGORY_SEO.md`](./CATEGORY_SEO.md) | Kategorie / filtry | Hierarchické URL, index/noindex práh, copy výpisů, prolinkování |

Při rozporu v tom, kam patří která odpovědnost: **inzerát = SEO_BIBLE.md, výpis = CATEGORY_SEO.md**.

> **Snapshoty inzerátů:** [`snapshots/`](./snapshots/) — neměnné kopie při vydání verze `SEO_BIBLE.md`  
> **Historie inzerátů:** [`CHANGELOG.md`](./CHANGELOG.md)

## Jak s tím pracovat

- **Měníš text/meta/alt jednoho inzerátu nebo prompt hydratace** → `SEO_BIBLE.md` (+ kód v tabulce níže).
- **Měníš URL kategorií, indexovatelnost výpisů, úvodní texty kategorií, breadcrumbs mezi kategorií a detailem** → `CATEGORY_SEO.md`.
- Detail inzerátu je long-tail / krátká životnost; kategorie jsou trvalá hlavní páka organiky — viz §0 a §6 v `CATEGORY_SEO.md`.
- `BreadcrumbList` a interní prolinkování kategorie ↔ inzerát patří do **obou** checklistů (společný technický SEO bod).

## Verzování — SEO_BIBLE (inzeráty)

Stejný princip jako u právních snapshotů (`docs/pravni/snapshots/`):

1. **Aktuální pravidla** žijí v `SEO_BIBLE.md` (hlavička obsahuje `Verze: x.y`).
2. Při **breaking** nebo produktově závazné změně pravidel:
   - zvedni verzi v `SEO_BIBLE.md`,
   - zapiš záznam do `CHANGELOG.md`,
   - zkopíruj celý soubor do `snapshots/seo-bible-vX.Y.md`,
   - staré snapshoty **neupravuj**.
3. Konstanta `LISTING_SEO_BIBLE_VERSION` v `src/config/listing-seo.ts` musí odpovídat hlavičce bible.
4. Oprava překlepu bez změny významu = patch v aktuálním souboru **bez** nové snapshot verze (zmínka v CHANGELOG volitelně).

## Verzování — CATEGORY_SEO (výpisy)

1. Aktuální pravidla žijí v `CATEGORY_SEO.md` (hlavička `Verze: x.y`).
2. Závazná změna pravidel → zvedni verzi + krátký záznam do hlavičky/data (zatím **bez** oddělených snapshotů a bez kódové konstanty — přidat, až půjde checklist §7 do produkce).
3. Oprava překlepu = patch bez bump verze.

## Související kód (inzeráty)

| Oblast | Cesta |
|--------|--------|
| Limity a verze | `src/config/listing-seo.ts` |
| Meta title builder | `src/lib/seo/build-listing-meta-title.ts` |
| Meta description fallback | `src/lib/seo/listing-meta-description.ts` |
| JSON-LD / Offer.price | `src/lib/seo/listing-json-ld.ts` |
| AI hydratace (prompt) | `src/config/moderation/build-prompt.ts` (+ Edge `_shared`) |
| Detail metadata | `src/app/inzerat/[slug]/page.tsx` → `generateMetadata` |

Kategoriální routing / `index_status` / copy kategorií — zatím **není v kódu**; checklist v `CATEGORY_SEO.md` §7.

Metodika (procesy): [`../Metodika.md`](../Metodika.md) §8.5.  
Hydratace: [`../hydratace-inzeratu.md`](../hydratace-inzeratu.md).
