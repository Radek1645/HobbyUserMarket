# Zásady ochrany osobních údajů

**Platforma:** zaPikolou.cz  
**Verze:** 1.1-fo · **Datum účinnosti:** 13.07.2026  
**Správce:** Radek Horák, fyzická osoba · **Kontakt pro GDPR:** info@zapikolou.cz · datová schránka: fxetq2k

---

## TL;DR — v čem je pointa

Vaše údaje (e-mail, volitelně telefon) potřebujeme k provozu účtu a inzerce. IP adresy anonymizujeme do 7 dnů. Neaktivní účty bez přihlášení déle než 90 dní a bez aktivního inzerátu automaticky anonymizujeme (s předchozím upozorněním). Citlivé údaje nikomu neprodáváme.

---

## 1. Kdo zpracovává údaje a proč

Správcem osobních údajů je Provozovatel platformy zaPikolou.cz. Zpracováváme údaje v rozsahu nezbytném pro provoz účtu, publikaci inzerátů, bezpečnost komunity a — s vaším souhlasem — pro marketing a analytiku.

---

## 2. Tabulka zpracování osobních údajů

| Účel zpracování | Kategorie údajů | Právní základ dle GDPR | Doba uchování |
|-----------------|-----------------|------------------------|---------------|
| Správa účtu a inzerce | Jméno, e-mail, telefon (volitelný), text inzerátu, fotografie | Plnění smlouvy (čl. 6 odst. 1 písm. b) | Po dobu existence aktivního účtu; inzeráty 2 měsíce po vypršení platnosti (viz také automatická anonymizace v §6.1) |
| Automatická anonymizace neaktivních účtů | Identifikační a kontaktní údaje v profilu | Oprávněný zájem — minimalizace údajů (čl. 6 odst. 1 písm. f) | Spuštění po **90 dnech** od posledního přihlášení, pokud uživatel nemá aktivní inzerát; viz §6.1 |
| Newslettery a obchodní sdělení | E-mailová adresa | Souhlas (čl. 6 odst. 1 písm. a) | Do odvolání souhlasu |
| Analytika webu (GA4) | Technické identifikátory, agregované údaje o chování na webu | Souhlas (čl. 6 odst. 1 písm. a) — aktivace až po souhlasu v cookie liště | Dle nastavení nástroje a do odvolání souhlasu |
| Provozní a bezpečnostní logy | IP adresa (anonymizovaná), technické identifikátory | Oprávněný zájem (čl. 6 odst. 1 písm. f) | IP nejpozději do 7 dnů anonymizována; logy dle potřeby bezpečnosti |

---

## 3. Technické zabezpečení

### 3.1 Šifrování

Veškerý přenos dat mezi vaším prohlížečem a našimi servery je šifrován pomocí protokolu **HTTPS/TLS**.

### 3.2 Anonymizace IP adres

IP adresy jsou v logách serveru ukládány z bezpečnostních důvodů a **nejpozději do 7 dnů** automaticky anonymizovány zkrácením (odstraněním části adresy znemožňující identifikaci konkrétního zařízení).

---

## 4. Analytika a cookies

Analytické měření (Google Analytics 4 prostřednictvím Google Tag Manageru) aktivujeme **až po vašem souhlasu** v cookie liště (GTM consent mode). Podrobnosti o cookies viz [Zásady používání cookies](/cookies).

Pokud se u konkrétního analytického nástroje uplatní **společné správcovství** dle GDPR, vystupuje Provozovatel společně s poskytovatelem daného nástroje; Provozovatel odpovídá za získání souhlasu prostřednictvím cookie lišty.

---

## 5. Příjemci a předávání údajů

Údaje zpracováváme prostřednictvím smluvních zpracovatelů (hosting, e-mail, analytika). Seznam hlavních zpracovatelů je k dispozici na vyžádání na kontaktním e-mailu správce. Údaje nepředáváme třetím stranám za účelem prodeje.

> **Stav:** Region uložení a přeshraniční přenosy **nejsou zatím plně zdokumentované** v tomto textu. Níže je checklist k doplnění před ostrým provozem a revizí právníkem.

