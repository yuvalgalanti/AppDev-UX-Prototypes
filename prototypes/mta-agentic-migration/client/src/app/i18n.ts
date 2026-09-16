import { default as i18n } from "i18next";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

import { PUBLIC_PATH } from "./publicPath";

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: "en",
    fallbackLng: "en",
    debug: false,
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `${PUBLIC_PATH}locales/{{lng}}/{{ns}}.json`,
    },

    returnEmptyString: false,
  });

export default i18n;
