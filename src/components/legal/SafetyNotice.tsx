import { getMeetingSafetyNotice, SAFETY_UI } from "@/config/legal";
import type { CategoryType } from "@/types/post";

type MeetingSafetyNoticeProps = {
  className?: string;
  categoryType?: CategoryType | null;
};

export function MeetingSafetyNotice({
  className = "",
  categoryType,
}: MeetingSafetyNoticeProps) {
  return (
    <p
      className={`rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm leading-relaxed text-blue-950 ${className}`}
    >
      {getMeetingSafetyNotice(categoryType)}
    </p>
  );
}

type RealEstateMinorNoticeProps = {
  className?: string;
};

export function RealEstateMinorNotice({
  className = "",
}: RealEstateMinorNoticeProps) {
  return (
    <div
      className={`space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ${className}`}
    >
      {SAFETY_UI.realEstateListingNoticeLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

type JobListingNoticeProps = {
  className?: string;
};

export function JobListingNotice({ className = "" }: JobListingNoticeProps) {
  return (
    <div
      className={`space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ${className}`}
    >
      {SAFETY_UI.jobListingNoticeLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
