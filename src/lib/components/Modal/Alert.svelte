<!--
  Port of upstream webapp/IronCalc/src/components/Modal/Alert.tsx: a modal
  with a title, a message and an OK button. It is a Skeleton Dialog, which
  brings the focus trap, Escape to close and focus restoring that upstream's
  ModalDialog, useModalFocus and useModalKeyDown implement by hand. Like
  upstream it portals into the widget's `.ic-root`.
-->
<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
  import { getRootElement } from "../rootContext";

  interface Props {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    closeLabel?: string;
  }

  let {
    open,
    onClose,
    title,
    message,
    confirmLabel = "OK",
    closeLabel = "Close",
  }: Props = $props();

  const root = getRootElement();
  let confirmButton: HTMLButtonElement | null = $state(null);
</script>

<Dialog
  {open}
  initialFocusEl={() => confirmButton}
  onOpenChange={(details) => {
    if (!details.open) {
      onClose();
    }
  }}
>
  <Portal target={root() ?? undefined}>
    <Dialog.Backdrop class="ic-modal-dialog-backdrop fixed inset-0 z-50 bg-surface-50-950/50" />
    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <Dialog.Content
        class="ic-modal-dialog card bg-surface-50-950 w-full max-w-sm space-y-4 p-4 shadow-xl"
      >
        <header class="flex items-center justify-between gap-2">
          <Dialog.Title class="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.CloseTrigger
            class="btn-icon btn-icon-sm hover:preset-tonal"
            aria-label={closeLabel}
          >
            <X size={16} />
          </Dialog.CloseTrigger>
        </header>
        <Dialog.Description class="text-sm">{message}</Dialog.Description>
        <footer class="flex justify-end">
          <button
            bind:this={confirmButton}
            type="button"
            class="btn btn-sm preset-filled-primary-500"
            onclick={onClose}
          >
            {confirmLabel}
          </button>
        </footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
