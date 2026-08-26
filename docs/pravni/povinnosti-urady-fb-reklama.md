# zaPikolou.cz — Povinnosti vůči úřadům (IČO, identifikovaná osoba / DPH, ČSSZ, ZP)

> **Účel:** Jeden zdroj — checklist před **reálnou** placenou Meta reklamou + vysvětlení identifikovaná osoba vs. plátce DPH (včetně potvrzení danové specialistky).  
> **Není právní rada** — ověř u účetního / poradce; lhůty a formuláře se mohou měnit.  
> **Související:** [`fb-promo-campaign.md`](../fb-promo-campaign.md) · [`pravni/README.md`](./README.md) (monetizace / OSVČ)

Platí, když spouštíš placenou reklamu na Facebook/Meta pro zaPikolou.cz (nebo obecně nakupuješ zahraniční B2B služby typu Meta, Google, SaaS na IČO).  
Vývoj, Pixel, GTM a CAPI samotné tyto povinnosti **nezakládají** — až reálné peníze za propagaci projektu.

---

## Princip v kostce

1. **Vývoj bez reálné placené reklamy** → 0 Kč, žádné povinnosti, žádné IČO.
2. **Peněz do Meta Ads na propagaci projektu** → ekonomická činnost (§ 5 ZDPH), i jako „test“ bez monetizace (NSS / CJEU Rompelman).
3. Checkbox „osobní/nekomerční“ v Meta Ads Manageru mění jen to, jak Meta účtuje DPH u sebe. **Nechrání před českým FÚ.** Legitimní jen u čistě osobního použití, ne u propagace vlastního projektu.
4. Nákupem zahraniční služby (Meta/Google/SaaS) se **nestaneš plátcem DPH** — staneš se **identifikovanou osobou (IO)**. Plátcem až při překročení obratových limitů (jiná linka).

---

## Identifikovaná osoba ≠ plátce DPH

U nákupu služby od osoby neusazené v tuzemsku typicky § **6h** ZDPH (ne § 6g — to je pořízení **zboží** z EU).

| | Identifikovaná osoba | Plátce DPH |
| :--- | :--- | :--- |
| Vznik | Přijetí vybrané služby ze zahraničí (reklama, SaaS…) | Obrat / dobrovolná registrace / jiný důvod |
| Tuzemská fakturace | Bez DPH (neplátce) | Obvykle s DPH |
| Zahraniční nákup | Přiznáš a **zaplatíš** CZ DPH | Přiznáš a typicky si i **odečteš** |
| Nárok na odpočet | Ne | Ano (při splnění podmínek) |
| Přiznání k DPH | Jen měsíce s povinností přiznat daň | Každé období, i nulové |
| Kontrolní hlášení | Ne | Ano (při relevantním plnění) |
| Souhrnné hlášení | Ne při pouhém nákupu (ano při poskytnutí služby do EU) | Podle transakcí |

Prakticky: faktura Meta 5 000 Kč bez DPH → v přiznání dopočítáš 21 % = 1 050 Kč a ty zaplatíš FÚ. Jako IO si je **neodečteš** — je to náklad.

### Potvrzení danové specialistky (Linda)

Konzultace k nákupu FB reklamy na živnost (řádově 5–10 tis. Kč):

> Nestaneš se plátcem, staneš se identifikovanou osobou. Přesně tak, jak to máš napsané. Zjednodušeně, identifikovaná osoba se z pohledu DPH chová jako plátce, ale s tím rozdílem, že pouze platí. Tzn. přijde faktura na 100 Kč a ty uděláš 100×0,21 CZ DPH — těch 21 Kč CZ DPH odvedeš na CZ FÚ a to je vše. Plátce by nejen odvedl 21, ale by si i vynárokoval těch 21 po FÚ a byl by na nule. Ty nebudeš plátce (dokud nepřekročíš kumulovaně obrat 2 MCZK), takže do té doby jen platíš (nemáš nárok na odpočet). A řešíš to jen v těch měsících, kdy máš za co platit. Když žádné plnění nemáš, nic neřešíš.

Dlouhodobá „konsekvence“ IO: status zůstává (může být zaparkovaný); při dalším zahraničním nákupu znovu přiznání + odvod za daný měsíc. Strach z nulových přiznání / kontrolních hlášení / „3 let“ patří k **plátci**, ne k IO.

### Co míchá účetní (časté zkratky)

1. „Koupíš reklamu z ciziny → jsi plátce“ — typicky jsi **IO**.
2. „Budou se podávat nulová přiznání“ — u plátce ano, u IO ne (§ 101 odst. 5 ZDPH).
3. „Kontrolní hlášení taky“ — IO nepodává.
4. „Po 2–3 letech kvartál“ — režim plátce, ne IO.

---

## Co vyřídit — přehled

