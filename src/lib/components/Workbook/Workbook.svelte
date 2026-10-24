<!--
  Port of upstream webapp/IronCalc/src/components/Workbook/Workbook.tsx:
  formula bar, worksheet and sheet tabs, keyboard navigation and the edit
  actions (typing and F2 to edit, Delete, undo/redo, the bold/italic/underline
  shortcuts, copy, cut and paste, copying styles). The toolbar, the right
  drawer and the link dialog come in later phases (docs/parity.md).

  Keyboard handling stays inside the widget: the only key listener is on the
  focusable container below, and it ignores events whose target is anything
  but the container itself (the cell editor, inputs, menus and buttons inside
  keep their keys).
-->
<script lang="ts">
  import type { Model } from "@ironcalc/wasm";
  import { t } from "../../i18n";
  import { isInReferenceMode } from "../../upstream/components/Editor/util";
  import type { NavigationKey } from "../../upstream/components/util";
  import { LAST_COLUMN, LAST_ROW } from "../../upstream/components/WorksheetCanvas/constants";
  import type { WorkbookState } from "../../upstream/components/workbookState";
  import FormulaBar from "../FormulaBar/FormulaBar.svelte";
  import Alert from "../Modal/Alert.svelte";
  import SheetTabBar from "../SheetTabBar/SheetTabBar.svelte";
  import Worksheet from "../Worksheet/Worksheet.svelte";
  import { createKeyDownHandler } from "./keyboardNavigation";
  import {
    clearSelectedContents,
    getClipboardData,
    getFormulaValue,
    getSelectedAddress,
    getSelectedStyles,
    getSheetOptions,
    pasteClipboardData,
    selectNextSheet,
    selectPreviousSheet,
    selectSheet,
    startEditing,
    toggleFontStyle,
  } from "./workbookModel";

  interface Props {
    model: Model;
    workbookState: WorkbookState;
    /** When false, the formula bar is read-only and all edits are blocked. */
    canEdit?: boolean;
  }

  let { model, workbookState, canEdit = true }: Props = $props();

  // `model` and `workbookState` change without Svelte seeing it (they live
  // in wasm and in a plain class); bumping `version` re-reads them, like
  // upstream's `setRedrawId((id) => id + 1)`.
  let version = $state(0);
  function refresh(): void {
    version += 1;
  }

  let rootElement: HTMLDivElement | null = $state(null);

  let alertDialog: { title: string; message: string } | null = $state(null);

  // The JSON of the last copy or cut, for pastes whose clipboard lost it
  let lastClipboardJson: string | null = null;

  const view = $derived.by(() => {
    void version;
    const [formulaValue, canEditFormula] = getFormulaValue(model, workbookState);
    return {
      cellAddress: getSelectedAddress(model),
      formulaValue,
      canEditFormula,
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

  // Upstream takes the focus back on every render while no cell is being
  // edited. Here it is taken back only when an edit ends and the focus is
  // still inside the widget or nowhere (the editor was hidden), so a click
  // that ended the edit by focusing something outside the widget keeps it.
  function onEditEnd(): void {
    refresh();
    setTimeout(() => {
      if (workbookState.getEditingCell()) {
        return;
      }
      const active = document.activeElement;
      if (!active || active === document.body || rootElement?.contains(active)) {
        focusWorkbook();
      }
    }, 0);
  }

  function setCopyStylesCursor(active: boolean): void {
    // FIXME (upstream): this is so that the cursor indicates there are
    // styles to be pasted
    const element = rootElement?.getElementsByClassName(
      "ic-worksheet-sheet-container",
    )[0] as HTMLElement | undefined;
    if (!element) {
      return;
    }
    if (active) {
      // Taken from lucide icons: <PaintRoller /> and rotated.
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paint-roller" style="transform:rotate(-8deg)"><rect width="16" height="6" x="2" y="2" rx="2"></rect><path d="M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect width="4" height="6" x="8" y="16" rx="1"></rect></svg>`;
      element.style.cursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}'), auto`;
    } else {
      element.style.cursor = "auto";
    }
  }

  /**
   * The format painter: remembers the styles of the selection; the next
   * area selected gets them (see the worksheet), Escape cancels. Upstream
   * starts it from the toolbar, which comes with phase 4.
   */
  export function copyStyles(): void {
    workbookState.setCopyStyles(getSelectedStyles(model));
    setCopyStylesCursor(true);
  }

  /** Undoes the last change to the model. */
  export function undo(): void {
    model.undo();
    refresh();
  }

  /** Redoes the last undone change. */
  export function redo(): void {
    model.redo();
    refresh();
  }

  // A rejected paste (e.g. it would partially cover a merged cell) gets a
  // dialog; the merged-cell case is localized, the rest show the raw error.
  function showPasteError(error: unknown): void {
    const message = `${error}`;
    alertDialog = {
      title: t("error_dialog.error_paste"),
      message: message.includes("merged cell")
        ? t("error_dialog.error_paste_merged")
        : message,
    };
  }

  const onKeyDown = createKeyDownHandler({
    get canEdit() {
      return canEdit;
    },
    root: () => rootElement,
    onCellsDeleted: () => {
      try {
        clearSelectedContents(model);
      } catch (e) {
        alertDialog = {
          title: t("error_dialog.error_deleting_cells"),
          message: `${e}`,
        };
      }
      refresh();
    },
    onEditKeyPressStart: (initText) => {
      startEditing(model, workbookState, initText);
      refresh();
    },
    onCellEditStart: () => {
      // User presses F2, we start editing at the end of the text
      startEditing(model, workbookState);
      refresh();
    },
    onBold: () => {
      toggleFontStyle(model, "b");
      refresh();
    },
    onItalic: () => {
      toggleFontStyle(model, "i");
      refresh();
    },
    onUnderline: () => {
      toggleFontStyle(model, "u");
      refresh();
    },
    onUndo: undo,
    onRedo: redo,
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
      setCopyStylesCursor(false);
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
    const { text, json } = getClipboardData(model, "copy");
    lastClipboardJson = json;
    event.clipboardData.setData("text/plain", text);
    event.clipboardData.setData("application/json", json);
    event.preventDefault();
    event.stopPropagation();
  }

  function onCut(event: ClipboardEvent): void {
    if (!canEdit) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!event.clipboardData) {
      return;
    }
    const { text, json, range } = getClipboardData(model, "cut");
    lastClipboardJson = json;
    event.clipboardData.setData("text/plain", text);
    event.clipboardData.setData("application/json", json);
    workbookState.setCutRange({
      sheet: model.getSelectedSheet(),
      rowStart: range[0],
      rowEnd: range[2],
      columnStart: range[1],
      columnEnd: range[3],
    });
    event.preventDefault();
    event.stopPropagation();
    refresh();
  }

  function onPaste(event: ClipboardEvent): void {
    if (!canEdit) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    workbookState.clearCutRange();
    const { clipboardData } = event;
    if (!clipboardData) {
      return;
    }
    try {
      if (!pasteClipboardData(model, (type) => clipboardData.getData(type))) {
        return;
      }
      refresh();
    } catch (e) {
      showPasteError(e);
    }
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
  class={["ic-workbook-container", !canEdit && "ic-workbook-container--readonly"]}
  bind:this={rootElement}
  role="application"
  aria-label="Spreadsheet"
  tabindex="0"
  onkeydown={onKeyDown}
  onclick={(event) => {
    if (workbookState.getEditingCell()) {
      event.stopPropagation();
      return;
    }
    // Take focus when the sheet is clicked (the worksheet stops pointerdown,
    // so like upstream this listens to click), but leave it with any control
    // (button, menu, input) that was clicked
    const target = event.target as Element;
    if (!target.closest("button, input, textarea, select, [role='tab']")) {
      focusWorkbook();
    }
  }}
  oncopy={onCopy}
  oncut={onCut}
  onpaste={onPaste}
>
  <div class="ic-workbook-worksheet-area-left">
    <FormulaBar
      cellAddress={view.cellAddress}
      formulaValue={view.formulaValue}
      {model}
      {workbookState}
      onChange={onEditEnd}
      onTextUpdated={refresh}
      canEdit={canEdit && view.canEditFormula}
      {version}
    />
    <Worksheet
      {model}
      {workbookState}
      {version}
      {refresh}
      canEdit={canEdit && view.canEditFormula}
      {onEditEnd}
    />
    <SheetTabBar
      sheets={view.sheets}
      selectedIndex={view.selectedSheet}
      onSheetSelected={(sheet) => {
        selectSheet(model, sheet);
        refresh();
        // while a cell is edited the focus stays in its editor
        if (!workbookState.getEditingCell()) {
          focusWorkbook();
        }
      }}
      isReferenceMode={() => {
        const cell = workbookState.getEditingCell();
        return (
          cell !== null && isInReferenceMode(model, cell.text, cell.cursorStart)
        );
      }}
    />
  </div>
  <Alert
    open={alertDialog !== null}
    onClose={() => (alertDialog = null)}
    title={alertDialog?.title ?? ""}
    message={alertDialog?.message ?? ""}
  />
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
    /* The toolbar (upstream shows it whenever editing is allowed) comes with
       phase 4; until then no space is reserved for it. */
    --toolbar-height: 0px;
  }

  .ic-workbook-container:focus {
    outline: none;
  }
</style>
