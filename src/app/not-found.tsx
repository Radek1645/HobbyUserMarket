import { NotFoundView } from "@/components/not-found/NotFoundView";
import { NOT_FOUND_UI } from "@/config/not-found";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: NOT_FOUND_UI.metaTitle,
  description: NOT_FOUND_UI.metaDescription,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundView />;
}
