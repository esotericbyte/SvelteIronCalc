<!--
  Port of upstream webapp/IronCalc/src/components/Workbook/Workbook.tsx,
  read-only (phase 1): formula bar, worksheet and sheet tabs, keyboard
  navigation and copying the selection. The toolbar, the right drawer, the
  link dialog and every editing action come in later phases (docs/parity.md).

  Keyboard handling stays inside the widget: the only key listener is on the
  focusable container below, and it ignores events whose target is anything
  but the container itself (inputs, menus, buttons inside keep their keys).
-->
<script lang="ts">
  import type { ClipboardCell, Model } from "@ironcalc/wasm";
  import {
    CLIPBOARD_ID_SESSION_STORAGE_KEY,
    getNewClipboardId,
  } from "../../upstream/components/clipboard";
  import type { NavigationKey } from "../../upstream/components/util";
  import { LAST_COLUMN, LAST_ROW } from "../../upstream/components/WorksheetCanvas/constants";
  import type { WorkbookState } from "../../upstream/components/workbookState";
  import FormulaBar from "../FormulaBar/FormulaBar.svelte";
  import SheetTabBar from "../SheetTabBar/SheetTabBar.svelte";
  import Worksheet from "../Worksheet/Worksheet.svelte";
  import { createKeyDownHandler } from "./keyboardNavigation";
  import {
    getFormulaValue,
    getSelectedAddress,
    getSheetOptions,
    selectNextSheet,
    selectPreviousSheet,
    selectSheet,
  } from "./workbookModel";

  interface Props {
    model: Model;
    workbookState: WorkbookState;
  }

  let { model, workbookState }: Props = $props();

  // `model` and `workbookState` change without Svelte seeing it (they live
  // in wasm and in a plain class); bumping `version` re-reads them, like
  // upstream's `setRedrawId((id) => id + 1)`.
  let version = $state(0);
  function refresh(): void {
    version += 1;
  }

  let rootElement: HTMLDivElement | null = $state(null);

  const view = $derived.by(() => {
    void version;
    const [formulaValue] = getFormulaValue(model, workbookState);
    return {
      cellAddress: getSelectedAddress(model),
      formulaValue,
      sheets: getSheetOptions(model),
      selectedSheet: model.getSelectedSheet(),
    };
  });

  function focusWorkbook(): void {
    if (!rootElement) {
      return;
    }
    rootElement.focus({ preventScroll: true });
    // The copy event goes to the selection, so put a collapsed one inside
    // the widget (upstream does the same)
    const selection = window.getSelection();
    if (selection && rootElement.firstChild) {
      selection.empty();
      const range = new Range();
      range.setStart(rootElement.firstChild, 0);
      range.setEnd(rootElement.firstChild, 0);
      selection.addRange(range);
    }
  }

  const noop = (): void => {};

  const onKeyDown = createKeyDownHandler({
    canEdit: false,
    root: () => rootElement,
    onCellsDeleted: noop,
    onEditKeyPressStart: noop,
    onCellEditStart: noop,
    onBold: noop,
    onItalic: noop,
    onUnderline: noop,
    onUndo: noop,
    onRedo: noop,
    onExpandAreaSelectedKeyboard: (key) => {
      model.onExpandSelectedRange(key);
      refresh();
    },
    onNavigationToEdge: (direction: NavigationKey): void => {
      model.onNavigateToEdgeInDirection(direction);
      refresh();
    },
    onPageDown: () => {
      model.onPageDown();
      refresh();
    },
    onPageUp: () => {
      model.onPageUp();
      refresh();
    },
    onArrowDown: () => {
      model.onArrowDown();
      refresh();
    },
    onArrowUp: () => {
      model.onArrowUp();
      refresh();
    },
    onArrowLeft: () => {
      model.onArrowLeft();
      refresh();
    },
    onArrowRight: () => {
      model.onArrowRight();
      refresh();
    },
    onKeyHome: () => {
      const selectedView = model.getSelectedView();
      const cell = model.getSelectedCell();
      model.setSelectedCell(cell[1], 1);
      model.setTopLeftVisibleCell(selectedView.top_row, 1);
      refresh();
    },
    onKeyEnd: () => {
      const selectedView = model.getSelectedView();
      const cell = model.getSelectedCell();
      model.setSelectedCell(cell[1], LAST_COLUMN);
      model.setTopLeftVisibleCell(selectedView.top_row, LAST_COLUMN - 5);
      refresh();
    },
    onNextSheet: () => {
      selectNextSheet(model);
      refresh();
    },
    onPreviousSheet: () => {
      selectPreviousSheet(model);
      refresh();
    },
    onEscape: () => {
      workbookState.clearCutRange();
      workbookState.setCopyStyles(null);
      refresh();
    },
    onSelectColumn: () => {
      const { column } = model.getSelectedView();
      model.setSelectedRange(1, column, LAST_ROW, column);
      refresh();
    },
    onSelectRow: () => {
      const { row } = model.getSelectedView();
      model.setSelectedRange(row, 1, row, LAST_COLUMN);
      refresh();
    },
  });

  function onCopy(event: ClipboardEvent): void {
    if (!event.clipboardData) {
      return;
    }
    const data = model.copyToClipboard();
    const sheet = model.getSelectedSheet();
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
    const sheetData: { [row: number]: { [column: number]: ClipboardCell } } =
      {};
    data.data.forEach((value, row) => {
      const rowData: { [column: number]: ClipboardCell } = {};
      value.forEach((cell, column) => {
        rowData[column] = cell;
      });
      sheetData[row] = rowData;
    });
    const clipboardJson = JSON.stringify({
      type: "copy",
      area: data.range,
      sheetData,
      sheet,
      clipboardId,
    });
    event.clipboardData.setData("text/plain", data.csv.trim());
    event.clipboardData.setData("application/json", clipboardJson);
    event.preventDefault();
    event.stopPropagation();
  }

  function blockEdit(event: ClipboardEvent): void {
    // read-only: no cutting or pasting into the workbook
    event.preventDefault();
    event.stopPropagation();
  }

  /** Re-reads the model; call after changing it from outside the widget. */
  export function redraw(): void {
    refresh();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="ic-workbook-container ic-workbook-container--readonly"
  bind:this={rootElement}
  role="application"
  aria-label="Spreadsheet"
  tabindex="0"
  onkeydown={onKeyDown}
  onclick={(event) => {
    // Take focus when the sheet is clicked (the worksheet stops pointerdown,
    // so like upstream this listens to click), but leave it with any control
    // (button, menu, input) that was clicked
    const target = event.target as Element;
    if (!target.closest("button, input, textarea, select, [role='tab']")) {
      focusWorkbook();
    }
  }}
  oncopy={onCopy}
  oncut={blockEdit}
  onpaste={blockEdit}
>
  <div class="ic-workbook-worksheet-area-left">
    <FormulaBar cellAddress={view.cellAddress} formulaValue={view.formulaValue} />
    <Worksheet {model} {workbookState} {version} {refresh} />
    <SheetTabBar
      sheets={view.sheets}
      selectedIndex={view.selectedSheet}
      onSheetSelected={(sheet) => {
        selectSheet(model, sheet);
        refresh();
        focusWorkbook();
      }}
    />
  </div>
</div>

<style>
  .ic-workbook-worksheet-area-left {
    position: absolute;
    top: var(--toolbar-height);
    width: 100%;
    height: calc(100% - var(--toolbar-height));
  }

  .ic-workbook-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    font-family: var(--typography-font-family);
  }

  .ic-workbook-container:focus {
    outline: none;
  }

  /* In read-only mode the toolbar is not rendered, so collapse the space
     reserved for it. */
  .ic-workbook-container--readonly {
    --toolbar-height: 0px;
  }
</style>
