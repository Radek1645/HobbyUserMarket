import { resolveGtmContainerId } from "@/config/gtm";
import { buildStoredConsentScript } from "@/lib/analytics/cookie-consent-storage";
import { buildGtmConsentBootstrapScript } from "@/lib/analytics/gtm-consent";

/** Consent Mode default + obnova volby z localStorage — sync před gtm.js. */
export function GoogleTagManagerConsentScript() {
  const gtmId = resolveGtmContainerId();
  if (!gtmId) {
    return null;
  }

  const bootstrapScript = buildGtmConsentBootstrapScript(
    buildStoredConsentScript(),
  );

  return (
    <script
      id="gtm-consent-defaults"
      dangerouslySetInnerHTML={{ __html: bootstrapScript }}
    />
  );
}

/** GTM snippet — hned po consent defaultech. */
export function GoogleTagManagerScript() {
  const gtmId = resolveGtmContainerId();
  if (!gtmId) {
    return null;
  }

  const loaderScript = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
`.trim();

  return (
    <>
      <script
        id="gtm-loader"
        dangerouslySetInnerHTML={{ __html: loaderScript }}
      />
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
