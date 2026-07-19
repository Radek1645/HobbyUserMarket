import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { GDPR_PATH, LEGAL_UI } from "@/config/legal";
import { SITE_DISPLAY_NAME, SITE_OPERATOR_CONTACT_EMAIL } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `${LEGAL_UI.marketingConsentLinkLabel} | ${SITE_DISPLAY_NAME}`,
};

export default function MarketingConsentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {LEGAL_UI.marketingConsentLinkLabel}
      </h1>

      <p className="mt-3 text-gray-600">
        Tato stránka popisuje, jak nakládáme se souhlasem se zasíláním novinek a
        tipů e-mailem na {SITE_DISPLAY_NAME}.
      </p>

      <section className="mt-8 space-y-3 text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Co souhlas znamená</h2>
        <p>
          Pokud při registraci zaškrtnete volitelný souhlas, můžeme vám na e-mail
          u účtu zasílat novinky o platformě, tipy k inzerci a související
          obchodní sdělení. Souhlas není povinný — bez něj účet založíte a
          platformu používáte stejně.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Aktuální stav</h2>
        <p>
          Obchodní novinky zatím <strong>nezasíláme</strong>. Souhlas můžeme
          uložit do vašeho profilu už teď, abychom věděli, koho oslovit až
          službu spustíme. Do té doby e-mail pro marketing nepoužíváme.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Právní základ</h2>
        <p>
          Zpracování e-mailu pro obchodní sdělení probíhá na základě vašeho
          souhlasu (čl. 6 odst. 1 písm. a GDPR). Podrobnosti najdete v{" "}
          <Link href={GDPR_PATH} className="text-emerald-700 underline">
            {LEGAL_UI.gdprLinkLabel}
          </Link>
          .
        </p>
      </section>

      <section className="mt-8 space-y-3 text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Jak souhlas odvolat</h2>
        <p>
          Souhlas můžete kdykoli odvolat e-mailem na{" "}
          <a
            href={`mailto:${SITE_OPERATOR_CONTACT_EMAIL}`}
            className="text-emerald-700 underline"
          >
            {SITE_OPERATOR_CONTACT_EMAIL}
          </a>
          . Odvolání nemá vliv na zákonnost zpracování před odvoláním. Po
          spuštění novinek doplníme i odhlášení přímo v e-mailu.
        </p>
      </section>

      <BackHomeLink className="mt-8" />
    </div>
  );
}
