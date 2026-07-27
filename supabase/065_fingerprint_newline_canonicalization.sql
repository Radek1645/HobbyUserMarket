-- =============================================================================
-- 065 — sjednocení LF/CRLF v content fingerprintu
--
-- Browser multipart FormData normalizuje víceřádkový popis na CRLF, zatímco
-- JSON request do Edge Function používá LF. Vizuálně stejný text proto po
-- uložení dostal jiný hash a publish_approved_post vracel content_mismatch.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.canonical_listing_fingerprint_text(
  p_value TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT replace(
    replace(btrim(COALESCE(p_value, '')), E'\r\n', E'\n'),
    E'\r',
    E'\n'
  );
$$;

REVOKE ALL ON FUNCTION public.canonical_listing_fingerprint_text(TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.listing_content_fingerprint_from_post(
  p_post_id BIGINT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row RECORD;
  v_price TEXT;
  v_event TEXT;
  v_latitude TEXT;
  v_longitude TEXT;
  v_payload TEXT;
BEGIN
  SELECT
    title,
    description,
    category_type,
    subcategory_slug,
    condition_label,
    price_type,
    price_amount,
    exchange_for,
    location_text,
    location,
    event_date,
    listing_duration_days,
    show_contact_email,
    show_contact_phone,
    contact_phone,
    job_cv_required
  INTO v_row
  FROM public.posts
  WHERE id = p_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found' USING errcode = 'P0002';
  END IF;

  v_price := CASE
    WHEN v_row.price_amount IS NULL THEN ''
    ELSE v_row.price_amount::text
  END;

  v_event := CASE
    WHEN v_row.event_date IS NULL THEN ''
    ELSE to_char(
      v_row.event_date AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    )
  END;

  v_latitude := CASE
    WHEN v_row.location IS NULL THEN ''
    ELSE to_char(
      extensions.ST_Y(v_row.location::extensions.geometry),
      'FM999990.000000'
    )
  END;

  v_longitude := CASE
    WHEN v_row.location IS NULL THEN ''
    ELSE to_char(
      extensions.ST_X(v_row.location::extensions.geometry),
      'FM999990.000000'
    )
  END;

  v_payload :=
    '{"title":' || to_json(public.canonical_listing_fingerprint_text(v_row.title)) ||
    ',"description":' || to_json(public.canonical_listing_fingerprint_text(v_row.description)) ||
    ',"categoryType":' || to_json(public.canonical_listing_fingerprint_text(v_row.category_type::text)) ||
    ',"subcategorySlug":' || to_json(public.canonical_listing_fingerprint_text(v_row.subcategory_slug)) ||
    ',"conditionLabel":' || to_json(public.canonical_listing_fingerprint_text(v_row.condition_label)) ||
    ',"priceType":' || to_json(public.canonical_listing_fingerprint_text(v_row.price_type)) ||
    ',"priceAmount":' || to_json(v_price) ||
    ',"exchangeFor":' || to_json(
      CASE
        WHEN v_row.price_type = 'exchange'
          THEN public.canonical_listing_fingerprint_text(v_row.exchange_for)
        ELSE ''
      END
    ) ||
    ',"locationText":' || to_json(public.canonical_listing_fingerprint_text(v_row.location_text)) ||
    ',"latitude":' || to_json(v_latitude) ||
    ',"longitude":' || to_json(v_longitude) ||
    ',"eventDate":' || to_json(v_event) ||
    ',"listingDurationDays":' || to_json(COALESCE(v_row.listing_duration_days, 0)) ||
    ',"showContactEmail":' || to_json(COALESCE(v_row.show_contact_email, false)) ||
    ',"showContactPhone":' || to_json(COALESCE(v_row.show_contact_phone, false)) ||
    ',"contactPhone":' || to_json(
      CASE
        WHEN COALESCE(v_row.show_contact_phone, false)
          THEN regexp_replace(
            public.canonical_listing_fingerprint_text(v_row.contact_phone),
            '\s+',
            ' ',
            'g'
          )
        ELSE ''
      END
    ) ||
    ',"jobCvRequired":' || to_json(COALESCE(v_row.job_cv_required, false)) ||
    '}';

  RETURN encode(digest(v_payload, 'sha256'), 'hex');
END;
$$;

REVOKE ALL ON FUNCTION public.listing_content_fingerprint_from_post(BIGINT) FROM PUBLIC;
