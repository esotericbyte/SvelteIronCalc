<!--
  Port of upstream webapp/IronCalc/src/components/Modal/Alert.tsx: a modal
  with a title, a message and an OK button (see ModalDialog.svelte).
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  export interface AlertProperties {
    open: boolean;
    onClose: () => void;
    title: string;
    message: Snippet | string;
    confirmLabel?: string;
    closeLabel?: string;
  }
</script>

<script lang="ts">
  import Button from "../Button/Button.svelte";
  import ModalDialog from "./ModalDialog.svelte";

  let {
    open,
    onClose,
    title,
    message,
    confirmLabel = "OK",
    closeLabel = "Close",
  }: AlertProperties = $props();

  let confirmButton: HTMLButtonElement | null = $state(null);
</script>

<ModalDialog
  {open}
  {onClose}
  onConfirm={onClose}
  {title}
  {closeLabel}
  initialFocus={() => confirmButton}
>
  {#if typeof message !== "string"}
    {@render message()}
  {:else if message}
    <p>{message}</p>
  {/if}
  {#snippet footer()}
    <Button bind:ref={confirmButton} size="sm" onclick={onClose}>
      {confirmLabel}
    </Button>
  {/snippet}
</ModalDialog>
