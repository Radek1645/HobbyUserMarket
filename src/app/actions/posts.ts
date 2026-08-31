"use server";

import { MODERATION_IMAGE_STAGING_BUCKET } from "@/config/app";
import { LEGAL_UI } from "@/config/legal";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import { GUEST_PUBLISH_LOCK_TIMEOUT_MS } from "@/config/guest-listing";
import { getListingEditPath, getListingPath } from "@/lib/posts/listing-path";
import { buildPostSlug } from "@/lib/posts/slug";
import {
  validateCreateListing,
  validateUpdateListing,
  type CreateListingInput,
} from "@/lib/posts/validation";
import { findProhibitedKeyword } from "@/lib/moderation/prohibited-scan";
import { stripContactInfo } from "@/lib/moderation/strip-contacts";
import { stripDoplnitPlaceholders } from "@/lib/listing/strip-doplnit-placeholders";
import { notifyListingPublished } from "@/lib/email/notify-listing-published";
import { getSiteUrl } from "@/lib/supabase/env";
import {
  getUserListingQuota,
  isListingQuotaExceededError,
  isNewPublicationQuotaBlocked,
  LISTING_QUOTA_EXCEEDED_MESSAGE,
} from "@/lib/listings/quota";
import { syncListingImagesFromForm } from "@/lib/posts/listing-images";
import { buildStoredListingImageBindings } from "@/lib/posts/listing-image-hashes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isUniqueViolation } from "@/lib/supabase/postgres-errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateListingState = {
  error?: string;
};

export type UpdateListingState = {
  error?: string;
};

const PROHIBITED_CONTENT_ERROR =
  "Inzerát obsahuje zakázaný obsah a nelze ho zveřejnit. Viz podmínky inzerce.";

const MODERATION_TOKEN_MISSING_ERROR =
  "Chybí potvrzení AI kontroly. Vraťte se prosím o krok zpět a odešlete inzerát znovu.";
const CONTENT_CHANGED_AFTER_APPROVAL_ERROR =
  "Obsah inzerátu se po AI kontrole změnil. Odešlete ho prosím znovu.";
const IMAGE_CONTENT_MISMATCH_ERROR =
  "Fotky neodpovídají verzi schválené AI kontrolou. Odešlete inzerát znovu.";
const POST_NOT_DRAFT_ERROR =
  "Inzerát se nepodařilo připravit k bezpečné publikaci. Obnovte stránku a zkuste změny uložit znovu.";
const PUBLISH_IN_PROGRESS_ERROR =
  "Publikace už probíhá v jiné kartě. Počkejte chvíli a obnovte stránku.";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type IdempotentPost = {
  id: number;
  slug: string;
  status: string;
  publish_started_at: string | null;
};

function readPublishRequestId(formData: FormData): string | null {
  const value = String(formData.get("publishRequestId") ?? "").trim();
  return UUID_RE.test(value) ? value : null;
}

/**
 * H1: publikace (status='active') jde výhradně přes publish_approved_post RPC,
 * který spotřebuje approval token vydaný Edge Function po bezpečnostním filtru.
 * Bez platného tokenu zůstane inzerát ve stavu 'draft' (neviditelný).
 *
 * SEC-H01/H02: RPC je volatelné jen service_role Server Action. V DB ověří
 * fingerprint přesného uloženého obsahu a SHA-256 všech Storage objektů.
 */
async function publishWithApprovalToken(
  supabase: SupabaseClient,
  userId: string,
  postId: number,
  formData: FormData,
  target: "active" | "hidden" = "active",
): Promise<string | null> {
  const token = String(formData.get("moderationToken") ?? "").trim();
  if (!token) {
    return MODERATION_TOKEN_MISSING_ERROR;
  }

  const actor = await getCurrentUser();
  if (actor?.needsVopReconsent) {
    return LEGAL_UI.reconsentRequiredError;
  }

  const imageBindingResult = await buildStoredListingImageBindings(
    supabase,
    postId,
  );
  if ("error" in imageBindingResult) {
    return imageBindingResult.error;
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("publishWithApprovalToken admin:", adminResult.error);
    return "Publikaci se nepodařilo bezpečně ověřit. Zkuste to prosím znovu.";
  }

  const { error } = await adminResult.client.rpc("publish_approved_post", {
    p_post_id: postId,
    p_token: token,
    p_user_id: userId,
    p_target: target,
    p_image_bindings: imageBindingResult.bindings,
  });

  if (error) {
    console.error("publish_approved_post:", error);
    if (isListingQuotaExceededError(error.message)) {
      return LISTING_QUOTA_EXCEEDED_MESSAGE;
    }
    if (error.message?.includes("content_mismatch")) {
      return CONTENT_CHANGED_AFTER_APPROVAL_ERROR;
    }
    if (
      error.message?.includes("image_set_mismatch") ||
      error.message?.includes("image_content_mismatch")
    ) {
      return IMAGE_CONTENT_MISMATCH_ERROR;
    }
    if (error.message?.includes("post_not_draft")) {
      return POST_NOT_DRAFT_ERROR;
    }
    return MODERATION_TOKEN_MISSING_ERROR;
  }

  return null;
}

