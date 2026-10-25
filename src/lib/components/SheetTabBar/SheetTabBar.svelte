<!--
  Port of upstream webapp/IronCalc/src/components/SheetTabBar/SheetTabBar.tsx
  and SheetListMenu.tsx: the add-sheet button (while the widget can be
  edited), the sheet list menu (hidden sheets included, picking one shows
  it), the tabs of the visible sheets and, while the widget can be edited,
  the button opening the regional settings, which shows the locale and the
  language (a gear icon on narrow screens).
-->
<script lang="ts">
  import type { Color, Model } from "@ironcalc/wasm";
  import MenuIcon from "@lucide/svelte/icons/menu";
  import Plus from "@lucide/svelte/icons/plus";
  import Settings from "@lucide/svelte/icons/settings";
  import { t } from "../../i18n";
  import Button from "../Button/Button.svelte";
  import IconButton from "../Button/IconButton.svelte";
  import Menu from "../Menu/Menu.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import { getLocaleDisplayName } from "../RightDrawer/RegionalSettings/regionalSettings";
  import Tooltip from "../Tooltip/Tooltip.svelte";
  import SheetTab from "./SheetTab.svelte";
  import type { SheetOptions } from "./types";

  interface Props {
    sheets: SheetOptions[];
    selectedIndex: number;
    onSheetSelected: (index: number) => void;
    onAddBlankSheet: () => void;
    onSheetColorChanged: (color: Color) => void;
    onSheetRenamed: (name: string) => void;
    onSheetDeleted: () => void;
    onSheetDuplicated: () => void;
    onHideSheet: () => void;
    onMoveSheet: (fromIndex: number, toIndex: number) => void;
    onOpenRegionalSettings: () => void;
    model: Model;
    /** Bumped by the workbook whenever the model changed outside Svelte's view. */
    version: number;
    /** When false, sheet add/rename/delete and regional settings affordances are hidden. */
    canEdit: boolean;
    /** True while a formula being edited can take a reference to another sheet. */
    isReferenceMode: () => boolean;
    /** Gives the focus back to the workbook after a dialog closed. */
    restoreFocus: () => void;
  }

  let {
    sheets,
    selectedIndex,
    onSheetSelected,
    onAddBlankSheet,
    onSheetColorChanged,
    onSheetRenamed,
    onSheetDeleted,
    onSheetDuplicated,
    onHideSheet,
    onMoveSheet,
    onOpenRegionalSettings,
    model,
    version,
    canEdit,
    isReferenceMode,
    restoreFocus,
  }: Props = $props();

  const visibleSheets = $derived(
    sheets
      .map((sheet, index) => ({ ...sheet, index }))
      .filter((sheet) => sheet.state === "visible"),
  );

  const currentTheme = $derived.by(() => {
    void version;
    return model.getTheme();
  });

  const regional = $derived.by(() => {
    void version;
    return {
      locale: getLocaleDisplayName(model.getLocale()),
      language: t(`regional_settings.language.display_language.${model.getLanguage()}`),
    };
  });

  function isWhiteColor(color: string): boolean {
    return ["#FFF", "#FFFFFF"].includes(color);
  }

  const hasColors = $derived(sheets.some((sheet) => !isWhiteColor(sheet.color)));
</script>

