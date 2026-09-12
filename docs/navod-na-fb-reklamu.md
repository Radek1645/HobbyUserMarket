# Návod na FB reklamu — zaPikolou.cz

**🟢 SPUŠTĚNO (2026-09-04, 18:00)** — kampaň "zaPikolou — Brno rozjezd" živě v Ads Manageru, 2 sady (Rádio, Kočárek), 400 Kč/den každá, konec 11. 9. 2026 18:00. Detaily viz sekce "Ads Manager nastavení" níž.

**🔴 2026-09-05: potvrzen živý crop bug na Instagramu (uříznuté foto, uťatý text) — doporučeno reklamy pozastavit, dokud není oprava. Viz sekce "Nálezy 2026-09-05" níž.**

Kreativní brief + nastavení Ads Manageru.  
Brand/HP sada (ukotvení headeru, ne produktová AI karta): [`fb-ads/brand-kreativa-layout.md`](./fb-ads/brand-kreativa-layout.md).  
Technický funnel (flag, architektura, deploy): [`fb-promo-campaign.md`](./fb-promo-campaign.md).  
Aktuální stav smoke / Pixel / mobil: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.  
Před první platbou Meta: [`pravni/povinnosti-urady-fb-reklama.md`](./pravni/povinnosti-urady-fb-reklama.md). **IČO přidělené (2026-09-01)** — Business Manager účet lze založit rovnou jako "Obchodní".

---

## FB kampaň pro zaPikolou.cz — shrnutí

**Cíl:** Získat nové inzerenty (ne přetáhnout uživatele Bazoše/Sbazaru) — hlavní slib je jednoduchost a rychlost vystavení inzerátu.

**Cílovka:** Brno + okolí (15–20 km). Rodiče vyklízející pokojíčky, lidé po stěhování, kutilové.

**Proč bez videa:** Video je pro tenhle účel drahé a odvádí pozornost.

**Proč bez telefonního mockupu:** Zkoušeno (screenshot formuláře v rámečku telefonu) — v náhledu feedu moc malé a nepřehledné. Zamítnuto na základě reálného testu, ne teoreticky.

**Proč jen statika, bez karuselu:** Karusel se v tuhle chvíli nedělá — kapacita/čas na výrobu. Jeden formát banneru, dvě varianty podle produktu (viz A/B test níže).

---

### Kreativa — finální (2026-09-03)

**Statický banner** — 4:5, 1080×1350 px, stejný layout pro obě varianty, obě v **zelené** (brand barva, 1:1 s webem)
- Vizuál: reálná fotka produktu + bublina „✓ Popis během okamžiku" s ukázkou AI popisu
- Text v bublině **není vymyšlený** — je to skutečný výstup AI prefillu pro danou fotku (ověřeno screenshotem z appky, ne mockup)
- CTA tlačítko dole na kreativě

**Produktové varianty (A/B test, viz níže):**
- Rádio (Sony ZS-RS60BT) — obecnější položka, netáhne vizuálně k "baby bazaru"
- Kočárek (Bugaboo) — dětské zboží, užší cílová skupina

Barva (růžová varianta) existuje pro obě položky jako hotová kreativa, ale **do tohoto kola testu nejde** — držíme barvu konstantní (obě zelené), aby test měřil jen produkt/publikum, ne barvu. Růžová je kandidát na příští test.

**Karusel:** odloženo, nedělá se v této vlně.

---

### 🔴 Nálezy 2026-09-05 — kreativa živě rozbitá, doporučeno pozastavit

Potvrzeno screenshotem z Instagramu (živý provoz, ne náhled v editoru): foto uříznuté vpravo (přesahuje plátno), text v bublině uťatý uprostřed věty, tlačítko „Zaregistrovat se" se vizuálně překrývá s dalším textem pod sebou. Není to teoretický risk z náhledu — vidí to reální lidi teď.

**Doporučená akce:** pozastavit obě reklamy (Rádio, Kočárek) v Ads Manageru, dokud není nahraná opravená kreativa. *(stav 2026-09-05: doporučeno, potvrzení provedení čeká.)*

**Diagnóza:**
- Fotka fyzicky přesahuje mimo plátno kreativy — to není jen ořez podle placementu, zdrojový soubor je širší, než by měl být.
- Textové pole bubliny je širší než plátno → text se uprostřed věty utne.
- Ořez se projevil i v placementech, které jsme nevylučovali (Instagram Feed/Reels) — vyloučení pravého sloupce/Business Explore/Audience Network dřív řešilo jen 1,91:1 landscape ořez, ne tohle.

## Kuchařka na kreativu — v1 → v2 (aktualizováno 2026-09-05)

Tahle sekce nahrazuje dřívější opravné zadání — místo seznamu oprav je to recept, jak má kreativa vypadat správně, plus záznam, odkud jsme se posunuli.

### V1 — jak jsme to udělali (spuštěno 2026-09-04, teď pozastaveno)

