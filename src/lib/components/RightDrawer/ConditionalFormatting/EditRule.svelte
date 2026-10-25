<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/EditRule.tsx:
  the rule editor, a preview over four tabs (classic, color scale, data
  bars, icon sets), each its kind of rule. The range it applies to and the
  classic format are kept across tabs.

  The rules of upstream's edit-rule.css that the four editors share are
  here, scoped to the editor.
-->
<script lang="ts" module>
  type TabId = "classic" | "color_scale" | "data_bars" | "icon_sets";
</script>

<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import Button from "../../Button/Button.svelte";
  import ClassicRule from "./ClassicRule.svelte";
  import { steppedGradient } from "./colorScale";
  import ColorScaleRule from "./ColorScaleRule.svelte";
  import DataBarMiniChart from "./DataBarMiniChart.svelte";
  import type { DataBarsRuleData } from "./dataBars";
  import DataBarsRule from "./DataBarsRule.svelte";
  import type { FormatStyle } from "./formatStyle";
  import type { IconPreviewInfo } from "./iconSets";
  import IconSetsRule from "./IconSetsRule.svelte";
  import { DEFAULT_FORMAT_STYLE, type RuleData } from "./ruleData";

  interface Props {
    onSave: (data: RuleData) => void;
    onCancel: () => void;
    initialValues?: RuleData;
    getSelectedArea: () => string;
    resolveValue?: (value: string) => string;
    currentTheme: IronCalcTheme;
  }

  let { onSave, onCancel, initialValues, getSelectedArea, resolveValue, currentTheme }: Props =
    $props();

  // svelte-ignore state_referenced_locally
  const initialTab: TabId =
    initialValues?.ruleType === "color_scale"
      ? "color_scale"
      : initialValues?.ruleType === "data_bars"
        ? "data_bars"
        : initialValues?.ruleType === "icon_sets"
          ? "icon_sets"
          : "classic";
  let activeTab: TabId = $state(initialTab);
  // svelte-ignore state_referenced_locally
  let applyTo = $state(initialValues?.applyTo ?? "");
  // svelte-ignore state_referenced_locally
  let formatStyle: FormatStyle = $state(initialValues?.formatStyle ?? DEFAULT_FORMAT_STYLE);
  let classicDescription = $state("");
  // svelte-ignore state_referenced_locally
  let dbPreview: DataBarsRuleData = $state(
    initialValues?.dataBars ?? {
      color: "#6AAB42",
      gradient: false,
      positiveColor: "#6AAB42",
      negativeColor: "#E05C53",
      hideCellContent: false,
      minBound: { type: "automatic", value: "" },
      maxBound: { type: "automatic", value: "" },
    },
  );
  let isPreview: IconPreviewInfo | null = $state(null);
  // svelte-ignore state_referenced_locally
  let csPreviewColors: [string, string, string] = $state(
    initialValues?.colorScale
      ? [
          resolveColorToHex(initialValues.colorScale.minimum.color, currentTheme),
          resolveColorToHex(initialValues.colorScale.midpoint.color, currentTheme),
          resolveColorToHex(initialValues.colorScale.maximum.color, currentTheme),
        ]
      : ["#8CB354", "#F8CD3D", "#EC5753"],
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: "classic", label: t("conditional_formatting.tab_classic") },
    { id: "color_scale", label: t("conditional_formatting.tab_color_scale") },
    { id: "data_bars", label: t("conditional_formatting.tab_data_bars") },
    { id: "icon_sets", label: t("conditional_formatting.tab_icon_sets") },
  ];

  const classicPreviewStyle = $derived(
    [
      `font-weight: ${formatStyle.bold ? "bold" : "normal"}`,
      `font-style: ${formatStyle.italic ? "italic" : "normal"}`,
      `text-decoration: ${
        [formatStyle.underline ? "underline" : "", formatStyle.strike ? "line-through" : ""]
          .filter(Boolean)
          .join(" ") || "none"
      }`,
      `color: ${
        resolveColorToHex(formatStyle.fontColor, currentTheme) ||
        "var(--palette-sheet-default-text-color)"
      }`,
      `background-color: ${resolveColorToHex(formatStyle.fillColor, currentTheme) || "transparent"}`,
    ].join("; "),
  );

  const headerPreviewStyle = $derived(
    activeTab === "color_scale"
      ? `background: ${steppedGradient(csPreviewColors)}`
      : activeTab === "data_bars"
        ? "position: relative"
        : activeTab === "icon_sets"
          ? "background: var(--palette-common-white)"
          : classicPreviewStyle,
  );
