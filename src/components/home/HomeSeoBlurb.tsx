import { HOME_SEO_BLURB } from "@/config/home-seo";
import Link from "next/link";

/** Krátký SEO text pod výpisem inzerátů — kontext pro vyhledávače i návštěvníky. */
export function HomeSeoBlurb() {
  const [about, guide] = HOME_SEO_BLURB.links;

  return (
    <section
      aria-labelledby="home-seo-heading"
      className="mt-12 border-t border-zinc-200/80 pt-8 pb-4"
    >
      <h2
        id="home-seo-heading"
        className="text-lg font-semibold text-zinc-900 sm:text-xl"
      >
        {HOME_SEO_BLURB.heading}
      </h2>
      <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
        {HOME_SEO_BLURB.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          {HOME_SEO_BLURB.linksIntro}{" "}
          <Link
            href={about.href}
            className="font-medium text-zinc-900 underline decoration-emerald-600/50 underline-offset-2 transition hover:decoration-emerald-700"
          >
            {about.label}
          </Link>{" "}
          {HOME_SEO_BLURB.linksJoin}{" "}
          <Link
            href={guide.href}
            className="font-medium text-zinc-900 underline decoration-emerald-600/50 underline-offset-2 transition hover:decoration-emerald-700"
          >
            {guide.label}
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
