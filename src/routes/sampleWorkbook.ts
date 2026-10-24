// Builds a small generated workbook that exercises what the widget
// shows: values and formulas, an array formula, styles, a merged range,
// frozen panes, a link and several sheets (one hidden). The demo offers it
// as a sample and the tests use it as their fixture.
import { Model } from "@ironcalc/wasm";

export function buildSampleWorkbook(): Model {
  const model = new Model("Sample", "en", "UTC", "en");

  // Sheet 1: a small table with frozen header row and first column
  model.renameSheet(0, "Summary");
  const rows: string[][] = [
    ["Item", "Q1", "Q2", "Q3", "Q4", "Total"],
    ["Apples", "120", "135", "150", "160", "=SUM(B2:E2)"],
    ["Pears", "80", "95", "70", "110", "=SUM(B3:E3)"],
    ["Plums", "45", "60", "75", "90", "=SUM(B4:E4)"],
    ["Total", "=SUM(B2:B4)", "=SUM(C2:C4)", "=SUM(D2:D4)", "=SUM(E2:E4)", "=SUM(F2:F4)"],
  ];
  rows.forEach((cells, rowIndex) => {
    cells.forEach((value, columnIndex) => {
      model.setUserInput(0, rowIndex + 1, columnIndex + 1, value);
    });
  });
  model.updateRangeStyle(
    { sheet: 0, row: 1, column: 1, width: 6, height: 1 },
    "font.b",
    "true",
  );
  model.setFrozenRowsCount(0, 1);
  model.setFrozenColumnsCount(0, 1);

  // A merged, centered title below the table
  model.setUserInput(0, 7, 2, "Merged and centered");
  model.mergeCells({ sheet: 0, row: 7, column: 2, width: 3, height: 2 });
  model.updateRangeStyle(
    { sheet: 0, row: 7, column: 2, width: 3, height: 2 },
    "alignment.horizontal",
    "center",
  );

  // A link to a public site
  model.setUserInput(0, 10, 1, "IronCalc");
  model.setCellLink(
    0,
    10,
    1,
    { type: "External", target: "https://www.ironcalc.com" },
    "IronCalc",
  );

  // Enough rows to scroll
  for (let row = 12; row <= 200; row += 1) {
    model.setUserInput(0, row, 1, `Row ${row}`);
    model.setUserInput(0, row, 2, `=${row}*2`);
  }

  // Sheet 2: text, numbers and an array formula
  model.newSheet();
  model.renameSheet(1, "Details");
  model.setUserInput(1, 1, 1, "Plain text");
  model.setUserInput(1, 2, 1, "3.14159");
  model.setUserInput(1, 3, 1, "=A2*2");
  model.setUserInput(1, 1, 3, "=SEQUENCE(3)");

  // Sheet 3: hidden, reachable from the sheet list
  model.newSheet();
  model.renameSheet(2, "Hidden");
  model.setUserInput(2, 1, 1, "This sheet is hidden");
  model.hideSheet(2);

  model.setSelectedSheet(0);
  model.setSelectedCell(1, 1);
  return model;
}
