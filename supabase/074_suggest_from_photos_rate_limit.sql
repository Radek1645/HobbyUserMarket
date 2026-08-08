-- Rate limit action for AI photo-first listing prefill (suggest-listing-from-photos).
-- Separate from ai_check so prefill does not burn the publish moderation budget.

ALTER TYPE public.rate_limit_action ADD VALUE IF NOT EXISTS 'suggest_from_photos';
