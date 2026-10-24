import { describe, expect, it } from "vitest";
import {
  getFormulaValue,
  getSelectedAddress,
  getSheetOptions,
  selectNextSheet,
  selectPreviousSheet,
  selectSheet,
} from "../src/lib/components/Workbook/workbookModel";
import { WorkbookState } from "../src/lib/upstream/components/workbookState";
import { LAST_ROW } from "../src/lib/upstream/components/WorksheetCanvas/constants";
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
