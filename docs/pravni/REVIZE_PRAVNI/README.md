# Revize právníkem — pracovní kopie

Tato složka obsahuje **originální znění** právních dokumentů včetně interních poznámek pro advokátní revizi. **Na web se ne publikuje.**

| Soubor | Varianta |
|--------|----------|
| `vop-fo.md` / `vop-osvc.md` | VOP |
| `balicky-inzerce-fo.md` / `balicky-inzerce-osvc.md` | Balíčky / limity |
| `ochrana-osobnich-udaju-fo.md` / `ochrana-osobnich-udaju-osvc.md` | GDPR |
| `podminky-inzerce.md` | Pravidla inzerce |
| `cookies.md` | Cookies |
| `dsa-kontaktni-centrum.md` | DSA |

## Workflow

1. **Editace pro právníka** — upravujte soubory zde (včetně `> **Poznámka pro revizi právníkem:**` a patičky *Draft — …*).
2. **Sync na web** — po schválení zkopírujte finální text do odpovídajícího souboru v `docs/pravni/` (nadřazená složka) a spusťte:

   ```bash
   node scripts/sync-legal-docs-for-web.mjs
   ```

   Skript odstraní poznámky pro revizi stejně jako `stripLegalReviewNotes()` v aplikaci.

3. **Dvojitá ochrana** — `readLegalDocument()` volá `stripLegalReviewNotes()` i při čtení; na webu se interní poznámky nezobrazí ani omylem.

## Co se z webové verze odstraňuje

- Blockquote `> **Poznámka pro revizi právníkem:** …`
- Blockquote `> **Technická poznámka (interní):** …`
- Patička `*Draft — před publikací nechat zkontrolovat právníkem.*`
- Prefix `Draft` u řádku **Verze:**

**Co zůstává:** substantivní poznámky v textu (např. ODR u §5 VOP), placeholdery `[doplnit]` — ty doplníte před publikací.
