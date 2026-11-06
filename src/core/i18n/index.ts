export type Locale = 'en' | 'es';

export const LOCALES: readonly Locale[] = ['en', 'es'];

/** Text available in every supported locale. */
export type LocalizedText = Record<Locale, string>;

export type Dictionary = Record<string, string>;

export type Translator = (key: string, params?: Record<string, string | number>) => string;

export function pickText(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Creates a translator over per-locale dictionaries. Missing keys fall back to English and then to
 * the key itself, so a missing translation is visible instead of crashing.
 */
export function createTranslator(
  dictionaries: Record<Locale, Dictionary>,
  locale: Locale,
): Translator {
  const primary = dictionaries[locale];
  const fallback = dictionaries.en;
  return (key, params) => interpolate(primary[key] ?? fallback[key] ?? key, params);
}

export function detectLocale(languages: readonly string[] | undefined): Locale {
  for (const lang of languages ?? []) {
    const base = lang.toLowerCase().split('-')[0];
    if (base === 'es' || base === 'en') return base;
  }
  return 'en';
}
