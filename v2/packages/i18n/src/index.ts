// Port EN/EL catalogs here from the legacy src/components/translations/{en,el}.jsx.
export const locales = ["el", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "el";
