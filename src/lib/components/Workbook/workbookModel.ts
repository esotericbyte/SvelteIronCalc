// The parts of upstream Workbook.tsx that read the model for the formula bar
// and the sheet tabs, as plain functions so they can be unit tested.
import type { Model, WorksheetProperties } from "@ironcalc/wasm";
import { getCellAddress } from "../../upstream/components/util";
import type { WorkbookState } from "../../upstream/components/workbookState";
import type { SheetOptions } from "../SheetTabBar/types";

/** The selection as shown in the formula bar address box (e.g. "B3", "A1:C4", "B:D"). */
export function getSelectedAddress(model: Model): string {
  const {
    row,
    column,
    range: [rowStart, columnStart, rowEnd, columnEnd],
  } = model.getSelectedView();
  return getCellAddress(
    { rowStart, rowEnd, columnStart, columnEnd },
    { row, column },
  );
}

/**
 * Returns the formula bar value and whether it can be edited (false for
 * array formulas, shown in braces).
 */
export function getFormulaValue(
  model: Model,
  workbookState: WorkbookState,
): [string, boolean] {
  const cell = workbookState.getEditingCell();
  if (cell) {
    return [workbookState.getEditingText(), true];
  }
  const { sheet, row, column } = model.getSelectedView();
  const arrayStructure = model.getCellArrayStructure(sheet, row, column);
  if (arrayStructure === "SingleCell") {
    // single cell
  } else if ("DynamicAnchor" in arrayStructure) {
    // Anchor of a dynamic array
  } else if ("DynamicChild" in arrayStructure) {
    // Child of a dynamic array
  } else if ("ArrayAnchor" in arrayStructure) {
    return [`{${model.getCellContent(sheet, row, column)}}`, false];
  } else if ("ArrayChild" in arrayStructure) {
    const array = arrayStructure.ArrayChild;
    return [`{${model.getCellContent(sheet, array[0], array[1])}}`, false];
  }
  return [model.getCellContent(sheet, row, column), true];
}

/** The sheets of the workbook as the tab bar shows them. */
export function getSheetOptions(model: Model): SheetOptions[] {
  return model
    .getWorksheetsProperties()
    .map(({ name, color, sheet_id, state }: WorksheetProperties) => ({
      name,
      color: model.resolveColor(color) || "var(--palette-common-white)",
      sheetId: sheet_id,
      state,
    }));
}

/**
 * Selects a sheet from the tab bar or the sheet list. Like upstream, picking
 * a hidden sheet from the list makes it visible.
 */
export function selectSheet(model: Model, sheet: number): void {
  const sheets = model.getWorksheetsProperties();
  if (sheets[sheet] && sheets[sheet].state !== "visible") {
    model.unhideSheet(sheet);
  }
  model.setSelectedSheet(sheet);
}

/** Alt+ArrowDown: the next sheet, wrapping around. */
export function selectNextSheet(model: Model): void {
  const nextSheet = model.getSelectedSheet() + 1;
  if (nextSheet >= model.getWorksheetsProperties().length) {
    model.setSelectedSheet(0);
  } else {
    model.setSelectedSheet(nextSheet);
  }
}

/** Alt+ArrowUp: the previous sheet, wrapping around. */
export function selectPreviousSheet(model: Model): void {
  const previousSheet = model.getSelectedSheet() - 1;
  if (previousSheet < 0) {
    model.setSelectedSheet(model.getWorksheetsProperties().length - 1);
  } else {
    model.setSelectedSheet(previousSheet);
  }
}
