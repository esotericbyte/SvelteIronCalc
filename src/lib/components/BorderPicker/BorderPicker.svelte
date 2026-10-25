<!--
  Port of upstream webapp/IronCalc/src/components/BorderPicker/BorderPicker.tsx:
  the toolbar's border panel, anchored below its button. Ten border buttons
  (all, inner, horizontal, vertical, outer; clear, top, right, bottom, left)
  apply a border to the selection at once; pressing the pressed one again
  turns it off (outer and the sides by clearing, as upstream). Below them,
  the border color (a color picker to the right) and the line style (a
  submenu shown on hover) apply to the pressed border and to the next ones.
  Everything resets when the panel closes.

  Upstream listens to every key on the document while the panel is open and
  blocks them all but Escape. Here the panel takes the focus when it opens
  and only its own keys are handled: Escape closes the nested picker first,
  then the panel, and the other keys work on its buttons as usual. Presses
  outside close it, as upstream.
-->
<script lang="ts">
  import {
    type BorderOptions,
    BorderStyle,
    BorderType,
    type Color,
    type IronCalcTheme,
  } from "@ironcalc/wasm";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import BorderAllIcon from "@lucide/svelte/icons/grid-2x2";
  import LineStyle from "@lucide/svelte/icons/line-style";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import { Portal } from "@skeletonlabs/skeleton-svelte";
  import type { Component } from "svelte";
  import { t } from "../../i18n";
  import IconButton from "../Button/IconButton.svelte";
  import ColorPicker from "../ColorPicker/ColorPicker.svelte";
  import {
    BorderBottomIcon,
    BorderCenterHIcon,
    BorderCenterVIcon,
    BorderInnerIcon,
    BorderLeftIcon,
    BorderNoneIcon,
    BorderOuterIcon,
    BorderRightIcon,
    BorderTopIcon,
  } from "../icons";
  import { getRootElement } from "../rootContext";
  import LineStylePicker from "./LineStylePicker.svelte";

  interface Props {
    onChange: (border: BorderOptions) => void;
    onClose: () => void;
    anchorEl: () => HTMLElement | null;
    open: boolean;
    currentTheme: IronCalcTheme;
  }

  let { onChange, onClose, anchorEl, open, currentTheme }: Props = $props();

  const BORDER_BUTTONS: {
    value: BorderType;
    labelKey: string;
    icon: Component;
    offValue: BorderType | null;
  }[] = [
    { value: BorderType.All, labelKey: "toolbar.borders.all", icon: BorderAllIcon, offValue: null },
    { value: BorderType.Inner, labelKey: "toolbar.borders.inner", icon: BorderInnerIcon, offValue: null },
    { value: BorderType.CenterH, labelKey: "toolbar.borders.horizontal", icon: BorderCenterHIcon, offValue: null },
    { value: BorderType.CenterV, labelKey: "toolbar.borders.vertical", icon: BorderCenterVIcon, offValue: null },
    { value: BorderType.Outer, labelKey: "toolbar.borders.outer", icon: BorderOuterIcon, offValue: BorderType.None },
    { value: BorderType.None, labelKey: "toolbar.borders.clear", icon: BorderNoneIcon, offValue: BorderType.None },
    { value: BorderType.Top, labelKey: "toolbar.borders.top", icon: BorderTopIcon, offValue: BorderType.None },
    { value: BorderType.Right, labelKey: "toolbar.borders.right", icon: BorderRightIcon, offValue: BorderType.None },
    { value: BorderType.Bottom, labelKey: "toolbar.borders.bottom", icon: BorderBottomIcon, offValue: BorderType.None },
    { value: BorderType.Left, labelKey: "toolbar.borders.left", icon: BorderLeftIcon, offValue: BorderType.None },
  ];

  const root = getRootElement();

  let panel: HTMLDivElement | null = $state(null);
  let borderColorButton: HTMLButtonElement | null = $state(null);

  let borderSelected: BorderType | null = $state(null);
  let borderColor: Color = $state("");
  let borderStyle: BorderStyle = $state(BorderStyle.Thin);
  let colorPickerOpen = $state(false);
  let stylePickerOpen = $state(false);

  // Everything resets when the panel closes
  $effect.pre(() => {
    if (!open) {
      borderSelected = null;
      borderColor = "";
      borderStyle = BorderStyle.Thin;
      colorPickerOpen = false;
      stylePickerOpen = false;
    }
  });

  // The panel takes the focus when it opens, so its keys reach it
  $effect(() => {
    if (open && panel) {
      panel.focus({ preventScroll: true });
    }
  });

  // Presses outside close the panel, except while the color picker (which
  // lives in its own portal) is open
  $effect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && panel?.contains(target)) {
        return;
      }
      if (colorPickerOpen) {
        return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  });

  function onKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      if (colorPickerOpen) {
        colorPickerOpen = false;
        return;
      }
      if (stylePickerOpen) {
        stylePickerOpen = false;
        return;
      }
      onClose();
    }
  }

  // Below the anchor, as upstream: 4px down and 4px to the left
  function anchoredBelow(element: HTMLElement) {
    function updatePosition(): void {
      const anchor = anchorEl();
      if (!anchor) {
        return;
      }
      const bb = anchor.getBoundingClientRect();
      element.style.top = `${bb.bottom + 4}px`;
      element.style.left = `${bb.left - 4}px`;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }

  function applyBorder(border: BorderType, color: Color, style: BorderStyle): void {
    onChange({ color: color || undefined, style, border });
  }

  function toggleBorder(value: BorderType, offValue: BorderType | null): void {
    const next = borderSelected === value ? offValue : value;
    borderSelected = next;
    if (next !== null) {
      applyBorder(next, borderColor, borderStyle);
    }
  }
</script>

{#snippet borderButton(button: (typeof BORDER_BUTTONS)[number])}
  {@const Icon = button.icon}
  <IconButton
    pressed={borderSelected === button.value}
    aria-label={t(button.labelKey)}
    title={t(button.labelKey)}
    onclick={() => {
      if (button.value === BorderType.None) {
        borderSelected = BorderType.None;
        applyBorder(BorderType.None, borderColor, borderStyle);
        return;
      }
      toggleBorder(button.value, button.offValue);
    }}
  >
    {#snippet icon()}<Icon />{/snippet}
  </IconButton>
{/snippet}

{#if open}
  <Portal target={root() ?? undefined}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={panel}
      class="ic-border-picker"
      role="dialog"
      tabindex="-1"
      aria-label={t("toolbar.borders.title")}
      onkeydown={onKeyDown}
      onclick={(event) => event.stopPropagation()}
      {@attach anchoredBelow}
    >
      <div class="ic-border-picker__borders">
        <div class="row">
          {#each BORDER_BUTTONS.slice(0, 5) as button (button.value)}
            {@render borderButton(button)}
          {/each}
        </div>
        <div class="row">
          {#each BORDER_BUTTONS.slice(5) as button (button.value)}
            {@render borderButton(button)}
          {/each}
        </div>
      </div>

      <div class="divider"></div>

      <div class="ic-border-picker__menu">
        <div class="ic-border-picker__submenu-anchor">
          <button
            bind:this={borderColorButton}
            type="button"
            class="ic-border-picker__button"
            aria-haspopup="dialog"
            aria-expanded={colorPickerOpen}
            onclick={() => (colorPickerOpen = !colorPickerOpen)}
          >
            <PencilLine />
            <span>{t("toolbar.borders.color")}</span>
            <ChevronRight />
          </button>
          <ColorPicker
            color={borderColor}
            defaultColor=""
            defaultSwatchColor="var(--palette-sheet-default-text-color)"
            title={t("color_picker.default")}
            onChange={(color) => {
              borderColor = color;
              colorPickerOpen = false;
              panel?.focus({ preventScroll: true });
              if (borderSelected) {
                applyBorder(borderSelected, color, borderStyle);
              }
            }}
            onClose={() => {
              colorPickerOpen = false;
              panel?.focus({ preventScroll: true });
            }}
            anchorEl={() => borderColorButton}
            open={colorPickerOpen}
            placement="right"
            theme={currentTheme}
          />
        </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="ic-border-picker__submenu-anchor"
          onmouseenter={() => (stylePickerOpen = true)}
          onmouseleave={() => (stylePickerOpen = false)}
        >
          <button
            type="button"
            class="ic-border-picker__button"
            aria-haspopup="true"
            aria-expanded={stylePickerOpen}
            onclick={() => (stylePickerOpen = !stylePickerOpen)}
          >
            <LineStyle />
            <span>{t("toolbar.borders.style")}</span>
            <ChevronRight />
          </button>
          {#if stylePickerOpen}
            <LineStylePicker
              value={borderStyle}
              onSelect={(style) => {
                borderStyle = style;
                stylePickerOpen = false;
                if (borderSelected) {
                  applyBorder(borderSelected, borderColor, style);
                }
              }}
            />
          {/if}
        </div>
      </div>
    </div>
  </Portal>
{/if}

<style>
  /* Port of upstream BorderPicker/border-picker.css */
  .ic-border-picker {
    position: fixed;
    z-index: 1300;
    display: flex;
    flex-direction: column;
    background: var(--palette-surface-elevated);
    border: 1px solid var(--palette-surface-elevated-border);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
    outline: none;
  }

  .ic-border-picker__borders {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
  }

  .ic-border-picker .row {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .ic-border-picker .divider {
    border-top: 1px solid var(--palette-grey-200);
  }

  .ic-border-picker__submenu-anchor {
    position: relative;
  }

  .ic-border-picker__menu {
    display: flex;
    flex-direction: column;
    padding: 4px;
  }

  .ic-border-picker__menu :global(.ic-border-picker__button) {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 32px;
    padding: 8px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    font: inherit;
    color: var(--palette-common-black);
    text-align: left;
    cursor: pointer;
  }

  .ic-border-picker__menu :global(.ic-border-picker__button:hover),
  .ic-border-picker__menu :global(.ic-border-picker__button.selected) {
    background: var(--palette-grey-200);
  }

  /* This applies to the LineStyle, PencilLine and the ChevronRight icons */
  .ic-border-picker__menu .ic-border-picker__button :global(svg) {
    flex: 0 0 16px;
    width: 16px;
    height: 16px;
    color: var(--palette-grey-600);
  }

  .ic-border-picker__menu .ic-border-picker__button span {
    flex: 1 1 auto;
  }
</style>
