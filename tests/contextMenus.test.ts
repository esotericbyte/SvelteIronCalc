// The worksheet context menus: what a right click selects, the menus of the
// cells and of the column and row headers, and the size prompts.
import { fireEvent, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  chooseMenuItem,
  closeMenu,
  menuItems,
  rightClick,
  settle,
  setUpWidget,
} from "./helpers";

// Points of the 800x600 canvas: the headers are 30px wide and 28px high,
// and the sample's columns are about 100px wide and its rows 24px high,
// with the first row and column frozen
const CELL_B3 = { x: 200, y: 100 };
const COLUMN_A_HEADER = { x: 80, y: 10 };
const COLUMN_B_HEADER = { x: 200, y: 10 };
const COLUMN_F_HEADER = { x: 500, y: 10 };
const ROW_2_HEADER = { x: 10, y: 70 };
const ROW_3_HEADER = { x: 10, y: 100 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cell context menu", () => {
  it("selects the clicked cell and offers the clipboard, insert and delete", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    expect(model.getSelectedView()).toMatchObject({ row: 3, column: 2 });
    expect(menuItems()).toEqual([
      "Cut",
      "Copy",
      "Paste",
      "Insert...",
      "Delete...",
    ]);
  });

  it("keeps a selection that contains the clicked cell", async () => {
    const { model, sheet } = setUpWidget();
    model.setSelectedCell(2, 2);
    model.setSelectedRange(2, 2, 4, 4);
    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    expect(model.getSelectedView().range).toEqual([2, 2, 4, 4]);
  });

  it("deletes the row of the selected cell from the delete submenu", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    await chooseMenuItem("Delete...");
    expect(menuItems()).toContain("Row '3'");
    await chooseMenuItem("Row '3'");
    expect(model.getCellContent(0, 3, 1)).toBe("Plums");
    expect(menuItems()).toEqual([]);
  });

  it("inserts a column left and a row above", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    await chooseMenuItem("Insert...");
    await chooseMenuItem("Column left");
    expect(model.getCellContent(0, 1, 2)).toBe("");
    expect(model.getCellContent(0, 1, 3)).toBe("Q1");

    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    await chooseMenuItem("Insert...");
    await chooseMenuItem("Row above");
    expect(model.getCellContent(0, 3, 1)).toBe("");
    expect(model.getCellContent(0, 4, 1)).toBe("Pears");
  });

  it("pastes the clipboard through the Clipboard API", async () => {
    const { model, sheet } = setUpWidget();
    vi.stubGlobal("navigator", {
      clipboard: {
        read: () => Promise.reject(new Error("unavailable")),
        readText: () => Promise.resolve("pasted\tvalues"),
      },
    });
    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    await chooseMenuItem("Paste");
    await settle();
    expect(model.getCellContent(0, 3, 2)).toBe("pasted");
    expect(model.getCellContent(0, 3, 3)).toBe("values");
  });

  it("explains a denied clipboard", async () => {
    const { sheet } = setUpWidget();
    vi.stubGlobal("navigator", {
      clipboard: {
        read: () => Promise.reject(new Error("denied")),
        readText: () => Promise.reject(new Error("denied")),
      },
    });
    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    await chooseMenuItem("Paste");
    await settle();
    expect(screen.getByRole("dialog").textContent).toContain(
      "Clipboard access denied",
    );
  });

  it("is not offered in read-only mode", async () => {
    const { sheet } = setUpWidget({ canEdit: false });
    await rightClick(sheet, CELL_B3.x, CELL_B3.y);
    expect(menuItems()).toEqual([]);
  });
});

