// The right drawer: opening and closing it, resizing it, and its sections
// (named ranges with the formula bar's menu, cell styles, conditional
// formatting rules, the theme editor and the regional settings).
import { fireEvent, screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { chooseMenuItem, menuItems, settle, setUpWidget } from "./helpers";

function button(name: string | RegExp, scope: HTMLElement = document.body): HTMLButtonElement {
  return within(scope).getByRole("button", { name }) as HTMLButtonElement;
}

async function click(name: string | RegExp, scope?: HTMLElement): Promise<void> {
  await fireEvent.click(button(name, scope));
  await settle();
}

function drawer(container: HTMLElement): HTMLElement {
  const element = container.querySelector<HTMLElement>(".ic-drawer-container");
  if (!element) {
    throw new Error("the drawer is closed");
  }
  return element;
}

/** Types into a field as a user would. */
async function type(field: HTMLElement, value: string): Promise<void> {
  await fireEvent.input(field, { target: { value } });
  await settle();
}

/** Picks an option of a Select, found by its current text. */
async function pick(trigger: HTMLElement, option: string): Promise<void> {
  await fireEvent.click(trigger);
  await settle();
  await fireEvent.click(screen.getByRole("option", { name: option }));
  await settle();
}

async function selectRange(
  workbook: HTMLElement,
  model: ReturnType<typeof setUpWidget>["model"],
  rowStart: number,
  columnStart: number,
  rowEnd: number,
  columnEnd: number,
): Promise<void> {
  model.setSelectedCell(rowStart, columnStart);
  model.setSelectedRange(rowStart, columnStart, rowEnd, columnEnd);
  // a key the widget ignores still makes it re-read nothing, so redraw by
  // navigating away and back
  await fireEvent.keyDown(workbook, { key: "Escape" });
  await settle();
}

describe("right drawer", () => {
  it("opens from the toolbar, narrows the sheet and closes", async () => {
    const { container } = setUpWidget();
    const area = container.querySelector<HTMLElement>(".ic-workbook-worksheet-area-left");
    expect(container.querySelector(".ic-drawer-container")).toBeNull();
    expect(area?.style.width).toBe("100%");
    await click("Conditional formatting");
    expect(drawer(container)).toBeTruthy();
    expect(area?.style.width).toBe("calc(100% - 360px)");
    await click("Close", drawer(container));
    expect(container.querySelector(".ic-drawer-container")).toBeNull();
    expect(area?.style.width).toBe("100%");
  });

  it("is resized with the arrow keys, Home and End on its handle", async () => {
    const { container } = setUpWidget();
    await click("Cell styles");
    const handle = screen.getByRole("separator", { name: "Resize drawer" });
    const width = () => drawer(container).style.getPropertyValue("--ic-runtime-drawer-width");
    expect(width()).toBe("360px");
    await fireEvent.keyDown(handle, { key: "ArrowLeft" });
    await settle();
    expect(width()).toBe("376px");
    await fireEvent.keyDown(handle, { key: "End" });
    await settle();
    expect(width()).toBe("500px");
    await fireEvent.keyDown(handle, { key: "Home" });
    await settle();
    expect(width()).toBe("300px");
    expect(
      container.querySelector<HTMLElement>(".ic-workbook-worksheet-area-left")?.style.width,
    ).toBe("calc(100% - 300px)");
  });
});

describe("named ranges", () => {
  it("lists them in the address box menu, which selects one and opens the drawer", async () => {
    const { container, model } = setUpWidget();
    await fireEvent.click(screen.getByTestId("ic-formula-bar-address"));
    await settle();
    expect(menuItems()).toEqual(["Items Summary!$A$2:$A$4", "Manage Named Ranges"]);
    await chooseMenuItem(/^Items/);
    expect(model.getSelectedView().range).toEqual([2, 1, 4, 1]);
    expect(screen.getByTestId("ic-formula-bar-address").textContent?.trim()).toBe("A2:A4");

    await fireEvent.click(screen.getByTestId("ic-formula-bar-address"));
    await settle();
    await chooseMenuItem("Manage Named Ranges");
    expect(drawer(container).textContent).toContain("Named Ranges");
  });

  it("disables managing them in the address box menu when read-only", async () => {
    setUpWidget({ canEdit: false });
    await fireEvent.click(screen.getByTestId("ic-formula-bar-address"));
    await settle();
    const manage = screen
      .getAllByRole("menuitem")
      .find((item) => item.textContent?.trim() === "Manage Named Ranges");
    expect(manage?.hasAttribute("data-disabled")).toBe(true);
  });

  it("adds one from the selection, edits, filters and deletes it", async () => {
    const { container, model, workbook } = setUpWidget();
    await selectRange(workbook, model, 1, 2, 1, 5);
    await fireEvent.click(screen.getByTestId("ic-formula-bar-address"));
    await settle();
    await chooseMenuItem("Manage Named Ranges");
    const panel = drawer(container);
    expect(within(panel).getByText("Items")).toBeTruthy();

    await click("Add new", panel);
    const name = within(panel).getByRole("textbox", { name: "Range name" }) as HTMLInputElement;
    expect(name.value).toBe("Range1");
    const formula = within(panel).getByRole("textbox", { name: "Refers to" }) as HTMLTextAreaElement;
    expect(formula.value).toBe("Summary!$B$1:$E$1");
    await type(name, "Quarters");
    await click("Apply changes", panel);
    expect(model.getDefinedNameList().map((n) => [n.name, n.formula])).toEqual([
      ["Items", "Summary!$A$2:$A$4"],
      ["Quarters", "Summary!$B$1:$E$1"],
    ]);

    // the search filters by name
    await type(within(panel).getByPlaceholderText("Search..."), "quar");
    expect(within(panel).queryByText("Items")).toBeNull();
    expect(within(panel).getByText("Quarters")).toBeTruthy();
    await type(within(panel).getByPlaceholderText("Search..."), "");

    // clicking one selects its range
    await fireEvent.click(within(panel).getByText("Items"));
    await settle();
    expect(model.getSelectedView().range).toEqual([2, 1, 4, 1]);

    // edit: rename it, scoped to the Details sheet
    const quarters = within(panel).getByText("Quarters").closest(".ic-named-ranges-list-item") as HTMLElement;
    await click("Edit Range", quarters);
    const edited = within(panel).getByRole("textbox", { name: "Range name" });
    await type(edited, "Header");
    await pick(within(panel).getByRole("combobox", { name: /Scope/ }), "Details");
    await click("Apply changes", panel);
    const header = model.getDefinedNameList().find((n) => n.name === "Header");
    expect(header?.scope).toBe(1);

    // the scope filter keeps the global ones
    await pick(within(panel).getByRole("combobox"), "Global");
    expect(within(panel).queryByText("Header")).toBeNull();
    await pick(within(panel).getByRole("combobox"), "All");

    const row = within(panel).getByText("Header").closest(".ic-named-ranges-list-item") as HTMLElement;
    await click("Delete Range", row);
    expect(model.getDefinedNameList().map((n) => n.name)).toEqual(["Items"]);
  });

  it("shows the engine's error for an invalid name", async () => {
    const { container } = setUpWidget();
    await fireEvent.click(screen.getByTestId("ic-formula-bar-address"));
    await settle();
    await chooseMenuItem("Manage Named Ranges");
    const panel = drawer(container);
    await click("Add new", panel);
    await type(within(panel).getByRole("textbox", { name: "Range name" }), "A1");
    // the name is validated 300 ms after the change
    await new Promise((resolve) => setTimeout(resolve, 350));
    await settle();
    expect(button("Apply changes", panel).disabled).toBe(true);
    expect(panel.querySelector(".text-error-500")?.textContent?.trim()).not.toBe("");
  });
});

describe("cell styles", () => {
  it("applies a built-in style to the selection", async () => {
    const { container, model, workbook } = setUpWidget();
    await selectRange(workbook, model, 3, 3, 3, 3);
    await click("Cell styles");
    const panel = drawer(container);
    await click("Good", panel);
    const good = model.getNamedStyle("Good");
    expect(model.getCellStyle(0, 3, 3).style.fill.color).toBe(good.fill.color);
  });

  it("creates, manages, updates and deletes a style of the workbook", async () => {
    const { container, model, workbook } = setUpWidget();
    await selectRange(workbook, model, 2, 2, 2, 2);
    await click("Cell styles");
    const panel = drawer(container);
    await click("Add new", panel);
    const name = within(panel).getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(name.value).toBe("Style1");
    await type(name, "Loud");
    await click("Bold", panel);
    // the border is not included until switched on
    const border = within(panel).getByRole("switch", { name: "Border" });
    expect((border as HTMLInputElement).checked).toBe(false);
    await fireEvent.click(border);
    await settle();
    expect(within(panel).getByRole("button", { name: "Border style" })).toBeTruthy();
    await click("Apply", panel);
    expect(model.getNamedStyleList()).toContain("Loud");
    expect(model.getNamedStyle("Loud").font.b).toBe(true);
    expect(model.getNamedStyleIncludes("Loud").border).toBe(true);

    // it shows among the workbook's own, and applies
    await click("Loud", panel);
    expect(model.getCellStyle(0, 2, 2).style.font.b).toBe(true);

    // a taken name is refused
    await click("Add new", panel);
    await type(within(panel).getByRole("textbox", { name: "Name" }), "loud");
    await click("Apply", panel);
    expect(panel.textContent).toContain("already exists");
    await click("Cancel", panel);

    await click("Manage styles", panel);
    await click("Edit style", panel);
    await type(within(panel).getByRole("textbox", { name: "Name" }), "Quiet");
    await click("Apply", panel);
    expect(model.getNamedStyleList()).toContain("Quiet");
    expect(model.getNamedStyleList()).not.toContain("Loud");

    await click("Delete style", panel);
    expect(model.getNamedStyleList()).not.toContain("Quiet");
    expect(panel.textContent).toContain(
      "No custom styles yet.",
    );
  });
});

describe("conditional formatting", () => {
  function ruleRows(panel: HTMLElement): HTMLElement[] {
    return [...panel.querySelectorAll<HTMLElement>(".ic-cf-list-item")];
  }

  function ruleTexts(panel: HTMLElement): string[] {
    return ruleRows(panel).map(
      (row) => row.querySelector(".ic-cf-list-item-rule")?.textContent?.trim() ?? "",
    );
  }

  it("lists the sheet's rules and selects a rule's range", async () => {
    const { container, model } = setUpWidget();
    await click("Conditional formatting");
    const panel = drawer(container);
    expect(ruleTexts(panel)).toEqual(["Cell value > 300"]);
    expect(within(ruleRows(panel)[0]).getByText("F2:F4")).toBeTruthy();
    await fireEvent.click(ruleRows(panel)[0]);
    await settle();
    expect(model.getSelectedView().range).toEqual([2, 6, 4, 6]);
  });

  it("adds a classic rule on the selection", async () => {
    const { container, model, workbook } = setUpWidget();
    await selectRange(workbook, model, 2, 5, 4, 5);
    await click("Conditional formatting");
    const panel = drawer(container);
    await click("Add new", panel);
    const applyTo = within(panel).getByPlaceholderText("e.g. A1:B10") as HTMLInputElement;
    expect(applyTo.value).toBe("E2:E4");
    // "between" needs both values
    const values = within(panel).getAllByPlaceholderText("Value");
    expect(button("Apply changes", panel).disabled).toBe(true);
    await type(values[0], "300");
    await type(values[1], "400");
    expect(panel.querySelector(".ic-edit-rule-header-box-text")?.textContent?.trim()).toBe(
      "Cell value is between 300 and 400",
    );
    await click("Bold", panel);
    await click("Apply changes", panel);
    const rules = model.getConditionalFormattingList(0);
    expect(rules).toHaveLength(2);
    const added = rules.find((rule) => rule.range === "E2:E4");
    expect(added?.cf_rule).toMatchObject({
      type: "CellIs",
      operator: "Between",
      formula: "300",
      formula2: "400",
    });
    expect(model.getDxfForConditionalFormatting(0, added?.index ?? -1)?.font?.b).toBe(true);
    expect(ruleTexts(panel)).toContain("Cell value is between 300 and 400");
  });

  it("adds color scale, data bars and icon set rules", async () => {
    const { container, model } = setUpWidget();
    await click("Conditional formatting");
    const panel = drawer(container);
    const kinds = () => model.getConditionalFormattingList(0).map((rule) => rule.cf_rule.type);

    await click("Add new", panel);
    await click("Color Scale", panel);
    await click("g-lg", panel);
    await click("Apply changes", panel);
    expect(kinds()).toContain("ColorScale");

    await click("Add new", panel);
    await click("Data Bars", panel);
    await click("Apply changes", panel);
    expect(kinds()).toContain("DataBar");

    await click("Add new", panel);
    await click("Icons", panel);
    await click("Apply changes", panel);
    expect(kinds()).toContain("IconSet");

    await click("Add new", panel);
    await click("Icons", panel);
    await click("Ratings", panel);
    await click("rating-5-stars", panel);
    await click("Apply changes", panel);
    expect(kinds()).toContain("IconRating");
    expect(ruleTexts(panel)).toContain("Ratings");
  });

  it("edits, duplicates, reorders and deletes rules", async () => {
    const { container, model } = setUpWidget();
    await click("Conditional formatting");
    const panel = drawer(container);
    await click("Edit rule", ruleRows(panel)[0]);
    const value = within(panel).getByPlaceholderText("Value") as HTMLInputElement;
    expect(value.value).toBe("300");
    await type(value, "320");
    await click("Apply changes", panel);
    expect(ruleTexts(panel)).toEqual(["Cell value > 320"]);

    await click("Duplicate rule", ruleRows(panel)[0]);
    expect(model.getConditionalFormattingList(0)).toHaveLength(2);

    // make the first one different, then move it down
    await click("Edit rule", ruleRows(panel)[0]);
    await type(within(panel).getByPlaceholderText("Value"), "50");
    await click("Apply changes", panel);
    expect(ruleTexts(panel)).toEqual(["Cell value > 50", "Cell value > 320"]);
    await click("Lower priority", ruleRows(panel)[0]);
    // the rows slide first; jsdom runs no animation, so the safety timer commits
    await new Promise((resolve) => setTimeout(resolve, 350));
    await settle();
    expect(ruleTexts(panel)).toEqual(["Cell value > 320", "Cell value > 50"]);

    // the search matches the description
    await type(within(panel).getByPlaceholderText("Search..."), "50");
    expect(ruleTexts(panel)).toEqual(["Cell value > 50"]);
    await type(within(panel).getByPlaceholderText("Search..."), "");

    await click("Delete rule", ruleRows(panel)[0]);
    await click("Delete rule", ruleRows(panel)[0]);
    expect(model.getConditionalFormattingList(0)).toHaveLength(0);
    expect(panel.textContent).toContain("No conditional formatting rules yet.");
  });
});

describe("themes", () => {
  it("applies a theme from the list and saves a customized one", async () => {
    const { container, model } = setUpWidget();
    await click("Themes");
    await chooseMenuItem("Manage themes");
    const panel = drawer(container);
    const options = within(panel).getAllByRole("option");
    const current = model.getTheme().name;
    expect(
      options.filter((option) => option.getAttribute("aria-selected") === "true").map((o) => o.getAttribute("aria-label")),
    ).toEqual([current]);
    const other = options.find((option) => option.getAttribute("aria-label") !== current) as HTMLElement;
    await fireEvent.click(other);
    await settle();
    expect(model.getTheme().name).toBe(other.getAttribute("aria-label"));

    await click("Customize theme", panel);
    const fields = within(panel).getAllByRole("textbox") as HTMLInputElement[];
    await type(fields[0], "#123456");
    await click("Apply", panel);
    expect(model.getTheme()).toMatchObject({ name: "Custom", dk1: "#123456" });
    const names = within(panel)
      .getAllByRole("option")
      .map((option) => option.getAttribute("aria-label"));
    expect(names[0]).toBe("Custom");
  });
});

describe("regional settings", () => {
  it("shows the locale and language in the tab bar, only while editing", () => {
    const { container } = setUpWidget();
    const settings = container.querySelector(".ic-sheet-tab-bar-regional-settings-button");
    expect(settings?.textContent?.replace(/\s+/g, " ").trim()).toBe("en-US English");
    const readOnly = setUpWidget({ canEdit: false });
    expect(
      readOnly.container.querySelector(".ic-sheet-tab-bar-regional-settings-button"),
    ).toBeNull();
  });

  it("saves the locale and timezone", async () => {
    const { container, model } = setUpWidget();
    await fireEvent.click(
      container.querySelector(".ic-sheet-tab-bar-regional-settings-button") as HTMLElement,
    );
    await settle();
    const panel = drawer(container);
    expect(panel.textContent).toContain("1,234.56");
    await pick(within(panel).getByRole("combobox", { name: /Locale/ }), "de-DE");
    expect(panel.textContent).toContain("1.234,56");
    await pick(within(panel).getByRole("combobox", { name: /Timezone/ }), "Europe/Berlin");
    await click("Save", panel);
    expect(model.getLocale()).toBe("de");
    expect(model.getTimezone()).toBe("Europe/Berlin");
    expect(container.querySelector(".ic-drawer-container")).toBeNull();
    expect(
      container
        .querySelector(".ic-sheet-tab-bar-regional-settings-button")
        ?.textContent?.replace(/\s+/g, " ")
        .trim(),
    ).toBe("de-DE English");
  });
});
