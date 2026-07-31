# Kuchařka — ukončení práce na projektu

> **Účel:** Obecný checklist před odchodem ze session. Platí po každé větší iteraci (feature, oprava, migrace, změna AI).  
> **Pravidlo:** Kód bez dokumentace není hotový. Poslední krok je obvykle **push do gitu** — výjimka: uživatel výslovně řekne bez push.

Postupuj **shora dolů**. Zaškrtni `[x]` po dokončení. Kroky označené *(pokud)* dělej jen když session se jich týkala.

---

## Přehled pořadí

```
1. Ověřit funkčnost  →  2. Nasadit infrastrukturu  →  3. Aktualizovat dokumentaci
        →  4. Zapsat stav session  →  5. Commit  →  6. Push *(pokud)*
```

---

## 1. Ověření funkčnosti

- [x] Lint / build / tsc / Deno check Edge — OK v session
- [ ] Publish create + edit s fotkami (staging → Sharp → Edge) — po deployi Edge + Vercel
- [ ] Negativní security smoke (cizí path / chybějící rendition) — po deployi

---

## 2. Nasazení infrastruktury

- [x] SQL `067` + `068` — spuštěno uživatelem
- [ ] Edge Functions — `npm run sync:moderation` + deploy `moderate-listing` *(uživatel po pushi)*
- [ ] Vercel build po pushi *(až po pushi)*
- [x] Env `SUPABASE_SERVICE_ROLE_KEY` — `.env.local` + Vercel Production/Preview

---

## 3. Dokumentace

> **Trvalé pravidlo (každá session):** Pokud vznikla nebo se změnila DB tabulka / sloupec / enum / Storage bucket → aktualizuj [`supabase-prikazy.md`](./supabase-prikazy.md) sekci **Schéma databáze** (+ PRD §4 u produktových změn).

- [x] **Metodika** — krok 3 fotky (staging + Sharp)
- [x] **PRD** — v3.52
- [x] **moderace-inzeratu.md** / ukázka hydratace / TO-DO § E
- [x] **supabase-prikazy.md § Schéma** — buckety staging/renditions + `main_image_index`
- [x] **Stav_projektu/2026-07-31.md**

---

## 4. Snapshot session — `Stav_projektu/`

- [x] Soubor `Stav_projektu/2026-07-31.md`
- [x] Řádek v [`Stav_projektu/README.md`](../Stav_projektu/README.md)

---

## 5. Git — příprava a commity

- [x] `git status` — bez `.env`
- [x] Commit `fad456c` (+ `6ef9a50` hash ve snapshotu)
- [x] Push

---

## 6. Push do gitu *(poslední krok)*

```powershell
git push -u origin HEAD
```

- [x] Push — `main` → `origin/main`
- [ ] Vercel build po pushi zelený *(uživatel)*
- [ ] Deploy Edge `moderate-listing` *(uživatel)*

---

## Definition of Done — session

| Kritérium | Splněno |
|-----------|:-------:|
| Změna ověřená v UI / API | ⬜ po deployi |
| Migrace + EF nasazené | ✅ migrace / ⬜ EF |
| Dokumentace srovnaná s kódem | ✅ |
| DB schéma v `supabase-prikazy.md` | ✅ |
| `Stav_projektu` aktualizován | ✅ |
| Commit na `main` | ✅ |
| Push na `origin` | ✅ |
)
