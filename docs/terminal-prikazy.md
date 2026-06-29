# Přehled příkazů pro terminál

Rychlá reference nejčastějších příkazů pro práci v terminálu — vývoj Next.js aplikace, navigace v souborech a řešení běžných problémů.

---

## Obecný flow: lokální vývoj

Běžný postup při práci na projektu:

```bash
npm install
npm run dev
```

| Krok | Co dělá |
|------|---------|
| `npm install` | Nainstaluje závislosti z `package.json` (po klonu repa nebo po změně balíčků). |
| `npm run dev` | Spustí vývojový server Next.js na [http://localhost:3000](http://localhost:3000). |
| `Ctrl + C` | Ukončí běžící proces v terminálu (např. dev server). |

Po dokončení úprav ověř build a lint před commitem:

```bash
npm run lint
npm run build
```

---

## Reference příkazů

### Projekt (npm / Next.js)

| Příkaz | Vysvětlení / Co to dělá | Příklad |
|--------|-------------------------|---------|
| `npm install` | Nainstaluje všechny závislosti projektu. | `npm install` |
| `npm install <balíček>` | Přidá novou závislost do projektu. | `npm install date-fns` |
| `npm install -D <balíček>` | Přidá vývojovou závislost (devDependency). | `npm install -D @types/node` |
| `npm run dev` | Spustí lokální vývojový server s hot reloadem. | `npm run dev` |
| `npm run build` | Sestaví produkční verzi aplikace — ověří, že projekt kompiluje. | `npm run build` |
| `npm run start` | Spustí již sestavenou produkční verzi (po `npm run build`). | `npm run start` |
| `npm run lint` | Spustí ESLint a zkontroluje kód podle pravidel projektu. | `npm run lint` |
| `npx <příkaz>` | Spustí balíček bez globální instalace. | `npx eslint src/` |
| `node -v` | Zobrazí verzi Node.js. | `node -v` |
| `npm -v` | Zobrazí verzi npm. | `npm -v` |

### Navigace a soubory

| Příkaz | Vysvětlení / Co to dělá | Příklad |
|--------|-------------------------|---------|
| `pwd` | Zobrazí aktuální pracovní složku. | `pwd` |
| `cd <složka>` | Přejde do zadané složky. | `cd src/app` |
| `cd ..` | Přejde o jednu úroveň výš. | `cd ..` |
| `cd ~` | Přejde do domovské složky uživatele. | `cd ~` |
| `ls` | Vypíše soubory a složky v aktuálním adresáři. | `ls` |
| `ls -la` | Vypíše vše včetně skrytých souborů a detailů. | `ls -la` |
| `mkdir <název>` | Vytvoří novou složku. | `mkdir docs` |
| `mkdir -p <cesta>` | Vytvoří vnořenou složku (i když mezilehlé neexistují). | `mkdir -p src/components/ui` |
| `cp <zdroj> <cíl>` | Zkopíruje soubor. | `cp .env.example .env.local` |
| `cp -r <zdroj> <cíl>` | Zkopíruje složku rekurzivně. | `cp -r backup/ src/` |
| `mv <zdroj> <cíl>` | Přesune nebo přejmenuje soubor/složku. | `mv old.tsx new.tsx` |
| `rm <soubor>` | Smaže soubor. | `rm temp.txt` |
| `rm -rf <složka>` | Smaže složku včetně obsahu. **Destruktivní operace.** | `rm -rf .next` |
| `cat <soubor>` | Vypíše obsah souboru do terminálu. | `cat package.json` |
| `head -n <počet> <soubor>` | Vypíše prvních N řádků souboru. | `head -n 20 README.md` |
| `tail -n <počet> <soubor>` | Vypíše posledních N řádků souboru. | `tail -n 50 .env.local` |
| `clear` | Vyčistí obrazovku terminálu. | `clear` |

### Vyhledávání v kódu

| Příkaz | Vysvětlení / Co to dělá | Příklad |
|--------|-------------------------|---------|
| `grep -r "<text>" <složka>` | Rekurzivně prohledá soubory a vypíše řádky s daným textem. | `grep -r "supabase" src/` |
| `grep -ri "<text>" <složka>` | Stejné jako výše, ale bez rozlišení velikosti písmen. | `grep -ri "useclient" src/` |
| `grep -r --include="*.tsx" "<text>" .` | Prohledá jen soubory s danou příponou. | `grep -r --include="*.tsx" "useState" src/` |
| `find . -name "<vzor>"` | Najde soubory podle názvu. | `find . -name "*.sql"` |
| `rg "<text>"` | Rychlé vyhledávání přes ripgrep (běžně v Cursoru). | `rg "nearby_posts" supabase/` |
| `rg -l "<text>"` | Vypíše jen názvy souborů, kde se text vyskytuje. | `rg -l "createClient" src/` |

### Procesy a porty

| Příkaz | Vysvětlení / Co to dělá | Příklad |
|--------|-------------------------|---------|
| `Ctrl + C` | Ukončí běžící příkaz (např. zaseklý dev server). | — |
| `Ctrl + Z` | Pozastaví proces na pozadí (bash). | — |
| `jobs` | Vypíše pozastavené úlohy na pozadí. | `jobs` |
| `fg` | Vrátí pozastavený proces do popředí. | `fg` |
| `lsof -i :3000` | Zjistí, který proces drží port 3000 (macOS/Linux). | `lsof -i :3000` |
| `kill -9 <PID>` | Násilně ukončí proces podle ID (macOS/Linux). | `kill -9 12345` |

> **Windows (PowerShell):** místo `lsof` použij `Get-NetTCPConnection -LocalPort 3000` a místo `kill` pak `Stop-Process -Id <PID> -Force`.

### Proměnné prostředí a síť

| Příkaz | Vysvětlení / Co to dělá | Příklad |
|--------|-------------------------|---------|
| `echo $VAR` | Vypíše hodnotu proměnné prostředí (bash). | `echo $PATH` |
| `export VAR=hodnota` | Nastaví proměnnou pro aktuální relaci (bash). | `export NODE_ENV=development` |
| `curl <url>` | Otestuje HTTP odpověď serveru. | `curl http://localhost:3000` |
| `curl -I <url>` | Zobrazí jen HTTP hlavičky odpovědi. | `curl -I http://localhost:3000` |

> **Windows (PowerShell):** proměnné čti/nastavuj jako `$env:VAR` a `$env:VAR = "hodnota"`.

### Užitečné pro tento projekt

| Příkaz | Vysvětlení / Co to dělá | Příklad |
|--------|-------------------------|---------|
| `rm -rf .next` | Smaže cache Next.js — pomůže při podivných chybách buildu. | `rm -rf .next` |
| `rm -rf node_modules && npm install` | Čistá reinstalace závislostí. | `rm -rf node_modules && npm install` |
| `cp .env.example .env.local` | Vytvoří lokální env soubor ze šablony (pokud existuje). | `cp .env.example .env.local` |
| `cursor .` | Otevře aktuální složku v Cursoru. | `cursor .` |
| `code .` | Otevře aktuální složku ve VS Code. | `code .` |

Před prvním `npm run dev` zkontroluj, že máš vyplněný `.env.local` se Supabase klíči — viz `README.md`.
