"use client";

import {
  bootstrapGuestVisitor,
  claimGuestStagingImages,
} from "@/app/actions/guest-moderation";
import { createListing, updateListing, type CreateListingState, type UpdateListingState } from "@/app/actions/posts";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/security/TurnstileWidget";
import {
  GUEST_LISTING_RESUME_QUERY,
  resolveTurnstileSiteKey,
} from "@/config/guest-listing";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { storeAuthReturnPath } from "@/lib/auth/auth-return-path";
import {
  readGuestListingDraft,
  saveGuestListingDraft,
  type GuestListingDraft,
} from "@/lib/guest/listing-draft";
import type { ModerationImageReference } from "@/lib/moderation/prepare-moderation-images";
import { withCampaignQuery } from "@/lib/promo/campaign-query";
import { readStoredCampaignParams } from "@/lib/promo/campaign-storage";
import {
  MODERATION_CHECKING_UI,
  MODERATION_ENABLED,
  MODERATION_MAX_QUESTIONS,
  MODERATION_TECHNICAL_UI,
  ACCOUNT_SUSPENDED_PATH,
  isHardGateModerationErrorCode,
} from "@/config/moderation";
import {
  LISTING_DURATION_DEFAULT_DAYS,
  LISTING_DURATION_MAX_DAYS,
  LISTING_DURATION_MIN_DAYS,
  LISTING_DURATION_PRESETS,
  LISTING_DESCRIPTION_MAX_LENGTH,
  LISTING_DESCRIPTION_MIN_LENGTH,
  LISTING_EXCHANGE_FOR_MAX_LENGTH,
  EXTERNAL_URL_MAX_LENGTH,
  MODERATION_IMAGE_STAGING_BUCKET,
} from "@/config/app";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CREATE_LISTING_CATEGORY_GRID_TILES } from "@/config/home-category-grid";
import {
  SUGGEST_FROM_PHOTOS_ENABLED,
  SUGGEST_FROM_PHOTOS_UI,
} from "@/config/suggest-from-photos";
import { AiListingPrefillEntry } from "@/components/listing/AiListingPrefillEntry";
import {
  getCategoryConfig,
  getConditionFieldLabel,
  getConditionLabel,
  getDefaultConditionLabel,
  getDefaultPriceType,
  getListingCategoryNotice,
  getListingDescriptionPlaceholder,
  getListingTitlePlaceholder,
  getPriceTypeLabel,
  getSubcategoryLabel,
} from "@/config/categories";
import {
  computeListingExpiresAt,
  formatEventListingVisibleUntilHint,
  getListingExpiryWarning,
  parseMentionedDatesFromText,
} from "@/lib/posts/expiry";
import { parseListingEventDateInput } from "@/lib/posts/format-event-date";
import { LISTING_QUOTA_EXCEEDED_MESSAGE } from "@/lib/listings/quota-shared";
import { toModerationEventDateIso } from "@/lib/posts/listing-form";
import { listingNeedsModeration } from "@/lib/moderation/needs-moderation";
import { invokeModerateListing } from "@/lib/moderation/moderate-listing-client";
import { runListingModeration } from "@/lib/moderation/run-listing-moderation";
import { stripContactInfo } from "@/lib/moderation/strip-contacts";
import {
  formatDoplnitPlaceholders,
  stripDoplnitPlaceholders,
} from "@/lib/listing/strip-doplnit-placeholders";
import { appendQuestionAnswersToDescription } from "@/lib/moderation/append-question-answers";
import {
  ModerationApprovedDialog,
} from "@/components/moderation/ModerationApprovedDialog";
import {
  ModerationPreviewDialog,
  type ModerationPreviewState,
} from "@/components/moderation/ModerationPreviewDialog";
import {
  ModerationRejectedDialog,
  moderationFailureToRejection,
  type ModerationRejectionState,
} from "@/components/moderation/ModerationRejectedDialog";
import {
  dateToDatetimeLocalValue,
  type ListingFormInitialValues,
} from "@/lib/posts/listing-form";
import { validateEventEndDate, validateFutureEventDate } from "@/lib/posts/validation";
import { CONTACT_PHONE_MAX_LENGTH, CONTACT_PHONE_PLACEHOLDER } from "@/lib/posts/contact-phone";
import { formatEmailPreviewForForm } from "@/lib/posts/contact-display";
import { parsePriceInput } from "@/lib/posts/price-input";
import {
  ListingImageUpload,
  type ListingImageUploadHandle,
} from "@/components/listing/ListingImageUpload";
import { LocationInput } from "@/components/listing/LocationInput";
import { JobListingNotice, RealEstateMinorNotice } from "@/components/legal/SafetyNotice";
import { PriceAmountInput } from "@/components/listing/PriceAmountInput";
import { BackButton } from "@/components/navigation/BackLink";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  useCallback,
  type ReactNode,
} from "react";

import {
  listingFormCardClass,
  listingFormCategoryBarClass,
  listingFormContactOptionActiveClass,
  listingFormContactOptionBaseClass,
  listingFormContactOptionIdleClass,
  listingFormContactSectionClass,
  listingFormHintClass,
  listingFormInputClass,
  listingFormLabelClass,
  listingFormPrefillHighlightClass,
  listingFormPrimaryButtonClass,
  listingFormRequiredLegendClass,
  listingFormRequiredMarkClass,
  listingFormSecondaryButtonClass,
  listingFormStepActiveClass,
  listingFormStepInactiveClass,
  LISTING_FORM_DELETE_HINT,
  LISTING_FORM_REQUIRED_LEGEND,
  LISTING_FORM_SAVING_UI,
  LISTING_FORM_STEPPER_MANUAL,
  LISTING_FORM_STEPPER_PHOTO_FIRST,
  LISTING_MULTI_DAY_EVENT_UI,
  LISTING_PRIVATE_EVENT_UI,
} from "@/config/listing-form-ui";
import { EXTERNAL_URL_FIELD_UI } from "@/config/listing-external-url";
import { parseListingExternalUrl } from "@/lib/posts/external-url";
import type { CategoryType, ConditionLabel, ListingImagePreview, PriceType } from "@/types/post";
import Link from "next/link";

type CreateListingFormProps = {
  mode?: "create" | "edit";
  /** Anonymní AI preview — publish až po loginu (FB funnel C). */
  guestMode?: boolean;
  guestVisitorId?: string;
  guestVisitorToken?: string;
  /** Po OAuth — obnov draft z localStorage a doběhni final AI + publish. */
  resumeGuestDraft?: boolean;
  postId?: number;
  initialValues?: ListingFormInitialValues;
  initialImages?: ListingImagePreview[];
  /** E-mail z účtu — náhled v sekci kontaktu. */
  userEmail: string;
  /**
   * H1: inzerát je 'draft' (neúspěšná publikace) — AI moderace musí proběhnout
   * i beze změny obsahu, jinak by nevznikl approval token pro publikaci.
   */
  forceModeration?: boolean;
  /** Vyčerpaný limit — nová publikace se neodešle (AI moderace se nespustí). */
  publishBlockedByQuota?: boolean;
  /** Hint na smazání ve Správě inzerátů — jen vlastník při editaci. */
  showDeleteHint?: boolean;
  /** Hlavička create stránky — zpět závisí na kroku (rozcestník vs úvod). */
  pageHeading?: {
    title: string;
    description: ReactNode;
    afterDescription?: ReactNode;
  };
};

type FormState = CreateListingState | UpdateListingState;

const inputClass = listingFormInputClass;
const labelClass = listingFormLabelClass;
const hintClass = listingFormHintClass;

const errorAlertClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";

const technicalErrorAlertClass =
  "rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950";

/** Hard-hit / NSFW / hard-stop — silnější výstraha než Gemini reject. */
const hardGateErrorAlertClass =
  "rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-950";

function moderationExternalUrl(
  categoryType: CategoryType,
  rawUrl: string | undefined,
): string | undefined {
  if (categoryType !== "udalost" || !rawUrl?.trim()) return undefined;
  const parsed = parseListingExternalUrl(rawUrl);
  return parsed.ok && parsed.url ? parsed.url : undefined;
}

const initialState: FormState = {};

