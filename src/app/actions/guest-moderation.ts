"use server";

import {
  LISTING_IMAGE_MAX_FILE_BYTES,
  LISTING_IMAGE_MAX_FILES,
  MODERATION_IMAGE_RENDITION_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
} from "@/config/app";
import {
  MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
  MODERATION_IMAGE_RENDITION_QUALITY,
  MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
} from "@/config/moderation";
import { detectFileKindFromBytes } from "@/lib/files/magic-bytes";
import { assertGuestUploadRateLimit } from "@/lib/guest/anonymous-rate-limit";
import {
  buildGuestOwnerPrefix,
  isGuestVisitorId,
} from "@/lib/guest/visitor-id";
import {
  ensureGuestVisitorId,
  readGuestVisitorId,
  signGuestVisitorId,
} from "@/lib/guest/visitor-id-server";
import type { ModerationImageReference } from "@/lib/moderation/prepare-moderation-images";
import { readClientIpFromHeaders } from "@/lib/security/client-ip";
import { verifyTurnstileTokenServer } from "@/lib/security/turnstile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import sharp from "sharp";

const ALLOWED_IMAGE_KINDS = new Set(["jpeg", "png", "webp"]);
const MODERATION_IMAGE_MAX_INPUT_PIXELS = 40_000_000;

type GuestUploadItemResult = {
  clientKey: string;
  storagePath: string;
  reference: ModerationImageReference;
};

type GuestBatchUploadResult =
  | {
      ok: true;
      visitorId: string;
      items: GuestUploadItemResult[];
    }
  | { ok: false; error: string; captchaRequired?: boolean };

type GuestUploadResult =
  | {
      ok: true;
      visitorId: string;
      storagePath: string;
      reference: ModerationImageReference;
    }
  | { ok: false; error: string; captchaRequired?: boolean };

function getFileExtension(mimeType: string): string {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/png") return "png";
  return "jpg";
}

/**
 * Nahraje jednu nebo více fotek do guest stagingu.
 * Abuse limit: IP/visitor rate limit; Turnstile po soft limitu nahrávání.
 */
export async function uploadGuestModerationImages(
  formData: FormData,
): Promise<GuestBatchUploadResult> {
  const files = formData.getAll("file").filter((entry): entry is File => {
    return entry instanceof File && entry.size > 0;
  });
  const clientKeys = formData
    .getAll("clientKey")
    .map((value) => String(value ?? "").trim());

  if (files.length === 0) {
    return { ok: false, error: "Chybí fotka." };
  }
  if (files.length > LISTING_IMAGE_MAX_FILES) {
    return { ok: false, error: `Najednou lze nahrát nejvýše ${LISTING_IMAGE_MAX_FILES} fotek.` };
  }

  const ensured = await ensureGuestVisitorId();
  if (!ensured.ok) {
    return { ok: false, error: ensured.error };
  }
  const visitorId = ensured.visitorId;
  const headerStore = await headers();
  const ipAddress = readClientIpFromHeaders(headerStore);
  const turnstileToken = String(formData.get("turnstileToken") ?? "").trim();
  let captchaVerified = false;
  if (turnstileToken) {
    captchaVerified = await verifyTurnstileTokenServer({
      token: turnstileToken,
      ipAddress,
    });
  }
  const admin = createAdminClient();
  if (!admin.ok) {
    console.error("uploadGuestModerationImages admin:", admin.error);
    return { ok: false, error: "Fotky se nepodařilo připravit pro AI kontrolu." };
  }

  const ownerPrefix = buildGuestOwnerPrefix(visitorId);
  const items: GuestUploadItemResult[] = [];
  const preparedFiles: Array<{
    file: File;
    bytes: Buffer;
    kind: string;
  }> = [];

  for (const file of files) {
    if (file.size > LISTING_IMAGE_MAX_FILE_BYTES) {
      return { ok: false, error: "Fotka je příliš velká." };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = detectFileKindFromBytes(bytes);
    if (!kind || !ALLOWED_IMAGE_KINDS.has(kind)) {
      return {
        ok: false,
        error: "Fotka nemá podporovaný formát JPG, PNG nebo WebP.",
      };
    }
    preparedFiles.push({ file, bytes, kind });
  }

  // Celou dávku nejdřív rezervujeme v limitu; žádná půlka batch se nenahraje.
  for (let index = 0; index < preparedFiles.length; index++) {
    const rate = await assertGuestUploadRateLimit({
      ipAddress,
      visitorId,
      captchaVerified,
    });
    if (!rate.ok) {
      return {
        ok: false,
        error: rate.error,
        captchaRequired: rate.captchaRequired,
      };
    }
  }

  for (let index = 0; index < preparedFiles.length; index++) {
    const { file, bytes, kind } = preparedFiles[index]!;
    const storagePath = `${ownerPrefix}/${crypto.randomUUID()}/${crypto.randomUUID()}.${getFileExtension(file.type || `image/${kind}`)}`;

    const { error: uploadError } = await admin.client.storage
      .from(MODERATION_IMAGE_STAGING_BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type || `image/${kind}`,
        upsert: false,
      });
    if (uploadError) {
      console.error("guest staging upload:", uploadError);
      await admin.client.storage
        .from(MODERATION_IMAGE_STAGING_BUCKET)
        .remove(items.map((item) => item.storagePath));
      return { ok: false, error: "Fotku se nepodařilo připravit pro AI kontrolu." };
    }

    try {
      await prepareGuestRenditions(admin, ownerPrefix, {
        bucket: MODERATION_IMAGE_STAGING_BUCKET,
        storagePath,
      });
    } catch (error) {
      console.error("guest renditions:", error);
      await admin.client.storage
        .from(MODERATION_IMAGE_STAGING_BUCKET)
        .remove([
          ...items.map((item) => item.storagePath),
          storagePath,
        ]);
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Fotky se nepodařilo připravit pro AI kontrolu.",
      };
    }

    items.push({
      clientKey: clientKeys[index] || `idx:${index}`,
      storagePath,
      reference: {
        bucket: MODERATION_IMAGE_STAGING_BUCKET,
        storagePath,
      },
    });
  }

  return { ok: true, visitorId, items };
}

