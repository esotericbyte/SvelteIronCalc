import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";
import { IronCalc } from "../src/lib";
import { changeLanguage, getLanguage, t } from "../src/lib/i18n";
import deDe from "../src/lib/upstream/locale/de_de.json";
import enUs from "../src/lib/upstream/locale/en_us.json";
import { buildSampleWorkbook } from "../src/routes/sampleWorkbook";
import { settle } from "./helpers";

type Messages = { [key: string]: string | Messages };

function flatten(messages: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result.set(full, value);
    } else {
      for (const [k, v] of flatten(value, full)) {
        result.set(k, v);
      }
    }
  }
  return result;
}

/**
 * The English strings that read differently in German. "Close" is left out:
 * as upstream, the dialogs' close buttons are labelled by a `closeLabel`
 * property that defaults to the English word.
 */
function englishOnlyStrings(): Set<string> {
  const english = flatten(enUs);
  const german = flatten(deDe);
  const result = new Set<string>();
  for (const [key, value] of english) {
    if (german.get(key) !== value && !value.includes("{{") && value !== "Close") {
      result.add(value);
    }
  }
  return result;
}

/** Every text, label, title and placeholder shown in `root`. */
function shownStrings(root: ParentNode): string[] {
  const strings: string[] = [];
  for (const element of root.querySelectorAll("*")) {
    for (const attribute of ["aria-label", "title", "placeholder"]) {
      const value = element.getAttribute(attribute);
      if (value) {
        strings.push(value.trim());
      }
    }
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        strings.push(node.textContent.trim());
      }
    }
  }
  return strings;
}

function mountWidget() {
  const model = buildSampleWorkbook();
  const { container, component } = render(IronCalc, { model });
  return { model, container, widget: component };
}

afterEach(() => {
  changeLanguage("en-US");
});

describe("translation lookup", () => {
  it("translates into each upstream language", () => {
    const undo: Record<string, string> = {};
    for (const language of ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "it-IT"]) {
      changeLanguage(language);
      undo[language] = t("toolbar.undo");
    }
    expect(undo).toEqual({
      "en-US": "Undo",
      "en-GB": "Undo",
      "es-ES": "Deshacer",
      "fr-FR": "Annuler",
      "de-DE": "Rückgängig",
      "it-IT": "Annulla",
    });
  });

  it("formats the code as i18next does and keeps interpolating", () => {
    changeLanguage("de-de");
    expect(getLanguage()).toBe("de-DE");
    expect(t("context_menu.row_header.insert_rows_above", { count: 3 })).toContain("3");
    expect(t("no.such.key", { defaultValue: "Fallback" })).toBe("Fallback");
  });

  it("translates every key to itself in a language without a locale file", () => {
    changeLanguage("pt-BR");
    expect(t("toolbar.undo")).toBe("toolbar.undo");
  });
});

describe("setLanguage", () => {
  it("translates the widget and sets the model's language", async () => {
    const { model, widget } = mountWidget();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();

    widget.setLanguage("de-DE");
    await settle();

    expect(getLanguage()).toBe("de-DE");
    expect(model.getLanguage()).toBe("de");
    expect(screen.getByRole("button", { name: "Rückgängig" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    // the regional settings button names the model's language
    const regional = screen.getByRole("button", { name: /de-DE|en-US/ });
    expect(regional.textContent).toContain("Deutsch");
  });

  it("leaves no English string behind", async () => {
    const { container, widget } = mountWidget();
    widget.setLanguage("de-DE");
    await settle();

    const english = englishOnlyStrings();
    const leftover = shownStrings(container).filter((text) => english.has(text));
    expect(leftover).toEqual([]);
  });

  it("translates the drawer it opens afterwards and the one already open", async () => {
    const { container, widget } = mountWidget();
    const english = englishOnlyStrings();

    // the regional settings drawer, opened from the sheet tab bar
    await fireEvent.click(screen.getByRole("button", { name: /English/ }));
    await settle();
    expect(screen.getByText(t("regional_settings.title"))).toBeTruthy();
    await settle();
    widget.setLanguage("de-DE");
    await settle();
    expect(shownStrings(container).filter((text) => english.has(text))).toEqual([]);
    expect(screen.getByText(t("regional_settings.title"))).toBeTruthy();
  });

  it("does nothing when the language is already the one asked for", async () => {
    const { model, widget } = mountWidget();
    model.setLanguage("fr");
    widget.setLanguage("en-US");
    await settle();
    // as upstream, the model is left alone too
    expect(model.getLanguage()).toBe("fr");
  });
});

describe("German throughout", () => {
  // the engine's names (the built-in cell styles, "Comma", "Percent", ...)
  // are shown as they are, as upstream
  let engineNames = new Set<string>();

  function leftovers(): string[] {
    const english = englishOnlyStrings();
    return shownStrings(document.body).filter(
      (text) => english.has(text) && !engineNames.has(text),
    );
  }

  async function click(name: string): Promise<void> {
    await fireEvent.click(screen.getAllByRole("button", { name })[0]);
    await settle();
  }

  it("translates the drawer sections and their editors", async () => {
    const { model, widget } = mountWidget();
    engineNames = new Set(model.getBuiltinNamedStyles().map((style) => style.name));
    widget.setLanguage("de-DE");
    await settle();

    await click(t("toolbar.conditional_formatting"));
    expect(leftovers()).toEqual([]);
    await click(t("conditional_formatting.new"));
    expect(leftovers()).toEqual([]);
    for (const tab of screen.queryAllByRole("tab")) {
      await fireEvent.click(tab);
      await settle();
      expect(leftovers()).toEqual([]);
    }

    await click(t("toolbar.named_styles"));
    expect(leftovers()).toEqual([]);
    await click(t("named_styles.add_new_style"));
    expect(leftovers()).toEqual([]);
  });
});
