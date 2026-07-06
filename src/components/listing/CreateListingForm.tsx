"use client";

import { createListing, updateListing, type CreateListingState, type UpdateListingState } from "@/app/actions/posts";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { MODERATION_ENABLED, MODERATION_MAX_QUESTIONS } from "@/config/moderation";
import {
  LISTING_DURATION_DEFAULT_DAYS,
  LISTING_DURATION_MAX_DAYS,
  LISTING_DURATION_MIN_DAYS,
  LISTING_DURATION_PRESETS,
  LISTING_DESCRIPTION_MAX_LENGTH,
  LISTING_DESCRIPTION_MIN_LENGTH,
  LISTING_EXCHANGE_FOR_MAX_LENGTH,
} from "@/config/app";
import { CATEGORIES, getCategoryConfig, getConditionFieldLabel, getConditionLabel, getPriceTypeLabel, getSubcategoryLabel } from "@/config/categories";
import {
  computeListingExpiresAt,
  getListingExpiryWarning,
  parseMentionedDatesFromText,
} from "@/lib/posts/expiry";
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
  listingFormSecondaryButtonClass,
} from "@/config/listing-form-ui";
import type { CategoryType, ConditionLabel, ListingImagePreview, PriceType } from "@/types/post";

type CreateListingFormProps = {
  mode?: "create" | "edit";
  postId?: number;
  initialValues?: ListingFormInitialValues;
  initialImages?: ListingImagePreview[];
  /** E-mail z účtu — náhled v sekci kontaktu. */
  userEmail: string;
};

type FormState = CreateListingState | UpdateListingState;

const inputClass = listingFormInputClass;
const labelClass = listingFormLabelClass;
const hintClass = listingFormHintClass;

const errorAlertClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";

const initialState: FormState = {};

