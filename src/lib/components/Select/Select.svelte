<!--
  Port of upstream webapp/IronCalc/src/components/Select/Select.tsx: a
  select with a label, helper text, an error state, sizes (sm, md) and a
  ghost variant. The trigger is a combobox button; its listbox opens below
  (above when there is more room there), at least as wide as the trigger. Arrow keys, Enter and Space open it; in the list
  the arrows, Home and End move, Enter and Space pick, Escape closes, and a
  press outside closes it. Skeleton has no select (its Combobox is a text
  field), so upstream's listbox is ported as it is. Upstream portals the
  list into the `.ic-root`; here it stays inside the select (it is
  `position: fixed` all the same), so it also works inside a Skeleton
  dialog, whose focus trap and outside-press dismissal would otherwise take
  it for the outside. Labels are strings or snippets.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  export type SelectVariant = "default" | "ghost";

  export type SelectSize = "sm" | "md";

  export interface SelectOption {
    value: string;
    label: Snippet | string;
    triggerLabel?: Snippet | string;
  }

  export interface SelectProperties {
    value: string;
    variant?: SelectVariant;
    options: SelectOption[];
    onChange: (value: string) => void;
    id?: string;
    name?: string;
    size?: SelectSize;
    label?: Snippet | string;
    helperText?: Snippet | string;
    error?: boolean;
    required?: boolean;
    disabled?: boolean;
    class?: string;
    hideCheck?: boolean;
  }

  function getMenuPosition(trigger: HTMLElement, menu: HTMLElement) {
    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(menu.offsetWidth, triggerRect.width); // Menu is always at least as wide as the trigger
    const menuHeight = menu.offsetHeight;
    const viewportWidth = window.innerWidth; // Uses window width to determine menu positioning
    const viewportHeight = window.innerHeight;

    const offset = 4; // Distance between trigger and menu
    const margin = 8; // Safety margin when menu os too close to the window's edge

    // Menu will stay below but falls back to above when there's not enough space
    const spaceBelow = viewportHeight - triggerRect.bottom - margin;
    const spaceAbove = triggerRect.top - margin;
    const openBelow =
      spaceBelow >= menuHeight + offset || spaceBelow >= spaceAbove;

    // Menu is left-align by default but right-align when the menu would overflow the right edge
    const leftAligned = triggerRect.left;
    const overflowsRight = leftAligned + menuWidth > viewportWidth - margin;

    let left = overflowsRight ? triggerRect.right - menuWidth : leftAligned;

    let top = openBelow
      ? triggerRect.bottom + offset
      : triggerRect.top - menuHeight - offset;

    if (left + menuWidth > viewportWidth - margin) {
      left = viewportWidth - menuWidth - margin;
    }

    if (left < margin) {
      left = margin;
    }

    if (top + menuHeight > viewportHeight - margin) {
      top = viewportHeight - menuHeight - margin;
    }

    if (top < margin) {
      top = margin;
    }

    return { top, left, minWidth: triggerRect.width };
  }
</script>

