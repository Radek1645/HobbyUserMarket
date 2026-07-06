"use client";

import { SEARCH_QUERY_MIN_LENGTH } from "@/config/app";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  isSearchQueryValid,
  normalizeSearchQuery,
} from "@/lib/posts/search-query";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = normalizeSearchQuery(searchParams.get("q"));

  const [value, setValue] = useState(urlQuery);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setValue(urlQuery);
    setHint(null);
  }, [urlQuery]);

  const navigateWithQuery = useCallback(
    (raw: string) => {
      const query = normalizeSearchQuery(raw);

      if (!query) {
        if (pathname === "/") {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("q");
          const next = params.toString();
          router.push(next ? `/?${next}` : "/");
        }
        setHint(null);
        return;
      }

      if (!isSearchQueryValid(query)) {
        setHint(`Zadejte alespoň ${SEARCH_QUERY_MIN_LENGTH} znaky.`);
        return;
      }

      const params = new URLSearchParams();
      if (pathname === "/") {
        const kategorie = searchParams.get("kategorie");
        if (kategorie) params.set("kategorie", kategorie);
      }
      params.set("q", query);
      router.push(`/?${params.toString()}`);
      setHint(null);
    },
    [pathname, router, searchParams],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateWithQuery(value);
  }

  function handleClear() {
    setValue("");
    navigateWithQuery("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative min-w-0 flex-1"
      role="search"
      aria-label="Hledat inzeráty"
    >
      <span className="sr-only">Hledat</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        role="searchbox"
        name="q"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (hint) setHint(null);
        }}
        placeholder="Hledat inzeráty…"
        autoComplete="off"
        enterKeyHint="search"
        aria-invalid={hint ? true : undefined}
        aria-describedby={hint ? "header-search-hint" : undefined}
        className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pr-9 pl-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-200"
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Vymazat hledání"
          className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200/80 hover:text-gray-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="submit"
        {...gtmCtaProps(GTM_CTA.HEADER_SEARCH_SUBMIT)}
        className="sr-only"
      >
        Hledat
      </button>
      {hint ? (
        <p
          id="header-search-hint"
          role="status"
          className="absolute top-full left-0 z-10 mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 shadow-sm"
        >
          {hint}
        </p>
      ) : null}
    </form>
  );
}
