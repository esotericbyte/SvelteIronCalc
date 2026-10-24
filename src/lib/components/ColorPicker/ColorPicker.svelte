<!--
  Port of upstream webapp/IronCalc/src/components/ColorPicker/ColorPicker.tsx:
  a panel anchored to an element with a "default" entry, the workbook
  theme's colors and their tints, the standard colors, the recently picked
  ones and a button opening the advanced picker. Arrow keys move between the
  swatches (colorPickerKeyDown.ts), Escape and presses outside close it.
  The plain helpers (theme grid, color resolving) are carried from upstream
  (`upstream/components/ColorPicker/util.ts`).
-->
<script lang="ts">
  import type { Color, IronCalcTheme } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import Plus from "@lucide/svelte/icons/plus";
  import { Portal } from "@skeletonlabs/skeleton-svelte";
  import { t } from "../../i18n";
  import {
    computeThemeGrid,
    getCheckColor,
    isWhiteColor,
    resolveColorToHex,
    standardColors,
    themeBaseColors,
  } from "../../upstream/components/ColorPicker/util";
  import { getFocusableElements } from "../../upstream/components/util";
  import AdvancedColorPicker from "../AdvancedColorPicker/AdvancedColorPicker.svelte";
  import { getRootElement } from "../rootContext";
  import { type Placement, panelAnchoredTo } from "./anchorPosition";
  import { createColorPickerKeyDown } from "./colorPickerKeyDown";

  interface Props {
    color: Color;
    defaultColor: string;
    /** Swatch for the default option, if different from defaultColor */
    defaultSwatchColor?: string;
    title: string;
    onChange: (color: Color) => void;
    onClose: () => void;
    anchorEl: () => HTMLElement | null;
    open: boolean;
    theme: IronCalcTheme;
    placement?: Placement;
  }

  let {
    color,
    defaultColor,
    defaultSwatchColor,
    title,
    onChange,
    onClose,
    anchorEl,
    open,
    placement = "bottom",
    theme,
  }: Props = $props();

  const FALLBACK_COLOR = "#272525"; // --palette-common-black
  const MAX_RECENT_COLORS = 29;

  function colorsEqual(a: Color, b: Color): boolean {
    if (a === undefined || b === undefined) {
      return a === b;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return a[0] === b[0] && a[1] === b[1];
    }
    if (typeof a === "string" && typeof b === "string") {
      return a.toUpperCase() === b.toUpperCase();
    }
    return false;
  }

  const root = getRootElement();
  // svelte-ignore state_referenced_locally
  let selectedColor: Color = $state(color);
  let isPickerOpen = $state(false);
  let panel: HTMLDivElement | null = $state(null);
  let recentColors: { color: Color; hex: string }[] = $state([]);

  const themeColors = $derived(themeBaseColors(theme));
  const themeGrid = $derived(computeThemeGrid(theme));

  $effect.pre(() => {
    selectedColor = color;
  });

  const onKeyDown = createColorPickerKeyDown({
    onEscape: () => {
      isPickerOpen = false;
      onClose();
    },
    getFocusableElements: () => getFocusableElements(panel),
  });

  // focus the first button when the menu opens or when the advanced picker closes
  $effect(() => {
    if (open && !isPickerOpen && panel) {
      panel.querySelector<HTMLButtonElement>("button")?.focus();
    }
  });

  // Close on presses outside the panel without swallowing them, so the
  // pressed element (e.g. another menu) reacts in the same click
  $effect(() => {
    if (!open || isPickerOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (panel?.contains(target)) {
        return;
      }
      if (anchorEl()?.contains(target)) {
        return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  });

  function selectColor(colorValue: Color): void {
    selectedColor = colorValue ?? FALLBACK_COLOR;
    onChange(colorValue);
    isPickerOpen = false;
  }

  function handleColorSelect(colorValue: Color, displayHex: string): void {
    if (!recentColors.some((recent) => colorsEqual(recent.color, colorValue))) {
      recentColors = [{ color: colorValue, hex: displayHex }, ...recentColors].slice(
        0,
        MAX_RECENT_COLORS,
      );
    }
    selectColor(colorValue);
  }
</script>

{#snippet swatch(displayHex: string, colorValue: Color, row: number, col: number)}
  <button
    type="button"
    class={[
      "ic-color-picker__swatch",
      "ic-color-picker__swatch--selectable",
      isWhiteColor(displayHex) && "ic-color-picker__swatch--white",
    ]}
    style:background-color={displayHex}
    onclick={() => handleColorSelect(colorValue, displayHex)}
    aria-label={displayHex}
    data-nav-row={row}
    data-nav-col={col}
  >
    {#if colorsEqual(selectedColor, colorValue)}
      <Check class="ic-color-picker__check-icon" color={getCheckColor(displayHex)} />
    {/if}
  </button>
{/snippet}

{#if open && isPickerOpen}
  <AdvancedColorPicker
    color={resolveColorToHex(selectedColor, theme) || FALLBACK_COLOR}
    onAccept={(hex) => handleColorSelect(hex, hex)}
    onCancel={() => (isPickerOpen = false)}
    {anchorEl}
    open
  />
{:else if open}
  <Portal target={root() ?? undefined}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={panel}
      class="ic-color-picker"
      role="dialog"
      tabindex="-1"
      aria-label={t("color_picker.add")}
      onkeydown={onKeyDown}
      onclick={(event) => {
        // Otherwise the sheet would grab the keyboard focus
        event.stopPropagation();
      }}
      {@attach panelAnchoredTo(anchorEl, placement)}
    >
      <div class="ic-color-picker__section">
        <button
          type="button"
          class="ic-color-picker__menu-item"
          onclick={() => selectColor(defaultColor)}
          data-nav-row={0}
          data-nav-col={0}
        >
          <span
            class="ic-color-picker__menu-item-square"
            style:background-color={defaultSwatchColor ?? defaultColor}
            aria-hidden="true"
          ></span>
          <span class="ic-color-picker__menu-item-text">{title}</span>
        </button>
      </div>

      <div class="ic-color-picker__divider"></div>

      <div class="ic-color-picker__section">
        <div class="ic-color-picker__label">{t("color_picker.themed_colors")}</div>
        <div class="ic-color-picker__color-list">
          {#each themeColors as hex, col (col)}
            {@render swatch(hex, [col, 0], 1, col)}
          {/each}
        </div>
        <div class="ic-color-picker__color-grid">
          {#each themeGrid as column, colIndex (colIndex)}
            <div class="ic-color-picker__color-grid-col">
              {#each column as tone, toneIndex (toneIndex)}
                {@render swatch(tone.hex, tone.color, 2 + toneIndex, colIndex)}
              {/each}
            </div>
          {/each}
        </div>
      </div>

      <div class="ic-color-picker__divider"></div>

      <div class="ic-color-picker__section">
        <div class="ic-color-picker__label">{t("color_picker.standard_colors")}</div>
        <div class="ic-color-picker__color-list">
          {#each standardColors as hex, col (col)}
            {@render swatch(hex, hex, 7, col)}
          {/each}
        </div>
      </div>

      <div class="ic-color-picker__divider"></div>

      <div class="ic-color-picker__section">
        <div class="ic-color-picker__label">{t("color_picker.recent")}</div>
        <div class="ic-color-picker__color-list">
          {#each recentColors as recent, col (recent.hex)}
            <button
              type="button"
              class={[
                "ic-color-picker__swatch",
                isWhiteColor(recent.hex) && "ic-color-picker__swatch--white",
              ]}
              style:background-color={recent.hex}
              onclick={() => handleColorSelect(recent.color, recent.hex)}
              aria-label={recent.hex}
              data-nav-row={8}
              data-nav-col={col}
            ></button>
          {/each}
          <button
            type="button"
            class="ic-color-picker__plus-button"
            onclick={() => (isPickerOpen = true)}
            title={t("color_picker.add")}
            aria-label={t("color_picker.add")}
            data-nav-row={8}
            data-nav-col={recentColors.length}
          >
            <Plus />
          </button>
        </div>
      </div>
    </div>
  </Portal>
{/if}

<style>
  /* Port of upstream ColorPicker/color-picker.css. The panel is portaled,
     hence :global. */
  :global(.ic-color-picker) {
    position: fixed;
    z-index: 1300;
    max-width: 222px;
    min-width: 180px;
    margin: 0;
    border: 1px solid var(--palette-surface-elevated-border);
    border-radius: 8px;
    background: var(--palette-surface-elevated);
    box-shadow: var(--shadow-md);
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
    box-sizing: border-box;
    outline: none;
  }

  :global(.ic-color-picker *),
  :global(.ic-color-picker *::before),
  :global(.ic-color-picker *::after) {
    box-sizing: border-box;
  }

  :global(.ic-color-picker *:focus) {
    outline: none;
  }

  :global(.ic-color-picker *:focus-visible) {
    outline: 2px solid var(--palette-primary-main);
    outline-offset: 2px;
  }

  :global(.ic-color-picker__section) {
    display: flex;
    flex-direction: column;
    margin: 4px;
    padding: 8px;
    gap: 8px;
  }

  :global(.ic-color-picker__section:first-child) {
    margin: 4px;
    padding: 0;
  }

  :global(.ic-color-picker__menu-item) {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 172px;
    height: 32px;
    padding: 8px;
    border: none;
    border-radius: 4px;
    background: transparent;
    text-align: left;
    font: inherit;
    color: var(--palette-sheet-default-text-color);
  }

  :global(.ic-color-picker__menu-item:hover) {
    cursor: pointer;
    background: var(--palette-grey-200);
  }

  :global(.ic-color-picker__menu-item-square) {
    width: 16px;
    height: 16px;
    margin-top: 0;
    border: 1px solid var(--palette-grey-300);
    border-radius: 4px;
    flex: 0 0 auto;
  }

  :global(.ic-color-picker__menu-item-text) {
    color: var(--palette-sheet-default-text-color);
  }

  :global(.ic-color-picker__divider) {
    width: 100%;
    height: 0;
    border-top: 1px solid var(--palette-grey-200);
  }

  :global(.ic-color-picker__color-list) {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: flex-start;
    gap: 4px;
  }

  :global(.ic-color-picker__color-grid) {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    gap: 4px;
  }

  :global(.ic-color-picker__color-grid-col) {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 4px;
  }

  :global(.ic-color-picker__swatch) {
    width: 16px;
    height: 16px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
  }

  :global(.ic-color-picker__swatch:hover) {
    cursor: pointer;
    outline: 1px solid var(--palette-grey-300);
    outline-offset: 1px;
  }

  :global(.ic-color-picker__swatch--white) {
    border: 1px solid var(--palette-grey-300);
  }

  :global(.ic-color-picker__swatch--selectable) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.ic-color-picker__check-icon) {
    width: 10px;
    height: 10px;
    stroke-width: 3;
    pointer-events: none;
  }

  :global(.ic-color-picker__label) {
    color: var(--palette-grey-600);
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
  }

  :global(.ic-color-picker__plus-button) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    width: 16px;
    height: 16px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--palette-common-black);
    font: inherit;
  }

  :global(.ic-color-picker__plus-button:hover) {
    cursor: pointer;
    outline: 1px solid var(--palette-grey-300);
    outline-offset: 1px;
  }

  :global(.ic-color-picker__plus-button svg) {
    width: 16px;
    height: 16px;
  }
</style>