function sanitizeListingText(text: string): string {
  return stripDoplnitPlaceholders(stripContactInfo(text));
}

function buildListingPayload(data: CreateListingInput) {
  const payload: Record<string, unknown> = {
    title: sanitizeListingText(data.title),
    description: sanitizeListingText(data.description),
    category_type: data.categoryType,
    subcategory_slug: data.subcategorySlug,
    price_type: data.priceType,
    price_amount: data.priceAmount,
    exchange_for:
      data.priceType === "exchange" && data.exchangeFor
        ? stripContactInfo(data.exchangeFor)
        : null,
    condition_label: data.conditionLabel,
    location_text: data.locationText,
    location: `SRID=4326;POINT(${data.longitude} ${data.latitude})`,
    listing_duration_days: data.listingDurationDays,
    show_contact_email: data.showContactEmail,
    show_contact_phone: data.showContactPhone,
    contact_phone:
      data.showContactPhone && data.contactPhone ? data.contactPhone : null,
  };

  if (data.categoryType === "udalost" && data.eventDate) {
    payload.event_date = data.eventDate;
    payload.event_end_date = data.eventEndDate;
    payload.is_private = data.isPrivate;
  } else {
    payload.event_date = null;
    payload.event_end_date = null;
    payload.is_private = false;
  }

  if (
    data.originalTitle !== undefined &&
    data.originalDescription !== undefined
  ) {
    payload.original_title = stripContactInfo(data.originalTitle);
    payload.original_description = stripContactInfo(data.originalDescription);
  }

  if (data.descriptionAiAssisted !== undefined) {
    payload.description_ai_assisted = data.descriptionAiAssisted;
  }

  if (data.metaDescription !== undefined) {
    payload.meta_description = data.metaDescription;
  }

  if (data.imageAlt !== undefined) {
    payload.image_alt = data.imageAlt;
  }

  payload.job_cv_required =
    data.categoryType === "prace" ? data.jobCvRequired : false;

  payload.external_url =
    data.categoryType === "udalost" ? data.externalUrl : null;

  return payload;
}