<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import { tick } from "svelte";

  let {
    value,
    options,
    onChange,
    id,
    name,
    size = "md",
    variant = "default",
    label,
    helperText,
    error = false,
    required,
    disabled = false,
    class: className,
    hideCheck = false,
  }: SelectProperties = $props();

  const autoId = $props.id();
  const selectId = $derived(id ?? autoId);
  const helperId = $derived(`${selectId}-helper`);
  const labelId = $derived(`${selectId}-label`);
  const valueId = $derived(`${selectId}-value`);
  const listboxId = $derived(`${selectId}-listbox`);

  let rootElement: HTMLDivElement | null = $state(null);
  let trigger: HTMLButtonElement | null = $state(null);
  let menu: HTMLDivElement | null = $state(null);
  const optionElements: (HTMLButtonElement | null)[] = $state([]);

  const selectedIndex = $derived(options.findIndex((option) => option.value === value));
  const selectedOption = $derived(options[selectedIndex]);

  let open = $state(false);
  // svelte-ignore state_referenced_locally
  let activeIndex = $state(Math.max(0, selectedIndex));

  $effect.pre(() => {
    if (!open) {
      activeIndex = Math.max(0, selectedIndex);
    }
  });

  $effect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootElement) {
        return;
      }
      const isInside = rootElement.contains(target) || (menu ? menu.contains(target) : false);
      if (!isInside) {
        open = false;
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  });

  $effect(() => {
    if (open) {
      const element = optionElements[activeIndex];
      tick().then(() => element?.focus());
    }
  });

  function positioned(element: HTMLDivElement) {
    function updateMenuPosition() {
      if (!trigger) {
        return;
      }
      const { top, left, minWidth } = getMenuPosition(trigger, element);
      element.style.top = `${top}px`;
      element.style.left = `${left}px`;
      element.style.minWidth = `${minWidth}px`;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }

  function closeMenu(): void {
    open = false;
    trigger?.focus();
  }

  function toggleMenu(): void {
    if (disabled || options.length === 0) {
      return;
    }
    open = !open;
  }

  function commit(index: number): void {
    const option = options[index];
    if (!option) {
      return;
    }
    onChange(option.value);
    open = false;
    trigger?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent): void {
    // the sheet must not see the keys of the select
    event.stopPropagation();
    if (disabled || options.length === 0 || open) {
      return;
    }
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ": {
        event.preventDefault();
        activeIndex = Math.max(0, selectedIndex);
        open = true;
        break;
      }
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent, index: number): void {
    event.stopPropagation();
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        activeIndex = (index + 1) % options.length;
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        activeIndex = (index - 1 + options.length) % options.length;
        break;
      }
      case "Home": {
        event.preventDefault();
        activeIndex = 0;
        break;
      }
      case "End": {
        event.preventDefault();
        activeIndex = options.length - 1;
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        commit(index);
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeMenu();
        break;
      }
    }
  }
</script>

