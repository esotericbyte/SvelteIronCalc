// The toolbar: what it shows, its buttons and pickers applied to the
// selection, its menus (number formats, merging, themes) and the link
// dialog it opens.
import { BorderStyle } from "@ironcalc/wasm";
import { fireEvent, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { chooseMenuItem, closeMenu, menuItems, settle, setUpWidget } from "./helpers";

function button(name: string): HTMLButtonElement {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

async function click(name: string): Promise<void> {
  await fireEvent.click(button(name));
  await settle();
}

/** Selects from the selected cell with Shift+arrows, as a user would. */
async function extendSelection(
  workbook: HTMLElement,
  right: number,
  down: number,
): Promise<void> {
  for (let index = 0; index < right; index += 1) {
    await fireEvent.keyDown(workbook, { key: "ArrowRight", shiftKey: true });
  }
  for (let index = 0; index < down; index += 1) {
    await fireEvent.keyDown(workbook, { key: "ArrowDown", shiftKey: true });
  }
  await settle();
}

async function selectCell(
  workbook: HTMLElement,
  model: ReturnType<typeof setUpWidget>["model"],
  row: number,
  column: number,
): Promise<void> {
  model.setSelectedCell(row, column);
  // any navigation key makes the widget re-read the model; go there and back
  await fireEvent.keyDown(workbook, { key: "ArrowDown" });
  await fireEvent.keyDown(workbook, { key: "ArrowUp" });
  model.setSelectedCell(row, column);
  await fireEvent.keyDown(workbook, { key: "ArrowRight" });
  await fireEvent.keyDown(workbook, { key: "ArrowLeft" });
  await settle();
}

describe("toolbar", () => {
  it("is shown while editing is allowed and hidden when read-only", () => {
    const { container } = setUpWidget();
    expect(container.querySelector(".ic-toolbar-wrapper")).not.toBeNull();

    const readOnly = setUpWidget({ canEdit: false });
    expect(readOnly.container.querySelector(".ic-toolbar-wrapper")).toBeNull();
    expect(
      readOnly.workbook.classList.contains("ic-workbook-container--readonly"),
    ).toBe(true);
  });

  it("toggles bold, italic, underline and strikethrough on the selection", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 3, 2);
    await extendSelection(workbook, 1, 1);
    expect(button("Bold").getAttribute("aria-pressed")).toBe("false");
    await click("Bold");
    await click("Italic");
    await click("Underline");
    await click("Strikethrough");
    for (const [row, column] of [
      [3, 2],
      [4, 3],
    ]) {
      const { font } = model.getCellStyle(0, row, column).style;
      expect(font).toMatchObject({ b: true, i: true, u: true, strike: true });
    }
    expect(button("Bold").getAttribute("aria-pressed")).toBe("true");
    await click("Bold");
    expect(model.getCellStyle(0, 3, 2).style.font.b).toBeFalsy();

    // and undo and redo from the toolbar
    expect(button("Undo").disabled).toBe(false);
    await click("Undo");
    expect(model.getCellStyle(0, 3, 2).style.font.b).toBe(true);
    await click("Redo");
    expect(model.getCellStyle(0, 3, 2).style.font.b).toBeFalsy();
  });

  it("aligns, wraps and toggles the alignment back to general", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 2, 2);
    await click("Align right");
    expect(model.getCellStyle(0, 2, 2).style.alignment?.horizontal).toBe("right");
    expect(button("Align right").getAttribute("aria-pressed")).toBe("true");
    await click("Align right");
    expect(button("Align right").getAttribute("aria-pressed")).toBe("false");
    expect(model.getCellStyle(0, 2, 2).style.alignment?.horizontal ?? "general").toBe(
      "general",
    );
    await click("Align top");
    expect(model.getCellStyle(0, 2, 2).style.alignment?.vertical).toBe("top");
    await click("Wrap text");
    expect(model.getCellStyle(0, 2, 2).style.alignment?.wrap_text).toBe(true);
  });

  it("changes the font size with the buttons and the field", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 2, 2);
    const size = () => model.getCellStyle(0, 2, 2).style.font.sz;
    const initial = size();
    await click("Increase font size");
    expect(size()).toBe(initial + 1);
    await click("Decrease font size");
    expect(size()).toBe(initial);

    const field = screen.getByRole("textbox", { name: "Font size" }) as HTMLInputElement;
    expect(field.value).toBe(`${initial}`);
    field.focus();
    field.value = "20";
    await fireEvent.input(field);
    await fireEvent.keyDown(field, { key: "Enter" });
    await settle();
    expect(size()).toBe(20);

    // the arrow keys step it, Shift by ten
    field.focus();
    await fireEvent.keyDown(field, { key: "ArrowUp", shiftKey: true });
    await settle();
    expect(size()).toBe(30);

    // an invalid size is dropped, Escape cancels
    field.focus();
    field.value = "abc";
    await fireEvent.input(field);
    await fireEvent.blur(field);
    await settle();
    expect(size()).toBe(30);
    expect(field.value).toBe("30");
  });

  it("applies the number format buttons", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 2, 2);
    await click("Format as percentage");
    expect(model.getCellStyle(0, 2, 2).style.num_fmt).toBe("0.00%");
    await click("Increase decimal places");
    expect(model.getCellStyle(0, 2, 2).style.num_fmt).toBe("0.000%");
    await click("Decrease decimal places");
    await click("Decrease decimal places");
    expect(model.getCellStyle(0, 2, 2).style.num_fmt).toBe("0.0%");
    await click("Format as currency");
    expect(model.getCellStyle(0, 2, 2).style.num_fmt).toBe(
      model.getFmtSettings().currency_format,
    );
  });

  it("picks a format from the number format menu, or a custom one", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 2, 2);
    await click("Format number");
    const settings = model.getFmtSettings();
    expect(menuItems().map((item) => item.replace(/\s+/g, " "))).toEqual([
      "Auto",
      `Number ${settings.number_example}`,
      "Percentage 10%",
      "Euro (EUR) €",
      "Dollar (USD) $",
      "British Pound (GBP) £",
      `Short date ${settings.short_date_example}`,
      `Long date ${settings.long_date_example}`,
      "Custom",
    ]);
    await chooseMenuItem(/^Euro/);
    expect(model.getCellStyle(0, 2, 2).style.num_fmt).toBe('"€"#,##0.00');

    await click("Format number");
    const euro = screen
      .getAllByRole("menuitemradio")
      .find((item) => item.textContent?.trim().startsWith("Euro"));
    expect(euro?.getAttribute("aria-checked")).toBe("true");
    await chooseMenuItem("Custom");
    const field = screen.getByRole("dialog", { name: "Custom number format" })
      .querySelector("input") as HTMLInputElement;
    expect(field.value).toBe('"€"#,##0.00');
    field.value = "0.0";
    await fireEvent.input(field);
    await fireEvent.click(button("Save"));
    await settle();
    expect(model.getCellStyle(0, 2, 2).style.num_fmt).toBe("0.0");
  });

  it("clears the formatting of the selection", async () => {
    const { model, workbook } = setUpWidget();
    expect(model.getCellStyle(0, 1, 2).style.font.b).toBe(true);
    await selectCell(workbook, model, 1, 2);
    await click("Clear formatting");
    expect(model.getCellStyle(0, 1, 2).style.font.b).toBeFalsy();
    expect(model.getCellContent(0, 1, 2)).toBe("Q1");
  });

  it("starts the format painter", async () => {
    const { model, workbook, sheet } = setUpWidget();
    await selectCell(workbook, model, 1, 2);
    await click("Copy styles");
    expect(sheet.style.cursor).toContain("data:image/svg+xml");
    await fireEvent.keyDown(workbook, { key: "Escape" });
    expect(sheet.style.cursor).toBe("auto");
  });

  it("toggles the grid lines of the sheet", async () => {
    const { model } = setUpWidget();
    expect(model.getShowGridLines(0)).toBe(true);
    await click("Show/hide grid lines");
    expect(model.getShowGridLines(0)).toBe(false);
    await click("Show/hide grid lines");
    expect(model.getShowGridLines(0)).toBe(true);
  });

  it("picks the font and fill colors", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 2, 2);
    await click("Font color");
    await fireEvent.click(screen.getByRole("button", { name: "#FF0000" }));
    await settle();
    expect(`${model.getCellStyle(0, 2, 2).style.font.color}`.toUpperCase()).toBe("#FF0000");
    expect(screen.queryByRole("dialog", { name: "Add new color" })).toBeNull();

    await click("Fill color");
    await fireEvent.click(screen.getByRole("button", { name: "#FF0000" }));
    await settle();
    expect(`${model.getCellStyle(0, 2, 2).style.fill.color}`.toUpperCase()).toBe("#FF0000");
  });

  it("opens the drawer from its buttons, which show it pressed", async () => {
    const { container } = setUpWidget();
    expect(button("Conditional formatting").getAttribute("aria-pressed")).toBe("false");
    await click("Conditional formatting");
    expect(button("Conditional formatting").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector(".ic-drawer-container")?.textContent).toContain(
      "Conditional Formatting",
    );
    await click("Cell styles");
    expect(button("Cell styles").getAttribute("aria-pressed")).toBe("true");
    expect(button("Conditional formatting").getAttribute("aria-pressed")).toBe("false");
  });
});

