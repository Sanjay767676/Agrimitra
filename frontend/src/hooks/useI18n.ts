import { useTranslation } from "react-i18next";
import { useProfile } from "./useProfile";
import { storageService } from "../services/storageService";
import type { Language } from "../types";

export function useI18n() {
  const { i18n } = useTranslation();
  const { profile } = useProfile();

  const languages: Language[] = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
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

  const currentLanguage =
    i18n.language ||
    (typeof window !== "undefined" ? localStorage.getItem("i18nextLng") : null) ||
    profile?.websiteLanguage ||
    "en";

  const changeLanguage = async (langCode: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", langCode);
    }
    await i18n.changeLanguage(langCode);
    if (profile) {
      const updated = {
        ...profile,
        websiteLanguage: langCode,
        chatbotLanguage: langCode,
      } as any;
      storageService.saveProfile(updated).catch(() => void 0);
    }
  };

  return {
    languages,
    currentLanguage,
    changeLanguage,
  };
}