export function CreateListingForm({
  mode = "create",
  postId,
  initialValues,
  initialImages = [],
  userEmail,
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
  const [isCheckingAi, setIsCheckingAi] = useState(false);
  const [step, setStep] = useState(isEdit ? 2 : 1);

  const [categoryType, setCategoryType] = useState<CategoryType>(
    initialValues?.categoryType ?? "zbozi",
  );
  const [subcategorySlug, setSubcategorySlug] = useState(
    initialValues?.subcategorySlug ?? CATEGORIES[0].subcategories[0]?.slug ?? "",
  );
  const [conditionLabel, setConditionLabel] = useState<ConditionLabel>(
    initialValues?.conditionLabel ?? "used",
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [locationText, setLocationText] = useState(initialValues?.locationText ?? "");
  const [latitude, setLatitude] = useState<number | null>(
    isEdit ? null : (initialValues?.latitude ?? null),
  );
  const [longitude, setLongitude] = useState<number | null>(
    isEdit ? null : (initialValues?.longitude ?? null),
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
  const isRealEstate = categoryType === "nemovitost";
  const isJob = categoryType === "prace";
  const isRecurringEvent = isEvent && conditionLabel === "long_term";

  const subcategories = category.subcategories;

  const selectedSubcategory = useMemo(
    () => getSubcategoryLabel(categoryType, subcategorySlug),
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

  function handleCategoryChange(type: CategoryType) {
    setCategoryType(type);
    const next = getCategoryConfig(type);
    setSubcategorySlug(next.subcategories[0]?.slug ?? "");
    setConditionLabel(next.conditionLabels[0]?.value ?? "used");
    setPriceType(next.priceTypes[0]?.value ?? "negotiable");
  }

  function canGoStep2(): boolean {
    return Boolean(subcategorySlug);
  }

  function publishListing(
    form: HTMLFormElement,
    titleValue: string,
    descriptionValue: string,
    originalSnapshot?: { title: string; description: string },
  ) {
    const formData = new FormData(form);
    formData.set("title", titleValue);
    formData.set("description", descriptionValue);
    if (originalSnapshot) {
      formData.set("originalTitle", originalSnapshot.title);
      formData.set("originalDescription", originalSnapshot.description);
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
    );
    setModerationPreview(null);
    pendingPublishFormRef.current = null;
  }

  function handlePublishAiFromPreview(payload: {
    title: string;
    description: string;
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

    publishListing(form, payload.title, finalDescription, {
      title: preview.originalTitle,
      description: preview.originalDescription,
    });
    setModerationPreview(null);
    pendingPublishFormRef.current = null;
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModerationError(null);
    setModerationRejection(null);
    setModerationPreview(null);
    setModerationApprovedOpen(false);

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
        initialValues: isEdit ? initialValues : undefined,
        imagesChanged: isEdit
          ? (imageUploadRef.current?.hasImageChanges() ?? false)
          : false,
        images: moderationImages,
      });
    } finally {
      setIsCheckingAi(false);
    }

    if (!moderation.ok) {
      const rejection = moderationFailureToRejection(moderation);
      if (rejection) {
        setModerationRejection(rejection);
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
      questions: moderation.questions ?? [],
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

      {isCheckingAi ? (
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
            <p className="mt-4 text-base font-semibold text-neutral-900">
              Probíhá AI kontrola inzerátu
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Může to trvat i 15 sekund.
            </p>
          </div>
        </div>
      ) : null}

      <form
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

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span
          className={
            step === 1 ? "font-medium text-gray-900" : "text-gray-500"
          }
        >
          1. Kategorie
        </span>
        <span aria-hidden="true">→</span>
        <span
          className={
            step === 2 ? "font-medium text-gray-900" : "text-gray-500"
          }
        >
          2. Obsah
        </span>
      </div>

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

          <div>
            <label htmlFor="title" className={labelClass}>
              Název inzerátu <span className="text-red-600">*</span>
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
              placeholder={
                isEvent
                  ? isRecurringEvent
                    ? "např. Čtvrteční poker u Honzy"
                    : "např. Opékání na zahradě"
                  : isRealEstate
                    ? "např. Pronájem bytu 2+kk v centru"
                    : isJob
                      ? "např. Brigáda v kavárně o víkendu"
                      : "např. Prodám med z vlastní včelny"
              }
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
              Popis <span className="text-red-600">*</span>
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
              placeholder={
                isEvent
                  ? isRecurringEvent
                    ? "Frekvence (každý čtvrtek 18:00…), kapacita, co s sebou, jak se přihlásit…"
                    : "Kapacita, co s sebou, jak se přihlásit…"
                  : isRealEstate
                    ? "Dispozice, plocha v m², patro, kauce, poplatky, stav objektu, parkování…"
                    : isJob
                      ? "Rozsah práce, požadavky (věk, praxe), termín nástupu, počet hodin…"
                      : "Popis zboží nebo služby…"
              }
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
                  ? "Datum a čas nejbližšího konání *"
                  : "Datum a čas akce *"}
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
                    Presety
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
                      ? "Mzda (Kč)"
                      : isEvent
                        ? "Vstupné (Kč)"
                        : "Cena (Kč)"}{" "}
                    <span className="text-red-600">*</span>
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
                    {isJob ? "Orientační odměna (Kč)" : "Orientační cena (Kč)"}{" "}
                    <span className="text-red-600">*</span>
                  </>
                }
                value={priceAmount}
                onChange={setPriceAmount}
                inputClass={inputClass}
                labelClass={labelClass}
                required
                placeholder="např. 500"
                hint="Kolik si představuješ? Finální cena se domluví."
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
                  Zadejte telefonní číslo <span className="text-red-600">*</span>
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

          {moderationError ? (
            <div ref={submitErrorRef} role="alert" className={errorAlertClass}>
              {moderationError}
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
              disabled={isSaving || !canPublish}
              title={
                !canPublish
                  ? isEvent && eventDateError
                    ? eventDateError
                    : "Vyplňte název, popis a potvrďte obec z našeptávače"
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
