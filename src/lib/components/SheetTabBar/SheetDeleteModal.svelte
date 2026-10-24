<!--
  Port of upstream webapp/IronCalc/src/components/SheetTabBar/SheetDeleteModal.tsx:
  asks to confirm deleting a sheet.
-->
<script lang="ts">
  import { t } from "../../i18n";
  import Confirm from "../Modal/Confirm.svelte";

  interface Props {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
    sheetName: string;
  }

  let { open, onClose, onDelete, sheetName }: Props = $props();
</script>

<Confirm
  {open}
  {onClose}
  onConfirm={onDelete}
  title={t("sheet_delete.title")}
  message={t("sheet_delete.message", { sheetName })}
  confirmLabel={t("sheet_delete.confirm")}
  cancelLabel={t("sheet_delete.cancel")}
  variant="destructive"
/>