{#snippet text(content: Snippet | string | undefined)}
  {#if typeof content === "string"}{content}{:else if content}{@render content()}{/if}
{/snippet}

<div bind:this={rootElement} class={["ic-select", className]}>
  {#if label}
    <label id={labelId} for={selectId} data-required={required || undefined}>
      {@render text(label)}
    </label>
  {/if}

  <div
    class={[
      "ic-select-control",
      size,
      variant !== "default" && `variant-${variant}`,
      open && "is-open",
      error && "is-error",
      disabled && "disabled",
    ]}
  >
    {#if name}<input type="hidden" {name} {value} />{/if}

    <button
      bind:this={trigger}
      id={selectId}
      type="button"
      class="ic-select-trigger"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open ? "true" : "false"}
      aria-controls={listboxId}
      aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
      aria-required={required || undefined}
      aria-invalid={error || undefined}
      aria-describedby={helperText ? helperId : undefined}
      {disabled}
      onclick={toggleMenu}
      onkeydown={handleTriggerKeyDown}
    >
      <span id={valueId} class="ic-select-trigger-value">
        {@render text(selectedOption?.triggerLabel ?? selectedOption?.label)}
      </span>
      <span class="ic-select-trigger-icon" aria-hidden="true">
        {#if open}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
      </span>
    </button>

    {#if open}
      <div bind:this={menu} class="ic-dropdown-menu-wrapper" {@attach positioned}>
        <div
          id={listboxId}
          class="ic-dropdown-menu"
          role="listbox"
          aria-labelledby={label ? labelId : valueId}
        >
          {#each options as option, index (option.value)}
            {@const isSelected = option.value === value}
            <button
              bind:this={optionElements[index]}
              type="button"
              role="option"
              aria-selected={isSelected ? "true" : "false"}
              class={[
                "ic-dropdown-menu-option",
                isSelected && "is-selected",
                index === activeIndex && "is-active",
              ]}
              onclick={() => commit(index)}
              onmouseenter={() => (activeIndex = index)}
              onkeydown={(event) => handleOptionKeyDown(event, index)}
            >
              {#if !hideCheck}
                <span class="ic-dropdown-menu-option-check" aria-hidden="true">
                  {#if isSelected}<Check size={16} />{/if}
                </span>
              {/if}
              <span class="ic-dropdown-menu-option-content">{@render text(option.label)}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  {#if helperText}<p id={helperId}>{@render text(helperText)}</p>{/if}
</div>

<style>
  /* Port of upstream Select/select.css */
  .ic-select {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
  }

  .ic-select > label {
    display: block;
    align-self: flex-start;
    font-size: var(--typography-font-size);
    font-weight: 500;
    color: var(--palette-common-black);
  }

  .ic-select > label[data-required="true"]::after {
    content: " *";
    color: var(--palette-error-main);
  }

  .ic-select:has(:global(.ic-select-control.disabled)) > label {
    color: var(--palette-grey-400);
  }

  .ic-select:has(:global(.ic-select-control.disabled)) > label[data-required="true"]::after {
    color: var(--palette-grey-400);
  }

  .ic-select > p {
    margin: 0;
    padding: 0;
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
    line-height: 1.4;
    color: var(--palette-grey-500);
  }

  .ic-select-control.is-error + p {
    color: var(--palette-error-main);
  }

  .ic-select:has(:global(.ic-select-control.disabled)) > p {
    color: var(--palette-grey-400);
  }

  .ic-select-control {
    position: relative;
    width: 100%;
  }

  .ic-select-trigger {
    position: relative;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    align-items: center;
    border: 1px solid var(--palette-input-border);
    border-radius: 6px;
    background: var(--palette-input-background);
    color: var(--palette-common-black);
    font: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
  }

  .ic-select-trigger:hover:not(:disabled) {
    border-color: var(--palette-grey-600);
  }

  .ic-select-trigger-value {
    min-width: 0;
    flex: 1;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ic-select-trigger-icon {
    position: absolute;
    top: 50%;
    right: 10px;
    width: 16px;
    height: 16px;
    transform: translateY(-50%);
    color: var(--palette-grey-600);
    pointer-events: none;
  }

  .ic-select-control.sm .ic-select-trigger {
    height: 28px;
    padding: 0 28px 0 8px;
  }

  .ic-select-control.sm .ic-select-trigger-icon {
    right: 6px;
  }

  .ic-select-control.md .ic-select-trigger {
    height: 32px;
    padding: 0 32px 0 10px;
  }

  .ic-select-trigger:focus-visible,
  .ic-select-control.is-open .ic-select-trigger {
    border-color: var(--palette-primary-main);
  }

  .ic-select-control.is-error .ic-select-trigger {
    border-color: var(--palette-error-main);
  }

  .ic-select-control.disabled .ic-select-trigger,
  .ic-select-trigger:disabled {
    border-color: var(--palette-input-border);
    background: var(--palette-grey-200);
    color: var(--palette-grey-400);
    cursor: not-allowed;
  }

  .ic-select-control.disabled .ic-select-trigger-icon,
  .ic-select-trigger:disabled .ic-select-trigger-icon {
    color: var(--palette-grey-400);
  }

  .ic-select-control.variant-ghost .ic-select-trigger {
    border-color: transparent;
    background: transparent;
  }

  .ic-select-control.variant-ghost .ic-select-trigger:hover:not(:disabled) {
    border-color: transparent;
    background: var(--palette-grey-50);
  }

  .ic-select-control.variant-ghost.is-open .ic-select-trigger,
  .ic-select-control.variant-ghost .ic-select-trigger:focus-visible {
    border-color: transparent;
    background: var(--palette-grey-50);
    box-shadow: none;
  }

  /* Port of upstream Select/dropdown-menu.css */
  .ic-dropdown-menu-wrapper {
    position: fixed;
    z-index: 1400;
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
  }

  .ic-dropdown-menu {
    box-sizing: border-box;
    width: 100%;
    max-height: 240px;
    overflow-y: auto;
    border: 1px solid var(--palette-surface-elevated-border);
    border-radius: 8px;
    background-color: var(--palette-surface-elevated);
    padding: 4px;
    box-shadow: var(--shadow-md);
  }

  .ic-dropdown-menu-option {
    display: flex;
    width: 100%;
    min-height: 32px;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    padding: 8px 12px;
    color: var(--palette-common-black);
    font: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
    white-space: nowrap;
  }

  .ic-dropdown-menu-option:hover,
  .ic-dropdown-menu-option:focus-visible,
  .ic-dropdown-menu-option.is-active {
    background: var(--palette-grey-200);
  }

  .ic-dropdown-menu-option-check {
    display: inline-flex;
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    align-items: center;
    justify-content: center;
    color: var(--palette-common-black);
  }

  .ic-dropdown-menu-option-content {
    display: inline-flex;
    min-width: 0;
    align-items: baseline;
  }

  .ic-dropdown-menu-option.is-selected .ic-dropdown-menu-option-content {
    font-weight: 600;
  }
</style>
