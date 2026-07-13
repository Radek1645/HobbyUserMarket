import { resolveGtmContainerId } from "@/config/gtm";
import { buildStoredConsentScript } from "@/lib/analytics/cookie-consent-storage";
import Script from "next/script";

/** Consent Mode default + obnova volby z localStorage — musí běžet před GTM. */
export function GoogleTagManagerConsentScript() {
  const gtmId = resolveGtmContainerId();
  if (!gtmId) {
    return null;
  }

  const storedConsentScript = buildStoredConsentScript();

  return (
    <Script id="gtm-consent-defaults" strategy="beforeInteractive">
      {`
window.dataLayer = window.dataLayer || [];
window.dataLayer.push(["consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
  wait_for_update: 500
}]);
${storedConsentScript}
`.trim()}
    </Script>
  );
}

/** GTM snippet — načte se až po nastavení consent defaultů. */
export function GoogleTagManagerScript() {
  const gtmId = resolveGtmContainerId();
  if (!gtmId) {
    return null;
  }

  return (
    <>
      <Script id="gtm-loader" strategy="afterInteractive">
        {`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
`.trim()}
      </Script>
      <noscript>
        <iframe
          title="Google Tag Manager"
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
