import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Workbook from "../src/lib/components/Workbook/Workbook.svelte";
import {
  clearSelectedContents,
  colorToParam,
  getClipboardData,
  getFormulaValue,
  getMergeCellsState,
  getSelectedAddress,
  getSelectedStyles,
  getSheetOptions,
  mergeSelectedCells,
  pasteClipboardData,
  saveCellLink,
  selectNextSheet,
  selectPreviousSheet,
  selectSheet,
  startEditing,
} from "../src/lib/components/Workbook/workbookModel";
import { WorkbookState } from "../src/lib/upstream/components/workbookState";
import { LAST_COLUMN, LAST_ROW } from "../src/lib/upstream/components/WorksheetCanvas/constants";
import { buildSampleWorkbook } from "../src/routes/sampleWorkbook";

describe("formula bar wiring", () => {
  it("shows the selected cell's address and its formula", () => {
    const model = buildSampleWorkbook();
    const state = new WorkbookState();
    model.setSelectedCell(2, 6);
    expect(getSelectedAddress(model)).toBe("F2");
    expect(getFormulaValue(model, state)).toEqual(["=SUM(B2:E2)", true]);
  });

  it("shows the value of a cell without a formula", () => {
    const model = buildSampleWorkbook();
    model.setSelectedCell(2, 1);
    expect(getFormulaValue(model, new WorkbookState())[0]).toBe("Apples");
  });

  it("uses range and full-column shorthand in the address", () => {
    const model = buildSampleWorkbook();
    model.setSelectedCell(2, 2);
    model.setSelectedRange(2, 2, 4, 5);
    expect(getSelectedAddress(model)).toBe("B2:E4");
    model.setSelectedCell(1, 3);
    model.setSelectedRange(1, 3, LAST_ROW, 4);
    expect(getSelectedAddress(model)).toBe("C:D");
  });
});

describe("sheet tabs wiring", () => {
  it("lists every sheet with its state", () => {
    const model = buildSampleWorkbook();
    const sheets = getSheetOptions(model);
    expect(sheets.map((s) => [s.name, s.state])).toEqual([
      ["Summary", "visible"],
      ["Details", "visible"],
      ["Hidden", "hidden"],
    ]);
  });

  it("selects a sheet, unhiding it when picked from the list", () => {
    const model = buildSampleWorkbook();
    selectSheet(model, 1);
    expect(model.getSelectedSheet()).toBe(1);
    selectSheet(model, 2);
    expect(model.getSelectedSheet()).toBe(2);
    expect(getSheetOptions(model)[2].state).toBe("visible");
  });

  it("cycles through the sheets with wrap-around", () => {
    const model = buildSampleWorkbook();
    selectPreviousSheet(model);
    expect(model.getSelectedSheet()).toBe(2);
    selectNextSheet(model);
    expect(model.getSelectedSheet()).toBe(0);
  });
});

