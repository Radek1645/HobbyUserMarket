# SEO Bible — changelog

Formát: `## vX.Y — YYYY-MM-DD` + krátké body.

## v1.7 — 2026-07-20

- JSON-LD `Offer.price`: i u **negotiable** (orientační částka) — Google Product rich results.
- Bez `price` jen u `offer` („Nabídni“) a `exchange`.
- Snapshot: [`snapshots/seo-bible-v1.7.md`](./snapshots/seo-bible-v1.7.md).

## v1.6 — 2026-07-20

- Meta description: **bez CTA** (očekávání klik → detail); CTA jen v těle inzerátu.
- Odstraněn CTA pad v `ensureMetaDescriptionLength`; clamp dál dropne CTA jako pojistka.
- Snapshot: [`snapshots/seo-bible-v1.6.md`](./snapshots/seo-bible-v1.6.md).

## v1.5 — 2026-07-20

- H1: krátký **use-case povolen**, pokud se vejde do 45 znaků; synonyma v závorkách stále ne.
- Meta description: priorita vět produkt+lokalita+cena → benefit → CTA; clamp **nejdřív dropne CTA**.
- Alt: **bez lokality**; slug pravidla pro nové vs. existující URL; backlog (breadcrumbs / noindex).
- Snapshot: [`snapshots/seo-bible-v1.5.md`](./snapshots/seo-bible-v1.5.md).

## v1.4 — 2026-07-20

- Meta description / image alt: **soft cíl** pro AI; při uložení a Edge normalize **clamp** místo hard rejectu.
- Snapshot: [`snapshots/seo-bible-v1.4.md`](./snapshots/seo-bible-v1.4.md).

## v1.3 — 2026-07-20

- Meta title: při limitu 60 **nejdřív zkrátit H1**, držet lokalitu + brand.
- H1 max ~45, bez synonym v závorkách / use-case (synonyma jen v popisu).
- Meta description: povinně 150–160 + pad v kódu; galerie sdílí produktový alt.
- Snapshot: [`snapshots/seo-bible-v1.3.md`](./snapshots/seo-bible-v1.3.md).

## v1.2 — 2026-07-20

- Meta description: cena jen jako `za X Kč` — zákaz `cca` / `orientační` / `dohodou` v SERP snippetu.
- Tělo vs meta vs JSON-LD: tabulka vrstev ceny (§3.6).
- Snapshot: [`snapshots/seo-bible-v1.2.md`](./snapshots/seo-bible-v1.2.md).

## v1.1 — 2026-07-20

- Lokální SEO: spádové město jen jako **dojezdová vzdálenost / blízkost**, ne slib dovozu („mohu dovézt do Brna“).
- Snapshot: [`snapshots/seo-bible-v1.1.md`](./snapshots/seo-bible-v1.1.md).

## v1.0 — 2026-07-20

- První kanonická SEO bible inzerátů (H1 ≠ meta title, meta description, alt, lokální SEO, čistá cena ve schématu).
- Rozhodnutí: META_TITLE skládá kód (`buildListingMetaTitle`); AI generuje H1, meta description, popis a image alt.
- Snapshot: [`snapshots/seo-bible-v1.0.md`](./snapshots/seo-bible-v1.0.md).
