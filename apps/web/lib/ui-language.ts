import languages from "@/public/languages.json";

export const UI_LANGUAGE_STORAGE_KEY = "ui-language";
export const UI_LANGUAGE_CHANGED_EVENT = "ui-language-changed";

/// The language the UI copy is authored in. Translation catalogs are keyed by
/// this language's source text, and the translator short-circuits on it
/// (source text needs no lookup). Changing this breaks every catalog, so it
/// must stay "en" — use INITIAL_UI_LANGUAGE to change what users see first.
export const DEFAULT_UI_LANGUAGE = "en";

/// The language shown on a first visit, when the user has not picked one yet
/// (no ?uiLang and nothing in localStorage). Chinese suits the math-homework
/// deployment; the UI language selector lets each visitor override it.
export const INITIAL_UI_LANGUAGE = "zh-CN";

const supportedLanguageCodes = new Set(languages.map((lang) => lang.code));

export function isSupportedUiLanguage(
  languageCode: string | null | undefined,
): languageCode is string {
  return Boolean(languageCode && supportedLanguageCodes.has(languageCode));
}

export function getStoredUiLanguage(): string | null {
  if (typeof window === "undefined") return null;

  const storedLanguage = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);

  return isSupportedUiLanguage(storedLanguage) ? storedLanguage : null;
}

export function setStoredUiLanguage(languageCode: string): void {
  if (typeof window === "undefined" || !isSupportedUiLanguage(languageCode)) {
    return;
  }

  window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, languageCode);
  window.dispatchEvent(
    new CustomEvent<string>(UI_LANGUAGE_CHANGED_EVENT, {
      detail: languageCode,
    }),
  );
}

/**
 * Pick the best default language for an assignment from its list of supported
 * codes. Tries the browser's preferred languages in order — exact case-
 * insensitive match first (so "zh-CN" matches "zh-CN"), then the base
 * language (so "en-US" matches "en") — then falls back to English, then to
 * the first item in the supplied list as a last resort.
 *
 * The fallback ordering reflects the primary userbase: English speakers
 * should land on English by default, not on whichever language sorts first
 * alphabetically.
 */
export function pickDefaultAssignmentLanguage(
  supportedCodes: readonly string[],
): string {
  if (supportedCodes.length === 0) return DEFAULT_UI_LANGUAGE;

  const lowerToOriginal = new Map<string, string>();
  for (const code of supportedCodes) {
    lowerToOriginal.set(code.toLowerCase(), code);
  }

  const browserCandidates: string[] =
    typeof navigator !== "undefined"
      ? Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? [...navigator.languages]
        : navigator.language
          ? [navigator.language]
          : []
      : [];

  for (const candidate of browserCandidates) {
    const lower = candidate.toLowerCase();
    const exact = lowerToOriginal.get(lower);
    if (exact) return exact;
    const base = lower.split("-")[0];
    const baseMatch = lowerToOriginal.get(base);
    if (baseMatch) return baseMatch;
  }

  const englishMatch = lowerToOriginal.get(DEFAULT_UI_LANGUAGE);
  if (englishMatch) return englishMatch;

  return supportedCodes[0];
}
