<!--
  Port of upstream webapp/IronCalc/src/components/FormulaBar/FormulaBar.tsx:
  the address box and the formula editor of the selected cell. The
  named-ranges menu behind the address box comes with the right drawer (see
  docs/parity.md).
-->
<script lang="ts">
  import type { Model } from "@ironcalc/wasm";
  import { getEditorSize } from "../../upstream/components/util";
  import type { WorkbookState } from "../../upstream/components/workbookState";
  import Editor from "../Editor/Editor.svelte";
  import Fx from "../icons/Fx.svelte";

  interface Props {
    cellAddress: string;
    formulaValue: string;
    model: Model;
    workbookState: WorkbookState;
    /** Called when an edit started here ends. */
    onChange: () => void;
    onTextUpdated: () => void;
    canEdit: boolean;
    /** Bumped by the workbook whenever the model or the runtime state changed. */
    version: number;
  }

  let {
    cellAddress,
    formulaValue,
    model,
    workbookState,
    onChange,
    onTextUpdated,
    canEdit,
    version,
  }: Props = $props();
</script>

<div class="ic-formula-bar-root">
  <div class="ic-formula-bar-address" data-testid="ic-formula-bar-address">
    {cellAddress}
  </div>
  <div class="ic-formula-bar-divider"></div>
  <div class="ic-formula-bar-formula-container">
    <div class="ic-formula-bar-button"><Fx /></div>
    <!-- Start editing on pointerdown, not click: clicking *in the middle* of
         existing text does not emit a `click` event (only clicking past the
         end does). Also no preventDefault(): on pointerdown that would cancel
         the textarea's focus and caret placement. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="ic-formula-bar-editor-wrapper"
      data-testid="ic-formula-bar-value"
      onpointerdown={(event) => {
        if (!canEdit) {
          return;
        }
        const [sheet, row, column] = model.getSelectedCell();
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
          text: formulaValue,
          referencedRange: null,
          cursorStart: formulaValue.length,
          cursorEnd: formulaValue.length,
          focus: "formula-bar",
          activeRanges: [],
          mode: "edit",
          editorWidth,
          editorHeight,
        });
        event.stopPropagation();
      }}
    >
      <Editor
        originalText={formulaValue}
        {model}
        {workbookState}
        onEditEnd={onChange}
        {onTextUpdated}
        type="formula-bar"
        {canEdit}
        {version}
      />
    </div>
  </div>
</div>

<style>
  .ic-formula-bar-root {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: var(--formula-bar-height);
    flex-shrink: 0;
    background: var(--palette-common-white);
    border-top: 1px solid var(--palette-grey-300);
  }

  .ic-formula-bar-button {
    display: inline-flex;
    align-items: center;
    width: 15px;
    min-width: 0;
    padding: 0;
    color: inherit;
    font-weight: inherit;
    margin-right: 8px;
  }

  .ic-formula-bar-button :global(svg) {
    width: 15px;
    height: 15px;
  }

  .ic-formula-bar-divider {
    background-color: var(--palette-grey-300);
    min-width: 1px;
    height: 16px;
    margin: 0px 16px 0px 8px;
  }

  .ic-formula-bar-formula-container {
    display: flex;
    width: 100%;
    min-width: 0;
    height: 22px;
    line-height: 22px;
    font-weight: normal;
    margin-left: 0;
  }

  /* Upstream renders the address as a small ghost button (it opens the
     named-ranges menu); until that menu is ported it is a plain label. */
  .ic-formula-bar-address {
    display: flex;
    align-items: center;
    min-width: 40px;
    height: 28px;
    padding: 0 8px;
    margin-left: 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    font-style: normal;
    color: var(--palette-common-black);
    white-space: nowrap;
  }

  .ic-formula-bar-editor-wrapper {
    position: relative;
    width: 100%;
    padding: 0;
    border-width: 0;
    outline: none;
    resize: none;
    overflow: hidden;
    white-space: pre-wrap;
    vertical-align: bottom;
    text-align: left;
    font-family: monospace;
  }

  .ic-formula-bar-editor-wrapper :global(span) {
    min-width: 1px;
  }
</style>
