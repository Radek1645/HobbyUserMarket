import type { ReactNode } from "react";

type MobileScreenFrameProps = {
  children: ReactNode;
  /** Krátký popisek pod rámečkem (volitelné). */
  caption?: string;
};

export function MobileScreenFrame({ children, caption }: MobileScreenFrameProps) {
  return (
    <figure className="mx-auto w-full max-w-[280px]">
      <div
        className="relative rounded-[2rem] border-[6px] border-gray-900 bg-gray-900 p-2 shadow-xl shadow-gray-900/15"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-gray-900" />
        <div className="overflow-hidden rounded-[1.4rem] bg-gray-50">
          {children}
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs text-gray-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