- Jeden formát na všechno: 4:5 (1080×1350) — nasazený i na placementy, co potřebují 9:16 (Stories/Reels)
- Na kreativě: zelené pozadí + fotka produktu + bublina „✓ Popis během okamžiku" s reálnou ukázkou AI popisu + vypálené tlačítko „Vytvořit inzerát zdarma" jako součást obrázku
- Bez bezpečné zóny — text i foto sahaly až k okraji plátna
- Bez grafického zvýraznění „zdarma" a „generuje se automaticky" — tyhle věci byly jen v textu inzerátu okolo obrázku, ne na kreativě samotné

### Co se pokazilo (zjištění 2026-09-05, potvrzeno živě na Instagramu)

- Foto přesahovalo mimo plátno / v 9:16 se ořízlo
- Text v bublině se uřízl uprostřed věty
- Vypálené tlačítko v obrázku kolidovalo s reálným Meta tlačítkem pod ním — dvě různá CTA nad sebou
- Hlavní výhody (zdarma, automatický popis) nebyly na kreativě vidět, jen v textu okolo

### V2 — jak to má správně vypadat

Nahrazeno níže univerzálním návodem — je to definitivní, znovupoužitelná verze receptu (ne jen jednorázová oprava).

---

## Univerzální návod: produktová FB/IG reklama zaPikolou.cz

Šablona pro každý další produkt (rádio, kočárek, ...). Zachovává odsouhlasenou strukturu, mění se jen fotka a text popisu.

**Pozn. k aktuální kampani (Brno rozjezd):** živý test rádio vs. kočárek běží jen na zelené (barva se v tomto kole netestuje, viz sekce "Kreativa — finální" výš) — tenhle univerzální návod popisuje standardní produkční proces pro budoucí kreativy (vždy obě barvy v knihovně), neznamená to, že se obě barvy musí pustit najednou do stejného testu.

### 1. Formáty a rozměry

Ke každému produktu se vždy dělají dvě verze, nikdy jen jedna:
- **4:5 (Feed)** — 1080×1350 px, export i ve 2160×2700 px
- **9:16 (Stories/Reels)** — 1080×1920 px, export i ve 2160×3840 px

4:5 se NIKDY neořezává na 9:16 a naopak — každý formát má vlastní layout. Ověřeno živě: ořez uřezává text a fotku.

### 2. Bezpečné zóny (safe zones)

| Formát | Nahoře | Dole | Boky |
|---|---|---|---|
| 4:5 (Feed) | min. 250 px volných | min. 250 px volných | min. 100 px |
| 9:16 (Reels/Stories) | 270 px (systémové UI) | 670 px — spodních 35 % plátna musí zůstat čisté/neutrální, produkt tam fyzicky nesmí ležet | 65 px |

Čísla jsou solidní vodítko z externích Meta specifikací, ne definitivní zdroj. Poslední slovo má vždy reálný náhled v Ads Manageru pro Feed i Reels/Stories zvlášť — ne jen mockup.

### 3. Struktura layoutu