describe("column header context menu", () => {
  it("selects the clicked column", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    expect(model.getSelectedView().range).toEqual([1, 2, 1048576, 2]);
    expect(menuItems()).toEqual([
      "Insert 1 column(s) left",
      "Insert 1 column(s) right",
      "Move columns left",
      "Move columns right",
      "Set column width",
      "Hide column 'B'",
      "Freeze up to column 'B'",
      "Unfreeze columns",
      "Delete column 'B'",
    ]);
  });

  it("names the range of several selected columns", async () => {
    const { model, sheet } = setUpWidget();
    model.setSelectedCell(1, 2);
    model.setSelectedRange(1, 2, 1048576, 4);
    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    expect(model.getSelectedView().range).toEqual([1, 2, 1048576, 4]);
    expect(menuItems()).toContain("Insert 3 column(s) left");
    expect(menuItems()).toContain("Hide columns B - D");
    expect(menuItems()).toContain("Delete columns B - D");
  });

  it("hides the column and shows it again", async () => {
    const { model, sheet, workbook } = setUpWidget();
    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    expect(menuItems()).not.toContain("Show hidden columns");
    await chooseMenuItem("Hide column 'B'");
    expect(model.getColumnWidth(0, 2)).toBe(0);

    // select A:D (the selection skips the hidden column), over the hidden
    // column, and offer to show it
    await rightClick(sheet, COLUMN_A_HEADER.x, COLUMN_A_HEADER.y);
    await closeMenu();
    await fireEvent.keyDown(workbook, { key: "ArrowRight", shiftKey: true });
    await settle();
    expect(model.getSelectedView().range).toEqual([1, 1, 1048576, 4]);
    await rightClick(sheet, COLUMN_A_HEADER.x, COLUMN_A_HEADER.y);
    expect(menuItems()).toContain("Hide columns A - D");
    await chooseMenuItem("Show hidden columns");
    expect(model.getColumnWidth(0, 2)).toBeGreaterThan(0);
  });

  it("moves columns, and explains a rejected move", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, COLUMN_F_HEADER.x, COLUMN_F_HEADER.y);
    await chooseMenuItem("Move columns right");
    expect(model.getCellContent(0, 1, 7)).toBe("Total");

    // column B holds part of a merged cell
    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    await chooseMenuItem("Move columns right");
    expect(model.getCellContent(0, 1, 2)).toBe("Q1");
    expect(screen.getByRole("dialog").textContent).toContain(
      "Failed to move columns",
    );
  });

  it("freezes, unfreezes and deletes columns", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    await chooseMenuItem("Unfreeze columns");
    expect(model.getFrozenColumnsCount(0)).toBe(0);

    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    expect(menuItems()).not.toContain("Unfreeze columns");
    await chooseMenuItem("Freeze up to column 'B'");
    expect(model.getFrozenColumnsCount(0)).toBe(2);

    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    await chooseMenuItem("Delete column 'B'");
    expect(model.getCellContent(0, 1, 2)).toBe("Q2");
  });

  it("sets the column width from the prompt", async () => {
    const { model, sheet } = setUpWidget();
    const width = model.getColumnWidth(0, 2);
    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    await chooseMenuItem("Set column width");
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Set column width");
    // the number input shows the current width, and turns into a field
    await fireEvent.click(screen.getByText(`${width}`));
    await settle();
    const field = dialog.querySelector("input") as HTMLInputElement;
    field.value = "150";
    await fireEvent.input(field);
    await fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await settle();
    expect(model.getColumnWidth(0, 2)).toBe(150);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("steps the width with the number input's buttons and cancels", async () => {
    const { model, sheet } = setUpWidget();
    const width = model.getColumnWidth(0, 2);
    await rightClick(sheet, COLUMN_B_HEADER.x, COLUMN_B_HEADER.y);
    await chooseMenuItem("Set column width");
    await fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    await settle();
    expect(screen.getByText(`${width + 1}`)).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await settle();
    expect(model.getColumnWidth(0, 2)).toBe(width);
  });
});

describe("row header context menu", () => {
  it("selects the clicked row", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, ROW_3_HEADER.x, ROW_3_HEADER.y);
    expect(model.getSelectedView().range).toEqual([3, 1, 3, 16384]);
    expect(menuItems()).toEqual([
      "Insert 1 row(s) above",
      "Insert 1 row(s) below",
      "Move rows up",
      "Move rows down",
      "Set row height",
      "Hide row '3'",
      "Show hidden rows",
      "Freeze up to row '3'",
      "Unfreeze rows",
      "Delete row '3'",
    ]);
  });

  it("moves and inserts rows", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, ROW_3_HEADER.x, ROW_3_HEADER.y);
    await chooseMenuItem("Move rows up");
    expect(model.getCellContent(0, 2, 1)).toBe("Pears");
    expect(model.getCellContent(0, 3, 1)).toBe("Apples");

    await rightClick(sheet, ROW_3_HEADER.x, ROW_3_HEADER.y);
    await chooseMenuItem("Insert 1 row(s) below");
    expect(model.getCellContent(0, 4, 1)).toBe("");
    expect(model.getCellContent(0, 5, 1)).toBe("Plums");
  });

  it("hides the row and shows it again", async () => {
    const { model, sheet, workbook } = setUpWidget();
    await rightClick(sheet, ROW_3_HEADER.x, ROW_3_HEADER.y);
    await chooseMenuItem("Hide row '3'");
    expect(model.getRowHeight(0, 3)).toBe(0);

    // select rows 2 to 4, over the hidden one
    await rightClick(sheet, ROW_2_HEADER.x, ROW_2_HEADER.y);
    await closeMenu();
    await fireEvent.keyDown(workbook, { key: "ArrowDown", shiftKey: true });
    await settle();
    await rightClick(sheet, ROW_2_HEADER.x, ROW_2_HEADER.y);
    expect(menuItems()).toContain("Hide rows 2 - 4");
    await chooseMenuItem("Show hidden rows");
    expect(model.getRowHeight(0, 3)).toBeGreaterThan(0);
  });

  it("freezes and deletes rows", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, ROW_3_HEADER.x, ROW_3_HEADER.y);
    await chooseMenuItem("Freeze up to row '3'");
    expect(model.getFrozenRowsCount(0)).toBe(3);

    await rightClick(sheet, ROW_3_HEADER.x, ROW_3_HEADER.y);
    await chooseMenuItem("Delete row '3'");
    expect(model.getCellContent(0, 3, 1)).toBe("Plums");
  });

  it("sets the row height from the prompt", async () => {
    const { model, sheet } = setUpWidget();
    await rightClick(sheet, ROW_3_HEADER.x, ROW_3_HEADER.y);
    await chooseMenuItem("Set row height");
    const dialog = screen.getByRole("dialog");
    await fireEvent.click(
      dialog.querySelector(".ic-input-number-display") as HTMLElement,
    );
    await settle();
    const field = dialog.querySelector("input") as HTMLInputElement;
    field.value = "40";
    await fireEvent.input(field);
    await fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await settle();
    expect(model.getRowHeight(0, 3)).toBe(40);
  });
});
