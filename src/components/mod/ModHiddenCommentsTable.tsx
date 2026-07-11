import { adminRestoreComment } from "@/app/actions/moderation-listings";
import type { ModHiddenComment } from "@/lib/mod/get-mod-listings";

type ModHiddenCommentsTableProps = {
  comments: ModHiddenComment[];
};

export function ModHiddenCommentsTable({
  comments,
}: ModHiddenCommentsTableProps) {
  if (comments.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">Žádné skryté komentáře.</p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Inzerát</th>
            <th className="px-4 py-3 font-medium">Autor</th>
            <th className="px-4 py-3 font-medium">Text</th>
            <th className="px-4 py-3 font-medium">Akce</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <tr key={comment.id} className="text-gray-800">
              <td className="px-4 py-3 font-medium">{comment.postTitle}</td>
              <td className="px-4 py-3">{comment.authorNickname}</td>
              <td className="max-w-xs px-4 py-3 text-gray-600">
                {comment.bodyPreview}
                {comment.bodyPreview.length >= 120 ? "…" : ""}
              </td>
              <td className="px-4 py-3">
                <form action={adminRestoreComment}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-800"
                  >
                    Obnovit
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
