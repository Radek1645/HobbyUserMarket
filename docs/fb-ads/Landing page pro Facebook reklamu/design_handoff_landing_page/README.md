# Handoff: Landing page pro Facebook reklamu (zaPikolou.cz)

## Overview

Vstupní (landing) stránka, na kterou míří placená Facebook reklama cílená na Brno a okolí.
Cíl stránky: přivést člověka k vložení prvního inzerátu na zapikolou.cz.

Cílové skupiny: lidé, kteří prodávají doma nepotřebné věci, a rodiče (dětský bazar).
Hlavní sdělení: vyfotíte a AI dopíše zbytek inzerátu.

**Doporučené nasazení: jako nová routa ve stávajícím Next.js webu** (např. `/prodejte-snadno`),
ne jako samostatný HTML soubor. Důvody: sdílený GTM/měření (bez něj nelze vyhodnotit A/B testy),
CTA míří na reálné `/inzerat/novy` a přihlášení přes Google, žádná SEO duplicita, jedno místo údržby.

## About the Design Files

Soubory v tomto balíčku jsou **designové referenece vytvořené v HTML** — prototypy, které ukazují
zamýšlený vzhled a chování. **Nejsou to produkční komponenty ke zkopírování.**

Úkolem je **postavit tento design znovu v prostředí cílového kódu** (Next.js + React, s existujícími
komponentami, utilitami a konvencemi projektu zapikolou.cz), nikoli vložit HTML do stránky.
Kde už v projektu existuje ekvivalent (Button, Container, Section, Badge), použijte ho a přizpůsobte
mu vizuál — hodnoty níže berte jako cíl, ne jako příkaz obejít design systém.

## Fidelity

**High-fidelity (hifi).** Barvy, typografie, rozestupy a obsah jsou finální.
Rekreujte UI vizuálně přesně; responzivní chování je popsáno níže.

---

## PRAVIDLA OBSAHU — nutno dodržet

Tato pravidla jsou závazná pro veškerý text na stránce (i pro budoucí úpravy):

1. **Vždy vykání.** Nikdy tykání. ("Vyfoťte", "napíšete", "určujete vy")
2. **Žádné časové claimy.** Nikdy "inzerát za 2 minuty" ani podobné. Používejte
   "pár kliknutí" / "párkrát kliknout". Čas je právně i reputačně ošemetný.
3. **AI nedoplňuje cenu.** Cenu zadává uživatel. AI pouze upozorní, že cena je nezvykle
   vysoká nebo nízká. Nikde netvrdit, že AI cenu určí nebo doporučí.
4. **Publikace vyžaduje registraci.** Nezamlčovat. Formulace: inzerát lze začít připravovat
   hned, před publikací se uživatel přihlásí — jedním klikem přes Google nebo e-mailem.
5. **20 inzerátů zdarma, bez provizí z prodeje.** (Odpovídá /balicky-inzerce.)

---

## Screen: Landing page (jediná stránka, vertikální scroll)

Kontejner: `max-width: 1160px`, `margin: 0 auto`, `padding: 0 28px`, `box-sizing: border-box`.
Barva textu: `#0C2A1B`. Pozadí stránky: `#fff`.

### 1. Header

