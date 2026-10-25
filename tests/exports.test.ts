import { describe, expect, it } from "vitest";
import * as lib from "../src/lib";
import * as xlsx from "../src/lib/xlsx";

describe("package entry points", () => {
  it("exports the widget, its UI primitives, the logos and the engine helpers", () => {
    expect(Object.keys(lib).sort()).toEqual([
      "Button",
      "Checkbox",
      "Confirm",
      "IconButton",
      "Input",
      "IronCalc",
      "IronCalcIcon",
      "IronCalcIconWhite",
      "IronCalcLogo",
      "Menu",
      "MenuDivider",
      "MenuItem",
      "MenuItemWithSubmenu",
      "Model",
      "Switch",
      "ToggleButton",
      "Tooltip",
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
