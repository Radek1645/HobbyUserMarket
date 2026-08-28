# DPA Checklist — zpracovatelé osobních údajů

**Projekt:** zaPikolou.cz (HobbyUserMarket)
**Vytvořeno:** 2026-08-27
**Zdroj seznamu zpracovatelů:** [`ochrana-osobnich-udaju-fo.md`](./ochrana-osobnich-udaju-fo.md) §5.1 + [`README.md`](./README.md) P33
**Stav:** rozpracováno — první průchod, doplňujeme postupně

---

## TL;DR

GDPR (čl. 28 odst. 3) vyžaduje písemnou (i elektronickou) smlouvu o zpracování s každým zpracovatelem. U většiny SaaS nástrojů níže je DPA "samoobslužná" — stane se součástí smlouvy automaticky přijetím jejich Terms of Service, stažení PDF je hlavně pro vlastní evidenci. U některých (Google, Meta, OpenAI) je potřeba DPA výslovně odsouhlasit/odkliknout/podepsat v administraci účtu — tam samotné PDF nestačí. Lokální uložení stažených DPA v této složce je jako důkaz dostatečné — důležité je mít správnou, aktuální verzi vázanou na váš konkrétní účet.

Řazeno dle priority: **A = zpracovatelé s přenosem mimo EHP** (vyšší riziko — čl. 44 a násl. vyžaduje záruky navíc) → **B = zpracovatelé v EU/EHP nebo nejasný status přenosu**.

Legenda stavu: ✅ Hotovo · ❌ Chybí / otevřený úkol · ❓ Nutno ověřit (stav neznám jistě) · ⏸ Odloženo (vědomé rozhodnutí počkat) · ⏳ Rozpracováno (hlavní riziko vyřešeno, zbývá dílčí krok)

**Sloupec "Datum"** = kdy byl řádek naposledy ověřen/aktualizován — použij ho při příští pravidelné revizi (doporučuju alespoň jednou ročně zkontrolovat, jestli se verze DPA nezměnily).

---

## Checklist

