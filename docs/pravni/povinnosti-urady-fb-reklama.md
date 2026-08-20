# zaPikolou.cz — Povinnosti vůči úřadům (IČO, DPH, ČSSZ, ZP)

> **Účel:** Checklist před **reálnou** placenou reklamou na Facebook/Meta pro zaPikolou.cz.  
> **Není právní rada** — ověř u účetního / advokáta; lhůty a formuláře se mohou měnit.  
> **Související:** [`fb-promo-campaign.md`](../fb-promo-campaign.md) · [`pravni/README.md`](./README.md) (monetizace / OSVČ)

> Platí pro situaci: spouštíš placenou reklamu na Facebook/Meta pro zaPikolou.cz.  
> Vývoj, Pixel, GTM a CAPI samotné žádné z těchto povinností nezakládají — týká se to až chvíle, kdy do reklamy pošleš reálné peníze za účelem propagace projektu.

## Princip v kostce

1. **Vývoj a testování bez reálné placené reklamy** → 0 Kč, žádné povinnosti, žádný IČO.
2. **Jakmile pošleš peníze do Meta Ads na propagaci zaPikolou.cz** → vzniká ekonomická činnost ve smyslu §5 zákona o DPH (i jako „test“, i bez monetizace — přípravná/testovací fáze se počítá, viz judikatura NSS a CJEU/Rompelman).
3. Zaškrtnutí „osobní/nekomerční účel“ v Meta Ads Manageru mění jen to, jak ti Meta účtuje DPH na své straně (irská/lokální DPH místo reverse charge). **Nechrání tě to před českým finančním úřadem** — ten se dívá na skutečný účel činnosti, ne na checkbox v cizím formuláři. Legitimně to funguje jen pro čistě osobní použití (prodej staré postýlky), ne pro propagaci vlastního projektu/byznysu.
4. Riziko postihu u malých částek (jednotky tisíc Kč) je v praxi nízké — finanční správa nemá kapacitu takové případy aktivně dohledávat — ale právně čisté to není a při zpětném dohledání (např. při pozdější kontrole) hrozí doměření + penále.

## Co je potřeba vyřídit — přehled

| Úřad | Co vyřídit | Kdy | Náklady / poznámka |
|---|---|---|---|
| **Živnostenský úřad** | Ohlášení volné živnosti (získáš IČO), obor Výroba, obchod a služby… | Před spuštěním reálné placené reklamy | Jednorázově 1 000 Kč. Osobně na ZÚ nebo online přes Jednotný registrační formulář (JRF)/Portál občana. |
| **Finanční úřad** | Registrace jako **Identifikovaná osoba** k DPH (§ 6g ZDPH) | Do **15 dnů** od přijetí první služby (první faktury od Mety). Ideálně registrovat předem/současně se vznikem IČO. | Zdarma. Nevzniká plné plátcovství DPH (žádný nárok na odpočet). Přidělí se DIČ (CZ + rodné číslo). |
| **Finanční úřad** | Přiznání k DPH | Do **25. dne** měsíce následujícího po měsíci, kdy proběhla placená kampaň | Elektronicky (Moje Daně / EPO / datová schránka). Spočítáš 21 % z částky na faktuře od Mety a pošleš FÚ. Podává se **pouze za měsíce, kdy skutečně proběhla platba** — bez kampaně = bez podání. |
| ~~Finanční úřad~~ | ~~Souhrnné hlášení~~ | — | **Netýká se tě.** Souhrnné hlášení se podává jen když TY poskytuješ službu do zahraničí (např. AdSense výdělky). Při nákupu reklamy od Mety (ty jsi odběratel) se nepodává. |
| **ČSSZ (OSSZ)** | Oznámení zahájení SVČ | Do **8. dne kalendářního měsíce** následujícího po měsíci, kdy jsi činnost zahájil | Jelikož jsi zaměstnaný, jde o vedlejší činnost. První rok se neplatí zálohy, doplatek až po Přehledu o příjmech a výdajích. |
| **Zdravotní pojišťovna** | Oznámení zahájení SVČ | Do **8 dnů** ode dne zahájení činnosti | Vedlejší činnost. Zálohy první rok neplatíš, doplatek dle Přehledu. |
| **Meta Ads Manager** | Nastavit účet na „Obchodní“, doplnit IČO + DIČ | Před/při spuštění kampaně | Meta přestane účtovat irskou DPH a začne fakturovat v režimu reverse charge (0 % DPH, DPH doplatíš sám v ČR). |

## Checklist ke zkopírování

```markdown
# Check-list pro legální spuštění FB reklamy — zaPikolou.cz

## 1. Jednorázové nastavení (před spuštěním reálné kampaně)
- [ ] Živnostenský úřad: ohlásit volnou živnost → získat IČO (1 000 Kč, JRF/osobně)
- [ ] Datová schránka: automaticky vznikne (komunikace s FÚ)
- [ ] Finanční úřad: registrace jako Identifikovaná osoba (§ 6g ZDPH) — do 15 dnů od první faktury
- [ ] ČSSZ: Oznámení o zahájení SVČ (vedlejší činnost) — do 8. dne následujícího měsíce
- [ ] Zdravotní pojišťovna: Oznámení o zahájení SVČ — do 8 dnů
- [ ] Meta Ads Manager: přepnout účet na „Obchodní“, doplnit IČO + DIČ

## 2. Měsíční cyklus (jen v měsících, kdy reklama reálně běžela)
1. Stáhnout fakturu/faktury z Meta Ads Manageru (0% DPH, reverse charge)
2. Sečíst částku v Kč, spočítat 21 % DPH
3. Podat Přiznání k DPH do 25. dne následujícího měsíce (portal.mojedane.cz / datová schránka)
   — Souhrnné hlášení se NEPODÁVÁ (týká se jen poskytování služeb do EU, ne nákupu)
4. Uhradit vypočtenou DPH na účet místně příslušného FÚ

## 3. Pokud přestaneš platit reklamu
- Žádné další přiznání podávat nemusíš — status identifikované osoby zůstává „zaparkovaný“
- Formální zrušení jde podat po 6 měsících bez zdanitelného plnění (nepovinné)

## 4. Pokud přijdeš o zaměstnání a půjdeš na Úřad práce
- Aktivní IČO/OSVČ je s evidencí na ÚP a podporou v nezaměstnanosti neslučitelné
- Před podáním žádosti na ÚP je nutné živnost POZASTAVIT (ne zrušit) — nahlásit OSSZ, ZP, FÚ
- Po vyřešení lze živnost znovu „odpauzovat“ a pokračovat
```
