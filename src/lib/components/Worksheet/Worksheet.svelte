<!--
  Port of upstream webapp/IronCalc/src/components/Worksheet/Worksheet.tsx.

  The canvas renderer (upstream WorksheetCanvas, carried unchanged) draws the
  sheet; this component owns the DOM it draws into and the scroller around it.
  Like upstream, a fresh WorksheetCanvas is built over the same elements on
  every refresh: the renderer is written for that.

  Phase 1 is read-only: the cell editor, the context menus and the column
  width / row height dialogs are not ported yet (see docs/parity.md).
-->
<script lang="ts">
  import type { Model } from "@ironcalc/wasm";
  import { onDestroy, untrack } from "svelte";
  import type { Cell } from "../../upstream/components/types";
  import type { LinkHoverCell } from "../../upstream/components/WorksheetCanvas/cellLinks";
  import {
    LAST_COLUMN,
    LAST_ROW,
  } from "../../upstream/components/WorksheetCanvas/constants";
  import WorksheetCanvas from "../../upstream/components/WorksheetCanvas/worksheetCanvas";
  import type { WorkbookState } from "../../upstream/components/workbookState";
  import LinkTooltip from "./LinkTooltip.svelte";
  import { createPointerHandlers } from "./pointer";

  interface Props {
    model: Model;
    workbookState: WorkbookState;
    /** Bumped by the workbook whenever the model changed outside Svelte's view. */
    version: number;
    refresh: () => void;
  }

  let { model, workbookState, version, refresh }: Props = $props();

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
    oncontextmenu={(event) => {
      // The context menus only offer editing actions, so read-only shows none
      event.preventDefault();
      event.stopPropagation();
    }}
  >
    <canvas class="ic-worksheet-sheet-canvas" bind:this={canvasElement}
    ></canvas>
    <div
      class="ic-worksheet-cell-array-structure"
      bind:this={cellArrayStructure}
    ></div>
    <div class="ic-worksheet-cell-outline" bind:this={cellOutline}></div>
    <div class="ic-worksheet-editor-wrapper" bind:this={editorElement}></div>
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

  /* The renderer positions the editor; until the cell editor is ported it
     only ever hides it. */
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