### 5.1 Checklist — data v EU / EHP (k doplnění)

- [ ] **Supabase** — ověřit v Dashboard → Project Settings → **region projektu** (cíl: EU, typicky `eu-central-1` Frankfurt). Zapsat do tohoto dokumentu a do [`PRD_v3.md`](../PRD_v3.md) §3.
- [ ] **Vercel** — ověřit region běhu (Functions / SSR) a zapsat do tabulky zpracovatelů; u Hobby tieru ověřit, zda neprobíhá zpracování mimo EHP.
- [ ] **Resend** (e-maily) — ověřit region účtu / DPA; doplnit do tabulky zpracovatelů.
- [ ] **Google Gemini** (AI moderace) — obsah inzerátu (text + fotky) odchází mimo naši DB: zvolit **EU endpoint** (pokud dostupný) nebo v GDPR uvést přenos mimo EHP + právní základ (SCC / DPA Google).
- [ ] **OpenAI** (fallback moderace) — stejně jako Gemini; pokud fallback zůstane, uvést USA + SCC nebo fallback vypnout v produkci.
- [ ] **Google OAuth / GA4** — doplnit do tabulky; GA4 jen po souhlasu v cookie liště; uvést případný přenos mimo EHP.
- [ ] **Mapy.cz** — doplnit zpracovatele (lokalita inzerátu / našeptávač).
- [ ] **Tabulka zpracovatelů** — doplnit sloupce: *Zpracovatel · Účel · Region · Kategorie údajů · Právní základ přenosu · DPA/SCC*.
- [ ] **Informace pro uživatele** — v §5 nebo samostatné příloze uvést, že **celý flow není EU-only** (min. kvůli AI moderaci), dokud nebude architektura upravena nebo právně pokryta.

**Referenční tabulka (draft — doplnit po ověření v dashboardech):**

| Zpracovatel | Účel | Region (cíl / ověřit) | Poznámka |
|-------------|------|------------------------|----------|
| Supabase | DB, auth, storage fotek | EU (`eu-central-1`) | Region při zakládání projektu |
| Vercel | hosting Next.js | ? | Ověřit v dashboardu |
| Resend | transakční e-maily | ? | Poptávky, notifikace |
| Google (Gemini) | AI moderace textu a fotek | mimo EHP (typicky) | Edge Function `moderate-listing` |
| OpenAI | fallback AI moderace | USA (typicky) | Volitelný fallback |
| Google | OAuth přihlášení | ? | Auth |
| Google | GA4 / GTM | ? | Jen po souhlasu |
| Mapy.cz | geokódování, našeptávač | CZ/EU | API klíč |

---

## 6. Vaše práva a retence účtu

Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost údajů a podání stížnosti u **Úřadu pro ochranu osobních údajů** ([uoou.cz](https://www.uoou.cz)).

### 6.1 Automatická anonymizace neaktivních účtů

Abychom minimalizovali zpracování osobních údajů, účet **automaticky anonymizujeme**, pokud jsou současně splněny obě podmínky:

1. Uživatel se **nepřihlásil déle než 90 dní** (poslední přihlášení dle účtu v autentizační službě).
2. Uživatel **nemá žádný aktivní inzerát**.

**7 dní před anonymizací** zašleme upozornění na e-mail uvedený u účtu. Přihlášení během této lhůty proces anonymizace zastaví. Po anonymizaci jsou identifikační údaje v profilu nahrazeny; komentáře pod inzeráty zůstávají anonymizované; autentizační účet je odstraněn — viz [VOP](/vop) §6.

### 6.2 Věk a souhlas dětí

Platforma je určena uživatelům od **15 let**. U osob **mladších 15 let** nelze účet založit. V České republice platí pro souhlas se zpracováním osobních údajů v souvislosti s informační společností věk **15 let** (čl. 8 GDPR ve spojení s národní úpravou). U osob mladších 15 let může souhlas udělit výhradně zákonný zástupce.

---

## 7. Kontakt

Dotazy ke zpracování osobních údajů směřujte na: **info@zapikolou.cz** · datová schránka: **fxetq2k**

---
