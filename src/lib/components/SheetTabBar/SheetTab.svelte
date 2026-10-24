<!--
  Port of upstream webapp/IronCalc/src/components/SheetTabBar/SheetTab.tsx:
  selecting the sheet, keeping the cell editor focused when the tab is
  clicked to point at another sheet, renaming it in place (double click or
  the menu), and the tab menu (right click or the chevron) with its color
  picker and delete dialog. The editing affordances follow `canEdit`.
-->
<script lang="ts">
  import type { Color, IronCalcTheme, Model } from "@ironcalc/wasm";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { tick } from "svelte";
  import { t } from "../../i18n";
  import ColorPicker from "../ColorPicker/ColorPicker.svelte";
  import Menu from "../Menu/Menu.svelte";
  import SheetDeleteModal from "./SheetDeleteModal.svelte";
  import SheetTabMenu from "./SheetTabMenu.svelte";

  interface Props {
    name: string;
    color: string;
    selected: boolean;
    onSelected: () => void;
    canEdit: boolean;
    onColorChanged: (color: Color) => void;
    onRenamed: (name: string) => void;
    canDelete: boolean;
    onDeleted: () => void;
    onDuplicateSheet: () => void;
    onHideSheet: () => void;
    currentTheme: IronCalcTheme;
    onMoveSheet: (fromIndex: number, toIndex: number) => void;
    model: Model;
    /** True while a formula being edited can take a reference to another sheet. */
    isReferenceMode: () => boolean;
    /** Gives the focus back to the workbook after a dialog closed. */
    restoreFocus: () => void;
  }

  let {
    name,
    color,
    selected,
    onSelected,
    canEdit,
    onColorChanged,
    onRenamed,
    canDelete,
    onDeleted,
    onDuplicateSheet,
    onHideSheet,
    currentTheme,
    onMoveSheet,
    model,
    isReferenceMode,
    restoreFocus,
  }: Props = $props();

  let menuOpen = $state(false);
  let menuAnchorPosition = $state({ x: 0, y: 0 });
  let colorPickerOpen = $state(false);
  let deleteDialogOpen = $state(false);

  let isEditing = $state(false);
  let editingName = $state("");
  let inputWidth = $state(0);

  let tabElement: HTMLDivElement | null = $state(null);
  let menuButton: HTMLButtonElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);
  let measureElement: HTMLSpanElement | null = $state(null);

  $effect(() => {
    if (isEditing && inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });

  $effect.pre(() => {
    if (!isEditing) {
      editingName = name;
    }
  });

  // Fit the rename field to its text
  $effect(() => {
    void editingName;
    if (isEditing && measureElement) {
      inputWidth = Math.max(measureElement.offsetWidth + 8, 6);
    }
  });

  function getMenuAnchorPosition(): { x: number; y: number } {
    const rect = tabElement?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    return { x: rect.right - 24, y: rect.top };
  }

  function handleOpenMenu(event: MouseEvent): void {
    if (!canEdit) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    if (menuOpen) {
      handleCloseMenu();
    } else {
      onSelected();
      menuAnchorPosition = getMenuAnchorPosition();
      menuOpen = true;
    }
  }

  function handleContextMenu(event: MouseEvent): void {
    if (!canEdit) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onSelected();
    menuAnchorPosition = getMenuAnchorPosition();
    menuOpen = true;
  }

  function handleCloseMenu(): void {
    menuOpen = false;
    // the color picker and the delete dialog take the focus themselves
    requestAnimationFrame(() => {
      if (!colorPickerOpen && !deleteDialogOpen) {
        menuButton?.focus();
      }
    });
  }

  function handleStartEditing(): void {
    if (!canEdit) {
      return;
    }
    editingName = name;
    inputWidth = Math.max(name.length * 7 + 8, 6);
    isEditing = true;
  }

  function handleSave(): void {
    if (!isEditing) {
      return;
    }
    if (editingName.trim() !== "") {
      onRenamed(editingName.trim());
    } else {
      editingName = name;
    }
    isEditing = false;
  }

  function handleCancel(): void {
    editingName = name;
    isEditing = false;
  }
</script>

<div
  bind:this={tabElement}
  class={["ic-sheet-tab", selected && "ic-sheet-tab--selected"]}
  style:border-bottom-color={color}
  role="tab"
  tabindex={selected ? 0 : -1}
  aria-selected={selected}
  onclick={(event) => {
    if (!isEditing) {
      onSelected();
    }
    event.stopPropagation();
    event.preventDefault();
  }}
  ondblclick={(event) => {
    event.stopPropagation();
    event.preventDefault();
    handleStartEditing();
  }}
  oncontextmenu={handleContextMenu}
  onpointerdown={(event) => {
    // keep the focus in the editor, so the next click picks a cell there
    if (isReferenceMode()) {
      event.stopPropagation();
      event.preventDefault();
    }
  }}
  onkeydown={(event) => {
    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onSelected();
    }
  }}
