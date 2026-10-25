<!--
  Port of upstream webapp/IronCalc/src/components/Workbook/Workbook.tsx:
  toolbar, formula bar, worksheet and sheet tabs, keyboard navigation, the
  edit actions (typing and F2 to edit, Delete, undo/redo, the
  bold/italic/underline shortcuts, copy, cut and paste, copying styles), the
  clipboard entries of the cell context menu, the sheet management of the
  tab bar, the toolbar's handlers (styles, number formats, borders, merging,
  themes, grid lines, the PNG export) and the link dialog. The right drawer
  comes in a later phase (docs/parity.md).

  Keyboard handling stays inside the widget: the only key listener is on the
  focusable container below, and it ignores events whose target is anything
  but the container itself (the cell editor, inputs, menus and buttons inside
  keep their keys).
-->
<script lang="ts">
  import {
    type BorderOptions,
    type Color,
    getThemeList,
    type IronCalcTheme,
    type Link,
    type Model,
  } from "@ironcalc/wasm";
  import { t } from "../../i18n";
  import { isInReferenceMode } from "../../upstream/components/Editor/util";
  import type { NavigationKey } from "../../upstream/components/util";
  import { LAST_COLUMN, LAST_ROW } from "../../upstream/components/WorksheetCanvas/constants";
  import { devicePixelRatio } from "../../upstream/components/WorksheetCanvas/worksheetCanvas";
  import type { WorkbookState } from "../../upstream/components/workbookState";
  import FormulaBar from "../FormulaBar/FormulaBar.svelte";
  import LinkDialog from "../LinkDialog/LinkDialog.svelte";
  import Alert from "../Modal/Alert.svelte";
  import SheetTabBar from "../SheetTabBar/SheetTabBar.svelte";
  import Toolbar, { type MergeCellsOperation } from "../Toolbar/Toolbar.svelte";
  import Worksheet from "../Worksheet/Worksheet.svelte";
  import { createKeyDownHandler } from "./keyboardNavigation";
  import {
    clearSelectedContents,
    clearSelectedFormatting,
    colorToParam,
    getClipboardData,
    getFormulaValue,
    getMergeCellsState,
    getSelectedAddress,
    getSelectedStyles,
    getSheetOptions,
    mergeSelectedCells,
    pasteClipboardData,
    readClipboard,
    saveCellLink,
    selectNextSheet,
    selectPreviousSheet,
    selectSheet,
    setSelectedAreaBorder,
    startEditing,
    toggleFontStyle,
    updateRangeStyle,
  } from "./workbookModel";

  interface Props {
    model: Model;
    workbookState: WorkbookState;
    /** When false, the toolbar is hidden, the formula bar is read-only and all edits are blocked. */
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
  let worksheet: Worksheet | null = $state(null);

  let alertDialog: { title: string; message: string } | null = $state(null);

  // The cell the link dialog operates on (null when the dialog is closed)
  let linkDialogCell: { sheet: number; row: number; column: number } | null =
    $state(null);

  // The JSON of the last copy or cut, for pastes whose clipboard lost it
  let lastClipboardJson: string | null = null;

  const themes: IronCalcTheme[] = getThemeList();

  const view = $derived.by(() => {
    void version;
    const [formulaValue, canEditFormula] = getFormulaValue(model, workbookState);
    const { sheet, row, column } = model.getSelectedView();
    return {
      cellAddress: getSelectedAddress(model),
      formulaValue,
      canEditFormula,
      sheets: getSheetOptions(model),
      selectedSheet: model.getSelectedSheet(),
      style: model.getCellStyle(sheet, row, column).style,
      canUndo: model.canUndo(),
      canRedo: model.canRedo(),
      mergeCellsState: getMergeCellsState(model),
      showGridLines: model.getShowGridLines(model.getSelectedSheet()),
      fmtSettings: model.getFmtSettings(),
      currentTheme: model.getTheme(),
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
  // edited. Here it is taken back only when an edit ends, or a menu or
  // dialog of the widget closes, and the focus is still inside the widget
  // or nowhere (the editor or menu was removed), so a click that focused
  // something outside the widget keeps it.
  function onEditEnd(): void {
    refresh();
    restoreFocus();
  }

  function restoreFocus(): void {
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
   * The format painter (the toolbar's copy styles): remembers the styles of
   * the selection; the next area selected gets them (see the worksheet),
   * Escape cancels.
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

  // Pastes data read from the clipboard, as the paste event does
  function pasteData(getData: (mimeType: string) => string): void {
    if (!canEdit) {
      return;
    }
    workbookState.clearCutRange();
    try {
      if (pasteClipboardData(model, getData)) {
        refresh();
      }
    } catch (e) {
      showPasteError(e);
    }
  }

  // The cell context menu's Paste: there is no paste event, so the
  // clipboard is read through the Clipboard API
  async function handlePaste(): Promise<void> {
    focusWorkbook();
    let getData: (mimeType: string) => string;
    try {
      getData = await readClipboard(lastClipboardJson);
    } catch {
      alertDialog = {
        title: t("error_dialog.error_paste"),
        message: t("error_dialog.error_clipboard_paste"),
      };
      return;
    }
    pasteData(getData);
  }

  // A toolbar change: re-read the model and give the focus back to the
  // sheet, as upstream's re-render does
  function afterToolbarChange(): void {
    refresh();
    restoreFocus();
  }

  function setRangeStyle(stylePath: string, value: string): void {
    updateRangeStyle(model, stylePath, value);
    afterToolbarChange();
  }

  function onMergeCells(operation: MergeCellsOperation): void {
    try {
      mergeSelectedCells(model, operation);
    } catch (e) {
      if (`${e}`.includes("more than one cell has content")) {
        alertDialog = {
          title: t("error_dialog.error_merging_cells"),
          message: t("error_dialog.error_merging_cells_content"),
        };
      }
      // other failures (e.g. merging over an array formula) stay silent
    }
    afterToolbarChange();
  }

  // Creates a new canvas element in the visible part of the selected area
  // and downloads it as ironcalc.png
  function downloadPNG(): void {
    const worksheetCanvas = worksheet?.getCanvas();
    if (!worksheetCanvas) {
      return;
    }
    const {
      range: [rowStart, columnStart, rowEnd, columnEnd],
    } = model.getSelectedView();
    // NB: cells outside of the displayed area are not rendered
    // I think the only reasonable way to do this would be server side.
    let [x, y] = worksheetCanvas.getCoordinatesByCell(rowStart, columnStart);
    const [x1, y1] = worksheetCanvas.getCoordinatesByCell(rowEnd + 1, columnEnd + 1);
    const width = (x1 - x) * devicePixelRatio;
    const height = (y1 - y) * devicePixelRatio;
    x *= devicePixelRatio;
    y *= devicePixelRatio;

    const capturedCanvas = document.createElement("canvas");
    capturedCanvas.width = width;
    capturedCanvas.height = height;
    const ctx = capturedCanvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.drawImage(worksheetCanvas.canvas, x, y, width, height, 0, 0, width, height);

    const downloadLink = document.createElement("a");
    downloadLink.href = capturedCanvas.toDataURL("image/png");
    downloadLink.download = "ironcalc.png";
    downloadLink.click();
    restoreFocus();
  }

  function openLinkDialog(sheet: number, row: number, column: number): void {
    linkDialogCell = { sheet, row, column };
  }

  // A rejected sheet change (e.g. a name already taken) shows the engine's
  // error, which upstream puts in a window.alert
  function trySheetChange(change: () => void): void {
    try {
      change();
    } catch (e) {
      alertDialog = { title: `${e}`.replace(/^Error: /, ""), message: "" };
    }
    refresh();
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
  {#if canEdit}
    <Toolbar
      canUndo={view.canUndo}
      canRedo={view.canRedo}
      onRedo={() => {
        redo();
        restoreFocus();
      }}
      onUndo={() => {
        undo();
        restoreFocus();
      }}
      onToggleUnderline={(value) => setRangeStyle("font.u", `${value}`)}
      onToggleBold={(value) => setRangeStyle("font.b", `${value}`)}
      onToggleItalic={(value) => setRangeStyle("font.i", `${value}`)}
      onToggleStrike={(value) => setRangeStyle("font.strike", `${value}`)}
      onToggleHorizontalAlign={(value) => setRangeStyle("alignment.horizontal", value)}
      onToggleVerticalAlign={(value) => setRangeStyle("alignment.vertical", value)}
      onToggleWrapText={(value) => setRangeStyle("alignment.wrap_text", `${value}`)}
      onCopyStyles={() => {
        copyStyles();
        restoreFocus();
      }}
      onTextColorPicked={(color) => setRangeStyle("font.color", colorToParam(color))}
      onFillColorPicked={(color) => setRangeStyle("fill.color", colorToParam(color))}
      onNumberFormatPicked={(numberFmt) => setRangeStyle("num_fmt", numberFmt)}
      onClearFormatting={() => {
        clearSelectedFormatting(model);
        afterToolbarChange();
      }}
      onIncreaseFontSize={(delta) => setRangeStyle("font.size_delta", `${delta}`)}
      onSetFontSize={(size, keepFocus) => {
        updateRangeStyle(model, "font.size", `${size}`);
        refresh();
        if (!keepFocus) {
          restoreFocus();
        }
      }}
      onDownloadPNG={downloadPNG}
      onBorderChanged={(border: BorderOptions) => {
        setSelectedAreaBorder(model, border);
        refresh();
      }}
      fillColor={view.style.fill.color}
      fontColor={view.style.font.color}
      fontSize={view.style.font.sz}
      bold={view.style.font.b}
      underline={view.style.font.u}
      italic={view.style.font.i}
      strike={view.style.font.strike}
      horizontalAlign={view.style.alignment ? view.style.alignment.horizontal : "general"}
      verticalAlign={view.style.alignment?.vertical ? view.style.alignment.vertical : "bottom"}
      wrapText={view.style.alignment?.wrap_text || false}
      mergeCellsState={view.mergeCellsState}
      {onMergeCells}
      canEdit={true}
      numFmt={view.style.num_fmt}
      showGridLines={view.showGridLines}
      onToggleShowGridLines={(show) => {
        model.setShowGridLines(model.getSelectedSheet(), show);
        afterToolbarChange();
      }}
      formatOptions={view.fmtSettings}
      isConditionalFormattingOpen={false}
      isNamedStylesOpen={false}
      onOpenLinkDialog={() => {
        const { sheet, row, column } = model.getSelectedView();
        openLinkDialog(sheet, row, column);
      }}
      {themes}
      currentTheme={view.currentTheme}
      onThemePicked={(theme) => {
        model.setTheme(theme);
        afterToolbarChange();
      }}
      onPopupClosed={restoreFocus}
    />
  {/if}
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
      bind:this={worksheet}
      {model}
      {workbookState}
      {version}
      {refresh}
      canEdit={canEdit && view.canEditFormula}
      {onEditEnd}
      onCut={() => {
        focusWorkbook();
        document.execCommand("cut");
      }}
      onCopy={() => {
        focusWorkbook();
        document.execCommand("copy");
      }}
      onPaste={handlePaste}
      onEditLink={canEdit
        ? (row, column) => openLinkDialog(model.getSelectedSheet(), row, column)
        : undefined}
      onDeleteLink={canEdit
        ? (row, column) => {
            model.deleteCellLink(model.getSelectedSheet(), row, column);
            refresh();
          }
        : undefined}
      {restoreFocus}
    />
    <SheetTabBar
      {canEdit}
      {model}
      {version}
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
      onAddBlankSheet={() => {
        model.newSheet();
        refresh();
      }}
      onSheetColorChanged={(color: Color) => {
        trySheetChange(() => model.setSheetColor(model.getSelectedSheet(), color));
      }}
      onSheetRenamed={(name: string) => {
        trySheetChange(() => model.renameSheet(model.getSelectedSheet(), name));
      }}
      onSheetDeleted={() => {
        trySheetChange(() => model.deleteSheet(model.getSelectedSheet()));
      }}
      onSheetDuplicated={() => {
        trySheetChange(() => model.duplicateSheet(model.getSelectedSheet()));
      }}
      onHideSheet={() => {
        trySheetChange(() => model.hideSheet(model.getSelectedSheet()));
      }}
      onMoveSheet={(fromIndex: number, toIndex: number) => {
        trySheetChange(() => model.moveSheet(fromIndex, toIndex));
      }}
      {restoreFocus}
    />
  </div>
  <Alert
    open={alertDialog !== null}
    onClose={() => (alertDialog = null)}
    title={alertDialog?.title ?? ""}
    message={alertDialog?.message ?? ""}
  />
  {#if linkDialogCell}
    {@const cell = linkDialogCell}
    {@const sheetNames = view.sheets.map((sheet) => sheet.name)}
    <LinkDialog
      open
      onClose={() => {
        linkDialogCell = null;
        restoreFocus();
      }}
      {sheetNames}
      selectedSheetName={sheetNames[cell.sheet] ?? sheetNames[0] ?? ""}
      initialLink={model.getCellLink(cell.sheet, cell.row, cell.column) ?? null}
      initialLabel={model.getFormattedCellValue(cell.sheet, cell.row, cell.column)}
      onSave={(link: Link, label: string) => {
        saveCellLink(model, cell, link, label);
        refresh();
      }}
      onDelete={() => {
        model.deleteCellLink(cell.sheet, cell.row, cell.column);
        refresh();
      }}
    />
  {/if}
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
     reserved for it (worksheet area and right drawer offset by it). */
  .ic-workbook-container--readonly {
    --toolbar-height: 0px;
  }
</style>
