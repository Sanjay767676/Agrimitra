import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language files
import en from './locales/en.json';
import ml from './locales/ml.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';
import ur from './locales/ur.json';
import od from './locales/od.json';
import as from './locales/as.json';

const resources = {
  en: { translation: en },
  ml: { translation: ml },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  bn: { translation: bn },
  mr: { translation: mr },
  gu: { translation: gu },
  pa: { translation: pa },
  ur: { translation: ur },
  od: { translation: od },
  as: { translation: as },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ml', // Default to Malayalam
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
