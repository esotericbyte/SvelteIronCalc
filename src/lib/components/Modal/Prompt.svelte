<!--
  Port of upstream webapp/IronCalc/src/components/Modal/Prompt.tsx: a modal
  asking for one value, with Cancel and a submit button (see
  ModalDialog.svelte). The field starts with `defaultValue` each time the
  dialog opens and has the focus; Enter in it moves the focus to the submit
  button, as upstream. `inputProps` go to the Input (e.g. a number input
  with a unit).
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { InputProperties } from "../Input/Input.svelte";

  export interface PromptProperties {
    open: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    message?: Snippet | string;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    closeLabel?: string;
    class?: string;
    inputProps?: Omit<InputProperties, "value" | "ref">;
  }
</script>

<script lang="ts">
  import Button from "../Button/Button.svelte";
  import Input from "../Input/Input.svelte";
  import ModalDialog from "./ModalDialog.svelte";

  let {
    open,
    onClose,
    onSubmit,
    title,
    message,
    defaultValue = "",
    confirmLabel = "OK",
    cancelLabel = "Cancel",
    closeLabel = "Close",
    class: className,
    inputProps,
  }: PromptProperties = $props();

  let value: string | number = $state("");
  let input: HTMLInputElement | null = $state(null);
  let container: HTMLDivElement | null = $state(null);
  let submitButton: HTMLButtonElement | null = $state(null);

  $effect.pre(() => {
    if (open) {
      value = defaultValue;
    }
  });

  function handleSubmit(): void {
    onSubmit(`${value ?? ""}`);
    onClose();
  }
</script>

<ModalDialog
  {open}
  {onClose}
  onConfirm={handleSubmit}
  {title}
  {closeLabel}
  class={className}
  initialFocus={() =>
    input ?? container?.querySelector<HTMLElement>("input, .ic-input-number-display") ?? null}
>
  {#if message}
    {#if typeof message === "string"}<p>{message}</p>{:else}{@render message()}{/if}
  {/if}
  <div bind:this={container}>
    <Input
      {...inputProps}
      bind:value
      bind:ref={input}
      onkeydown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        } else if (event.key === "Enter") {
          event.preventDefault();
          submitButton?.focus();
        }
        inputProps?.onkeydown?.(event);
      }}
    />
  </div>
  {#snippet footer()}
    <Button size="sm" variant="secondary" onclick={onClose}>{cancelLabel}</Button>
    <Button bind:ref={submitButton} size="sm" onclick={handleSubmit}>
      {confirmLabel}
    </Button>
  {/snippet}
</ModalDialog>
