-- =============================================================================
-- 089 — Category SEO: Knihy, hry a hudba + TV, foto a audio
-- Po apply: cron `/api/cron/category-seo-index` doplní listing_count + index_status.
-- =============================================================================

INSERT INTO public.category_seo_pages (
  slug, kind, description, meta_title, meta_description
) VALUES
  (
    'knihy-hry-hudba',
    'subcategory',
    'Knihy, deskové hry a hudební vybavení z druhé ruky. Romány, učebnice, deskovky i kytary — prohlížejte nabídky od hobby prodejců a domluvte si osobní předání v okolí.',
    'Knihy, hry a hudba | zaPikolou.cz',
    'Inzeráty knih, her a hudby na zaPikolou.cz. Deskové hry, knihy i hudební nástroje od lidí z okolí.'
  ),
  (
    'tv-foto-audio',
    'subcategory',
    'Televize, fotoaparáty a audio z druhé ruky. Prohlížejte značky a stav — televize, zrcadlovky, sluchátka i reproduktory — a domluvte si osobní předání s prodejcem z okolí.',
    'TV, foto a audio | zaPikolou.cz',
    'Inzeráty televizí, fotoaparátů a audia na zaPikolou.cz. Lokální nabídky od lidí z okolí — stav, model, domluva napřímo.'
  )
ON CONFLICT (slug) DO NOTHING;
