<!--
  Port of upstream webapp/IronCalc/src/components/Switch/Switch.tsx on
  Skeleton's Switch: a switch with an optional label on its left. The
  hidden checkbox keeps upstream's `role="switch"`. `onChange` receives the
  new checked value, not the event.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  /** Defaults: `disabled` false. Optional: `label`. */
  export interface SwitchProperties {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: Snippet | string;
    disabled?: boolean;
    name?: string;
    class?: string;
    style?: string;
    "aria-label"?: string;
  }
</script>

<script lang="ts">
  import { Switch } from "@skeletonlabs/skeleton-svelte";

  let {
    checked,
    onChange,
    label,
    disabled = false,
    name,
    class: className,
    style,
    "aria-label": ariaLabel,
  }: SwitchProperties = $props();
</script>

<Switch
  {checked}
  {disabled}
  {name}
  onCheckedChange={(details) => onChange(details.checked)}
  class={["ic-switch", disabled && "disabled", className]}
  {style}
>
  {#if label}
    <Switch.Label class="ic-switch-label">
      {#if typeof label === "string"}{label}{:else}{@render label()}{/if}
    </Switch.Label>
  {/if}
  <Switch.Control class="ic-switch-track">
    <Switch.Thumb class="ic-switch-thumb" />
  </Switch.Control>
  <Switch.HiddenInput role="switch" aria-checked={checked} aria-label={ariaLabel} />
</Switch>

<style>
  /* Port of upstream Switch/switch.css: the label's weight and its dimming
     while off; the track and thumb are Skeleton's */
  :global(.ic-switch) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-common-black);
  }

  :global(.ic-switch.disabled) {
    cursor: default;
    opacity: 0.5;
  }

  :global(.ic-switch-label) {
    font-weight: 500;
    transition: opacity 150ms ease;
  }

  :global(.ic-switch:not([data-state="checked"]) .ic-switch-label) {
    opacity: 0.5;
  }
</style>
