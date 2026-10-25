"use client";

import Dropdown from "@/components/Dropdown";
import { useActiveUiLanguage } from "@/hooks/use-active-ui-language";
import { isSupportedUiLanguage, setStoredUiLanguage } from "@/lib/ui-language";
import { cn } from "@/lib/strings";
import languages from "@/public/languages.json";
import { useMemo } from "react";

interface UiLanguageSelectorProps {
  className?: string;
}

/**
 * Picker for the language of the interface itself, kept distinct from the
 * assignment's content language — a learner can read an English assignment
 * with Chinese chrome, or the other way round.
 *
 * The choice is persisted through `setStoredUiLanguage`, which broadcasts
 * `UI_LANGUAGE_CHANGED_EVENT`; every `useActiveUiLanguage` instance (including
 * `RouteUiTranslator` and `useUiTranslation`) reacts to it, so the whole page
 * follows without a navigation. Nothing is written to the URL: replacing it on
 * an attempt route would re-run that route's server component, which is where
 * an attempt gets created.
 *
 * Labels stay untranslated on purpose (`disableUiTranslation`) — a list of
 * language names written out in the current language is unreadable to anyone
 * who needs it to switch away from that language.
 */
export default function UiLanguageSelector({
  className,
}: UiLanguageSelectorProps) {
  const activeLanguage = useActiveUiLanguage();

  const languageOptions = useMemo(
    () =>
      [...languages]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((language) => ({ value: language.code, label: language.name })),
    [],
  );

  const handleChangeUiLanguage = (selectedLanguage: string) => {
    if (!isSupportedUiLanguage(selectedLanguage)) return;
    if (selectedLanguage === activeLanguage) return;

    setStoredUiLanguage(selectedLanguage);
  };

  return (
    <div
      data-testid="ui-language-selector"
      translate="no"
      className={cn("relative", className)}
    >
      <Dropdown
        items={languageOptions}
        selectedItem={activeLanguage}
        setSelectedItem={handleChangeUiLanguage}
        placeholder="UI language"
        disableUiTranslation={true}
        aria-label="UI language"
      />
    </div>
  );
}
