"use client";

import Image from "next/image";
import { useState } from "react";

type UserAvatarProps = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  size?: number;
  className?: string;
};

export function UserAvatar({
  avatarUrl,
  displayName,
  email,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial =
    displayName[0]?.toUpperCase() ?? email[0]?.toUpperCase() ?? "?";

  const sharedClass = `h-10 w-10 rounded-full ${className}`.trim();

  if (!avatarUrl || imageFailed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-sm font-medium text-gray-600 ${sharedClass}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt=""
      width={size}
      height={size}
      className={`object-cover ${sharedClass}`}
      unoptimized
      onError={() => setImageFailed(true)}
    />
  );
}
