<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/ColorScaleRule.tsx:
  a rule that colors the cells along a scale of two or three colors, from
  one of the presets or set stop by stop.
-->
<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import { untrack } from "svelte";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import Button from "../../Button/Button.svelte";
  import ApplyToField from "./ApplyToField.svelte";
  import {
    type ColorScaleRuleData,
    type ColorScaleStop,
    interpolateColor,
    PRESETS,
    sampleColorAt,
    steppedGradient,
  } from "./colorScale";
  import StopRow from "./StopRow.svelte";

  interface Props {
    onSave: (data: ColorScaleRuleData) => void;
    onCancel: () => void;
    applyTo: string;
    onApplyToChange: (value: string) => void;
    initialValues?: ColorScaleRuleData;
    onPreviewChange?: (colors: [string, string, string]) => void;
    getSelectedArea: () => string;
    currentTheme: IronCalcTheme;
  }

  let {
    onSave,
    onCancel,
    applyTo,
    onApplyToChange,
    initialValues,
    onPreviewChange,
    getSelectedArea,
    currentTheme,
  }: Props = $props();

  let selected = $state(PRESETS[0].id);
  // svelte-ignore state_referenced_locally
  let minimum: ColorScaleStop = $state(
    initialValues?.minimum ?? {
      type: "min",
      value: "",
      color: sampleColorAt(PRESETS[0].colors, 0),
    },
  );
  // svelte-ignore state_referenced_locally
  let midpoint: ColorScaleStop = $state(
    initialValues?.midpoint ?? {
      type: "percentile",
      value: "50",
      color: sampleColorAt(PRESETS[0].colors, 0.5),
    },
  );
  // svelte-ignore state_referenced_locally
  let maximum: ColorScaleStop = $state(
    initialValues?.maximum ?? {
      type: "max",
      value: "",
      color: sampleColorAt(PRESETS[0].colors, 1),
    },
  );

  function applyPreset(colors: string[]): void {
    const is2Stop = colors.length === 2;
    minimum = { ...minimum, color: sampleColorAt(colors, 0) };
    midpoint = {
      color: sampleColorAt(colors, 0.5),
      type: is2Stop ? "none" : midpoint.type === "none" ? "percentile" : midpoint.type,
      value: is2Stop ? "" : midpoint.type === "none" ? "50" : midpoint.value,
    };
    maximum = { ...maximum, color: sampleColorAt(colors, 1) };
  }

  $effect(() => {
    const minColor = resolveColorToHex(minimum.color, currentTheme);
    const maxColor = resolveColorToHex(maximum.color, currentTheme);
    const midColor =
      midpoint.type === "none"
        ? interpolateColor(minColor, maxColor, 0.5)
        : resolveColorToHex(midpoint.color, currentTheme);
    untrack(() => onPreviewChange?.([minColor, midColor, maxColor]));
  });

  const isStopValid = (stop: ColorScaleStop) =>
    stop.type === "min" ||
    stop.type === "max" ||
    stop.type === "none" ||
    stop.value.trim() !== "";

  const canSave = $derived(
    applyTo.trim() !== "" &&
      isStopValid(minimum) &&
      isStopValid(midpoint) &&
      isStopValid(maximum),
  );
</script>

<div class="ic-edit-rule-content">
  <ApplyToField {applyTo} {onApplyToChange} {getSelectedArea} />
  <div class="ic-edit-rule-section">
    <div class="ic-edit-rule-section-title">{t("conditional_formatting.tab_color_scale")}</div>
    <div class="ic-fsp-presets-section">
      <div class="ic-edit-rule-label">{t("conditional_formatting.default_styles")}</div>
      <div class="ic-fsp-presets">
        {#each PRESETS as preset (preset.id)}
          <button
            type="button"
            aria-pressed={selected === preset.id}
            aria-label={preset.id}
            class="ic-fsp-preset"
            style:background={steppedGradient(preset.colors)}
            onclick={() => {
              selected = preset.id;
              applyPreset(preset.colors);
            }}
          ></button>
        {/each}
      </div>
    </div>
  </div>
  <div class="ic-edit-rule-section">
    <div class="ic-edit-rule-section-title">
      {t("conditional_formatting.color_scale_settings")}
    </div>
    <StopRow
      label={t("conditional_formatting.color_scale_minimum")}
      stop={minimum}
      onChange={(stop) => (minimum = stop)}
      {getSelectedArea}
      type="min"
      {currentTheme}
    />
    <StopRow
      label={t("conditional_formatting.color_scale_midpoint")}
      stop={midpoint}
      onChange={(stop) => (midpoint = stop)}
      {getSelectedArea}
      type="midpoint"
      {currentTheme}
    />
    <StopRow
      label={t("conditional_formatting.color_scale_maximum")}
      stop={maximum}
      onChange={(stop) => (maximum = stop)}
      {getSelectedArea}
      type="max"
      {currentTheme}
    />
  </div>
</div>
<div class="ic-edit-rule-footer">
  <Button variant="secondary" onclick={onCancel}>{t("conditional_formatting.cancel")}</Button>
  <Button
    disabled={!canSave}
    onclick={() =>
      onSave({ minimum: $state.snapshot(minimum), midpoint: $state.snapshot(midpoint), maximum: $state.snapshot(maximum) })}
  >
    {#snippet startIcon()}<Check />{/snippet}
    {t("conditional_formatting.apply")}
  </Button>
</div>
