# UI prvky — zaPikolou

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
| `headerCreateListingSurfaceClass` | Flat zelený povrch header CTA (`bg-emerald-600`, hover `bg-emerald-700`) — shodně s logem zaPikolou |
| `createListingCtaLabel` | Text hlavního CTA — „Vytvořit inzerát s AI“ (header + FAB) |
| `headerCreateListingButtonClass` | Header CTA — jen desktop (`md+`), pill, ikona Sparkles |
| `createListingFabClass` | Mobilní FAB pro tvorbu inzerátu (`md:hidden`), extended → ikona při scrollu |
| `headerInputHeightClass` | Sdílená výška vyhledávače a loga (`h-10`) |
| `headerBrandControlHeightClass` | Výška header CTA (`h-11`) |
| `headerBrandControlPaddingXClass` | Horizontální padding header CTA (`px-6`) |
| `emeraldBrandAccentClass` | Brand zelená pro logo wordmark — `text-emerald-600`, shodná s header CTA |
| `appLogoFrameClass` | Wordmark loga — `text-lg`, `h-10`, bez rámečku, viz `AppLogo` |

### Header CTA (hlavní akce)

Hlavní tlačítko v navbaru je **flat** — kontrast jen barvou, ne stínem ani tloušťkou písma. Na mobilu je nahrazeno FAB (`CreateListingFab`).

- Povrch: `headerCreateListingSurfaceClass` — `bg-emerald-600`, hover `bg-emerald-700` (stejná zelená jako wordmark loga)
- Viditelnost: `hidden md:flex` — pouze desktop
- Přechod: `transition-colors duration-200`
- Typografie: `font-semibold`, bílý text
- Ikona: `Sparkles` (`iconSmClass`), `mr-2` od textu
- Tvar: `rounded-full`, padding `px-6` (24px), `whitespace-nowrap`
- **Bez stínu** — žádný `shadow-*` na tomto tlačítku

### Mobilní FAB

| Konstanta | Použití |
|-----------|---------|
| `createListingFabClass` | Plovoucí CTA vpravo dole, jen `< md` |

- Extended při načtení (plný text `createListingCtaLabel`), po scrollu > 80 px jen ikona
- `whitespace-nowrap`, horizontální padding `px-6` (24px)
- Skrytý na `/inzerat/novy` a stránkách úpravy inzerátu
- Safe area: `bottom-[max(1rem,env(safe-area-inset-bottom))]`
- GTM: `GTM_CTA.FAB_CREATE_LISTING`

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

## 3b. Štítky směru na kartě inzerátu

Na image-first kartě (homepage) oddělují **Služby** (nabízím) od **Práce** (hledám člověka) — stejná podkategorie by jinak vypadala stejně.

| Konstanta | Použití |
|-----------|---------|
| `listingIntentOfferBadgeClass` | „Nabízím službu“ — emerald |
| `listingIntentDemandBadgeClass` | „Hledám člověka“ — slate |
| `listingCardSubcategoryBadgeClass` | Podkategorie vedle štítku směru |

Labely: `getListingIntentLabel` v `src/config/listing-intent.ts`. Cena u práce na kartě: prefix „odměna“ přes `formatListingPrice(..., { jobRewardPrefix: true })`.

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
