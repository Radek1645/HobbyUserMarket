import type { ConditionLabel, PriceType } from "@/types/post";

type SubcategoryConfig = {
  slug: string;
  label: string;
  aiPrompt?: string;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  listingNotice?: string;
};

type CategoryConfig = {
  type: import("@/types/post").CategoryType;
  label: string;
  subcategories: SubcategoryConfig[];
  conditionLabels: { value: ConditionLabel; label: string }[];
  conditionFieldLabel?: string;
  priceTypes: { value: PriceType; label: string }[];
  aiPrompt?: string;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
};

const GOODS_CONDITIONS: CategoryConfig["conditionLabels"] = [
  { value: "new", label: "Nové" },
  { value: "like_new", label: "Jako nové" },
  { value: "used", label: "Použité" },
  { value: "damaged", label: "Poškozené / na díly" },
];

const COMMON_PRICE_TYPES: CategoryConfig["priceTypes"] = [
  { value: "fixed", label: "Pevná cena" },
  { value: "free_pickup", label: "Za odvoz / zdarma" },
  { value: "negotiable", label: "Dohodou" },
  { value: "exchange", label: "Výměnou" },
  { value: "offer", label: "Nabídni" },
];

const GOODS_AI_PROMPT_BASE =
  "Analyzuj nabízené zboží. cleanedDescription: úvod (co prodáváš + cena v textu) a sekce Parametry. " +
  "Je-li typ výrobku spolehlivě identifikovaný (značka + model / motorizace / jednoznačný produkt), POVINNĚ doplň katalogové vlastnosti s jistotou — nečekej, až je napíše inzerent. " +
  "Kusové údaje (stav kusu, nájezd, vady, balení) jen z textu/fotek/formuláře. Ve formuláři dostaneš stav — u „Poškozené / na díly“ bez rozsahu vady se ptej. " +
  "DĚTSKÉ ZBOŽÍ (jen když je zjevně dětské / pro dítě, ne „dětský styl“ pro dospělé; u kategorie detsky ber jako dětské vždy): chybí-li věk, výška i velikostní pásmo, jedna otázka paramLabel „Věk / výška“; u dětských bot se stélkou/velikostí věk neopakuj. " +
  "Doplňující otázky jen na chybějící kusové / variantní údaje, ne na katalog identifikovaného výrobku. Na cenu se neptej, pokud je ve formuláři.";

const AUTO_OSOBNI_AUTA_AI_PROMPT =
  "Úvod + Parametry (rok, nájezd, motorizace, STK, datum poslední servisní prohlídky, výbava, stav). " +
  "Je-li značka + model (+ motorizace) jasné, doplň katalogové vlastnosti s jistotou (palivo/pohon, typ karoserie, výkon kW pokud z motorizace jednoznačně plyne, běžná výbava modelu). " +
  "Výbavový stupeň (Ambition/Style…) nehádej. Rok, nájezd, STK, poslední servis a vady jsou kusové — chybí-li, zeptej se (paramLabel např. „Poslední servis“, „Nájezd“, „Rok“). " +
  "VÝBAVA VOZU (kusová): pokud text ani fotky neříkají konkrétní výbavu vozu (klima, navigace, tempomat, parkovací senzory/kamera, vyhřívaná sedadla, tažné, střešní okno, CarPlay/Android Auto, sada kol…), " +
  "zeptej se jednou (paramLabel: „Výbava“; label např. „Jaká je výbava vozu?“) — nevymýšlej. Je-li výbava v textu nebo jasně vidět na fotkách, zapiš do Parametrů a neptej se. " +
  "Na cenu se neptej, pokud je ve formuláři — cenu dej do úvodu.";

const AUTO_MOTORKY_AI_PROMPT =
  "Úvod + Parametry (rok, nájezd, objem/motorizace, STK, výbava, stav). " +
  "Je-li značka + model jasné, doplň katalogové vlastnosti s jistotou. " +
  "VÝBAVA (kusová): pokud text ani fotky neříkají konkrétní výbavu (kufr, padací rámy, plexi, vyhřívané rukojeti, ABS, tempomat…), " +
  "zeptej se jednou (paramLabel: „Výbava“; label např. „Jaká je výbava motorky?“) — nevymýšlej. Je-li výbava jasná, zapiš do Parametrů a neptej se. " +
  "Na cenu se neptej, pokud je ve formuláři — cenu dej do úvodu.";

