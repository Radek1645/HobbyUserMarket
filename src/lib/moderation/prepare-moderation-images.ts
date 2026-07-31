import {
  LISTING_IMAGE_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
} from "@/config/app";
import { prepareModerationImageRenditions } from "@/app/actions/moderation-images";
import { createClient } from "@/lib/supabase/client";

export type ModerationImageReference = {
  bucket: typeof LISTING_IMAGE_BUCKET | typeof MODERATION_IMAGE_STAGING_BUCKET;
  storagePath: string;
};

export type ModerationImagePayload = {
  /** Storage objekty, ze kterých Edge odvodí AI varianty a SEC-H02 hashe. */
  imageReferences: ModerationImageReference[];
  mainImageIndex: number;
};

export type ModerationImageSource =
  | {
      kind: "file";
      key: string;
      file: File;
      stagingPath?: string;
    }
  | { kind: "stored"; storagePath: string };

type PreparedModerationImages = {
  payload: ModerationImagePayload;
  stagedPathsByKey: Record<string, string>;
  renditionSignature: string;
};

function getFileExtension(file: File): string {
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  throw new Error("Fotka nemá podporovaný formát JPG, PNG nebo WebP.");
}

function assertOwnedStoragePath(userId: string, storagePath: string): void {
  if (!storagePath.startsWith(`${userId}/`)) {
    throw new Error("Fotka nemá platnou vazbu na přihlášený účet.");
  }
}

/**
 * Nahraje nové soubory jednou do privátního stagingu a nechá Server Action
 * vytvořit důvěryhodné varianty. Edge nezávisle ověří plné hashe originálů.
 */
export async function prepareModerationImages(
  sources: ModerationImageSource[],
  mainImageIndex: number,
  preparedRenditionSignature?: string,
): Promise<PreparedModerationImages | null> {
  if (sources.length === 0) {
    return null;
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Sezení vypršelo. Obnovte stránku a přihlaste se znovu.");
  }

  const stagedPathsByKey: Record<string, string> = {};
  const preparedSources = await Promise.all(sources.map(async (source) => {
    if (source.kind === "stored") {
      assertOwnedStoragePath(user.id, source.storagePath);
      return {
        reference: {
          bucket: LISTING_IMAGE_BUCKET,
          storagePath: source.storagePath,
        } satisfies ModerationImageReference,
      };
    }

    const existingStagingPath = source.stagingPath;
    if (existingStagingPath) {
      assertOwnedStoragePath(user.id, existingStagingPath);
      return {
        sourceKey: source.key,
        stagingPath: existingStagingPath,
        reference: {
          bucket: MODERATION_IMAGE_STAGING_BUCKET,
          storagePath: existingStagingPath,
        } satisfies ModerationImageReference,
      };
    }

    const storagePath = `${user.id}/${crypto.randomUUID()}/${crypto.randomUUID()}.${getFileExtension(source.file)}`;
    const { error: uploadError } = await supabase.storage
      .from(MODERATION_IMAGE_STAGING_BUCKET)
      .upload(storagePath, source.file, {
        contentType: source.file.type,
        upsert: false,
      });
    if (uploadError) {
      throw new Error("Fotku se nepodařilo připravit pro AI kontrolu.");
    }

    return {
      sourceKey: source.key,
      stagingPath: storagePath,
      reference: {
        bucket: MODERATION_IMAGE_STAGING_BUCKET,
        storagePath,
      } satisfies ModerationImageReference,
    };
  }));

  for (const prepared of preparedSources) {
    if (prepared.sourceKey && prepared.stagingPath) {
      stagedPathsByKey[prepared.sourceKey] = prepared.stagingPath;
    }
  }
  const imageReferences = preparedSources.map((prepared) => prepared.reference);
  const renditionSignature = imageReferences
    .map((reference) => `${reference.bucket}:${reference.storagePath}`)
    .join("|");

  if (renditionSignature !== preparedRenditionSignature) {
    const renditionResult =
      await prepareModerationImageRenditions(imageReferences);
    if (!renditionResult.ok) {
      throw new Error(renditionResult.error);
    }
  }

  return {
    payload: {
      imageReferences,
      mainImageIndex: Math.min(
        Math.max(mainImageIndex, 0),
        imageReferences.length - 1,
      ),
    },
    stagedPathsByKey,
    renditionSignature,
  };
}
