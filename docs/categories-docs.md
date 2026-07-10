# Dokumentace a konfigurace kategorií — HUM

Tento dokument slouží jako single source of truth pro kategorie na platformě HUM. Pokud rozšiřuješ systém o nové kategorie, uprav nejprve tento soubor (nebo odpovídající TS konfiguraci), aby se zachovala vizuální integrita a automatické mapování ikon.

Vizuální primitivy (stíny, CTA, pilulky): [`ui-prvky.md`](./ui-prvky.md).

## 1. Architektura a Mapování Ikon

Pro konzistentní uživatelský zážitek používáme knihovnu `lucide-react`. Ikony jsou monochromatické, přebírají barvu textu rodičovského tlačítka, mají fixní velikost `16px` (`h-4 w-4`) a jsou vycentrovány pomocí flexboxu s mezerou `gap-2`.

### Přehled aktuálních kategorií

| Klíč (ID) | Název (UI) | Lucide Ikona | Zdůvodnění volby |
| :--- | :--- | :--- | :--- |
| `all` | Vše | `LayoutGrid` | Čtyři kostičky, jasný symbol pro celkový přehled bez vizuálního chaosu. |
| `goods` | Zboží | `Package` | Fyzická krabice, okamžitě srozumitelná jako produkt k prodeji/výměně. |
| `services` | Služby | `Wrench` | Klíč/kleště. Reprezentuje řemeslníky, opravy, hodinové manžely i doučování. |
| `jobs` | Práce a brigády | `Briefcase` | Kufřík. Standardní, srozumitelná metafora pro pracovní příležitosti. |
| `real_estate` | Nemovitosti | `Building` | Výšková budova. Zvolena záměrně místo `Home`, aby nedocházelo k záměně s odkazem na homepage. |
| `events` | Události | `Calendar` | Kalendář. Pro akce, sousedské grilovačky, trhy a komunitní setkání. |

## 2. Kódová implementace (TypeScript)

Pro maximální udržitelnost doporučujeme definovat kategorie jako pole objektů. Cursor by měl refaktorovat komponentu tak, aby využívala tento objekt:

```typescript
import { 
  LayoutGrid, 
  Package, 
  Wrench, 
  Briefcase, 
  Building, 
  Calendar,
  HelpCircle // Fallback ikona
} from 'lucide-react';

export interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORIES_CONFIG: CategoryConfig[] = [
  { id: 'all', label: 'Vše', icon: LayoutGrid },
  { id: 'goods', label: 'Zboží', icon: Package },
  { id: 'services', label: 'Služby', icon: Wrench },
  { id: 'jobs', label: 'Práce a brigády', icon: Briefcase },
  { id: 'real_estate', label: 'Nemovitosti', icon: Building },
  { id: 'events', label: 'Události', icon: Calendar },
];
```

## 3. Postup při rozšiřování o novou kategorii

Pokud v budoucnu přidáváš novou kategorii (např. "Auto-moto"):
1. Otevři konfiguraci (`CATEGORIES_CONFIG`).
2. Vyber jednoznačnou ikonu z [lucide.dev](https://lucide.dev/) (např. `Car`).
3. Importuj ikonu na začátku souboru.
4. Přidej nový objekt do pole:
   ```typescript
   { id: 'auto_moto', label: 'Auto-moto', icon: Car }
   ```
5. UI se díky dynamickému mapování překreslí samo a automaticky aplikuje správné Tailwind třídy.