| Úřad | Co vyřídit | Kdy | Náklady / poznámka |
|---|---|---|---|
| **Živnostenský úřad** | Ohlášení volné živnosti → IČO (obor Výroba, obchod a služby…) | Před reálnou placenou reklamou | 1 000 Kč. JRF / Portál občana / osobně. |
| **Finanční úřad** | Registrace **identifikované osoby** (§ 6h ZDPH) | Do **15 dnů** od přijetí první služby (ideálně předem / se vznikem IČO) | Zdarma. DIČ `CZ…`. Neplátce — jen IO, bez odpočtu, bez kontrolního hlášení. |
| **Finanční úřad** | Přiznání k DPH + úhrada | Do **25. dne** měsíce po měsíci kampaně/platby | 21 % ze základu. Jen měsíce s plněním — bez nulových přiznání. Moje daně / DS. |
| ~~FÚ~~ | ~~Souhrnné~~ / ~~kontrolní hlášení~~ | — | **Netýká se.** Souhrnné = když TY poskytuješ do EU. Kontrolní = plátce. |
| **ČSSZ (OSSZ)** | Oznámení zahájení SVČ | Do **8. dne** měsíce následujícího po zahájení | Vedlejší činnost (zaměstnaný). Zálohy 1. rok ne; doplatek po Přehledu. |
| **Zdravotní pojišťovna** | Oznámení zahájení SVČ | Do **8 dnů** od zahájení | Vedlejší. Zálohy 1. rok ne; doplatek dle Přehledu. |
| **Meta Ads Manager** | Účet „Obchodní“, IČO + DIČ | Před / při kampani | Reverse charge: 0 % na faktuře, DPH odvedeš v ČR. |

---

## Checklist ke zkopírování

```markdown
# Check-list — legální spuštění FB reklamy (zaPikolou.cz)

## 1. Jednorázově (před reálnou kampaní)
- [ ] Živnostenský úřad: volná živnost → IČO (1 000 Kč)
- [ ] Datová schránka: vznikne automaticky (komunikace s FÚ)
- [ ] FÚ: identifikovaná osoba (§ 6h ZDPH) — do 15 dnů od první faktury
- [ ] ČSSZ: zahájení SVČ (vedlejší) — do 8. dne následujícího měsíce
- [ ] Zdravotní pojišťovna: zahájení SVČ — do 8 dnů
- [ ] Meta Ads: Obchodní účet, IČO + DIČ

## 2. Měsíční cyklus (jen když reklama/platba reálně běžela)
1. Stáhnout faktury z Meta (0 % DPH, reverse charge)
2. Sečíst základ v Kč → 21 % DPH
3. Přiznání k DPH do 25. dne následujícího měsíce (mojedane.cz / DS)
   — souhrnné ani kontrolní hlášení NE
4. Uhradit DPH na účet místně příslušného FÚ

## 3. Když přestaneš platit reklamu
- Žádná další přiznání; IO může zůstat „zaparkovaná“
- Formální zrušení IO po 6 měsících bez plnění (nepovinné)

## 4. Úřad práce
- Aktivní IČO/OSVČ ≠ evidence na ÚP + podpora
- Před žádostí na ÚP: živnost POZASTAVIT (OSSZ, ZP, FÚ) — ne rušit
```

---

## Praktický postup u zahraniční služby (IO)

1. **Podnikatelský nákup** — reklama, AI, hosting, design tool… → typicky reverse charge. (Čistě soukromé = jiná situace.)
2. **Registrace IO** do 15 dnů ode dne, kdy ses IO stal (den přijetí služby nebo relevantní platby předem — ne jen datum faktury).
3. **DIČ dodavateli** → faktura bez jejich DPH (reverse charge).
4. **DPH 21 %** ze základu v Kč (kurz) → odvod; jako IO bez odpočtu.
5. **Přiznání + platba** do 25. dne následujícího měsíce. Bez relevantního nákupu → nic nepodáváš.

### Na co si dát pozor

- Datumy platby / faktury / poskytnutí služby nemusí sedět.
- Bez DIČ u dodavatele může přibalit zahraniční DPH (oprava bolí).
- Ukládej faktury i potvrzení plateb (SaaS často jen v billing).
- IO ≠ fakturovat českým zákazníkům s DPH.
- Sleduj zvlášť **obrat** pro plné plátcovství (od 2025 mj. limity kolem 2 mil. / 2 536 500 Kč).

---

## Opora v pravidlech

- § 6h ZDPH — IO při přijetí vybraného plnění od osoby neusazené v tuzemsku  
- § 97 ZDPH — přihláška k registraci IO do 15 dnů  
- § 101 odst. 5 ZDPH — bez povinnosti přiznat daň IO nic FÚ neoznamuje  
- Info FS — IO nepodává kontrolní hlášení; změny plátcovství / obratu od 1. 1. 2025  

U nestandardních transakcí, OSS, osvobozených služeb nebo rychlého růstu obratu ověř s daňovým poradcem.
