# Příkazy do konzole pro kontrolu měření

*Kuchařka · zapikolou.cz*

Nasazení Pixelu, události a UTM: [MERENI-pixel.md](./MERENI-pixel.md).

Otevřete stránku v **anonymním okně**, DevTools klávesou F12 a záložku **Console**. Příkazy zkopírujte, vložte a stiskněte Enter. Vypnuté adblocky jsou podmínka — jinak měřicí skripty vůbec nenaběhnou.

Chrome může při prvním vložení vypsat varování a chtít `allow pasting` — napište to do konzole, Enter, a teprve potom vkládejte příkazy.

> **Jedno pravidlo**
> Nikdy nemažte celý `localStorage`. Můžou v něm být rozpracované inzeráty nebo uložené UTM. Mažte vždycky jen konkrétní klíč.

## 1 — Souhlas s cookies

### Jaký je aktuální stav souhlasu

```js
JSON.parse(localStorage.getItem('cookie-consent:v2'))
```

- **Před souhlasem** vrátí `null` — klíč ještě neexistuje. To je správně, ne chyba.
- **Po „Přijmout vše"** objekt `{ version: 2, analytics: true, marketing: true, decidedAt: '…' }`.

> `JSON.parse(localStorage['cookie-consent:v2'])` **nespouštějte** — když klíč chybí, Chrome hodí `Uncaught SyntaxError: "undefined" is not valid JSON`. `getItem` vrátí `null` a `JSON.parse(null)` je v pořádku.
>
> Kdyby `getItem` vracelo `null` i po souhlasu, hledejte jiný název klíče:
> ```js
> Object.keys(localStorage).filter(k => /consent|cookie|gdpr/i.test(k))
> ```

### Vynulovat souhlas a nechat lištu zobrazit znovu

```js
localStorage.removeItem('cookie-consent:v2'); location.reload()
```

Tímto začínáte každý nový test.

## 2 — Meta Pixel (Facebook)

### Načetl se pixel?

Příkazy spouštějte **zvlášť** — ne oba najednou. Před souhlasem `fbq` neexistuje, takže druhý řádek spadne na `fbq is not defined` i když první správně vrátí `"undefined"`.

```js
typeof fbq
```

Po souhlasu (až `typeof` vrátí `"function"`):

```js
fbq.version
```

| | |
|---|---|
| **Před souhlasem** | `typeof fbq` → `"undefined"` — jinak pixel běží bez souhlasu, což je chyba |
| **Po souhlasu** | `"function"` a verze typu `2.9.385` |

> `fbq is not defined` u `typeof fbq` **po** souhlasu může znamenat adblock, nebo že se skript ještě nenačetl — zkuste znovu po dvou sekundách. V Network ověřte `connect.facebook.net`.

### Odposlech všech odeslaných událostí

Nejužitečnější příkaz z celé kuchařky. Vypíše každý request na Facebook i s parametry. Spusťte ho hned po souhlasu a pak klikejte po webu.

```js
new PerformanceObserver(l => l.getEntries()
  .filter(e => e.name.includes('facebook.com/tr'))
  .forEach(e => console.log(decodeURIComponent(e.name)))
).observe({entryTypes: ['resource']});
```

> Přežívá jen do reloadu stránky. Po každém načtení ho spusťte **jednou**. Když ho vložíte znovu, každý request se v konzoli objeví dvakrát (dva observery) — to není dvojitá událost v Pixelu. V URL hledejte `ec=` (pořadí eventů); to neroste dvakrát.
>
> Observer hlásí jen **nové** requesty od chvíle, kdy ho spustíte. Události předtím (třeba PageView hned po souhlasu) v něm neuvidíte.

### Ruční test události

```js
fbq('track', 'ViewContent', {content_name: 'test'})
```

Vrátí `undefined` a v odposlechu se objeví řádek. Když projde ručně, ale ne z appky, chybí volání v kódu — ne pixel.

