<!--
  Port of upstream webapp/IronCalc/src/components/ToggleButton/ToggleButton.tsx:
  a group of ghost buttons where the selected ones are pressed, in a
  Skeleton `btn-group`. By default at most one option is selected (a
  `value` matching none leaves them all unpressed); with `multiple` each
  option toggles on its own and `value` is the array of selected ones.
  `onChange` receives the new value.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { ButtonSize } from "../Button/buttonClasses";

  export interface ToggleButtonOption<T extends string> {
    value: T;
    /** Text of the button. Omit it to get an icon-only button. */
    label?: Snippet | string;
    icon?: Snippet;
    /** Accessible name. Icon-only buttons fall back to `value`. */
    "aria-label"?: string;
    disabled?: boolean;
  }

  interface ToggleButtonBaseProperties<T extends string>
    extends Omit<HTMLAttributes<HTMLDivElement>, "onchange"> {
    options: ToggleButtonOption<T>[];
    size?: ButtonSize;
    fullWidth?: boolean;
    disabled?: boolean;
  }

  export type ToggleButtonProperties<T extends string> =
    ToggleButtonBaseProperties<T> &
      (
        | { multiple?: false; value: T; onChange: (value: T) => void }
        | { multiple: true; value: T[]; onChange: (values: T[]) => void }
      );
</script>

<script lang="ts" generics="T extends string">
  import Button from "../Button/Button.svelte";
  import IconButton from "../Button/IconButton.svelte";

  let props: ToggleButtonProperties<T> = $props();

  const selectedValues = $derived(
    props.multiple ? props.value : [props.value],
  );

  function toggle(optionValue: T): void {
    if (props.multiple) {
      const { value } = props;
      props.onChange(
        value.includes(optionValue)
          ? value.filter((selected) => selected !== optionValue)
          : [...value, optionValue],
      );
    } else {
      props.onChange(optionValue);
    }
  }

  const rest = $derived.by(() => {
    const {
      options: _options,
      value: _value,
      onChange: _onChange,
      multiple: _multiple,
      size: _size,
      fullWidth: _fullWidth,
      disabled: _disabled,
      class: _class,
      ...others
    } = props;
    return others;
  });
</script>

<div
  class={[
    "ic-toggle-button btn-group preset-outlined-surface-200-800 p-0.5",
    props.fullWidth && "ic-toggle-button--full-width flex w-full",
    props.class,
  ]}
  {...rest}
>
  {#each props.options as option (option.value)}
    {#if option.label === undefined}
      <IconButton
        aria-label={option["aria-label"] ?? option.value}
        size={props.size ?? "sm"}
        variant="ghost"
        pressed={selectedValues.includes(option.value)}
        disabled={props.disabled || option.disabled}
        class={props.fullWidth ? "flex-1" : undefined}
        onclick={() => toggle(option.value)}
      >
        {#snippet icon()}{@render option.icon?.()}{/snippet}
      </IconButton>
    {:else}
      <Button
        aria-label={option["aria-label"]}
        size={props.size ?? "sm"}
        variant="ghost"
        pressed={selectedValues.includes(option.value)}
        disabled={props.disabled || option.disabled}
        startIcon={option.icon}
        class={props.fullWidth ? "flex-1" : undefined}
        onclick={() => toggle(option.value)}
      >
        {#if typeof option.label === "string"}{option.label}{:else}{@render option.label()}{/if}
      </Button>
    {/if}
  {/each}
</div>
