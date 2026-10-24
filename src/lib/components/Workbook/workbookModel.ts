// The parts of upstream Workbook.tsx that read or change the model (the
// formula bar, the sheet tabs, the clipboard and the edit actions), as plain
// functions so they can be unit tested.
import type {
  CellStyle,
  ClipboardCell,
  Model,
  WorksheetProperties,
} from "@ironcalc/wasm";
import {
  CLIPBOARD_ID_SESSION_STORAGE_KEY,
  getNewClipboardId,
} from "../../upstream/components/clipboard";
import { getCellAddress, getEditorSize } from "../../upstream/components/util";
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

/**
 * Starts editing the selected cell: with `text` typed over it (accept mode,
 * as when typing starts an edit) or, without `text`, with its content and
 * the caret at the end (edit mode, as with F2).
 */
export function startEditing(
  model: Model,
  workbookState: WorkbookState,
  text?: string,
): void {
  const { sheet, row, column } = model.getSelectedView();
  const initText = text ?? model.getCellContent(sheet, row, column);
  const { width: editorWidth, height: editorHeight } = getEditorSize(
    model,
    sheet,
    row,
    column,
  );
  workbookState.setEditingCell({
    sheet,
    row,
    column,
    text: initText,
    cursorStart: initText.length,
    cursorEnd: initText.length,
    focus: "cell",
    referencedRange: null,
    activeRanges: [],
    mode: text === undefined ? "edit" : "accept",
    editorWidth,
    editorHeight,
  });
}

/** The selected area, normalized (row/column is the top-left corner). */
export function getSelectedArea(model: Model): {
  sheet: number;
  row: number;
  column: number;
  width: number;
  height: number;
} {
  const {
    sheet,
    range: [rowStart, columnStart, rowEnd, columnEnd],
  } = model.getSelectedView();
  return {
    sheet,
    row: Math.min(rowStart, rowEnd),
    column: Math.min(columnStart, columnEnd),
    width: Math.abs(columnEnd - columnStart) + 1,
    height: Math.abs(rowEnd - rowStart) + 1,
  };
}

/** Delete: clears the contents (not the styles) of the selection. */
export function clearSelectedContents(model: Model): void {
  const { sheet, row, column, width, height } = getSelectedArea(model);
  model.rangeClearContents(
    sheet,
    row,
    column,
    row + height - 1,
    column + width - 1,
  );
}

/** Sets a style property (e.g. "font.b") on the whole selection. */
export function updateRangeStyle(
  model: Model,
  stylePath: string,
  value: string,
): void {
  model.updateRangeStyle(getSelectedArea(model), stylePath, value);
}

/**
 * Ctrl+B, Ctrl+I, Ctrl+U: flips bold, italic or underline on the selection,
 * following the selected cell.
 */
export function toggleFontStyle(model: Model, property: "b" | "i" | "u"): void {
  const { sheet, row, column } = model.getSelectedView();
  const value = model.getCellStyle(sheet, row, column).style.font[property];
  updateRangeStyle(model, `font.${property}`, `${!value}`);
}

/** The styles of the selection, row by row, for the format painter. */
export function getSelectedStyles(model: Model): CellStyle[][] {
  const {
    sheet,
    range: [rowStart, columnStart, rowEnd, columnEnd],
  } = model.getSelectedView();
  const row1 = Math.min(rowStart, rowEnd);
  const column1 = Math.min(columnStart, columnEnd);
  const row2 = Math.max(rowStart, rowEnd);
  const column2 = Math.max(columnStart, columnEnd);

  const styles: CellStyle[][] = [];
  for (let row = row1; row <= row2; row++) {
    const styleRow: CellStyle[] = [];
    for (let column = column1; column <= column2; column++) {
      styleRow.push(model.getCellStyle(sheet, row, column).style);
    }
    styles.push(styleRow);
  }
  return styles;
}