const POTRAVINY_DOMACI_AI_PROMPT =
  "Uživatel nabízí potraviny nebo domácí jedlé výrobky.\n\n" +
  "Očekávej jedlé věci jako med, marmelády, sirupy, pečivo, ovoce, zeleninu, vejce, bylinky, koření, domácí zavařeniny nebo jiné potraviny a nápoje.\n" +
  "Pokud text nebo fotografie zjevně ukazují nejedlý produkt (např. elektroniku, router, WiFi extender, nábytek, oblečení, autodíl, nářadí), vrať REJECTED s důvodem, že inzerát je zařazený do špatné kategorie a má se přesunout jinam.\n" +
  "Pokud jde o potravinu, zeptej se jen na zásadní chybějící údaje jako druh, množství, forma balení, trvanlivost nebo alergeny, pokud jsou relevantní.";

const NABYTEK_AI_PROMPT =
  "Úvod + Parametry (typ, materiál, rozměry, stav). " +
  "Je-li typ výrobku jasně identifikovaný (značka/model nebo jednoznačný typ), doplň katalogové vlastnosti s jistotou. " +
  "Přesné rozměry konkrétního kusu, vady a odvoz jen z textu/fotek nebo se zeptej.";

const ELEKTRONIKA_AI_PROMPT =
  "Úvod + Parametry (značka, model, stav, výbava…). " +
  "Je-li model jasný (Amazfit GTR/GTS, iPhone, notebook…), MUSÍŠ doplnit katalog — nestačí jen Stav/Vady/Popis. " +
  "U smartwatch vždy: GPS, bio (tep/SpO₂), voděodolnost, Bluetooth volání (pokud model má) — zvlášť nebo pod Výbava. " +
  "Příslušenství v balení a vady kusu jen z textu/fotek. Label „Popis:“ nepoužívej — piš Značka + Model.";

const KOLA_SPORT_AI_PROMPT =
  "Úvod + Parametry (značka, model/typ, velikost, materiál, výbava, stav). " +
  "Je-li značka a model/typ jasné, doplň katalogové vlastnosti s jistotou (např. odpružení, brzdy, materiál rámu u známého kola). " +
  "Velikost rámu/kol, stav a příslušenství konkrétního kusu jen z textu/fotek nebo se zeptej. " +
  "DĚTSKÉ ZBOŽÍ (zjevně dětské / pro dítě / dívčí / chlapecké — ne „dětský styl“ pro dospělé): chybí-li věk, výška i velikostní pásmo (např. vel. 98, „pro 6–9 let“), zeptej se jednou (paramLabel: „Věk / výška“; label např. „Pro jaký věk / výšku dítěte je věc vhodná?“). Je-li údaj známý, zapiš do Parametrů a neptej se. " +
  "Dotazník jen na chybějící kusové údaje — ne na katalog už identifikovaného modelu.";