| ID | Zpracovatel | Účel | Přenos mimo EHP | Stav | Datum | Odkaz / další krok |
|----|---|---|---|---|---|---|
| A-01 | Sightengine (Kozelo SAS) | Předfiltrace fotek (NSFW) | Ano (mimo EHP možné) | ⏸ Odloženo | 2026-08-27 | Free tier nekryje komerční použití ani DPA (viz jejich terms — obojí platí jen na placeném plánu). Starter plán $29/měsíc (10 000 operací/měsíc, +$0,002/operace navíc) — rozhodnutí o upgradu vědomě odloženo (cena). Až se vyřeší: podepsat/vrátit DPA na **support@sightengine.com**, aktuální znění: [PDF, verze 2026-04-07](https://s3-eu-west-1.amazonaws.com/static.sightengine.com/legal/20260407-dpa.pdf) |
| A-02 | Google (Gemini) | AI moderace textu/fotek inzerátů | Ano (typicky USA) | ✅ Hotovo | 2026-08-27 | Ověřeno v kódu (`gemini.ts`): voláte přímý Gemini API (`generativelanguage.googleapis.com`), ne Vertex AI. Potvrzeno: `GEMINI_API_KEY` běží pod "Default Gemini Project" s aktivním Cloud Billing účtem (Paid Tier 1) → splněna podmínka "Paid Service", Google tedy nesmí používat vstupy/výstupy k vylepšování modelů. Uloženo jako `DPA/google-gemini-dpa.pdf` — zdroj: [business.safety.google/processorterms](https://business.safety.google/processorterms/), "Data Processing Addendum for Products Where Google is a Data Processor" (odkaz potvrzený přímo z aktuálního znění `aistudio.google.com/docs/terms`). (Pozn.: ostatní data mimo prompty/odpovědi — účet, fakturace, usage metriky — se řídí zvlášť [Google Controller-Controller Data Protection Terms](https://business.safety.google/controllerterms/), tam jde o jiný typ vztahu, ne o zpracovatele.) |
| A-03 | OpenAI | Záložní AI moderace | Ano (typicky USA) | ✅ Hotovo | 2026-08-27 | Jste na placeném API účtu (potvrzeno). Ověřeno v kódu (`openai.ts`): voláte standardní `api.openai.com/v1/chat/completions` s Bearer klíčem — to je Platform API, ne ChatGPT. Netrénování na datech je výchozí chování pro všechny API účty od 1.3.2023, bez opt-in: *"data sent to the OpenAI API is not used to train or improve OpenAI models"* ([developers.openai.com/api/docs/guides/your-data](https://developers.openai.com/api/docs/guides/your-data)). DPA je samoobslužná (stejný princip jako Supabase/Vercel/Cloudflare) — přímo v PDF: *"By clicking 'I agree,' accepting the Order Form, or using the Services, Customer agrees to this Agreement."* Uloženo jako `DPA/openai-dpa.pdf` z [openai.com/policies/data-processing-addendum](https://openai.com/policies/data-processing-addendum/). Starší [Google Form odkaz](https://docs.google.com/forms/d/e/1FAIpQLSdh3dA5PMFA1mZIwMSEtnpJ5RX44mW2JHTL2kejhVhzRVD-DQ/viewform) není potřeba, ignorovat. |
| A-04 | Meta Platforms | Meta Pixel (marketingové měření) | Ano (typicky USA) | ✅ Hotovo | 2026-08-27 | V Business Manageru jsme nenašli žádné samostatné tlačítko "přijmout" (ani v Business Info, ani jinde) — Meta Business Tools Terms (kam DPA patří) se podle jejich vlastní formulace vztahují automaticky na každého, kdo jejich nástroje (Pixel, Business Manager) používá, stejný self-serve princip jako Supabase/Vercel/Cloudflare. Uloženo: `DPA/meta-data-processing-terms.pdf` ([facebook.com/legal/terms/dataprocessing](https://www.facebook.com/legal/terms/dataprocessing)) + `DPA/meta-business-tools-terms.pdf` ([facebook.com/legal/technology_terms](https://www.facebook.com/legal/technology_terms)). |
| A-05 | Resend | Transakční e-maily (účetní/provozní údaje mohou být mimo EHP) | Částečně | ✅ Hotovo | 2026-07-20 | Staženo: [`resend-dpa-signed.pdf`](./DPA/resend-dpa-signed.pdf) (DocuSign, předpodepsáno Resendem, závazné bez countersign, zahrnuje SCC). |
| B-01 | Supabase | DB, autentizace, úložiště fotek | Ne (EU, `eu-west-1`) | ✅ Hotovo | 2026-08-27 | Uloženo jako `DPA/supabase-dpa.pdf` (self-serve, "Version 1 — August 1, 2026", automaticky součástí ToS, bez podpisu) + `DPA/supabase-tia.pdf` (Transfer Impact Assessment). |
| B-02 | Vercel | Hosting (Serverless Functions) | Ne (EU, Dublin) | ✅ Hotovo | 2026-08-27 | Uloženo jako `DPA/vercel-dpa.pdf` (Ctrl+P z [vercel.com/legal/dpa](https://vercel.com/legal/dpa) — export vypadá vizuálně ošklivě, ale text je čitelný/prohledatelný, což je pro evidenci důležité, ne vzhled). Platí od přechodu na Pro plán (Hobby DPA nekryje). |
| B-03 | Cloudflare | DNS, Email Routing, Turnstile | Nejasné (dle služby) | ✅ Hotovo | 2026-08-27 | Uloženo jako `DPA/cloudflare-dpa.pdf`. Vztahuje se i na free tier (DPA cituje "Self-Serve Subscription Agreement", pod kterým běží i bezplatný účet — na rozdíl od Vercelu tu není omezení jen na placené tarify). |
| B-04 | Google (GA4/GTM) | Analytika webu | Nejasné (dle služby) | ✅ Hotovo | 2026-08-27 | Nalezeno v GA4 Admin → Account Settings → Údaje o účtu: "Podmínky zpracování dat pro tento účet byly přijaty 13. července 2026." Dodatek uložen jako `DPA/google-analytics-dpa.pdf` ([privacy.google.com/businesses/processorterms](https://privacy.google.com/businesses/processorterms)). Správa detailů (kontakty, právní subjekt): [marketingplatform.google.com/gdpr](https://marketingplatform.google.com/gdpr/?key=401038363&product=1). |
| B-05 | Google (OAuth login) | Přihlášení přes Google | Nejasné | ❓ Nutno ověřit | 2026-08-27 | Ověřeno dvěma koly hledání (27.08.2026) — nikde jsem nenašel explicitní vyjasnění, jestli je Google u "Sign in with Google" zpracovatel (vyžaduje DPA) nebo spíš nezávislý správce autentizačních dat. Google referuje jen obecně na [Google APIs Terms of Service](https://developers.google.com/terms) a [Google API Services User Data Policy](https://developers.google.com/identity/protocols/oauth2/policies) — Google Auth Platform v Cloud Console (`hobbyMarket01`) k tomu nic konkrétního neukazuje, jen bezpečnostní nastavení (session/auth claims), žádnou DPA sekci. Zůstává jako otázka pro právníka — dál to nebudu domýšlet. |
| B-06 | Mapy.cz (Seznam.cz) | Geokódování, našeptávač lokality | Ne (CZ/EU) | ⏳ Rozpracováno | 2026-08-28 | **Osobní údaje protékají, DPA je potřeba — architektura teď opravená, DPA samotná ještě chybí.** Vztah zůstává: **zaPikolou = správce** vůči svým uživatelům, **Seznam.cz = zpracovatel** (ne naopak). Do 28.08.2026 volal `api.mapy.cz` přímo prohlížeč koncového uživatele (klíč byl v `NEXT_PUBLIC_MAPY_CZ_API_KEY`, tedy v JS bundlu) — Seznam tak viděl IP adresu konkrétního návštěvníka u každého požadavku. **Opraveno (28.08.2026):** volání přesunuto na server — `src/lib/mapy/client.ts` teď volá jen naše vlastní `/api/mapy/suggest` a `/api/mapy/rgeocode` (Next.js API routes), teprve ty server-side kontaktují `api.mapy.cz` s `MAPY_CZ_API_KEY` (bez `NEXT_PUBLIC_` prefixu, mimo JS bundle). Seznam už nevidí IP jednotlivých uživatelů, jen IP našeho serveru. `LocationInput.tsx` i `VisitorLocationProvider.tsx` (GPS v headeru) jdou přes stejnou proxy, beze změny chování. Nové routy mají rate limit (60 suggest / 20 rgeocode za hodinu na IP, hash+salt, fail-closed) a signal-forwarding (zrušení požadavku v prohlížeči zruší i dotaz na Mapy.cz). **Co se nezměnilo a proč DPA pořád chybí:** text adresy, který uživatel píše, a GPS souřadnice pořád chodí na Mapy.cz — jen teď přes náš server, ne přímo z prohlížeče. To je podstata funkce (bez toho by geokódování nefungovalo), takže osobní údaje (adresa/souřadnice) tam dál protékají a vztah zpracovatele trvá. Na [developer.mapy.com/cs/smluvni-ujednani-dev](https://developer.mapy.com/cs/smluvni-ujednani-dev/) samoobslužná DPA k dispozici není (ověřeno 27.08.2026). Další krok: napsat na [developer.mapy.com/cs/kontakt](https://developer.mapy.com/cs/kontakt/) s žádostí o DPA — popis toku dat teď stačí zúžit na "adresní dotazy + GPS souřadnice ze serveru", IP koncových uživatelů už není součástí. |

---

## Jak s DPA nakládat

- GDPR nevyžaduje konkrétní úložný systém — lokální složka (tahle) jako důkaz stačí.
- U položek se stavem ✅ / self-serve je stažení PDF hlavně pro vlastní evidenci — smlouva platí automaticky přijetím ToS dané služby, DPA jen dokládá její obsah.
- U položek, kde je potřeba něco odkliknout nebo podepsat v administraci (typicky Meta, Google Analytics, OpenAI), samotné stažení obecného PDF z webu nestačí — je potřeba to potvrdit/podepsat přímo v účtu.
- Sloupec "Datum" u každé položky ukazuje, kdy jsme ji naposledy ověřili — použij ho jako vodítko pro pravidelnou revizi (doporučuju alespoň jednou ročně).

## Otevřené otázky (nevím jistě, chce to ověřit / případně právníka)

- Jestli se na Google OAuth login vůbec vztahuje samostatná DPA, nebo je to mimo klasický vztah zpracovatele (B-05).

---

*Poznámka: soubor vznikl 27.08.2026 na základě aktuálního znění [`ochrana-osobnich-udaju-fo.md`](./ochrana-osobnich-udaju-fo.md) §5.1 a otevřeného úkolu v [`README.md`](./README.md) P33.*
