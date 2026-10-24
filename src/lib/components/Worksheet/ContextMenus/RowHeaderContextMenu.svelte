<!--
  Port of upstream webapp/IronCalc/src/components/Worksheet/ContextMenus/RowHeader.tsx:
  the context menu of the selected rows (insert, move, height, hide and
  show, freeze, delete).
-->
<script lang="ts">
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import MoveVertical from "@lucide/svelte/icons/move-vertical";
  import Plus from "@lucide/svelte/icons/plus";
  import Snowflake from "@lucide/svelte/icons/snowflake";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { t } from "../../../i18n";
  import Menu from "../../Menu/Menu.svelte";
  import MenuDivider from "../../Menu/MenuDivider.svelte";
  import MenuItem from "../../Menu/MenuItem.svelte";
  import type { HeaderRange } from "./types";

  interface Props {
    open: boolean;
    onClose: () => void;
    anchorPosition: { x: number; y: number } | null;
    onInsertRowsAbove: () => void;
    onInsertRowsBelow: () => void;
    onFreezeRows: () => void;
    onUnfreezeRows: () => void;
    onDeleteRows: () => void;
    onMoveRowsUp: () => void;
    onMoveRowsDown: () => void;
    onSetRowHeight: () => void;
    onHideRows: () => void;
    onShowHiddenRows: () => void;
    range: HeaderRange;
    frozenRowsCount: number;
  }

  let {
    open,
    onClose,
    anchorPosition,
    onInsertRowsAbove,
    onInsertRowsBelow,
    onFreezeRows,
    onUnfreezeRows,
    onDeleteRows,
    onMoveRowsUp,
    onMoveRowsDown,
    onSetRowHeight,
    onHideRows,
    onShowHiddenRows,
    range,
    frozenRowsCount,
  }: Props = $props();

  const { rowStart, rowEnd } = $derived(range);
  const rowCount = $derived(rowEnd - rowStart + 1);
</script>

{#if anchorPosition}
  <Menu {open} {onClose} {anchorPosition}>
    <MenuItem onClick={onInsertRowsAbove}>
      {#snippet icon()}<Plus />{/snippet}
      {t("context_menu.row_header.insert_rows_above", { count: rowCount })}
    </MenuItem>
    <MenuItem onClick={onInsertRowsBelow}>
      {#snippet icon()}<Plus />{/snippet}
      {t("context_menu.row_header.insert_rows_below", { count: rowCount })}
    </MenuItem>

    <MenuDivider />

    <MenuItem onClick={onMoveRowsUp}>
      {#snippet icon()}<ArrowUp />{/snippet}
      {t("context_menu.row_header.move_rows_up")}
    </MenuItem>
    <MenuItem onClick={onMoveRowsDown}>
      {#snippet icon()}<ArrowDown />{/snippet}
      {t("context_menu.row_header.move_rows_down")}
    </MenuItem>

    <MenuDivider />

    <MenuItem onClick={onSetRowHeight}>
      {#snippet icon()}<MoveVertical />{/snippet}
      {t("context_menu.row_header.set_row_height")}
    </MenuItem>

    <MenuDivider />

    <MenuItem onClick={onHideRows}>
      {#snippet icon()}<EyeOff />{/snippet}
      {rowCount === 1
        ? t("context_menu.row_header.hide_row", { row: rowStart })
        : t("context_menu.row_header.hide_rows", { rowStart, rowEnd })}
    </MenuItem>
    <MenuItem onClick={onShowHiddenRows}>
      {#snippet icon()}<Eye />{/snippet}
      {t("context_menu.row_header.show_hidden_rows")}
    </MenuItem>

    <MenuDivider />

    <MenuItem onClick={onFreezeRows}>
      {#snippet icon()}<Snowflake />{/snippet}
      {t("context_menu.row_header.freeze_rows", { row: rowStart })}
    </MenuItem>
    {#if frozenRowsCount > 0}
      <MenuItem onClick={onUnfreezeRows}>
        {#snippet icon()}<Snowflake />{/snippet}
        {t("context_menu.row_header.unfreeze_rows")}
      </MenuItem>
    {/if}

    <MenuDivider />

    <MenuItem destructive onClick={onDeleteRows}>
      {#snippet icon()}<Trash2 />{/snippet}
      {rowCount === 1
        ? t("context_menu.row_header.delete_row", { row: rowStart })
        : t("context_menu.row_header.delete_rows", { rowStart, rowEnd })}
    </MenuItem>
  </Menu>
{/if}