> Testovací události pošlete v anonymním okně, aby se nemíchaly s reálnými daty. Ve Správci událostí je pak poznáte podle `content_name: test`.

### Co v požadavcích hledat

- `id=1774699993535627` — správný pixel
- `ev=PageView` — každá změna URL včetně SPA (`/inzerat/novy`, `/?kategorie=detsky`, …)
- `ev=ViewContent` — **jen** `/prodejte-snadno`, jednou za tab; na detailu inzerátu ani na `/inzerat/novy` se neobjeví
- `ev=InitiateCheckout` — první otevření `/inzerat/novy` v daném tabu; druhé znovuotevření už jen `PageView`
- `ev=Lead` — až po úspěšné publikaci (`?published=`)
- `ev=CompleteRegistration` — až po novém účtu (`?registered=1`)

V URL klidně ignorujte `cdl=API_unavailable` a `coo=false` — interní pole Meta, ne chyba nasazení. `pmd[title]` může o jednu stránku zaostávat (SPA).

> Dvě věci, které **nejsou** vaše události:
> `noscript=1` — fallback obrázek, ne JavaScript. Když vidíte jen tohle, pixel neposílá nic.
> `ev=SubscribedButtonClick` — automatická událost, kterou Meta pálí sama. Znamená, že pixel žije, ale vlastní události neověřuje.

## 3 — Google Analytics 4

GTM smí naběhnout **před** souhlasem — to není chyba. `gtag` je jen stub + Consent Mode. Měření cookies se spustí až po `consent update`. Pixel (`fbq`) je naopak zakázaný, dokud není marketing.

Očekávaná ID: container **`GTM-WGLNJRNK`**, GA4 property **`G-CT51VVNP9C`**.

### Běží GTM?

```js
typeof gtag
window.dataLayer
```

`typeof gtag` má být `"function"` i **před** kliknutím na lištu. `dataLayer` je pole všeho, co GTM dostal.

Typický obsah **před** souhlasem (lišta ještě visí):

| Index | Co to je |
|---|---|
| `['consent', 'default', {…}]` | výchozí stav — `analytics_storage` a `ad_storage` musí být `"denied"` |
| `{ event: 'gtm.js' }` | načtení kontejneru |
| `{ event: 'gtm.dom' }` / `{ event: 'gtm.load' }` | interní GTM, ignorujte |
| `{ event: 'gtm.historyChange-v2' }` | SPA navigace |

Po **Přijmout vše** přibude `gtm.click` a `['consent', 'update', {…}]` s `"granted"`.

```js
[...dataLayer].filter(x => x && x[0] === 'consent')
```

Rozklikněte třetí prvek (`[2]`). Před volbou `denied`, po Přijmout vše `granted` u `analytics_storage` i `ad_storage`.

> `Jen analytika` → analytics granted, ad_* denied. `Pouze nezbytné` → všechno denied, žádný `update` s granted.

### Které měřicí ID se používá

`gtag('config', …)` v dataLayer **nebude** — GA4 tahá GTM, ne přímý config z appky.

```js
performance.getEntriesByType('resource').map(e => e.name)
  .filter(u => /gtm\.js|gtag\/js|G-|\/g\/collect/.test(u))
```

Hledejte `id=GTM-WGLNJRNK` a `id=G-CT51VVNP9C`. ID je i ve `[[FunctionLocation]]` u `dataLayer.push` (`js?id=G-CT51VVNP9C`).

### Odposlech událostí GA4

Spusťte **před** kliknutím na lištu, ať vidíte, jestli se před souhlasem něco posílá.

```js
new PerformanceObserver(l => l.getEntries()
  .filter(e => /google-analytics|analytics\.google|\/g\/collect|gtag\/js/.test(e.name))
  .forEach(e => console.log(decodeURIComponent(e.name)))
).observe({entryTypes: ['resource']});
```

V URL hledejte `en=` (název události) a `gcs=` (stav souhlasu). Před souhlasem nesmí odcházet plné hit s cookies; po Přijmout vše ano.

