-- PRD v3.9 — stav zboží: Poškozené / na díly (condition_label = damaged)

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_label_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_condition_label_check
  CHECK (condition_label IN (
    'new', 'like_new', 'used', 'damaged',
    'one_time', 'long_term', 'substitute'
  ));

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_matches_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_condition_matches_category_check
  CHECK (
    (category_type = 'zbozi' AND condition_label IN ('new', 'like_new', 'used', 'damaged'))
    OR (category_type = 'sluzby' AND condition_label IN ('one_time', 'long_term', 'substitute'))
    OR (category_type = 'udalost' AND condition_label IN ('one_time', 'long_term'))
  );
