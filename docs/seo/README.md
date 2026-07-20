# SEO dokumentace — zaPikolou.cz

> **Kanon:** [`SEO_BIBLE.md`](./SEO_BIBLE.md) (aktuální verze)  
> **Snapshoty:** [`snapshots/`](./snapshots/) — neměnné kopie při vydání verze  
> **Historie:** [`CHANGELOG.md`](./CHANGELOG.md)

## Verzování

Stejný princip jako u právních snapshotů (`docs/pravni/snapshots/`):

1. **Aktuální pravidla** žijí v `SEO_BIBLE.md` (hlavička obsahuje `Verze: x.y`).
2. Při **breaking** nebo produktově závazné změně pravidel:
   - zvedni verzi v `SEO_BIBLE.md`,
   - zapiš záznam do `CHANGELOG.md`,
   - zkopíruj celý soubor do `snapshots/seo-bible-vX.Y.md`,
   - staré snapshoty **neupravuj**.
3. Konstanta `LISTING_SEO_BIBLE_VERSION` v `src/config/listing-seo.ts` musí odpovídat hlavičce bible.
4. Oprava překlepu bez změny významu = patch v aktuálním souboru **bez** nové snapshot verze (zmínka v CHANGELOG volitelně).

## Související kód

| Oblast | Cesta |
|--------|--------|
| Limity a verze | `src/config/listing-seo.ts` |
| Meta title builder | `src/lib/seo/build-listing-meta-title.ts` |
| Meta description fallback | `src/lib/seo/listing-meta-description.ts` |
| JSON-LD / Offer.price | `src/lib/seo/listing-json-ld.ts` |
| AI hydratace (prompt) | `src/config/moderation/build-prompt.ts` (+ Edge `_shared`) |
| Detail metadata | `src/app/inzerat/[slug]/page.tsx` → `generateMetadata` |

Metodika (procesy): [`../Metodika.md`](../Metodika.md) §8.5.  
Hydratace: [`../hydratace-inzeratu.md`](../hydratace-inzeratu.md).
