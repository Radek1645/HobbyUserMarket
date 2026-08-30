## Snapshoty právních dokumentů (neměnné)

Tato složka obsahuje **verzované snapshoty** právních dokumentů (typicky VOP), které jsou:

- **neměnné** (jakmile někdo souhlasí s verzí, nesmí se soubor přepsat),
- svázané s hodnotou `profiles.vop_version` (u VOP),
- použitelné jako „zdroj pravdy“ pro zobrazení konkrétního znění v aplikaci.

### Pravidla

- Při změně VOP vytvořte **nový soubor** `vop-v<verze>-<fo|osvc>.md`.
- Staré snapshoty neupravujte. Oprava překlepu = nová verze.
- `CURRENT_VOP_VERSION` musí odpovídat existujícímu snapshotu.
- Balíčky inzerce OSVČ: při výměně hlavního souboru zalohovat předchozí znění jako `balicky-inzerce-v<verze>-osvc.md` (aktuálně [`balicky-inzerce-v1.0-osvc.md`](./balicky-inzerce-v1.0-osvc.md); živý draft [`../balicky-inzerce-osvc.md`](../balicky-inzerce-osvc.md) **1.1-osvc**).
- GDPR OSVČ: totéž — [`ochrana-osobnich-udaju-v1.1-osvc.md`](./ochrana-osobnich-udaju-v1.1-osvc.md); živý draft [`../ochrana-osobnich-udaju-osvc.md`](../ochrana-osobnich-udaju-osvc.md) **1.2-osvc**.

