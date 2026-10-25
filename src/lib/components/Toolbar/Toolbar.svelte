<!--
  Port of upstream webapp/IronCalc/src/components/Toolbar/Toolbar.tsx: the
  row of formatting tools above the formula bar. Undo and redo; copy styles
  and clear formatting; currency, percentage, decimal places and the number
  format menu; the font size (a field between − and +); bold, italic,
  underline and strikethrough; the font and fill color pickers, the border
  picker, conditional formatting, the theme menu and cell styles; the
  horizontal and vertical alignment, wrapping and the merge menu; inserting
  a link; the PNG export and the grid lines. It scrolls sideways when it
  does not fit, with arrows at the ends.

  The conditional formatting and cell styles buttons and the theme menu's
  "Manage themes" open the right drawer; without their handlers they are
  disabled.
-->
<script lang="ts" module>
  export type MergeCellsOperation =
    | "merge"
    | "merge_center"
    | "merge_across"
    | "merge_down"
    | "unmerge";

  export interface MergeCellsState {
    canMerge: boolean;
    canMergeAcross: boolean;
    canMergeDown: boolean;
    canUnmerge: boolean;
  }
</script>

<script lang="ts">
  import type {
    BorderOptions,
    Color,
    FmtSettings,
    HorizontalAlignment,
    IronCalcTheme,
    VerticalAlignment,
  } from "@ironcalc/wasm";
  import AlignCenter from "@lucide/svelte/icons/align-center";
  import AlignCenterHorizontal from "@lucide/svelte/icons/align-center-horizontal";
  import AlignLeft from "@lucide/svelte/icons/align-left";
  import AlignRight from "@lucide/svelte/icons/align-right";
  import ArrowDownToLine from "@lucide/svelte/icons/arrow-down-to-line";
  import ArrowUpToLine from "@lucide/svelte/icons/arrow-up-to-line";
  import Bold from "@lucide/svelte/icons/bold";
  import Brush from "@lucide/svelte/icons/brush";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Columns3 from "@lucide/svelte/icons/columns-3";
  import DecimalsArrowLeft from "@lucide/svelte/icons/decimals-arrow-left";
  import DecimalsArrowRight from "@lucide/svelte/icons/decimals-arrow-right";
  import DollarSign from "@lucide/svelte/icons/dollar-sign";
  import Euro from "@lucide/svelte/icons/euro";
  import Grid2X2 from "@lucide/svelte/icons/grid-2x2";
  import Grid2x2Check from "@lucide/svelte/icons/grid-2x2-check";
  import Grid2x2X from "@lucide/svelte/icons/grid-2x2-x";
  import ImageDown from "@lucide/svelte/icons/image-down";
  import Italic from "@lucide/svelte/icons/italic";
  import Layers from "@lucide/svelte/icons/layers";
  import Link2 from "@lucide/svelte/icons/link-2";
  import Minus from "@lucide/svelte/icons/minus";
  import PaintBucket from "@lucide/svelte/icons/paint-bucket";
  import PaintRoller from "@lucide/svelte/icons/paint-roller";
  import Percent from "@lucide/svelte/icons/percent";
  import Plus from "@lucide/svelte/icons/plus";
  import PoundSterling from "@lucide/svelte/icons/pound-sterling";
  import Redo2 from "@lucide/svelte/icons/redo-2";
  import RemoveFormatting from "@lucide/svelte/icons/remove-formatting";
  import Rows3 from "@lucide/svelte/icons/rows-3";
  import Strikethrough from "@lucide/svelte/icons/strikethrough";
  import SwatchBook from "@lucide/svelte/icons/swatch-book";
  import TableCellsMerge from "@lucide/svelte/icons/table-cells-merge";
  import TableCellsSplit from "@lucide/svelte/icons/table-cells-split";
  import Type from "@lucide/svelte/icons/type";
  import Underline from "@lucide/svelte/icons/underline";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import WrapText from "@lucide/svelte/icons/wrap-text";
  import { t } from "../../i18n";
  import { resolveColorToHex } from "../../upstream/components/ColorPicker/util";
  import {
    decreaseDecimalPlaces,
    increaseDecimalPlaces,
    NumberFormats,
  } from "../../upstream/components/FormatMenu/formatUtil";
  import BorderPicker from "../BorderPicker/BorderPicker.svelte";
  import Button from "../Button/Button.svelte";
  import IconButton from "../Button/IconButton.svelte";
  import ColorPicker from "../ColorPicker/ColorPicker.svelte";
  import FormatMenu from "../FormatMenu/FormatMenu.svelte";
  import { ArrowMiddleFromLine } from "../icons";
  import Menu from "../Menu/Menu.svelte";
  import MenuDivider from "../Menu/MenuDivider.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import ThemeMenu from "../ThemeMenu/ThemeMenu.svelte";
  import Tooltip from "../Tooltip/Tooltip.svelte";

  interface Props {
    canUndo: boolean;
    canRedo: boolean;
    onRedo: () => void;
    onUndo: () => void;
    onToggleUnderline: (u: boolean) => void;
    onToggleBold: (v: boolean) => void;
    onToggleItalic: (v: boolean) => void;
    onToggleStrike: (v: boolean) => void;
    onToggleHorizontalAlign: (v: string) => void;
    onToggleVerticalAlign: (v: string) => void;
    onToggleWrapText: (v: boolean) => void;
    onCopyStyles: () => void;
    onTextColorPicked: (color: Color) => void;
    onFillColorPicked: (color: Color) => void;
    onNumberFormatPicked: (numberFmt: string) => void;
    onBorderChanged: (border: BorderOptions) => void;
    onClearFormatting: () => void;
    onIncreaseFontSize: (delta: number) => void;
    /** `keepFocus` is true while the size changes with the arrow keys in the field. */
    onSetFontSize: (size: number, keepFocus: boolean) => void;
    onDownloadPNG: () => void;
    fillColor: Color;
    fontColor: Color;
    fontSize: number;
    bold: boolean;
    underline: boolean;
    italic: boolean;
    strike: boolean;
    horizontalAlign: HorizontalAlignment;
    verticalAlign: VerticalAlignment;
    wrapText: boolean;
    /** what the merge menu can do with the current selection */
    mergeCellsState: MergeCellsState;
    onMergeCells: (operation: MergeCellsOperation) => void;
    canEdit: boolean;
    numFmt: string;
    showGridLines: boolean;
    onToggleShowGridLines: (show: boolean) => void;
    formatOptions: FmtSettings;
    onOpenConditionalFormatting?: () => void;
    isConditionalFormattingOpen: boolean;
    onOpenNamedStyles?: () => void;
    isNamedStylesOpen: boolean;
    onOpenLinkDialog: () => void;
    themes: IronCalcTheme[];
    currentTheme: IronCalcTheme;
    onThemePicked: (theme: IronCalcTheme) => void;
    onOpenThemes?: () => void;
    /** A picker or menu of the toolbar closed. */
    onPopupClosed: () => void;
  }

  let properties: Props = $props();

  const canEdit = $derived(properties.canEdit);
  const currentTheme = $derived(properties.currentTheme);
  const mergeCellsState = $derived(properties.mergeCellsState);

  let fontColorPickerOpen = $state(false);
  let fillColorPickerOpen = $state(false);
  let borderPickerOpen = $state(false);
  let showLeftArrow = $state(false);
  let showRightArrow = $state(false);
  // svelte-ignore state_referenced_locally
  let fontSizeInput = $state(`${properties.fontSize}`);

  let fontColorButton: HTMLButtonElement | null = $state(null);
  let fillColorButton: HTMLButtonElement | null = $state(null);
  let borderButton: HTMLButtonElement | null = $state(null);
  let toolbar: HTMLDivElement | null = $state(null);
  let fontSizeInputElement: HTMLInputElement | null = $state(null);
  let cancelFontSizeCommit = false;

  $effect.pre(() => {
    fontSizeInput = `${properties.fontSize}`;
  });

  const scrollLeft = () => toolbar?.scrollBy({ left: -200, behavior: "smooth" });
  const scrollRight = () => toolbar?.scrollBy({ left: 200, behavior: "smooth" });

  function updateArrows(): void {
    if (!toolbar) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = toolbar;
    showLeftArrow = scrollLeft > 0;
    showRightArrow = scrollLeft < scrollWidth - clientWidth;
  }

  // Upstream updates the arrows when the toolbar scrolls; here also when it
  // is resized
  $effect(() => {
    const element = toolbar;
    if (!element) {
      return;
    }
    updateArrows();
    element.addEventListener("scroll", updateArrows);
    const observer = new ResizeObserver(updateArrows);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  });

  const CurrencyIcon = $derived(
    properties.formatOptions.currency === "EUR"
      ? Euro
      : properties.formatOptions.currency === "GBP"
        ? PoundSterling
        : properties.formatOptions.currency === "USD"
          ? DollarSign
          : null,
  );
