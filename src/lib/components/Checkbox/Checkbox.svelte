<!--
  Port of upstream webapp/IronCalc/src/components/Checkbox/Checkbox.tsx: a
  checkbox with an optional label on its right, styled with Skeleton's
  `checkbox` class. `onChange` receives the new checked value.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  export interface CheckboxProperties
    extends Omit<HTMLInputAttributes, "type" | "onchange" | "size" | "checked"> {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: Snippet | string;
  }
</script>

<script lang="ts">
  let {
    checked,
    onChange,
    label,
    disabled = false,
    id: idProperty,
    class: className,
    ...rest
  }: CheckboxProperties = $props();

  const autoId = $props.id();
  const id = $derived(idProperty ?? autoId);
</script>

<label
  class={["ic-checkbox flex items-center gap-2", disabled && "disabled opacity-50", className]}
  for={id}
>
  <input
    {id}
    type="checkbox"
    class="checkbox"
    {checked}
    {disabled}
    onchange={(event) => onChange(event.currentTarget.checked)}
    {...rest}
  />
  {#if label}
    <span class="ic-checkbox-label text-sm">
      {#if typeof label === "string"}{label}{:else}{@render label()}{/if}
    </span>
  {/if}
</label>
