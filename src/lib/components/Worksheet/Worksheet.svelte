<!--
  Port of upstream webapp/IronCalc/src/components/Worksheet/Worksheet.tsx.

  The canvas renderer (upstream WorksheetCanvas, carried unchanged) draws the
  sheet; this component owns the DOM it draws into and the scroller around it.
  Like upstream, a fresh WorksheetCanvas is built over the same elements on
  every refresh: the renderer is written for that.

  A right click opens the context menu of the cell, the column headers or
  the row headers (only while the widget can be edited, as upstream), after
  selecting what was clicked unless it is already in the selection. The
  column width and row height entries ask for the size in a Prompt.
-->
<script lang="ts">
  import { columnNameFromNumber, type Model } from "@ironcalc/wasm";
  import { onDestroy, untrack } from "svelte";
  import { t } from "../../i18n";
  import type { Cell } from "../../upstream/components/types";
  import { getEditorSize } from "../../upstream/components/util";
  import type { LinkHoverCell } from "../../upstream/components/WorksheetCanvas/cellLinks";
  import {
    headerColumnWidth,
    headerRowHeight,
    LAST_COLUMN,
    LAST_ROW,
  } from "../../upstream/components/WorksheetCanvas/constants";
  import WorksheetCanvas from "../../upstream/components/WorksheetCanvas/worksheetCanvas";
  import type { WorkbookState } from "../../upstream/components/workbookState";
  import Editor from "../Editor/Editor.svelte";
  import Alert from "../Modal/Alert.svelte";
  import Prompt from "../Modal/Prompt.svelte";
  import CellContextMenu from "./ContextMenus/CellContextMenu.svelte";
  import ColumnHeaderContextMenu from "./ContextMenus/ColumnHeaderContextMenu.svelte";
  import RowHeaderContextMenu from "./ContextMenus/RowHeaderContextMenu.svelte";
  import type { HeaderRange } from "./ContextMenus/types";
  import LinkTooltip from "./LinkTooltip.svelte";
  import { createPointerHandlers } from "./pointer";

  interface Props {
    model: Model;
    workbookState: WorkbookState;
    /** Bumped by the workbook whenever the model changed outside Svelte's view. */
    version: number;
    refresh: () => void;
    /** When false, the cell editor is read-only and no edit starts here. */
    canEdit: boolean;
    /** Called when an edit in the cell editor ends. */
    onEditEnd: () => void;
    /** The cell context menu's clipboard entries. */
    onCut: () => void;
    onCopy: () => void;
    onPaste: () => void;
    /** Gives the focus back to the workbook after a menu or dialog closed. */
    restoreFocus: () => void;
  }

  let {
    model,
    workbookState,
    version,
    refresh,
    canEdit,
    onEditEnd,
    onCut,
    onCopy,
    onPaste,
    restoreFocus,
  }: Props = $props();

  let scrollElement: HTMLDivElement | null = $state(null);
  let spacerElement: HTMLDivElement | null = $state(null);
  let worksheetElement: HTMLDivElement | null = $state(null);
  let canvasElement: HTMLCanvasElement | null = $state(null);
  let cellOutline: HTMLDivElement | null = $state(null);
  let areaOutline: HTMLDivElement | null = $state(null);
  let cellArrayStructure: HTMLDivElement | null = $state(null);
  let extendToOutline: HTMLDivElement | null = $state(null);
  let editorElement: HTMLDivElement | null = $state(null);
  let columnResizeGuide: HTMLDivElement | null = $state(null);
  let rowResizeGuide: HTMLDivElement | null = $state(null);
  let columnHeaders: HTMLDivElement | null = $state(null);

  let worksheetCanvas: WorksheetCanvas | null = null;
  let cellEditor: Editor | null = $state(null);

  // The raw engine error of a rejected autofill (localized when rendered)
  let autofillError: string | null = $state(null);

  let cellContextMenuOpen = $state(false);
  let colHeaderContextMenuOpen = $state(false);
  let rowHeaderContextMenuOpen = $state(false);
  let contextMenuPosition: { x: number; y: number } | null = $state(null);
  let rowColErrorTitle: string | null = $state(null);
  let columnWidthDialogOpen = $state(false);
  let columnWidthDefault = $state("");
  let rowHeightDialogOpen = $state(false);
  let rowHeightDefault = $state("");

  // What the context menus show about the selection
  const selection = $derived.by(() => {
    void version;
    const view = model.getSelectedView();
    const [rowStart, columnStart, rowEnd, columnEnd] = view.range;
    const range: HeaderRange = {
      rowStart,
      columnStart: columnNameFromNumber(columnStart),
      rowEnd,
      columnEnd: columnNameFromNumber(columnEnd),
      columnCount: columnEnd - columnStart + 1,
    };
    return {
      column: columnNameFromNumber(view.column),
      row: view.row,
      range,
      frozenColumnsCount: model.getFrozenColumnsCount(view.sheet),
      frozenRowsCount: model.getFrozenRowsCount(view.sheet),
    };
  });

  // Counted only while the column menu is open: a selected row spans every
  // column of the sheet
  const hiddenColumnsCount = $derived.by(() => {
    void version;
    if (!colHeaderContextMenuOpen) {
      return 0;
    }
    const { sheet, range } = model.getSelectedView();
    let count = 0;
    for (let column = range[1]; column <= range[3]; column++) {
      if (model.getColumnWidth(sheet, column) === 0) {
        count += 1;
      }
    }
    return count;
  });

  const editingText = $derived.by(() => {
    void version;
    return workbookState.getEditingText();
  });

  // Size of the sheet area, tracked so a resize re-renders at the new size
  let width = $state(0);
  let height = $state(0);

  let ignoreScrollEvent = false;
  // The model's scroll position as of the last time it was synced with the
  // DOM scroller, in either direction (see render and onScroll)
  let lastModelScroll: { x: number; y: number } | null = null;

  // The cell whose link tooltip is shown (null if hidden). The canvas does
  // the hover hit-testing and reports it through onLinkHover. Hiding is
  // delayed so the pointer can travel from the cell into the tooltip.
  let linkTooltipCell: LinkHoverCell | null = $state(null);
  let linkTooltipHideTimeout: ReturnType<typeof setTimeout> | null = null;

  function cancelHideLinkTooltip(): void {
    if (linkTooltipHideTimeout !== null) {
      clearTimeout(linkTooltipHideTimeout);
      linkTooltipHideTimeout = null;
    }
  }

  function hideLinkTooltip(): void {
    cancelHideLinkTooltip();
    linkTooltipCell = null;
  }

  function scheduleHideLinkTooltip(): void {
    if (linkTooltipHideTimeout !== null) {
      return;
    }
    linkTooltipHideTimeout = setTimeout(() => {
      linkTooltipHideTimeout = null;
      linkTooltipCell = null;
    }, 300);
  }

  onDestroy(cancelHideLinkTooltip);

  function render(): void {
    const scroller = scrollElement;
    const worksheet = worksheetElement;
    if (
      !canvasElement ||
      !columnResizeGuide ||
      !rowResizeGuide ||
      !columnHeaders ||
      !worksheet ||
      !cellOutline ||
      !areaOutline ||
      !extendToOutline ||
      !scroller ||
      !editorElement ||
      !cellArrayStructure ||
      !canvasElement.closest(".ic-root")
    ) {
      return;
    }
    // Fit the editor box to the text before the renderer positions it
    cellEditor?.syncSize();
    // The visible sheet area, used by the engine for page up/down and to
    // keep the selected cell in view
    model.setWindowWidth(worksheet.clientWidth);
    model.setWindowHeight(worksheet.clientHeight);
    const canvas = new WorksheetCanvas({
      width: worksheet.clientWidth,
      height: worksheet.clientHeight,
      model,
      workbookState,
      elements: {
        canvas: canvasElement,
        columnGuide: columnResizeGuide,
        rowGuide: rowResizeGuide,
        columnHeaders,
        cellOutline,
        cellArrayStructure,
        areaOutline,
        extendToOutline,
        editor: editorElement,
      },
      onColumnWidthChanges(sheet, column, newWidth) {
        if (newWidth < 0) {
          return;
        }
        const { range } = model.getSelectedView();
        let columnStart = column;
        let columnEnd = column;
        const fullColumn = range[0] === 1 && range[2] === LAST_ROW;
        const fullRow = range[1] === 1 && range[3] === LAST_COLUMN;
        if (
          fullColumn &&
          column >= range[1] &&
          column <= range[3] &&
          !fullRow
        ) {
          columnStart = Math.min(range[1], column, range[3]);
          columnEnd = Math.max(range[1], column, range[3]);
        }
        model.setColumnsWidth(sheet, columnStart, columnEnd, newWidth);
        worksheetCanvas?.renderSheet();
      },
      onRowHeightChanges(sheet, row, newHeight) {
        if (newHeight < 0) {
          return;
        }
        const { range } = model.getSelectedView();
        let rowStart = row;
        let rowEnd = row;
        const fullColumn = range[0] === 1 && range[2] === LAST_ROW;
        const fullRow = range[1] === 1 && range[3] === LAST_COLUMN;
        if (fullRow && row >= range[0] && row <= range[2] && !fullColumn) {
          rowStart = Math.min(range[0], row, range[2]);
          rowEnd = Math.max(range[0], row, range[2]);
        }
        model.setRowsHeight(sheet, rowStart, rowEnd, newHeight);
        worksheetCanvas?.renderSheet();
      },
      onLinkHover: (cell) => {
        if (cell) {
          cancelHideLinkTooltip();
          // keep the state (and the tooltip) when still on the same cell
          const previous = linkTooltipCell;
          if (
            !(
              previous &&
              previous.row === cell.row &&
              previous.column === cell.column
            )
          ) {
            linkTooltipCell = cell;
          }
        } else if (linkTooltipCell !== null) {
          scheduleHideLinkTooltip();
        }
      },
      onHideLinkTooltip: hideLinkTooltip,
      onAutofillError: (message) => {
        // the known rejections get a dialog; anything else stays silent
        if (
          message.includes("merged cell") ||
          message.includes("array formula")
        ) {
          autofillError = message;
        }
      },
      linkTooltipCell,
      refresh,
    });
    const scrollX = model.getScrollX();
    const scrollY = model.getScrollY();
    const [sheetWidth, sheetHeight] = [scrollX + 100_000, scrollY + 500_000];
    if (spacerElement) {
      spacerElement.style.height = `${sheetHeight}px`;
      spacerElement.style.width = `${sheetWidth}px`;
    }
    // Push the model's scroll position into the DOM scroller only when the
    // model changed since the last sync (keyboard navigation, following a
    // link, switching sheets, ...). During free scrolling the model is
    // snapped to whole-cell boundaries while the DOM scroller sits mid-cell,
    // so re-syncing on every render would jump the sheet.
    const synced = lastModelScroll;
    if (!synced || synced.x !== scrollX || synced.y !== scrollY) {
      const previousLeft = scroller.scrollLeft;
      const previousTop = scroller.scrollTop;
      scroller.scrollLeft = scrollX;
      scroller.scrollTop = scrollY;
      if (
        scroller.scrollLeft !== previousLeft ||
        scroller.scrollTop !== previousTop
      ) {
        // the write fires a single (asynchronous) scroll event, consumed in
        // onScroll; when the browser quantizes the value back to the current
        // position no event fires, so the flag must stay clear
        ignoreScrollEvent = true;
      }
      lastModelScroll = { x: scrollX, y: scrollY };
    }

    canvas.renderSheet();
    worksheetCanvas = canvas;
  }

  $effect(() => {
    // Re-render when the workbook refreshes, the area resizes or the link
    // tooltip changes (the renderer is told which cell has the tooltip)
    void version;
    void width;
    void height;
    void linkTooltipCell;
    void model;
    if (!worksheetElement) {
      return;
    }
    untrack(render);
  });

  $effect(() => {
    const element = scrollElement;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => {
      width = element.clientWidth;
      height = element.clientHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  });

  const pointer = createPointerHandlers({
    model: () => model,
    workbookState: () => workbookState,
    refresh: () => refresh(),
    canvasElement: () => canvasElement,
    worksheetElement: () => worksheetElement,
    worksheetCanvas: () => worksheetCanvas,
    onColumnSelected: (column: number, shift: boolean) => {
      let firstColumn = column;
      let lastColumn = column;
      if (shift) {
        const { range } = model.getSelectedView();
        firstColumn = Math.min(range[1], column, range[3]);
        lastColumn = Math.max(range[3], column, range[1]);
      }
      model.setSelectedCell(1, firstColumn);
      model.setSelectedRange(1, firstColumn, LAST_ROW, lastColumn);
      refresh();
    },
    onRowSelected: (row: number, shift: boolean) => {
      let firstRow = row;
      let lastRow = row;
      if (shift) {
        const { range } = model.getSelectedView();
        firstRow = Math.min(range[0], row, range[2]);
        lastRow = Math.max(range[2], row, range[0]);
      }
      model.setSelectedCell(firstRow, 1);
      model.setSelectedRange(firstRow, 1, lastRow, LAST_COLUMN);
      refresh();
    },
    onAllSheetSelected: () => {
      model.setSelectedCell(1, 1);
      model.setSelectedRange(1, 1, LAST_ROW, LAST_COLUMN);
      refresh();
    },
    onCellSelected: (cell: Cell, event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      model.setSelectedCell(cell.row, cell.column);
      refresh();
    },
    onAreaSelecting: (cell: Cell) => {
      if (!worksheetCanvas) {
        return;
      }
      workbookState.setSelecting(true);
      model.onAreaSelecting(cell.row, cell.column);
      worksheetCanvas.renderSheet();
      refresh();
    },
    onAreaSelected: () => {
      workbookState.setSelecting(false);
      const styles = workbookState.getCopyStyles();
      if (styles?.length) {
        model.onPasteStyles(styles);
        if (!worksheetCanvas) {
          return;
        }
        worksheetCanvas.renderSheet();
      }
      workbookState.setCopyStyles(null);
      if (worksheetElement) {
        worksheetElement.style.cursor = "auto";
      }
      refresh();
    },
  });

  function onScroll(): void {
    if (!scrollElement || !worksheetCanvas) {
      return;
    }
    if (ignoreScrollEvent) {
      // Consume the one scroll event fired by the programmatic sync in render
      ignoreScrollEvent = false;
      return;
    }
    worksheetCanvas.setScrollPosition({
      left: scrollElement.scrollLeft,
      top: scrollElement.scrollTop,
    });
    worksheetCanvas.renderSheet();
    // The model snapped to a whole-cell boundary while the DOM scroller sits
    // wherever the user left it: record the model position so the next
    // render does not "correct" the DOM scroller back to the boundary.
    lastModelScroll = { x: model.getScrollX(), y: model.getScrollY() };
  }

  function onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // The context menus only offer editing actions (insert/delete,
    // cut/paste), so they are not shown in read-only mode.
    if (!canEdit) {
      return;
    }

    // Store mouse position for menu placement
    contextMenuPosition = { x: event.clientX, y: event.clientY };

    // Detect if right-click is on column header or row header
    const canvas = canvasElement;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const x = event.clientX - canvasRect.x;
      const y = event.clientY - canvasRect.y;

      // Check if click is in column header area
      if (
        x > headerColumnWidth &&
        x < canvasRect.width &&
        y > 0 &&
        y < headerRowHeight
      ) {
        const view = model.getSelectedView();
        const [rowStart, columnStart, rowEnd, columnEnd] = view.range;
        const cell = worksheetCanvas?.getCellByCoordinates(x, headerRowHeight);
        const column = cell?.column ?? view.column;
        if (
          !(rowStart === 1 && rowEnd === LAST_ROW) ||
          !(columnStart <= column && column <= columnEnd)
        ) {
          // No columns are selected, or the click is outside them: select
          // the column clicked on
          model.setSelectedCell(1, column);
          model.setSelectedRange(1, column, LAST_ROW, column);
          refresh();
        }
        colHeaderContextMenuOpen = true;
        return;
      }

      // Check if click is in row header area
      if (
        x > 0 &&
        x < headerColumnWidth &&
        y > headerRowHeight &&
        y < canvasRect.height
      ) {
        const view = model.getSelectedView();
        const [rowStart, columnStart, rowEnd, columnEnd] = view.range;
        const cell = worksheetCanvas?.getCellByCoordinates(headerColumnWidth, y);
        const row = cell?.row ?? view.row;
        if (
          !(columnStart === 1 && columnEnd === LAST_COLUMN) ||
          !(rowStart <= row && row <= rowEnd)
        ) {
          // No rows are selected, or the click is outside them: select the
          // row clicked on
          model.setSelectedCell(row, 1);
          model.setSelectedRange(row, 1, row, LAST_COLUMN);
          refresh();
        }
        rowHeaderContextMenuOpen = true;
        return;
      }

      // Cell area: select the clicked cell unless it is in the selection
      const cell = worksheetCanvas?.getCellByCoordinates(x, y);
      if (cell) {
        const [rowStart, columnStart, rowEnd, columnEnd] =
          model.getSelectedView().range;
        if (
          !(
            rowStart <= cell.row &&
            cell.row <= rowEnd &&
            columnStart <= cell.column &&
            cell.column <= columnEnd
          )
        ) {
          model.setSelectedCell(cell.row, cell.column);
          refresh();
        }
      }
    }

    cellContextMenuOpen = true;
  }

  /** Runs a structural change; a rejected one shows `errorKey` in an alert. */
  function tryChange(change: () => void, errorKey: string): void {
    try {
      change();
    } catch {
      rowColErrorTitle = t(errorKey);
    }
    refresh();
  }

  function closeMenus(): void {
    cellContextMenuOpen = false;
    colHeaderContextMenuOpen = false;
    rowHeaderContextMenuOpen = false;
    // The menu had the focus; give it back to the sheet unless the chosen
    // entry opened a dialog (which takes it, and gives it back on close)
    if (!columnWidthDialogOpen && !rowHeightDialogOpen && rowColErrorTitle === null) {
      restoreFocus();
    }
  }

  function selectedColumns(): { sheet: number; start: number; count: number; column: number } {
    const view = model.getSelectedView();
    return {
      sheet: view.sheet,
      start: view.range[1],
      count: view.range[3] - view.range[1] + 1,
      column: view.column,
    };
  }

  function selectedRows(): { sheet: number; start: number; count: number; row: number } {
    const view = model.getSelectedView();
    return {
      sheet: view.sheet,
      start: view.range[0],
      count: view.range[2] - view.range[0] + 1,
      row: view.row,
    };
  }

  /** The renderer of the visible sheet, for callers such as image export. */
  export function getCanvas(): WorksheetCanvas | null {
    return worksheetCanvas;
  }
