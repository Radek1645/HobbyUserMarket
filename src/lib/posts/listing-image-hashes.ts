import { createHash } from "node:crypto";
import { LISTING_IMAGE_BUCKET } from "@/config/app";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StoredListingImageBinding = {
  id: string;
  storagePath: string;
  url: string;
  sortOrder: number;
  isMain: boolean;
  sha256: string;
};

/**
 * SEC-H02: autoritativní SHA-256 všech aktuálně uložených Storage objektů.
 * Nevěří FormData ani hashům z prohlížeče; před publikací stáhne přesné
 * soubory podle `post_images` a vrátí hashe v kanonickém pořadí.
 */
export async function buildStoredListingImageBindings(
  supabase: SupabaseClient,
  postId: number,
): Promise<{ bindings: StoredListingImageBinding[] } | { error: string }> {
  const { data: rows, error: rowsError } = await supabase
    .from("post_images")
    .select("id, storage_path, url, sort_order, is_main")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (rowsError) {
    console.error("computeStoredListingImageHashes rows:", rowsError);
    return { error: "Fotky se nepodařilo bezpečně ověřit." };
  }

  const mainCount = (rows ?? []).filter((row) => row.is_main).length;
  if ((rows?.length ?? 0) > 0 && mainCount !== 1) {
    return { error: "Fotky nemají jednoznačně určený hlavní snímek." };
  }

  const bindings: StoredListingImageBinding[] = [];
  for (const row of rows ?? []) {
    const { data: publicUrl } = supabase.storage
      .from(LISTING_IMAGE_BUCKET)
      .getPublicUrl(row.storage_path);
    if (row.url !== publicUrl.publicUrl) {
      return { error: "Fotky mají neplatnou vazbu na úložiště." };
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from(LISTING_IMAGE_BUCKET)
      .download(row.storage_path);

    if (downloadError || !file) {
      console.error("computeStoredListingImageHashes download:", downloadError);
      return { error: "Fotky se nepodařilo bezpečně ověřit." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    bindings.push({
      id: row.id,
      storagePath: row.storage_path,
      url: row.url,
      sortOrder: row.sort_order,
      isMain: row.is_main,
      sha256: createHash("sha256").update(buffer).digest("hex"),
    });
  }

  return { bindings };
}
