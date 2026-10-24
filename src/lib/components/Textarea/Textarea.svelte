<!--
  Port of upstream webapp/IronCalc/src/components/Textarea/Textarea.tsx: a
  multiline field with an optional label, helper text and end adornment,
  styled with Skeleton's `label` and `textarea` classes. Like upstream it
  keeps its keys and clipboard events from reaching the sheet.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  export type TextareaSize = "sm" | "md";

  export interface TextareaProperties extends HTMLTextareaAttributes {
    size?: TextareaSize;
    label?: Snippet | string;
    helperText?: Snippet | string;
    error?: boolean;
    endAdornment?: Snippet | string;
    value?: string;
  }
</script>

<script lang="ts">
  let {
    size = "md",
    label,
    helperText,
    error = false,
    disabled = false,
    required,
    endAdornment,
    id: idProperty,
    class: className,
    value = $bindable(),
    ...rest
  }: TextareaProperties = $props();

  const autoId = $props.id();
  const id = $derived(idProperty ?? autoId);
  const helperId = $derived(`${id}-helper`);
</script>

{#snippet text(content: Snippet | string)}
  {#if typeof content === "string"}{content}{:else}{@render content()}{/if}
{/snippet}

<div class={["ic-textarea label", className]}>
  {#if label}
    <label for={id} class="label-text" data-required={required || undefined}>
      {@render text(label)}
    </label>
  {/if}
  <div class="relative">
    <textarea
      {id}
      bind:value
      {disabled}
      {required}
      aria-invalid={error || undefined}
      aria-describedby={helperText ? helperId : undefined}
      class={["textarea", size === "sm" ? "text-xs" : "text-sm", error && "border-error-500"]}
      spellcheck={false}
      onkeydown={(event) => event.stopPropagation()}
      onclick={(event) => event.stopPropagation()}
      onpaste={(event) => event.stopPropagation()}
      oncopy={(event) => event.stopPropagation()}
      oncut={(event) => event.stopPropagation()}
      {...rest}
    ></textarea>
    {#if endAdornment}
      <span class="ic-textarea-end-adornment absolute right-2 bottom-2 text-xs opacity-60">
        {@render text(endAdornment)}
      </span>
    {/if}
  </div>
  {#if helperText}
    <p id={helperId} class={["text-xs", error ? "text-error-500" : "opacity-60"]}>
      {@render text(helperText)}
    </p>
  {/if}
</div>
