"use client";

import { createListing, updateListing, type CreateListingState, type UpdateListingState } from "@/app/actions/posts";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  MODERATION_CHECKING_UI,
  MODERATION_ENABLED,
  MODERATION_MAX_QUESTIONS,
  MODERATION_TECHNICAL_UI,
  ACCOUNT_SUSPENDED_PATH,
} from "@/config/moderation";
import {
  LISTING_DURATION_DEFAULT_DAYS,
  LISTING_DURATION_MAX_DAYS,
  LISTING_DURATION_MIN_DAYS,
  LISTING_DURATION_PRESETS,
  LISTING_DESCRIPTION_MAX_LENGTH,
  LISTING_DESCRIPTION_MIN_LENGTH,
  LISTING_EXCHANGE_FOR_MAX_LENGTH,
} from "@/config/app";
import { CATEGORIES, getCategoryConfig, getConditionFieldLabel, getConditionLabel, getListingCategoryNotice, getListingDescriptionPlaceholder, getListingTitlePlaceholder, getPriceTypeLabel, getSubcategoryLabel } from "@/config/categories";
import {
  computeListingExpiresAt,
  getListingExpiryWarning,
  parseMentionedDatesFromText,
} from "@/lib/posts/expiry";
import { LISTING_QUOTA_EXCEEDED_MESSAGE } from "@/lib/listings/quota-shared";
import { listingNeedsModeration } from "@/lib/moderation/needs-moderation";
import { runListingModeration } from "@/lib/moderation/run-listing-moderation";
import { stripContactInfo } from "@/lib/moderation/strip-contacts";
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
import { validateFutureEventDate } from "@/lib/posts/validation";
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
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
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
  listingFormPrimaryButtonClass,
  listingFormRequiredLegendClass,
  listingFormRequiredMarkClass,
  listingFormSecondaryButtonClass,
  LISTING_FORM_REQUIRED_LEGEND,
  LISTING_FORM_SAVING_UI,
} from "@/config/listing-form-ui";
import type { CategoryType, ConditionLabel, ListingImagePreview, PriceType } from "@/types/post";

type CreateListingFormProps = {
  mode?: "create" | "edit";
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
};

type FormState = CreateListingState | UpdateListingState;

const inputClass = listingFormInputClass;
const labelClass = listingFormLabelClass;
const hintClass = listingFormHintClass;

const errorAlertClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";

const technicalErrorAlertClass =
  "rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950";

const initialState: FormState = {};