export function CreateListingForm({
  mode = "create",
  guestMode = false,
  guestVisitorId,
  guestVisitorToken,
  resumeGuestDraft = false,
  postId,
  initialValues,
  initialImages = [],
  userEmail,
  forceModeration = false,
  publishBlockedByQuota = false,
  showDeleteHint = false,
  pageHeading,
}: CreateListingFormProps) {
  const isEdit = mode === "edit";
  const formAction = isEdit ? updateListing : createListing;
  const showPrefillChoice =
    SUGGEST_FROM_PHOTOS_ENABLED && !isEdit && Boolean(pageHeading);

  const [state, boundAction, pending] = useActionState(
    formAction,
    initialState,
  );
  const [isModerating, startModerationTransition] = useTransition();
  const [moderationError, setModerationErrorState] = useState<string | null>(
    null,
  );
  /** true = hard gate (HARD_HIT_TEXT / NSFW / blacklist), ne Gemini reasoning. */
  const [moderationErrorHardGate, setModerationErrorHardGate] = useState(false);
  const [moderationRejection, setModerationRejection] =
    useState<ModerationRejectionState | null>(null);
  const [moderationPreview, setModerationPreview] =
    useState<ModerationPreviewState | null>(null);
  const [moderationApprovedOpen, setModerationApprovedOpen] = useState(false);
  const pendingPublishFormRef = useRef<HTMLFormElement | null>(null);
  const formElementRef = useRef<HTMLFormElement | null>(null);
  const [isCheckingAi, setIsCheckingAi] = useState(false);
  const [step, setStep] = useState(
    isEdit ? 2 : SUGGEST_FROM_PHOTOS_ENABLED ? 0 : 1,
  );
  /** Po návštěvě kroku 2 neunmountovat — jinak Upravit kategorii smaže fotky v ListingImageUpload. */
  const [contentStepMounted, setContentStepMounted] = useState(isEdit);
  const [fromAiPrefill, setFromAiPrefill] = useState(false);
  const pendingAiSeedRef = useRef<{
    files: File[];
    stagedPaths: string[];
  } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [guestSession, setGuestSession] = useState<{
    visitorId: string;
    visitorToken: string;
  } | null>(
    guestVisitorId && guestVisitorToken
      ? { visitorId: guestVisitorId, visitorToken: guestVisitorToken }
      : null,
  );
  const [guestBootstrapError, setGuestBootstrapError] = useState<string | null>(
    null,
  );
  const resumeStartedRef = useRef(false);
  const turnstileTokenRef = useRef<string | null>(null);
  const turnstileWidgetRef = useRef<TurnstileWidgetHandle | null>(null);
  const resolvedGuestVisitorId = guestMode
    ? (guestSession?.visitorId ?? guestVisitorId)
    : undefined;
  const resolvedGuestVisitorToken = guestMode
    ? (guestSession?.visitorToken ?? guestVisitorToken)
    : undefined;
  const guestSessionReady = !guestMode || Boolean(resolvedGuestVisitorId);

  const setModerationInlineError = useCallback(
    (message: string | null, hardGate = false) => {
      setModerationErrorState(message);
      setModerationErrorHardGate(Boolean(message && hardGate));
    },
    [],
  );

  useEffect(() => {
    turnstileTokenRef.current = turnstileToken;
  }, [turnstileToken]);

  /** Cookie smí nastavit jen Server Action — ne RSC stránka. */
  useEffect(() => {
    if (!guestMode || guestSession || guestBootstrapError) {
      return;
    }
    let cancelled = false;
    void bootstrapGuestVisitor()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setGuestBootstrapError(result.error);
          return;
        }
        setGuestSession({
          visitorId: result.visitorId,
          visitorToken: result.visitorToken,
        });
        setGuestBootstrapError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setGuestBootstrapError(
            error instanceof Error
              ? error.message
              : "Návštěvnickou relaci se nepodařilo připravit.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guestMode, guestSession, guestBootstrapError]);

  const consumeTurnstileToken = useCallback(() => {
    turnstileTokenRef.current = null;
    setTurnstileToken(null);
    turnstileWidgetRef.current?.reset();
  }, []);

  const handleGuestCaptchaRequired = useCallback(() => {
    setShowCaptcha(true);
  }, []);

  /** Po OAuth: claim staging → final AI → publish (draft je jen UX). */
  useEffect(() => {
    if (!resumeGuestDraft || guestMode || resumeStartedRef.current) {
      return;
    }
    resumeStartedRef.current = true;

    async function resume() {
      const draft = readGuestListingDraft();
      if (!draft) {
        setModerationInlineError(
          "Koncept inzerátu se nepodařilo obnovit. Vyplňte formulář znovu.",
        );
        return;
      }

      if (publishBlockedByQuota) {
        setModerationInlineError(LISTING_QUOTA_EXCEEDED_MESSAGE);
        return;
      }

      setTitle(draft.title);
      setDescription(formatDoplnitPlaceholders(draft.description));
      setCategoryType(draft.categoryType);
      setSubcategorySlug(draft.subcategorySlug);
      if (draft.conditionLabel) {
        setConditionLabel(draft.conditionLabel);
      }
      setPriceType(draft.priceType);
      setPriceAmount(draft.priceAmount);
      setExchangeFor(draft.exchangeFor);
      setLocationText(draft.locationText);
      setLatitude(draft.latitude);
      setLongitude(draft.longitude);
      setEventDate(draft.eventDate);
      setHasEventEndDate(Boolean(draft.eventEndDate?.trim()));
      setEventEndDate(draft.eventEndDate ?? "");
      setIsPrivate(draft.isPrivate === true);
      setListingDurationDays(draft.listingDurationDays);
      setHasExternalUrl(Boolean(draft.externalUrl?.trim()));
      setExternalUrl(draft.externalUrl ?? "");
      setShowContactEmail(draft.showContactEmail);
      setShowContactPhone(draft.showContactPhone);
      setContactPhone(draft.contactPhone);
      setJobCvRequired(draft.jobCvRequired);
      setStep(2);

      setIsCheckingAi(true);
      try {
        let imageReferences: ModerationImageReference[] = (
          draft.claimedPaths ?? []
        ).map((storagePath) => ({
          bucket: MODERATION_IMAGE_STAGING_BUCKET,
          storagePath,
        }));
        let mainImageIndex = draft.mainImageIndex;

        if (!draft.claimDone || imageReferences.length === 0) {
          const claimed = await claimGuestStagingImages({
            storagePaths: draft.stagingPaths,
            mainImageIndex: draft.mainImageIndex,
          });
          if (!claimed.ok) {
            setModerationInlineError(claimed.error);
            return;
          }
          imageReferences = claimed.imageReferences;
          mainImageIndex = claimed.mainImageIndex;
          const draftSaved = saveGuestListingDraft({
            ...draft,
            claimDone: true,
            claimedPaths: claimed.imageReferences.map((ref) => ref.storagePath),
            mainImageIndex: claimed.mainImageIndex,
            savedAt: new Date().toISOString(),
          });
          if (!draftSaved) {
            setModerationInlineError(
              "Koncept se nepodařilo bezpečně uložit. Povolte úložiště prohlížeče a zkuste to znovu.",
            );
            return;
          }
        }

        const finalTitle = stripDoplnitPlaceholders(
          stripContactInfo(draft.title),
        );
        const finalDescription = stripDoplnitPlaceholders(
          stripContactInfo(draft.description),
        );

        const approval = await invokeModerateListing({
          intent: "create",
          issueApproval: true,
          title: finalTitle,
          description: finalDescription,
          categoryType: draft.categoryType,
          subcategorySlug: draft.subcategorySlug,
          conditionLabel: draft.conditionLabel || undefined,
          conditionLabelText: draft.conditionLabel
            ? getConditionLabel(draft.categoryType, draft.conditionLabel)
            : undefined,
          conditionFieldLabel: getConditionFieldLabel(draft.categoryType),
          eventDate:
            draft.categoryType === "udalost" && draft.eventDate
              ? toModerationEventDateIso(draft.eventDate)
              : undefined,
          externalUrl: moderationExternalUrl(
            draft.categoryType,
            draft.externalUrl,
          ),
          priceType: draft.priceType,
          priceTypeLabel: getPriceTypeLabel(draft.categoryType, draft.priceType),
          priceAmount: parsePriceInput(draft.priceAmount) ?? undefined,
          exchangeFor:
            draft.priceType === "exchange" && draft.exchangeFor.trim()
              ? stripContactInfo(draft.exchangeFor.trim())
              : undefined,
          locationText: draft.locationText.trim() || undefined,
          latitude: draft.latitude ?? undefined,
          longitude: draft.longitude ?? undefined,
          listingDurationDays: draft.listingDurationDays,
          showContactEmail: draft.showContactEmail,
          showContactPhone: draft.showContactPhone,
          contactPhone: draft.showContactPhone
            ? draft.contactPhone.trim() || undefined
            : undefined,
          jobCvRequired: draft.categoryType === "prace" && draft.jobCvRequired,
          images:
            imageReferences.length > 0
              ? {
                  imageReferences,
                  mainImageIndex,
                }
              : undefined,
        });

        if (!approval.ok || !approval.approvalToken) {
          if (approval.ok === false && approval.kind === "rejected") {
            setModerationRejection(moderationFailureToRejection(approval));
          } else {
            setModerationInlineError(
              approval.ok === false && approval.kind === "error"
                ? approval.error
                : "AI kontrola nevydala potvrzení. Zkuste to znovu.",
            );
          }
          return;
        }

        const form = formElementRef.current;
        if (!form) {
          setModerationInlineError("Formulář není připravený. Obnovte stránku.");
          return;
        }

        const formData = new FormData(form);
        formData.set("title", finalTitle);
        formData.set("description", finalDescription);
        formData.set("categoryType", draft.categoryType);
        formData.set("subcategorySlug", draft.subcategorySlug);
        formData.set("conditionLabel", draft.conditionLabel || "used");
        formData.set("priceType", draft.priceType);
        formData.set("priceAmount", draft.priceAmount);
        formData.set("exchangeFor", draft.exchangeFor);
        formData.set("locationText", draft.locationText);
        if (draft.latitude != null) {
          formData.set("latitude", String(draft.latitude));
        }
        if (draft.longitude != null) {
          formData.set("longitude", String(draft.longitude));
        }
        formData.set(
          "eventDate",
          toModerationEventDateIso(draft.eventDate) ?? draft.eventDate,
        );
        formData.set(
          "hasEventEndDate",
          draft.categoryType === "udalost" && Boolean(draft.eventEndDate?.trim())
            ? "true"
            : "false",
        );
        formData.set(
          "eventEndDate",
          toModerationEventDateIso(draft.eventEndDate) ?? draft.eventEndDate ?? "",
        );
        formData.set("isPrivate", draft.isPrivate === true ? "true" : "false");
        formData.set("listingDurationDays", String(draft.listingDurationDays));
        formData.set(
          "hasExternalUrl",
          draft.categoryType === "udalost" && Boolean(draft.externalUrl?.trim())
            ? "true"
            : "false",
        );
        formData.set("externalUrl", draft.externalUrl ?? "");
        formData.set(
          "showContactEmail",
          draft.showContactEmail ? "true" : "false",
        );
        formData.set(
          "showContactPhone",
          draft.showContactPhone ? "true" : "false",
        );
        formData.set("contactPhone", draft.contactPhone);
        formData.set(
          "jobCvRequired",
          draft.jobCvRequired ? "true" : "false",
        );
        formData.set("moderationToken", approval.approvalToken);
        formData.set("publishRequestId", draft.publishRequestId);
        formData.set(
          "descriptionAiAssisted",
          draft.preferAi ? "true" : "false",
        );
        if (draft.metaDescription || draft.imageAlt) {
          formData.set("seoFieldsProvided", "true");
          formData.set("metaDescription", draft.metaDescription ?? "");
          formData.set("imageAlt", draft.imageAlt ?? "");
        }

        const orderKeys = imageReferences.map((_, index) => `n:${index}`);
        formData.set("imageOrder", orderKeys.join(","));
        formData.set(
          "mainImageKey",
          orderKeys[mainImageIndex] ?? orderKeys[0] ?? "",
        );
        for (const path of imageReferences.map((ref) => ref.storagePath)) {
          formData.append("stagedImagePath", path);
        }

        // Draft maže až Lead beacon po redirectu (?published=1).
        startModerationTransition(() => {
          boundAction(formData);
        });
      } finally {
        setIsCheckingAi(false);
      }
    }

    void resume();
  }, [boundAction, guestMode, publishBlockedByQuota, resumeGuestDraft]);

  const [categoryType, setCategoryType] = useState<CategoryType>(
    initialValues?.categoryType ?? "ostatni",
  );
  const [subcategorySlug, setSubcategorySlug] = useState(
    initialValues?.subcategorySlug ?? "",
  );
  const [conditionLabel, setConditionLabel] = useState<ConditionLabel | "">(
    initialValues?.conditionLabel ??
      getDefaultConditionLabel(initialValues?.categoryType ?? "ostatni"),
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [locationText, setLocationText] = useState(initialValues?.locationText ?? "");
  const [latitude, setLatitude] = useState<number | null>(
    initialValues?.latitude ?? null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialValues?.longitude ?? null,
  );
  const [priceType, setPriceType] = useState<PriceType>(
    initialValues?.priceType ??
      getDefaultPriceType(initialValues?.categoryType ?? "ostatni"),
  );
  const [priceAmount, setPriceAmount] = useState(initialValues?.priceAmount ?? "");
  const [exchangeFor, setExchangeFor] = useState(initialValues?.exchangeFor ?? "");
  const [listingDurationDays, setListingDurationDays] = useState(
    initialValues?.listingDurationDays ?? LISTING_DURATION_DEFAULT_DAYS,
  );
  const [customDuration, setCustomDuration] = useState(
    initialValues?.customDuration ?? false,
  );
  const [eventDate, setEventDate] = useState(initialValues?.eventDate ?? "");
  const [hasEventEndDate, setHasEventEndDate] = useState(
    Boolean(initialValues?.eventEndDate?.trim()),
  );
  const [eventEndDate, setEventEndDate] = useState(
    initialValues?.eventEndDate ?? "",
  );
  const [isPrivate, setIsPrivate] = useState(
    initialValues?.isPrivate === true,
  );
  const [hasExternalUrl, setHasExternalUrl] = useState(
    Boolean(initialValues?.externalUrl?.trim()),
  );
  const [externalUrl, setExternalUrl] = useState(
    initialValues?.externalUrl ?? "",
  );
  const [showContactEmail, setShowContactEmail] = useState(
    initialValues?.showContactEmail ?? false,
  );
  const [showContactPhone, setShowContactPhone] = useState(
    initialValues?.showContactPhone ?? false,
  );
  const [contactPhone, setContactPhone] = useState(
    initialValues?.contactPhone ?? "",
  );
  const [jobCvRequired, setJobCvRequired] = useState(
    initialValues?.jobCvRequired ?? false,
  );
  const submitErrorRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<ListingImageUploadHandle>(null);

  useEffect(() => {
    if (step === 2) {
      setContentStepMounted(true);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 2 || !pendingAiSeedRef.current) return;
    let cancelled = false;

    const trySeed = () => {
      if (cancelled || !pendingAiSeedRef.current) return;
      const handle = imageUploadRef.current;
      if (!handle) {
        requestAnimationFrame(trySeed);
        return;
      }
      const pending = pendingAiSeedRef.current;
      pendingAiSeedRef.current = null;
      void handle.seedNewImages({
        files: pending.files,
        stagedPaths: pending.stagedPaths.every((path) => Boolean(path))
          ? pending.stagedPaths
          : undefined,
        mainIndex: 0,
      });
    };

    trySeed();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const category = getCategoryConfig(categoryType);
  const emailPreview = formatEmailPreviewForForm(userEmail);

  function buildGuestDraftPayload(overrides?: {
    aiTitle?: string;
    aiDescription?: string;
    metaDescription?: string;
    imageAlt?: string;
    preferAi?: boolean;
  }): GuestListingDraft | null {
    const visitorId = resolvedGuestVisitorId;
    if (!visitorId) {
      return null;
    }
    const preferAi = overrides?.preferAi === true;
    const draftTitle = preferAi
      ? (overrides?.aiTitle ?? title.trim())
      : title.trim();
    const draftDescription = preferAi
      ? (overrides?.aiDescription ?? description.trim())
      : description.trim();
    return {
      version: 1,
      visitorId,
      publishRequestId: crypto.randomUUID(),
      title: draftTitle,
      description: draftDescription,
      categoryType,
      subcategorySlug,
      conditionLabel,
      priceType,
      priceAmount,
      exchangeFor,
      locationText,
      latitude,
      longitude,
      eventDate,
      eventEndDate:
        categoryType === "udalost" && hasEventEndDate ? eventEndDate : "",
      isPrivate: categoryType === "udalost" && isPrivate,
      listingDurationDays,
      showContactEmail,
      showContactPhone,
      contactPhone,
      jobCvRequired,
      externalUrl:
        categoryType === "udalost" && hasExternalUrl
          ? externalUrl.trim()
          : "",
      stagingPaths: imageUploadRef.current?.getGuestStagingPaths() ?? [],
      mainImageIndex: imageUploadRef.current?.getMainImageIndex() ?? 0,
      aiTitle: overrides?.aiTitle,
      aiDescription: overrides?.aiDescription,
      metaDescription: overrides?.metaDescription,
      imageAlt: overrides?.imageAlt,
      preferAi: overrides?.preferAi,
      savedAt: new Date().toISOString(),
    };
  }

  function redirectGuestToAuth() {
    const resume = `/inzerat/novy?${GUEST_LISTING_RESUME_QUERY}=1`;
    const next = withCampaignQuery(resume, readStoredCampaignParams());
    storeAuthReturnPath(next);
    window.location.assign(
      `/login?next=${encodeURIComponent(next)}&message=create_listing&tab=register`,
    );
  }

  function gateGuestPublish(overrides?: {
    aiTitle?: string;
    aiDescription?: string;
    metaDescription?: string;
    imageAlt?: string;
    preferAi?: boolean;
  }): boolean {
    if (!guestMode) {
      return false;
    }
    const draft = buildGuestDraftPayload(overrides);
    if (!draft) {
      setModerationInlineError("Obnovte stránku a zkuste to znovu.");
      return true;
    }
    if (!saveGuestListingDraft(draft)) {
      setModerationInlineError(
        "Koncept se nepodařilo uložit. Povolte úložiště prohlížeče a zkuste to znovu.",
      );
      return true;
    }
    redirectGuestToAuth();
    return true;
  }

  useEffect(() => {
    if (!state.error || step !== 2) return;
    setModerationPreview(null);
    setModerationApprovedOpen(false);
    pendingPublishFormRef.current = null;
    submitErrorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [state.error, step]);

  useEffect(() => {
    if (!moderationError || step !== 2) return;
    submitErrorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [moderationError, step]);

  const isEvent = categoryType === "udalost";
  const isJob = categoryType === "prace";
  const isService = categoryType === "sluzby";
  const isRecurringEvent = isEvent && conditionLabel === "long_term";

  const titlePlaceholder = useMemo(
    () =>
      getListingTitlePlaceholder(categoryType, subcategorySlug, {
        isRecurringEvent,
      }),
    [categoryType, subcategorySlug, isRecurringEvent],
  );

  const descriptionPlaceholder = useMemo(
    () =>
      getListingDescriptionPlaceholder(categoryType, subcategorySlug, {
        isRecurringEvent,
      }),
    [categoryType, subcategorySlug, isRecurringEvent],
  );

  const subcategories = category.subcategories;

  const selectedSubcategory = useMemo(
    () => getSubcategoryLabel(categoryType, subcategorySlug),
    [categoryType, subcategorySlug],
  );

  const isRealEstate = categoryType === "nemovitost";

  const listingCategoryNotice = useMemo(
    () =>
      subcategorySlug
        ? getListingCategoryNotice(categoryType, subcategorySlug)
        : undefined,
    [categoryType, subcategorySlug],
  );

  const expiryWarning = useMemo(() => {
    if (isEvent) return null;
    return getListingExpiryWarning(
      listingDurationDays,
      parseMentionedDatesFromText(description),
    );
  }, [description, isEvent, listingDurationDays]);

  const eventVisibleUntilHint = useMemo(() => {
    if (!isEvent || !eventDate) return null;
    const start = parseListingEventDateInput(eventDate);
    if (!start) return null;
    const end =
      !isRecurringEvent && hasEventEndDate
        ? parseListingEventDateInput(eventEndDate)
        : null;
    return formatEventListingVisibleUntilHint(end ?? start);
  }, [eventDate, eventEndDate, hasEventEndDate, isEvent, isRecurringEvent]);

  const expiresPreview = useMemo(() => {
    if (isEvent) return null;
    return computeListingExpiresAt(listingDurationDays).toLocaleDateString(
      "cs-CZ",
    );
  }, [isEvent, listingDurationDays]);

  const titleTrimmed = title.trim();
  const descriptionTrimmed = description.trim();
  const hasLocation =
    latitude != null &&
    longitude != null &&
    locationText.trim().length > 0;
  const selectedConditionLabel = category.conditionLabels.find(
    (option) => option.value === conditionLabel,
  )?.value;
  const hasCondition = selectedConditionLabel != null;
  const isTitleValid = titleTrimmed.length >= 1 && title.length <= 80;
  const isDescriptionValid =
    descriptionTrimmed.length >= LISTING_DESCRIPTION_MIN_LENGTH &&
    description.length <= LISTING_DESCRIPTION_MAX_LENGTH;
  const needsPriceAmount =
    priceType === "fixed" || priceType === "negotiable";
  const parsedPriceAmount = parsePriceInput(priceAmount);
  const isPriceValid =
    !needsPriceAmount ||
    (parsedPriceAmount != null &&
      parsedPriceAmount >= (priceType === "negotiable" ? 1 : 0));
  const eventDateValidation = useMemo(() => {
    if (!isEvent) return { ok: true as const };
    return validateFutureEventDate(eventDate, {
      existingEventDate: isEdit ? initialValues?.eventDate : undefined,
    });
  }, [eventDate, initialValues?.eventDate, isEdit, isEvent]);
  const isEventDateValid = eventDateValidation.ok;
  const eventDateError = eventDateValidation.ok
    ? null
    : eventDateValidation.error;
  const eventEndDateValidation = useMemo(() => {
    if (!isEvent || isRecurringEvent || !hasEventEndDate) {
      return { ok: true as const };
    }
    const start = parseListingEventDateInput(eventDate);
    if (!start) {
      return { ok: false as const, error: "Zadejte datum a čas akce." };
    }
    return validateEventEndDate(eventEndDate, start, {
      existingEventEndDate: isEdit ? initialValues?.eventEndDate : undefined,
    });
  }, [
    eventDate,
    eventEndDate,
    hasEventEndDate,
    initialValues?.eventEndDate,
    isEdit,
    isEvent,
    isRecurringEvent,
  ]);
  const isEventEndDateValid = eventEndDateValidation.ok;
  const eventEndDateError = eventEndDateValidation.ok
    ? null
    : eventEndDateValidation.error;
  const eventDateMin = useMemo(
    () => (mode === "create" ? dateToDatetimeLocalValue(new Date()) : undefined),
    [mode],
  );
  const externalUrlCheck = (() => {
    if (!isEvent || !hasExternalUrl) {
      return { ok: true as const, error: null as string | null };
    }
    const parsed = parseListingExternalUrl(externalUrl);
    if (!parsed.ok) {
      return { ok: false as const, error: parsed.error };
    }
    if (!parsed.url) {
      return { ok: false as const, error: EXTERNAL_URL_FIELD_UI.required };
    }
    return { ok: true as const, error: null as string | null };
  })();
  const isExternalUrlValid = externalUrlCheck.ok;
  const canPublish =
    hasLocation &&
    hasCondition &&
    isTitleValid &&
    isDescriptionValid &&
    isPriceValid &&
    isEventDateValid &&
    isEventEndDateValid &&
    isExternalUrlValid;

  const showPrefillConditionHighlight = fromAiPrefill && !hasCondition;
  const showPrefillLocationHighlight = fromAiPrefill && !hasLocation;
  const showPrefillPriceHighlight = fromAiPrefill && !isPriceValid;
  const showPrefillMissingFieldsHint =
    fromAiPrefill &&
    (showPrefillConditionHighlight ||
      showPrefillLocationHighlight ||
      showPrefillPriceHighlight);

  const missingPublishFields = (() => {
    const missing: string[] = [];
    if (!hasLocation) missing.push("lokalitu (vyberte z našeptávače)");
    if (!hasCondition) {
      missing.push(getConditionFieldLabel(categoryType).toLowerCase());
    }
    if (!isTitleValid) missing.push("název");
    if (!isDescriptionValid) missing.push("popis");
    if (!isPriceValid) missing.push("cenu");
    if (!isEventDateValid) missing.push("datum události");
    if (!isEventEndDateValid) missing.push("datum konce akce");
    if (!isExternalUrlValid) missing.push("odkaz na web nebo sociální síť");
    return missing;
  })();

  const missingPublishFieldsLabel = (() => {
    if (missingPublishFields.length === 0) return "";
    if (missingPublishFields.length === 1) {
      return `Doplňte: ${missingPublishFields[0]}.`;
    }
    if (missingPublishFields.length === 2) {
      return `Doplňte: ${missingPublishFields[0]} a ${missingPublishFields[1]}.`;
    }
    const head = missingPublishFields.slice(0, -1).join(", ");
    const last = missingPublishFields[missingPublishFields.length - 1];
    return `Doplňte: ${head} a ${last}.`;
  })();

  function handleCategoryChange(type: CategoryType) {
    setCategoryType(type);
    // U6: nevybírat automaticky první podkategorii — uživatel musí zvolit.
    setSubcategorySlug("");
    setConditionLabel(
      fromAiPrefill ? "" : getDefaultConditionLabel(type),
    );
    setPriceType(getDefaultPriceType(type));
    if (type !== "prace") {
      setJobCvRequired(false);
    }
  }

  function canGoStep2(): boolean {
    return Boolean(subcategorySlug);
  }

  function handleAiPrefillSuccess(result: {
    title: string;
    description: string;
    categoryType: CategoryType;
    subcategorySlug: string | null;
    files: File[];
    stagedPaths: string[];
  }) {
    setTitle(stripContactInfo(result.title));
    setDescription(
      formatDoplnitPlaceholders(stripContactInfo(result.description)),
    );
    setCategoryType(result.categoryType);
    setConditionLabel("");
    setPriceType(getDefaultPriceType(result.categoryType));
    setSubcategorySlug(result.subcategorySlug ?? "");
    setFromAiPrefill(true);
    pendingAiSeedRef.current = {
      files: result.files,
      stagedPaths: result.stagedPaths,
    };
    if (result.subcategorySlug) {
      setStep(2);
    } else {
      setStep(1);
    }
  }

  function publishListing(
    form: HTMLFormElement,
    titleValue: string,
    descriptionValue: string,
    approvalToken?: string,
    originalSnapshot?: { title: string; description: string },
    options?: {
      descriptionAiAssisted?: boolean;
      seoFields?: {
        metaDescription: string | null;
        imageAlt: string | null;
      };
    },
  ) {
    const formData = new FormData(form);
    formData.set("title", titleValue);
    formData.set("description", descriptionValue);
    if (originalSnapshot) {
      formData.set("originalTitle", originalSnapshot.title);
      formData.set("originalDescription", originalSnapshot.description);
      formData.set(
        "descriptionAiAssisted",
        options?.descriptionAiAssisted ? "true" : "false",
      );
    }
    if (options?.seoFields) {
      formData.set("seoFieldsProvided", "true");
      formData.set(
        "metaDescription",
        options.seoFields.metaDescription ?? "",
      );
      formData.set("imageAlt", options.seoFields.imageAlt ?? "");
    }
    if (approvalToken) {
      formData.set("moderationToken", approvalToken);
    }
    setTitle(titleValue);
    setDescription(descriptionValue);
    imageUploadRef.current?.appendToFormData(formData);

    startModerationTransition(() => {
      boundAction(formData);
    });
  }

  function handlePreviewClose() {
    if (pending || isModerating) return;
    setModerationPreview(null);
    setModerationApprovedOpen(false);
    pendingPublishFormRef.current = null;
  }

  function handleModerationApprovedContinue() {
    setModerationApprovedOpen(false);
  }

  async function requestFinalApproval(
    titleValue: string,
    descriptionValue: string,
  ): Promise<string | null> {
    let moderationImages;
    try {
      setIsCheckingAi(true);
      moderationImages =
        (await imageUploadRef.current?.getModerationImages()) ?? undefined;
    } catch (imagePrepError) {
      setModerationInlineError(
        imagePrepError instanceof Error
          ? imagePrepError.message
          : "Fotky se nepodařilo připravit pro AI kontrolu.",
      );
      return null;
    }

    try {
      const result = await invokeModerateListing({
        intent: isEdit ? "update" : "create",
        issueApproval: true,
        title: stripContactInfo(titleValue),
        description: stripContactInfo(descriptionValue),
        categoryType,
        subcategorySlug,
        conditionLabel: selectedConditionLabel,
        conditionLabelText: selectedConditionLabel
          ? getConditionLabel(categoryType, selectedConditionLabel)
          : undefined,
        conditionFieldLabel: getConditionFieldLabel(categoryType),
        eventDate: isEvent ? toModerationEventDateIso(eventDate) : undefined,
        externalUrl: moderationExternalUrl(
          categoryType,
          hasExternalUrl ? externalUrl : undefined,
        ),
        priceType,
        priceTypeLabel: getPriceTypeLabel(categoryType, priceType),
        priceAmount:
          parsedPriceAmount != null &&
          (priceType === "fixed" || priceType === "negotiable")
            ? parsedPriceAmount
            : undefined,
        exchangeFor:
          priceType === "exchange" && exchangeFor.trim()
            ? stripContactInfo(exchangeFor.trim())
            : undefined,
        locationText: locationText.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        listingDurationDays: isEvent
          ? LISTING_DURATION_DEFAULT_DAYS
          : listingDurationDays,
        showContactEmail,
        showContactPhone,
        contactPhone:
          showContactPhone && contactPhone.trim()
            ? contactPhone.trim().replace(/\s+/g, " ")
            : undefined,
        jobCvRequired: categoryType === "prace" && jobCvRequired,
        images: moderationImages,
      });

      if (!result.ok) {
        if (result.accountBlocked) {
          window.location.assign(ACCOUNT_SUSPENDED_PATH);
          return null;
        }
        // Zavři náhled — jinak je reject/chyba schovaná pod modalem.
        setModerationPreview(null);
        setModerationApprovedOpen(false);
        setTitle(titleValue);
        setDescription(descriptionValue);
        const rejection = moderationFailureToRejection(result);
        if (rejection) {
          setModerationRejection(rejection);
        } else {
          setModerationInlineError(result.kind === "error" ? result.error : null);
        }
        return null;
      }

      if (!result.approvalToken) {
        setModerationPreview(null);
        setModerationApprovedOpen(false);
        setTitle(titleValue);
        setDescription(descriptionValue);
        setModerationInlineError(
          "AI kontrola nevydala potvrzení pro publikaci. Zkuste to prosím znovu.",
        );
        return null;
      }

      return result.approvalToken;
    } finally {
      setIsCheckingAi(false);
    }
  }

  async function handlePublishOriginalFromPreview() {
    const form = pendingPublishFormRef.current;
    const preview = moderationPreview;
    if (!form || !preview) return;

    const finalTitle = stripDoplnitPlaceholders(
      stripContactInfo(preview.originalTitle),
    );
    const finalDescription = stripDoplnitPlaceholders(
      stripContactInfo(preview.originalDescription),
    );

    if (
      gateGuestPublish({
        aiTitle: preview.aiTitle,
        aiDescription: preview.aiDescription,
        preferAi: false,
      })
    ) {
      return;
    }

    const approvalToken = await requestFinalApproval(
      finalTitle,
      finalDescription,
    );
    if (!approvalToken) return;

    publishListing(
      form,
      finalTitle,
      finalDescription,
      approvalToken,
      {
        title: preview.originalTitle,
        description: preview.originalDescription,
      },
      {
        descriptionAiAssisted: false,
        seoFields: { metaDescription: null, imageAlt: null },
      },
    );
    // Náhled necháváme do redirectu / state.error (useEffect) — při chybě Server
    // Action by předčasné zavření skrylo důvod selhání.
  }

  async function handlePublishAiFromPreview(payload: {
    title: string;
    description: string;
    metaDescription?: string;
    imageAlt?: string;
    questionAnswers: Record<string, string>;
  }) {
    const form = pendingPublishFormRef.current;
    const preview = moderationPreview;
    if (!form || !preview) return;

    const finalTitle = stripDoplnitPlaceholders(stripContactInfo(payload.title));
    const finalDescription = stripDoplnitPlaceholders(
      stripContactInfo(
        appendQuestionAnswersToDescription(
          payload.description,
          preview.questions.slice(0, MODERATION_MAX_QUESTIONS),
          payload.questionAnswers,
        ),
      ),
    );

    if (
      gateGuestPublish({
        aiTitle: finalTitle,
        aiDescription: finalDescription,
        metaDescription: payload.metaDescription,
        imageAlt: payload.imageAlt,
        preferAi: true,
      })
    ) {
      return;
    }
    const approvalToken = await requestFinalApproval(
      finalTitle,
      finalDescription,
    );
    if (!approvalToken) return;

    publishListing(
      form,
      finalTitle,
      finalDescription,
      approvalToken,
      {
        title: preview.originalTitle,
        description: preview.originalDescription,
      },
      {
        descriptionAiAssisted: true,
        seoFields: {
          metaDescription: payload.metaDescription?.trim() || null,
          imageAlt: payload.imageAlt?.trim() || null,
        },
      },
    );
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModerationInlineError(null);
    setModerationRejection(null);
    setModerationPreview(null);
    setModerationApprovedOpen(false);

    if (publishBlockedByQuota) {
      setModerationInlineError(LISTING_QUOTA_EXCEEDED_MESSAGE);
      submitErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      return;
    }

    if (isEvent && !isEventDateValid) {
      return;
    }
    if (isEvent && !isEventEndDateValid) {
      return;
    }

    const form = event.currentTarget;
    pendingPublishFormRef.current = form;

    let moderationImages;
    try {
      setIsCheckingAi(true);
      moderationImages =
        (await imageUploadRef.current?.getModerationImages()) ?? undefined;
    } catch (imagePrepError) {
      setIsCheckingAi(false);
      setModerationInlineError(
        imagePrepError instanceof Error
          ? imagePrepError.message
          : "Fotky se nepodařilo připravit pro AI kontrolu.",
      );
      submitErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      return;
    }

    let moderation;
    try {
      moderation = await runListingModeration({
        intent: isEdit ? "update" : "create",
        issueApproval: false,
        guestVisitorId: guestMode ? resolvedGuestVisitorId : undefined,
        guestVisitorToken: guestMode ? resolvedGuestVisitorToken : undefined,
        turnstileToken: guestMode
          ? (turnstileTokenRef.current ?? undefined)
          : undefined,
        title: titleTrimmed,
        description: descriptionTrimmed,
        categoryType,
        subcategorySlug,
        conditionLabel: selectedConditionLabel,
        conditionLabelText: selectedConditionLabel
          ? getConditionLabel(categoryType, selectedConditionLabel)
          : undefined,
        conditionFieldLabel: getConditionFieldLabel(categoryType),
        eventDate: isEvent ? toModerationEventDateIso(eventDate) : undefined,
        externalUrl: moderationExternalUrl(
          categoryType,
          hasExternalUrl ? externalUrl : undefined,
        ),
        priceType,
        priceTypeLabel: getPriceTypeLabel(categoryType, priceType),
        priceAmount:
          parsedPriceAmount != null &&
          (priceType === "fixed" || priceType === "negotiable")
            ? parsedPriceAmount
            : undefined,
        exchangeFor:
          priceType === "exchange" && exchangeFor.trim()
            ? stripContactInfo(exchangeFor.trim())
            : undefined,
        locationText: locationText.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        listingDurationDays: isEvent
          ? LISTING_DURATION_DEFAULT_DAYS
          : listingDurationDays,
        showContactEmail,
        showContactPhone,
        contactPhone:
          showContactPhone && contactPhone.trim()
            ? contactPhone.trim().replace(/\s+/g, " ")
            : undefined,
        jobCvRequired: categoryType === "prace" && jobCvRequired,
        // Bez initialValues se u draftu nevyhodnotí „beze změny → přeskočit AI“
        // a moderace (→ approval token) proběhne vždy.
        initialValues: isEdit && !forceModeration ? initialValues : undefined,
        imagesChanged: isEdit
          ? (imageUploadRef.current?.hasImageChanges() ?? false)
          : false,
        images: moderationImages,
      });
    } finally {
      setIsCheckingAi(false);
    }

    if (guestMode && turnstileTokenRef.current) {
      consumeTurnstileToken();
    }

    if (!moderation.ok) {
      if (moderation.accountBlocked) {
        window.location.assign(ACCOUNT_SUSPENDED_PATH);
        return;
      }
      if (
        moderation.kind === "error" &&
        (moderation.error.toLowerCase().includes("robot") ||
          moderation.error.toLowerCase().includes("captcha"))
      ) {
        setShowCaptcha(true);
      }
      const rejection = moderationFailureToRejection(moderation);
      if (rejection) {
        setModerationRejection(rejection);
        if (
          typeof rejection.rejectedImageIndex === "number" &&
          rejection.rejectedImageIndex >= 0
        ) {
          imageUploadRef.current?.highlightRejectedImage(
            rejection.rejectedImageIndex,
          );
        }
        return;
      }

      setModerationInlineError(
        moderation.kind === "error" ? moderation.error : null,
      );
      submitErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      return;
    }

    if (moderation.skipped || !MODERATION_ENABLED) {
      const imagesChanged =
        isEdit && (imageUploadRef.current?.hasImageChanges() ?? false);
      const shouldPersistOriginals =
        !isEdit ||
        !initialValues ||
        listingNeedsModeration(
          {
            title: titleTrimmed,
            description: descriptionTrimmed,
            categoryType,
            subcategorySlug,
            conditionLabel,
            priceType,
            priceAmount,
            exchangeFor: priceType === "exchange" ? exchangeFor : "",
            locationText,
            latitude,
            longitude,
            eventDate: isEvent ? eventDate : null,
            listingDurationDays,
            showContactEmail,
            showContactPhone,
            contactPhone: showContactPhone ? contactPhone : "",
            jobCvRequired: categoryType === "prace" && jobCvRequired,
          },
          initialValues,
        ) ||
        imagesChanged;

      publishListing(
        form,
        moderation.cleanedTitle ?? titleTrimmed,
        moderation.cleanedDescription ?? descriptionTrimmed,
        undefined,
        shouldPersistOriginals
          ? {
              title: titleTrimmed,
              description: descriptionTrimmed,
            }
          : undefined,
      );
      pendingPublishFormRef.current = null;
      return;
    }

    setModerationPreview({
      originalTitle: titleTrimmed,
      originalDescription: descriptionTrimmed,
      aiTitle: moderation.cleanedTitle ?? titleTrimmed,
      aiDescription: moderation.cleanedDescription ?? descriptionTrimmed,
      metaDescription: moderation.metaDescription,
      imageAlt: moderation.imageAlt,
      questions: moderation.questions ?? [],
      imageCount: moderationImages?.imageReferences.length ?? 0,
    });
    setModerationApprovedOpen(true);
  }

  const isSaving = pending || isModerating || isCheckingAi;

  /** Orientační chipy 4/5 — ne form `step`. */
  const isPublishStepActive = pending;
  const isAiStepActive =
    !isPublishStepActive &&
    (isCheckingAi ||
      Boolean(moderationPreview) ||
      moderationApprovedOpen ||
      isModerating);
  const photoFirstStepper = SUGGEST_FROM_PHOTOS_ENABLED && !isEdit;
  const stepperLabels = photoFirstStepper
    ? LISTING_FORM_STEPPER_PHOTO_FIRST
    : LISTING_FORM_STEPPER_MANUAL;
  const formStepIndex = photoFirstStepper
    ? step
    : step === 1
      ? 0
      : step === 2
        ? 1
        : -1;
  const aiLabelIndex = photoFirstStepper ? 3 : 2;
  const publishLabelIndex = photoFirstStepper ? 4 : 3;

  return (
    <>
      <ModerationRejectedDialog
        rejection={moderationRejection}
        onClose={() => {
          if (moderationRejection?.reason) {
            setModerationInlineError(
              moderationRejection.reason,
              isHardGateModerationErrorCode(moderationRejection.errorCode),
            );
          }
          setModerationRejection(null);
        }}
      />

      <ModerationApprovedDialog
        open={moderationApprovedOpen}
        isEdit={isEdit}
        onContinue={handleModerationApprovedContinue}
      />

      <ModerationPreviewDialog
        preview={moderationApprovedOpen ? null : moderationPreview}
        publishing={pending || isModerating}
        onClose={handlePreviewClose}
        onPublishAi={handlePublishAiFromPreview}
        onPublishOriginal={handlePublishOriginalFromPreview}
      />

      {isSaving ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px]"
            aria-hidden
          />
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-xl"
          >
            <Loader2
              className="mx-auto h-10 w-10 animate-spin text-blue-700"
              aria-hidden
            />
            {isCheckingAi ? (
              <>
                <p className="mt-4 text-base font-semibold text-neutral-900">
                  {MODERATION_CHECKING_UI.title}
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  {MODERATION_CHECKING_UI.hint}
                </p>
                <p className="mt-3 text-xs text-neutral-500">
                  {MODERATION_CHECKING_UI.disclaimer}
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-base font-semibold text-neutral-900">
                  {isEdit
                    ? LISTING_FORM_SAVING_UI.titleEdit
                    : LISTING_FORM_SAVING_UI.title}
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  {LISTING_FORM_SAVING_UI.hint}
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {pageHeading ? (
        <div className="mb-6">
          {showPrefillChoice && step > 0 ? (
            <BackButton
              label="Zpět na výběr způsobu"
              gtmId={GTM_CTA.CREATE_BACK_HOME}
              onClick={() => setStep(0)}
            />
          ) : (
            <BackHomeLink />
          )}
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            {pageHeading.title}
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            {pageHeading.description}
          </div>
          {pageHeading.afterDescription}
        </div>
      ) : null}

      <form
        ref={formElementRef}
        onSubmit={handleFormSubmit}
        encType="multipart/form-data"
        className="space-y-6"
      >
      {isEdit && postId ? (
        <input type="hidden" name="postId" value={postId} />
      ) : null}
      <input type="hidden" name="categoryType" value={categoryType} />
      <input type="hidden" name="subcategorySlug" value={subcategorySlug} />
      <input type="hidden" name="conditionLabel" value={conditionLabel} />
      <input type="hidden" name="latitude" value={latitude ?? ""} />
      <input type="hidden" name="longitude" value={longitude ?? ""} />
      {!isEvent ? (
        <input
          type="hidden"
          name="listingDurationDays"
          value={listingDurationDays}
        />
      ) : null}
      {isEvent ? (
        <>
          <input
            type="hidden"
            name="eventDate"
            value={toModerationEventDateIso(eventDate) ?? eventDate}
          />
          <input
            type="hidden"
            name="hasEventEndDate"
            value={
              !isRecurringEvent && hasEventEndDate ? "true" : "false"
            }
          />
          <input
            type="hidden"
            name="eventEndDate"
            value={
              !isRecurringEvent && hasEventEndDate
                ? (toModerationEventDateIso(eventEndDate) ?? eventEndDate)
                : ""
            }
          />
          <input
            type="hidden"
            name="isPrivate"
            value={isPrivate ? "true" : "false"}
          />
        </>
      ) : null}

      <nav aria-label="Kroky formuláře" className="flex items-center gap-2 text-sm">
        <ol className="flex flex-wrap items-center gap-2">
          {stepperLabels.map((label, index) => {
            const isActive =
              index === aiLabelIndex
                ? isAiStepActive
                : index === publishLabelIndex
                  ? isPublishStepActive
                  : !isAiStepActive &&
                    !isPublishStepActive &&
                    index === formStepIndex;

            return (
              <li key={label} className="flex items-center gap-2">
                {index > 0 ? (
                  <span
                    className={listingFormStepInactiveClass}
                    aria-hidden="true"
                  >
                    →
                  </span>
                ) : null}
                <span
                  className={
                    isActive
                      ? listingFormStepActiveClass
                      : listingFormStepInactiveClass
                  }
                  aria-current={isActive ? "step" : undefined}
                >
                  {index + 1}. {label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 0 && SUGGEST_FROM_PHOTOS_ENABLED ? (
        <AiListingPrefillEntry
          guestMode={guestMode}
          guestVisitorId={resolvedGuestVisitorId}
          guestVisitorToken={resolvedGuestVisitorToken}
          guestSessionReady={guestSessionReady}
          onPrefillSuccess={handleAiPrefillSuccess}
          onChooseManual={() => {
            setFromAiPrefill(false);
            pendingAiSeedRef.current = null;
            setStep(1);
          }}
        />
      ) : null}

      {step === 1 ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          {SUGGEST_FROM_PHOTOS_ENABLED && !isEdit ? (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              Zpět na výběr způsobu
            </button>
          ) : null}

          {fromAiPrefill && !subcategorySlug ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              AI navrhla kategorii, ale podkategorie není jistá — vyberte ji
              prosím ručně. Název a popis už jsou připravené.
            </p>
          ) : null}

          <div>
            <span className={labelClass}>Hlavní kategorie</span>
            <div className="mt-2">
              <CategoryGrid
                tiles={CREATE_LISTING_CATEGORY_GRID_TILES}
                selected={categoryType}
                onSelect={(id) => handleCategoryChange(id as CategoryType)}
                variant="plain"
                bundlePrompt="Co nabízíte?"
                tileProps={(id) =>
                  gtmCtaProps(GTM_CTA.CREATE_SELECT_CATEGORY, {
                    category: id,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label htmlFor="subcategory" className={labelClass}>
              Podkategorie
            </label>
            <select
              id="subcategory"
              className={inputClass}
              value={subcategorySlug}
              onChange={(e) => setSubcategorySlug(e.target.value)}
            >
              <option value="">— vyberte —</option>
              {subcategories.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {isRealEstate ? <RealEstateMinorNotice /> : null}
          {isJob ? <JobListingNotice /> : null}

          {listingCategoryNotice ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              {listingCategoryNotice}
            </p>
          ) : null}

          <button
            type="button"
            {...gtmCtaProps(GTM_CTA.CREATE_STEP_CONTINUE)}
            disabled={!canGoStep2()}
            onClick={() => setStep(2)}
            className={`flex w-full items-center justify-center gap-2 ${listingFormPrimaryButtonClass}`}
          >
            Pokračovat
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {contentStepMounted ? (
        <div
          className={
            step === 2 ? listingFormCardClass : "hidden"
          }
          aria-hidden={step !== 2}
        >
          {showPrefillMissingFieldsHint ? (
            <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
              {SUGGEST_FROM_PHOTOS_UI.missingFieldsHint.beforeWorking}
              <strong>
                {SUGGEST_FROM_PHOTOS_UI.missingFieldsHint.working}
              </strong>
              {SUGGEST_FROM_PHOTOS_UI.missingFieldsHint.afterWorking}
              <strong>
                {SUGGEST_FROM_PHOTOS_UI.missingFieldsHint.doplnte}
              </strong>
              {SUGGEST_FROM_PHOTOS_UI.missingFieldsHint.afterDoplnte}
              <strong>
                {SUGGEST_FROM_PHOTOS_UI.missingFieldsHint.nextStep}
              </strong>
            </p>
          ) : null}

          <div className={listingFormCategoryBarClass}>
            <p>
              <span className="font-semibold text-neutral-900">
                Kategorie: {category.label} · {selectedSubcategory.label}
              </span>
            </p>
            <button
              type="button"
              {...gtmCtaProps(GTM_CTA.CREATE_EDIT_CATEGORY)}
              onClick={() => setStep(1)}
              className="shrink-0 font-semibold text-blue-800 underline-offset-2 hover:underline"
            >
              Upravit
            </button>
          </div>

          {isRealEstate ? <RealEstateMinorNotice /> : null}
          {isJob ? <JobListingNotice /> : null}

          {listingCategoryNotice ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              {listingCategoryNotice}
            </p>
          ) : null}

          <div>
            <label htmlFor="title" className={labelClass}>
              Název inzerátu
              <span className={listingFormRequiredMarkClass} aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              aria-invalid={title.length > 0 && !isTitleValid}
              placeholder={titlePlaceholder}
            />
            <p className={hintClass}>{title.length}/80</p>
            {title.length > 0 && !isTitleValid ? (
              <p className="mt-1 text-xs text-red-600">
                Název musí mít 1–80 znaků (nesmí být jen mezery).
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Popis
              <span className={listingFormRequiredMarkClass} aria-hidden="true">
                *
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              minLength={LISTING_DESCRIPTION_MIN_LENGTH}
              maxLength={LISTING_DESCRIPTION_MAX_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              aria-invalid={description.length > 0 && !isDescriptionValid}
              placeholder={descriptionPlaceholder}
            />
            <p className={hintClass}>
              {description.length}/{LISTING_DESCRIPTION_MAX_LENGTH}
              {descriptionTrimmed.length > 0 &&
              descriptionTrimmed.length < LISTING_DESCRIPTION_MIN_LENGTH
                ? ` · ještě ${LISTING_DESCRIPTION_MIN_LENGTH - descriptionTrimmed.length}`
                : ""}
            </p>
            {description.length > 0 && !isDescriptionValid ? (
              <p className="mt-1 text-xs text-red-600">
                Popis musí mít {LISTING_DESCRIPTION_MIN_LENGTH}–
                {LISTING_DESCRIPTION_MAX_LENGTH} znaků.
              </p>
            ) : null}
            {expiryWarning ? (
              <p className="mt-2 text-sm text-amber-800">{expiryWarning}</p>
            ) : null}
          </div>

          {guestBootstrapError ? (
            <p className={errorAlertClass} role="alert">
              {guestBootstrapError}
            </p>
          ) : null}

          {!guestSessionReady && guestMode && !guestBootstrapError ? (
            <p className="text-sm text-gray-600" aria-live="polite">
              Připravuji nahrávání fotek…
            </p>
          ) : null}

          <ListingImageUpload
            ref={imageUploadRef}
            initialImages={initialImages}
            categoryType={categoryType}
            subcategorySlug={subcategorySlug}
            guestMode={guestMode}
            disabled={guestMode && !guestSessionReady}
            turnstileToken={turnstileToken}
            onCaptchaRequired={handleGuestCaptchaRequired}
          />

          {guestMode && showCaptcha && resolveTurnstileSiteKey() ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="mb-2 text-xs text-gray-600">
                Ochrana proti zneužití AI — potvrďte, že nejste robot.
              </p>
              <TurnstileWidget
                ref={turnstileWidgetRef}
                onToken={setTurnstileToken}
              />
            </div>
          ) : null}

          <div className={showPrefillConditionHighlight ? listingFormPrefillHighlightClass : undefined}>
            <label htmlFor="condition" className={labelClass}>
              {getConditionFieldLabel(categoryType)}
              {fromAiPrefill ? (
                <span className={listingFormRequiredMarkClass} aria-hidden="true">
                  *
                </span>
              ) : null}
            </label>
            <select
              id="condition"
              className={inputClass}
              value={conditionLabel}
              required={fromAiPrefill}
              onChange={(e) =>
                setConditionLabel(e.target.value as ConditionLabel | "")
              }
            >
              {!hasCondition ? (
                <option value="">— vyberte —</option>
              ) : null}
              {category.conditionLabels.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {isRecurringEvent ? (
              <p className={hintClass}>
                Uveď v popisu frekvenci (např. každý čtvrtek). Datum níže =
                nejbližší termín.
              </p>
            ) : null}
          </div>

          {isEvent ? (
            <div className="space-y-3">
              <label htmlFor="eventDate" className={labelClass}>
                {isRecurringEvent
                  ? "Datum a čas nejbližšího konání"
                  : "Datum a čas akce"}
                <span className={listingFormRequiredMarkClass} aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="eventDate"
                type="datetime-local"
                required
                min={eventDateMin}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
                aria-invalid={eventDateError ? true : undefined}
              />
              {eventDateError ? (
                <p className="mt-1 text-sm text-red-600">{eventDateError}</p>
              ) : null}

              {!isRecurringEvent ? (
                <label
                  className={`${listingFormContactOptionBaseClass} ${
                    hasEventEndDate
                      ? listingFormContactOptionActiveClass
                      : listingFormContactOptionIdleClass
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasEventEndDate}
                    onChange={(event) =>
                      setHasEventEndDate(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-neutral-900">
                      {LISTING_MULTI_DAY_EVENT_UI.checkboxLabel}
                    </span>
                  </span>
                </label>
              ) : null}

              {!isRecurringEvent && hasEventEndDate ? (
                <div>
                  <label htmlFor="eventEndDate" className={labelClass}>
                    {LISTING_MULTI_DAY_EVENT_UI.endDateLabel}
                    <span
                      className={listingFormRequiredMarkClass}
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>
                  <input
                    id="eventEndDate"
                    type="datetime-local"
                    required
                    min={eventDate || eventDateMin}
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className={inputClass}
                    aria-invalid={eventEndDateError ? true : undefined}
                  />
                  {eventEndDateError ? (
                    <p className="mt-1 text-sm text-red-600">
                      {eventEndDateError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {eventVisibleUntilHint && !eventDateError && !eventEndDateError ? (
                <p className={hintClass}>{eventVisibleUntilHint}</p>
              ) : null}

              <label
                className={`${listingFormContactOptionBaseClass} ${
                  isPrivate
                    ? listingFormContactOptionActiveClass
                    : listingFormContactOptionIdleClass
                }`}
              >
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 text-blue-600 focus:ring-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">
                    {LISTING_PRIVATE_EVENT_UI.checkboxLabel}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-600">
                    {LISTING_PRIVATE_EVENT_UI.checkboxHint}
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {!isEvent ? (
            <div>
              <span className={labelClass}>Platnost inzerátu</span>
              <p className={hintClass}>
                Výchozí 30 dní — můžete přepsat.
              </p>
              {!customDuration ? (
                <select
                  className={inputClass}
                  value={listingDurationDays}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "custom") {
                      setCustomDuration(true);
                      return;
                    }
                    setListingDurationDays(Number.parseInt(v, 10));
                  }}
                >
                  {LISTING_DURATION_PRESETS.map((d) => (
                    <option key={d} value={d}>
                      {d} dní{d === LISTING_DURATION_DEFAULT_DAYS ? " (výchozí)" : ""}
                    </option>
                  ))}
                  <option value="custom">Vlastní počet dní…</option>
                </select>
              ) : (
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    min={LISTING_DURATION_MIN_DAYS}
                    max={LISTING_DURATION_MAX_DAYS}
                    value={listingDurationDays}
                    onChange={(e) =>
                      setListingDurationDays(
                        Number.parseInt(e.target.value, 10) ||
                          LISTING_DURATION_DEFAULT_DAYS,
                      )
                    }
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomDuration(false)}
                    className={`shrink-0 ${listingFormSecondaryButtonClass} px-3 py-2`}
                  >
                    Zpět na výběr
                  </button>
                </div>
              )}
              {expiresPreview ? (
                <p className={hintClass}>
                  Platí do {expiresPreview}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className={showPrefillLocationHighlight ? listingFormPrefillHighlightClass : undefined}>
            <LocationInput
              value={{ locationText, latitude, longitude }}
              onChange={({ locationText: text, latitude: lat, longitude: lng }) => {
                setLocationText(text);
                setLatitude(lat);
                setLongitude(lng);
              }}
              inputClass={inputClass}
              labelClass={labelClass}
              requireConfirmation={isEdit}
            />
          </div>

          <div className={`grid gap-4 sm:grid-cols-2 ${showPrefillPriceHighlight ? `${listingFormPrefillHighlightClass} p-1` : ""}`}>
            <div>
              <label htmlFor="priceType" className={labelClass}>
                Typ ceny
              </label>
              <select
                id="priceType"
                name="priceType"
                className={inputClass}
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as PriceType)}
              >
                {category.priceTypes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {priceType === "fixed" ? (
              <PriceAmountInput
                id="priceAmount"
                label={
                  <>
                    {isJob
                      ? "Mzda (Kč/h)"
                      : isEvent
                        ? "Vstupné (Kč)"
                        : isService
                          ? "Sazba (Kč/h)"
                          : "Cena (Kč)"}
                    <span className={listingFormRequiredMarkClass} aria-hidden="true">
                      *
                    </span>
                  </>
                }
                value={priceAmount}
                onChange={setPriceAmount}
                inputClass={inputClass}
                labelClass={labelClass}
                required
              />
            ) : null}
            {priceType === "negotiable" ? (
              <PriceAmountInput
                id="priceAmount"
                label={
                  <>
                    {isJob
                      ? "Fixní odměna (Kč)"
                      : isService
                        ? "Orientační cena zakázky (Kč)"
                        : "Orientační cena (Kč)"}
                    <span className={listingFormRequiredMarkClass} aria-hidden="true">
                      *
                    </span>
                  </>
                }
                value={priceAmount}
                onChange={setPriceAmount}
                inputClass={inputClass}
                labelClass={labelClass}
                required
                placeholder={isService ? "např. 3 000" : "např. 500"}
                hint={
                  isJob
                    ? "Celková odměna za úkol nebo brigádu — ne hodinová sazba."
                    : isService
                      ? "Orientační cena za celou zakázku — finální rozsah domluvíte se zákazníkem."
                      : "Orientační částka — finální cenu domluvíte přímo se zájemcem."
                }
              />
            ) : null}
            {priceType === "exchange" ? (
              <div>
                <label htmlFor="exchangeFor" className={labelClass}>
                  Ideálně za co
                </label>
                <input
                  id="exchangeFor"
                  name="exchangeFor"
                  type="text"
                  maxLength={LISTING_EXCHANGE_FOR_MAX_LENGTH}
                  value={exchangeFor}
                  onChange={(e) => setExchangeFor(e.target.value)}
                  className={inputClass}
                  placeholder="např. dětské kolo, stůl…"
                />
                <p className={hintClass}>
                  Volitelné, max. {LISTING_EXCHANGE_FOR_MAX_LENGTH} znaků.
                </p>
              </div>
            ) : null}
          </div>

          {isJob ? (
            <div className={listingFormContactSectionClass}>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Odpovědi uchazečů
                </h3>
                <p className={`${hintClass} mt-1`}>
                  U brigád obvykle stačí krátká zpráva. U odborných pozic můžete
                  vyžadovat CV nebo portfolio.
                </p>
              </div>

              <input
                type="hidden"
                name="jobCvRequired"
                value={jobCvRequired ? "true" : "false"}
              />

              <label
                className={`${listingFormContactOptionBaseClass} ${
                  jobCvRequired
                    ? listingFormContactOptionActiveClass
                    : listingFormContactOptionIdleClass
                }`}
              >
                <input
                  type="checkbox"
                  checked={jobCvRequired}
                  onChange={(event) => setJobCvRequired(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 text-blue-600 focus:ring-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">
                    Vyžadovat CV nebo portfolio při odpovědi
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-600">
                    Uchazeč bez přílohy formulář neodešle. Vhodné např. pro IT,
                    administrativu nebo odborné pozice.
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {isEvent ? (
            <div className={listingFormContactSectionClass}>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Další informace online
                </h3>
                <p className={`${hintClass} mt-1`}>
                  Odkaz se zobrazí zájemcům na detailu inzerátu — nemusí vám
                  psát, když hledají jen více info.
                </p>
              </div>

              <input
                type="hidden"
                name="hasExternalUrl"
                value={hasExternalUrl ? "true" : "false"}
              />
              <input
                type="hidden"
                name="externalUrl"
                value={hasExternalUrl ? externalUrl : ""}
              />

              <label
                className={`${listingFormContactOptionBaseClass} ${
                  hasExternalUrl
                    ? listingFormContactOptionActiveClass
                    : listingFormContactOptionIdleClass
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasExternalUrl}
                  onChange={(event) =>
                    setHasExternalUrl(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 text-blue-600 focus:ring-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">
                    Mám další informace na webu nebo sociálních sítích
                  </span>
                </span>
              </label>

              {hasExternalUrl ? (
                <div>
                  <label htmlFor="externalUrl" className={listingFormLabelClass}>
                    Odkaz
                    <span
                      className={listingFormRequiredMarkClass}
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>
                  <input
                    id="externalUrl"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    maxLength={EXTERNAL_URL_MAX_LENGTH}
                    placeholder="https://facebook.com/…"
                    value={externalUrl}
                    required={hasExternalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    aria-invalid={
                      externalUrl.trim().length > 0 &&
                      Boolean(externalUrlCheck.error)
                    }
                    aria-describedby={
                      externalUrl.trim().length > 0 && externalUrlCheck.error
                        ? "externalUrl-error"
                        : undefined
                    }
                    className={inputClass}
                  />
                  {externalUrl.trim().length > 0 && externalUrlCheck.error ? (
                    <p
                      id="externalUrl-error"
                      className="mt-1 text-xs text-red-600"
                      role="alert"
                    >
                      {externalUrlCheck.error}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={listingFormContactSectionClass}>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Přímé kontakty v inzerátu
              </h3>
              <p className={`${hintClass} mt-1`}>
                Zájemci vám vždy mohou poslat zprávu přes formulář na webu.
                Chcete jim ukázat i přímé spojení?
              </p>
            </div>

            <input
              type="hidden"
              name="showContactEmail"
              value={showContactEmail ? "true" : "false"}
            />
            <input
              type="hidden"
              name="showContactPhone"
              value={showContactPhone ? "true" : "false"}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`${listingFormContactOptionBaseClass} ${
                  showContactEmail
                    ? listingFormContactOptionActiveClass
                    : listingFormContactOptionIdleClass
                }`}
              >
                <input
                  type="checkbox"
                  checked={showContactEmail}
                  onChange={(event) =>
                    setShowContactEmail(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 text-blue-600 focus:ring-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">
                    Zobrazit můj e-mail
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-600">
                    {emailPreview}
                  </span>
                </span>
              </label>

              <label
                className={`${listingFormContactOptionBaseClass} ${
                  showContactPhone
                    ? listingFormContactOptionActiveClass
                    : listingFormContactOptionIdleClass
                }`}
              >
                <input
                  type="checkbox"
                  checked={showContactPhone}
                  onChange={(event) =>
                    setShowContactPhone(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 text-blue-600 focus:ring-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">
                    Zobrazit telefonní číslo
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-600">
                    Zobrazí se až po kliknutí
                  </span>
                </span>
              </label>
            </div>

            {showContactPhone ? (
              <div>
                <label htmlFor="contactPhone" className={labelClass}>
                  Zadejte telefonní číslo
                  <span className={listingFormRequiredMarkClass} aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  maxLength={CONTACT_PHONE_MAX_LENGTH}
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  className={inputClass}
                  placeholder={CONTACT_PHONE_PLACEHOLDER}
                />
              </div>
            ) : null}
          </div>

          <p className={hintClass}>
            {MODERATION_ENABLED
              ? "Před publikací proběhne AI kontrola — uvidíte náhled a můžete zvolit, zda AI text použijete."
              : "AI kontrola obsahu bude brzy — teď se inzerát uloží rovnou."}
          </p>

          {publishBlockedByQuota ? (
            <div role="alert" className={errorAlertClass}>
              {LISTING_QUOTA_EXCEEDED_MESSAGE}
            </div>
          ) : null}

          {moderationError ? (
            <div
              ref={submitErrorRef}
              role="alert"
              className={
                moderationErrorHardGate
                  ? hardGateErrorAlertClass
                  : technicalErrorAlertClass
              }
            >
              <p className="font-semibold">{MODERATION_TECHNICAL_UI.title}</p>
              <p className="mt-1">{moderationError}</p>
            </div>
          ) : null}

          {state.error ? (
            <div
              ref={moderationError ? undefined : submitErrorRef}
              role="alert"
              className={errorAlertClass}
            >
              {state.error}
            </div>
          ) : null}

          <p className={listingFormRequiredLegendClass}>
            {LISTING_FORM_REQUIRED_LEGEND}
          </p>

          {!canPublish && !publishBlockedByQuota ? (
            <p role="status" className="text-sm text-amber-800">
              {missingPublishFieldsLabel}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              {...gtmCtaProps(GTM_CTA.CREATE_STEP_BACK)}
              onClick={() => setStep(1)}
              className={`flex flex-1 ${listingFormSecondaryButtonClass}`}
            >
              <ChevronLeft className="h-4 w-4" />
              Zpět
            </button>
            <button
              type="submit"
              {...gtmCtaProps(
                isEdit ? GTM_CTA.EDIT_SAVE : GTM_CTA.CREATE_PUBLISH,
                { category: categoryType },
              )}
              disabled={isSaving || !canPublish || publishBlockedByQuota}
              title={
                publishBlockedByQuota
                  ? "Vyčerpali jste limit publikací"
                  : !canPublish
                  ? isEvent && eventDateError
                    ? eventDateError
                    : isEvent && eventEndDateError
                      ? eventEndDateError
                      : missingPublishFieldsLabel || undefined
                  : undefined
              }
              className={`flex flex-1 items-center justify-center gap-2 ${listingFormPrimaryButtonClass}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {isCheckingAi
                    ? "AI kontrola…"
                    : isModerating || pending
                      ? "Ukládám…"
                      : "Pracuji…"}
                </>
              ) : isEdit ? (
                "Uložit změny"
              ) : (
                "Publikovat inzerát"
              )}
            </button>
          </div>

          {showDeleteHint ? (
            <p className={`${listingFormRequiredLegendClass} mt-3 mb-0`}>
              {LISTING_FORM_DELETE_HINT.beforeLink}
              <Link
                href={LISTING_FORM_DELETE_HINT.href}
                className="font-medium text-neutral-800 underline underline-offset-2 hover:text-neutral-950"
              >
                {LISTING_FORM_DELETE_HINT.linkLabel}
              </Link>
              {LISTING_FORM_DELETE_HINT.afterLink}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
    </>
  );
}
