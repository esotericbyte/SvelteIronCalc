<!--
  Port of upstream webapp/IronCalc/src/components/Modal/ModalDialog.tsx with
  the header and footer that Alert, Confirm and Prompt share. It is a
  Skeleton Dialog, which brings the focus trap, Escape to close and focus
  restoring that upstream's ModalDialog, useModalFocus and useModalKeyDown
  implement by hand; Ctrl/Cmd+Enter confirms, as upstream. Like upstream it
  portals into the widget's `.ic-root`.
-->
<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
  import type { Snippet } from "svelte";
  import { getRootElement } from "../rootContext";

  interface Props {
    open: boolean;
    onClose: () => void;
    /** Ctrl/Cmd+Enter */
    onConfirm?: () => void;
    title: string;
    closeLabel: string;
    /** The element focused when the dialog opens. */
    initialFocus?: () => HTMLElement | null;
    class?: string;
    children: Snippet;
    footer: Snippet;
  }

  let {
    open,
    onClose,
    onConfirm,
    title,
    closeLabel,
    initialFocus,
    class: className,
    children,
    footer,
  }: Props = $props();

  const root = getRootElement();
</script>

<Dialog
  {open}
  initialFocusEl={initialFocus}
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
        class={[
          "ic-modal-dialog card bg-surface-50-950 w-full max-w-sm space-y-4 p-4 shadow-xl",
          className,
        ]}
        onkeydown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onConfirm?.();
          }
        }}
      >
        <header class="flex items-center justify-between gap-2">
          <Dialog.Title class="truncate text-base font-semibold">{title}</Dialog.Title>
          <Dialog.CloseTrigger
            class="btn-icon btn-icon-sm hover:preset-tonal"
            aria-label={closeLabel}
          >
            <X size={16} />
          </Dialog.CloseTrigger>
        </header>
        <div class="ic-modal-dialog-body flex flex-col gap-2 text-sm">
          {@render children()}
        </div>
        <footer
          class="ic-modal-dialog-footer flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end"
        >
          {@render footer()}
        </footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
