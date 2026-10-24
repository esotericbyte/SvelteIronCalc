import { Model } from "@ironcalc/wasm";
import { describe, expect, it } from "vitest";
import { modelFromXlsx, modelToXlsx } from "../src/lib/xlsx";
import { buildSampleWorkbook } from "../src/routes/sampleWorkbook";

describe("xlsx bridge", () => {
  it("round-trips a workbook through xlsx bytes", () => {
    const original = buildSampleWorkbook();
    const bytes = modelToXlsx(original);
    // an xlsx file is a zip archive
    expect([...bytes.slice(0, 2)]).toEqual([0x50, 0x4b]);

    const model = modelFromXlsx(bytes, "Sample");
    expect(model).toBeInstanceOf(Model);
    expect(model.getWorksheetsProperties().map((s) => s.name)).toEqual([
      "Summary",
      "Details",
      "Hidden",
    ]);
    expect(model.getCellContent(0, 2, 6)).toBe("=SUM(B2:E2)");
    expect(model.getFormattedCellValue(0, 2, 6)).toBe("565");
    expect(model.getFrozenRowsCount(0)).toBe(1);
    expect(model.getMergedCells(0)).toEqual([
      expect.objectContaining({ row: 7, column: 2, width: 3, height: 2 }),
    ]);
  });

  it("rejects bytes that are not an xlsx file", () => {
    expect(() => modelFromXlsx(new Uint8Array([1, 2, 3]), "bad")).toThrow();
  });
});