describe("border picker", () => {
  it("applies the chosen border, style and color, and closes with Escape", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 3, 2);
    await extendSelection(workbook, 1, 1);
    await click("Borders");
    const picker = screen.getByRole("dialog", { name: "Borders" });
    expect(document.activeElement).toBe(picker);

    await click("All borders");
    expect(button("All borders").getAttribute("aria-pressed")).toBe("true");
    const border = model.getCellStyle(0, 3, 2).style.border;
    expect(border.top?.style).toBe(BorderStyle.Thin);
    expect(border.right?.style).toBe(BorderStyle.Thin);

    // a line style applies to the pressed border
    await click("Border style");
    await fireEvent.click(screen.getByRole("button", { name: BorderStyle.Thick }));
    await settle();
    expect(model.getCellStyle(0, 4, 3).style.border.bottom?.style).toBe(BorderStyle.Thick);

    await click("Clear borders");
    expect(model.getCellStyle(0, 3, 2).style.border.top).toBeFalsy();

    await fireEvent.keyDown(picker, { key: "Escape" });
    await settle();
    expect(screen.queryByRole("dialog", { name: "Borders" })).toBeNull();
  });

  it("closes on a press outside", async () => {
    setUpWidget();
    await click("Borders");
    expect(screen.queryByRole("dialog", { name: "Borders" })).not.toBeNull();
    await fireEvent.pointerDown(document.body);
    await settle();
    expect(screen.queryByRole("dialog", { name: "Borders" })).toBeNull();
  });
});

