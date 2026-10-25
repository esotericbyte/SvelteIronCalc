<!--
  The color swatch button the drawer's editors put next to their fields to
  open a color picker: upstream's `ic-input-control md` wrapper around an
  `ic-edit-theme-color-swatch` (or `ic-edit-style-swatch`,
  `ic-cs-color-swatch`) button, which every editor styles the same way.
-->
<script lang="ts">
  interface Props {
    /** The CSS color shown. */
    color: string;
    "aria-label": string;
    onclick?: () => void;
    /** Dimmed and inert, as the rating rows after the first. */
    disabled?: boolean;
    /** The button, bindable (a color picker's anchor). */
    ref?: HTMLButtonElement | null;
  }

  let {
    color,
    "aria-label": ariaLabel,
    onclick,
    disabled = false,
    ref = $bindable(null),
  }: Props = $props();
</script>

<div class={["ic-swatch-wrapper input", disabled && "ic-swatch-wrapper--disabled"]}>
  <button
    bind:this={ref}
    type="button"
    class="ic-swatch"
    style:background-color={color}
    aria-label={ariaLabel}
    {onclick}
  ></button>
</div>

<style>
  .ic-swatch-wrapper {
    flex: none;
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    padding: 2px;
    display: flex;
  }

  .ic-swatch {
    width: 100%;
    height: 100%;
    border-radius: 3px;
    border: 1px solid
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
    cursor: pointer;
  }

  .ic-swatch-wrapper--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ic-swatch-wrapper--disabled > * {
    pointer-events: none;
  }
</style>