function getClipboardId(): string {
  let clipboardId: string | null = null;
  try {
    clipboardId = sessionStorage.getItem(CLIPBOARD_ID_SESSION_STORAGE_KEY);
    if (!clipboardId) {
      clipboardId = getNewClipboardId();
      sessionStorage.setItem(CLIPBOARD_ID_SESSION_STORAGE_KEY, clipboardId);
    }
  } catch {
    // storage unavailable (private mode, sandboxed frame): copy anyway
    clipboardId = getNewClipboardId();
  }
  return clipboardId;
}

/**
 * What copying (or cutting) the selection puts on the clipboard: the cells
 * as CSV text and as IronCalc's own JSON, which pasting into a workbook
 * reads back with styles and formulas.
 */
export function getClipboardData(
  model: Model,
  type: "copy" | "cut",
): { text: string; json: string; range: [number, number, number, number] } {
  const data = model.copyToClipboard();
  const sheet = model.getSelectedSheet();
  const sheetData: { [row: number]: { [column: number]: ClipboardCell } } =
    {};
  data.data.forEach((value, row) => {
    const rowData: { [column: number]: ClipboardCell } = {};
    value.forEach((cell, column) => {
      rowData[column] = cell;
    });
    sheetData[row] = rowData;
  });
  const json = JSON.stringify({
    type,
    area: data.range,
    sheetData,
    sheet,
    clipboardId: getClipboardId(),
  });
  // like upstream, a copy trims the CSV and a cut does not
  const text = type === "copy" ? data.csv.trim() : data.csv;
  return { text, json, range: data.range };
}

/**
 * Pastes clipboard data into the selection: IronCalc's JSON (from a copy or
 * cut in a workbook, keeping styles and formulas) when present, else plain
 * text as CSV. Returns false when the clipboard held nothing to paste; throws
 * the engine's error when the paste is rejected (e.g. it would cover part of
 * a merged cell).
 */
export function pasteClipboardData(
  model: Model,
  getData: (mimeType: string) => string,
): boolean {
  const mimeTypes = [
    "application/json",
    "text/plain",
    "text/csv",
    "text/html",
  ];
  let mimeType = null;
  let value = null;
  for (let index = 0; index < mimeTypes.length; index += 1) {
    mimeType = mimeTypes[index];
    value = getData(mimeType);
    if (value) {
      break;
    }
  }
  if (!mimeType || !value) {
    // No clipboard data to paste
    return false;
  }
  if (mimeType === "application/json") {
    // We are copying from within the application
    const source = JSON.parse(value);
    const data: Map<number, Map<number, ClipboardCell>> = new Map();
    const sheetData = source.sheetData;
    for (const row of Object.keys(sheetData)) {
      const dataRow = sheetData[row];
      const rowMap = new Map();
      for (const column of Object.keys(dataRow)) {
        rowMap.set(Number.parseInt(column, 10), dataRow[column]);
      }
      data.set(Number.parseInt(row, 10), rowMap);
    }
    model.pasteFromClipboard(
      source.sheet,
      source.area,
      data,
      source.type === "cut",
    );
    return true;
  }
  if (mimeType === "text/plain") {
    model.pasteCsvText(getSelectedArea(model), value);
    return true;
  }
  // NOT IMPLEMENTED (text/csv, text/html), as upstream
  return true;
}

/**
 * Reads the system clipboard for the context menu's Paste, which has no
 * paste event: every type the browser offers, or only the text where
 * `clipboard.read()` is unavailable. IronCalc's JSON of the last copy or cut
 * is added when the clipboard lost it. Rejects when the browser denies
 * access to the clipboard.
 */
export async function readClipboard(
  lastClipboardJson: string | null,
): Promise<(mimeType: string) => string> {
  const data = new Map<string, string>();
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        data.set(type, await (await item.getType(type)).text());
      }
    }
  } catch {
    // fall back to text-only if clipboard.read() is unavailable
    data.clear();
    data.set("text/plain", await navigator.clipboard.readText());
  }
  if (!data.get("application/json") && lastClipboardJson) {
    data.set("application/json", lastClipboardJson);
  }
  return (mimeType) => data.get(mimeType) ?? "";
}
