export type VopVersionVariant = "fo" | "osvc";

export type VopVersionInfo =
  | {
      ok: true;
      version: string;
      variant: VopVersionVariant;
      pdfPath: string;
      snapshotPath: string;
      snapshotPagePath: string;
    }
  | { ok: false };

const VOP_VERSION_RE = /^(\d+(?:\.\d+){0,2})-(fo|osvc)$/;

export function resolveVopVersionInfo(vopVersion: string): VopVersionInfo {
  const match = vopVersion.trim().match(VOP_VERSION_RE);
  if (!match) {
    return { ok: false };
  }

  const version = match[1]!;
  const variant = match[2]! as VopVersionVariant;
  const fullVersion = `${version}-${variant}`;
  return {
    ok: true,
    version: fullVersion,
    variant,
    pdfPath: `/docs/vop-v${version}-${variant}.pdf`,
    snapshotPath: `docs/pravni/snapshots/vop-v${fullVersion}.md`,
    snapshotPagePath: `/vop/verze/${fullVersion}`,
  };
}

