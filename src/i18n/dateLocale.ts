import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { fr } from "date-fns/locale";
import { de } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { SupportedLanguage } from "./index";

const localeMap: Record<SupportedLanguage, Locale> = {
  es,
  en: enUS,
  fr,
  de,
};

export function getDateLocale(lang: string): Locale {
  return localeMap[lang as SupportedLanguage] ?? es;
}
