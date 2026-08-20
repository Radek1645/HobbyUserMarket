# Zásady ochrany osobních údajů

**Platforma:** zaPikolou.cz  
**Verze:** 1.5-fo · **Datum účinnosti:** 20.08.2026  
**Správce:** Radek Horák, fyzická osoba · **Kontakt pro GDPR:** info@zapikolou.cz · datová schránka: fxetq2k

---

## TL;DR — v čem je pointa

Vaše údaje (e-mail, přezdívka) potřebujeme k provozu účtu a inzerce. Občanské jméno ani telefon v profilu nevyžadujeme. Bez registrace můžete připravit koncept inzerátu v prohlížeči; zveřejnění až po založení účtu. IP u poptávek anonymizujeme do 7 dnů. Neaktivní účty bez přihlášení déle než 90 dní a bez aktivního inzerátu automaticky anonymizujeme (s předchozím upozorněním). Citlivé údaje nikomu neprodáváme.

---

## 1. Kdo zpracovává údaje a proč

Správcem osobních údajů je Provozovatel platformy zaPikolou.cz. Zpracováváme údaje v rozsahu nezbytném pro provoz účtu, publikaci inzerátů, přípravu konceptu inzerátu před registrací, bezpečnost komunity a — s vaším souhlasem — pro marketing a analytiku.

---

## 2. Tabulka zpracování osobních údajů

| Účel zpracování | Kategorie údajů | Právní základ dle GDPR | Doba uchování |
|-----------------|-----------------|------------------------|---------------|
| Správa účtu a inzerce | E-mail, přezdívka (nickname), text inzerátu, fotografie; u firemního profilu název firmy (a IČO, pokud je uvedeno); volitelně kontaktní telefon u konkrétního inzerátu — jen pokud ho inzerent sám vyplní | Plnění smlouvy (čl. 6 odst. 1 písm. b) | Po dobu existence aktivního účtu; po vypršení inzerát skryjeme (archivace) a uchováme nejvýše **365 dní od založení**, poté soft-delete (viz VOP a §6.1) |
| Veřejný profil zadavatele | Veřejný nickname (a případně název firmy), odkaz na zveřejněné inzeráty | Plnění smlouvy (čl. 6 odst. 1 písm. b) | Po dobu existence účtu; po anonymizaci profilu již není veřejně dostupný |
| Příprava inzerátu před registrací (guest draft) | Text a fotografie konceptu, technický identifikátor návštěvníka, IP (rate-limit), dočasné soubory ve staging úložišti | Oprávněný zájem — umožnit přípravu inzerátu a ochrana před zneužitím (čl. 6 odst. 1 písm. f); po registraci plnění smlouvy | Koncept v prohlížeči nejvýše **24 hodin**; staging soubory dočasně do dokončení registrace a claimu, nebo do uplynutí provozní lhůty úklidu; rate-limit záznamy dle provozní potřeby |
| Automatická anonymizace neaktivních účtů | Identifikační a kontaktní údaje v profilu | Oprávněný zájem — minimalizace údajů (čl. 6 odst. 1 písm. f) | Spuštění po **90 dnech** od posledního přihlášení, pokud uživatel nemá aktivní inzerát; viz §6.1 |
| Novinky a tipy e-mailem (připravujeme) | E-mailová adresa | Souhlas (čl. 6 odst. 1 písm. a) | Souhlas můžeme uložit při registraci; obchodní sdělení zatím nezasíláme. Po spuštění do odvolání souhlasu — viz [Marketingový souhlas](/marketingovy-souhlas) |
| Analytika webu (GA4) | Technické identifikátory, agregované údaje o chování na webu | Souhlas (čl. 6 odst. 1 písm. a) — aktivace až po souhlasu v cookie liště | Dle nastavení nástroje a do odvolání souhlasu |
| Marketing / Meta Pixel | Technické identifikátory, události (např. dokončení registrace, publikace inzerátu) | Souhlas (čl. 6 odst. 1 písm. a) — aktivace až po marketingovém souhlasu v cookie liště | Dle nastavení nástroje a do odvolání souhlasu |
| Provozní a bezpečnostní záznamy | IP u poptávek, technické identifikátory | Oprávněný zájem (čl. 6 odst. 1 písm. f) | IP u poptávek anonymizována do 7 dnů (§3.2); logy hostingu dle poskytovatele |
| Hard-stop / bezpečnostní evidence (CSAM gate, NSFW) | E-mail na blacklistu, evidence zamítnutí, snapshoty fotek v privátním úložišti | Oprávněný zájem / plnění právních povinností (čl. 6 odst. 1 písm. f / c) | Evidence a historie odebraných blacklist záznamů nejvýše **24 měsíců**; aktivní blacklist po dobu trvání opatření |

---

## 3. Technické zabezpečení

### 3.1 Šifrování

Veškerý přenos dat mezi vaším prohlížečem a našimi servery je šifrován pomocí protokolu **HTTPS/TLS**.

### 3.2 Anonymizace IP adres

