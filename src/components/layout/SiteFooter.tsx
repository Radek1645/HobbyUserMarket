import { CookieConsentSettingsLink } from "@/components/consent/CookieConsentSettingsLink";
import {
  FOOTER_ABOUT_LINKS,
  FOOTER_CONTACT_LINKS,
  FOOTER_DOCUMENT_LINKS,
  FOOTER_UI,
} from "@/config/footer";
import { SITE_SHORT_NAME, SITE_VERSION } from "@/config/site";
import Link from "next/link";

const footerLinkClass =
  "text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline";

type FooterLinkColumnProps = {
  heading: string;
  links: ReadonlyArray<{ href: string; label: string }>;
};

function FooterLinkColumn({ heading, links }: FooterLinkColumnProps) {
  return (
    <div>
      <h2 className="text-sm font-bold text-gray-900">{heading}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            {link.href.startsWith("mailto:") ? (
              <a href={link.href} className={footerLinkClass}>
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className={footerLinkClass}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FooterLinkColumn
            heading={FOOTER_UI.documentsHeading}
            links={FOOTER_DOCUMENT_LINKS}
          />
          <FooterLinkColumn
            heading={FOOTER_UI.contactHeading}
            links={FOOTER_CONTACT_LINKS}
          />
          <FooterLinkColumn
            heading={FOOTER_UI.aboutHeading}
            links={FOOTER_ABOUT_LINKS}
          />
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-600">
          <CookieConsentSettingsLink />
          <p className="mt-2">
            <span className="font-medium text-gray-900">{SITE_SHORT_NAME}</span>
            <span className="text-gray-500"> v{SITE_VERSION}</span>
            {" — "}
            {FOOTER_UI.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
