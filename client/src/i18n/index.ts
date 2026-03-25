import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import de from "./locales/de.json";
import nl from "./locales/nl.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      de: { translation: de },
      nl: { translation: nl },
    },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en", "de", "nl"],
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "studioManagerLang",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
