<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/IconSetsRule.tsx:
  a rule that puts an icon in each cell, from a preset icon set (each
  bucket with its threshold, icon and color) or as a rating (stars, hearts
  or any icon repeated, in one color), and whether the value stays shown.
-->
<script lang="ts" module>
  import type { IconSetPreset } from "./iconSets";

  type Mode = "preset" | "rating";
</script>

<script lang="ts">
  import type { Color, IronCalcTheme } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import { untrack } from "svelte";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import Button from "../../Button/Button.svelte";
  import Checkbox from "../../Checkbox/Checkbox.svelte";
  import ColorPicker from "../../ColorPicker/ColorPicker.svelte";
  import IconPicker from "../../IconPicker/IconPicker.svelte";
  import { iconSpecFor } from "../../IconPicker/iconSpec";
  import Input from "../../Input/Input.svelte";
  import Select from "../../Select/Select.svelte";
  import ToggleButton from "../../ToggleButton/ToggleButton.svelte";
  import SwatchButton from "../SwatchButton.svelte";
  import ApplyToField from "./ApplyToField.svelte";
  import {
    ALL_PRESETS,
    DEFAULT_RATING_COLOR,
    defaultRatingThresholds,
    defaultThresholds,
    INDICATORS,
    type IconPreviewInfo,
    type IconSetsRuleData,
    type IconThreshold,
    RATINGS,
    THRESHOLD_TYPE_OPTIONS,
    type ThresholdType,
  } from "./iconSets";

  interface Props {
    onSave: (data: IconSetsRuleData) => void;
    onCancel: () => void;
    applyTo: string;
    onApplyToChange: (value: string) => void;
    getSelectedArea: () => string;
    initialValues?: IconSetsRuleData;
    onPreviewChange?: (icon: IconPreviewInfo) => void;
    currentTheme: IronCalcTheme;
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

  // svelte-ignore state_referenced_locally
  const initialMode: Mode = initialValues?.rating ? "rating" : "preset";
  let mode: Mode = $state(initialMode);
  // svelte-ignore state_referenced_locally
  let selected = $state(initialValues?.presetId ?? INDICATORS[0].id);
  // svelte-ignore state_referenced_locally
  let ratingCount: 3 | 4 | 5 = $state(initialValues?.rating?.count ?? 3);
  // svelte-ignore state_referenced_locally
  let ratingColor: Color = $state(initialValues?.rating?.color ?? DEFAULT_RATING_COLOR);
  // svelte-ignore state_referenced_locally
  let ratingIcon = $state(initialValues?.rating?.icon ?? "Star");
  let ratingColorOpen = $state(false);
  let ratingColorButton: HTMLButtonElement | null = $state(null);

  // svelte-ignore state_referenced_locally
  let thresholds: IconThreshold[] = $state(
    initialValues?.thresholds ??
      (initialMode === "rating"
        ? defaultRatingThresholds(
            initialValues?.rating?.count ?? 3,
            initialValues?.rating?.color ?? DEFAULT_RATING_COLOR,
            initialValues?.rating?.icon ?? "Star",
          )
        : defaultThresholds(INDICATORS[0].icons)),
  );
  // svelte-ignore state_referenced_locally
  let showValue = $state(initialValues?.showValue ?? true);
  const colorButtons: (HTMLButtonElement | null)[] = $state([]);
  let colorOpenIndex: number | null = $state(null);

  const selectedPreset = $derived(ALL_PRESETS.find((p) => p.id === selected) ?? INDICATORS[0]);

  $effect(() => {
    let preview: IconPreviewInfo;
    if (mode === "preset") {
      preview = selectedPreset.icons[0];
    } else {
      const spec = iconSpecFor(ratingIcon);
      preview = {
        Icon: spec.Icon,
        color: resolveColorToHex(ratingColor, currentTheme),
        filled: spec.filled,
      };
    }
    untrack(() => onPreviewChange?.(preview));
  });

  const typeOptions = THRESHOLD_TYPE_OPTIONS.map((v) => ({
    value: v,
    label: t(`conditional_formatting.color_scale_type_${v}`),
  }));

  function handlePresetSelect(preset: IconSetPreset): void {
    mode = "preset";
    selected = preset.id;
    thresholds = defaultThresholds(preset.icons);
  }

  function handleRatingPresetSelect(preset: IconSetPreset): void {
    const count = preset.icons.length as 3 | 4 | 5;
    const color = preset.icons[0].color;
    const iconName = preset.icons[0].backendName;
    mode = "rating";
    ratingCount = count;
    ratingColor = color;
    ratingIcon = iconName;
    thresholds = defaultRatingThresholds(count, color, iconName);
  }

  function handleRatingColorChange(color: Color): void {
    ratingColor = color;
    thresholds = thresholds.map((th) => ({ ...th, color }));
    ratingColorOpen = false;
  }

  function updateThreshold(i: number, patch: Partial<IconThreshold>): void {
    thresholds = thresholds.map((th, idx) => (idx === i ? { ...th, ...patch } : th));
  }

  const activeIconCount = $derived(mode === "rating" ? ratingCount : selectedPreset.icons.length);

  function getLabel(i: number): string {
    if (i === activeIconCount - 1) {
      return t("conditional_formatting.icon_sets_else");
    }
    return t("conditional_formatting.icon_sets_when_value_is");
  }

  const groups = [2, 3, 4, 5].map((count) => ({
    key: `count-${count}`,
    label: `${count} ${t("conditional_formatting.icon_sets_icons")}`,
    presets: ALL_PRESETS.filter((p) => p.icons.length === count),
  }));

  const ratingGroups = [3, 4, 5]
    .map((count) => ({
      count,
      presets: RATINGS.filter((p) => p.icons.length === count),
    }))
    .filter((group) => group.presets.length > 0);

  // The first row has no maximum, the last (the "else" bucket) no minimum,
  // the others neither
  function optionsFor(i: number, isLast: boolean) {
    if (i === 0) {
      return typeOptions.filter((o) => o.value !== "max");
    }
    if (isLast) {
      // Although technically it doesn't matter since it is disabled
      return typeOptions.filter((o) => o.value !== "min");
    }
    return typeOptions.filter((o) => o.value !== "min" && o.value !== "max");
  }

  function handleSave(): void {
    onSave({
      presetId: selected,
      rating:
        mode === "rating"
          ? { count: ratingCount, icon: ratingIcon, color: ratingColor }
          : undefined,
      thresholds: $state.snapshot(thresholds) as IconThreshold[],
      showValue,
    });
  }
</script>

{#snippet greaterOrEqualIcon()}<span class="ic-is-op-text">{"≥"}</span>{/snippet}
{#snippet greaterIcon()}<span class="ic-is-op-text">{">"}</span>{/snippet}

{#snippet iconSetSwatch(preset: IconSetPreset, isSelected: boolean, onclick: () => void)}
  {@const size = preset.icons.length >= 5 ? 12 : 14}
  <button
    type="button"
    {onclick}
    aria-pressed={isSelected}
    class="ic-fsp-preset ic-is-swatch"
    aria-label={preset.id}
  >
    <div class="ic-is-swatch-icons">
      {#each preset.icons as { Icon, color, filled, style }, i (color + String(i))}
        <Icon {size} {color} fill={filled ? color : "none"} {style} />
      {/each}
    </div>
  </button>
{/snippet}

{#snippet operatorToggle(threshold: IconThreshold, i: number)}
  <ToggleButton
    size="md"
    options={[
      { value: ">=", icon: greaterOrEqualIcon, "aria-label": "Greater than or equal" },
      { value: ">", icon: greaterIcon, "aria-label": "Greater than" },
    ]}
    value={threshold.operator}
    onChange={(operator: ">=" | ">") => updateThreshold(i, { operator })}
  />
{/snippet}

<div class="ic-edit-rule-content">
  <ApplyToField {applyTo} {onApplyToChange} {getSelectedArea} />
  <div class="ic-edit-rule-section">
    <ToggleButton
      fullWidth
      size="md"
      value={mode}
      onChange={(value: Mode) => (mode = value)}
      options={[
        { value: "preset", label: t("conditional_formatting.icon_sets_mode_preset") },
        { value: "rating", label: t("conditional_formatting.icon_sets_ratings") },
      ]}
    />
    {#if mode === "preset"}
      {#each groups as group (group.key)}
        <div class="ic-fsp-presets-section">
          <div class="ic-edit-rule-label">{group.label}</div>
          <div class="ic-is-presets">
            {#each group.presets as preset (preset.id)}
              {@render iconSetSwatch(preset, selected === preset.id, () =>
                handlePresetSelect(preset),
              )}
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      {#each ratingGroups as group (group.count)}
        <div class="ic-fsp-presets-section">
          <div class="ic-edit-rule-label">
            {`${group.count} ${t("conditional_formatting.icon_sets_icons")}`}
          </div>
          <div class="ic-is-presets">
            {#each group.presets as preset (preset.id)}
              {@render iconSetSwatch(
                preset,
                ratingCount === preset.icons.length && ratingColor === preset.icons[0].color,
                () => handleRatingPresetSelect(preset),
              )}
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>
  <div class="ic-edit-rule-section">
    <div class="ic-edit-rule-section-title">{t("conditional_formatting.icon_sets_settings")}</div>
    {#if mode === "preset"}
      <div class="ic-is-threshold-rows">
        {#each thresholds as threshold, i (selectedPreset.id + String(i))}
          {@const isLast = i === thresholds.length - 1}
          <div class="ic-is-threshold-row">
            <div class="ic-edit-rule-label">{getLabel(i)}</div>
            <div class="ic-is-threshold-controls">
              {@render operatorToggle(threshold, i)}
              <div class="ic-is-threshold-value-wrap">
                <Input
                  type="text"
                  value={isLast ? "" : threshold.value}
                  oninput={(event) => updateThreshold(i, { value: event.currentTarget.value })}
                  disabled={isLast}
                />
              </div>
              <div class="ic-is-threshold-type-wrap">
                <Select
                  value={threshold.type}
                  options={optionsFor(i, isLast)}
                  onChange={(v) => updateThreshold(i, { type: v as ThresholdType })}
                  hideCheck
                  disabled={isLast}
                />
              </div>
              <div class="input ic-is-picker-wrapper">
                <IconPicker
                  value={threshold.iconName}
                  color={resolveColorToHex(threshold.color, currentTheme)}
                  onChange={(name) => updateThreshold(i, { iconName: name })}
                />
              </div>
              <SwatchButton
                bind:ref={() => colorButtons[i] ?? null, (element) => (colorButtons[i] = element)}
                color={resolveColorToHex(threshold.color, currentTheme)}
                aria-label={t("color_picker.title")}
                onclick={() => (colorOpenIndex = i)}
              />
              <ColorPicker
                color={threshold.color}
                defaultColor={resolveColorToHex(threshold.color, currentTheme)}
                title={t("color_picker.default")}
                onChange={(c) => {
                  updateThreshold(i, { color: c });
                  colorOpenIndex = null;
                }}
                onClose={() => (colorOpenIndex = null)}
                anchorEl={() => colorButtons[i] ?? null}
                open={colorOpenIndex === i}
                theme={currentTheme}
              />
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="ic-is-threshold-rows">
        {#each thresholds as threshold, i (`rating${String(i)}`)}
          {#if i !== thresholds.length - 1}
            <div class="ic-is-threshold-row">
              <div class="ic-edit-rule-label">{getLabel(i)}</div>
              <div class="ic-is-threshold-controls">
                {@render operatorToggle(threshold, i)}
                <div class="ic-is-threshold-value-wrap">
                  <Input
                    type="text"
                    value={threshold.value}
                    oninput={(event) => updateThreshold(i, { value: event.currentTarget.value })}
                  />
                </div>
                <div class="ic-is-threshold-type-wrap">
                  <Select
                    value={threshold.type}
                    options={optionsFor(i, false)}
                    onChange={(v) => updateThreshold(i, { type: v as ThresholdType })}
                    hideCheck
                  />
                </div>
                <div class={["input ic-is-picker-wrapper", i !== 0 && "ic-is-picker-disabled"]}>
                  <IconPicker
                    value={ratingIcon}
                    color={resolveColorToHex(ratingColor, currentTheme)}
                    onChange={(name) => (ratingIcon = name)}
                  />
                </div>
                {#if i === 0}
                  <SwatchButton
                    bind:ref={ratingColorButton}
                    color={resolveColorToHex(ratingColor, currentTheme)}
                    aria-label={t("color_picker.title")}
                    onclick={() => (ratingColorOpen = true)}
                  />
                  <ColorPicker
                    color={ratingColor}
                    defaultColor={resolveColorToHex(ratingColor, currentTheme)}
                    title={t("color_picker.default")}
                    onChange={handleRatingColorChange}
                    onClose={() => (ratingColorOpen = false)}
                    anchorEl={() => ratingColorButton}
                    open={ratingColorOpen}
                    theme={currentTheme}
                  />
                {:else}
                  <SwatchButton
                    color={resolveColorToHex(ratingColor, currentTheme)}
                    aria-label={t("color_picker.title")}
                    disabled
                  />
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
    <div class="ic-fsp-presets-section">
      <div class="ic-edit-rule-label">{t("conditional_formatting.data_bars_preferences")}</div>
      <Checkbox
        checked={showValue}
        onChange={(checked) => (showValue = checked)}
        label={t("conditional_formatting.icon_sets_show_value")}
      />
    </div>
  </div>
</div>
<div class="ic-edit-rule-footer">
  <Button variant="secondary" onclick={onCancel}>{t("conditional_formatting.cancel")}</Button>
  <Button disabled={!applyTo.trim()} onclick={handleSave}>
    {#snippet startIcon()}<Check />{/snippet}
    {t("conditional_formatting.apply")}
  </Button>
</div>

<style>
  /* The icon set rules of upstream ConditionalFormatting/edit-rule.css */
  .ic-is-presets {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .ic-is-swatch.ic-fsp-preset {
    height: 32px;
    padding: 4px 6px;
    background-color: var(--palette-common-white);
    border-radius: 4px;
    min-width: 0;
  }

  .ic-is-swatch-icons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    overflow: hidden;
    height: 100%;
  }

  .ic-is-picker-wrapper {
    flex: none;
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    padding: 2px;
    display: flex;
  }

  .ic-is-picker-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ic-is-picker-disabled > :global(*) {
    pointer-events: none;
  }

  .ic-is-op-text {
    font-size: 14px;
    font-family: var(--typography-font-family);
    line-height: 1;
  }

  .ic-is-threshold-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ic-is-threshold-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ic-is-threshold-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ic-is-threshold-value-wrap {
    flex: 1;
    min-width: 0;
  }

  .ic-is-threshold-type-wrap {
    flex: 1.5;
    min-width: 0;
  }
</style>
