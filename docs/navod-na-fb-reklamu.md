# Návod na FB reklamu — zaPikolou.cz

Kreativní brief + nastavení Ads Manageru.  
Technický funnel (flag, architektura, deploy): [`fb-promo-campaign.md`](./fb-promo-campaign.md).  
Aktuální stav smoke / Pixel / mobil: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.  
Před první platbou Meta: [`pravni/povinnosti-urady-fb-reklama.md`](./pravni/povinnosti-urady-fb-reklama.md). **IČO přidělené (2026-09-01)** — Business Manager účet lze založit rovnou jako "Obchodní".

---

## FB kampaň pro zaPikolou.cz — shrnutí

**Cíl:** Získat nové inzerenty (ne přetáhnout uživatele Bazoše/Sbazaru) — hlavní slib je jednoduchost a rychlost vystavení inzerátu.

**Cílovka:** Brno + okolí (15–20 km). Rodiče vyklízející pokojíčky, lidé po stěhování, kutilové.

**Proč bez videa:** Video je pro tenhle účel drahé a odvádí pozornost.

**Proč bez telefonního mockupu:** Zkoušeno (screenshot formuláře v rámečku telefonu) — v náhledu feedu moc malé a nepřehledné. Zamítnuto na základě reálného testu, ne teoreticky.

**Proč jen statika, bez karuselu:** Karusel se v tuhle chvíli nedělá — kapacita/čas na výrobu. Jedna kreativa, dvě barevné varianty místo dvou formátů.

---

### Kreativa — finální (2026-09-01)

**Statický banner** — 4:5, 1080×1350 px, 2 barevné varianty (zelená / růžová — viz níže)
- Vizuál: reálná fotka produktu (příklad použitý v kreativě: kočárek Bugaboo) + bublina „✓ Popis během okamžiku" s ukázkou AI popisu
- Text v bublině **není vymyšlený** — je to skutečný výstup AI prefillu pro tu samou fotku (ověřeno screenshotem z appky, ne mockup)
- CTA tlačítko dole na kreativě

**Barevné varianty:**
- Zelená — brand barva, 1:1 s tím, co uvidí po prokliku na webu
- Růžová — mimo brand, ale z vlastní zkušenosti vyšší predikovaný CTR; testujeme vědomě jako druhou variantu

**Karusel:** odloženo, nedělá se v této vlně.

---

### Copywriting

- **Primární text (caption nad obrázkem):** „Máš doma věci, co už nepoužíváš? Stačí fotka a pár slov – inzerát na zaPikolou.cz je hotový za pár kliků." *(opraveno 2026-09-03 — původní „Uklízíš skříň nebo sklep?" neseděl ke kreativě s kočárkem, nová verze je univerzální pro libovolný produkt)*
- **Headline (na obrázku):** „Vyfotit, párkrát kliknout, hotovo." — nahrazuje původní „Stačí fotka a pár slov", popisuje proces přímo
- **Tlačítko (CTA):** „Vytvořit inzerát zdarma" — nahrazuje původní „Přidat inzerát"

---

### Ads Manager nastavení

- **Struktura Ad Setů:** carousel odpadl, takže se neřeší CBO statika/carousel. **Potvrzeno:** 2 Ad Sety (zelená vs. růžová) — čistý A/B test na CPA. Detaily viz `zadani-ads-manager`.
- **Cíl kampaně:** Konverze, ne kliknutí/traffic.
- **Optimalizace:** standardní event Meta Pixel — **`Lead`** (publikace inzerátu; nepoužívat `Inzerat_Vytvoren` / `Post_Ad_Success`) — spouštěný až po úspěšném podání inzerátu, ne na kliknutí.

### Thank you page

Na webu **není samostatná thank-you stránka**. Konverze se má spustit až po úspěšném vytvoření inzerátu (ne na odeslání formuláře, které může selhat validací).

Trigger: redirect na detail inzerátu s `?published=<postId>` → klientský beacon `Lead` (po `publish_approved_post`, ne po kliknutí na Publikovat).

Hodnotu inzerátu (cenu) do eventu **zatím nedávat** — optimalizace na value by tlačila algoritmus k drahým věcem, ne k počtu nových inzerentů. Volume na `Lead` stačí.

Jestli Pixel/smoke stačí ke spuštění kampaně: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.

---

### Výroba

Hotovo (2026-09-01) — statický banner, 2 barevné varianty. Zdroj obrázků: `docs/fb-ads/ads/`.

---

## Vazba na web (ať reklama slibuje totéž, co landing)

| V reklamě | Na webu |
|-----------|---------|
| Headline „Vyfotit, párkrát kliknout, hotovo.“ | HP H1: „Online bazar, kde stačí fotka a pár slov.“ — jiná formulace, stejné téma (rychlost/jednoduchost procesu) |
| CTA „Vytvořit inzerát zdarma“ | Na webu je „Vytvořit inzerát s AI“ / FAB. Landing z ads: `/inzerat/novy` (guest flag C — stav viz [`TO-DO § L`](./TO-DO-dalsi-den.md)) |
| Bublina „Popis během okamžiku“ + AI text | Reálný výstup AI prefillu pro danou fotku — ověřeno screenshotem z appky, není to vymyšlený text |
| „Zdarma“ | Platí pro kvótu zdarma (`HOME_FREE_QUOTA_BADGE_LABEL`), ne „navždy vše zdarma“. |

Při zapnutém flagu C host na `/inzerat/novy` vidí formulář, ne login wall — vypnutí by rozbilo slib „pár kliků“. Stav flagu: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.
