-- =============================================================================
-- 072 — Category SEO landings (Vlna 1): copy + index_status + listing_count
-- Taxonomie zůstává v src/config/categories*.ts — tady jen SEO stav.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.category_seo_pages (
  slug text PRIMARY KEY,
  page_no bigint GENERATED ALWAYS AS IDENTITY,
  kind text NOT NULL DEFAULT 'subcategory'
    CHECK (kind IN ('subcategory', 'category_type')),
  description text,
  meta_title text,
  meta_description text,
  index_status text NOT NULL DEFAULT 'noindex'
    CHECK (index_status IN ('index', 'noindex')),
  listing_count integer NOT NULL DEFAULT 0,
  above_threshold_since timestamptz,
  below_threshold_since timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS category_seo_pages_page_no_idx
  ON public.category_seo_pages (page_no);

CREATE INDEX IF NOT EXISTS category_seo_pages_index_status_idx
  ON public.category_seo_pages (index_status);

COMMENT ON TABLE public.category_seo_pages IS
  'SEO stav a copy kategoriálních landings; slug = subcategory z configu (1:1).';

ALTER TABLE public.category_seo_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS category_seo_pages_select_public ON public.category_seo_pages;
CREATE POLICY category_seo_pages_select_public
  ON public.category_seo_pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.category_seo_pages TO anon, authenticated;
GRANT ALL ON public.category_seo_pages TO service_role;

-- Seed Vlna 1 priorita (noindex; denní job nastaví count + hysterezi).
INSERT INTO public.category_seo_pages (
  slug, kind, description, meta_title, meta_description
) VALUES
  (
    'kola-kolobezky',
    'subcategory',
    'Nabídka kol a koloběžek od soukromých prodejců i hobby bazarů. Dětská kola, horská, skládací koloběžky i příslušenství — prohlížejte aktuální inzeráty a domluvte si osobní předání v okolí.',
    'Kola a koloběžky | zaPikolou.cz',
    'Inzeráty kol a koloběžek na zaPikolou.cz. Dětská i dospělá kola, koloběžky a související vybavení od lidí z okolí.'
  ),
  (
    'kocarky-sedacky-nabytek',
    'subcategory',
    'Kočárky, autosedačky a dětský nábytek z druhé ruky. Prohlížejte ověřené lokální nabídky a ušetřete oproti novému zboží — domluva přímo mezi vámi.',
    'Kočárky, sedačky a nábytek | zaPikolou.cz',
    'Inzeráty kočárků, autosedaček a dětského nábytku na zaPikolou.cz. Lokální bazary od rodičů z okolí.'
  ),
  (
    'osobni-auta',
    'subcategory',
    'Ojetá osobní auta od soukromých prodejců. Prohlížejte aktuální nabídky, porovnejte parametry a domluvte prohlídku přímo s majitelem.',
    'Osobní auta | zaPikolou.cz',
    'Inzeráty osobních aut na zaPikolou.cz. Ojetá vozidla od lidí z okolí — bez zbytečných prostředníků.'
  ),
  (
    'zimni-sport',
    'subcategory',
    'Lyže, snowboardy a zimní sportovní vybavení. Sezónní nabídky od hobby prodejců — prohlížejte inzeráty a domluvte předání v okolí.',
    'Zimní sport | zaPikolou.cz',
    'Inzeráty zimního sportovního vybavení na zaPikolou.cz. Lyže, snowboardy a doplňky od lidí z okolí.'
  ),
  (
    'detske-obleceni-obuv',
    'subcategory',
    'Dětské oblečení a obuv ve výborném stavu. Prohlížejte velikosti a značky od rodičů z okolí a domluvte si rychlé osobní předání.',
    'Dětské oblečení a obuv | zaPikolou.cz',
    'Inzeráty dětského oblečení a obuvi na zaPikolou.cz. Lokální nabídky od rodičů — velikosti, značky, stav.'
  ),
  (
    'nabytek-doplnky',
    'subcategory',
    'Nábytek a bytové doplňky z druhé ruky. Stoly, židle, skříně i dekorace — prohlížejte nabídky a domluvte odvoz nebo předání.',
    'Nábytek a doplňky | zaPikolou.cz',
    'Inzeráty nábytku a doplňků na zaPikolou.cz. Domácí bazary od lidí z okolí.'
  ),
  (
    'mobily',
    'subcategory',
    'Použité mobilní telefony a smartphony. Prohlížejte značky, stav a výbavu a domluvte osobní předání s prodejcem z okolí.',
    'Mobily | zaPikolou.cz',
    'Inzeráty mobilů na zaPikolou.cz. Smartphony od lidí z okolí — stav, výbava, domluva napřímo.'
  ),
  (
    'zahrada-naradi',
    'subcategory',
    'Zahradní technika a nářadí z druhé ruky. Sekačky, nářadí i vybavení dílny — prohlížejte nabídky a domluvte předání v okolí.',
    'Zahrada a nářadí | zaPikolou.cz',
    'Inzeráty zahradní techniky a nářadí na zaPikolou.cz. Lokální nabídky od kutilů a zahrádkářů.'
  )
ON CONFLICT (slug) DO NOTHING;