/**
 * @deprecated Preferuj `uploadGuestModerationImages` (jeden Turnstile na dávku).
 * Zachováno pro kompatibilitu — deleguje na batch.
 */
export async function uploadGuestModerationImage(
  formData: FormData,
): Promise<GuestUploadResult> {
  const batch = await uploadGuestModerationImages(formData);
  if (!batch.ok) {
    return batch;
  }
  const first = batch.items[0];
  if (!first) {
    return { ok: false, error: "Chybí fotka." };
  }
  return {
    ok: true,
    visitorId: batch.visitorId,
    storagePath: first.storagePath,
    reference: first.reference,
  };
}

/** Zajistí guest visitor cookie (volat z guest stránky). */
export async function bootstrapGuestVisitor(): Promise<
  | { ok: true; visitorId: string; visitorToken: string }
  | { ok: false; error: string }
> {
  const ensured = await ensureGuestVisitorId();
  if (!ensured.ok) {
    return ensured;
  }
  return {
    ok: true,
    visitorId: ensured.visitorId,
    visitorToken: signGuestVisitorId(ensured.visitorId),
  };
}

async function prepareGuestRenditions(
  admin: ReturnType<typeof createAdminClient> & { ok: true },
  ownerPrefix: string,
  reference: ModerationImageReference,
): Promise<void> {
  if (!reference.storagePath.startsWith(`${ownerPrefix}/`)) {
    throw new Error("Fotka nemá platnou vazbu na návštěvnickou relaci.");
  }

  const { data: original, error: downloadError } = await admin.client.storage
    .from(reference.bucket)
    .download(reference.storagePath);
  if (downloadError || !original) {
    throw new Error("Fotku se nepodařilo načíst pro AI kontrolu.");
  }

  const originalBytes = Buffer.from(await original.arrayBuffer());
  const imageHash = createHash("sha256").update(originalBytes).digest("hex");
  const prefix = `${ownerPrefix}/${imageHash}`;
  const geminiPath = `${prefix}/gemini.webp`;
  const sightenginePath = `${prefix}/sightengine.webp`;

  const { data: cachedFiles } = await admin.client.storage
    .from(MODERATION_IMAGE_RENDITION_BUCKET)
    .list(prefix, { limit: 2 });
  const cachedNames = new Set((cachedFiles ?? []).map((file) => file.name));
  if (cachedNames.has("gemini.webp") && cachedNames.has("sightengine.webp")) {
    return;
  }

  const image = sharp(originalBytes, {
    failOn: "error",
    limitInputPixels: MODERATION_IMAGE_MAX_INPUT_PIXELS,
  }).rotate();

  const [geminiBytes, sightengineBytes] = await Promise.all([
    image
      .clone()
      .resize({
        width: MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
        height: MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: MODERATION_IMAGE_RENDITION_QUALITY })
      .toBuffer(),
    image
      .clone()
      .resize({
        width: MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
        height: MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: MODERATION_IMAGE_RENDITION_QUALITY })
      .toBuffer(),
  ]);

  await Promise.all([
    admin.client.storage.from(MODERATION_IMAGE_RENDITION_BUCKET).upload(
      geminiPath,
      geminiBytes,
      { contentType: "image/webp", upsert: true },
    ),
    admin.client.storage.from(MODERATION_IMAGE_RENDITION_BUCKET).upload(
      sightenginePath,
      sightengineBytes,
      { contentType: "image/webp", upsert: true },
    ),
  ]);
}

