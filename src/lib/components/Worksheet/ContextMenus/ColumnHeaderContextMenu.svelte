<!--
  Port of upstream webapp/IronCalc/src/components/Worksheet/ContextMenus/ColumnHeader.tsx:
  the context menu of the selected columns (insert, move, width, hide and
  show, freeze, delete).
-->
<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import MoveHorizontal from "@lucide/svelte/icons/move-horizontal";
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
    onInsertColumnsLeft: () => void;
    onInsertColumnsRight: () => void;
    onFreezeColumns: () => void;
    onUnfreezeColumns: () => void;
    onDeleteColumns: () => void;
    onHideColumns: () => void;
    onShowHiddenColumns: () => void;
    onMoveColumnsLeft: () => void;
    onMoveColumnsRight: () => void;
    onSetColumnWidth: () => void;
    range: HeaderRange;
    frozenColumnsCount: number;
    hiddenColumnsCount: number;
  }

  let {
    open,
    onClose,
    anchorPosition,
    onInsertColumnsLeft,
    onInsertColumnsRight,
    onFreezeColumns,
    onUnfreezeColumns,
    onDeleteColumns,
    onHideColumns,
    onShowHiddenColumns,
    onMoveColumnsLeft,
    onMoveColumnsRight,
    onSetColumnWidth,
    range,
    frozenColumnsCount,
    hiddenColumnsCount,
  }: Props = $props();

  const { columnStart, columnEnd, columnCount } = $derived(range);
</script>

{#if anchorPosition}
  <Menu {open} {onClose} {anchorPosition}>
    <MenuItem onClick={onInsertColumnsLeft}>
      {#snippet icon()}<Plus />{/snippet}
      {t("context_menu.column_header.insert_columns_before", { count: columnCount })}
    </MenuItem>
    <MenuItem onClick={onInsertColumnsRight}>
      {#snippet icon()}<Plus />{/snippet}
      {t("context_menu.column_header.insert_columns_after", { count: columnCount })}
    </MenuItem>

    <MenuDivider />

    <MenuItem onClick={onMoveColumnsLeft}>
      {#snippet icon()}<ArrowLeft />{/snippet}
      {t("context_menu.column_header.move_columns_left")}
    </MenuItem>
    <MenuItem onClick={onMoveColumnsRight}>
      {#snippet icon()}<ArrowRight />{/snippet}
      {t("context_menu.column_header.move_columns_right")}
    </MenuItem>

    <MenuDivider />

    <MenuItem onClick={onSetColumnWidth}>
      {#snippet icon()}<MoveHorizontal />{/snippet}
      {t("context_menu.column_header.set_column_width")}
    </MenuItem>

    <MenuDivider />

    <MenuItem onClick={onHideColumns}>
      {#snippet icon()}<EyeOff />{/snippet}
      {columnCount === 1
        ? t("context_menu.column_header.hide_column", { column: columnStart })
        : t("context_menu.column_header.hide_columns", { columnStart, columnEnd })}
    </MenuItem>
    {#if hiddenColumnsCount > 0}
      <MenuItem onClick={onShowHiddenColumns}>
        {#snippet icon()}<Eye />{/snippet}
        {t("context_menu.column_header.show_hidden_columns")}
      </MenuItem>
    {/if}

    <MenuDivider />

    <MenuItem onClick={onFreezeColumns}>
      {#snippet icon()}<Snowflake />{/snippet}
      {t("context_menu.column_header.freeze_columns", { column: columnStart })}
    </MenuItem>
    {#if frozenColumnsCount > 0}
      <MenuItem onClick={onUnfreezeColumns}>
        {#snippet icon()}<Snowflake />{/snippet}
        {t("context_menu.column_header.unfreeze_columns")}
      </MenuItem>
    {/if}

    <MenuDivider />

    <MenuItem destructive onClick={onDeleteColumns}>
      {#snippet icon()}<Trash2 />{/snippet}
      {columnCount === 1
        ? t("context_menu.column_header.delete_column", { column: columnStart })
        : t("context_menu.column_header.delete_columns", { columnStart, columnEnd })}
    </MenuItem>
  </Menu>
{/if}
