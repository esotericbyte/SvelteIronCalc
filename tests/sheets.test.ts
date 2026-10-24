// Sheet management from the tab bar: adding, renaming, the tab menu (move,
// color, duplicate, hide, delete) and the sheet list.
import { fireEvent, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { chooseMenuItem, menuItems, settle, setUpWidget } from "./helpers";

function tabNames(): string[] {
  return screen.getAllByRole("tab").map((tab) => tab.textContent?.trim() ?? "");
}

function sheetNames(model: ReturnType<typeof setUpWidget>["model"]): string[] {
  return model.getWorksheetsProperties().map((sheet) => sheet.name);
}

async function openTabMenu(name: string): Promise<void> {
  const tab = screen.getAllByRole("tab").find((element) =>
    element.textContent?.includes(name),
  ) as HTMLElement;
  await fireEvent.contextMenu(tab);
  await settle();
}

async function startRenaming(name: string): Promise<HTMLInputElement> {
  const tab = screen.getAllByRole("tab").find((element) =>
    element.textContent?.includes(name),
  ) as HTMLElement;
  // a browser clicks (selecting the sheet) before the double click
  await fireEvent.click(tab);
  await fireEvent.dblClick(tab);
  await settle();
  return screen.getByRole("textbox", { name: "Rename" }) as HTMLInputElement;
}

describe("sheet tab bar", () => {
  it("adds a blank sheet", async () => {
    const { model } = setUpWidget();
    await fireEvent.click(screen.getByRole("button", { name: "Add sheet" }));
    await settle();
    expect(model.getWorksheetsProperties()).toHaveLength(4);
    expect(tabNames()).toHaveLength(3);
  });

  it("shows no editing affordances in read-only mode", async () => {
    setUpWidget({ canEdit: false });
    expect(screen.queryByRole("button", { name: "Add sheet" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Open sheet menu" })).toBeNull();
    await openTabMenu("Summary");
    expect(menuItems()).toEqual([]);
    await startRenaming("Summary").catch(() => null);
    expect(screen.queryByRole("textbox", { name: "Rename" })).toBeNull();
  });

  it("lists every sheet, and shows a hidden one when picked", async () => {
    const { model } = setUpWidget();
    await fireEvent.click(screen.getByRole("button", { name: "Sheet list" }));
    await settle();
    expect(menuItems()).toEqual(["Summary", "Details", "Hidden"]);
    await chooseMenuItem("Hidden");
    expect(model.getSelectedSheet()).toBe(2);
    expect(tabNames()).toEqual(["Summary", "Details", "Hidden"]);
  });
});

describe("renaming a sheet", () => {
  it("renames on Enter after a double click", async () => {
    const { model } = setUpWidget();
    const input = await startRenaming("Details");
    expect(input.value).toBe("Details");
    input.value = "  Notes ";
    await fireEvent.input(input);
    await fireEvent.keyDown(input, { key: "Enter" });
    await settle();
    expect(sheetNames(model)[1]).toBe("Notes");
    expect(tabNames()).toEqual(["Summary", "Notes"]);
  });

  it("keeps the name on Escape or when left empty", async () => {
    const { model } = setUpWidget();
    let input = await startRenaming("Details");
    input.value = "Other";
    await fireEvent.input(input);
    await fireEvent.keyDown(input, { key: "Escape" });
    await settle();
    expect(sheetNames(model)[1]).toBe("Details");

    input = await startRenaming("Details");
    input.value = "   ";
    await fireEvent.input(input);
    await fireEvent.blur(input);
    await settle();
    expect(sheetNames(model)[1]).toBe("Details");
  });

  it("renames from the tab menu, and shows a rejected name", async () => {
    const { model } = setUpWidget();
    await openTabMenu("Details");
    await chooseMenuItem("Rename");
    const input = screen.getByRole("textbox", { name: "Rename" }) as HTMLInputElement;
    input.value = "Summary";
    await fireEvent.input(input);
    await fireEvent.keyDown(input, { key: "Enter" });
    await settle();
    expect(sheetNames(model)[1]).toBe("Details");
    expect(screen.getByRole("dialog").textContent).toContain(
      "Sheet already exists: 'Summary'",
    );
  });
});

describe("sheet tab menu", () => {
  it("offers the sheet actions", async () => {
    setUpWidget();
    await openTabMenu("Summary");
    expect(menuItems()).toEqual([
      "Move left",
      "Move right",
      "Rename",
      "Change Color",
      "Duplicate",
      "Hide sheet",
      "Delete",
    ]);
  });

  it("opens from the chevron button and selects the sheet", async () => {
    const { model } = setUpWidget();
    const buttons = screen.getAllByRole("button", { name: "Open sheet menu" });
    await fireEvent.click(buttons[1]);
    await settle();
    expect(model.getSelectedSheet()).toBe(1);
    expect(menuItems()).toContain("Duplicate");
  });

  it("moves the sheet right and left", async () => {
    const { model } = setUpWidget();
    await openTabMenu("Summary");
    await chooseMenuItem("Move right");
    expect(sheetNames(model)).toEqual(["Details", "Summary", "Hidden"]);
    await openTabMenu("Summary");
    await chooseMenuItem("Move left");
    expect(sheetNames(model)).toEqual(["Summary", "Details", "Hidden"]);
  });

  it("duplicates and hides the sheet", async () => {
    const { model } = setUpWidget();
    await openTabMenu("Details");
    await chooseMenuItem("Duplicate");
    expect(model.getWorksheetsProperties()).toHaveLength(4);
    expect(tabNames()).toHaveLength(3);

    await openTabMenu("Details");
    await chooseMenuItem("Hide sheet");
    expect(tabNames()).not.toContain("Details");
  });

  it("deletes the sheet after confirming", async () => {
    const { model } = setUpWidget();
    await openTabMenu("Details");
    await chooseMenuItem("Delete");
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("The sheet 'Details' will be deleted.");
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await settle();
    expect(sheetNames(model)).toContain("Details");

    await openTabMenu("Details");
    await chooseMenuItem("Delete");
    await fireEvent.click(screen.getByRole("button", { name: "Yes, delete sheet" }));
    await settle();
    expect(sheetNames(model)).toEqual(["Summary", "Hidden"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not hide or delete the last visible sheet", async () => {
    setUpWidget();
    await openTabMenu("Details");
    await chooseMenuItem("Hide sheet");
    await openTabMenu("Summary");
    for (const label of ["Hide sheet", "Delete"]) {
      const item = screen
        .getAllByRole("menuitem")
        .find((element) => element.textContent?.trim() === label);
      expect(item?.getAttribute("aria-disabled")).toBe("true");
    }
  });

  it("colors the tab from the color picker", async () => {
    const { model } = setUpWidget();
    await openTabMenu("Details");
    await chooseMenuItem("Change Color");
    const picker = screen.getByRole("dialog", { name: "Add new color" });
    await fireEvent.click(screen.getByRole("button", { name: "#FF0000" }));
    await settle();
    expect(model.getWorksheetsProperties()[1].color).toBe("#FF0000");
    expect(picker.isConnected).toBe(false);

    // the picked color is now recent, and checked
    await openTabMenu("Details");
    await chooseMenuItem("Change Color");
    const swatches = screen.getAllByRole("button", { name: "#FF0000" });
    expect(swatches).toHaveLength(2);
    expect(swatches[0].querySelector("svg")).not.toBeNull();
  });

  it("picks a custom color in the advanced picker", async () => {
    const { model } = setUpWidget();
    await openTabMenu("Details");
    await chooseMenuItem("Change Color");
    await fireEvent.click(screen.getByRole("button", { name: "Add new color" }));
    await settle();
    const hex = screen.getByLabelText("Hex") as HTMLInputElement;
    hex.value = "12AB34";
    await fireEvent.input(hex);
    await fireEvent.click(screen.getByRole("button", { name: "Add color" }));
    await settle();
    expect(`${model.getWorksheetsProperties()[1].color}`.toUpperCase()).toBe("#12AB34");
  });

  it("closes the color picker with Escape", async () => {
    const { model } = setUpWidget();
    await openTabMenu("Details");
    await chooseMenuItem("Change Color");
    const picker = screen.getByRole("dialog", { name: "Add new color" });
    await fireEvent.keyDown(picker, { key: "Escape" });
    await settle();
    expect(screen.queryByRole("dialog", { name: "Add new color" })).toBeNull();
    expect(model.getWorksheetsProperties()[1].color).toBeFalsy();
  });
});