const DETSKY_OBLECENI_AI_PROMPT =
  "Uživatel prodává dětské oblečení, obuv nebo doplňky.\n\n" +
  "SPODNÍ A INTIMNÍ PRÁDLO — povinná pravidla:\n" +
  "- Fotografie musí ukazovat pouze věc (věšák, flat lay, detail materiálu), ne osobu v prádle, postel ani boudoir styl.\n" +
  "- V popisu nebo Parametrech musí být velikost; doporuč značku a stav.\n" +
  "- Zamítnout (REJECTED, sexual_services), pokud foto sexualizuje osobu nebo inzerát působí jako nabídka sexuální služby místo prodeje věci.\n" +
  "- Pro předání piš „osobní předání po domluvě“ nebo „vyzvednutí po domluvě“, NIKDY „osobní prohlídka“ (to platí jen u nemovitostí).\n\n" +
  "BOTY A OBUV — pokud text/fotky ukazují boty:\n" +
  "- Chybí-li info o vyndávací stélce (vložce), zeptej se (paramLabel: „Vyndávací stélka“; label např. „Mají boty vyndávací stélku / vložku?“).\n" +
  "- Chybí-li délka stélky v mm, zeptej se (paramLabel: „Délka stélky“; label např. „Jaká je délka stélky v mm?“). Jednotka mm je povinná.\n" +
  "- Je-li údaj známý, zapiš do Parametrů a neptej se.\n" +
  "- Pokud už je stélka nebo velikost jasná, na věk/výšku se navíc neptej.\n\n" +
  "DĚTSKÉ OBLEČENÍ — vždy ber jako dětské:\n" +
  "- Chybí-li věk, výška i velikostní pásmo (např. vel. 98, „pro 4–6 let“, výška 110 cm), zeptej se jednou (paramLabel: „Věk / výška“; label např. „Pro jaký věk / výšku dítěte je věc vhodná?“).\n" +
  "- Je-li údaj známý, zapiš do Parametrů a neptej se.\n\n" +
  "Obecně: pokud z textu či fotek NENÍ jasná VELIKOST nebo ZNAČKA, vygeneruj stručné otázky. " +
  "Celkem max 5 otázek. Na volitelné parametry (materiál, sezóna) se ptej jen pokud text neobsahuje téměř nic.";

const MODA_DOSPELE_AI_PROMPT =
  "Uživatel prodává módu a oblečení pro dospělé.\n\n" +
  "Dětské oblečení patří do kategorie detsky — u zjevně dětského zboží navrhni přesun (categorySuggestion).\n\n" +
  "SPODNÍ A INTIMNÍ PRÁDLO — povinná pravidla:\n" +
  "- Fotografie musí ukazovat pouze věc (věšák, flat lay, detail materiálu), ne osobu v prádle, postel ani boudoir styl.\n" +
  "- V popisu nebo Parametrech musí být velikost; doporuč značku a stav.\n" +
  "- Zamítnout (REJECTED, sexual_services), pokud foto sexualizuje osobu nebo inzerát působí jako nabídka sexuální služby místo prodeje věci.\n" +
  "- Pro předání piš „osobní předání po domluvě“ nebo „vyzvednutí po domluvě“, NIKDY „osobní prohlídka“ (to platí jen u nemovitostí).\n\n" +
  "BOTY A OBUV (včetně bot na chození) — pokud text/fotky ukazují boty:\n" +
  "- Chybí-li info o vyndávací stélce (vložce), zeptej se (paramLabel: „Vyndávací stélka“; label např. „Mají boty vyndávací stélku / vložku?“).\n" +
  "- Je-li údaj známý, zapiš do Parametrů (např. • Vyndávací stélka: ano) a neptej se.\n\n" +
  "HODINKY — pokud text/fotky ukazují hodinky:\n" +
  "- Chybí-li šířka pásku v mm, zeptej se (paramLabel: „Šířka pásku“; label např. „Jaká je šířka pásku v mm?“).\n" +
  "- Jednotka mm je povinná. Známou hodnotu zapiš do Parametrů a neptej se. Na délku pásku se neptej — je standardní.\n" +
  "- Je-li značka a model jasné (i u módních/smart hodinek), doplň katalogové vlastnosti s jistotou (materiál pouzdra, typ strojku / GPS / voděodolnost…).\n\n" +
  "NÁRAMKY A NÁHRDELNÍKY — pokud text/fotky ukazují náramek nebo náhrdelník:\n" +
  "- Chybí-li délka (v mm), zeptej se (paramLabel: „Délka“; label např. „Jaká je délka náramku / náhrdelníku v mm?“).\n" +
  "- Jednotka mm je povinná. Známou délku zapiš do Parametrů a neptej se.\n\n" +
  "Obecně: pokud z textu či fotek NENÍ jasná VELIKOST nebo ZNAČKA, vygeneruj stručné otázky. " +
  "Celkem max 5 otázek. Na volitelné parametry (materiál, sezóna) se ptej jen pokud text neobsahuje téměř nic.";

const OSTATNI_ZBOZI_AI_PROMPT =
  "Úvod + Parametry podle typu zboží. " +
  "Je-li výrobek jasně identifikovaný (značka + model / jednoznačný typ, např. sekačka Bosch AdvancedRotak 650), doplň katalogové vlastnosti s jistotou. " +
  "Kusové údaje (stav, vady, příslušenství) jen z textu/fotek nebo se zeptej.";

