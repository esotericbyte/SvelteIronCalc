<!--
  Port of upstream webapp/IronCalc/src/components/BorderPicker/LineStylePicker.tsx:
  the border picker's submenu of line styles, each shown as a preview line.
-->
<script lang="ts" module>
  import { BorderStyle } from "@ironcalc/wasm";

  export const STYLE_OPTIONS = [
    { value: BorderStyle.Thin, previewClassName: "thin" },
    { value: BorderStyle.Medium, previewClassName: "medium" },
    { value: BorderStyle.Thick, previewClassName: "thick" },
    { value: BorderStyle.Double, previewClassName: "double" },
    { value: BorderStyle.Dotted, previewClassName: "dotted" },
    { value: BorderStyle.MediumDashed, previewClassName: "medium-dashed" },
    { value: BorderStyle.SlantDashDot, previewClassName: "slant-dash-dot" },
    { value: BorderStyle.MediumDashDot, previewClassName: "medium-dash-dot" },
    {
      value: BorderStyle.MediumDashDotDot,
      previewClassName: "medium-dash-dot-dot",
    },
  ] as const;
</script>

<script lang="ts">
  interface Props {
    value: BorderStyle;
    onSelect: (style: BorderStyle) => void;
  }

  let { value, onSelect }: Props = $props();
</script>

<div class="ic-line-style-picker">
  {#each STYLE_OPTIONS as option (option.value)}
    <button
      type="button"
      class={["ic-border-picker__button", value === option.value && "selected"]}
      aria-label={option.value}
      aria-pressed={value === option.value}
      onclick={() => onSelect(option.value)}
    >
      <span class={["ic-line-preview", option.previewClassName]}></span>
    </button>
  {/each}
</div>

<style>
  /* Port of upstream BorderPicker/line-style-picker.css; the buttons share
     the border picker's styles. The line previews are global: the cell
     style editor of the right drawer shows them too, as upstream */
  .ic-line-style-picker {
    position: absolute;
    top: 0;
    left: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-width: 92px;
    padding: 4px;
    background: var(--palette-surface-elevated);
    border: 1px solid var(--palette-surface-elevated-border);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
  }

  :global(.ic-line-preview) {
    display: block;
    width: 68px;
    color: var(--palette-grey-900);
  }

  :global(.ic-line-preview.thin) {
    border-top: 1px solid currentColor;
  }

  :global(.ic-line-preview.medium) {
    border-top: 2px solid currentColor;
  }

  :global(.ic-line-preview.thick) {
    border-top: 3px solid currentColor;
  }

  :global(.ic-line-preview.double) {
    height: 3px;
    background: linear-gradient(
      to bottom,
      currentColor 0,
      currentColor 1px,
      transparent 1px,
      transparent 2px,
      currentColor 2px,
      currentColor 3px
    );
  }

  :global(.ic-line-preview.dotted) {
    border-top: 1px dotted currentColor;
  }

  :global(.ic-line-preview.medium-dashed) {
    border-top: 2px dashed currentColor;
  }

  :global(.ic-line-preview.slant-dash-dot) {
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      currentColor 0 4px,
      transparent 4px 6px,
      currentColor 6px 7px,
      transparent 7px 9px
    );
  }

  :global(.ic-line-preview.medium-dash-dot) {
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      currentColor 0 4px,
      transparent 4px 6px,
      currentColor 6px 7px,
      transparent 7px 9px
    );
  }

  :global(.ic-line-preview.medium-dash-dot-dot) {
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      currentColor 0 4px,
      transparent 4px 6px,
      currentColor 6px 7px,
      transparent 7px 9px,
      currentColor 9px 10px,
      transparent 10px 12px
    );
  }
</style>
