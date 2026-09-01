# Návod na FB reklamu — zaPikolou.cz

Kreativní brief + nastavení Ads Manageru.  
Technický funnel (flag, architektura, deploy): [`fb-promo-campaign.md`](./fb-promo-campaign.md).  
Aktuální stav smoke / Pixel / mobil: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.  
Před první platbou Meta: [`pravni/povinnosti-urady-fb-reklama.md`](./pravni/povinnosti-urady-fb-reklama.md).

---

## FB kampaň pro zaPikolou.cz — shrnutí

**Cíl:** Získat nové inzerenty (ne přetáhnout uživatele Bazoše/Sbazaru) — hlavní slib je jednoduchost a rychlost vystavení inzerátu.

**Cílovka:** Brno + okolí (15–20 km). Rodiče vyklízející pokojíčky, lidé po stěhování, kutilové.

**Proč bez videa:** Video je pro tenhle účel drahé a odvádí pozornost. Statické vizuály + karusel lépe ukážou jednoduchost rozhraní přímo.

---

### Kreativy (2, bez srovnávacího banneru — ten je vhodný spíš na přetahování uživatelů konkurence, ne na nové publikum)

**1. Statický banner** — 4:5, 1080×1350 px
- Vizuál: mobilní obrazovka s formulářem, jen 3 pole (Foto, Název, Cena)
- Text na fotce: „Stačí fotka a pár slov. Inzerát je hotový během pár kliků."
- Doplňkový text: „Brněnský bazar bez zbytečných formulářů."

**2. Karuselový návod** — 1:1, 1080×1080 px
- Karta 1: „1. Vyfoť to, co chceš prodat." (vizuál: focení mobilem)
- Karta 2: „2. Napiš cenu a pár slov o věci." (vizuál: vyplněný formulář)
- Karta 3: „3. Hotovo. Ozvou se lidi z okolí." (vizuál: zpráva od zájemce)
- Karta 4 (CTA): „Zkus zaPikolou.cz. Zdarma." (vizuál: logo/tlačítko)

---

### Copywriting

- **Primární text:** „Uklízíš skříň nebo sklep? Na zaPikolou.cz stačí fotka a pár slov – inzerát je hotový během pár kliků."
- **Headline:** „Stačí fotka a pár slov"
- **Tlačítko (CTA):** „Přidat inzerát"

---

### Ads Manager nastavení

- **Struktura Ad Setů:** Statika a Karusel nejdou do jednoho Ad Setu bez rozmyslu. Buď CBO napříč Ad Sety, nebo přímý A/B test měřící CPA na "podání inzerátu".
- **Cíl kampaně:** Konverze, ne kliknutí/traffic.
- **Optimalizace:** standardní event Meta Pixel — **`Lead`** (publikace inzerátu; nepoužívat `Inzerat_Vytvoren` / `Post_Ad_Success`) — spouštěný až po úspěšném podání inzerátu, ne na kliknutí.

### Thank you page

Na webu **není samostatná thank-you stránka**. Konverze se má spustit až po úspěšném vytvoření inzerátu (ne na odeslání formuláře, které může selhat validací).

Trigger: redirect na detail inzerátu s `?published=<postId>` → klientský beacon `Lead` (po `publish_approved_post`, ne po kliknutí na Publikovat).

Hodnotu inzerátu (cenu) do eventu **zatím nedávat** — optimalizace na value by tlačila algoritmus k drahým věcem, ne k počtu nových inzerentů. Volume na `Lead` stačí.

Jestli Pixel/smoke stačí ke spuštění kampaně: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.

---

### Výroba

Šablona v Canvě — Statika 1080×1350 px, Karusel 1080×1080 px. Reálný screenshot z webu/appky vložený do rámečku telefonu, doplněný velkým čitelným textem na kontrastním pozadí. Žádný složitý design — čím víc to připomíná skutečné UI, tím vyšší konverze.

---

## Vazba na web (ať reklama slibuje totéž, co landing)

| V reklamě | Na webu |
|-----------|---------|
| Headline „Stačí fotka a pár slov“ | HP H1: „Online bazar, kde stačí fotka a pár slov.“ |
| CTA „Přidat inzerát“ | Na webu je „Vytvořit inzerát s AI“ / FAB. Landing z ads: `/inzerat/novy` (guest flag C — stav viz [`TO-DO § L`](./TO-DO-dalsi-den.md)) |
| „Jen 3 pole“ | Reálný tok je fotky → AI náhled → doplnit cenu/stav/lokalitu → publikovat. Screenshot musí být skutečné UI, ne fiktivní 3-polový formulář. |
| „Zdarma“ | Platí pro kvótu zdarma (`HOME_FREE_QUOTA_BADGE_LABEL`), ne „navždy vše zdarma“. |

Karusel karta 2 přesněji: „Doplň cenu. Text ti napíše AI.“ — slib „pár slov“ drží, ale neslibuje ruční psaní, když landing je AI formulář.

Při zapnutém flagu C host na `/inzerat/novy` vidí formulář, ne login wall — vypnutí by rozbilo slib „pár kliků“. Stav flagu: [`TO-DO-dalsi-den.md`](./TO-DO-dalsi-den.md) § L.
