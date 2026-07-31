import {
  MODERATION_IMAGE_RENDITION_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
  MODERATION_IMAGE_STAGING_RETENTION_HOURS,
} from "@/config/app";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const STORAGE_LIST_PAGE_SIZE = 100;
const STORAGE_GROUPS_MAX_PER_BUCKET = 500;

async function listStorageFolder(
  admin: SupabaseClient,
  bucket: string,
  path: string,
): Promise<
  Array<{ name: string; id?: string | null; created_at?: string | null }>
> {
  const entries: Array<{
    name: string;
    id?: string | null;
    created_at?: string | null;
  }> = [];

  for (let offset = 0; ; offset += STORAGE_LIST_PAGE_SIZE) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(path, {
        limit: STORAGE_LIST_PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
    if (error) {
      throw error;
    }

    entries.push(...(data ?? []));
    if ((data?.length ?? 0) < STORAGE_LIST_PAGE_SIZE) {
      return entries;
    }
  }
}

async function purgeBucket(
  admin: SupabaseClient,
  bucket: string,
  cutoffMs: number,
): Promise<{ deleted: number; groupsScanned: number; truncated: boolean }> {
  const stalePaths: string[] = [];
  let groupsScanned = 0;
  const userFolders = await listStorageFolder(admin, bucket, "");

  for (const userFolder of userFolders) {
    const groupFolders = await listStorageFolder(
      admin,
      bucket,
      userFolder.name,
    );
    for (const groupFolder of groupFolders) {
      if (groupsScanned >= STORAGE_GROUPS_MAX_PER_BUCKET) break;
      groupsScanned += 1;

      const groupPath = `${userFolder.name}/${groupFolder.name}`;
      const files = await listStorageFolder(admin, bucket, groupPath);
      for (const file of files) {
        const createdAtMs = Date.parse(file.created_at ?? "");
        if (Number.isFinite(createdAtMs) && createdAtMs < cutoffMs) {
          stalePaths.push(`${groupPath}/${file.name}`);
        }
      }
    }
    if (groupsScanned >= STORAGE_GROUPS_MAX_PER_BUCKET) break;
  }

  if (stalePaths.length > 0) {
    const { error } = await admin.storage.from(bucket).remove(stalePaths);
    if (error) throw error;
  }

  return {
    deleted: stalePaths.length,
    groupsScanned,
    truncated: groupsScanned >= STORAGE_GROUPS_MAX_PER_BUCKET,
  };
}

/** Denní úklid opuštěných originálů a dočasně cachovaných AI variant. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    return NextResponse.json({ error: adminResult.error }, { status: 500 });
  }

  const admin = adminResult.client;
  const cutoffMs =
    Date.now() - MODERATION_IMAGE_STAGING_RETENTION_HOURS * 60 * 60 * 1000;

  try {
    const [staging, renditions] = await Promise.all([
      purgeBucket(admin, MODERATION_IMAGE_STAGING_BUCKET, cutoffMs),
      purgeBucket(admin, MODERATION_IMAGE_RENDITION_BUCKET, cutoffMs),
    ]);
    return NextResponse.json({
      ok: true,
      retentionHours: MODERATION_IMAGE_STAGING_RETENTION_HOURS,
      staging,
      renditions,
    });
  } catch (error) {
    console.error("moderation image cleanup:", error);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}