### Konverze publikace (`generate_lead`)

Po publikaci inzerátu (stejný moment jako Pixel `Lead`):

```js
[...dataLayer].filter(x => x && x.event === 'generate_lead')
```

Má tam být **jeden** objekt s `content_category` a UTM. V GTM Preview Custom Event `generate_lead`; v GA4 **Admin → Events → Mark as conversion**. Klik Publikovat tohle nespouští.

### Ruční test

Až po souhlasu:

```js
gtag('event', 'test_udalost', {test: true})
```

V GA4 se zobrazí v **Reports → Realtime**, obvykle do půl minuty. Detailní ladění dělejte v **Admin → DebugView**.

## 4 — UTM parametry

### Uložily se UTM z reklamy?

```js
Object.entries(localStorage).filter(([k]) => /utm|attrib|campaign/i.test(k))
```

Tohle je nejdůležitější test celého měření. Postup: otevřete stránku s UTM v adrese, projděte celý flow **včetně přihlášení přes Google**, a pak tento příkaz spusťte znovu. Parametry tam musí pořád být — jinak se konverze nespáruje s variantou A/B testu a test nemá výsledek.

> Testovací adresa:
> `?utm_source=facebook&utm_medium=cpc&utm_campaign=brno-rozjezd&utm_content=sada-a`

## 5 — Kompletní scénář testu

1. Anonymní okno, vypnuté adblocky, F12 → Console
2. Otevřít landing page **s UTM parametry** v adrese
3. `typeof fbq` musí být **undefined** — souhlas ještě není
4. Kliknout **Přijmout vše**, pak spustit odposlech (bod 2 kuchařky)
5. Projít flow: landing → `/inzerat/novy` → registrace → publikace
6. Zkontrolovat, že přišly **všechny** události a `ev=Lead` **právě jednou**, s UTM parametry

> **Dvojitý Lead v dev režimu** nemusí být chyba — React StrictMode volá efekty dvakrát. Po nasazení na produkci ověřte znovu; tam už se dvojitě pálit nesmí.

## 6 — Když něco nefunguje

| Co vidíte | Nejpravděpodobnější příčina |
|---|---|
| `"undefined" is not valid JSON` u souhlasu | Klíč ještě není — použijte `getItem`, ne `localStorage['…']` |
| `fbq is not defined` u `fbq.version` před souhlasem | Čekané. Nejdřív `typeof fbq` |
| Stejný `ev=` dvakrát ve stejném čase | Observer jste spustili dvakrát. Podívejte se na `ec=` |
| `typeof gtag` je `"function"` před souhlasem | Správně — Consent Mode. Špatně by bylo, kdyby `fbq` existoval před souhlasem |
| `dataLayer.filter(x => x[0] === 'config')` je prázdné | GA4 jde přes GTM, config v dataLayer není. Hledejte `G-CT51VVNP9C` v Network |
| `fbq is not defined` i po souhlasu | Adblock, nebo se skript načítá pomaleji — zkuste příkaz po dvou sekundách znovu |
| První volání spadne, druhé projde | Pixel se inicializuje asynchronně. Události volané dřív se tiše ztrácejí — kód potřebuje frontu |
| Jen `noscript=1` v Network | JavaScriptová část pixelu neposílá nic. Volání `fbq('track', ...)` v kódu chybí nebo propadá |
| PageView jen při prvním vstupu | Není navázaný na změnu routy — v Next.js se stránka znovu nenačítá |
| UTM po přihlášení zmizely | Neukládají se do localStorage, jen se čtou z adresy. Konverze se pak nespáruje s kampaní |

## Ještě jednodušší cesta

Pro běžnou kontrolu vám bez konzole stačí dvě věci: rozšíření **Meta Pixel Helper** do Chromu, které rovnou vypíše, jaké události stránka posílá, a v DevTools záložka **Network** s filtrem `tr?`. Konzoli otevřete, až když něco nehraje a potřebujete vědět proč.
