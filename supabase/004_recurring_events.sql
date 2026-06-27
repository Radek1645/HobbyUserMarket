-- PRD v3.7+ — pravidelné události (condition_label = long_term u category_type = udalost)

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_matches_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_condition_matches_category_check
  CHECK (
    (category_type = 'zbozi' AND condition_label IN ('new', 'like_new', 'used'))
    OR (category_type = 'sluzby' AND condition_label IN ('one_time', 'long_term', 'substitute'))
    OR (category_type = 'udalost' AND condition_label IN ('one_time', 'long_term'))
  );
