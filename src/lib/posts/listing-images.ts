import {
  LISTING_IMAGE_BUCKET,
  LISTING_IMAGE_EXTENSIONS,
  LISTING_IMAGE_MAX_FILE_BYTES,
  LISTING_IMAGE_MAX_FILES,
  LISTING_IMAGE_MAX_SOURCE_BYTES,
} from "@/config/app";
import type { SupabaseClient } from "@supabase/supabase-js";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ParsedListingImagesForm = {
  imageOrder: string[];
  mainImageKey: string;
  removedIds: string[];
  newFiles: File[];
};

export function validateListingImageSourceFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Nahraj jen obrázek (JPG, PNG nebo WebP).";
  }

  if (file.size > LISTING_IMAGE_MAX_SOURCE_BYTES) {
    const maxMb = Math.round(LISTING_IMAGE_MAX_SOURCE_BYTES / (1024 * 1024));
    return `Jeden soubor může mít maximálně ${maxMb} MB před zmenšením.`;
  }

  return null;
}

export function validateListingImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Nahraj jen obrázek (JPG, PNG nebo WebP).";
  }

  const ext = getExtensionFromName(file.name);
  if (
    ext &&
    !LISTING_IMAGE_EXTENSIONS.some(
      (allowed) => allowed === ext || (ext === ".jpeg" && allowed === ".jpg"),
    )
  ) {
    return "Povolené formáty: JPG, PNG, WebP.";
  }

  if (file.size > LISTING_IMAGE_MAX_FILE_BYTES) {
    const maxMb = Math.round(LISTING_IMAGE_MAX_FILE_BYTES / (1024 * 1024));
    return `Fotka po zmenšení nesmí přesáhnout ${maxMb} MB.`;
  }

  return null;
}

function getExtensionFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot).toLowerCase();
}

function resolveFileExtension(file: File): string {
  return MIME_TO_EXT[file.type] ?? getExtensionFromName(file.name).replace(".", "") ?? "jpg";
}