<div class="ic-sheet-tab-bar-container">
  <div class="ic-sheet-tab-bar-left-buttons-container">
    {#if canEdit}
      <Tooltip title={t("navigation.add_sheet")}>
        <IconButton aria-label={t("navigation.add_sheet")} onclick={onAddBlankSheet}>
          {#snippet icon()}<Plus />{/snippet}
        </IconButton>
      </Tooltip>
    {/if}
    <Tooltip title={t("navigation.sheet_list")}>
      <Menu>
        {#snippet trigger(attributes)}
          <IconButton {...attributes} aria-label={t("navigation.sheet_list")}>
            {#snippet icon()}<MenuIcon />{/snippet}
          </IconButton>
        {/snippet}
        {#each sheets as sheet, index (sheet.sheetId)}
          <MenuItem checked={index === selectedIndex} onClick={() => onSheetSelected(index)}>
            {#snippet icon()}
              {#if hasColors}
                <span
                  class="ic-sheet-list-menu-color"
                  style:background-color={sheet.color}
                ></span>
              {/if}
            {/snippet}
            <span
              class={[
                index === selectedIndex && "ic-sheet-list-menu-name--selected",
                sheet.state !== "visible" && "ic-sheet-list-menu-name--hidden",
              ]}
            >
              {sheet.name}
            </span>
          </MenuItem>
        {/each}
      </Menu>
    </Tooltip>
  </div>
  <div class="ic-sheet-tab-bar-vertical-divider"></div>
  <div class="ic-sheet-tab-bar-sheets">
    <div class="ic-sheet-tab-bar-sheet-inner" role="tablist">
      {#each visibleSheets as tab (tab.sheetId)}
        <SheetTab
          {canEdit}
          name={tab.name}
          color={tab.color}
          selected={tab.index === selectedIndex}
          onSelected={() => onSheetSelected(tab.index)}
          onColorChanged={onSheetColorChanged}
          onRenamed={onSheetRenamed}
          canDelete={visibleSheets.length > 1}
          onDeleted={onSheetDeleted}
          onDuplicateSheet={onSheetDuplicated}
          {onHideSheet}
          {model}
          {currentTheme}
          {onMoveSheet}
          {isReferenceMode}
          {restoreFocus}
        />
      {/each}
    </div>
  </div>
  {#if canEdit}
    <div class="ic-sheet-tab-bar-right-container">
      <Tooltip title={t("regional_settings.open_regional_settings")}>
        <Button
          class="ic-sheet-tab-bar-regional-settings-button"
          variant="ghost"
          size="sm"
          onclick={onOpenRegionalSettings}
        >
          {regional.locale}
          <div class="ic-sheet-tab-bar-text-divider"></div>
          {regional.language}
        </Button>
      </Tooltip>
      <Tooltip title={t("regional_settings.open_regional_settings")}>
        <IconButton
          class="ic-sheet-tab-bar-regional-settings-icon-button"
          aria-label={t("regional_settings.open_regional_settings")}
          onclick={onOpenRegionalSettings}
        >
          {#snippet icon()}<Settings />{/snippet}
        </IconButton>
      </Tooltip>
    </div>
  {/if}
</div>

<style>
  /* Port of upstream sheet-tab-bar.css and sheet-list-menu.css */
  .ic-sheet-tab-bar-container {
    display: flex;
    flex-direction: row;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--navigation-height);
    align-items: center;
    padding: 0;
    font-family: var(--typography-font-family);
    overflow: hidden;
    background-color: var(--palette-common-white);
    border-top: 1px solid var(--palette-grey-300);
  }

  .ic-sheet-tab-bar-sheets {
    flex-grow: 2;
    overflow: hidden;
    overflow-x: auto;
    scrollbar-width: none;
    padding-left: 8px;
    display: flex;
    flex-direction: row;
    height: 100%;
  }

  .ic-sheet-tab-bar-sheet-inner {
    display: flex;
  }

  .ic-sheet-tab-bar-left-buttons-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    gap: 2px;
    padding: 0 8px;
    color: var(--palette-common-black);
  }

  .ic-sheet-tab-bar-vertical-divider {
    height: 100%;
    width: 0;
  }

  .ic-sheet-tab-bar-right-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: var(--palette-primary-main);
    height: 100%;
    padding: 0 8px;
    gap: 4px;
    flex-shrink: 0;
    width: auto;
  }

  .ic-sheet-tab-bar-text-divider {
    width: 1px;
    height: 60%;
    background-color: var(--palette-grey-300);
  }

  .ic-sheet-tab-bar-right-container :global(.ic-sheet-tab-bar-regional-settings-button),
  .ic-sheet-tab-bar-right-container :global(.ic-sheet-tab-bar-regional-settings-icon-button) {
    color: var(--palette-grey-600);
  }

  .ic-sheet-tab-bar-right-container :global(.ic-sheet-tab-bar-regional-settings-icon-button) {
    display: none;
  }

  :global(.ic-sheet-list-menu-color) {
    width: 12px;
    height: 12px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  :global(.ic-sheet-list-menu-name--selected) {
    font-weight: 700;
  }

  :global(.ic-sheet-list-menu-name--hidden) {
    color: var(--palette-grey-400);
  }

  @media (max-width: 769px) {
    .ic-sheet-tab-bar-sheets {
      padding-left: 4px;
    }

    .ic-sheet-tab-bar-vertical-divider {
      border-right: 1px solid var(--palette-grey-200);
    }

    .ic-sheet-tab-bar-right-container :global(.ic-sheet-tab-bar-regional-settings-button) {
      display: none;
    }

    .ic-sheet-tab-bar-right-container :global(.ic-sheet-tab-bar-regional-settings-icon-button) {
      display: inline-flex;
    }

    .ic-sheet-tab-bar-right-container {
      border-left: 1px solid var(--palette-grey-200);
      gap: 0;
    }
  }
</style>
