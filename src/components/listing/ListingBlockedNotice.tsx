import {
  BLOCKED_LISTING_RECOVERY_HINT,
  getPostStatusReasonMessage,
} from "@/config/listing-status-reasons";
import type { PostStatusReasonCode } from "@/types/post";

type ListingBlockedNoticeProps = {
  reasonCode: PostStatusReasonCode | null | undefined;
};

export function ListingBlockedNotice({
  reasonCode,
}: ListingBlockedNoticeProps) {
  const reason =
    getPostStatusReasonMessage(reasonCode) ??
    "Tento inzerát byl skryt z veřejného zobrazení.";

  return (
    <div
      role="status"
      className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      <p className="font-medium">Inzerát je zablokován</p>
      <p className="mt-1">{reason}</p>
      <p className="mt-2 text-red-800">{BLOCKED_LISTING_RECOVERY_HINT}</p>
    </div>
  );
}
