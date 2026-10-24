<!--
  Port of upstream webapp/IronCalc/src/components/Editor/Editor.tsx and
  editor.css: the cell editor, also used as the formula bar editor.

  From upstream: there is a hidden textarea and only its caret is shown. What
  is seen is a div with the same text content, in HTML, so references can be
  colored. Some keystrokes behave differently than in a raw textarea; those
  are captured on keydown (editorKeyDown.ts). As the content changes, the
  workbook is told so the sheet can outline the referenced ranges and the
  formula bar can follow.

  You either edit a formula or content. Editing content: starting by typing
  puts the editor in *accept* mode (arrow keys commit and move); starting with
  F2 or a double click puts it in *cruise* ("edit") mode (arrow keys move the
  caret). Clicking in the text switches to edit mode. Editing a formula, an
  arrow key or a click on a cell inserts a reference wherever the grammar
  accepts one.

  The runtime state lives in the carried WorkbookState, which Svelte cannot
  see change; `version` is bumped by the workbook after every change and makes
  this component re-read it, as a React re-render does upstream.
-->
<script lang="ts">
  import type { Model } from "@ironcalc/wasm";
  import { Portal } from "@skeletonlabs/skeleton-svelte";
  import { untrack } from "svelte";
  import { t } from "../../i18n";
  import {
    applyListCompletion,
    getCompletion,
  } from "../../upstream/components/FormulaHelper/formulaCompletion";
  import type { WorkbookState } from "../../upstream/components/workbookState";
  import FormulaHelper from "../FormulaHelper/FormulaHelper.svelte";
  import Alert from "../Modal/Alert.svelte";
  import { anchoredTo } from "../utils/menuPosition";
  import { createEditorKeyDownHandler } from "./editorKeyDown";
  import getFormulaHTML from "./formulaHTML";

  interface Props {
    originalText: string;
    onEditEnd: () => void;
    onTextUpdated: () => void;
    model: Model;
    workbookState: WorkbookState;
    type: "cell" | "formula-bar";
    canEdit: boolean;
    /** Bumped by the workbook whenever the model or the runtime state changed. */
    version: number;
  }

  let {
    originalText,
    onEditEnd,
    onTextUpdated,
    model,
    workbookState,
    type,
    canEdit,
    version,
  }: Props = $props();

  // The initial values only; the effect below follows `originalText`
  let text = $state(untrack(() => originalText));
  let cursor = $state(untrack(() => originalText.length));
  let formulaError: string | null = $state(null);
  // Formula helper popup state: the highlighted row in list mode and whether
  // the user dismissed it with Escape. The popup itself is portalled into the
  // widget root, to escape `overflow: hidden`.
  let helperSelected = $state(0);
  let helperDismissed = $state(false);

  let formulaElement = $state<HTMLDivElement | null>(null);
  let maskElement = $state<HTMLDivElement | null>(null);
  let textareaElement = $state<HTMLTextAreaElement | null>(null);

  $effect(() => {
    const value = originalText;
    untrack(() => {
      text = value;
      const textarea = textareaElement;
      // Only rewrite the textarea (and snap the caret to the end) when the
      // value changed from the OUTSIDE — a different cell selected, or a new
      // edit session. While the user types, `originalText` is derived from
      // the same text being edited and flows back in unchanged, so the DOM
      // value already matches; rewriting here would yank the caret to the
      // end on every keystroke (and break clicking in the middle).
      if (textarea && textarea.value !== value) {
        textarea.value = value;
        // If the value changed because a reference is being inserted at the
        // cursor (clicking/dragging cells in the grid), keep the caret right
        // after the inserted reference. Snapping to the end is only correct
        // when the reference sits at the end of the formula.
        const cell = workbookState.getEditingCell();
        const referencedStr = cell?.referencedRange?.str;
        if (cell && referencedStr) {
          const caret = cell.cursorStart + referencedStr.length;
          textarea.setSelectionRange(caret, caret);
          cursor = caret;
        } else {
          cursor = value.length;
        }
      }
    });
  });

  const onKeyDown = createEditorKeyDownHandler({
    model: untrack(() => model),
    onEditEnd: () => onEditEnd(),
    onTextUpdated: () => onTextUpdated(),
    workbookState: untrack(() => workbookState),
    textarea: () => textareaElement,
  });

  /**
   * Grows the editing cell's editor box to fit the text, as upstream does
   * after every render. The worksheet also calls it right before positioning
   * the editor, so the box is measured on the current text.
   */
  export function syncSize(): void {
    const cell = workbookState.getEditingCell();
    if (!cell || !formulaElement) {
      return;
    }
    const { editorWidth, editorHeight } = cell;
    const scrollWidth = formulaElement.scrollWidth;
    if (scrollWidth > editorWidth - 5) {
      cell.editorWidth = scrollWidth + 10;
    }
    const scrollHeight = formulaElement.scrollHeight;
    if (scrollHeight > editorHeight) {
      cell.editorHeight = scrollHeight;
    }
  }

  $effect(() => {
    void version;
    void text;
    void cursor;
    void originalText;
    untrack(() => {
      syncSize();
      const cell = workbookState.getEditingCell();
      if (cell && type === cell.focus) {
        textareaElement?.focus({ preventScroll: true });
      }
    });
  });

  function onChange(): void {
    const textarea = textareaElement;
    const cell = workbookState.getEditingCell();
    if (!textarea || !cell) {
      return;
    }
    const value = textarea.value;
    cell.text = value;
    cell.referencedRange = null;
    cell.cursorStart = textarea.selectionStart;
    cell.cursorEnd = textarea.selectionEnd;
    const styledFormula = getFormulaHTML(model, value);
    if (value === "" && type === "cell") {
      // When we delete the content of a cell we jump to accept mode
      cell.mode = "accept";
    }
    workbookState.setEditingCell(cell);

    workbookState.setActiveRanges(styledFormula.activeRanges);
    text = cell.text;
    cursor = textarea.selectionStart;

    onTextUpdated();
  }

  function onBlur(): void {
    const cell = workbookState.getEditingCell();
    if (type !== cell?.focus) {
      // If the blur happens because we switch from the cell editor to the
      // formula editor or vice versa, do nothing
      return;
    }
    if (textareaElement) {
      textareaElement.value = "";
    }

    // This happens if the blur hasn't been taken care of before by click or
    // pointerdown events: if we are editing a cell finish that
    if (cell) {
      model.setUserInput(
        cell.sheet,
        cell.row,
        cell.column,
        workbookState.getEditingText(),
      );
      workbookState.clearEditingCell();
    }
    onEditEnd();
  }

  // Tracks caret moves (arrows, clicks) so the helper and the reference hint
  // follow along. Upstream relies on React's onSelect, which fires on caret
  // moves; the DOM `select` event only fires for range selections.
  function trackCaret(): void {
    if (textareaElement) {
      cursor = textareaElement.selectionStart;
    }
  }

  const view = $derived.by(() => {
    void version;
    const cell = workbookState.getEditingCell();
    const showEditor = cell !== null || type === "formula-bar";
    const mtext = cell ? workbookState.getEditingText() : originalText;
    // In read-only mode the formula is rendered as plain grey text
    const segments = canEdit ? getFormulaHTML(model, mtext, cursor).html : null;

    // For now the formula helper is only available in English, so it is
    // hidden for other languages (as upstream does, until localized).
    const helperAvailable =
      model.getLanguage() === "en" && model.getLocale() === "en";

    // The formula helper is shown while editing a formula in whichever
    // editor currently has focus — the cell editor or the formula bar (both
    // render this same component). Gating on `cell.focus === type` keeps a
    // single popup. The completion is computed here so the keyboard handler
    // and the popup share one source.
    const helperActive =
      helperAvailable &&
      cell !== null &&
      cell.focus === type &&
      text.startsWith("=") &&
      !helperDismissed;
    const completion = helperActive ? getCompletion(model, text, cursor) : null;
    return {
      showEditor,
      mtext,
      segments,
      completion,
      showHelper: helperAvailable && completion !== null,
    };
  });

  // Reset the highlighted row whenever the formula or caret changes (typing,
  // clicking); arrow-key navigation is preventDefaulted so it does not land
  // here. Editing the text also clears a previous Escape dismissal.
  $effect(() => {
    void text;
    void cursor;
    helperSelected = 0;
  });
  $effect(() => {
    void text;
    helperDismissed = false;
  });

  // Like upstream's createAnchoredPortal: the nearest `.ic-root`, or nothing
  const portalTarget = $derived(
    textareaElement?.closest<HTMLElement>(".ic-root") ?? null,
  );

  // Replaces the partial function name with `NAME(` and places the caret
  // inside. Takes an explicit index so a row click can accept the row it
  // lands on directly.
  function acceptHelperFunction(index: number = helperSelected): void {
    const textarea = textareaElement;
    const completion = view.completion;
    if (!textarea || completion?.kind !== "list") {
      return;
    }
    const result = applyListCompletion(
      textarea.value,
      textarea.selectionStart,
      completion,
      index,
    );
    textarea.value = result.text;
    textarea.setSelectionRange(result.cursor, result.cursor);
    onChange();
  }

  // Lets the helper consume navigation keys before the editor's own handler.
  // Returns true when the event was handled.
  function handleHelperKeyDown(event: KeyboardEvent): boolean {
    const completion = view.completion;
    if (!completion) {
      return false;
    }
    if (event.key === "Escape") {
      helperDismissed = true;
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    if (completion.kind !== "list") {
      return false;
    }
    if (event.key === "ArrowDown") {
      helperSelected = Math.min(
        helperSelected + 1,
        completion.matches.length - 1,
      );
    } else if (event.key === "ArrowUp") {
      helperSelected = Math.max(helperSelected - 1, 0);
    } else if (event.key === "Enter" || event.key === "Tab") {
      acceptHelperFunction();
    } else {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  const stop = (event: Event): void => event.stopPropagation();
</script>

<Alert
  open={formulaError !== null}
  onClose={() => (formulaError = null)}
  title={t("error_dialog.error_editing_formula")}
  message={formulaError ?? ""}
/>
<div
  class={[
    "ic-editor-container",
    !view.showEditor && "ic-editor-container--hidden",
    !canEdit && "ic-editor-container--readonly",
  ]}
>
  <div class="ic-editor-common ic-editor-mask" bind:this={maskElement}>
    <div class="ic-editor-formula" bind:this={formulaElement}>{#if view.segments}{#each view.segments as segment, index (index)}{#if segment.kind === "hint"}<span class="ic-insert-range-hint">{"  "}</span>{:else}<span style:color={segment.color}>{segment.text}</span>{/if}{/each}{:else}{view.mtext}{/if}</div>
  </div>
  <textarea
    bind:this={textareaElement}
    class="ic-editor-common ic-editor-textarea"
    rows="1"
    spellcheck="false"
    disabled={!canEdit}
    onkeydown={(event) => {
      if (handleHelperKeyDown(event)) {
        return;
      }
      try {
        onKeyDown(event);
      } catch (error) {
        // quit editing without modifying the cell
        const cell = workbookState.getEditingCell();
        if (cell) {
          model.setSelectedSheet(cell.sheet);
        }
        workbookState.clearEditingCell();
        onEditEnd();
        formulaError = String(error);
      }
    }}
    oninput={onChange}
    onblur={onBlur}
    onpointerdown={(event) => {
      if (!canEdit) {
        return;
      }
      // We are either clicking in the same cell we are editing, in which
      // case we just change the mode to edit, or we click in a different
      // editor, in which case we switch the focus
      const cell = workbookState.getEditingCell();
      if (cell) {
        // We make sure the mode is edit
        cell.mode = "edit";
        cell.focus = type;
        workbookState.setEditingCell(cell);
        event.stopPropagation();
      }
    }}
    onscroll={() => {
      if (maskElement && textareaElement) {
        maskElement.style.left = `-${textareaElement.scrollLeft}px`;
        maskElement.style.top = `-${textareaElement.scrollTop}px`;
      }
    }}
    onselect={trackCaret}
    onkeyup={trackCaret}
    onmouseup={trackCaret}
    onpaste={stop}
    oncopy={stop}
    ondblclick={stop}
    oncut={stop}
  ></textarea>
</div>
{#if view.showHelper && portalTarget}
  <Portal target={portalTarget}>
    <div
      class="ic-editor-formula-helper"
      {@attach anchoredTo(() => textareaElement)}
    >
      <FormulaHelper
        completion={view.completion}
        selected={helperSelected}
        onSelect={(index) => (helperSelected = index)}
        onAccept={acceptHelperFunction}
      />
    </div>
  </Portal>
{/if}

<style>
  .ic-editor-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--palette-common-white);
    color: var(--palette-sheet-default-text-color);
    font-family: var(--palette-sheet-default-cell-font-family);
    font-size: var(--typography-font-size);
  }

  .ic-editor-container--hidden {
    display: none;
  }

  .ic-editor-container--readonly {
    color: var(--palette-grey-600);
  }

  /* upstream's commonCSS */
  .ic-editor-common {
    font-weight: inherit;
    font-family: inherit;
    font-size: inherit;
    position: absolute;
    left: 0;
    top: 0;
    white-space: pre;
    width: 100%;
    padding: 0;
    line-height: 22px;
  }

  .ic-editor-mask {
    text-align: left;
    pointer-events: none;
    height: 100%;
  }

  .ic-editor-formula {
    display: inline-block;
  }

  .ic-editor-textarea {
    color: transparent;
    background-color: transparent;
    caret-color: var(--palette-primary-main);
    outline: none;
    resize: none;
    border: none;
    height: 100%;
    overflow: hidden;
    align-content: baseline;
  }

  .ic-editor-formula-helper {
    position: fixed;
    z-index: 1100;
  }

  .ic-insert-range-hint {
    margin: 0 2px;
    white-space: normal;
    position: relative;
  }

  .ic-insert-range-hint::after {
    content: "";
    position: absolute;
    bottom: 0px;
    left: 0px;
    border: 1px solid;
    height: 2px;
    width: 6px;
    border-top: 0;
    color: var(--palette-info-main);
  }
</style>
