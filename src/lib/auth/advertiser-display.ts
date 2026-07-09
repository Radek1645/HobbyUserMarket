import { formatIcoDisplay } from "@/lib/company/ico";

export type AdvertiserProfile = {
  nickname: string;
  is_company: boolean;
  company_name: string | null;
  company_ico: string | null;
};

export function getAdvertiserPrimaryLabel(profile: AdvertiserProfile): string {
  if (profile.is_company && profile.company_name?.trim()) {
    return profile.company_name.trim();
  }

  return profile.nickname;
}

export function getAdvertiserPrimaryLabelTitle(
  profile: AdvertiserProfile,
): string {
  return profile.is_company ? "Název firmy" : "Zadavatel";
}

export function getAdvertiserIcoDisplay(
  profile: AdvertiserProfile,
): string | null {
  if (!profile.is_company || !profile.company_ico) return null;
  return formatIcoDisplay(profile.company_ico);
}