export async function createListing(
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Pro založení inzerátu se musíte přihlásit." };
  }
  if (user.needsVopReconsent) {
    return { error: LEGAL_UI.reconsentRequiredError };
  }

  const validated = validateCreateListing(formData);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const data = validated.data;

  // H1: rychlý server-side scan zjevně zakázaného obsahu (doplněk AI filtru).
  if (findProhibitedKeyword(data.title, data.description)) {
    return { error: PROHIBITED_CONTENT_ERROR };
  }

  const publishRequestId = readPublishRequestId(formData);
  const supabase = await createClient();
  const adminResult = createAdminClient();
  if (publishRequestId && !adminResult.ok) {
    console.error("createListing idempotency admin:", adminResult.error);
    return { error: "Publikaci se nepodařilo bezpečně připravit. Zkuste to znovu." };
  }

  let row: IdempotentPost | null = null;
  let isIdempotentRetry = false;

  if (publishRequestId && adminResult.ok) {
    const { data: existing, error: existingError } = await adminResult.client
      .from("posts")
      .select("id, slug, status, publish_started_at")
      .eq("user_id", user.id)
      .eq("publish_request_id", publishRequestId)
      .maybeSingle<IdempotentPost>();

    if (existingError) {
      console.error("createListing idempotency lookup:", existingError);
      return { error: "Publikaci se nepodařilo bezpečně připravit. Zkuste to znovu." };
    }

    if (existing?.status === "active") {
      redirect(`${getListingPath(existing.slug)}?published=${existing.id}`);
    }

    if (existing?.status === "draft") {
      const staleBefore = new Date(
        Date.now() - GUEST_PUBLISH_LOCK_TIMEOUT_MS,
      ).toISOString();
      const { data: claimed, error: claimError } = await adminResult.client
        .from("posts")
        .update({ publish_started_at: new Date().toISOString() })
        .eq("id", existing.id)
        .eq("user_id", user.id)
        .or(
          `publish_started_at.is.null,publish_started_at.lt.${staleBefore}`,
        )
        .select("id, slug, status, publish_started_at")
        .maybeSingle<IdempotentPost>();

      if (claimError) {
        console.error("createListing idempotency claim:", claimError);
        return { error: "Publikaci se nepodařilo bezpečně obnovit. Zkuste to znovu." };
      }
      if (!claimed) {
        return { error: PUBLISH_IN_PROGRESS_ERROR };
      }

      row = claimed;
      isIdempotentRetry = true;
    } else if (existing) {
      // Neúspěšný soft-deleted pokus nesmí blokovat nový insert stejného draftu.
      await adminResult.client
        .from("posts")
        .update({
          publish_request_id: null,
          publish_started_at: null,
        })
        .eq("id", existing.id)
        .eq("user_id", user.id);
    }
  }

  const quota = await getUserListingQuota(user.id);
  if (isNewPublicationQuotaBlocked(quota)) {
    return { error: LISTING_QUOTA_EXCEEDED_MESSAGE };
  }

  if (!row) {
    const slug = buildPostSlug(data.title);
    // H1: insert jako 'draft' — RLS ani trigger nedovolí přímý 'active'.
    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      ...buildListingPayload(data),
      status: "draft",
      slug,
      ...(publishRequestId
        ? {
            publish_request_id: publishRequestId,
            publish_started_at: new Date().toISOString(),
          }
        : {}),
    };

    const { data: inserted, error } = await supabase
      .from("posts")
      .insert(insertPayload)
      .select("id, slug, status, publish_started_at")
      .single<IdempotentPost>();

    if (error || !inserted) {
      if (publishRequestId && isUniqueViolation(error ?? {})) {
        return { error: PUBLISH_IN_PROGRESS_ERROR };
      }
      console.error("createListing:", error);
      return { error: "Inzerát se nepodařilo uložit. Zkuste to prosím znovu." };
    }
    row = inserted;
  }

  let shouldSyncImages = true;
  if (isIdempotentRetry) {
    const { count, error: imageCountError } = await supabase
      .from("post_images")
      .select("id", { count: "exact", head: true })
      .eq("post_id", row.id);
    if (imageCountError) {
      console.error("createListing retry image count:", imageCountError);
      return { error: "Fotky se nepodařilo bezpečně obnovit. Zkuste to znovu." };
    }
    shouldSyncImages =
      (count ?? 0) === 0 && formData.getAll("stagedImagePath").length > 0;
  }

  const imageResult = shouldSyncImages
    ? await syncListingImagesFromForm(
        supabase,
        user.id,
        row.id,
        formData,
        adminResult.ok ? adminResult.client : undefined,
        { cleanupStaging: false },
      )
    : {};

  // P2: při chybě uploadu nesmí zůstat orphan draft (kvóta / „Koncept“ bez fotek).
  // Soft-delete spustí trg_posts_cleanup_storage (Storage).
  if (imageResult.error) {
    const { error: cleanupError } = await supabase
      .from("posts")
      .update({
        status: "deleted",
        publish_request_id: null,
        publish_started_at: null,
      })
      .eq("id", row.id)
      .eq("user_id", user.id);
    if (cleanupError) {
      console.error("createListing orphan cleanup:", cleanupError);
    }
    return { error: imageResult.error };
  }

  const publishError = await publishWithApprovalToken(
    supabase,
    user.id,
    row.id,
    formData,
  );
  if (publishError) {
    if (publishRequestId && adminResult.ok) {
      await adminResult.client
        .from("posts")
        .update({ publish_started_at: null })
        .eq("id", row.id)
        .eq("user_id", user.id);
    }
    return { error: publishError };
  }

  if (adminResult.ok) {
    const stagingPaths = formData
      .getAll("stagedImagePath")
      .map((path) => String(path))
      .filter((path) => path.startsWith(`${user.id}/`));
    if (stagingPaths.length > 0) {
      const { error: cleanupError } = await adminResult.client.storage
        .from(MODERATION_IMAGE_STAGING_BUCKET)
        .remove(stagingPaths);
      if (cleanupError) {
        console.error("createListing staging cleanup:", cleanupError);
      }
    }
  }

  revalidatePath("/");
  await notifyListingPublished({
    recipientEmail: user.email,
    postTitle: String(data.title),
    listingUrl: `${getSiteUrl()}${getListingPath(row.slug)}`,
    myListingsUrl: `${getSiteUrl()}/moje-inzeraty`,
  });
  redirect(`${getListingPath(row.slug)}?published=${row.id}`);
}

