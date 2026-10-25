<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/RightDrawer.tsx:
  the panel on the right of the workbook that shows one of its sections
  (named ranges, cell styles, conditional formatting, themes, regional
  settings), with a handle on its left edge to resize it by dragging or with
  the arrow keys, Home and End. The workbook renders it only while open.

  Upstream measures the width from the window's right edge and sets the
  cursor and `user-select` on `document.body` while dragging; here the width
  is measured from the workbook's right edge and the handle captures the
  pointer, so nothing outside the widget is touched.
-->
<script lang="ts" module>
  export type DrawerType =
    | "namedRanges"
    | "namedStyles"
    | "regionalSettings"
    | "conditionalFormatting"
    | "themes";

  // Default drawer width is duplicated in the CSS below; keep in sync
  export const DEFAULT_DRAWER_WIDTH = 360;
  export const MIN_DRAWER_WIDTH = 300;
  export const MAX_DRAWER_WIDTH = 500;

  const KEYBOARD_RESIZE_STEP = 16;
</script>

<script lang="ts">
  import type { FmtSettings, IronCalcTheme, Model, NamedStyle } from "@ironcalc/wasm";
  import { t } from "../../i18n";
  import ConditionalFormatting from "./ConditionalFormatting/ConditionalFormatting.svelte";
  import NamedRanges from "./NamedRanges/NamedRanges.svelte";
  import type {
    NamedStyleSavePayload,
    SaveError,
  } from "./NamedStyles/EditNamedStyle.svelte";
  import NamedStylesPanel from "./NamedStyles/NamedStylesPanel.svelte";
  import RegionalSettings from "./RegionalSettings/RegionalSettings.svelte";
  import Themes from "./Themes/Themes.svelte";

  interface Props {
    onClose: () => void;
    width: number;
    onWidthChange: (width: number) => void;
    model: Model;
    /** Bumped by the workbook whenever the model changed outside Svelte's view. */
    version: number;
    onUpdate: () => void;
    getSelectedArea: () => string;
    drawerType: DrawerType;
    // Themes props
    themes: IronCalcTheme[];
    currentTheme: IronCalcTheme;
    onThemePicked: (theme: IronCalcTheme) => void;
    // Named styles props
    customStyles: NamedStyle[];
    builtinStyles: NamedStyle[];
    formatOptions: FmtSettings;
    onApplyNamedStyle: (name: string) => void;
    onAddNamedStyle: (payload: NamedStyleSavePayload) => SaveError;
    onUpdateNamedStyle: (originalName: string, payload: NamedStyleSavePayload) => SaveError;
    onDeleteNamedStyle: (name: string) => void;
    // Regional settings props
    initialLocale: string;
    initialTimezone: string;
    initialLanguage: string;
    onSettingsSave: (locale: string, timezone: string, language: string) => void;
  }

  let {
    onClose,
    width,
    onWidthChange,
    model,
    version,
    onUpdate,
    getSelectedArea,
    drawerType,
    themes,
    currentTheme,
    onThemePicked,
    customStyles,
    builtinStyles,
    formatOptions,
    onApplyNamedStyle,
    onAddNamedStyle,
    onUpdateNamedStyle,
    onDeleteNamedStyle,
    initialLocale,
    initialTimezone,
    initialLanguage,
    onSettingsSave,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let drawerWidth = $state(width);
  let isResizing = $state(false);
  let container: HTMLDivElement | null = $state(null);

  function setWidth(nextWidth: number): void {
    drawerWidth = nextWidth;
    onWidthChange(nextWidth);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    let nextWidth = drawerWidth;
    if (event.key === "ArrowLeft") {
      nextWidth = Math.min(MAX_DRAWER_WIDTH, drawerWidth + KEYBOARD_RESIZE_STEP);
    } else if (event.key === "ArrowRight") {
      nextWidth = Math.max(MIN_DRAWER_WIDTH, drawerWidth - KEYBOARD_RESIZE_STEP);
    } else if (event.key === "Home") {
      nextWidth = MIN_DRAWER_WIDTH;
    } else if (event.key === "End") {
      nextWidth = MAX_DRAWER_WIDTH;
    } else {
      return;
    }
    event.preventDefault();
    setWidth(nextWidth);
  }

  function handlePointerDown(event: PointerEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    isResizing = true;
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!isResizing) {
      return;
    }
    // the drawer is aligned to the right edge of the workbook
    const right = container?.parentElement?.getBoundingClientRect().right ?? window.innerWidth;
    const newWidth = right - event.clientX;
    setWidth(Math.max(MIN_DRAWER_WIDTH, Math.min(MAX_DRAWER_WIDTH, newWidth)));
  }

  function handlePointerUp(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    isResizing = false;
  }