describe("merge menu", () => {
  it("is disabled for a single cell and offers merging for a range", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 12, 3);
    expect(button("Merge cells").disabled).toBe(true);
    await extendSelection(workbook, 2, 0);
    expect(button("Merge cells").disabled).toBe(false);
    await click("Merge cells");
    expect(menuItems()).toEqual([
      "Merge cells",
      "Merge & center",
      "Merge across",
      "Merge down",
      "Unmerge cells",
    ]);
    const disabled = screen
      .getAllByRole("menuitem")
      .filter((item) => item.hasAttribute("data-disabled"))
      .map((item) => item.textContent?.trim());
    expect(disabled).toEqual(["Merge down", "Unmerge cells"]);
    await chooseMenuItem("Merge cells");
    expect(model.getMergedCells(0)).toContainEqual(
      expect.objectContaining({ row: 12, column: 3, width: 3, height: 1 }),
    );
  });

  it("unmerges a selection over merged cells", async () => {
    const { model, workbook } = setUpWidget();
    // the sample's merged title is B7:D8
    await selectCell(workbook, model, 7, 2);
    await click("Merge cells");
    const enabled = screen
      .getAllByRole("menuitem")
      .filter((item) => !item.hasAttribute("data-disabled"))
      .map((item) => item.textContent?.trim());
    expect(enabled).toEqual(["Unmerge cells"]);
    await chooseMenuItem("Unmerge cells");
    expect(model.getMergedCells(0)).toEqual([]);
  });

  it("explains a merge over several cells with content", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 2, 2);
    await extendSelection(workbook, 1, 0);
    await click("Merge cells");
    await chooseMenuItem("Merge cells");
    expect(screen.getByRole("dialog").textContent).toContain(
      "Only one cell in the selection can have content.",
    );
    expect(model.getCellContent(0, 2, 3)).toBe("135");
  });
});

