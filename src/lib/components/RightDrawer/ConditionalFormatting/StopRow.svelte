<!--
  Port of the StopRow of upstream
  webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/ColorScaleRule.tsx:
  one stop of a color scale (minimum, midpoint or maximum), its type, its
  value when the type takes one, and its color.
-->
<script lang="ts" module>
  import {
    type StopType,
    MAX_TYPE_OPTIONS,
    MIDPOINT_TYPE_OPTIONS,
    MIN_TYPE_OPTIONS,
    TYPE_OPTIONS,
  } from "./colorScale";

  type StopRowType = "default" | "min" | "midpoint" | "max";

  function getOptionsFromType(type: StopRowType): readonly StopType[] {
    switch (type) {
      case "min":
        return MIN_TYPE_OPTIONS;
      case "midpoint":
        return MIDPOINT_TYPE_OPTIONS;
      case "max":
        return MAX_TYPE_OPTIONS;
      default:
        return TYPE_OPTIONS;
    }
  }
</script>

<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import ColorPicker from "../../ColorPicker/ColorPicker.svelte";
  import Input from "../../Input/Input.svelte";
  import Select from "../../Select/Select.svelte";
  import SwatchButton from "../SwatchButton.svelte";
  import type { ColorScaleStop } from "./colorScale";
  import UseSelectionButton from "./UseSelectionButton.svelte";

  interface Props {
    label: string;
    stop: ColorScaleStop;
    onChange: (stop: ColorScaleStop) => void;
    getSelectedArea: () => string;
    type: StopRowType;
    currentTheme: IronCalcTheme;
  }

  let { label, stop, onChange, getSelectedArea, type, currentTheme }: Props = $props();

  let colorOpen = $state(false);
  let colorButton: HTMLButtonElement | null = $state(null);

  const typeOptions = $derived(
    getOptionsFromType(type).map((v) => ({
      value: v,
      label: t(`conditional_formatting.color_scale_type_${v}`),
    })),
  );

  const isNone = $derived(stop.type === "none");
</script>

<div class="ic-edit-rule-field-wrapper">
  <span class="ic-edit-rule-label">{label}</span>
  <div class="ic-cs-settings-row">
    <Select
      value={stop.type}
      options={typeOptions}
      onChange={(v) => onChange({ ...stop, type: v as StopType })}
      hideCheck
    />
    {#if !isNone && stop.type !== "min" && stop.type !== "max"}
      <Input
        type="text"
        value={stop.value}
        oninput={(event) => onChange({ ...stop, value: event.currentTarget.value })}
      >
        {#snippet endAdornment()}
          <UseSelectionButton onclick={() => onChange({ ...stop, value: getSelectedArea() })} />
        {/snippet}
      </Input>
    {/if}
    {#if !isNone}
      <SwatchButton
        bind:ref={colorButton}
        color={resolveColorToHex(stop.color, currentTheme)}
        aria-label={label}
        onclick={() => (colorOpen = true)}
      />
      <ColorPicker
        color={stop.color}
        defaultColor={resolveColorToHex(stop.color, currentTheme)}
        title={t("color_picker.default")}
        onChange={(c) => {
          onChange({ ...stop, color: c });
          colorOpen = false;
        }}
        onClose={() => (colorOpen = false)}
        anchorEl={() => colorButton}
        open={colorOpen}
        theme={currentTheme}
      />
    {/if}
  </div>
</div>