- **4:5:** barevný header nahoře (logo + pilulka „Online bazar" + headline) → fotka produktu přes zbytek plátna → bílá AI karta s popisem přes spodní část fotky → dostatečná mezera pod kartou (safe zone).
- **9:16:** barevný header nahoře (~400 px) → zbytek plátna JEDNA souvislá světlá/neutrální plocha (barva ladí s pozadím produktové fotky, aby nevznikl viditelný šev) → AI karta nahoře v této ploše → produkt pod kartou vycentrovaný, zobrazený celý (object-fit: contain, nikdy cover/ořez — anténa a paty se nesmí ztratit) → spodní ~35 % plochy zůstává prázdné pro overlay Instagramu.

### 4. Barvy

Dvě schválené varianty, vždy obě: **Zelená (#00A86B)** a **Magenta (#D6006E)**. Text bílý s tmavým obtahem shodné barvy tématu. AI karta vždy bílá s tmavým textem.

### 5. Povinné prvky

- Logo + „Online bazar" pilulka v headeru
- Badge „ZDARMA" — bílý se sladěnou barvou/obtahem tématu, samostatně ukotvený (u headlinu nebo v rohu fotky), nikdy slitý s jinou pilulkou/textem
- Headline — krátké sdělení principu (např. „Vyfotit, párkrát kliknout, hotovo.")
- Produktová fotka — čistá, bez loga přeprodávajícího prodejce; ideálně bílé/světlé studiové pozadí
- AI karta — „⚡ Popis vygenerujeme automaticky" (výrazně, tučně, min. 30 px) + 2–3 věty konkrétního popisu s reálným modelem/značkou produktu

### 6. Co NEPOUŽÍVAT (guardrails)

- Žádné vypálené CTA tlačítko do obrázku — Meta má vlastní systémové CTA
- Žádné tvrzení „bez registrace" — fakticky nepravdivé
- Žádný text/foto přesahující přes hranu plátna
- Žádné opakování stejné fráze ve více bublinách (redundance)

### 7. Postup pro nový produkt

1. Získat produktovou fotku bez loga prodejce, ideálně s bílým/světlým pozadím
2. Vytvořit 4:5 verzi podle šablony (Canvas.dc.html jako reference)
3. Vytvořit 9:16 verzi podle šablony (Radio Ad 9x16.dc.html jako reference)
4. Napsat konkrétní 2–3větý popis s modelem/značkou produktu
5. Zkontrolovat obě barevné varianty (Zelená, Magenta)
6. Ověřit reálný náhled v Ads Manageru zvlášť pro Feed a zvlášť pro Reels/Stories
7. Exportovat 8 PNG: 4:5 a 9:16 × Zelená/Magenta × 1× a 2× rozlišení

**Než se znovu spustí aktuální kampaň (Brno rozjezd):**
- Zkontrolovat reálný náhled v Ads Manageru zvlášť pro Feed i Reels/Stories (ne jen mockup) — přesně tenhle krok se přeskočil minule.
- Potvrdit, že guest funnel C (`NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED`) je v produkci aktivní. Pokud by anonym po kliku z reklamy narazil na login wall místo formuláře dřív, než ochutná AI prefill, bounce rate vystřelí a rozpočet jde do kanálu. Stav: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.
- Z osmi exportovaných PNG jde do Ads Manageru jen podmnožina relevantní pro tenhle test (zelená, 4:5 + 9:16, 1× rozlišení pro upload — 2× je jen zdrojová rezerva).

---

### Copywriting

- **Primární text (caption nad obrázkem):** „Máš doma věci, co už nepoužíváš? Stačí fotka a pár slov – inzerát na zaPikolou.cz je hotový za pár kliků." *(opraveno 2026-09-03 — původní „Uklízíš skříň nebo sklep?" neseděl ke kreativě s kočárkem, nová verze je univerzální, sedí k oběma produktovým variantám)*
- **Headline (na obrázku):** „Vyfotit, párkrát kliknout, hotovo." — nahrazuje původní „Stačí fotka a pár slov", popisuje proces přímo
- **Tlačítko (CTA):** „Vytvořit inzerát zdarma" — nahrazuje původní „Přidat inzerát"

---

### Ads Manager nastavení

- **Struktura Ad Setů:** carousel odpadl, takže se neřeší CBO statika/carousel. **Finální (2026-09-04):** 2 Ad Sety — **rádio vs. kočárek** (obě zelená) — **ručně vytvořené v jedné kampani, ne přes nativní Meta "A/B test" nástroj.** Ten jsme zkusili, ale při publikaci by vytvořil samostatnou duplicitní kampaň jako "verzi B" místo použití naší druhé sady — nakonec vypnutý (Vypnuto). Rozpočet per Ad Set (ne CBO), 400 Kč/den každá, konec 11. 9. 2026. Barva se v tomto kole netestuje. Detaily viz `zadani-ads-manager`.
- **Cíl kampaně:** Konverze, ne kliknutí/traffic.
- **Optimalizace:** standardní event Meta Pixel — **`Lead`** (publikace inzerátu; nepoužívat `Inzerat_Vytvoren` / `Post_Ad_Success`) — spouštěný až po úspěšném podání inzerátu, ne na kliknutí.

### Thank you page

Na webu **není samostatná thank-you stránka**. Konverze se má spustit až po úspěšném vytvoření inzerátu (ne na odeslání formuláře, které může selhat validací).

Trigger: redirect na detail inzerátu s `?published=<postId>` → klientský beacon `Lead` (po `publish_approved_post`, ne po kliknutí na Publikovat).

Hodnotu inzerátu (cenu) do eventu **zatím nedávat** — optimalizace na value by tlačila algoritmus k drahým věcem, ne k počtu nových inzerentů. Volume na `Lead` stačí.

Jestli Pixel/smoke stačí ke spuštění kampaně: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.

---

### Výroba

Hotovo (2026-09-03) — statický banner, 2 produkty (rádio, kočárek) × 2 barevné varianty (zelená, růžová) = 4 hotové kreativy. Do aktuálního A/B testu jdou jen zelené. Zdroj obrázků: `docs/fb-ads/ads/`.

---

## Vazba na web (ať reklama slibuje totéž, co landing)

| V reklamě | Na webu |
|-----------|---------|
| Headline „Vyfotit, párkrát kliknout, hotovo.“ | HP H1: „Online bazar, kde stačí fotka a pár slov.“ — jiná formulace, stejné téma (rychlost/jednoduchost procesu) |
| CTA „Vytvořit inzerát zdarma“ | Na webu je „Vytvořit inzerát s AI“ / FAB. Landing z ads: `/inzerat/novy` (guest flag C — stav viz [`TO-DO § L`](./TO-DO-dalsi-den.md)) |
| Bublina „Popis během okamžiku“ + AI text | Reálný výstup AI prefillu pro danou fotku — ověřeno screenshotem z appky, není to vymyšlený text |
| „Zdarma“ | Platí pro kvótu zdarma (`HOME_FREE_QUOTA_BADGE_LABEL`), ne „navždy vše zdarma“. |

Při zapnutém flagu C host na `/inzerat/novy` vidí formulář, ne login wall — vypnutí by rozbilo slib „pár kliků“. Stav flagu: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.
