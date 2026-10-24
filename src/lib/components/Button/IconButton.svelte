<!--
  Port of upstream webapp/IronCalc/src/components/Button/IconButton.tsx: an
  icon-only button with the same variants and sizes as Button, as a
  Skeleton `btn-icon`. Defaults: `variant` "ghost", `size` "sm".
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { ButtonSize, ButtonVariant } from "./buttonClasses";

  export type { ButtonSize, ButtonVariant };

  export interface IconButtonProperties
    extends Omit<HTMLButtonAttributes, "aria-label" | "children"> {
    icon: Snippet;
    "aria-label": string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    pressed?: boolean;
    /** The button element, bindable. */
    ref?: HTMLButtonElement | null;
  }
</script>

<script lang="ts">
  import { iconButtonClasses } from "./buttonClasses";

  let {
    icon,
    variant = "ghost",
    size = "sm",
    pressed = false,
    disabled = false,
    class: className,
    ref = $bindable(null),
    ...rest
  }: IconButtonProperties = $props();
</script>

<button
  bind:this={ref}
  type="button"
  {disabled}
  aria-pressed={pressed}
  class={[iconButtonClasses(variant, size), className]}
  {...rest}
>
  <span class="ic-button__icon">{@render icon()}</span>
</button>

<style>
  .ic-button__icon {
    display: flex;
    width: 16px;
    height: 16px;
    align-items: center;
    justify-content: center;
  }

  .ic-button__icon :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
