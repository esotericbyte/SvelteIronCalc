<!--
  Port of upstream webapp/IronCalc/src/components/Worksheet/ContextMenus/Cell.tsx:
  the context menu of a cell (cut, copy, paste, and the insert and delete
  submenus).
-->
<script lang="ts">
  import Clipboard from "@lucide/svelte/icons/clipboard";
  import Copy from "@lucide/svelte/icons/copy";
  import Plus from "@lucide/svelte/icons/plus";
  import Scissors from "@lucide/svelte/icons/scissors";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { t } from "../../../i18n";
  import Menu from "../../Menu/Menu.svelte";
  import MenuDivider from "../../Menu/MenuDivider.svelte";
  import MenuItem from "../../Menu/MenuItem.svelte";
  import MenuItemWithSubmenu from "../../Menu/MenuItemWithSubmenu.svelte";

  interface Props {
    open: boolean;
    onClose: () => void;
    anchorPosition: { x: number; y: number } | null;
    column: string;
    row: number;
    onInsertColumnLeft: () => void;
    onInsertColumnRight: () => void;
    onInsertRowAbove: () => void;
    onInsertRowBelow: () => void;
    onDeleteColumn: () => void;
    onDeleteRow: () => void;
    onCut: () => void;
    onCopy: () => void;
    onPaste: () => void;
  }

  let {
    open,
    onClose,
    anchorPosition,
    column,
    row,
    onInsertColumnLeft,
    onInsertColumnRight,
    onInsertRowAbove,
    onInsertRowBelow,
    onDeleteColumn,
    onDeleteRow,
    onCut,
    onCopy,
    onPaste,
  }: Props = $props();
</script>

{#if anchorPosition}
  <Menu {open} {onClose} {anchorPosition}>
    <MenuItem onClick={onCut}>
      {#snippet icon()}<Scissors />{/snippet}
      {t("context_menu.cell.cut")}
    </MenuItem>
    <MenuItem onClick={onCopy}>
      {#snippet icon()}<Copy />{/snippet}
      {t("context_menu.cell.copy")}
    </MenuItem>
    <MenuItem onClick={onPaste}>
      {#snippet icon()}<Clipboard />{/snippet}
      {t("context_menu.cell.paste")}
    </MenuItem>

    <MenuDivider />

    <MenuItemWithSubmenu>
      {#snippet icon()}<Plus />{/snippet}
      {#snippet submenu()}
        <MenuItem onClick={onInsertColumnLeft}>
          {t("context_menu.cell.insert_column_left")}
        </MenuItem>
        <MenuItem onClick={onInsertColumnRight}>
          {t("context_menu.cell.insert_column_right")}
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onInsertRowAbove}>
          {t("context_menu.cell.insert_row_above")}
        </MenuItem>
        <MenuItem onClick={onInsertRowBelow}>
          {t("context_menu.cell.insert_row_below")}
        </MenuItem>
      {/snippet}
      {t("context_menu.cell.insert")}
    </MenuItemWithSubmenu>

    <MenuItemWithSubmenu>
      {#snippet icon()}<Trash2 />{/snippet}
      {#snippet submenu()}
        <MenuItem onClick={onDeleteColumn}>
          {t("context_menu.cell.delete_column", { column })}
        </MenuItem>
        <MenuItem onClick={onDeleteRow}>
          {t("context_menu.cell.delete_row", { row })}
        </MenuItem>
      {/snippet}
      {t("context_menu.cell.delete")}
    </MenuItemWithSubmenu>
  </Menu>
{/if}