/** Zbožové domény — skládá se do `CATEGORIES` v categories.ts. */
export const GOODS_CATEGORIES: CategoryConfig[] = [
  {
    type: "auto",
    label: "Auto",
    subcategories: [
      {
        slug: "osobni-auta",
        label: "Osobní auta",
        titlePlaceholder: "např. Škoda Octavia 2.0 TDI",
        descriptionPlaceholder:
          "Rok, nájezd, motorizace, STK, poslední servis, výbava, stav…",
        aiPrompt: AUTO_OSOBNI_AUTA_AI_PROMPT,
      },
      {
        slug: "motorky",
        label: "Motorky",
        titlePlaceholder: "např. Yamaha MT-07",
        descriptionPlaceholder:
          "Rok, nájezd, objem, STK, výbava, stav…",
        aiPrompt: AUTO_MOTORKY_AI_PROMPT,
      },
      {
        slug: "dily-prislusenstvi",
        label: "Díly a příslušenství",
        titlePlaceholder: "např. Zimní pneumatiky 205/55 R16",
        descriptionPlaceholder: "Typ, rozměr, kompatibilita, stav…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím autodoplňky",
        descriptionPlaceholder: "Co nabízíte, stav, způsob předání…",
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Prodám auto nebo motorku",
    descriptionPlaceholder: "Rok, nájezd, motorizace, STK, stav…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
  {
    type: "detsky",
    label: "Dětské",
    subcategories: [
      {
        slug: "detske-obleceni-obuv",
        label: "Dětské oblečení a obuv",
        titlePlaceholder: "např. Dívčí bunda Nike, vel. 128",
        descriptionPlaceholder: "Značka, velikost, stav… u bot délka stélky v mm…",
        aiPrompt: DETSKY_OBLECENI_AI_PROMPT,
      },
      {
        slug: "kocarky-sedacky-nabytek",
        label: "Kočárky, sedačky a nábytek",
        titlePlaceholder: "např. Kočárek Bugaboo Fox 3",
        descriptionPlaceholder: "Značka, typ, stav, příslušenství…",
      },
      {
        slug: "hracky-miminka",
        label: "Hračky a pro miminka",
        titlePlaceholder: "např. Dřevěná kuchyňka",
        descriptionPlaceholder: "Typ, věk, stav, rozměry…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Dětské zboží k prodeji",
        descriptionPlaceholder: "Co nabízíte, věk/výška, stav…",
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Prodám dětské zboží",
    descriptionPlaceholder: "Popis, věk/výška, stav, způsob předání…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
  {
    type: "dum",
    label: "Dům a zahrada",
    subcategories: [
      {
        slug: "nabytek-doplnky",
        label: "Nábytek a doplňky",
        titlePlaceholder: "např. Jídelní stůl z masivu",
        descriptionPlaceholder: "Rozměry, materiál, stav, možnost odvozu…",
        aiPrompt: NABYTEK_AI_PROMPT,
      },
      {
        slug: "zahrada-naradi",
        label: "Zahrada a nářadí",
        titlePlaceholder: "např. Zahradní sekačka Bosch",
        descriptionPlaceholder: "Typ, rozměry, stav, příslušenství…",
      },
      {
        slug: "potraviny-domaci",
        label: "Potraviny a domácí výrobky",
        titlePlaceholder: "např. Prodám med z vlastní včelny",
        descriptionPlaceholder:
          "Druh výrobku, množství, způsob předání, alergeny…",
        aiPrompt: POTRAVINY_DOMACI_AI_PROMPT,
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím věci do domácnosti",
        descriptionPlaceholder: "Co nabízíte, stav, rozměry, způsob předání…",
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Nabízím věci do domácnosti",
    descriptionPlaceholder: "Popis, rozměry, stav, způsob předání…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
  {
    type: "elektro",
    label: "Elektronika",
    subcategories: [
      {
        slug: "mobily",
        label: "Mobily",
        titlePlaceholder: "např. iPhone 13, 128 GB",
        descriptionPlaceholder: "Model, stav, výbava, baterie, příslušenství…",
      },
      {
        slug: "pc",
        label: "Počítače",
        titlePlaceholder: "např. Notebook Lenovo ThinkPad",
        descriptionPlaceholder: "Model, procesor, RAM, disk, stav…",
      },
      {
        slug: "tv-foto-audio",
        label: "TV, foto a audio",
        titlePlaceholder: "např. Televize Samsung 55″",
        descriptionPlaceholder: "Model, úhlopříčka, stav, příslušenství…",
      },
      {
        slug: "spotrebice",
        label: "Spotřebiče",
        titlePlaceholder: "např. Pračka Bosch",
        descriptionPlaceholder: "Značka, model, stav, rozměry…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím elektroniku",
        descriptionPlaceholder: "Model, stav, výbava, příslušenství…",
        aiPrompt: ELEKTRONIKA_AI_PROMPT,
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Prodám elektroniku",
    descriptionPlaceholder: "Model, stav, výbava, příslušenství…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
  {
    type: "moda",
    label: "Móda",
    subcategories: [
      {
        slug: "damske-panske",
        label: "Dámské a pánské",
        titlePlaceholder: "např. Pánská bunda North Face, vel. L",
        descriptionPlaceholder: "Značka, velikost, stav, materiál…",
        aiPrompt: MODA_DOSPELE_AI_PROMPT,
      },
      {
        slug: "boty-doplnky",
        label: "Boty a doplňky",
        titlePlaceholder: "např. Kožené boty Clarks, vel. 42",
        descriptionPlaceholder:
          "Značka, velikost, stav… u hodinek šířka pásku, u šperků délka v mm…",
        aiPrompt: MODA_DOSPELE_AI_PROMPT,
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím oblečení",
        descriptionPlaceholder: "Značka, velikost, stav, způsob předání…",
        aiPrompt: MODA_DOSPELE_AI_PROMPT,
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Prodám oblečení",
    descriptionPlaceholder: "Značka, velikost, stav, způsob předání…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
  {
    type: "sport",
    label: "Sport",
    subcategories: [
      {
        slug: "kola-kolobezky",
        label: "Kola a koloběžky",
        titlePlaceholder: "např. Dětské kolo Velo 20″",
        descriptionPlaceholder: "Značka, velikost, stav, příslušenství…",
        aiPrompt: KOLA_SPORT_AI_PROMPT,
      },
      {
        slug: "zimni-sport",
        label: "Zimní sport",
        titlePlaceholder: "např. Sjezdové lyže Atomic",
        descriptionPlaceholder: "Značka, velikost, stav, výbava…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím sportovní vybavení",
        descriptionPlaceholder: "Typ, značka, velikost, stav…",
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Prodám sportovní vybavení",
    descriptionPlaceholder: "Značka, velikost, stav, příslušenství…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
  {
    type: "hobby",
    label: "Hobby",
    subcategories: [
      {
        slug: "knihy-hry-hudba",
        label: "Knihy, hry a hudba",
        titlePlaceholder: "např. Sada deskových her",
        descriptionPlaceholder: "Název, stav, jazyk, kompletnost…",
      },
      {
        slug: "sberatelstvi-umeni",
        label: "Sběratelství a umění",
        titlePlaceholder: "např. Sběratelská mince",
        descriptionPlaceholder: "Typ, stav, provenience, rozměry…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím hobby zboží",
        descriptionPlaceholder: "Co nabízíte, stav, způsob předání…",
        aiPrompt: OSTATNI_ZBOZI_AI_PROMPT,
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Nabízím hobby zboží",
    descriptionPlaceholder: "Popis, stav, způsob předání…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
  {
    type: "ostatni",
    label: "Ostatní",
    subcategories: [
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím zahradní sekačku",
        descriptionPlaceholder: "Co nabízíte, stav, rozměry, způsob předání…",
        aiPrompt: OSTATNI_ZBOZI_AI_PROMPT,
      },
    ],
    conditionLabels: GOODS_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Nabízím použité zboží",
    descriptionPlaceholder: "Popis zboží, stav, rozměry, způsob předání…",
    aiPrompt: GOODS_AI_PROMPT_BASE,
  },
];
