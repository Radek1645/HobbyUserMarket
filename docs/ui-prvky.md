# UI prvky — HUM

Single source of truth pro vizuální primitivy na webu. **Kód:** [`src/config/ui-primitives.ts`](../src/config/ui-primitives.ts).

Doménově specifické věci zůstávají odděleně:
- kategorie a ikony → [`categories-docs.md`](./categories-docs.md)
- barvy kategorií na HP → [`src/config/home-themes.ts`](../src/config/home-themes.ts)
- formulář inzerátu (inputy, karty) → [`src/config/listing-form-ui.ts`](../src/config/listing-form-ui.ts)

---

## 1. Zelené primární CTA

Hlavní akce (vytvořit inzerát, potvrdit formulář, modál).

| Konstanta | Použití |
|-----------|---------|
| `emeraldSurfaceClass` | Pouze povrch (barva + stín + hover) — skládá se do variant |
| `emeraldPrimaryButtonClass` | Obecné zelené CTA, `rounded-xl` |
| `emeraldPrimaryButtonCompactClass` | Modály, kompaktní akční řádek |
| `headerCreateListingSurfaceClass` | Flat zelený povrch header CTA (`bg-emerald-600`, hover `bg-emerald-700`) — shodně s logem HUM |
| `headerCreateListingButtonClass` | Header „Vytvořit inzerát přes AI“ — pill (`rounded-full`), `font-semibold`, ikona Sparkles |
| `emeraldLogoMarkClass` | Zelený čtverec s domečkem v logu |

### Header CTA (hlavní akce)

Hlavní tlačítko v navbaru je **flat** — kontrast jen barvou, ne stínem ani tloušťkou písma:

- Povrch: `headerCreateListingSurfaceClass` — `bg-emerald-600`, hover `bg-emerald-700` (stejně jako logo)
- Přechod: `transition-colors duration-200`
- Typografie: `font-semibold`, bílý text
- Ikona: `Sparkles` (`iconSmClass`), `min-[480px]:mr-2` od textu
- Tvar: `rounded-full`, padding beze změny (`sm:px-4`, `md:px-6`)
- **Bez stínu** — žádný `shadow-*` na tomto tlačítku

Ostatní zelená CTA (`emeraldSurfaceClass`) používají `bg-emerald-600` / hover `bg-emerald-700` a jemný stín.

### Stín a kontrast

- Povolený stín: `shadow-md shadow-emerald-900/10` nebo `shadow-sm` (kromě header CTA — flat)
- Focus (klávesnice): `focus-visible:ring-2 focus-visible:ring-emerald-500`
- **Zakázáno:** barevný glow (`shadow-emerald-600/25`, `shadow-emerald-600/30`), `ring-emerald-*` kolem tlačítka, `hover:shadow-lg` s barevným tintem

### Formulář inzerátu

`listingFormPrimaryButtonClass` v `listing-form-ui.ts` skládá `emeraldPrimaryButtonClass` + layout (`flex`, padding) + disabled stavy.

---

## 2. Modály

| Konstanta | Použití |
|-----------|---------|
| `modalOverlayClass` | Tmavý overlay přes celou stránku |
| `modalPanelClass` | Bílá karta dialogu |
| `modalCancelGhostButtonClass` | „Zrušit“ bez rámečku |
| `modalCancelOutlineButtonClass` | „Zrušit“ s rámečkem |
| `modalDangerButtonClass` | Destruktivní potvrzení (červené) |
| `emeraldPrimaryButtonCompactClass` | Primární potvrzení (zelené) |

Panel používá neutrální stín `shadow-xl shadow-gray-900/10` — ne barevný.

---

## 3. Pilulky kategorií (homepage)

| Konstanta | Použití |
|-----------|---------|
| `homeCategoryTabActiveClass` | Aktivní kategorie v hero |
| `homeCategoryTabInactiveClass` | Neaktivní kategorie |
| `iconSmClass` | Ikona před textem (`h-4 w-4`, barva z rodiče) |

Konfigurace kategorií a ikon: [`categories-docs.md`](./categories-docs.md), `CATEGORIES_CONFIG` v `home-themes.ts`.

Hero gradient zůstává fixní (`from-orange-200 via-amber-50 to-emerald-200`) — nemění se podle aktivní kategorie.

---

## 4. Postup při novém prvku

1. Zkontroluj, zda už existuje konstanta v `ui-primitives.ts`.
2. Pokud ne, přidej ji tam (ne inline do komponenty).
3. Aktualizuj tento dokument — tabulka + krátký popis kdy použít.
4. Nikdy nekopíruj `bg-emerald-600 shadow-…` jako one-off string.

---

## 5. Související

| Dokument / soubor | Obsah |
|-------------------|-------|
| [`categories-docs.md`](./categories-docs.md) | Ikony a ID kategorií |
| [`listing-form-ui.ts`](../src/config/listing-form-ui.ts) | Formulář inzerátu |
| [`home-themes.ts`](../src/config/home-themes.ts) | Témata HP podle kategorie |
