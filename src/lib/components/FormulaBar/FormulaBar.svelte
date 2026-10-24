<!--
  Port of upstream webapp/IronCalc/src/components/FormulaBar/FormulaBar.tsx,
  read-only: the address box and the formula (or value) of the selected cell.
  The formula editor and the named-ranges menu behind the address box come in
  later phases (see docs/parity.md).
-->
<script lang="ts">
  import Fx from "../icons/Fx.svelte";

  interface Props {
    cellAddress: string;
    formulaValue: string;
  }

  let { cellAddress, formulaValue }: Props = $props();
</script>

<div class="ic-formula-bar-root">
  <div class="ic-formula-bar-address" data-testid="ic-formula-bar-address">
    {cellAddress}
  </div>
  <div class="ic-formula-bar-divider"></div>
  <div class="ic-formula-bar-formula-container">
    <div class="ic-formula-bar-button"><Fx /></div>
    <div
      class="ic-formula-bar-editor-wrapper"
      data-testid="ic-formula-bar-value"
    >
      {formulaValue}
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
    overflow: hidden;
    white-space: pre;
    text-overflow: ellipsis;
    vertical-align: bottom;
    text-align: left;
    font-family: monospace;
    color: var(--palette-common-black);
  }
</style>
