<!--
  Port of upstream webapp/IronCalc/src/components/Button/Button.tsx: a text
  button with optional start and end icons. The variants (primary,
  secondary, outline, ghost, destructive) and sizes (xs, sm, md) map to
  Skeleton's `btn` classes and presets.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { ButtonSize, ButtonVariant } from "./buttonClasses";

  export type { ButtonSize, ButtonVariant };

  /** Extends native `<button>` props. Defaults: `variant` "primary", `size` "md", `pressed` false, `type` "button". */
  export interface ButtonProperties extends HTMLButtonAttributes {
    variant?: ButtonVariant;
    size?: ButtonSize;
    pressed?: boolean;
    startIcon?: Snippet;
    endIcon?: Snippet;
    /** The button element, bindable. */
    ref?: HTMLButtonElement | null;
  }
</script>

<script lang="ts">
  import { buttonClasses } from "./buttonClasses";

  let {
    variant = "primary",
    size = "md",
    pressed = false,
    disabled = false,
    startIcon,
    endIcon,
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: ButtonProperties = $props();
</script>

<button
  bind:this={ref}
  type="button"
  {disabled}
  aria-pressed={pressed}
  class={[buttonClasses(variant, size), className]}
  {...rest}
>
  {#if startIcon}<span class="ic-button__icon">{@render startIcon()}</span>{/if}
  {@render children?.()}
  {#if endIcon}<span class="ic-button__icon">{@render endIcon()}</span>{/if}
</button>

<style>
  .ic-button__icon {
    display: flex;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }

  .ic-button__icon :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