U poptávek ukládáme IP adresu v databázi z bezpečnostních a anti-spam důvodů. **Nejpozději do 7 dnů** ji automaticky anonymizujeme zkrácením (u IPv4 na tvar znemožňující identifikaci konkrétního zařízení, např. `x.x.x.0`). Tato automatická anonymizace se vztahuje na záznamy poptávek v naší databázi; provozní logy hostingové platformy (např. Vercel) řídí příslušný poskytovatel dle vlastní retence.

### 3.3 Příprava inzerátu bez účtu

Bez přihlášení můžete na stránce vytvoření inzerátu připravit **koncept** (text, fotografie, náhled automatické kontroly). Koncept ukládáme v prohlížeči (local storage, nejvýše 24 hodin). Pro rate-limiting a staging používáme technický cookie identifikátor návštěvníka. Fotografie se dočasně ukládají ve staging úložišti a text i fotografie mohou být odeslány ke kontrole zpracovatelům AI / předfiltrace (viz §5.1). **Zveřejnění** inzerátu je možné až po registraci a přihlášení; po úspěšném claimu se koncept a staging přesunou pod účet uživatele. Podrobnosti o cookies viz [Zásady používání cookies](/cookies).

---

## 4. Analytika a cookies

Analytické měření (Google Analytics 4 prostřednictvím Google Tag Manageru) a případně marketingové měření (**Meta Pixel**) aktivujeme **až po vašem souhlasu** v cookie liště (GTM consent mode / samostatný marketingový souhlas). Podrobnosti o cookies viz [Zásady používání cookies](/cookies).

Pokud se u konkrétního analytického nebo marketingového nástroje uplatní **společné správcovství** dle GDPR, vystupuje Provozovatel společně s poskytovatelem daného nástroje; Provozovatel odpovídá za získání souhlasu prostřednictvím cookie lišty.

---

## 5. Příjemci a předávání údajů

Údaje zpracováváme prostřednictvím smluvních zpracovatelů. Údaje nepředáváme třetím stranám za účelem prodeje. Aktuální seznam hlavních zpracovatelů je k dispozici na vyžádání na kontaktním e-mailu správce.

### 5.1 Hlavní zpracovatelé

| Zpracovatel | Účel | Region |
|-------------|------|--------|
| Supabase | databáze, autentizace, úložiště fotografií (včetně dočasného stagingu) | EU — West EU (Ireland), `eu-west-1` |
| Vercel | hosting webové aplikace (Serverless Functions) | EU — Dublin (`dub1` / `eu-west-1`) |
| Resend | transakční e-maily (notifikace, poptávky) | EU — Ireland (`eu-west-1`), doména `zapikolou.cz` (ověřeno v Resend dashboardu 2026-07-19); účetní/provozní údaje poskytovatele mohou být mimo EHP — DPA a SCC dle smlouvy s Resend |
| Google | přihlášení přes Google (OAuth) | dle služby Google |
| Google (Gemini) | automatická moderace textu a fotografií inzerátů (včetně náhledu před registrací) | přenos mimo EHP (typicky USA) — DPA / SCC dle smlouvy s Google |
| Sightengine (Kozelo SAS) | předfiltrace fotografií (detekce nahoty / nevhodného obsahu) před AI moderací | výchozí zpracování může probíhat ve více regionech (včetně mimo EHP); omezení regionu typicky Enterprise — DPA dle smlouvy se Sightengine; provozovatel: Francie |
| OpenAI | záložní AI moderace (pokud je aktivní) | přenos mimo EHP (typicky USA) — DPA / SCC dle smlouvy s OpenAI |
| Google | analytika webu (GA4 / GTM) — jen po souhlasu v cookie liště | dle služby Google |
| Meta Platforms | marketingové měření (Meta Pixel) — jen po marketingovém souhlasu v cookie liště | přenos mimo EHP (typicky USA) — DPA / SCC / Data Privacy Framework dle smlouvy s Meta |
| Cloudflare | DNS zóny `zapikolou.cz`; příjem `info@zapikolou.cz` (Email Routing — přeposílání, ne schránka); ochrana proti zneužití (Turnstile) u guest / anonymních akcí | dle služby Cloudflare |
| Mapy.cz | geokódování a našeptávač lokality | CZ / EU |

Odesílání e-mailů webu přes Resend běží v EU (`eu-west-1`). Příchozí pošta na `info@zapikolou.cz` se doručuje přes Cloudflare Email Routing. U služeb Google (včetně Gemini), Sightengine, OpenAI, Meta, Cloudflare a u účetních/provozních údajů u Resend může docházet k přenosu mimo EHP; v takovém případě se uplatní odpovídající záruky (např. standardní smluvní doložky / Data Privacy Framework) dle smluv s daným poskytovatelem. Text a fotografie inzerátu se k moderaci (včetně předfiltrace fotografií a náhledu před registrací) odesílají jen za tímto účelem.

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

Dotazy ke zpracování osobních údajů směřujte na: **info@zapikolou.cz** · datová schránka: **fxetq2k**

---
