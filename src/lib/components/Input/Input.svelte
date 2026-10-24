<!--
  Port of upstream webapp/IronCalc/src/components/Input/Input.tsx: a text
  field with an optional label, helper text and start / end adornments,
  styled with Skeleton's `label`, `input` and `input-group` classes.
  `value` is bindable. With `type="number"` it is upstream's number input:
  a [−] value [+] stepper (Shift steps by ten, `min` / `max` clamp) whose
  value turns into a field when clicked. Like upstream it keeps its keys and
  clipboard events from reaching the sheet.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  export type InputSize = "sm" | "md";

  export interface InputProperties extends Omit<HTMLInputAttributes, "size"> {
    size?: InputSize;
    label?: Snippet | string;
    helperText?: Snippet | string;
    error?: boolean;
    startAdornment?: Snippet | string;
    endAdornment?: Snippet | string;
    /** The input element (the field of a number input only while editing), bindable. */
    ref?: HTMLInputElement | null;
  }
</script>

<script lang="ts">
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import IconButton from "../Button/IconButton.svelte";

  let {
    size = "md",
    label,
    helperText,
    error = false,
    disabled = false,
    startAdornment,
    endAdornment,
    required,
    id: idProperty,
    class: className,
    value = $bindable(),
    ref = $bindable(null),
    onkeydown,
    ...rest
  }: InputProperties = $props();

  const autoId = $props.id();
  const id = $derived(idProperty ?? autoId);
  const helperId = $derived(`${id}-helper`);
  const isNumber = $derived(rest.type === "number");
  let editMode = $state(false);

  function step(direction: "up" | "down", event: MouseEvent): void {
    const current = Number(value) || 0;
    const baseStep =
      rest.step === undefined || rest.step === null || rest.step === "any"
        ? 1
        : Number(rest.step) || 1;
    const stepSize = event.shiftKey ? baseStep * 10 : baseStep;
    const minimum = rest.min != null ? Number(rest.min) : -Infinity;
    const maximum = rest.max != null ? Number(rest.max) : Infinity;
    const next = direction === "up" ? current + stepSize : current - stepSize;
    value = `${Math.max(minimum, Math.min(maximum, next))}`;
  }

  function focusOnMount(element: HTMLInputElement): void {
    element.focus();
  }

  const stop = (event: Event) => event.stopPropagation();
</script>

{#snippet text(content: Snippet | string)}
  {#if typeof content === "string"}{content}{:else}{@render content()}{/if}
{/snippet}

<div class={["ic-input label", className]}>
  {#if label}
    <label for={id} class="label-text" data-required={required || undefined}>
      {@render text(label)}
    </label>
  {/if}

  {#if isNumber}
    <div
      class={[
        "ic-input-control is-number-input input-group grid-cols-[auto_1fr_auto] items-center",
        size === "sm" ? "text-xs" : "text-sm",
        error && "border-error-500",
        disabled && "opacity-50",
      ]}
    >
      <IconButton
        aria-label="Decrease"
        size="xs"
        {disabled}
        class="ic-input-number-btn"
        onclick={(event) => {
          event.stopPropagation();
          step("down", event);
        }}
      >
        {#snippet icon()}<Minus />{/snippet}
      </IconButton>
      {#if editMode}
        <input
          bind:this={ref}
          {id}
          bind:value
          {disabled}
          {required}
          aria-invalid={error || undefined}
          aria-describedby={helperText ? helperId : undefined}
          spellcheck={false}
          class="ic-input-number-field text-center"
          {...rest}
          {@attach focusOnMount}
          onblur={() => (editMode = false)}
          onkeydown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") {
              editMode = false;
            } else if (event.key === "Enter") {
              editMode = false;
              onkeydown?.(event);
            }
          }}
          onclick={stop}
          onpaste={stop}
          oncopy={stop}
          oncut={stop}
          onfocus={(event) => event.currentTarget.select()}
        />
      {:else}
        <button
          type="button"
          {id}
          class="ic-input-number-display flex justify-center gap-1"
          {disabled}
          aria-describedby={helperText ? helperId : undefined}
          onclick={(event) => {
            event.stopPropagation();
            editMode = true;
          }}
        >
          <span>{value}</span>
          {#if endAdornment}
            <span class="ic-input-number-unit opacity-60">{@render text(endAdornment)}</span>
          {/if}
        </button>
      {/if}
      <IconButton
        aria-label="Increase"
        size="xs"
        {disabled}
        class="ic-input-number-btn"
        onclick={(event) => {
          event.stopPropagation();
          step("up", event);
        }}
      >
        {#snippet icon()}<Plus />{/snippet}
      </IconButton>
    </div>
  {:else if startAdornment || endAdornment}
    <div
      class={[
        "ic-input-control input-group",
        startAdornment && endAdornment
          ? "grid-cols-[auto_1fr_auto]"
          : startAdornment
            ? "grid-cols-[auto_1fr]"
            : "grid-cols-[1fr_auto]",
        size === "sm" ? "text-xs" : "text-sm",
        error && "border-error-500",
      ]}
    >
      {#if startAdornment}<div class="ig-cell">{@render text(startAdornment)}</div>{/if}
      <input
        bind:this={ref}
        {id}
        bind:value
        class="ig-input"
        {disabled}
        {required}
        aria-invalid={error || undefined}
        aria-describedby={helperText ? helperId : undefined}
        onkeydown={(event) => {
          event.stopPropagation();
          onkeydown?.(event);
        }}
        onclick={stop}
        onpaste={stop}
        oncopy={stop}
        oncut={stop}
        onfocus={(event) => event.currentTarget.select()}
        spellcheck={false}
        {...rest}
      />
      {#if endAdornment}<div class="ig-cell">{@render text(endAdornment)}</div>{/if}
    </div>
  {:else}
    <input
      bind:this={ref}
      {id}
      bind:value
      class={["ic-input-control input", size === "sm" ? "text-xs" : "text-sm", error && "border-error-500"]}
      {disabled}
      {required}
      aria-invalid={error || undefined}
      aria-describedby={helperText ? helperId : undefined}
      onkeydown={(event) => {
        event.stopPropagation();
        onkeydown?.(event);
      }}
      onclick={stop}
      onpaste={stop}
      oncopy={stop}
      oncut={stop}
      onfocus={(event) => event.currentTarget.select()}
      spellcheck={false}
      {...rest}
    />
  {/if}

  {#if helperText}
    <p id={helperId} class={["text-xs", error ? "text-error-500" : "opacity-60"]}>
      {@render text(helperText)}
    </p>
  {/if}
</div>
