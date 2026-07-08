# Modul: Události — rychlý přehled (v0.2)

> **Kanonická specifikace:** [`PRD_v3.md` §8](./PRD_v3.md#8-modul-události-v02)  
> **Stav:** Implementováno  
> **Migrace DB:** [`003_prd_v3_7.sql`](../supabase/003_prd_v3_7.sql) · [`004_recurring_events.sql`](../supabase/004_recurring_events.sql)

Tento soubor je **doplňkový cheat sheet** — při rozporu platí PRD.

---

## Koncept

Událost = `post` s `category_type = 'udalost'`. Registrace = poptávkový formulář (§5.3).

## DB

| Pole | Hodnota |
|------|---------|
| `event_date` | povinné (TIMESTAMPTZ) |
| `expires_at` | trigger: `event_date + 1 den` |
| Pole platnosti (§9) | **skryté** v UI |

## UI

- Datetime picker `event_date` — **ne slider**, ne select dnů
- Tlačítko „Mám zájem o účast“
- HP: řazení `event_date ASC`
- Rate limit poptávky: 20/den (`INQUIRY_RATE_LIMIT_PER_DAY`)
