import { useTranslation } from "react-i18next";
import { useProfile } from "./useProfile";
import { storageService } from "../services/storageService";
import type { Language } from "../types";

export function useI18n() {
  const { i18n } = useTranslation();
  const { profile } = useProfile();

  const languages: Language[] = [
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
    { code: "ur", name: "Urdu", nativeName: "اردو" },
    { code: "od", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
    { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  ];

  const currentLanguage = i18n.language || profile?.websiteLanguage || "ml";

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    if (profile) {
      // Persist preference in profile
      const updated = { ...profile, websiteLanguage: langCode } as any;
      storageService.saveProfile(updated).catch(() => void 0);
    }
  };

  return {
    languages,
    currentLanguage,
    changeLanguage,
  };
}