</script>

{#snippet tool(
  label: string,
  Icon: typeof Bold,
  onclick: () => void,
  options: { pressed?: boolean; disabled?: boolean; tooltip?: string } = {},
)}
  <Tooltip title={options.tooltip ?? label}>
    <IconButton
      aria-label={label}
      pressed={options.pressed ?? false}
      disabled={options.disabled ?? !canEdit}
      {onclick}
    >
      {#snippet icon()}<Icon />{/snippet}
    </IconButton>
  </Tooltip>
{/snippet}

<div class="ic-toolbar-wrapper">
  <div class="ic-toolbar-container" bind:this={toolbar}>
    <!-- History/Edit Group -->
    <div class="ic-toolbar-button-group">
      {@render tool(t("toolbar.undo"), Undo2, properties.onUndo, {
        disabled: !properties.canUndo,
      })}
      {@render tool(t("toolbar.redo"), Redo2, properties.onRedo, {
        disabled: !properties.canRedo,
      })}
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- Format Tools Group -->
    <div class="ic-toolbar-button-group">
      {@render tool(t("toolbar.copy_styles"), PaintRoller, properties.onCopyStyles, {
        disabled: false,
      })}
      {@render tool(t("toolbar.clear_formatting"), RemoveFormatting, () =>
        properties.onClearFormatting(),
      )}
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- Number Format Group -->
    <div class="ic-toolbar-button-group">
      <Tooltip title={t("toolbar.currency")}>
        <IconButton
          aria-label={t("toolbar.currency")}
          disabled={!canEdit}
          onclick={() =>
            properties.onNumberFormatPicked(properties.formatOptions.currency_format)}
        >
          {#snippet icon()}{#if CurrencyIcon}<CurrencyIcon />{/if}{/snippet}
        </IconButton>
      </Tooltip>
      {@render tool(t("toolbar.percentage"), Percent, () =>
        properties.onNumberFormatPicked(NumberFormats.PERCENTAGE),
      )}
      {@render tool(t("toolbar.decimal_places_decrease"), DecimalsArrowLeft, () =>
        properties.onNumberFormatPicked(decreaseDecimalPlaces(properties.numFmt)),
      )}
      {@render tool(t("toolbar.decimal_places_increase"), DecimalsArrowRight, () =>
        properties.onNumberFormatPicked(increaseDecimalPlaces(properties.numFmt)),
      )}
      <Tooltip title={t("toolbar.format_number")}>
        <FormatMenu
          numFmt={properties.numFmt}
          onChange={(numberFmt) => properties.onNumberFormatPicked(numberFmt)}
          formatOptions={properties.formatOptions}
        >
          {#snippet trigger(attributes)}
            <Button
              {...attributes}
              variant="ghost"
              size="sm"
              disabled={!canEdit}
              aria-label={t("toolbar.format_number")}
              class="ic-toolbar-menu-button"
            >
              {"123"}
              {#snippet endIcon()}<ChevronDown size={12} />{/snippet}
            </Button>
          {/snippet}
        </FormatMenu>
      </Tooltip>
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- Font Size Group -->
    <div class="ic-toolbar-button-group">
      {@render tool(t("toolbar.decrease_font_size"), Minus, () =>
        properties.onIncreaseFontSize(-1),
      )}
      <input
        bind:this={fontSizeInputElement}
        class="ic-toolbar-font-size-box"
        type="text"
        inputmode="numeric"
        aria-label={t("toolbar.font_size")}
        bind:value={fontSizeInput}
        disabled={!canEdit}
        onclick={(event) => {
          event.stopPropagation();
          event.currentTarget.select();
        }}
        onfocus={(event) => event.currentTarget.select()}
        onblur={() => {
          if (cancelFontSizeCommit) {
            cancelFontSizeCommit = false;
            return;
          }
          const parsed = Number(fontSizeInput.trim());
          if (Number.isInteger(parsed) && parsed > 0 && parsed <= 400) {
            properties.onSetFontSize(parsed, false);
          } else {
            fontSizeInput = `${properties.fontSize}`;
          }
        }}
        onkeydown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            cancelFontSizeCommit = true;
            fontSizeInput = `${properties.fontSize}`;
            event.currentTarget.blur();
            properties.onPopupClosed();
          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const current = Number(fontSizeInput.trim());
            if (Number.isInteger(current)) {
              const delta = event.shiftKey ? 10 : 1;
              const next =
                event.key === "ArrowUp"
                  ? Math.min(current + delta, 400)
                  : Math.max(current - delta, 1);
              fontSizeInput = `${next}`;
              properties.onSetFontSize(next, true);
              requestAnimationFrame(() => fontSizeInputElement?.focus());
            }
          }
        }}
      />
      {@render tool(t("toolbar.increase_font_size"), Plus, () =>
        properties.onIncreaseFontSize(1),
      )}
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- Text Style Group -->
    <div class="ic-toolbar-button-group">
      {@render tool(t("toolbar.bold"), Bold, () => properties.onToggleBold(!properties.bold), {
        pressed: properties.bold,
      })}
      {@render tool(
        t("toolbar.italic"),
        Italic,
        () => properties.onToggleItalic(!properties.italic),
        { pressed: properties.italic },
      )}
      {@render tool(
        t("toolbar.underline"),
        Underline,
        () => properties.onToggleUnderline(!properties.underline),
        { pressed: properties.underline },
      )}
      {@render tool(
        t("toolbar.strike_through"),
        Strikethrough,
        () => properties.onToggleStrike(!properties.strike),
        { pressed: properties.strike },
      )}
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- Color & Border Group -->
    <div class="ic-toolbar-button-group">
      <Tooltip title={t("toolbar.font_color")}>
        <IconButton
          bind:ref={fontColorButton}
          pressed={fontColorPickerOpen}
          disabled={!canEdit}
          aria-label={t("toolbar.font_color")}
          class="ic-toolbar-color-button"
          onclick={() => (fontColorPickerOpen = true)}
        >
          {#snippet icon()}
            <Type />
            <span
              class="ic-toolbar-color-line"
              style:background-color={resolveColorToHex(properties.fontColor, currentTheme) ||
                "var(--palette-sheet-default-text-color)"}
            ></span>
          {/snippet}
        </IconButton>
      </Tooltip>
      <Tooltip title={t("toolbar.fill_color")}>
        <IconButton
          bind:ref={fillColorButton}
          pressed={fillColorPickerOpen}
          disabled={!canEdit}
          aria-label={t("toolbar.fill_color")}
          class="ic-toolbar-color-button"
          onclick={() => (fillColorPickerOpen = true)}
        >
          {#snippet icon()}
            <PaintBucket />
            <span
              class="ic-toolbar-color-line"
              style:background-color={resolveColorToHex(properties.fillColor, currentTheme) ||
                "var(--palette-common-white)"}
            ></span>
          {/snippet}
        </IconButton>
      </Tooltip>
      <Tooltip title={t("toolbar.borders.title")}>
        <IconButton
          bind:ref={borderButton}
          pressed={borderPickerOpen}
          disabled={!canEdit}
          aria-label={t("toolbar.borders.title")}
          onclick={() => (borderPickerOpen = true)}
        >
          {#snippet icon()}<Grid2X2 />{/snippet}
        </IconButton>
      </Tooltip>
      {@render tool(
        t("toolbar.conditional_formatting"),
        Brush,
        () => properties.onOpenConditionalFormatting?.(),
        {
          pressed: properties.isConditionalFormattingOpen,
          disabled: !canEdit || !properties.onOpenConditionalFormatting,
        },
      )}
      <Tooltip title={t("toolbar.themes")}>
        <ThemeMenu
          themes={properties.themes}
          currentTheme={properties.currentTheme}
          onChange={properties.onThemePicked}
          onManageThemes={properties.onOpenThemes}
        >
          {#snippet trigger(attributes)}
            <IconButton {...attributes} aria-label={t("toolbar.themes")} disabled={!canEdit}>
              {#snippet icon()}<SwatchBook />{/snippet}
            </IconButton>
          {/snippet}
        </ThemeMenu>
      </Tooltip>
      {@render tool(
        t("toolbar.named_styles"),
        Layers,
        () => properties.onOpenNamedStyles?.(),
        {
          pressed: properties.isNamedStylesOpen,
          disabled: !canEdit || !properties.onOpenNamedStyles,
        },
      )}
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- Alignment Group -->
    <div class="ic-toolbar-button-group">
      {@render tool(
        t("toolbar.align_left"),
        AlignLeft,
        () =>
          properties.onToggleHorizontalAlign(
            properties.horizontalAlign === "left" ? "general" : "left",
          ),
        { pressed: properties.horizontalAlign === "left" },
      )}
      {@render tool(
        t("toolbar.align_center"),
        AlignCenter,
        () =>
          properties.onToggleHorizontalAlign(
            properties.horizontalAlign === "center" ? "general" : "center",
          ),
        { pressed: properties.horizontalAlign === "center" },
      )}
      {@render tool(
        t("toolbar.align_right"),
        AlignRight,
        () =>
          properties.onToggleHorizontalAlign(
            properties.horizontalAlign === "right" ? "general" : "right",
          ),
        { pressed: properties.horizontalAlign === "right" },
      )}
      {@render tool(
        t("toolbar.vertical_align_top"),
        ArrowUpToLine,
        () => properties.onToggleVerticalAlign("top"),
        { pressed: properties.verticalAlign === "top" },
      )}
      {@render tool(
        t("toolbar.vertical_align_middle"),
        ArrowMiddleFromLine as typeof Bold,
        () => properties.onToggleVerticalAlign("center"),
        { pressed: properties.verticalAlign === "center" },
      )}
      {@render tool(
        t("toolbar.vertical_align_bottom"),
        ArrowDownToLine,
        () => properties.onToggleVerticalAlign("bottom"),
        { pressed: properties.verticalAlign === "bottom" },
      )}
      {@render tool(
        t("toolbar.wrap_text"),
        WrapText,
        () => properties.onToggleWrapText(!properties.wrapText),
        { pressed: properties.wrapText },
      )}
      <Tooltip title={t("toolbar.merge_cells")}>
        <Menu>
          {#snippet trigger(attributes)}
            <Button
              {...attributes}
              variant="ghost"
              size="sm"
              aria-label={t("toolbar.merge_cells")}
              disabled={!canEdit || !(mergeCellsState.canMerge || mergeCellsState.canUnmerge)}
              class="ic-toolbar-menu-button"
            >
              {#snippet startIcon()}<TableCellsMerge />{/snippet}
              {#snippet endIcon()}<ChevronDown size={12} />{/snippet}
            </Button>
          {/snippet}
          <MenuItem
            disabled={!mergeCellsState.canMerge}
            onClick={() => properties.onMergeCells("merge")}
          >
            {#snippet icon()}<TableCellsMerge />{/snippet}
            {t("toolbar.merge_menu.merge")}
          </MenuItem>
          <MenuItem
            disabled={!mergeCellsState.canMerge}
            onClick={() => properties.onMergeCells("merge_center")}
          >
            {#snippet icon()}<AlignCenterHorizontal />{/snippet}
            {t("toolbar.merge_menu.merge_center")}
          </MenuItem>
          <MenuItem
            disabled={!mergeCellsState.canMergeAcross}
            onClick={() => properties.onMergeCells("merge_across")}
          >
            {#snippet icon()}<Rows3 />{/snippet}
            {t("toolbar.merge_menu.merge_across")}
          </MenuItem>
          <MenuItem
            disabled={!mergeCellsState.canMergeDown}
            onClick={() => properties.onMergeCells("merge_down")}
          >
            {#snippet icon()}<Columns3 />{/snippet}
            {t("toolbar.merge_menu.merge_down")}
          </MenuItem>
          <MenuDivider />
          <MenuItem
            disabled={!mergeCellsState.canUnmerge}
            onClick={() => properties.onMergeCells("unmerge")}
          >
            {#snippet icon()}<TableCellsSplit />{/snippet}
            {t("toolbar.merge_menu.unmerge")}
          </MenuItem>
        </Menu>
      </Tooltip>
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- Links, checkboxes, dropdowns, etc -->
    <div class="ic-toolbar-button-group">
      {@render tool(t("toolbar.add_link"), Link2, properties.onOpenLinkDialog)}
    </div>

    <div class="ic-toolbar-divider"></div>

    <!-- View & Tools Group -->
    <div class="ic-toolbar-button-group">
      {@render tool(t("toolbar.download_png"), ImageDown, () => properties.onDownloadPNG(), {
        tooltip: t("toolbar.selected_png"),
      })}
      {@render tool(
        t("toolbar.show_hide_grid_lines"),
        properties.showGridLines ? Grid2x2Check : Grid2x2X,
        () => properties.onToggleShowGridLines(!properties.showGridLines),
      )}
    </div>

    <ColorPicker
      color={properties.fontColor}
      defaultColor=""
      defaultSwatchColor="var(--palette-sheet-default-text-color)"
      title={t("color_picker.default")}
      onChange={(color) => {
        properties.onTextColorPicked(color);
        fontColorPickerOpen = false;
      }}
      onClose={() => {
        fontColorPickerOpen = false;
        properties.onPopupClosed();
      }}
      anchorEl={() => fontColorButton}
      open={fontColorPickerOpen}
      theme={currentTheme}
    />
    <ColorPicker
      color={properties.fillColor}
      defaultColor=""
      title={t("color_picker.default")}
      onChange={(color) => {
        if (color !== null) {
          properties.onFillColorPicked(color);
        }
        fillColorPickerOpen = false;
      }}
      onClose={() => {
        fillColorPickerOpen = false;
        properties.onPopupClosed();
      }}
      anchorEl={() => fillColorButton}
      open={fillColorPickerOpen}
      theme={currentTheme}
    />
    <BorderPicker
      onChange={(border) => properties.onBorderChanged(border)}
      onClose={() => {
        borderPickerOpen = false;
        properties.onPopupClosed();
      }}
      anchorEl={() => borderButton}
      open={borderPickerOpen}
      {currentTheme}
    />
  </div>

  {#if showLeftArrow}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="ic-toolbar-scroll-arrow ic-toolbar-scroll-arrow--left" onclick={scrollLeft}>
      <Tooltip title={t("toolbar.scroll_left")}><ChevronLeft /></Tooltip>
    </div>
  {/if}

  {#if showRightArrow}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="ic-toolbar-scroll-arrow ic-toolbar-scroll-arrow--right" onclick={scrollRight}>
      <Tooltip title={t("toolbar.scroll_right")}><ChevronRight /></Tooltip>
    </div>
  {/if}
</div>

<style>
  /* Port of upstream Toolbar/toolbar.css */
  .ic-toolbar-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--palette-common-white);
    height: var(--toolbar-height);
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-toolbar-container {
    display: flex;
    flex: 1;
    align-items: center;
    overflow-x: auto;
    padding: 4px 8px;
    gap: 4px;
    scrollbar-width: none;
  }

  .ic-toolbar-container :global(.ic-toolbar-color-button) {
    position: relative;
  }

  .ic-toolbar-color-line {
    height: 3px;
    width: 16px;
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .ic-toolbar-container :global(.ic-toolbar-menu-button) {
    gap: 0;
    padding-left: 4px;
    padding-right: 2px;
  }

  .ic-toolbar-container :global(.ic-toolbar-menu-button .ic-button__icon:last-child svg) {
    width: 12px;
    height: 12px;
  }

  .ic-toolbar-divider {
    min-width: 1px;
    height: 16px;
    background-color: var(--palette-grey-300);
    margin: 0 8px;
  }

  .ic-toolbar-font-size-box {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--palette-common-black);
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
    border: 1px solid var(--palette-grey-300);
    border-radius: 6px;
    min-width: 24px;
    background: transparent;
    cursor: text;
    outline: none;
    padding: 0;
    box-sizing: border-box;
  }

  .ic-toolbar-font-size-box:focus {
    background: var(--palette-common-white);
    border: 1px solid var(--palette-grey-500);
  }

  .ic-toolbar-button-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .ic-toolbar-scroll-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--palette-common-white);
    color: var(--palette-common-black);
    border: none;
    cursor: pointer;
  }

  .ic-toolbar-scroll-arrow--left {
    left: 0;
    border-right: 1px solid var(--palette-grey-300);
  }

  .ic-toolbar-scroll-arrow--right {
    right: 0;
    border-left: 1px solid var(--palette-grey-300);
  }

  .ic-toolbar-scroll-arrow:hover {
    background-color: var(--palette-grey-100);
  }

  .ic-toolbar-scroll-arrow :global(svg) {
    width: 16px;
    height: 16px;
  }

  .ic-toolbar-scroll-arrow :global(.ic-tooltip-trigger) {
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
  }
</style>