describe("theme menu", () => {
  it("lists the themes with the current one checked and applies a pick", async () => {
    const { model } = setUpWidget();
    const current = model.getTheme().name;
    await click("Themes");
    const items = screen.getAllByRole("menuitemradio");
    const checked = items.filter((item) => item.getAttribute("aria-checked") === "true");
    expect(checked.map((item) => item.textContent?.trim())).toEqual([current]);
    const other = items.find((item) => item.textContent?.trim() !== current);
    const otherName = other?.textContent?.trim() ?? "";
    await chooseMenuItem(otherName);
    expect(model.getTheme().name).toBe(otherName);

    // "Manage themes" opens the themes drawer
    await click("Themes");
    await chooseMenuItem("Manage themes");
    expect(screen.getByRole("listbox", { name: "Themes" })).toBeTruthy();
  });
});

describe("link dialog", () => {
  it("adds an external link, labelled with the cell content", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 2, 1);
    await click("Insert link");
    const dialog = screen.getByRole("dialog", { name: "Add link" });
    expect(button("Save").disabled).toBe(true);
    const url = screen.getByPlaceholderText("URL") as HTMLInputElement;
    expect(document.activeElement).toBe(url);
    url.value = "not a url";
    await fireEvent.input(url);
    expect(dialog.textContent).toContain("Please enter a valid URL");
    url.value = "example.com";
    await fireEvent.input(url);
    expect(button("Save").disabled).toBe(false);
    await click("Save");
    expect(model.getCellLink(0, 2, 1)).toMatchObject({
      type: "External",
      target: "https://example.com",
    });
    expect(model.getCellContent(0, 2, 1)).toBe("Apples");
    expect(screen.queryByRole("dialog", { name: "Add link" })).toBeNull();
  });

  it("links to a cell of another sheet", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 20, 4);
    await click("Insert link");
    await click("Document");
    const sheetSelect = screen.getByRole("combobox");
    expect(sheetSelect.textContent?.trim()).toBe("Summary");
    await fireEvent.click(sheetSelect);
    await settle();
    expect(screen.getAllByRole("option").map((option) => option.textContent?.trim())).toEqual([
      "Summary",
      "Details",
      "Hidden",
    ]);
    await fireEvent.click(screen.getByRole("option", { name: "Details" }));
    await settle();
    expect(screen.queryByRole("listbox")).toBeNull();
    // the dialog is still open
    const reference = screen.getByPlaceholderText("Cell reference") as HTMLInputElement;
    reference.value = "b2";
    await fireEvent.input(reference);
    await click("Save");
    expect(model.getCellLink(0, 20, 4)).toMatchObject({
      type: "Internal",
      location: "Details!B2",
    });
    // an empty cell gets the location as its text
    expect(model.getCellContent(0, 20, 4)).toBe("Details!B2");
  });

  it("edits an email link and removes a link", async () => {
    const { model, workbook } = setUpWidget();
    await selectCell(workbook, model, 21, 4);
    await click("Insert link");
    await click("Email");
    const address = screen.getByPlaceholderText("Email address") as HTMLInputElement;
    address.value = "someone@example.com";
    await fireEvent.input(address);
    const subject = screen.getByPlaceholderText("Subject (optional)") as HTMLInputElement;
    subject.value = "Hello";
    await fireEvent.input(subject);
    // (with no label the text is the address, which the engine links as a
    // plain mailto of its own)
    const label = screen.getByPlaceholderText("Label") as HTMLInputElement;
    label.value = "Write to us";
    await fireEvent.input(label);
    await click("Save");
    expect(model.getCellLink(0, 21, 4)).toMatchObject({
      target: "mailto:someone@example.com?subject=Hello",
    });
    expect(model.getCellContent(0, 21, 4)).toBe("Write to us");

    // editing opens on the email tab with the fields filled in
    await click("Insert link");
    expect(screen.getByRole("dialog", { name: "Edit link" })).toBeTruthy();
    expect((screen.getByPlaceholderText("Email address") as HTMLInputElement).value).toBe(
      "someone@example.com",
    );
    expect((screen.getByPlaceholderText("Subject (optional)") as HTMLInputElement).value).toBe(
      "Hello",
    );
    await click("Delete");
    expect(model.getCellLink(0, 21, 4)).toBeUndefined();
  });
});
