# Modul: Události — rychlý přehled (v0.2)

> **Kanónická specifikace:** [`PRD_v3.md` §8](./PRD_v3.md#8-modul-události-v02)  
> **Migrace DB:** [`supabase/003_prd_v3_7.sql`](../supabase/003_prd_v3_7.sql)

---

## Koncept

Událost = `post` s `category_type = 'udalost'`. Registrace = poptávkový formulář.

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
