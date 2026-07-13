-- Označení popisu vytvořeného nebo podstatně upraveného AI (Podmínky inzerce §3, AI Act).

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS description_ai_assisted BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.posts.description_ai_assisted IS
  'True when published description was created or substantially edited via AI hydration (user chose AI text in moderation preview).';
