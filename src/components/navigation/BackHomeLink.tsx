import { GTM_CTA } from "@/config/gtm-ids";
import { BackLink } from "@/components/navigation/BackLink";

type BackHomeLinkProps = {
  gtmId?: (typeof GTM_CTA)[keyof typeof GTM_CTA];
  label?: string;
  className?: string;
};

export function BackHomeLink({
  gtmId = GTM_CTA.CREATE_BACK_HOME,
  label = "Zpět na úvod",
  className,
}: BackHomeLinkProps) {
  return (
    <BackLink
      href="/"
      label={label}
      gtmId={gtmId}
      className={className}
    />
  );
}