</script>

<div
  bind:this={container}
  class="ic-drawer-container"
  style:--ic-runtime-drawer-width={`${drawerWidth}px`}
>
  <div class="ic-drawer-divider"></div>
  <div class="ic-drawer-content">
    {#if drawerType === "namedStyles"}
      <NamedStylesPanel
        {model}
        {onClose}
        {customStyles}
        {builtinStyles}
        {formatOptions}
        {currentTheme}
        {onApplyNamedStyle}
        {onAddNamedStyle}
        {onUpdateNamedStyle}
        {onDeleteNamedStyle}
      />
    {:else if drawerType === "regionalSettings"}
      <RegionalSettings
        {onClose}
        {initialLocale}
        {initialTimezone}
        {initialLanguage}
        onSave={onSettingsSave}
      />
    {:else if drawerType === "conditionalFormatting"}
      <ConditionalFormatting
        {onClose}
        {getSelectedArea}
        {onUpdate}
        {model}
        {version}
        {currentTheme}
      />
    {:else if drawerType === "themes"}
      <Themes {onClose} {themes} {currentTheme} {onThemePicked} />
    {:else}
      <NamedRanges {onClose} {model} {version} {onUpdate} {getSelectedArea} />
    {/if}
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <hr
    class={["ic-drawer-resize-handle", isResizing && "ic-drawer-resize-handle--resizing"]}
    tabindex="0"
    aria-label={t("right_drawer.resize_drawer")}
    aria-orientation="vertical"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    onkeydown={handleKeyDown}
  />
</div>

<style>
  /* Port of upstream RightDrawer/rightdrawer.css */
  .ic-drawer-container {
    position: absolute;
    overflow: hidden;
    background-color: var(--palette-common-white);
    right: 0;
    top: var(--toolbar-height);
    bottom: 0;
    border-left: 1px solid var(--palette-grey-300);
    display: flex;
    flex-direction: column;
    /* default width is 360px and must be kept in sync with DEFAULT_DRAWER_WIDTH above */
    width: var(--ic-runtime-drawer-width, 360px);
    font-family: var(--typography-font-family);
  }

  @media (max-width: 600px) {
    .ic-drawer-container {
      width: 100%;
      border-left: none;
      top: 0;
    }
  }

  .ic-drawer-divider {
    height: 1px;
    width: 100%;
    background-color: var(--palette-grey-300);
    margin: 0;
  }

  .ic-drawer-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .ic-drawer-resize-handle {
    /* all: unset resets the default styles of the hr element */
    all: unset;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    cursor: col-resize;
    touch-action: none;
    background-color: transparent;
    transition: background-color 0.2s ease;
  }

  .ic-drawer-resize-handle:is(:hover, :focus-visible) {
    background-color: var(--palette-primary-main);
    opacity: 0.5;
  }

  .ic-drawer-resize-handle--resizing {
    background-color: var(--palette-primary-main);
    transition: none;
  }

  /* On mobile the resize handle is hidden */
  @media (max-width: 600px) {
    .ic-drawer-resize-handle {
      display: none;
    }

    .ic-drawer-divider {
      display: none;
    }
  }
</style>
