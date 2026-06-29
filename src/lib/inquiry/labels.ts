import type { CategoryType } from "@/types/post";

export function getInquiryCtaLabel(categoryType: CategoryType): string {
  switch (categoryType) {
    case "udalost":
      return "Mám zájem o účast";
    case "prace":
      return "Odpovědět na nabídku / úkol";
    default:
      return "Napsat prodejci";
  }
}

export function getInquiryHeading(categoryType: CategoryType): string {
  switch (categoryType) {
    case "udalost":
      return "Přihlášení k účasti";
    case "prace":
      return "Odpověď na nabídku";
    default:
      return "Poptávka";
  }
}

export function getInquirySubmitLabel(categoryType: CategoryType): string {
  switch (categoryType) {
    case "udalost":
      return "Odeslat zájem o účast";
    case "prace":
      return "Odeslat odpověď";
    default:
      return "Odeslat poptávku";
  }
}
