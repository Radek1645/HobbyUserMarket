-- PRD v3.10 — kategorie Nemovitosti (prodej / pronájem)

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_type_check
  CHECK (category_type IN ('zbozi', 'sluzby', 'udalost', 'nemovitost'));

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_label_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_condition_label_check
  CHECK (condition_label IN (
    'new', 'like_new', 'used', 'damaged',
    'one_time', 'long_term', 'substitute',
    'sale', 'rent'
  ));

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_matches_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_condition_matches_category_check
  CHECK (
    (category_type = 'zbozi' AND condition_label IN ('new', 'like_new', 'used', 'damaged'))
    OR (category_type = 'sluzby' AND condition_label IN ('one_time', 'long_term', 'substitute'))
    OR (category_type = 'udalost' AND condition_label IN ('one_time', 'long_term'))
    OR (category_type = 'nemovitost' AND condition_label IN ('sale', 'rent'))
  );
