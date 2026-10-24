<!--
  Port of upstream webapp/IronCalc/src/components/SheetTabBar/SheetTabMenu.tsx:
  the entries of a sheet tab's menu. Hiding and deleting are disabled for
  the last visible sheet.
-->
<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Copy from "@lucide/svelte/icons/copy";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import PaintBucket from "@lucide/svelte/icons/paint-bucket";
  import TextCursorInput from "@lucide/svelte/icons/text-cursor-input";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { t } from "../../i18n";
  import MenuDivider from "../Menu/MenuDivider.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";

  interface Props {
    canDelete: boolean;
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onStartEditing: () => void;
    onOpenColorPicker: () => void;
    onDuplicateSheet: () => void;
    onHideSheet: () => void;
    onDeleteSheet: () => void;
  }

  let {
    canDelete,
    onMoveLeft,
    onMoveRight,
    onStartEditing,
    onOpenColorPicker,
    onDuplicateSheet,
    onHideSheet,
    onDeleteSheet,
  }: Props = $props();
</script>

<MenuItem onClick={onMoveLeft}>
  {#snippet icon()}<ArrowLeft />{/snippet}
  {t("sheet_tab.move_left")}
</MenuItem>
<MenuItem onClick={onMoveRight}>
  {#snippet icon()}<ArrowRight />{/snippet}
  {t("sheet_tab.move_right")}
</MenuItem>
<MenuItem onClick={onStartEditing}>
  {#snippet icon()}<TextCursorInput />{/snippet}
  {t("sheet_tab.rename")}
</MenuItem>
<MenuItem onClick={onOpenColorPicker}>
  {#snippet icon()}<PaintBucket />{/snippet}
  {t("sheet_tab.change_color")}
</MenuItem>
<MenuItem onClick={onDuplicateSheet}>
  {#snippet icon()}<Copy />{/snippet}
  {t("sheet_tab.duplicate")}
</MenuItem>
<MenuItem disabled={!canDelete} onClick={onHideSheet}>
  {#snippet icon()}<EyeOff />{/snippet}
  {t("sheet_tab.hide_sheet")}
</MenuItem>
<MenuDivider />
<MenuItem disabled={!canDelete} destructive onClick={onDeleteSheet}>
  {#snippet icon()}<Trash2 />{/snippet}
  {t("sheet_tab.delete")}
</MenuItem>
