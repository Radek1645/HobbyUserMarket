import { FB_PROMO_LANDING_UI } from "@/config/fb-promo-landing";
import Image from "next/image";

const ui = FB_PROMO_LANDING_UI;

export function FbPromoHeroMockup() {
  return (
    <div
      className="flex min-h-[340px] flex-1 basis-[400px] items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-50 to-emerald-100 p-[18px] box-border"
      aria-hidden
    >
      <div className="flex flex-wrap items-center justify-center gap-[22px] py-[26px]">
        <div className="flex flex-[0_1_200px] box-border flex-col gap-1.5 rounded-xl bg-white px-4 py-3.5 shadow-[0_10px_26px_rgba(12,42,27,0.14)]">
          <p className="font-mono text-[9px] font-normal uppercase tracking-[0.12em] text-[#8DA396]">
            {ui.mockupBeforeEyebrow}
          </p>
          <p className="text-sm font-semibold leading-snug text-[#0C2A1B]">
            {ui.mockupBeforeText}
          </p>
          <div className="mt-1 flex gap-1.5">
            <Image
              src={ui.mockupPhotoSrc}
              alt={ui.mockupPhotoAlt}
              width={44}
              height={34}
              className="h-[34px] w-11 rounded object-cover"
            />
            <Image
              src={ui.mockupLabelSrc}
              alt={ui.mockupLabelAlt}
              width={44}
              height={34}
              className="h-[34px] w-11 rounded object-cover"
            />
          </div>
        </div>

        <div className="h-auto w-[268px] flex-none rounded-[30px] bg-[#16211C] p-[9px] shadow-[0_22px_48px_rgba(12,42,27,0.24)] box-border">
          <div className="flex flex-col overflow-hidden rounded-[23px] bg-white">
            <div className="flex items-center justify-between px-4 pb-2 pt-2.5">
              <span className="text-[9px] font-semibold text-[#97A79D]">
                9:41
              </span>
              <span className="text-[11px] font-bold text-emerald-600">
                {ui.mockupBrand}
              </span>
              <span className="w-[22px]" aria-hidden />
            </div>

            <div className="flex flex-col gap-2 px-3.5 pb-3.5">
              <div className="rounded-[9px] bg-emerald-50 px-3 py-2.5">
                <p className="text-xs font-bold text-emerald-800">
                  {ui.mockupBannerTitle}
                </p>
                <p className="text-[10px] text-[#5C7A69]">{ui.mockupBannerHint}</p>
              </div>

              <Image
                src={ui.mockupPhotoSrc}
                alt={ui.mockupPhotoAlt}
                width={240}
                height={104}
                className="h-[104px] w-full rounded-lg object-cover"
              />

              <div>
                <p className="mb-1 text-[9px] font-bold text-[#6B7F73]">
                  {ui.mockupTitleLabel}
                </p>
                <div className="rounded-[7px] border border-[#CFE3D7] bg-[#F7FCF9] px-2.5 py-2 text-[11px] font-semibold text-[#0C2A1B]">
                  {ui.mockupTitleValue}
                </div>
              </div>

              <div>
                <p className="mb-1 text-[9px] font-bold text-[#6B7F73]">Popis</p>
                <ul className="rounded-[7px] border border-[#E4EBE6] px-2.5 py-2 text-[10px] leading-[1.7] text-[#46584D]">
                  {ui.mockupDescriptionLines.map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between rounded-[7px] border border-[#E4EBE6] px-2.5 py-2">
                <span className="text-[9px] font-bold text-[#6B7F73]">
                  {ui.mockupPriceLabel}
                </span>
                <span className="text-[13px] font-extrabold text-[#0C2A1B]">
                  {ui.mockupPriceValue}
                </span>
              </div>

              <div className="rounded-lg bg-emerald-600 py-2.5 text-center text-xs font-bold text-white">
                {ui.mockupPublish}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
