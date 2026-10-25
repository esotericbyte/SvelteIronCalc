<!--
  Port of upstream webapp/IronCalc/src/components/IconPicker/IconPicker.tsx:
  a button showing the chosen icon of an icon set, opening a grid of all of
  them below it (above when there is no room). Picking one, or a press
  outside, closes the grid. The conditional formatting rules of the right
  drawer use it; the icons and `iconSpecFor` are in iconSpec.ts.
-->
<script lang="ts">
  import { Portal } from "@skeletonlabs/skeleton-svelte";
  import { getRootElement } from "../rootContext";
  import { CYCLE_ICONS, iconSpecFor } from "./iconSpec";

  interface Props {
    value: string;
    color: string;
    onChange: (name: string) => void;
  }

  let { value, color, onChange }: Props = $props();

  const root = getRootElement();

  let open = $state(false);
  let button: HTMLButtonElement | null = $state(null);
  let panel: HTMLDivElement | null = $state(null);

  const spec = $derived(iconSpecFor(value));

  // Below the button, kept inside the viewport (upstream's layout effect)
  function positioned(element: HTMLDivElement): void {
    if (!button) {
      return;
    }
    const anchor = button.getBoundingClientRect();
    const panelWidth = element.offsetWidth;
    const panelHeight = element.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;

    let left = anchor.left;
    let top = anchor.bottom + 4;

    if (left + panelWidth > viewportWidth - margin) {
      left = viewportWidth - panelWidth - margin;
    }
    if (top + panelHeight > viewportHeight - margin) {
      top = anchor.top - panelHeight - 4;
    }
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
  }

  $effect(() => {
    if (!open) {
      return;
    }
    const handler = (event: MouseEvent) => {
      if (
        !button?.contains(event.target as Node) &&
        !panel?.contains(event.target as Node)
      ) {
        open = false;
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  });
</script>

<button
  bind:this={button}
  type="button"
  class="ic-icon-picker-trigger"
  aria-label="Pick icon"
  aria-expanded={open}
  onclick={() => (open = !open)}
>
  <spec.Icon size={16} {color} fill={spec.filled ? color : "none"} />
</button>
{#if open}
  <Portal target={root() ?? undefined}>
    <div
      bind:this={panel}
      class="ic-icon-picker-panel"
      style:top="-9999px"
      style:left="-9999px"
      {@attach positioned}
    >
      {#each CYCLE_ICONS as { Icon, name, filled } (name)}
        <button
          type="button"
          class={["ic-icon-picker-item", name === value && "ic-icon-picker-item--selected"]}
          aria-label={name}
          aria-pressed={name === value}
          onclick={() => {
            onChange(name);
            open = false;
          }}
        >
          <Icon size={16} {color} fill={filled ? color : "none"} />
        </button>
      {/each}
    </div>
  </Portal>
{/if}

<style>
  /* Port of upstream IconPicker/icon-picker.css */
  .ic-icon-picker-trigger {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 3px;
  }

  .ic-icon-picker-trigger:hover {
    background: var(--palette-grey-100);
  }

  .ic-icon-picker-panel {
    position: fixed;
    z-index: 1300;
    background: var(--palette-surface-elevated);
    border: 1px solid var(--palette-surface-elevated-border);
    border-radius: 6px;
    box-shadow: var(--shadow-md);
    padding: 6px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 2px;
  }

  .ic-icon-picker-item {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 4px;
  }

  .ic-icon-picker-item:hover {
    background: var(--palette-grey-200);
  }

  .ic-icon-picker-item--selected {
    background: var(--palette-grey-100);
    outline-offset: -1px;
  }
</style>
