<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/DataBarsRule.tsx:
  a rule that draws a bar in each cell, solid or gradient, with its bounds,
  its positive and negative colors and whether the value stays shown.
-->
<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import { untrack } from "svelte";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import Button from "../../Button/Button.svelte";
  import Checkbox from "../../Checkbox/Checkbox.svelte";
  import ColorPicker from "../../ColorPicker/ColorPicker.svelte";
  import Input from "../../Input/Input.svelte";
  import Select from "../../Select/Select.svelte";
  import SwatchButton from "../SwatchButton.svelte";
  import ApplyToField from "./ApplyToField.svelte";
  import {
    BAR_WIDTHS,
    barBackground,
    COLORS,
    type DataBarBoundType,
    type DataBarsRuleData,
    VALUE_DISABLED_TYPES,
  } from "./dataBars";

  interface Props {
    onSave: (data: DataBarsRuleData) => void;
    onCancel: () => void;
    applyTo: string;
    onApplyToChange: (value: string) => void;
    getSelectedArea: () => string;
    currentTheme: IronCalcTheme;
    initialValues?: DataBarsRuleData;
    onPreviewChange?: (data: DataBarsRuleData) => void;
  }

  let {
    onSave,
    onCancel,
    applyTo,
    onApplyToChange,
    getSelectedArea,
    initialValues,
    onPreviewChange,
    currentTheme,
  }: Props = $props();

  let positiveOpen = $state(false);
  let negativeOpen = $state(false);
  let positiveButton: HTMLButtonElement | null = $state(null);
  let negativeButton: HTMLButtonElement | null = $state(null);
  // svelte-ignore state_referenced_locally
  let selected: DataBarsRuleData = $state(
    initialValues ?? {
      color: COLORS[0],
      gradient: false,
      positiveColor: "#6AAB42",
      negativeColor: "#E05C53",
      hideCellContent: false,
      minBound: { type: "automatic", value: "" },
      maxBound: { type: "automatic", value: "" },
    },
  );

  $effect(() => {
    const preview = $state.snapshot(selected) as DataBarsRuleData;
    untrack(() => onPreviewChange?.(preview));
  });

  const minTypeOptions = [
    { value: "automatic", label: t("conditional_formatting.data_bars_type_automatic") },
    { value: "min", label: t("conditional_formatting.color_scale_type_min") },
    { value: "number", label: t("conditional_formatting.color_scale_type_number") },
    { value: "percent", label: t("conditional_formatting.color_scale_type_percent") },
    { value: "percentile", label: t("conditional_formatting.color_scale_type_percentile") },
    { value: "formula", label: t("conditional_formatting.color_scale_type_formula") },
  ];

  const maxTypeOptions = [
    { value: "automatic", label: t("conditional_formatting.data_bars_type_automatic") },
    { value: "max", label: t("conditional_formatting.color_scale_type_max") },
    { value: "number", label: t("conditional_formatting.color_scale_type_number") },
    { value: "percent", label: t("conditional_formatting.color_scale_type_percent") },
    { value: "percentile", label: t("conditional_formatting.color_scale_type_percentile") },
    { value: "formula", label: t("conditional_formatting.color_scale_type_formula") },
  ];
</script>

