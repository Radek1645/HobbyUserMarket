import { CREATE_LISTING_GUIDE_DEMO, CREATE_LISTING_GUIDE_DEMO_IMAGE } from "@/config/create-listing-guide";
import { SITE_SHORT_NAME } from "@/config/site";
import { MODERATION_APPROVED_UI } from "@/config/moderation";
import { MobileScreenFrame } from "@/components/guide/MobileScreenFrame";
import { CircleCheck, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";

const demo = CREATE_LISTING_GUIDE_DEMO;

function DemoListingPhoto({
  alt,
  className,
  sizes,
}: {
  alt: string;
  className?: string;
  sizes: string;
}) {
  return (
    <Image
      src={CREATE_LISTING_GUIDE_DEMO_IMAGE}
      alt={alt}
      fill
      sizes={sizes}
      className={className ?? "object-cover"}
    />
  );
}

function MockStatusBar() {
  return (
    <div className="flex items-center justify-between bg-white px-3 py-2 text-[10px] font-medium text-gray-500">
      <span>9:41</span>
      <span className="font-semibold text-emerald-600">{SITE_SHORT_NAME}</span>
      <span className="flex gap-0.5">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        <span className="h-2 w-3 rounded-sm bg-gray-400" />
      </span>
    </div>
  );
}

export function CreateListingGuideStep1Screen() {
  return (
    <MobileScreenFrame caption="Ukázka formuláře v mobilu">
      <MockStatusBar />
      <div className="space-y-3 bg-white p-3 pb-4">
        <p className="text-[11px] font-medium text-gray-500">2. Obsah</p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[10px] text-gray-700">
          {demo.categoryLabel}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-gray-900">Název</p>
          <div className="mt-1 rounded-lg border border-neutral-400 bg-white px-2 py-1.5 text-xs text-gray-900">
            {demo.draftTitle}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-gray-900">Popis</p>
          <div className="mt-1 rounded-lg border border-neutral-400 bg-white px-2 py-1.5 text-xs leading-relaxed text-gray-900">
            {demo.draftDescription}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <DemoListingPhoto
              alt="Ukázková fotka dětského kola v inzerátu"
              sizes="140px"
            />
            <span className="absolute left-1 top-1 rounded bg-gray-900/75 px-1 py-0.5 text-[8px] font-medium text-white">
              Hlavní
            </span>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-neutral-400 bg-neutral-50 text-[9px] text-neutral-600">
            + další fotka
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-2 py-1.5 text-[10px]">
          <span className="text-gray-600">Cena</span>
          <span className="font-semibold text-gray-900">{demo.priceLabel}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <MapPin className="h-3 w-3 shrink-0" />
          {demo.locationLabel}
        </div>

        <div className="rounded-xl bg-emerald-600 py-2 text-center text-xs font-semibold text-white">
          Publikovat
        </div>
      </div>
    </MobileScreenFrame>
  );
}

export function CreateListingGuideStep2Screen() {
  return (
    <MobileScreenFrame caption="Kontrola obsahu před publikací">
      <MockStatusBar />
      <div className="relative min-h-[420px] bg-white">
        <div className="space-y-2 p-3 opacity-40 blur-[1px]">
          <div className="h-8 rounded-lg bg-gray-100" />
          <div className="h-16 rounded-lg bg-gray-100" />
          <div className="aspect-[4/3] rounded-lg bg-gray-100" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/25 p-4">
          <div className="w-full rounded-xl border border-gray-200 bg-white p-4 text-center shadow-lg">
            <CircleCheck
              className="mx-auto h-8 w-8 text-emerald-600"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {MODERATION_APPROVED_UI.title}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-gray-600">
              Text sedí k fotkám a splňuje podmínky inzerce.
            </p>
            <div className="mt-3 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white">
              {MODERATION_APPROVED_UI.continueLabel}
            </div>
          </div>
        </div>
      </div>
    </MobileScreenFrame>
  );
}

export function CreateListingGuideStep3Screen() {
  return (
    <MobileScreenFrame caption="AI náhled a doplnění">
      <MockStatusBar />
      <div className="relative min-h-[420px] bg-gray-900/20 p-2">
        <div className="absolute inset-0 bg-gray-900/30" />
        <div className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            <p className="text-xs font-semibold text-gray-900">AI náhled a doplnění</p>
          </div>
          <p className="mt-1 text-[9px] leading-relaxed text-gray-600">
            AI navrhla upravený popis. Můžete ho upravit nebo publikovat původní text.
          </p>

          <div className="mt-2">
            <p className="text-[9px] font-semibold text-gray-900">Název</p>
            <div className="mt-0.5 rounded-lg border border-blue-200 bg-blue-50/50 px-2 py-1 text-[10px] font-medium text-gray-900">
              {demo.aiTitle}
            </div>
          </div>

          <div className="mt-2">
            <p className="text-[9px] font-semibold text-gray-900">Popis</p>
            <div className="mt-0.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[9px] leading-relaxed text-gray-800">
              {demo.aiDescriptionIntro}
              <span className="mt-1 block border-t border-gray-200 pt-1 text-gray-600">
                Parametry
                <br />• Velikost kol: 20″
                <br />• Stav: použité
              </span>
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
            <p className="text-[9px] font-semibold text-amber-950">
              Vylepšete svůj inzerát
            </p>
            <p className="mt-1 text-[9px] text-amber-900">{demo.aiQuestion}</p>
            <div className="mt-1 rounded border border-amber-300 bg-white px-2 py-1 text-[9px] text-gray-900">
              {demo.aiQuestionAnswer}
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="rounded-lg bg-emerald-600 py-1.5 text-center text-[10px] font-semibold text-white">
              Publikovat s vylepšeným popisem
            </div>
            <div className="rounded-lg border border-gray-200 py-1 text-center text-[9px] text-gray-600">
              Publikovat bez vylepšení
            </div>
          </div>
        </div>
      </div>
    </MobileScreenFrame>
  );
}

export function CreateListingGuideStep4Screen() {
  return (
    <MobileScreenFrame caption="Hotový inzerát ve feedu">
      <MockStatusBar />
      <div className="space-y-2 bg-gray-50 p-2 pb-3">
        <div className="rounded-full bg-white px-3 py-1.5 text-[10px] text-gray-600 shadow-sm">
          Hledat v okolí…
        </div>

        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative aspect-[4/5] bg-gray-100">
            <DemoListingPhoto
              alt="Ukázkový inzerát — dětské kolo ve feedu"
              sizes="280px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pb-3 pt-12">
              <span className="inline-block rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-medium text-gray-800">
                Sport a outdoor
              </span>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-white">
                {demo.publishedTitle}
              </h3>
              <p className="mt-0.5 text-xs font-semibold text-white">
                {demo.priceLabel}
                <span className="ml-2 font-normal text-white/85">· 2 km</span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-[10px]">
            <span className="truncate text-gray-500">{demo.locationLabel}</span>
            <span className="shrink-0 font-medium text-emerald-700">Aktivní</span>
          </div>
        </article>

        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 px-3 py-4 text-center text-[10px] text-gray-400">
          Další inzeráty ve vašem okolí
        </div>
      </div>
    </MobileScreenFrame>
  );
}
