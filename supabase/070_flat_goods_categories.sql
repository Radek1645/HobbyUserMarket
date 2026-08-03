-- 070: Flat zbožové domény (nahrazuje category_type = zbozi)

-- 1) Dočasně povolit staré i nové typy (migrace dat)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_type_check;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_matches_category_check;

ALTER TABLE public.posts ADD CONSTRAINT posts_category_type_check
  CHECK (category_type IN (
    'zbozi',
    'auto', 'detsky', 'dum', 'elektro', 'moda', 'sport', 'hobby', 'ostatni',
    'sluzby', 'udalost', 'nemovitost', 'prace'
  ));

-- 2) Mapování zbozi + staré slugy → nové domény
UPDATE public.posts
SET category_type = 'auto', subcategory_slug = 'osobni-auta'
WHERE category_type = 'zbozi' AND subcategory_slug = 'auta-moto';

UPDATE public.posts
SET category_type = 'elektro', subcategory_slug = 'ostatni'
WHERE category_type = 'zbozi' AND subcategory_slug = 'elektronika';

UPDATE public.posts
SET category_type = 'dum', subcategory_slug = 'nabytek-doplnky'
WHERE category_type = 'zbozi' AND subcategory_slug = 'nabytek-domacnost';

UPDATE public.posts
SET category_type = 'dum', subcategory_slug = 'potraviny-domaci'
WHERE category_type = 'zbozi' AND subcategory_slug = 'potraviny-domaci';

UPDATE public.posts
SET category_type = 'sport', subcategory_slug = 'kola-kolobezky'
WHERE category_type = 'zbozi' AND subcategory_slug = 'kola-sport';

UPDATE public.posts
SET category_type = 'moda', subcategory_slug = 'damske-panske'
WHERE category_type = 'zbozi' AND subcategory_slug = 'moda-obleceni';

UPDATE public.posts
SET category_type = 'ostatni', subcategory_slug = 'ostatni'
WHERE category_type = 'zbozi' AND subcategory_slug = 'ostatni';

-- Fallback: jakýkoli zbývající zbozi řádek
UPDATE public.posts
SET category_type = 'ostatni', subcategory_slug = 'ostatni'
WHERE category_type = 'zbozi';

-- 3) Finální CHECK bez zbozi
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_type_check
  CHECK (category_type IN (
    'auto', 'detsky', 'dum', 'elektro', 'moda', 'sport', 'hobby', 'ostatni',
    'sluzby', 'udalost', 'nemovitost', 'prace'
  ));

ALTER TABLE public.posts ADD CONSTRAINT posts_condition_matches_category_check
  CHECK (
    (category_type IN ('auto', 'detsky', 'dum', 'elektro', 'moda', 'sport', 'hobby', 'ostatni')
      AND condition_label IN ('new', 'like_new', 'used', 'damaged'))
    OR (category_type = 'sluzby' AND condition_label IN ('one_time', 'long_term', 'substitute'))
    OR (category_type = 'udalost' AND condition_label IN ('one_time', 'long_term'))
    OR (category_type = 'nemovitost' AND condition_label IN ('sale', 'rent'))
    OR (category_type = 'prace' AND condition_label IN ('one_time', 'long_term', 'substitute'))
  );