{#snippet swatch(color: string, gradient: boolean)}
  <button
    type="button"
    onclick={() => {
      selected = { ...selected, color, gradient, positiveColor: color };
    }}
    aria-pressed={selected.color === color && selected.gradient === gradient}
    class="ic-fsp-preset ic-db-swatch"
    aria-label={color}
  >
    <div class="ic-db-swatch-inner">
      {#each BAR_WIDTHS as w (w)}
        <div class="ic-db-swatch-row">
          <div
            class="ic-db-swatch-bar"
            style:width={`${w * 100}%`}
            style:background={barBackground(color, gradient)}
          ></div>
        </div>
      {/each}
    </div>
  </button>
{/snippet}

<div class="ic-edit-rule-content">
  <ApplyToField {applyTo} {onApplyToChange} {getSelectedArea} />
  <div class="ic-edit-rule-section">
    <div class="ic-edit-rule-section-title">{t("conditional_formatting.tab_data_bars")}</div>
    <div class="ic-fsp-presets-section">
      <div class="ic-edit-rule-label">{t("conditional_formatting.data_bars_solid_fill")}</div>
      <div class="ic-fsp-presets">
        {#each COLORS as color (`solid-${color}`)}{@render swatch(color, false)}{/each}
      </div>
    </div>
    <div class="ic-fsp-presets-section">
      <div class="ic-edit-rule-label">
        {t("conditional_formatting.data_bars_gradient_fill")}
      </div>
      <div class="ic-fsp-presets">
        {#each COLORS as color (`gradient-${color}`)}{@render swatch(color, true)}{/each}
      </div>
    </div>
  </div>
  <div class="ic-edit-rule-section">
    <div class="ic-edit-rule-section-title">{t("conditional_formatting.data_bars_settings")}</div>
    <div class="ic-edit-rule-values-row">
      <div class="ic-edit-rule-field-wrapper">
        <span class="ic-edit-rule-label">{t("conditional_formatting.data_bars_minimum")}</span>
        <Select
          value={selected.minBound.type}
          options={minTypeOptions}
          onChange={(type) => {
            selected = {
              ...selected,
              minBound: { type: type as DataBarBoundType, value: "" },
            };
          }}
          hideCheck
        />
        <Input
          type="text"
          value={selected.minBound.value}
          disabled={VALUE_DISABLED_TYPES.includes(selected.minBound.type)}
          oninput={(event) => {
            selected = {
              ...selected,
              minBound: { ...selected.minBound, value: event.currentTarget.value },
            };
          }}
        />
      </div>
      <div class="ic-edit-rule-field-wrapper">
        <span class="ic-edit-rule-label">{t("conditional_formatting.data_bars_maximum")}</span>
        <Select
          value={selected.maxBound.type}
          options={maxTypeOptions}
          onChange={(type) => {
            selected = {
              ...selected,
              maxBound: { type: type as DataBarBoundType, value: "" },
            };
          }}
          hideCheck
        />
        <Input
          type="text"
          value={selected.maxBound.value}
          disabled={VALUE_DISABLED_TYPES.includes(selected.maxBound.type)}
          oninput={(event) => {
            selected = {
              ...selected,
              maxBound: { ...selected.maxBound, value: event.currentTarget.value },
            };
          }}
        />
      </div>
    </div>
    <div class="ic-edit-rule-values-row">
      <div class="ic-edit-rule-field-wrapper">
        <span class="ic-edit-rule-label">{t("conditional_formatting.data_bars_positive")}</span>
        <div class="ic-cs-settings-row">
          <Input
            type="text"
            value={resolveColorToHex(selected.positiveColor, currentTheme)}
            oninput={(event) => {
              selected = { ...selected, positiveColor: event.currentTarget.value };
            }}
          />
          <SwatchButton
            bind:ref={positiveButton}
            color={resolveColorToHex(selected.positiveColor, currentTheme)}
            aria-label={t("conditional_formatting.data_bars_positive")}
            onclick={() => (positiveOpen = true)}
          />
          <ColorPicker
            color={selected.positiveColor}
            defaultColor={resolveColorToHex(selected.positiveColor, currentTheme)}
            title={t("color_picker.default")}
            onChange={(c) => {
              selected = { ...selected, positiveColor: c };
              positiveOpen = false;
            }}
            onClose={() => (positiveOpen = false)}
            anchorEl={() => positiveButton}
            open={positiveOpen}
            theme={currentTheme}
          />
        </div>
      </div>
      <div class="ic-edit-rule-field-wrapper">
        <span class="ic-edit-rule-label">{t("conditional_formatting.data_bars_negative")}</span>
        <div class="ic-cs-settings-row">
          <Input
            type="text"
            value={resolveColorToHex(selected.negativeColor, currentTheme)}
            oninput={(event) => {
              selected = { ...selected, negativeColor: event.currentTarget.value };
            }}
          />
          <SwatchButton
            bind:ref={negativeButton}
            color={resolveColorToHex(selected.negativeColor, currentTheme)}
            aria-label={t("conditional_formatting.data_bars_negative")}
            onclick={() => (negativeOpen = true)}
          />
          <ColorPicker
            color={selected.negativeColor}
            defaultColor={resolveColorToHex(selected.negativeColor, currentTheme)}
            title={t("color_picker.default")}
            onChange={(c) => {
              selected = { ...selected, negativeColor: c };
              negativeOpen = false;
            }}
            onClose={() => (negativeOpen = false)}
            anchorEl={() => negativeButton}
            open={negativeOpen}
            theme={currentTheme}
          />
        </div>
      </div>
    </div>
    <div class="ic-fsp-presets-section">
      <div class="ic-edit-rule-label">{t("conditional_formatting.data_bars_preferences")}</div>
      <Checkbox
        checked={!selected.hideCellContent}
        onChange={(checked) => {
          selected = { ...selected, hideCellContent: !checked };
        }}
        label={t("conditional_formatting.data_bars_show_value")}
      />
    </div>
  </div>
</div>
<div class="ic-edit-rule-footer">
  <Button variant="secondary" onclick={onCancel}>{t("conditional_formatting.cancel")}</Button>
  <Button
    disabled={!applyTo.trim()}
    onclick={() => onSave($state.snapshot(selected) as DataBarsRuleData)}
  >
    {#snippet startIcon()}<Check />{/snippet}
    {t("conditional_formatting.apply")}
  </Button>
</div>

<style>
  /* The data bar swatches of upstream ConditionalFormatting/edit-rule.css */
  .ic-db-swatch.ic-fsp-preset {
    height: 32px;
    padding: 2px;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    gap: 0;
    background-color: var(--palette-common-white);
  }

  .ic-db-swatch-inner {
    height: 100%;
    border-radius: 2px;
    border: 1px solid var(--palette-grey-200);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .ic-db-swatch-row {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .ic-db-swatch-row + .ic-db-swatch-row {
    border-top: 1px solid var(--palette-grey-200);
  }

  .ic-db-swatch-bar {
    height: 100%;
  }
</style>
