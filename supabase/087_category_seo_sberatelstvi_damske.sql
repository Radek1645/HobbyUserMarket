-- =============================================================================
-- 087 — Category SEO: Sběratelství a umění + Dámské a pánské
-- Po apply: cron `/api/cron/category-seo-index` doplní listing_count + index_status.
-- =============================================================================

INSERT INTO public.category_seo_pages (
  slug, kind, description, meta_title, meta_description
) VALUES
  (
    'sberatelstvi-umeni',
    'subcategory',
    'Sběratelské předměty a umění z druhé ruky. Figurky, modely, dekorace i drobnosti do vitríny — prohlížejte nabídky od hobby sběratelů a domluvte si osobní předání v okolí.',
    'Sběratelství a umění | zaPikolou.cz',
    'Inzeráty sběratelských předmětů a umění na zaPikolou.cz. Figurky, modely a dekorace od lidí z okolí.'
  ),
  (
    'damske-panske',
    'subcategory',
    'Dámské a pánské oblečení z druhé ruky. Bundy, kabáty, obleky i sezónní kousky — prohlížejte velikosti a značky a domluvte si osobní předání s prodejcem z okolí.',
    'Dámské a pánské oblečení | zaPikolou.cz',
    'Inzeráty dámského a pánského oblečení na zaPikolou.cz. Lokální nabídky — velikosti, značky, stav.'
  )
ON CONFLICT (slug) DO NOTHING;
