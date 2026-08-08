-- =============================================================================
-- 075 — Category SEO: landing Hračky a pro miminka
-- Po apply: cron `/api/cron/category-seo-index` doplní listing_count + index_status.
-- =============================================================================

INSERT INTO public.category_seo_pages (
  slug, kind, description, meta_title, meta_description
) VALUES (
  'hracky-miminka',
  'subcategory',
  'Hračky a zboží pro miminka z druhé ruky. Prohlížejte nabídky od rodičů z okolí — figurky, stavebnicové sety, odrážedla i výbava pro nejmenší — a domluvte si osobní předání.',
  'Hračky a pro miminka | zaPikolou.cz',
  'Inzeráty hraček a zboží pro miminka na zaPikolou.cz. Lokální nabídky od rodičů — stav, věk, domluva napřímo.'
)
ON CONFLICT (slug) DO NOTHING;
