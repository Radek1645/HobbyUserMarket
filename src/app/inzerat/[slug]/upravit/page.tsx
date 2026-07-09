import { CreateListingForm } from "@/components/listing/CreateListingForm";
import { ListingBlockedNotice } from "@/components/listing/ListingBlockedNotice";
import { BackLink } from "@/components/navigation/BackLink";
import { getListingForEdit } from "@/lib/posts/get-listing-for-edit";
import {
  getListingEditPath,
  getListingPath,
} from "@/lib/posts/listing-path";
import { postToListingFormInitialValues } from "@/lib/posts/listing-form";
import { getCurrentUser } from "@/lib/auth/get-user";
import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function resolveSlugParam(param: string): string {
  const legacy = /^(\d+)-(.*)$/.exec(param);
  if (legacy) {
    permanentRedirect(getListingEditPath(legacy[2]!));
  }
  return param;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: param } = await params;
  const slug = resolveSlugParam(param);

  return {
    title: `Upravit inzerát | ${slug} | HobbyUserMarket`,
  };
}

export default async function EditListingPage({ params }: PageProps) {
  const { slug: param } = await params;
  const slug = resolveSlugParam(param);
  const editPath = getListingEditPath(slug);

  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(editPath)}&message=create_listing&tab=login`,
    );
  }

  if (user.needsNicknameSetup) {
    redirect(`/onboarding?next=${encodeURIComponent(editPath)}`);
  }

  const post = await getListingForEdit(slug, user.id);
  if (!post) notFound();

  const initialValues = postToListingFormInitialValues(post, post.location);
  const backHref =
    post.status === "active" ? getListingPath(slug) : "/moje-inzeraty";

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6">
        <BackLink href={backHref} label="Zpět" />

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Upravit inzerát
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Oprav lokalitu, popis nebo cenu. URL inzerátu zůstává stejné.
        </p>

        {post.status === "blocked" ? (
          <ListingBlockedNotice reasonCode={post.status_reason_code} />
        ) : null}
      </div>

      <CreateListingForm
        mode="edit"
        postId={post.id}
        initialValues={initialValues}
        initialImages={post.images}
        userEmail={user.email}
        forceModeration={post.status === "draft" || post.status === "blocked"}
      />
    </div>
  );
}