export type ClaimGuestImagesResult =
  | {
      ok: true;
      imageReferences: ModerationImageReference[];
      mainImageIndex: number;
    }
  | { ok: false; error: string };

/**
 * Po OAuth zkopíruje guest staging → user staging (trust boundary).
 * Draft v localStorage není důvěryhodný — cesty se ověří proti httpOnly cookie.
 */
export async function claimGuestStagingImages(params: {
  storagePaths: string[];
  mainImageIndex: number;
}): Promise<ClaimGuestImagesResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "Pro publikaci se přihlaste." };
  }

  const visitorId = await readGuestVisitorId();
  if (!visitorId || !isGuestVisitorId(visitorId)) {
    return { ok: false, error: "Návštěvnická relace vypršela. Nahrajte fotky znovu." };
  }

  const ownerPrefix = buildGuestOwnerPrefix(visitorId);
  const paths = params.storagePaths
    .map((path) => path.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (paths.length === 0) {
    return { ok: true, imageReferences: [], mainImageIndex: -1 };
  }

  for (const path of paths) {
    if (!path.startsWith(`${ownerPrefix}/`)) {
      return { ok: false, error: "Fotky neodpovídají této relaci. Nahrajte je znovu." };
    }
  }

  const admin = createAdminClient();
  if (!admin.ok) {
    return { ok: false, error: "Fotky se nepodařilo převzít. Zkuste to znovu." };
  }
  const adminClient = admin.client;

  const claimed: ModerationImageReference[] = [];
  async function rollbackClaimedImages(): Promise<void> {
    if (claimed.length === 0) return;
    const { error } = await adminClient.storage
      .from(MODERATION_IMAGE_STAGING_BUCKET)
      .remove(claimed.map((reference) => reference.storagePath));
    if (error) {
      console.error("claimGuestStagingImages rollback:", error);
    }
  }

  for (const guestPath of paths) {
    const { data: original, error: downloadError } = await adminClient.storage
      .from(MODERATION_IMAGE_STAGING_BUCKET)
      .download(guestPath);
    if (downloadError || !original) {
      await rollbackClaimedImages();
      return { ok: false, error: "Fotky ze schránky se nepodařilo načíst." };
    }

    const bytes = Buffer.from(await original.arrayBuffer());
    const ext = guestPath.split(".").pop() || "jpg";
    const userPath = `${user.id}/${crypto.randomUUID()}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await adminClient.storage
      .from(MODERATION_IMAGE_STAGING_BUCKET)
      .upload(userPath, bytes, {
        contentType: original.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      await rollbackClaimedImages();
      return { ok: false, error: "Fotky se nepodařilo převzít na účet." };
    }

    claimed.push({
      bucket: MODERATION_IMAGE_STAGING_BUCKET,
      storagePath: userPath,
    });
  }

  // Renditions pod userId — Edge final approval je očekává.
  const { prepareModerationImageRenditions } = await import(
    "@/app/actions/moderation-images"
  );
  const renditions = await prepareModerationImageRenditions(claimed);
  if (!renditions.ok) {
    await rollbackClaimedImages();
    return { ok: false, error: renditions.error };
  }

  // Best-effort cleanup guest staging (orphany jinak žijí do purge 24 h).
  const { error: removeError } = await adminClient.storage
    .from(MODERATION_IMAGE_STAGING_BUCKET)
    .remove(paths);
  if (removeError) {
    console.error("claimGuestStagingImages guest cleanup:", removeError);
  }

  return {
    ok: true,
    imageReferences: claimed,
    mainImageIndex: Math.min(
      Math.max(params.mainImageIndex, 0),
      claimed.length - 1,
    ),
  };
}