>
  {#if isEditing}
    <span class="ic-sheet-tab-hidden-measure" bind:this={measureElement}
      >{editingName || " "}</span
    >
    <input
      bind:this={inputElement}
      bind:value={editingName}
      style:width={`${inputWidth}px`}
      class="ic-sheet-tab-input"
      aria-label={t("sheet_tab.rename")}
      onkeydown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleSave();
          restoreFocus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          handleCancel();
          restoreFocus();
        }
        event.stopPropagation();
      }}
      onblur={handleSave}
      onclick={(event) => event.stopPropagation()}
      spellcheck={false}
    />
    <button
      class="ic-sheet-tab-menu-button"
      disabled
      type="button"
      aria-hidden="true"
      tabindex="-1"
    >
      <ChevronDown />
    </button>
  {:else}
    <div class="ic-sheet-tab-name">{name}</div>
    {#if canEdit}
      <button
        bind:this={menuButton}
        class={["ic-sheet-tab-menu-button", menuOpen && "ic-sheet-tab-menu-button--active"]}
        onclick={handleOpenMenu}
        type="button"
        aria-label={t("sheet_tab.open_menu")}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <ChevronDown />
      </button>
    {/if}
  {/if}
</div>

<Menu open={menuOpen} onClose={handleCloseMenu} anchorPosition={menuAnchorPosition}>
  <SheetTabMenu
    {canDelete}
    onStartEditing={handleStartEditing}
    onOpenColorPicker={() => (colorPickerOpen = true)}
    {onDuplicateSheet}
    {onHideSheet}
    onDeleteSheet={() => (deleteDialogOpen = true)}
    onMoveLeft={() => {
      const selectedIndex = model.getSelectedSheet();
      if (selectedIndex > 0) {
        onMoveSheet(selectedIndex, selectedIndex - 1);
      }
    }}
    onMoveRight={() => {
      const selectedIndex = model.getSelectedSheet();
      const sheetCount = model.getWorksheetsProperties().length;
      if (selectedIndex < sheetCount - 1) {
        onMoveSheet(selectedIndex, selectedIndex + 1);
      }
    }}
  />
</Menu>

<ColorPicker
  {color}
  defaultColor="#FFFFFF"
  title={t("color_picker.no_fill")}
  onChange={(nextColor) => {
    onColorChanged(nextColor);
    colorPickerOpen = false;
    restoreFocus();
  }}
  onClose={() => {
    colorPickerOpen = false;
    tick().then(() => menuButton?.focus());
  }}
  anchorEl={() => tabElement}
  open={colorPickerOpen}
  placement="top"
  theme={currentTheme}
/>

<SheetDeleteModal
  open={deleteDialogOpen}
  onClose={() => {
    deleteDialogOpen = false;
    restoreFocus();
  }}
  onDelete={onDeleted}
  sheetName={name}
/>

<style>
  /* Port of upstream SheetTabBar/sheet-tab.css */
  .ic-sheet-tab {
    display: flex;
    align-items: center;
    min-width: 40px;
    margin-right: 12px;
    padding: 0 4px 0 6px;
    line-height: 37px;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    font-weight: 400;
    color: var(--palette-common-black);
  }

  .ic-sheet-tab--selected {
    font-weight: 600;
    background-color: var(--palette-grey-50);
  }

  .ic-sheet-tab:hover {
    background-color: var(--palette-grey-200);
  }

  .ic-sheet-tab-name {
    width: 100%;
    margin-right: 5px;
    font-size: 12px;
    text-align: center;
    white-space: nowrap;
    user-select: none;
  }

  .ic-sheet-tab-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    min-width: 0;
    padding: 0;
    flex-shrink: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    font-weight: inherit;
    cursor: pointer;
  }

  .ic-sheet-tab-menu-button:hover {
    background-color: var(--palette-grey-300);
  }

  .ic-sheet-tab-menu-button:active,
  .ic-sheet-tab-menu-button--active {
    background-color: var(--palette-grey-300);
  }

  .ic-sheet-tab-menu-button:disabled {
    pointer-events: none;
  }

  .ic-sheet-tab-menu-button :global(svg) {
    width: 14px;
    height: 14px;
  }

  .ic-sheet-tab-hidden-measure {
    position: absolute;
    visibility: hidden;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    white-space: pre;
    margin: 0;
    padding: 0;
    font-family: var(--typography-font-family);
    font-size: 12px;
    font-weight: inherit;
  }

  .ic-sheet-tab-input {
    min-width: 6px;
    height: 26px;
    margin-right: 2px;
    flex-grow: 1;
    padding: 0 4px;
    border: 1px solid var(--palette-primary-main);
    border-radius: 4px;
    background-color: var(--palette-common-white);
    color: var(--palette-common-black);
    text-align: center;
    font-family: var(--typography-font-family);
    font-size: 12px;
    font-weight: inherit;
    line-height: 1;
    will-change: width;
  }

  .ic-sheet-tab-input:focus {
    outline: none;
    border-color: var(--palette-primary-main);
  }

  @media (max-width: 769px) {
    .ic-sheet-tab {
      margin-right: 4px;
    }
  }
</style>