</script>

<div
  bind:this={scrollElement}
  onscroll={onScroll}
  class="ic-worksheet-wrapper scroll"
>
  <div class="ic-worksheet-spacer" bind:this={spacerElement}></div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="ic-worksheet-sheet-container"
    bind:this={worksheetElement}
    onpointerdown={pointer.onPointerDown}
    onpointermove={pointer.onPointerMove}
    onpointerup={pointer.onPointerUp}
    oncontextmenu={onContextMenu}
    ondblclick={(event) => {
      // Starts editing cell
      if (!canEdit) {
        return;
      }
      const { sheet, row, column } = model.getSelectedView();
      const text = model.getCellContent(sheet, row, column);
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
        text,
        cursorStart: text.length,
        cursorEnd: text.length,
        focus: "cell",
        referencedRange: null,
        activeRanges: [],
        mode: "accept",
        editorWidth,
        editorHeight,
      });
      event.stopPropagation();
      refresh();
    }}
  >
    <canvas class="ic-worksheet-sheet-canvas" bind:this={canvasElement}
    ></canvas>
    <div
      class="ic-worksheet-cell-array-structure"
      bind:this={cellArrayStructure}
    ></div>
    <div class="ic-worksheet-cell-outline" bind:this={cellOutline}></div>
    <div class="ic-worksheet-editor-wrapper" bind:this={editorElement}>
      <Editor
        bind:this={cellEditor}
        originalText={editingText}
        {onEditEnd}
        onTextUpdated={refresh}
        {model}
        {workbookState}
        type="cell"
        {canEdit}
        {version}
      />
    </div>
    <div class="ic-worksheet-area-outline" bind:this={areaOutline}></div>
    <div class="ic-worksheet-extend-to-outline" bind:this={extendToOutline}
    ></div>
    <div class="ic-worksheet-column-resize-guide" bind:this={columnResizeGuide}
    ></div>
    <div class="ic-worksheet-row-resize-guide" bind:this={rowResizeGuide}></div>
    <div class="ic-worksheet-column-headers" bind:this={columnHeaders}></div>
    {#if linkTooltipCell}
      <LinkTooltip
        cell={linkTooltipCell}
        onFollow={(link) => worksheetCanvas?.followLink(link)}
        onHide={hideLinkTooltip}
        onPointerEnter={cancelHideLinkTooltip}
        onPointerLeave={scheduleHideLinkTooltip}
      />
    {/if}
  </div>
  <Alert
    open={autofillError !== null}
    onClose={() => (autofillError = null)}
    title={t("error_dialog.error_autofill")}
    message={autofillError?.includes("merged cell")
      ? t("error_dialog.error_autofill_merged")
      : t("error_dialog.error_autofill_array")}
  />
  <CellContextMenu
    open={cellContextMenuOpen}
    onClose={closeMenus}
    anchorPosition={contextMenuPosition}
    column={selection.column}
    row={selection.row}
    onCut={() => {
      cellContextMenuOpen = false;
      onCut();
    }}
    onCopy={() => {
      cellContextMenuOpen = false;
      onCopy();
    }}
    onPaste={() => {
      cellContextMenuOpen = false;
      onPaste();
    }}
    onInsertColumnLeft={() => {
      const view = model.getSelectedView();
      tryChange(
        () => model.insertColumns(view.sheet, view.column, 1),
        "error_dialog.error_inserting_columns",
      );
    }}
    onInsertColumnRight={() => {
      const view = model.getSelectedView();
      tryChange(
        () => model.insertColumns(view.sheet, view.range[3] + 1, 1),
        "error_dialog.error_inserting_columns",
      );
    }}
    onInsertRowAbove={() => {
      const view = model.getSelectedView();
      tryChange(
        () => model.insertRows(view.sheet, view.row, 1),
        "error_dialog.error_inserting_rows",
      );
    }}
    onInsertRowBelow={() => {
      const view = model.getSelectedView();
      tryChange(
        () => model.insertRows(view.sheet, view.range[2] + 1, 1),
        "error_dialog.error_inserting_rows",
      );
    }}
    onDeleteColumn={() => {
      const view = model.getSelectedView();
      tryChange(
        () => model.deleteColumns(view.sheet, view.column, 1),
        "error_dialog.error_deleting_columns",
      );
    }}
    onDeleteRow={() => {
      const view = model.getSelectedView();
      tryChange(
        () => model.deleteRows(view.sheet, view.row, 1),
        "error_dialog.error_deleting_rows",
      );
    }}
  />
  <ColumnHeaderContextMenu
    open={colHeaderContextMenuOpen}
    onClose={closeMenus}
    anchorPosition={contextMenuPosition}
    range={selection.range}
    frozenColumnsCount={selection.frozenColumnsCount}
    {hiddenColumnsCount}
    onInsertColumnsLeft={() => {
      const { sheet, column, count } = selectedColumns();
      tryChange(
        () => model.insertColumns(sheet, column, count),
        "error_dialog.error_inserting_columns",
      );
    }}
    onInsertColumnsRight={() => {
      const { sheet, start, count } = selectedColumns();
      tryChange(
        () => model.insertColumns(sheet, start + count, count),
        "error_dialog.error_inserting_columns",
      );
    }}
    onMoveColumnsLeft={() => {
      const { sheet, start, count } = selectedColumns();
      tryChange(
        () => model.moveColumns(sheet, start, count, -1),
        "error_dialog.error_moving_columns",
      );
    }}
    onMoveColumnsRight={() => {
      const { sheet, start, count } = selectedColumns();
      tryChange(
        () => model.moveColumns(sheet, start, count, 1),
        "error_dialog.error_moving_columns",
      );
    }}
    onSetColumnWidth={() => {
      const { sheet, start } = selectedColumns();
      columnWidthDefault = `${model.getColumnWidth(sheet, start)}`;
      columnWidthDialogOpen = true;
    }}
    onFreezeColumns={() => {
      const { sheet, column } = selectedColumns();
      model.setFrozenColumnsCount(sheet, column);
      refresh();
    }}
    onUnfreezeColumns={() => {
      model.setFrozenColumnsCount(model.getSelectedSheet(), 0);
      refresh();
    }}
    onDeleteColumns={() => {
      const { sheet, start, count } = selectedColumns();
      tryChange(
        () => model.deleteColumns(sheet, start, count),
        "error_dialog.error_deleting_columns",
      );
    }}
    onHideColumns={() => {
      const { sheet, start, count } = selectedColumns();
      model.setColumnsHidden(sheet, start, start + count - 1, true);
      refresh();
    }}
    onShowHiddenColumns={() => {
      const { sheet, start, count } = selectedColumns();
      model.setColumnsHidden(sheet, start, start + count - 1, false);
      refresh();
    }}
  />
  <RowHeaderContextMenu
    open={rowHeaderContextMenuOpen}
    onClose={closeMenus}
    anchorPosition={contextMenuPosition}
    range={selection.range}
    frozenRowsCount={selection.frozenRowsCount}
    onInsertRowsAbove={() => {
      const { sheet, row, count } = selectedRows();
      tryChange(
        () => model.insertRows(sheet, row, count),
        "error_dialog.error_inserting_rows",
      );
    }}
    onInsertRowsBelow={() => {
      const { sheet, row, count } = selectedRows();
      tryChange(
        () => model.insertRows(sheet, row + 1, count),
        "error_dialog.error_inserting_rows",
      );
    }}
    onMoveRowsUp={() => {
      const { sheet, start, count } = selectedRows();
      tryChange(
        () => model.moveRows(sheet, start, count, -1),
        "error_dialog.error_moving_rows",
      );
    }}
    onMoveRowsDown={() => {
      const { sheet, start, count } = selectedRows();
      tryChange(
        () => model.moveRows(sheet, start, count, 1),
        "error_dialog.error_moving_rows",
      );
    }}
    onSetRowHeight={() => {
      const { sheet, start } = selectedRows();
      rowHeightDefault = `${model.getRowHeight(sheet, start)}`;
      rowHeightDialogOpen = true;
    }}
    onFreezeRows={() => {
      const { sheet, row } = selectedRows();
      model.setFrozenRowsCount(sheet, row);
      refresh();
    }}
    onUnfreezeRows={() => {
      model.setFrozenRowsCount(model.getSelectedSheet(), 0);
      refresh();
    }}
    onDeleteRows={() => {
      const { sheet, start, count } = selectedRows();
      tryChange(
        () => model.deleteRows(sheet, start, count),
        "error_dialog.error_deleting_rows",
      );
    }}
    onHideRows={() => {
      const { sheet, start, count } = selectedRows();
      model.setRowsHidden(sheet, start, start + count - 1, true);
      refresh();
    }}
    onShowHiddenRows={() => {
      const { sheet, start, count } = selectedRows();
      model.setRowsHidden(sheet, start, start + count - 1, false);
      refresh();
    }}
  />
  <Alert
    open={rowColErrorTitle !== null}
    onClose={() => {
      rowColErrorTitle = null;
      restoreFocus();
    }}
    title={rowColErrorTitle ?? ""}
    message={rowColErrorTitle ?? ""}
  />
  <Prompt
    open={columnWidthDialogOpen}
    onClose={() => {
      columnWidthDialogOpen = false;
      restoreFocus();
    }}
    title={t("context_menu.column_header.set_column_width")}
    confirmLabel={t("common.apply")}
    cancelLabel={t("common.cancel")}
    defaultValue={columnWidthDefault}
    inputProps={{ type: "number", min: 0, step: "any", endAdornment: "px" }}
    onSubmit={(value) => {
      const newWidth = Number.parseFloat(value);
      if (!Number.isFinite(newWidth) || newWidth < 0) {
        return;
      }
      const { sheet, start, count } = selectedColumns();
      model.setColumnsWidth(sheet, start, start + count - 1, newWidth);
      refresh();
    }}
  />
  <Prompt
    open={rowHeightDialogOpen}
    onClose={() => {
      rowHeightDialogOpen = false;
      restoreFocus();
    }}
    title={t("context_menu.row_header.set_row_height")}
    confirmLabel={t("common.apply")}
    cancelLabel={t("common.cancel")}
    defaultValue={rowHeightDefault}
    inputProps={{ type: "number", min: 0, step: "any", endAdornment: "px" }}
    onSubmit={(value) => {
      const newHeight = Number.parseFloat(value);
      if (!Number.isFinite(newHeight) || newHeight < 0) {
        return;
      }
      const { sheet, start, count } = selectedRows();
      model.setRowsHeight(sheet, start, start + count - 1, newHeight);
      refresh();
    }}
  />
</div>

<style>
  /* Port of upstream Worksheet/worksheet.css. Elements created by the
     carried renderer are not seen by Svelte's scoping, hence :global. */
  :global(.ironcalc-cell-handle) {
    position: absolute;
    width: 5px;
    height: 5px;
    background: var(--palette-sheet-outline-color);
    cursor: crosshair;
    border-radius: 1px;
    border: 1px solid var(--palette-common-white);
  }

  /* The handle auto-fills (drags) cell content, so it is an edit affordance. */
  :global(.ic-workbook-container--readonly .ironcalc-cell-handle) {
    display: none;
  }

  .ic-worksheet-spacer {
    position: absolute;
    height: 5000px;
    width: 5000px;
  }

  .ic-worksheet-sheet-container {
    position: sticky;
    top: 0;
    left: 0;
    height: 100%;
  }

  .ic-worksheet-sheet-container :global(.column-resize-handle) {
    position: absolute;
    top: 0;
    width: 3px;
    opacity: 0;
    background: var(--palette-sheet-outline-color);
    border-radius: 5px;
    cursor: col-resize;
  }

  .ic-worksheet-sheet-container :global(.column-resize-handle:hover) {
    opacity: 1;
  }

  .ic-worksheet-sheet-container :global(.row-resize-handle) {
    position: absolute;
    left: 0;
    height: 3px;
    opacity: 0;
    background: var(--palette-sheet-outline-color);
    border-radius: 5px;
    cursor: row-resize;
  }

  .ic-worksheet-sheet-container :global(.row-resize-handle:hover) {
    opacity: 1;
  }

  .ic-worksheet-wrapper {
    position: absolute;
    overflow: scroll;
    top: calc(var(--formula-bar-height) + 1px);
    left: 0;
    right: 0;
    bottom: calc(var(--navigation-height) + 1px);
    overscroll-behavior: none;
  }

  .ic-worksheet-sheet-canvas {
    position: relative;
    top: 0;
    left: 0;
    right: 0;
    bottom: calc(var(--navigation-height) + 1px);
  }

  .ic-worksheet-column-resize-guide {
    position: absolute;
    top: 0;
    display: none;
    height: 100%;
    width: 0;
    border-left: 1px dashed var(--palette-sheet-outline-color);
  }

  .ic-worksheet-column-headers {
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
    display: flex;
  }

  .ic-worksheet-column-headers :global(.column-header) {
    display: inline-block;
    text-align: center;
    overflow: hidden;
    height: 100%;
    user-select: none;
  }

  .ic-worksheet-row-resize-guide {
    position: absolute;
    display: none;
    left: 0;
    height: 0;
    width: 100%;
    border-top: 1px dashed var(--palette-sheet-outline-color);
  }

  .ic-worksheet-area-outline {
    position: absolute;
    border: 0px solid var(--palette-sheet-outline-color);
    border-radius: 1px;
    background-color: var(--palette-sheet-outline-background-color);
  }

  .ic-worksheet-cell-array-structure {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid var(--palette-sheet-cell-array-structure-color);
  }

  .ic-worksheet-cell-outline {
    position: absolute;
    border: 2px solid var(--palette-sheet-outline-color);
    border-radius: 3px;
    word-break: break-word;
    font-size: 12px;
    display: flex;
    box-shadow: inset 0 0 0 1px var(--palette-common-white);
  }

  .ic-worksheet-extend-to-outline {
    position: absolute;
    border: 1px dashed var(--palette-sheet-outline-color);
    border-radius: 3px;
  }

  /* The renderer positions the editor over the edited cell, or out of view */
  .ic-worksheet-editor-wrapper {
    position: absolute;
    width: 100%;
    padding: 0;
    outline: 3px solid var(--palette-sheet-outline-editing-color);
    resize: none;
    white-space: pre-wrap;
    vertical-align: bottom;
    overflow: hidden;
    text-align: left;
    z-index: 1000;
    font-family: monospace;
    border: 2px solid var(--palette-sheet-outline-color);
  }
</style>
