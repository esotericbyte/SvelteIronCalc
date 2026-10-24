import { describe, expect, it } from "vitest";
import * as lib from "../src/lib";
import * as xlsx from "../src/lib/xlsx";

describe("package entry points", () => {
  it("exports the widget and the engine helpers", () => {
    expect(Object.keys(lib).sort()).toEqual([
      "IronCalc",
      "Model",
      "Workbook",
      "WorkbookState",
      "darkThemeVariables",
      "defaultThemeVariables",
      "init",
      "setThemeVariables",
      "unsetThemeVariables",
    ]);
    expect(Object.keys(xlsx).sort()).toEqual([
      "downloadXlsx",
      "initXlsx",
      "modelFromXlsx",
      "modelToXlsx",
    ]);
  });
});
