/**
 * @jest-environment jsdom
 */

import { act, render, screen } from "@testing-library/react";
import UiLanguageSelector from "@/components/UiLanguageSelector";
import languages from "@/public/languages.json";
import {
  UI_LANGUAGE_CHANGED_EVENT,
  UI_LANGUAGE_STORAGE_KEY,
} from "@/lib/ui-language";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe("UiLanguageSelector", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("offers every language the UI can be translated into", async () => {
    await act(async () => {
      render(<UiLanguageSelector />);
    });

    await act(async () => {
      screen.getByRole("button").click();
    });

    const labels = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent);

    expect(labels).toHaveLength(languages.length);
    expect(labels).toContain("English");
    expect(labels).toContain(languages.find((l) => l.code === "zh-CN")!.name);
  });

  it("persists the picked language and broadcasts the change", async () => {
    const onChange = jest.fn();
    window.addEventListener(UI_LANGUAGE_CHANGED_EVENT, onChange);

    try {
      await act(async () => {
        render(<UiLanguageSelector />);
      });

      await act(async () => {
        screen.getByRole("button").click();
      });

      const target = languages.find((language) => language.code === "fr")!;
      await act(async () => {
        screen.getByText(target.name).click();
      });

      expect(window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)).toBe("fr");
      expect(onChange).toHaveBeenCalled();
    } finally {
      window.removeEventListener(UI_LANGUAGE_CHANGED_EVENT, onChange);
    }
  });
});
