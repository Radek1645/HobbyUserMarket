-- Práce/brigády: zadavatel může vyžadovat CV při odpovědi uchazeče.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS job_cv_required BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.posts.job_cv_required IS
  'Práce/brigády: uchazeč musí přiložit CV nebo portfolio při poptávce.';