- Layout: `display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 0`
- Vlevo logo jako text: "za" (#0C2A1B) + "Pikolou" (#0FA45E) + ".cz" (15px, #6B7F73).
  Celé 23px / 700 / letter-spacing -0.02em. → V produkci nahradit reálným logem.
- Vpravo: odkaz "Jak to funguje" (15px/500, #46584D) + tlačítko "Vložit inzerát"
  (bg #0FA45E, #fff, 15px/700, padding 12px 22px, radius 100px)

### 2. Hero

- Sekce: `display: flex; flex-wrap: wrap; gap: 44px 54px; align-items: center; padding: 48px 0 76px`
- **Levý sloupec**: `flex: 1 1 430px; min-width: 290px; box-sizing: border-box`, flex column, gap 26px
  - Badge: "Lokální bazar · Brno a okolí" — bg #EAF7F0, text #0B6B3E, 14px/600, padding 9px 16px, radius 100px
  - H1: "Vyfoťte to.\nZbytek dopíše AI." (zlom `<br>` po první větě)
    `font-size: clamp(38px, 6.2vw, 62px); line-height: 1.02; font-weight: 800; letter-spacing: -0.04em; text-wrap: balance`
  - Podtitulek (21px / line-height 1.55 / #46584D / max-width 490px / text-wrap pretty):
    "Nahrajete fotku, napíšete pár slov a AI z toho sestaví hotový inzerát — název, popis,
    parametry i kategorii. Párkrát kliknout a je to venku, rovnou pro lidi z vašeho okolí."
  - CTA řádek (flex, wrap, gap 16px):
    - Primární tlačítko: "Vložit inzerát zdarma" — bg #0FA45E, #fff, 18px/700, padding 18px 34px, radius 100px
    - Vedle malý text (15px, #6B7F73, max-width 210px):
      "Přihlášení jedním klikem přes Google, pak už jen publikujete"
  - Tři odrážky (flex wrap, gap 22px; každá = 7px zelená tečka #0FA45E + text 15px/600 #0B6B3E):
    "20 inzerátů zdarma", "Bez provizí z prodeje", "Český projekt"
- **Pravý sloupec (mockup)**: `flex: 1 1 400px; min-width: 300px; box-sizing: border-box`
  - Panel: `background: linear-gradient(160deg, #EAF7F0 0%, #DCF1E5 100%); border-radius: 20px; padding: 18px; min-height: 340px`, flex centered
  - Uvnitř wrapper: `display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 22px; padding: 26px 0`
  - **Karta "před"**: `flex: 0 1 200px; box-sizing: border-box`, bg #fff, radius 12px,
    `box-shadow: 0 10px 26px rgba(12,42,27,0.14)`, padding 14px 16px, gap 7px
    - Eyebrow: "Co napíšete" — monospace 9px, letter-spacing 0.12em, uppercase, #8DA396
    - Text: "„Starý router, funguje“" — 14px/600, line-height 1.35, #0C2A1B
    - Dvě mini fotky 44×34px, object-fit cover, radius 4px (demo-router.png, demo-router-stittek.png)
  - **Telefon "po"**: `flex: 0 0 268px; width: 268px`, bg #16211C, radius 30px, padding 9px,
    `box-shadow: 0 22px 48px rgba(12,42,27,0.24)`, box-sizing border-box
    - Vnitřní obrazovka: bg #fff, radius 23px, overflow hidden, flex column
    - Status řádek (padding 11px 16px 9px, space-between): "9:41" (9px/600 #97A79D) · "zaPikolou" (11px/700 #0FA45E) · 22px spacer
    - Tělo (padding 0 14px 14px, gap 9px):
      - Zelený banner: bg #EAF7F0, radius 9px, padding 10px 12px —
        "AI vám vylepšila inzerát" (12px/700 #0B6B3E) + "Zkontrolujte prosím text." (10px #5C7A69)
      - Fotka routeru: 100% × 104px, object-fit cover, radius 8px
      - Pole "Název" (label 9px/700 #6B7F73): border 1px #CFE3D7, bg #F7FCF9, radius 7px,
        padding 8px 10px, hodnota "Wi-Fi 6 router NL-AX3000" (11px/600)
      - Pole "Popis": border 1px #E4EBE6, radius 7px, padding 9px 10px, 10px / line-height 1.7 / #46584D
        "• Model: NL-AX3000 / • Wi-Fi 6, dual-band 2,4/5 GHz / • 4× Gigabit LAN / • Plně funkční, bez balení"
      - Řádek ceny (space-between, border 1px #E4EBE6, radius 7px, padding 8px 10px):
        label "Cena — zadáváte vy" (9px/700 #6B7F73) + "890 Kč" (13px/800 #0C2A1B)
        ⚠ Tento label je záměrný — nese pravidlo, že cenu zadává uživatel.
      - Tlačítko: bg #0FA45E, #fff, radius 8px, padding 11px, 12px/700, centered — "Publikovat inzerát"

### 3. "Tři kroky, pár kliknutí"

- Sekce: flex column, gap 34px, `padding: 0 0 80px`
- Eyebrow: "Jak to funguje" — monospace 12px, letter-spacing 0.14em, uppercase, #0FA45E
- H2: `clamp(28px, 4vw, 40px)` / 800 / letter-spacing -0.03em
- Karty: `display: flex; flex-wrap: wrap; gap: 20px`; každá karta
  `flex: 1 1 260px; box-sizing: border-box` (⚠ border-box je nutné — bez něj se karty lámou na 2+1),
  bg #F7FAF8, border 1px #E4EBE6, radius 14px, padding 30px, flex column, gap 14px
  - Číslo: 40×40px kruh, bg #0FA45E, #fff, 18px/800, centered
  - Titulek 21px/700, text 16px / line-height 1.6 / #55685C / text-wrap pretty
  1. **Vyfotíte věc** — "Mobilem, u okna, na stole. Jedna dobrá fotka stačí — klidně přidejte i štítek s modelem."
  2. **Napíšete pár slov** — "„Starý router, funguje.“ Když bude něco chybět, AI se sama doptá."
  3. **Zkontrolujete a publikujete** — "Text si přečtete, cenu zadáte sami a dáte publikovat. Poslední text je vždycky váš."

### 4. Tmavá sekce "Co za vás udělá AI"

- Sekce: bg #0C2A1B, radius 22px, `padding: clamp(30px, 4vw, 54px)`,
  `display: flex; flex-wrap: wrap; gap: 36px 48px; align-items: center; margin-bottom: 80px`
- Levý blok `flex: 1 1 320px; min-width: 260px; box-sizing: border-box`, gap 20px:
  - Eyebrow "Co za vás udělá AI" — monospace 12px, tracking 0.14em, uppercase, #6FCB9C
  - H2 `clamp(28px, 3.8vw, 38px)` / 800 / -0.03em / #fff / text-wrap balance:
    "Z jedné věty udělá inzerát, který jde najít"
  - Odstavec 17px / 1.65 / #A9C2B4:
    "Cenu si vždycky určujete vy. AI vám jen řekne, když jí přijde nezvykle vysoká nebo nízká — sama ji nedoplňuje."
- Pravý blok `flex: 1 1 340px; min-width: 260px; box-sizing: border-box`,
  `display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px`
  — 4 dlaždice, radius 12px, padding 22px, gap 8px; titulek 17px/700 #fff, text 15px/1.55
  1. **Název a popis** (bg #17392A, text #A9C2B4) — "Srozumitelně, ve správné kategorii."
  2. **Parametry** (bg #17392A, #A9C2B4) — "Model, stav, rozměry — co je z fotky poznat."
  3. **SEO pro vyhledávače** (bg #17392A, #A9C2B4) — "Inzerát se dá najít i z Googlu."
  4. **Kontrola ceny** (bg #0FA45E, text #DDF2E7) — "Upozorní, když je cena moc vysoká nebo nízká."

### 5. Dvě karty: dětský bazar + kategorie

- Sekce: `display: flex; flex-wrap: wrap; gap: 20px; padding-bottom: 80px`
- Každá karta: `flex: 1 1 380px; min-width: 280px; box-sizing: border-box`,
  bg #F7FAF8, border 1px #E4EBE6, radius 16px, padding 36px, flex column, gap 18px
- **Karta A — "Dětský bazar bez psaní"** (h3 26px/800/-0.02em)
  - Text 17px/1.65/#55685C: "Autosedačka, kočárek, bunda po starším dítěti. Nafotíte celou hromadu
    věcí za jeden večer a nemusíte u každé vymýšlet popis. Kupující jsou z vašeho okolí, takže
    odvoz je většinou o dvě zastávky."
  - Sekundární tlačítko: border 1.5px #0FA45E, text #0B6B3E, 16px/700, padding 13px 24px, radius 100px
    — "Projít dětský bazar" → míří na kategorii Dětský bazar
- **Karta B — "Co se u nás prodává"**
  - Chipy (flex wrap, gap 9px; bg #EAF7F0, text #0B6B3E, 15px/600, padding 10px 17px, radius 100px):
    Dětský bazar, Elektro, Dům a zahrada, Móda, Sport, Auto-moto, Hobby, Služby a práce, Události
    → V produkci generovat z reálného seznamu kategorií a odkazovat na ně.
  - Pod tím (margin-top auto, 16px/1.6/#55685C): "Inzeráty se dají filtrovat podle obce, takže vidíte hlavně to, co je poblíž."

### 6. FAQ

- Sekce: flex column, gap 26px, padding-bottom 80px
- H2 `clamp(26px, 3.4vw, 34px)` / 800 / -0.03em — "Časté dotazy"
- Grid: `repeat(auto-fit, minmax(280px, 1fr))`, gap 18px 40px
- Každá položka: border-top 1px #E4EBE6, padding-top 18px, gap 7px;
  otázka 18px/700, odpověď 16px/1.6/#55685C
  1. **Musím se registrovat?** — "Inzerát můžete začít připravovat hned. Před publikací se přihlásíte — jedním klikem přes Google, nebo klasicky e-mailem."
  2. **Kolik to stojí?** — "Prvních 20 inzerátů máte zdarma a z prodeje si nebereme provizi."
  3. **Určuje cenu AI?** — "Ne. Cenu zadáváte vy. AI vám jen dá vědět, pokud vypadá nezvykle vysoko nebo nízko."
  4. **Jak si předáme věc?** — "Domluvu si řešíte přímo mezi sebou. Protože inzeráty jsou lokální, většinou jde o osobní předání."
- Doporučení pro produkci: obalit do FAQPage JSON-LD schema (pomůže SEO).

### 7. Závěrečné CTA

- Sekce: `background: linear-gradient(160deg, #EAF7F0 0%, #DCF1E5 100%)`, radius 22px,
  `padding: clamp(34px, 5vw, 60px)`, flex column, align-items center, gap 22px, text-align center, margin-bottom 30px
- H2 `clamp(30px, 4.4vw, 44px)` / 800 / -0.035em / max-width 620px / text-wrap balance:
  "Vyberte si doma jednu věc a zkuste to"
- Odstavec 19px / 1.55 / #46584D / max-width 520px:
  "Vyfotíte, napíšete pár slov, přihlásíte se přes Google a inzerát je venku. Prvních 20 je zdarma."
- Tlačítko: bg #0FA45E, #fff, 18px/700, padding 18px 36px, radius 100px — "Vložit inzerát zdarma"

### 8. Footer

- `display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; padding: 28px 0 44px; border-top: 1px solid #E4EBE6`
- 14px / #6B7F73. Vlevo "zaPikolou.cz — lokální inzerce ve vašem okolí",
  vpravo (flex, gap 20px): Podmínky inzerce, Ochrana osobních údajů, Kontakt
  → napojit na /podminky-inzerce, /gdpr, /kontakt

---

## Interactions & Behavior

Prototyp je statický. V produkci doplňte:

- **Všechna tři primární CTA** ("Vložit inzerát zdarma" v heru, header, závěrečné CTA)
  → `/inzerat/novy`. Nepřesměrovávat rovnou na login — uživatel má nejdřív vidět formulář.
- **"Jak to funguje"** → `/jak-vytvorit-inzerat` (nebo scroll na sekci 3, pokud zůstane na stránce).
- **"Projít dětský bazar"** → výpis kategorie Dětský bazar, ideálně s předvyplněnou obcí Brno.
- **Hover stavy** (v prototypu nejsou, doplňte podle design systému):
  - Primární tlačítko: ztmavit na #0B6B3E, `transition: background 150ms ease`
  - Sekundární tlačítko: bg #EAF7F0
  - Chipy a karty: žádný hover (nejsou klikatelné) — kromě chipů, pokud je napojíte na kategorie
- **Poloha:** stránka mluví o Brnu. Pokud jde přes UTM poznat kampaň, předvyplňte
  filtr obce na Brno; jinak nechte prázdné.
- **Responzivita:** žádné media queries — vše řeší `flex-wrap` + `flex-basis` + `clamp()`.
  ⚠ Každý prvek s `flex-basis` MUSÍ mít `box-sizing: border-box`, jinak se padding přičte
  k basisu a karty se zalomí dřív, než mají.
- **Ověřte na 390px** (mobil) — většina trafficu z Facebooku je mobilní.

## State Management

Stránka je bez stavu. Žádný fetch, žádné formuláře.
Jediná dynamická data, která má smysl brát z API: seznam kategorií (sekce 5)
a případně limit "20 inzerátů zdarma" z konfigurace balíčků, aby se nerozešel s ceníkem.

## Měření — nutné pro A/B testy

Bez tohoto nelze kampaň vyhodnotit. Doporučené eventy do GTM:

| Event | Kdy | Proč |
|---|---|---|
| `lp_view` | načtení stránky | základ (denominátor) |
| `lp_cta_click` | klik na kterékoli CTA, s parametrem pozice (hero / header / footer) | která pozice funguje |
| `listing_start` | otevření /inzerat/novy | kolik lidí opravdu začne |
| `listing_publish` | úspěšná publikace | skutečná konverze |

Hlavní metrika kampaně je `listing_publish`, ne kliky na reklamu.
Sledujte i **drop-off na přihlášení** — pokud tam odpadne většina, je to největší úzké hrdlo.
Zachovejte UTM parametry z reklamy přes celou cestu včetně loginu.

## Design Tokens

**Barvy**

| Token | Hex | Použití |
|---|---|---|
| green-500 | `#0FA45E` | primární akce, akcenty, čísla kroků |
| green-700 | `#0B6B3E` | text na světle zeleném, hover primárního tlačítka |
| green-50 | `#EAF7F0` | světle zelené plochy, badge, chipy |
| green-100 | `#DCF1E5` | konec gradientu |
| ink-900 | `#0C2A1B` | hlavní text, tmavá sekce |
| ink-800 | `#16211C` | rám telefonu |
| ink-700 | `#17392A` | dlaždice v tmavé sekci |
| ink-600 | `#46584D` | odstavce |
| ink-500 | `#55685C` | sekundární text v kartách |
| ink-400 | `#6B7F73` | tlumený text, footer |
| ink-300 | `#97A79D` / `#8DA396` | mikrotexty v mockupu |
| mint-300 | `#6FCB9C` | eyebrow na tmavém |
| mint-200 | `#A9C2B4` | text na tmavém |
| mint-100 | `#DDF2E7` | text na zelené dlaždici |
| surface | `#F7FAF8` / `#F7FCF9` | karty, pole |
| border | `#E4EBE6` | linky a rámy |
| border-green | `#CFE3D7` | rám aktivního pole |
| white | `#fff` | pozadí stránky |

Gradient (hero panel, závěrečné CTA): `linear-gradient(160deg, #EAF7F0 0%, #DCF1E5 100%)`

**Typografie**

Prototyp používá **Archivo** (Google Fonts, weights 400/500/600/700/800).
→ Pokud web už má vlastní sans-serif, použijte ten a nepřidávejte další font.
Monospace eyebrows: systémový stack `ui-monospace, Menlo, monospace`.

| Role | Velikost | Weight | Tracking |
|---|---|---|---|
| H1 | clamp(38px, 6.2vw, 62px) | 800 | -0.04em |
| H2 sekce | clamp(28px, 4vw, 40px) | 800 | -0.03em |
| H2 CTA | clamp(30px, 4.4vw, 44px) | 800 | -0.035em |
| H3 karty | 26px | 800 | -0.02em |
| Titulek kroku | 21px | 700 | — |
| Hero podtitul | 21px | 400 | — |
| Odstavec | 16–19px | 400 | — |
| Eyebrow (mono) | 12px | 400 | 0.14em, uppercase |
| Micro | 14–15px | 400–600 | — |

`line-height`: 1.02 (H1), 1.06–1.1 (H2), 1.55–1.7 (text).
`text-wrap: balance` na nadpisech, `text-wrap: pretty` na odstavcích.

**Rádiusy:** 100px (pilulky/tlačítka), 22px (velké sekce), 20px (hero panel),
16px (karty), 14px (karty kroků), 30px/23px (telefon), 12px, 9px, 8px, 7px (drobnosti)

**Stíny:** `0 10px 26px rgba(12,42,27,0.14)` (karta "před"), `0 22px 48px rgba(12,42,27,0.24)` (telefon)

**Rozestupy:** používaná stupnice 4 / 7 / 9 / 14 / 18 / 20 / 22 / 26 / 30 / 36 / 44 / 54 / 76 / 80 px

## Assets

| Soubor | Původ | Použití |
|---|---|---|
| `assets/demo-router.png` | poskytl uživatel | fotka routeru v mockupu (velká + mini) |
| `assets/demo-router-stittek.png` | poskytl uživatel | fotka štítku, mini náhled |
| `assets/hero-pred-po.png` | výřez z FB cover | **nepoužívá se** v aktuální verzi, ponecháno pro referenci |

⚠ Fotky routeru jsou **demo/ukázkové** — jsou to fotky produktu, nikoli screenshoty appky.
V mockupu slouží jako obsah inzerátu, což je legitimní. Ověřte si k nim licenci,
pokud jde o stock; pokud jsou vlastní, je to bez problému.

Logo je v prototypu vysázené jako text — nahraďte reálným logem z webu.

## Files

| Soubor | Co obsahuje |
|---|---|
| `Landing page.dc.html` | celý design landing page (referenční prototyp) |
| `Facebook posty.dc.html` | 6 čtvercových grafik pro FB posty + texty (samostatný deliverable, ne součást landing page) |
| `PRAVIDLA-OBSAHU.md` | pravidla obsahu projektu (vykání, žádné časové claimy, cena, registrace) |
| `support.js` | runtime prototypů — musí ležet vedle .dc.html, aby se otevřely |

Prototypy jsou tzv. Design Components — HTML soubory, které se otevřou v prohlížeči.
Otevřete je vedle sebe s implementací a porovnávejte vizuálně.

## Definition of done

- [ ] Stránka je routa ve Next.js appce, ne samostatný HTML
- [ ] Všechna CTA míří na `/inzerat/novy` a zachovávají UTM
- [ ] Žádný text neobsahuje časový claim ani tykání
- [ ] Nikde netvrdíme, že AI doplní cenu
- [ ] Registrace před publikací je zmíněná, ne skrytá
- [ ] Otestováno na 390px, 768px a 1440px
- [ ] Eventy `lp_view`, `lp_cta_click`, `listing_start`, `listing_publish` posílají do GTM
- [ ] FAQ má JSON-LD schema