</script>

<div class="ic-edit-rule-container">
  <div class="ic-edit-rule-header-box">
    <div class="ic-edit-rule-header-preview" style={headerPreviewStyle}>
      {#if activeTab === "data_bars"}
        <DataBarMiniChart color={dbPreview.color} gradient={dbPreview.gradient} />
      {:else if activeTab === "icon_sets" && isPreview}
        <isPreview.Icon
          size={18}
          color={isPreview.color}
          fill={isPreview.filled ? isPreview.color : "none"}
        />
      {:else if activeTab !== "color_scale"}
        Aa
      {/if}
    </div>
    <span class="ic-edit-rule-header-box-text">
      {activeTab === "classic" && classicDescription
        ? classicDescription
        : tabs.find((tab) => tab.id === activeTab)?.label}
    </span>
  </div>
  <div class="ic-edit-rule-tabs">
    {#each tabs as { id, label } (id)}
      <Button
        variant="ghost"
        size="sm"
        class={["ic-edit-rule-tab", activeTab === id && "ic-edit-rule-tab--active"].filter(Boolean).join(" ")}
        onclick={() => (activeTab = id)}
      >
        {label}
      </Button>
    {/each}
  </div>
  {#if activeTab === "classic"}
    <ClassicRule
      {onSave}
      {onCancel}
      {initialValues}
      {getSelectedArea}
      {applyTo}
      onApplyToChange={(value) => (applyTo = value)}
      {formatStyle}
      onFormatStyleChange={(style) => (formatStyle = style)}
      onDescriptionChange={(description) => (classicDescription = description)}
      {resolveValue}
      {currentTheme}
    />
  {:else if activeTab === "color_scale"}
    <ColorScaleRule
      onSave={(colorScale) =>
        onSave({
          applyTo,
          ruleType: "color_scale",
          ruleOperator: "",
          ruleValue: "",
          ruleValue2: "",
          formatStyle: DEFAULT_FORMAT_STYLE,
          colorScale,
        })}
      {onCancel}
      {applyTo}
      onApplyToChange={(value) => (applyTo = value)}
      initialValues={initialValues?.colorScale}
      onPreviewChange={(colors) => (csPreviewColors = colors)}
      {getSelectedArea}
      {currentTheme}
    />
  {:else if activeTab === "data_bars"}
    <DataBarsRule
      onSave={(dataBars) =>
        onSave({
          applyTo,
          ruleType: "data_bars",
          ruleOperator: "",
          ruleValue: "",
          ruleValue2: "",
          formatStyle: DEFAULT_FORMAT_STYLE,
          dataBars,
        })}
      {onCancel}
      {applyTo}
      onApplyToChange={(value) => (applyTo = value)}
      {getSelectedArea}
      initialValues={initialValues?.dataBars}
      onPreviewChange={(data) => (dbPreview = data)}
      {currentTheme}
    />
  {:else}
    <IconSetsRule
      onSave={(iconSets) =>
        onSave({
          applyTo,
          ruleType: "icon_sets",
          ruleOperator: "",
          ruleValue: "",
          ruleValue2: "",
          formatStyle: DEFAULT_FORMAT_STYLE,
          iconSets,
        })}
      {applyTo}
      onApplyToChange={(value) => (applyTo = value)}
      {getSelectedArea}
      initialValues={initialValues?.iconSets}
      {onCancel}
      onPreviewChange={(icon) => (isPreview = icon)}
      {currentTheme}
    />
  {/if}
</div>

<style>
  /* Port of upstream ConditionalFormatting/edit-rule.css and the presets'
     rules of format-style-picker.css, shared by the four editors; the data
     bar and icon set swatches are their editors' */
  .ic-edit-rule-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overscroll-behavior: contain;
    isolation: isolate;
  }

  .ic-edit-rule-container :global(.ic-edit-rule-content) {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    flex: 1 0 auto;
  }

  .ic-edit-rule-header-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 12px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--palette-grey-300);
    font-size: 14px;
    font-weight: 600;
    font-family: var(--typography-font-family);
    color: var(--palette-common-black);
    text-align: center;
  }

  .ic-edit-rule-header-preview {
    width: 40px;
    height: 32px;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-family: var(--typography-font-family);
    font-weight: 600;
  }

  .ic-edit-rule-header-box-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ic-edit-rule-tabs {
    display: flex;
    flex-direction: row;
    height: 44px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--palette-grey-300);
    position: sticky;
    top: 0;
    background: var(--palette-common-white);
    z-index: 1;
  }

  .ic-edit-rule-tabs :global(.ic-edit-rule-tab) {
    flex: 1;
    height: 100%;
    border-radius: 0;
    font-size: 12px;
    font-weight: 400;
    color: var(--palette-grey-600);
    background: transparent;
    border-bottom: 2px solid transparent;
    padding: 0 4px;
    line-height: 120%;
  }

  .ic-edit-rule-tabs :global(.ic-edit-rule-tab:hover) {
    background: transparent;
    color: var(--palette-common-black);
  }

  .ic-edit-rule-tabs :global(.ic-edit-rule-tab--active) {
    font-weight: 600;
    color: var(--palette-common-black);
    border-bottom: 2px solid var(--palette-primary-main);
  }

  .ic-edit-rule-container :global(.ic-cs-settings-row) {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ic-edit-rule-container :global(.ic-cs-settings-row > *) {
    flex: 1;
    min-width: 0;
  }

  .ic-edit-rule-container :global(.ic-cs-settings-row > .ic-swatch-wrapper) {
    flex: none;
  }

  .ic-edit-rule-container :global(.ic-edit-rule-section) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 12px;
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-edit-rule-container :global(.ic-edit-rule-section:last-child) {
    border-bottom: none;
  }

  .ic-edit-rule-container :global(.ic-edit-rule-section-title) {
    font-size: 14px;
    font-weight: 600;
    font-family: var(--typography-font-family);
    margin: 0;
    color: var(--palette-common-black);
  }

  .ic-edit-rule-container :global(.ic-edit-rule-field-wrapper),
  .ic-edit-rule-container :global(.ic-edit-rule-condition) {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ic-edit-rule-container :global(.ic-edit-rule-label) {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    font-weight: 500;
    color: var(--palette-common-black);
  }

  .ic-edit-rule-container :global(.ic-edit-rule-values-row),
  .ic-edit-rule-container :global(.ic-edit-rule-dropdowns-row) {
    display: flex;
    flex-direction: row;
    gap: 6px;
  }

  .ic-edit-rule-container :global(.ic-edit-rule-dropdowns-row) {
    margin-bottom: 2px;
  }

  .ic-edit-rule-container :global(.ic-edit-rule-values-row > *),
  .ic-edit-rule-container :global(.ic-edit-rule-dropdowns-row > *) {
    flex: 1;
    min-width: 0;
  }

  .ic-edit-rule-container :global(.ic-edit-rule-range-button) {
    margin-right: -2px;
    border-radius: 3px;
  }

  .ic-edit-rule-container :global(.ic-fsp-presets-section) {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ic-edit-rule-container :global(.ic-fsp-presets) {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }

  .ic-edit-rule-container :global(.ic-fsp-preset) {
    height: 32px;
    border-radius: 4px;
    border: none;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
    cursor: pointer;
    font-size: 12px;
    font-family: var(--typography-font-family);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      box-shadow 0.15s ease,
      transform 0.1s ease;
  }

  .ic-edit-rule-container :global(.ic-fsp-preset:hover) {
    outline: 1px solid var(--palette-common-black);
    outline-offset: 1px;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 40%, transparent);
  }

  .ic-edit-rule-container :global(.ic-fsp-preset[aria-pressed="true"]) {
    outline: 1px solid var(--palette-common-black);
    outline-offset: 1px;
  }

  .ic-edit-rule-container :global(.ic-fsp-preset:active) {
    transform: scale(0.95);
  }

  .ic-edit-rule-container :global(.ic-edit-rule-footer) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    flex-shrink: 0;
    border-top: 1px solid var(--palette-grey-300);
    position: sticky;
    bottom: 0;
    background: var(--palette-common-white);
  }
</style>
