"use client";

import { createListing, type CreateListingState } from "@/app/actions/posts";
import {
  LISTING_DURATION_DEFAULT_DAYS,
  LISTING_DURATION_MAX_DAYS,
  LISTING_DURATION_MIN_DAYS,
  LISTING_DURATION_PRESETS,
  LISTING_DESCRIPTION_MAX_LENGTH,
  LISTING_DESCRIPTION_MIN_LENGTH,
} from "@/config/app";
import { CATEGORIES, getCategoryConfig, getConditionFieldLabel, getSubcategoryLabel } from "@/config/categories";
import {
  computeListingExpiresAt,
  getListingExpiryWarning,
  parseMentionedDatesFromText,
} from "@/lib/posts/expiry";
import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";
import { LocationInput } from "@/components/listing/LocationInput";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

const initialState: CreateListingState = {};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200";

const labelClass = "block text-sm font-medium text-gray-700";

const errorAlertClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";

export function CreateListingForm() {
  const [state, formAction, pending] = useActionState(
    createListing,
    initialState,
  );
  const [step, setStep] = useState(1);

  const [categoryType, setCategoryType] = useState<CategoryType>("zbozi");
  const [subcategorySlug, setSubcategorySlug] = useState(
    CATEGORIES[0].subcategories[0]?.slug ?? "",
  );
  const [conditionLabel, setConditionLabel] = useState<ConditionLabel>("used");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [priceType, setPriceType] = useState<PriceType>("negotiable");
  const [priceAmount, setPriceAmount] = useState("");
  const [listingDurationDays, setListingDurationDays] = useState(
    LISTING_DURATION_DEFAULT_DAYS,
  );
  const [customDuration, setCustomDuration] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const submitErrorRef = useRef<HTMLDivElement>(null);

  const category = getCategoryConfig(categoryType);

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
  const parsedPriceAmount = Number.parseInt(priceAmount.trim(), 10);
  const isPriceValid =
    !needsPriceAmount ||
    (priceAmount.trim().length > 0 &&
      !Number.isNaN(parsedPriceAmount) &&
      parsedPriceAmount >= (priceType === "negotiable" ? 1 : 0));
  const canPublish =
    hasLocation &&
    isTitleValid &&
    isDescriptionValid &&
    isPriceValid;

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

  return (
    <form action={formAction} className="space-y-6">
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
              <option value="">— vyber —</option>
              {subcategories.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!canGoStep2()}
            onClick={() => setStep(2)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pokračovat
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm">
            <p className="text-gray-600">
              <span className="text-gray-500">Kategorie:</span>{" "}
              <span className="font-medium text-gray-900">{category.label}</span>
              <span aria-hidden="true" className="text-gray-400">
                {" "}
                ·{" "}
              </span>
              <span className="font-medium text-gray-900">
                {selectedSubcategory.label}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="shrink-0 font-medium text-gray-700 underline-offset-2 hover:underline"
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
            <p className="mt-1 text-xs text-gray-500">{title.length}/80</p>
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
            <p className="mt-1 text-xs text-gray-500">
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
              <p className="mt-1 text-xs text-gray-500">
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
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
              />
              {expiresPreview ? (
                <p className="mt-1 text-xs text-gray-500">
                  Inzerát bude viditelný do {expiresPreview} (den po akci).
                </p>
              ) : null}
            </div>
          ) : null}

          {!isEvent ? (
            <div>
              <span className={labelClass}>Platnost inzerátu</span>
              <p className="mt-0.5 text-xs text-gray-500">
                Výchozí 30 dní — můžeš přepsat.
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
                    className="shrink-0 rounded-xl border border-gray-200 px-3 text-sm text-gray-600"
                  >
                    Presety
                  </button>
                </div>
              )}
              {expiresPreview ? (
                <p className="mt-1 text-xs text-gray-500">
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
              <div>
                <label htmlFor="priceAmount" className={labelClass}>
                  {isJob ? "Mzda (Kč)" : "Cena (Kč)"}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="priceAmount"
                  name="priceAmount"
                  type="number"
                  min={0}
                  required
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
            {priceType === "negotiable" ? (
              <div>
                <label htmlFor="priceAmount" className={labelClass}>
                  {isJob ? "Orientační odměna (Kč)" : "Orientační cena (Kč)"}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="priceAmount"
                  name="priceAmount"
                  type="number"
                  min={1}
                  required
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                  className={inputClass}
                  placeholder="např. 500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Kolik si představuješ? Finální cena se domluví.
                </p>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-gray-500">
            Fotografie a AI kontrola — v další iteraci. Teď publikuješ textový
            inzerát.
          </p>

          {state.error ? (
            <div ref={submitErrorRef} role="alert" className={errorAlertClass}>
              {state.error}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Zpět
            </button>
            <button
              type="submit"
              disabled={pending || !canPublish}
              title={
                !canPublish
                  ? "Vyplň název, popis a vyber lokalitu z našeptávače nebo GPS"
                  : undefined
              }
              className="flex flex-1 items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Ukládám…" : "Publikovat inzerát"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