export function CreateListingForm({
  mode = "create",
  postId,
  initialValues,
  initialImages = [],
  userEmail,
  forceModeration = false,
  publishBlockedByQuota = false,
}: CreateListingFormProps) {
  const isEdit = mode === "edit";
  const formAction = isEdit ? updateListing : createListing;

  const [state, boundAction, pending] = useActionState(
    formAction,
    initialState,
  );
  const [isModerating, startModerationTransition] = useTransition();
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [moderationRejection, setModerationRejection] =
    useState<ModerationRejectionState | null>(null);
  const [moderationPreview, setModerationPreview] =
    useState<ModerationPreviewState | null>(null);
  const [moderationApprovedOpen, setModerationApprovedOpen] = useState(false);
  const pendingPublishFormRef = useRef<HTMLFormElement | null>(null);
  const formElementRef = useRef<HTMLFormElement | null>(null);
  const pendingApprovalTokenRef = useRef<string | undefined>(undefined);
  const [isCheckingAi, setIsCheckingAi] = useState(false);
  const [step, setStep] = useState(isEdit ? 2 : 1);

  const [categoryType, setCategoryType] = useState<CategoryType>(
    initialValues?.categoryType ?? "zbozi",
  );
  const [subcategorySlug, setSubcategorySlug] = useState(
    initialValues?.subcategorySlug ?? "",
  );
  const [conditionLabel, setConditionLabel] = useState<ConditionLabel>(
    initialValues?.conditionLabel ?? "used",
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
    initialValues?.priceType ?? "negotiable",
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

  const category = getCategoryConfig(categoryType);
  const emailPreview = formatEmailPreviewForForm(userEmail);

  useEffect(() => {
    if (state.error && step === 2) {
      submitErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [state.error, step]);

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

  const expiresPreview = useMemo(() => {
    if (isEvent && eventDate) {
      const d = new Date(eventDate);
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString("cs-CZ");
    }
    if (!isEvent) {
      return computeListingExpiresAt(listingDurationDays).toLocaleDateString(
        "cs-CZ",
      );
    }
    return null;
  }, [eventDate, isEvent, listingDurationDays]);

  const titleTrimmed = title.trim();
  const descriptionTrimmed = description.trim();
  const hasLocation =
    latitude != null &&
    longitude != null &&
    locationText.trim().length > 0;
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
  const eventDateMin = useMemo(
    () => (mode === "create" ? dateToDatetimeLocalValue(new Date()) : undefined),
    [mode],
  );
  const canPublish =
    hasLocation &&
    isTitleValid &&
    isDescriptionValid &&
    isPriceValid &&
    isEventDateValid;

  const missingPublishFields = (() => {
    const missing: string[] = [];
    if (!hasLocation) missing.push("lokalita (vyberte z našeptávače)");
    if (!isTitleValid) missing.push("název");
    if (!isDescriptionValid) missing.push("popis");
    if (!isPriceValid) missing.push("cena");
    if (!isEventDateValid) missing.push("datum události");
    return missing;
  })();

  function handleCategoryChange(type: CategoryType) {
    setCategoryType(type);
    const next = getCategoryConfig(type);
    // U6: nevybírat automaticky první podkategorii — uživatel musí zvolit.
    setSubcategorySlug("");
    setConditionLabel(next.conditionLabels[0]?.value ?? "used");
    setPriceType(next.priceTypes[0]?.value ?? "negotiable");
    if (type !== "prace") {
      setJobCvRequired(false);
    }
  }

  function canGoStep2(): boolean {
    return Boolean(subcategorySlug);
  }

  function publishListing(
    form: HTMLFormElement,
    titleValue: string,
    descriptionValue: string,
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
    if (pendingApprovalTokenRef.current) {
      formData.set("moderationToken", pendingApprovalTokenRef.current);
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

  function handlePublishOriginalFromPreview() {
    const form = pendingPublishFormRef.current;
    const preview = moderationPreview;
    if (!form || !preview) return;

    publishListing(
      form,
      preview.originalTitle,
      stripContactInfo(preview.originalDescription),
      {
        title: preview.originalTitle,
        description: preview.originalDescription,
      },
      {
        descriptionAiAssisted: false,
        seoFields: { metaDescription: null, imageAlt: null },
      },
    );
    setModerationPreview(null);
    pendingPublishFormRef.current = null;
  }

  function handlePublishAiFromPreview(payload: {
    title: string;
    description: string;
    metaDescription?: string;
    imageAlt?: string;
    questionAnswers: Record<string, string>;
  }) {
    const form = pendingPublishFormRef.current;
    const preview = moderationPreview;
    if (!form || !preview) return;

    const finalDescription = appendQuestionAnswersToDescription(
      payload.description,
      preview.questions.slice(0, MODERATION_MAX_QUESTIONS),
      payload.questionAnswers,
    );

    publishListing(
      form,
      payload.title,
      finalDescription,
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
    setModerationPreview(null);
    pendingPublishFormRef.current = null;
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModerationError(null);
    setModerationRejection(null);
    setModerationPreview(null);
    setModerationApprovedOpen(false);

    if (publishBlockedByQuota) {
      setModerationError(LISTING_QUOTA_EXCEEDED_MESSAGE);
      submitErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      return;
    }

    if (isEvent && !isEventDateValid) {
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
      setModerationError(
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
        title: titleTrimmed,
        description: descriptionTrimmed,
        categoryType,
        subcategorySlug,
        conditionLabel,
        conditionLabelText: getConditionLabel(categoryType, conditionLabel),
        conditionFieldLabel: getConditionFieldLabel(categoryType),
        eventDate: isEvent && eventDate ? eventDate : undefined,
        priceType,
        priceTypeLabel: getPriceTypeLabel(categoryType, priceType),
        priceAmount:
          parsedPriceAmount != null &&
          (priceType === "fixed" || priceType === "negotiable")
            ? parsedPriceAmount
            : undefined,
        locationText: locationText.trim() || undefined,
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

    if (!moderation.ok) {
      if (moderation.accountBlocked) {
        window.location.assign(ACCOUNT_SUSPENDED_PATH);
        return;
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

      setModerationError(
        moderation.kind === "error" ? moderation.error : null,
      );
      submitErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      return;
    }

    pendingApprovalTokenRef.current = moderation.approvalToken;

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
          },
          initialValues,
        ) ||
        imagesChanged;

      publishListing(
        form,
        moderation.cleanedTitle ?? titleTrimmed,
        moderation.cleanedDescription ?? descriptionTrimmed,
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
      imageCount: moderationImages?.imagesBase64.length ?? 0,
    });
    setModerationApprovedOpen(true);
  }

  const isSaving = pending || isModerating || isCheckingAi;

  return (
    <>
      <ModerationRejectedDialog
        rejection={moderationRejection}
        onClose={() => setModerationRejection(null)}
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
        <input type="hidden" name="eventDate" value={eventDate} />
      ) : null}

      <nav aria-label="Kroky formuláře" className="flex items-center gap-2 text-sm text-gray-500">
        <ol className="flex items-center gap-2">
          <li
            className={
              step === 1 ? "font-medium text-gray-900" : "text-gray-500"
            }
            aria-current={step === 1 ? "step" : undefined}
          >
            1. Kategorie
          </li>
          <li aria-hidden="true">→</li>
          <li
            className={
              step === 2 ? "font-medium text-gray-900" : "text-gray-500"
            }
            aria-current={step === 2 ? "step" : undefined}
          >
            2. Obsah
          </li>
        </ol>
      </nav>

      {step === 1 ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <div>
            <span className={labelClass}>Hlavní kategorie</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  {...gtmCtaProps(GTM_CTA.CREATE_SELECT_CATEGORY, {
                    category: cat.type,
                  })}
                  onClick={() => handleCategoryChange(cat.type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    categoryType === cat.type
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
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

      {step === 2 ? (
        <div className={listingFormCardClass}>
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

          <ListingImageUpload
            ref={imageUploadRef}
            initialImages={initialImages}
            categoryType={categoryType}
            subcategorySlug={subcategorySlug}
          />

          <div>
            <label htmlFor="condition" className={labelClass}>
              {getConditionFieldLabel(categoryType)}
            </label>
            <select
              id="condition"
              className={inputClass}
              value={conditionLabel}
              onChange={(e) =>
                setConditionLabel(e.target.value as ConditionLabel)
              }
            >
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
            <div>
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
              {expiresPreview && !eventDateError ? (
                <p className={hintClass}>
                  Inzerát bude viditelný do {expiresPreview} (den po akci).
                </p>
              ) : null}
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
                  Platí do cca {expiresPreview}
                </p>
              ) : null}
            </div>
          ) : null}

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

          <div className="grid gap-4 sm:grid-cols-2">
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
              className={technicalErrorAlertClass}
            >
              <p className="font-semibold">{MODERATION_TECHNICAL_UI.title}</p>
              <p className="mt-1">{moderationError}</p>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => formElementRef.current?.requestSubmit()}
                className={`mt-3 ${listingFormSecondaryButtonClass}`}
              >
                {MODERATION_TECHNICAL_UI.retryLabel}
              </button>
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
              Chybí: {missingPublishFields.join(", ")}
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
                    : `Chybí: ${missingPublishFields.join(", ")}`
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
        </div>
      ) : null}
    </form>
    </>
  );
}
