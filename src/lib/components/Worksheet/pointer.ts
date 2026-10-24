// Port of upstream webapp/IronCalc/src/components/Worksheet/usePointer.ts from
// a React hook to a plain handler factory.
//
// Phase 1 is read-only, so the branches that only run while a cell is being
// edited (clicking another cell to insert a reference into the formula, and
// committing the edit when clicking away) are not ported yet; they come with
// the cell editor (see docs/parity.md).
import type { Model } from "@ironcalc/wasm";
import type { Cell } from "../../upstream/components/types";
import {
  headerColumnWidth,
  headerRowHeight,
  LAST_COLUMN,
  LAST_ROW,
} from "../../upstream/components/WorksheetCanvas/constants";
import type WorksheetCanvas from "../../upstream/components/WorksheetCanvas/worksheetCanvas";

export interface PointerSettings {
  canvasElement: () => HTMLCanvasElement | null;
  worksheetCanvas: () => WorksheetCanvas | null;
  worksheetElement: () => HTMLDivElement | null;
  onCellSelected: (cell: Cell, event: PointerEvent) => void;
  onRowSelected: (row: number, shift: boolean) => void;
  onColumnSelected: (column: number, shift: boolean) => void;
  onAllSheetSelected: () => void;
  onAreaSelecting: (cell: Cell) => void;
  onAreaSelected: () => void;
  model: () => Model;
  refresh: () => void;
}

export interface PointerHandlers {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
}

export function createPointerHandlers(
  options: PointerSettings,
): PointerHandlers {
  let isSelecting = false;
  let isSelectingRows = false;
  let initialRow: number | null = null;
  let isSelectingColumns = false;
  let initialColumn: number | null = null;

  const onPointerMove = (event: PointerEvent): void => {
    // Range selections are disabled on non-mouse devices. Use touch move only
    // to scroll for now.
    if (event.pointerType !== "mouse") {
      return;
    }

    if (!(isSelecting || isSelectingRows || isSelectingColumns)) {
      return;
    }
    const model = options.model();
    const canvas = options.canvasElement();
    const worksheet = options.worksheetCanvas();
    if (!worksheet || !canvas) {
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.x;
    const y = event.clientY - canvasRect.y;

    if (isSelectingRows) {
      // Prevent text selection during row dragging
      event.preventDefault();
      if (initialRow === null) {
        return;
      }
      let targetRow: number | null = null;
      if (x >= 0 && x < headerColumnWidth && y >= headerRowHeight) {
        const cell = worksheet.getCellByCoordinates(headerColumnWidth, y);
        if (cell) {
          targetRow = cell.row;
        }
      } else if (x >= headerColumnWidth && y >= headerRowHeight) {
        const cell = worksheet.getCellByCoordinates(x, y);
        if (cell) {
          targetRow = cell.row;
        }
      }

      if (targetRow !== null) {
        model.setSelectedCell(Math.min(initialRow, targetRow), 1);
        model.setSelectedRange(
          Math.min(initialRow, targetRow),
          1,
          Math.max(initialRow, targetRow),
          LAST_COLUMN,
        );
        options.refresh();
      }
      return;
    }

    if (isSelectingColumns) {
      // Prevent text selection during column dragging
      event.preventDefault();
      if (initialColumn === null) {
        return;
      }
      let targetColumn: number | null = null;
      if (x >= headerColumnWidth && y >= 0 && y < headerRowHeight) {
        const cell = worksheet.getCellByCoordinates(x, headerRowHeight);
        if (cell) {
          targetColumn = cell.column;
        }
      } else if (x >= headerColumnWidth && y >= headerRowHeight) {
        const cell = worksheet.getCellByCoordinates(x, y);
        if (cell) {
          targetColumn = cell.column;
        }
      }

      if (targetColumn !== null) {
        model.setSelectedCell(1, Math.min(initialColumn, targetColumn));
        model.setSelectedRange(
          1,
          Math.min(initialColumn, targetColumn),
          LAST_ROW,
          Math.max(initialColumn, targetColumn),
        );
        options.refresh();
      }
      return;
    }

    const cell = worksheet.getCellByCoordinates(x, y);
    if (!cell) {
      return;
    }
    if (isSelecting) {
      options.onAreaSelecting(cell);
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    const worksheetElement = options.worksheetElement();
    if (isSelecting) {
      isSelecting = false;
      worksheetElement?.releasePointerCapture(event.pointerId);
      options.onAreaSelected();
    } else if (isSelectingRows) {
      isSelectingRows = false;
      initialRow = null;
      worksheetElement?.releasePointerCapture(event.pointerId);
    } else if (isSelectingColumns) {
      isSelectingColumns = false;
      initialColumn = null;
      worksheetElement?.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    if (target.className === "column-resize-handle") {
      // we are resizing a column
      return;
    }
    if (
      typeof target.className === "string" &&
      target.className.includes("ironcalc-cell-handle")
    ) {
      // we are extending values
      return;
    }
    if (event.button === 2) {
      return;
    }
    let x = event.clientX;
    let y = event.clientY;
    const worksheet = options.worksheetCanvas();
    const canvas = options.canvasElement();
    const worksheetWrapper = options.worksheetElement();
    if (!canvas || !worksheet || !worksheetWrapper) {
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();
    x -= canvasRect.x;
    y -= canvasRect.y;
    // Makes sure is in the sheet area
    if (
      x > canvasRect.width ||
      x < headerColumnWidth ||
      y < headerRowHeight ||
      y > canvasRect.height
    ) {
      if (x < headerColumnWidth && y < headerRowHeight) {
        // Click on the top left corner
        options.onAllSheetSelected();
      } else if (
        x > 0 &&
        x < headerColumnWidth &&
        y > headerRowHeight &&
        y < canvasRect.height
      ) {
        // Click on a row number
        const cell = worksheet.getCellByCoordinates(headerColumnWidth, y);
        if (cell) {
          if (event.shiftKey) {
            // Shift+click: extend selection
            options.onRowSelected(cell.row, true);
          } else {
            // Regular click: start drag selection
            event.preventDefault();
            initialRow = cell.row;
            isSelectingRows = true;
            worksheetWrapper.setPointerCapture(event.pointerId);
            options.onRowSelected(cell.row, false);
          }
        }
      } else if (
        x > headerColumnWidth &&
        x < canvasRect.width &&
        y > 0 &&
        y < headerRowHeight
      ) {
        // Click on a column letter
        const cell = worksheet.getCellByCoordinates(x, headerRowHeight);
        if (cell) {
          if (event.shiftKey) {
            // Shift+click: extend selection
            options.onColumnSelected(cell.column, true);
          } else {
            // Regular click: start drag selection
            event.preventDefault();
            initialColumn = cell.column;
            isSelectingColumns = true;
            worksheetWrapper.setPointerCapture(event.pointerId);
            options.onColumnSelected(cell.column, false);
          }
        }
      }
      return;
    }

    const cell = worksheet.getCellByCoordinates(x, y);
    if (cell) {
      if (event.shiftKey) {
        // We are extending the selection
        options.onAreaSelecting(cell);
        options.onAreaSelected();
      } else {
        // We are selecting a single cell
        options.onCellSelected(cell, event);
        isSelecting = true;
        worksheetWrapper.setPointerCapture(event.pointerId);
      }
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}
