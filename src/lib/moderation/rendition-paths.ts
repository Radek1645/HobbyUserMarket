import {
  MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
  MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
} from "@/config/moderation";

export function moderationGeminiRenditionFileName(): string {
  return `gemini-${MODERATION_GEMINI_IMAGE_MAX_DIMENSION}.webp`;
}

export function moderationSightengineRenditionFileName(): string {
  return `sightengine-${MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION}.webp`;
}

export function buildModerationRenditionPaths(
  ownerPrefix: string,
  imageHash: string,
) {
  const prefix = `${ownerPrefix}/${imageHash}`;
  const geminiFileName = moderationGeminiRenditionFileName();
  const sightengineFileName = moderationSightengineRenditionFileName();
  return {
    prefix,
    geminiFileName,
    sightengineFileName,
    gemini: `${prefix}/${geminiFileName}`,
    sightengine: `${prefix}/${sightengineFileName}`,
  };
}
