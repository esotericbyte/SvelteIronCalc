<!--
  Port of upstream webapp/IronCalc/src/components/Modal/Confirm.tsx: a modal
  asking to confirm an action, with Cancel and a confirm button (red for
  the "destructive" variant) that has the focus (see ModalDialog.svelte).
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  export interface ConfirmProperties {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: Snippet | string;
    confirmLabel?: string;
    cancelLabel?: string;
    closeLabel?: string;
    variant?: "default" | "destructive";
  }
</script>

<script lang="ts">
  import Button from "../Button/Button.svelte";
  import ModalDialog from "./ModalDialog.svelte";

  let {
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "OK",
    cancelLabel = "Cancel",
    closeLabel = "Close",
    variant = "default",
  }: ConfirmProperties = $props();

  let confirmButton: HTMLButtonElement | null = $state(null);

  function handleConfirm(): void {
    onConfirm();
    onClose();
  }
</script>

<ModalDialog
  {open}
  {onClose}
  onConfirm={handleConfirm}
  {title}
  {closeLabel}
  initialFocus={() => confirmButton}
>
  {#if typeof message === "string"}<p>{message}</p>{:else}{@render message()}{/if}
  {#snippet footer()}
    <Button size="sm" variant="secondary" onclick={onClose}>{cancelLabel}</Button>
    <Button
      bind:ref={confirmButton}
      size="sm"
      variant={variant === "destructive" ? "destructive" : "primary"}
      onclick={handleConfirm}
    >
      {confirmLabel}
    </Button>
  {/snippet}
</ModalDialog>
