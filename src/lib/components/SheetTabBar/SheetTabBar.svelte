<!--
  Port of upstream webapp/IronCalc/src/components/SheetTabBar/SheetTabBar.tsx
  and SheetListMenu.tsx, read-only: the sheet list menu and the tabs of the
  visible sheets. Adding sheets and the regional settings button come with
  editing and the right drawer (see docs/parity.md).
-->
<script lang="ts">
  import MenuIcon from "@lucide/svelte/icons/menu";
  import Check from "@lucide/svelte/icons/check";
  import { Menu, Portal } from "@skeletonlabs/skeleton-svelte";
  import { t } from "../../i18n";
  import SheetTab from "./SheetTab.svelte";
  import type { SheetOptions } from "./types";

  interface Props {
    sheets: SheetOptions[];
    selectedIndex: number;
    onSheetSelected: (index: number) => void;
  }

  let { sheets, selectedIndex, onSheetSelected }: Props = $props();

  const visibleSheets = $derived(
    sheets
      .map((sheet, index) => ({ ...sheet, index }))
      .filter((sheet) => sheet.state === "visible"),
  );

  function isWhiteColor(color: string): boolean {
    return ["#FFF", "#FFFFFF"].includes(color);
  }

  const hasColors = $derived(sheets.some((sheet) => !isWhiteColor(sheet.color)));
</script>

<div class="ic-sheet-tab-bar-container">
  <div class="ic-sheet-tab-bar-left-buttons-container">
    <Menu
      onSelect={(details) => onSheetSelected(Number(details.value))}
      positioning={{ placement: "top-start" }}
    >
      <Menu.Trigger
        class="ic-sheet-tab-bar-icon-button btn-icon btn-icon-sm hover:preset-tonal"
        aria-label={t("navigation.sheet_list")}
        title={t("navigation.sheet_list")}
      >
        <MenuIcon />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            class="ic-sheet-list-menu card bg-surface-50-950 shadow-xl p-1 text-xs"
          >
            {#each sheets as sheet, index (sheet.sheetId)}
              <Menu.Item
                value={`${index}`}
                class="ic-sheet-list-menu-item btn btn-sm justify-start w-full hover:preset-tonal"
              >
                <span class="ic-sheet-list-menu-check">
                  {#if index === selectedIndex}<Check />{/if}
                </span>
                {#if hasColors}
                  <span
                    class="ic-sheet-list-menu-color"
                    style:background-color={sheet.color}
                  ></span>
                {/if}
                <Menu.ItemText>
                  <span
                    class={[
                      index === selectedIndex &&
                        "ic-sheet-list-menu-name--selected",
                      sheet.state !== "visible" &&
                        "ic-sheet-list-menu-name--hidden",
                    ]}
                  >
                    {sheet.name}
                  </span>
                </Menu.ItemText>
              </Menu.Item>
            {/each}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu>
  </div>
  <div class="ic-sheet-tab-bar-vertical-divider"></div>
  <div class="ic-sheet-tab-bar-sheets">
    <div class="ic-sheet-tab-bar-sheet-inner" role="tablist">
      {#each visibleSheets as tab (tab.sheetId)}
        <SheetTab
          name={tab.name}
          color={tab.color}
          selected={tab.index === selectedIndex}
          onSelected={() => onSheetSelected(tab.index)}
        />
      {/each}
    </div>
  </div>
</div>

<style>
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

  .ic-sheet-tab-bar-left-buttons-container :global(svg) {
    width: 16px;
    height: 16px;
  }

  .ic-sheet-tab-bar-vertical-divider {
    height: 100%;
    width: 0;
  }

  :global(.ic-sheet-list-menu) {
    min-width: 160px;
    max-height: 60vh;
    overflow-y: auto;
    z-index: 1300;
  }

  :global(.ic-sheet-list-menu-check) {
    display: inline-flex;
    width: 14px;
  }

  :global(.ic-sheet-list-menu-check svg) {
    width: 14px;
    height: 14px;
  }

  :global(.ic-sheet-list-menu-color) {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  :global(.ic-sheet-list-menu-name--selected) {
    font-weight: 600;
  }

  :global(.ic-sheet-list-menu-name--hidden) {
    opacity: 0.6;
  }

  @media (max-width: 769px) {
    .ic-sheet-tab-bar-sheets {
      padding-left: 4px;
    }

    .ic-sheet-tab-bar-vertical-divider {
      border-right: 1px solid var(--palette-grey-200);
    }
  }
</style>
