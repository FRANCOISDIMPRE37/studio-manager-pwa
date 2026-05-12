import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import de from "./locales/de.json";
import nl from "./locales/nl.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      de: { translation: de },
      nl: { translation: nl },
      es: { translation: es },
      it: { translation: it },
      pt: { translation: pt },
    },
    lng: "fr",
    fallbackLng: "fr",
    supportedLngs: ["fr", "en", "de", "nl", "es", "it", "pt"],
    detection: {
      order: ["navigator", "htmlTag"],
      caches: [],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
