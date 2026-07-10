# Přehled Git příkazů

Rychlá reference nejčastějších příkazů pro práci s repozitářem.

---

## Obecný flow: push na GitHub

Běžný postup po dokončení úprav — tři příkazy:

```bash
git add .
git commit -m "feat: implement jobs category with no-db CV attachment logic"
git push origin main
```

| Krok | Co dělá |
|------|---------|
| `git add .` | Připraví všechny změněné soubory k commitu. |
| `git commit -m "..."` | Uloží snapshot s popisem změny. |
| `git push origin main` | Odešle commit na vzdálený repozitář (větev `main`). |

Před `git add .` si občas ověř `git status` — ať omylem necommitneš `.env` nebo jiný citlivý soubor. Commit zprávu piš stručně a výstižně (typ + co se změnilo).

**Související:** [`terminal-prikazy.md`](./terminal-prikazy.md) · [`supabase-prikazy.md`](./supabase-prikazy.md)

---

## Reference příkazů

| Příkaz | Vysvětlení / Co to dělá | Příklad |
|--------|-------------------------|---------|
| `git add .` | Připraví všechny změněné soubory k commitu. | `git add .` |
| `git commit -m "<zpráva>"` | Uloží připravené změny jako nový commit s popisem. | `git commit -m "feat: přidej kategorii práce"` |
| `git push origin main` | Odešle lokální commity na vzdálený repozitář (větev `main`). | `git push origin main` |
| `git status` | Zobrazí aktuální stav: změněné, smazané a nesledované (untracked) soubory. | `git status` |
| `git diff` | Ukáže konkrétní změny v řádcích kódu, které ještě nejsou připravené k commitu (unstaged). | `git diff` |
| `git diff --staged` | Ukáže změny v souborech, které už máš připravené k commitu (staged via `git add`). | `git diff --staged` |
| `git ls-files \| grep <text>` | Prohledá index sledovaných souborů. Ideální na ověření, jestli v Gitu nevisí utajovaný soubor. | `git ls-files \| grep .env` |
| `git log -S "<text>" -p` | Prohledá historii commitů a ukáže řádky, kde se daný text (např. API klíč) přidal nebo smazal. | `git log -S "re_" -p` |
| `git log --oneline -n <počet>` | Zobrazí zkrácenou historii posledních X commitů, kde každý commit zabírá přesně jeden řádek. | `git log --oneline -n 5` |
| `git rm --cached <soubor>` | Odstraní soubor z indexu Gitu (přestane ho sledovat), ale fyzicky ho nechá na tvém disku. | `git rm --cached .env.local` |
| `git restore <soubor>` | Zahodí lokální úpravy v souboru a vrátí ho do stavu posledního commitu. | `git restore src/config/app.ts` |
| `git reset HEAD~1 --soft` | Zruší poslední commit, ale všechny změněné soubory ti nechá připravené v kódu k úpravě. | `git reset HEAD~1 --soft` |
| `git reset HEAD~1 --hard` | Smaže poslední commit a kompletně zahodí všechny změny v kódu od té doby. **Destruktivní operace.** | `git reset HEAD~1 --hard` |
| `git clean -fd` | Odstraní z projektu všechny nesledované (untracked) soubory a adresáře kromě těch v `.gitignore`. | `git clean -fd` |
| `git commit --amend --no-edit` | Přidá aktuálně připravené změny (`git add`) do posledního commitu bez změny textu commit zprávy. | `git commit --amend --no-edit` |