export async function updateListing(
  _prev: UpdateListingState,
  formData: FormData,
): Promise<UpdateListingState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Pro úpravu inzerátu se musíte přihlásit." };
  }

  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId) || postId < 1) {
    return { error: "Neplatný inzerát." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("posts")
    .select("id, slug, user_id, event_date, event_end_date, status, listing_quota_consumed")
    .eq("id", postId)
    .maybeSingle<{
      id: number;
      slug: string;
      user_id: string;
      event_date: string | null;
      event_end_date: string | null;
      status: string;
      listing_quota_consumed: boolean;
    }>();

  if (fetchError || !existing) {
    return { error: "Inzerát nebyl nalezen." };
  }

  const isOwner = existing.user_id === user.id;
  const asStaff = isStaffRole(user.role);
  if (!isOwner && !asStaff) {
    return { error: "Tento inzerát může upravit jen jeho autor." };
  }

  // 'draft' = rozpracovaný/neúspěšně publikovaný (H1) — musí jít doupravit.
  if (!["active", "hidden", "draft", "blocked"].includes(existing.status)) {
    return { error: "Tento inzerát už nelze upravovat." };
  }

  const validated = validateUpdateListing(
    formData,
    existing.event_date,
    existing.event_end_date,
  );
  if (!validated.ok) {
    return { error: validated.error };
  }

  // H1: rychlý server-side scan zjevně zakázaného obsahu (doplněk AI filtru).
  if (findProhibitedKeyword(validated.data.title, validated.data.description)) {
    return { error: PROHIBITED_CONTENT_ERROR };
  }

  const payload = buildListingPayload(validated.data);
  // Staff bez načteného telefonu nesmí přepsat contact_phone na null.
  if (asStaff && !isOwner && !validated.data.contactPhone?.trim()) {
    delete payload.contact_phone;
  }

  let updateQuery = supabase.from("posts").update(payload).eq("id", postId);
  if (isOwner) {
    updateQuery = updateQuery.eq("user_id", user.id);
  }

  const { error: updateError } = await updateQuery;

  if (updateError) {
    console.error("updateListing:", updateError);
    return { error: "Změny se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  // Fotky: insert/update post_images má RLS jen pro vlastníka. God Mode zatím
  // mění text; sync fotek u cizího inzerátu by selhal.
  if (isOwner) {
    const stagingAdminResult = createAdminClient();
    const imageResult = await syncListingImagesFromForm(
      supabase,
      user.id,
      postId,
      formData,
      stagingAdminResult.ok ? stagingAdminResult.client : undefined,
    );

    if (imageResult.error) {
      return { error: imageResult.error };
    }
  }

  // H1: změna obsahu/fotek degradovala inzerát na 'draft' (DB trigger).
  // Klient poslal approval token právě tehdy, když AI moderace proběhla —
  // publish RPC vrátí inzerát do původního stavu (aktivní zpět na 'active',
  // pauznutý zůstává 'hidden'). Edit bez změny obsahu token nemá a žádnou
  // obnovu nepotřebuje (status se neměnil).
  // Staff je v publish gate privileged — status zůstává active; publish RPC
  // vyžaduje ownership, proto se u God Mode přeskočí.
  const hasModerationToken = Boolean(
    String(formData.get("moderationToken") ?? "").trim(),
  );

  if (hasModerationToken && isOwner) {
    const quota = await getUserListingQuota(user.id);
    if (isNewPublicationQuotaBlocked(quota, existing.listing_quota_consumed)) {
      return { error: LISTING_QUOTA_EXCEEDED_MESSAGE };
    }

    const publishError = await publishWithApprovalToken(
      supabase,
      user.id,
      postId,
      formData,
      existing.status === "hidden" ? "hidden" : "active",
    );
    if (publishError) {
      return { error: publishError };
    }
  }

  const { data: finalPost } = await supabase
    .from("posts")
    .select("slug, status")
    .eq("id", postId)
    .maybeSingle<{ slug: string; status: string }>();

  const slug = finalPost?.slug ?? existing.slug;
  const finalStatus = finalPost?.status ?? existing.status;

  revalidatePath("/");
  revalidatePath("/moje-inzeraty", "page");
  revalidatePath(getListingPath(slug));
  revalidatePath(getListingEditPath(slug));

  const isFirstPublication =
    existing.status === "draft" &&
    !existing.listing_quota_consumed &&
    finalStatus === "active";
  if (isFirstPublication) {
    await notifyListingPublished({
      recipientEmail: user.email,
      postTitle: validated.data.title,
      listingUrl: `${getSiteUrl()}${getListingPath(slug)}`,
      myListingsUrl: `${getSiteUrl()}/moje-inzeraty`,
    });
  }

  if (finalStatus === "active") {
    redirect(getListingPath(slug));
  }

  redirect("/moje-inzeraty");
}
