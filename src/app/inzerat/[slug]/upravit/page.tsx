import { CreateListingForm } from "@/components/listing/CreateListingForm";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { getListingForEdit } from "@/lib/posts/get-listing-for-edit";
import {
  getListingEditPath,
  getListingPath,
} from "@/lib/posts/listing-path";
import { postToListingFormInitialValues } from "@/lib/posts/listing-form";
import { getCurrentUser } from "@/lib/auth/get-user";
import type { Metadata } from "next";
import Link from "next/link";
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

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6">
        <BackHomeLink />

        <Link
          href={getListingPath(slug)}
          className="mt-2 inline-block text-sm text-gray-500 hover:text-gray-800"
        >
          ← Zpět na detail
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Upravit inzerát
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Oprav lokalitu, popis nebo cenu. URL inzerátu zůstává stejné.
        </p>
      </div>

      <CreateListingForm
        mode="edit"
        postId={post.id}
        initialValues={initialValues}
        initialImages={post.images}
        userEmail={user.email}
      />
    </div>
  );
}