describe("edit actions", () => {
  it("starts typing over a cell or editing its content", () => {
    const model = buildSampleWorkbook();
    const state = new WorkbookState();
    model.setSelectedCell(2, 1);
    startEditing(model, state, "x");
    expect(state.getEditingCell()).toMatchObject({
      row: 2,
      column: 1,
      text: "x",
      mode: "accept",
      focus: "cell",
    });
    startEditing(model, state);
    expect(state.getEditingCell()).toMatchObject({
      text: "Apples",
      cursorStart: 6,
      mode: "edit",
    });
  });

  it("clears the contents of the selection but keeps its styles", () => {
    const model = buildSampleWorkbook();
    model.setSelectedCell(1, 1);
    model.setSelectedRange(1, 1, 2, 2);
    clearSelectedContents(model);
    expect(model.getCellContent(0, 1, 1)).toBe("");
    expect(model.getCellContent(0, 2, 2)).toBe("");
    expect(model.getCellContent(0, 2, 3)).toBe("135");
    expect(model.getCellStyle(0, 1, 1).style.font.b).toBe(true);
  });

  it("copies the styles of the selection onto another area", () => {
    const model = buildSampleWorkbook();
    model.setSelectedCell(1, 1);
    model.setSelectedRange(1, 1, 1, 2);
    const styles = getSelectedStyles(model);
    expect(styles).toHaveLength(1);
    expect(styles[0]).toHaveLength(2);
    model.setSelectedCell(30, 1);
    model.setSelectedRange(30, 1, 30, 2);
    model.onPasteStyles(styles);
    expect(model.getCellStyle(0, 30, 2).style.font.b).toBe(true);
  });

  it("round-trips the clipboard JSON", () => {
    const model = buildSampleWorkbook();
    model.setSelectedCell(2, 6);
    const { text, json } = getClipboardData(model, "copy");
    expect(text).toBe("565");
    model.setSelectedCell(40, 6);
    const data: Record<string, string> = { "application/json": json };
    expect(pasteClipboardData(model, (type) => data[type] ?? "")).toBe(true);
    // a copied formula is shifted to its new place
    expect(model.getCellContent(0, 40, 6)).toBe("=SUM(B40:E40)");
    expect(pasteClipboardData(model, () => "")).toBe(false);
  });

  it("starts the format painter", () => {
    const model = buildSampleWorkbook();
    const workbookState = new WorkbookState();
    const { component } = render(Workbook, { model, workbookState });
    model.setSelectedCell(1, 1);
    component.copyStyles();
    expect(workbookState.getCopyStyles()?.[0][0].font.b).toBe(true);
  });
});

describe("toolbar wiring", () => {
  it("tells what the merge menu can do with the selection", () => {
    const model = buildSampleWorkbook();
    model.setSelectedCell(12, 3);
    expect(getMergeCellsState(model)).toEqual({
      canMerge: false,
      canMergeAcross: false,
      canMergeDown: false,
      canUnmerge: false,
    });
    model.setSelectedRange(12, 3, 13, 3);
    expect(getMergeCellsState(model)).toEqual({
      canMerge: true,
      canMergeAcross: false,
      canMergeDown: true,
      canUnmerge: false,
    });
    // the sample's merged title is B7:D8
    model.setSelectedCell(6, 3);
    model.setSelectedRange(6, 3, 7, 3);
    expect(getMergeCellsState(model).canUnmerge).toBe(true);
    expect(getMergeCellsState(model).canMerge).toBe(false);
    // whole rows and columns can be neither merged nor unmerged
    model.setSelectedCell(1, 1);
    model.setSelectedRange(1, 1, 1, LAST_COLUMN);
    expect(getMergeCellsState(model).canMerge).toBe(false);
  });

  it("merges each row of the selection across", () => {
    const model = buildSampleWorkbook();
    model.setSelectedCell(30, 3);
    model.setSelectedRange(30, 3, 31, 5);
    mergeSelectedCells(model, "merge_across");
    expect(model.getMergedCells(0)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ row: 30, column: 3, width: 3, height: 1 }),
        expect.objectContaining({ row: 31, column: 3, width: 3, height: 1 }),
      ]),
    );
    mergeSelectedCells(model, "unmerge");
    expect(model.getMergedCells(0)).toHaveLength(1);
    // two cells with content cannot be merged
    model.setSelectedCell(2, 2);
    model.setSelectedRange(2, 2, 2, 3);
    expect(() => mergeSelectedCells(model, "merge")).toThrow(/more than one cell has content/);
  });

  it("converts the colors for a range style", () => {
    expect(colorToParam(undefined)).toBe("");
    expect(colorToParam("#FF0000")).toBe("#FF0000");
    expect(colorToParam([3, 0.4])).toBe("[3, 0.4]");
  });

  it("labels a saved link with the label, else its target", () => {
    const model = buildSampleWorkbook();
    const cell = { sheet: 0, row: 30, column: 1 };
    saveCellLink(model, cell, { type: "Internal", location: "Details!A1" }, "  ");
    expect(model.getCellContent(0, 30, 1)).toBe("Details!A1");
    saveCellLink(
      model,
      cell,
      { type: "External", target: "https://example.com/page" },
      "Example",
    );
    expect(model.getCellContent(0, 30, 1)).toBe("Example");
    expect(model.getCellLink(0, 30, 1)).toMatchObject({ target: "https://example.com/page" });
  });
});
