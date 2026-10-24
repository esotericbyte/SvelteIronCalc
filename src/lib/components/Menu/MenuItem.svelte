<!--
  Port of upstream webapp/IronCalc/src/components/Menu/MenuItem.tsx (the
  plain item): a Skeleton Menu.Item with an icon slot, a label, optional
  secondary text and, when `checked` is given, a check mark as a radio item.
  Selecting it (click or Enter) runs `onClick` and closes the menu.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  export interface MenuItemProperties {
    onClick?: () => void;
    disabled?: boolean;
    destructive?: boolean;
    icon?: Snippet;
    secondaryText?: Snippet | string;
    checked?: boolean;
    children: Snippet;
  }
</script>

<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import { Menu } from "@skeletonlabs/skeleton-svelte";
  import { getMenuHandlers } from "./menuContext";

  let {
    onClick,
    disabled = false,
    destructive = false,
    icon,
    secondaryText,
    checked,
    children,
  }: MenuItemProperties = $props();

  const value = $props.id();
  const isRadio = $derived(checked !== undefined);

  const handlers = getMenuHandlers();
  $effect(() => handlers?.register(value, () => onClick));
</script>

<Menu.Item
  {value}
  {disabled}
  role={isRadio ? "menuitemradio" : "menuitem"}
  aria-checked={isRadio ? checked : undefined}
  class={["ic-menu-item", destructive && "destructive", disabled && "disabled"]}
>
  {#if isRadio}
    <span
      class="ic-menu-item-icon"
      aria-hidden="true"
      style:visibility={checked ? "visible" : "hidden"}
    >
      <Check />
    </span>
  {/if}
  {#if icon}
    <span class="ic-menu-item-icon" aria-hidden="true">{@render icon()}</span>
  {/if}
  <span class="ic-menu-item-label">{@render children()}</span>
  {#if secondaryText}
    <span class="ic-menu-item-secondary">
      {#if typeof secondaryText === "string"}{secondaryText}{:else}{@render secondaryText()}{/if}
    </span>
  {/if}
</Menu.Item>

<style>
  /* Port of upstream Menu/menu.css (items) */
  :global(.ic-menu-item) {
    display: flex;
    width: 100%;
    min-height: 32px;
    box-sizing: border-box;
    align-items: center;
    font-size: var(--typography-font-size);
    gap: 8px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    padding: 8px;
    color: var(--palette-common-black);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
    white-space: nowrap;
    user-select: none;
  }

  :global(.ic-menu-item[data-highlighted]:not([data-disabled])) {
    background: var(--palette-grey-200);
  }

  :global(.ic-menu-item[data-disabled]) {
    color: var(--palette-grey-400);
    cursor: not-allowed;
  }

  :global(.ic-menu-item.destructive) {
    color: var(--palette-error-main);
  }

  :global(.ic-menu-item.destructive[data-highlighted]:not([data-disabled])) {
    background: color-mix(in srgb, var(--palette-error-main) 8%, transparent);
  }

  :global(.ic-menu-item.destructive[data-disabled]) {
    color: var(--palette-grey-400);
  }

  :global(.ic-menu-item-icon) {
    display: inline-flex;
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    align-items: center;
    justify-content: center;
    color: currentColor;
  }

  :global(.ic-menu-item-icon svg) {
    width: 16px;
    height: 16px;
  }

  :global(.ic-menu-item-label) {
    display: inline-flex;
    flex: 1;
    min-width: 0;
    align-items: baseline;
  }

  :global(.ic-menu-item-secondary) {
    display: inline-flex;
    align-items: baseline;
    color: var(--palette-grey-400);
    white-space: nowrap;
  }

  :global(.ic-menu-item.destructive .ic-menu-item-secondary) {
    color: var(--palette-error-light);
  }
</style>
