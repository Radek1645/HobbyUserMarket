# Zásady ochrany osobních údajů

**Platforma:** HobbyUserMarket  
**Verze:** 1.1 · **Datum účinnosti:** [doplnit]  
**Správce:** [název, sídlo, IČO] · **Kontakt pro GDPR:** [e-mail / DPO]

---

## TL;DR — v čem je pointa

Vaše údaje (e-mail, volitelně telefon) potřebujeme k provozu účtu a inzerce. IP u poptávek anonymizujeme do 7 dnů. Neaktivní účty bez přihlášení déle než 90 dní a bez aktivního inzerátu automaticky anonymizujeme (s předchozím upozorněním). Citlivé údaje nikomu neprodáváme.

---

## 1. Kdo zpracovává údaje a proč

Správcem osobních údajů je Provozovatel platformy HobbyUserMarket. Zpracováváme údaje v rozsahu nezbytném pro provoz účtu, publikaci inzerátů, bezpečnost komunity a — s vaším souhlasem — pro marketing a analytiku.

---

## 2. Tabulka zpracování osobních údajů

| Účel zpracování | Kategorie údajů | Právní základ dle GDPR | Doba uchování |
|-----------------|-----------------|------------------------|---------------|
| Správa účtu a inzerce | Jméno, e-mail, telefon (volitelný), text inzerátu, fotografie | Plnění smlouvy (čl. 6 odst. 1 písm. b) | Po dobu existence aktivního účtu; po vypršení inzerát skryjeme (archivace) a uchováme nejvýše **365 dní od založení**, poté soft-delete (viz VOP a §6.1) |
| Automatická anonymizace neaktivních účtů | Identifikační a kontaktní údaje v profilu | Oprávněný zájem — minimalizace údajů (čl. 6 odst. 1 písm. f) | Spuštění po **90 dnech** od posledního přihlášení, pokud uživatel nemá aktivní inzerát; viz §6.1 |
| Novinky a tipy e-mailem (připravujeme) | E-mailová adresa | Souhlas (čl. 6 odst. 1 písm. a) | Souhlas můžeme uložit při registraci; obchodní sdělení zatím nezasíláme. Po spuštění do odvolání souhlasu — viz [Marketingový souhlas](/marketingovy-souhlas) |
| Analytika webu (GA4) | Technické identifikátory, agregované údaje o chování na webu | Souhlas (čl. 6 odst. 1 písm. a) — aktivace až po souhlasu v cookie liště | Dle nastavení nástroje a do odvolání souhlasu |
| Provozní a bezpečnostní záznamy | IP u poptávek, technické identifikátory | Oprávněný zájem (čl. 6 odst. 1 písm. f) | IP u poptávek anonymizována do 7 dnů (§3.2); logy hostingu dle poskytovatele |

---

## 3. Technické zabezpečení

### 3.1 Šifrování

Veškerý přenos dat mezi vaším prohlížečem a našimi servery je šifrován pomocí protokolu **HTTPS/TLS**.

### 3.2 Anonymizace IP adres

U poptávek ukládáme IP adresu v databázi z bezpečnostních a anti-spam důvodů. **Nejpozději do 7 dnů** ji automaticky anonymizujeme zkrácením (u IPv4 na tvar znemožňující identifikaci konkrétního zařízení, např. `x.x.x.0`). Tato automatická anonymizace se vztahuje na záznamy poptávek v naší databázi; provozní logy hostingové platformy (např. Vercel) řídí příslušný poskytovatel dle vlastní retence.

---

## 4. Analytika a cookies

Analytické měření (Google Analytics 4 prostřednictvím Google Tag Manageru) aktivujeme **až po vašem souhlasu** v cookie liště (GTM consent mode). Podrobnosti o cookies viz [Zásady používání cookies](/cookies).

Pokud se u konkrétního analytického nástroje uplatní **společné správcovství** dle GDPR, vystupuje Provozovatel společně s poskytovatelem daného nástroje; Provozovatel odpovídá za získání souhlasu prostřednictvím cookie lišty.

---

## 5. Příjemci a předávání údajů

Údaje zpracováváme prostřednictvím smluvních zpracovatelů. Údaje nepředáváme třetím stranám za účelem prodeje. Aktuální seznam hlavních zpracovatelů je k dispozici na vyžádání na kontaktním e-mailu správce.

### 5.1 Hlavní zpracovatelé

| Zpracovatel | Účel | Region |
|-------------|------|--------|
| Supabase | databáze, autentizace, úložiště fotografií | EU — West EU (Ireland), `eu-west-1` |
| Vercel | hosting webové aplikace (Serverless Functions) | EU — Dublin (`dub1` / `eu-west-1`) |
| Resend | transakční e-maily (notifikace, poptávky) | EU — Ireland (`eu-west-1`), doména `zapikolou.cz` (ověřeno v Resend dashboardu 2026-07-19); účetní/provozní údaje poskytovatele mohou být mimo EHP — DPA a SCC dle smlouvy s Resend |
| Google | přihlášení přes Google (OAuth) | dle služby Google |
| Google (Gemini) | automatická moderace textu a fotografií inzerátů | přenos mimo EHP (typicky USA) — DPA / SCC dle smlouvy s Google |
| OpenAI | záložní AI moderace (pokud je aktivní) | přenos mimo EHP (typicky USA) — DPA / SCC dle smlouvy s OpenAI |
| Google | analytika webu (GA4 / GTM) — jen po souhlasu v cookie liště | dle služby Google |
| Mapy.cz | geokódování a našeptávač lokality | CZ / EU |

Odesílání e-mailů přes Resend běží v EU (`eu-west-1`). U služeb Google (včetně Gemini) a OpenAI a u účetních/provozních údajů u Resend může docházet k přenosu mimo EHP; v takovém případě se uplatní odpovídající záruky (např. standardní smluvní doložky / Data Privacy Framework) dle smluv s daným poskytovatelem. Text a fotografie inzerátu se k AI odesílají jen za účelem moderace.

---

## 6. Vaše práva a retence účtu

Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost údajů a podání stížnosti u **Úřadu pro ochranu osobních údajů** ([uoou.cz](https://www.uoou.cz)).

### 6.1 Automatická anonymizace neaktivních účtů

Abychom minimalizovali zpracování osobních údajů, účet **automaticky anonymizujeme**, pokud jsou současně splněny obě podmínky:

1. Uživatel se **nepřihlásil déle než 90 dní** (poslední přihlášení dle účtu v autentizační službě).
2. Uživatel **nemá žádný aktivní inzerát**.

**7 dní před anonymizací** zašleme upozornění na e-mail uvedený u účtu. Přihlášení během této lhůty proces anonymizace zastaví. Po anonymizaci jsou identifikační údaje v profilu nahrazeny a autentizační účet je odstraněn — viz [VOP](/vop) §6.

### 6.2 Věk a souhlas dětí

Platforma je určena uživatelům od **15 let**. Při registraci vyžadujeme **prohlášení**, že uživateli je alespoň 15 let; bez tohoto prohlášení účet nezaložíme. Věk technicky neověřujeme (např. dokladem totožnosti). V České republice platí pro souhlas se zpracováním osobních údajů v souvislosti s informační společností věk **15 let** (čl. 8 GDPR ve spojení s národní úpravou). U osob mladších 15 let může souhlas udělit výhradně zákonný zástupce.

---

## 7. Kontakt

Dotazy ke zpracování osobních údajů směřujte na: **[e-mail správce]**

---
