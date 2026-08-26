import { FbPromoCtaLink } from "@/components/promo/FbPromoCtaLink";
import { FbPromoHeroMockup } from "@/components/promo/FbPromoHeroMockup";
import { FbPromoViewBeacon } from "@/components/promo/FbPromoViewBeacon";
import { AppLogo } from "@/components/brand/AppLogo";
import {
  FB_PROMO_CREATE_LISTING_PATH,
  FB_PROMO_LANDING_CATEGORY_CHIPS,
  FB_PROMO_LANDING_FAQ,
  FB_PROMO_LANDING_HOW_IT_WORKS_ID,
  FB_PROMO_LANDING_UI,
} from "@/config/fb-promo-landing";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  landingHeaderCtaClass,
  landingPrimaryCtaClass,
  landingSecondaryCtaClass,
} from "@/config/ui-primitives";

const ui = FB_PROMO_LANDING_UI;

const landingContainerClass =
  "mx-auto box-border w-full max-w-[1160px] px-7 text-[#0C2A1B]";

export function FbPromoLanding() {
  return (
    <div className="bg-white">
      <FbPromoViewBeacon />

      <div className={landingContainerClass}>
        <header className="flex items-center justify-between gap-5 py-[22px]">
          <AppLogo />
          <div className="flex flex-wrap items-center justify-end gap-4">
            <a
              href={`#${FB_PROMO_LANDING_HOW_IT_WORKS_ID}`}
              {...gtmCtaProps(GTM_CTA.LP_HOW_IT_WORKS)}
              className="text-[15px] font-medium text-[#46584D] transition hover:text-[#0C2A1B]"
            >
              {ui.headerHowItWorks}
            </a>
            <FbPromoCtaLink
              href={FB_PROMO_CREATE_LISTING_PATH}
              createListing
              gtmId={GTM_CTA.LP_CTA_HEADER}
              position="header"
              className={landingHeaderCtaClass}
            >
              {ui.headerCta}
            </FbPromoCtaLink>
          </div>
        </header>

        <section className="flex flex-wrap items-center gap-x-[54px] gap-y-11 pb-[76px] pt-12">
          <div className="flex min-w-[290px] flex-1 basis-[430px] box-border flex-col gap-[26px]">
            <p className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              {ui.badge}
            </p>
            <h1 className="text-[clamp(38px,6.2vw,62px)] font-extrabold leading-[1.02] tracking-[-0.04em] text-balance">
              {ui.heroTitleLine1}
              <br />
              {ui.heroTitleLine2}
            </h1>
            <p className="max-w-[490px] text-[21px] leading-[1.55] text-[#46584D] text-pretty">
              {ui.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <FbPromoCtaLink
                href={FB_PROMO_CREATE_LISTING_PATH}
                createListing
                gtmId={GTM_CTA.LP_CTA_HERO}
                position="hero"
                className={landingPrimaryCtaClass}
              >
                {ui.heroCta}
              </FbPromoCtaLink>
              <p className="max-w-[210px] text-[15px] text-[#6B7F73]">
                {ui.heroCtaHint}
              </p>
            </div>
            <ul className="flex flex-wrap gap-[22px]">
              {ui.bullets.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[15px] font-semibold text-emerald-800"
                >
                  <span
                    className="h-[7px] w-[7px] shrink-0 rounded-full bg-emerald-600"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <FbPromoHeroMockup />
        </section>

        <section
          id={FB_PROMO_LANDING_HOW_IT_WORKS_ID}
          className="flex scroll-mt-6 flex-col gap-[34px] pb-20"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-600">
              {ui.stepsEyebrow}
            </p>
            <h2 className="mt-2 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.03em]">
              {ui.stepsTitle}
            </h2>
          </div>
          <ol className="flex flex-wrap gap-5">
            {ui.steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-1 basis-[260px] box-border flex-col gap-3.5 rounded-[14px] border border-[#E4EBE6] bg-[#F7FAF8] p-[30px]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-extrabold text-white">
                  {index + 1}
                </span>
                <h3 className="text-[21px] font-bold">{step.title}</h3>
                <p className="text-base leading-relaxed text-[#55685C] text-pretty">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-20 flex flex-wrap items-center gap-x-12 gap-y-9 rounded-[22px] bg-[#0C2A1B] p-[clamp(30px,4vw,54px)]">
          <div className="flex min-w-[260px] flex-1 basis-80 box-border flex-col gap-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#6FCB9C]">
              {ui.aiEyebrow}
            </p>
            <h2 className="text-[clamp(28px,3.8vw,38px)] font-extrabold tracking-[-0.03em] text-white text-balance">
              {ui.aiTitle}
            </h2>
            <p className="text-[17px] leading-[1.65] text-[#A9C2B4]">{ui.aiLead}</p>
          </div>
          <div className="grid min-w-[260px] flex-1 basis-[340px] box-border grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
            {ui.aiTiles.map((tile) => (
              <div
                key={tile.title}
                className={`flex flex-col gap-2 rounded-xl p-[22px] ${
                  tile.accent ? "bg-emerald-600" : "bg-[#17392A]"
                }`}
              >
                <h3 className="text-[17px] font-bold text-white">{tile.title}</h3>
                <p
                  className={`text-[15px] leading-[1.55] ${
                    tile.accent ? "text-[#DDF2E7]" : "text-[#A9C2B4]"
                  }`}
                >
                  {tile.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap gap-5 pb-20">
          <article className="flex min-w-[280px] flex-1 basis-[380px] box-border flex-col gap-[18px] rounded-2xl border border-[#E4EBE6] bg-[#F7FAF8] p-9">
            <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">
              {ui.kidsTitle}
            </h2>
            <p className="text-[17px] leading-[1.65] text-[#55685C]">{ui.kidsText}</p>
            <FbPromoCtaLink
              href={ui.kidsHref}
              gtmId={GTM_CTA.LP_KIDS_BAZAAR}
              category="detsky"
              className={landingSecondaryCtaClass}
            >
              {ui.kidsCta}
            </FbPromoCtaLink>
          </article>

          <article className="flex min-w-[280px] flex-1 basis-[380px] box-border flex-col gap-[18px] rounded-2xl border border-[#E4EBE6] bg-[#F7FAF8] p-9">
            <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">
              {ui.categoriesTitle}
            </h2>
            <ul className="flex flex-wrap gap-[9px]">
              {FB_PROMO_LANDING_CATEGORY_CHIPS.map((chip) => (
                <li key={chip.href + chip.label}>
                  <FbPromoCtaLink
                    href={chip.href}
                    gtmId={GTM_CTA.LP_CATEGORY}
                    category={chip.category}
                    className="inline-flex rounded-full bg-emerald-50 px-[17px] py-2.5 text-[15px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    {chip.label}
                  </FbPromoCtaLink>
                </li>
              ))}
            </ul>
            <p className="mt-auto text-base leading-relaxed text-[#55685C]">
              {ui.categoriesHint}
            </p>
          </article>
        </section>

        <section className="flex flex-col gap-[26px] pb-20">
          <h2 className="text-[clamp(26px,3.4vw,34px)] font-extrabold tracking-[-0.03em]">
            {ui.faqTitle}
          </h2>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-10 gap-y-[18px]">
            {FB_PROMO_LANDING_FAQ.map((item) => (
              <div key={item.question} className="border-t border-[#E4EBE6] pt-[18px]">
                <dt className="text-lg font-bold">{item.question}</dt>
                <dd className="mt-1.5 text-base leading-relaxed text-[#55685C]">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-[30px] flex flex-col items-center gap-[22px] rounded-[22px] bg-gradient-to-br from-emerald-50 to-emerald-100 p-[clamp(34px,5vw,60px)] text-center">
          <h2 className="max-w-[620px] text-[clamp(30px,4.4vw,44px)] font-extrabold tracking-[-0.035em] text-balance">
            {ui.closingTitle}
          </h2>
          <p className="max-w-[520px] text-[19px] leading-[1.55] text-[#46584D]">
            {ui.closingText}
          </p>
          <FbPromoCtaLink
            href={FB_PROMO_CREATE_LISTING_PATH}
            createListing
            gtmId={GTM_CTA.LP_CTA_FOOTER}
            position="footer"
            className={landingPrimaryCtaClass}
          >
            {ui.heroCta}
          </FbPromoCtaLink>
        </section>
      </div>
    </div>
  );
}