export function parseListingImagesFormData(
  formData: FormData,
): ParsedListingImagesForm {
  const imageOrder = String(formData.get("imageOrder") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const mainImageKey = String(formData.get("mainImageKey") ?? "").trim();
  const removedIds = formData.getAll("removedImageId").map(String);
  const newFiles = formData
    .getAll("listingImages")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  return { imageOrder, mainImageKey, removedIds, newFiles };
}

function getPublicUrl(
  supabase: SupabaseClient,
  storagePath: string,
): string {
  const { data } = supabase.storage
    .from(LISTING_IMAGE_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadListingImageFile(
  supabase: SupabaseClient,
  userId: string,
  postId: number,
  file: File,
): Promise<{ storage_path: string; url: string }> {
  const validationError = validateListingImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext = resolveFileExtension(file);
  const storagePath = `${userId}/${postId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(LISTING_IMAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error("Fotku se nepodařilo nahrát. Zkus to znovu.");
  }

  return {
    storage_path: storagePath,
    url: getPublicUrl(supabase, storagePath),
  };
}

type SyncResult = { error?: string };

export async function syncListingImagesFromForm(
  supabase: SupabaseClient,
  userId: string,
  postId: number,
  formData: FormData,
): Promise<SyncResult> {
  const { imageOrder, mainImageKey, removedIds, newFiles } =
    parseListingImagesFormData(formData);

  const hasWork =
    imageOrder.length > 0 || newFiles.length > 0 || removedIds.length > 0;

  if (!hasWork) {
    return {};
  }

  if (imageOrder.length > LISTING_IMAGE_MAX_FILES) {
    return { error: `Maximálně ${LISTING_IMAGE_MAX_FILES} fotek na inzerát.` };
  }

  const newKeysInOrder = imageOrder.filter((key) => key.startsWith("n:"));
  if (newKeysInOrder.length !== newFiles.length) {
    return { error: "Nepodařilo se zpracovat nahrané fotky. Zkus to znovu." };
  }

  for (const file of newFiles) {
    const validationError = validateListingImageFile(file);
    if (validationError) {
      return { error: validationError };
    }
  }

  if (removedIds.length > 0) {
    const { data: removedRows, error: fetchRemovedError } = await supabase
      .from("post_images")
      .select("id, storage_path")
      .eq("post_id", postId)
      .in("id", removedIds);

    if (fetchRemovedError) {
      console.error("syncListingImages fetch removed:", fetchRemovedError);
      return { error: "Fotky se nepodařilo upravit." };
    }

    for (const row of removedRows ?? []) {
      await supabase.storage.from(LISTING_IMAGE_BUCKET).remove([row.storage_path]);
    }

    const { error: deleteError } = await supabase
      .from("post_images")
      .delete()
      .eq("post_id", postId)
      .in("id", removedIds);

    if (deleteError) {
      console.error("syncListingImages delete:", deleteError);
      return { error: "Fotky se nepodařilo smazat." };
    }
  }

  if (imageOrder.length === 0) {
    await supabase
      .from("posts")
      .update({ main_image_url: null })
      .eq("id", postId);
    return {};
  }

  const uploadedByKey = new Map<string, { storage_path: string; url: string }>();
  let newFileIndex = 0;

  for (const key of newKeysInOrder) {
    const file = newFiles[newFileIndex];
    if (!file) break;

    try {
      const uploaded = await uploadListingImageFile(
        supabase,
        userId,
        postId,
        file,
      );
      uploadedByKey.set(key, uploaded);
    } catch (uploadError) {
      return {
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "Fotku se nepodařilo nahrát.",
      };
    }

    newFileIndex += 1;
  }

  const resolvedRows: Array<{
    id?: string;
    storage_path: string;
    url: string;
    sort_order: number;
    is_main: boolean;
  }> = [];

  imageOrder.forEach((key, index) => {
    if (key.startsWith("e:")) {
      const id = key.slice(2);
      if (removedIds.includes(id)) return;
      resolvedRows.push({
        id,
        storage_path: "",
        url: "",
        sort_order: index,
        is_main: key === mainImageKey,
      });
      return;
    }

    if (key.startsWith("n:")) {
      const uploaded = uploadedByKey.get(key);
      if (!uploaded) return;
      resolvedRows.push({
        storage_path: uploaded.storage_path,
        url: uploaded.url,
        sort_order: index,
        is_main: key === mainImageKey,
      });
    }
  });

  if (resolvedRows.length === 0) {
    await supabase
      .from("posts")
      .update({ main_image_url: null })
      .eq("id", postId);
    return {};
  }

  const effectiveMainKey =
    mainImageKey && imageOrder.includes(mainImageKey)
      ? mainImageKey
      : imageOrder[0]!;

  for (const row of resolvedRows) {
    row.is_main = false;
  }

  const mainIndex = imageOrder.indexOf(effectiveMainKey);
  if (mainIndex >= 0 && resolvedRows[mainIndex]) {
    resolvedRows[mainIndex]!.is_main = true;
  } else {
    resolvedRows[0]!.is_main = true;
  }

  await supabase
    .from("post_images")
    .update({ is_main: false })
    .eq("post_id", postId);

  for (const row of resolvedRows) {
    if (row.id) {
      const { error: updateError } = await supabase
        .from("post_images")
        .update({
          sort_order: row.sort_order,
          is_main: row.is_main,
        })
        .eq("id", row.id)
        .eq("post_id", postId);

      if (updateError) {
        console.error("syncListingImages update existing:", updateError);
        return { error: "Fotky se nepodařilo uložit." };
      }
      continue;
    }

    const { error: insertError } = await supabase.from("post_images").insert({
      post_id: postId,
      storage_path: row.storage_path,
      url: row.url,
      sort_order: row.sort_order,
      is_main: row.is_main,
    });

    if (insertError) {
      console.error("syncListingImages insert:", insertError);
      return { error: "Fotky se nepodařilo uložit." };
    }
  }

  const mainRow = resolvedRows.find((row) => row.is_main) ?? resolvedRows[0];
  let mainUrl: string | null = mainRow?.url ? mainRow.url : null;

  if (mainRow?.id && !mainUrl) {
    const { data: mainImage } = await supabase
      .from("post_images")
      .select("url")
      .eq("id", mainRow.id)
      .maybeSingle<{ url: string }>();
    mainUrl = mainImage?.url ?? null;
  }

  await supabase
    .from("posts")
    .update({ main_image_url: mainUrl })
    .eq("id", postId);

  return {};
}

export async function getListingImages(
  supabase: SupabaseClient,
  postId: number,
): Promise<
  Array<{ id: string; url: string; is_main: boolean; sort_order: number }>
> {
  const { data, error } = await supabase
    .from("post_images")
    .select("id, url, is_main, sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data;
}
